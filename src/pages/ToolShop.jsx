import { useMemo, useState, useEffect } from 'react';
import {
  TOOLS,
  TOOL_RARITY,
  CIDADES,
  getToolsPorLocal,
  precoEmCents,
  formatPreco,
  formatCoins,
} from '../game/tools.js';
import { getGemaById, NIVEIS_POLIMENTO } from '../game/gems.js';
import { EQUIPMENT } from '../game/data.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES } from '../config.js';
import { api } from '../api.js';

const ICONE_TRACKER = { peso: '🏋️', espacos: '🎒', usos: '🔧' };
const RARITY_ORDER = { comum: 0, incomum: 1, rara: 2, epica: 3, lendaria: 4 };

function rotuloRaridade(r) {
  return { comum: 'Comum', incomum: 'Incomum', rara: 'Rara', epica: 'Épica', lendaria: 'Lendária' }[r] || r;
}

// Catálogo plano da loja de equipamentos. Preços em cobre (ℛ).
const EQUIPAMENTOS = [
  ...Object.entries(EQUIPMENT.armas).map(([id, it]) => ({
    id,
    ...it,
    grupo: it.categoria || 'perto',
  })),
  ...Object.entries(EQUIPMENT.armaduras).map(([id, it]) => ({
    id,
    ...it,
    grupo: 'armaduras',
  })),
  ...Object.entries(EQUIPMENT.acessorios || {}).map(([id, it]) => ({
    id,
    ...it,
    grupo: 'acessorios',
  })),
];

const EQUIP_CATEGORIAS = [
  { id: 'todos', nome: 'Todos', icone: '✨' },
  { id: 'perto', nome: 'Corpo a corpo', icone: '⚔️' },
  { id: 'distancia', nome: 'À distância', icone: '🏹' },
  { id: 'utilitaria', nome: 'Utilitárias', icone: '🧰' },
  { id: 'armaduras', nome: 'Armaduras', icone: '🛡️' },
  { id: 'acessorios', nome: 'Acessórios', icone: '💍' },
];

function raridadePorPreco(preco) {
  if (preco >= 3000) return 'lendaria';
  if (preco >= 1500) return 'epica';
  if (preco >= 700) return 'rara';
  if (preco >= 300) return 'incomum';
  return 'comum';
}

function iconeEquipamento(item) {
  if (item.icone) return item.icone;
  if (item.tipo === 'armadura') return '🛡️';
  if (item.tipo === 'acessorio') return '💍';
  const grupo = item.grupo || item.categoria;
  if (grupo === 'distancia') return '🏹';
  if (grupo === 'utilitaria') return '🧰';
  return '⚔️';
}

function grupoEquipamento(item) {
  return {
    perto: 'Corpo a corpo',
    distancia: 'À distância',
    utilitaria: 'Utilitária',
    armaduras: 'Armadura',
    acessorios: 'Acessório',
  }[item.grupo] || item.grupo;
}

function resumoEquipamento(item) {
  const linhas = [];
  if (item.danoBase != null) linhas.push(`⚔️ Dano ${item.danoBase}`);
  if (item.defesa != null) linhas.push(`🛡️ Defesa ${item.defesa}`);
  for (const k of ATTRIBUTES) {
    const v = Number(item.bonus?.[k] || 0);
    if (v) linhas.push(`${v > 0 ? '+' : ''}${v} ${ATTRIBUTE_NAMES[k]}`);
  }
  for (const k of ATTRIBUTES) {
    const v = Number(item.penalidade?.[k] || 0);
    if (v) linhas.push(`-${Math.abs(v)} ${ATTRIBUTE_NAMES[k]}`);
  }
  if (item.socketSlots) {
    linhas.push(`💎 ${item.socketSlots} slot${item.socketSlots > 1 ? 's' : ''} de gema`);
  }
  if (item.usosMax) linhas.push(`🔧 ${item.usosMax} usos`);
  if (item.recarga) linhas.push(`⏳ Recarga ${item.recarga}`);
  if (item.alcance) linhas.push(`🎯 ${item.alcance}`);
  return linhas;
}

function contarEquipamentos(grupo) {
  return grupo === 'todos'
    ? EQUIPAMENTOS.length
    : EQUIPAMENTOS.filter((it) => it.grupo === grupo).length;
}

export default function ToolShop({
  jogador,
  localAtual = 'Porto Ferro',
  onComprar,
  onBack,
  character,
  characters = [],
  player,
  onRefresh,
  onWalletChange,
  initialTab = 'tools',
  initialCharacterId = null,
}) {
  const [local, setLocal] = useState(localAtual);
  const [carteira, setCarteira] = useState(typeof jogador?.carteira === 'number' ? jogador.carteira : 0);
  const [inventario, setInventario] = useState(jogador?.inventario || []);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [gemasLoja, setGemasLoja] = useState([]);
  const [minerar, setMinerar] = useState({ veios: [] });
  const [mining, setMining] = useState(false);
  const [characterId, setCharacterId] = useState(
    () => initialCharacterId || character?.id || characters?.[0]?.id || null,
  );
  const [cooldowns, setCooldowns] = useState({});
  const [agora, setAgora] = useState(Date.now());
  const [filtroRaridade, setFiltroRaridade] = useState('todas');
  const [equipCategory, setEquipCategory] = useState('todos');
  const [equipSort, setEquipSort] = useState('preco');
  const [miningLog, setMiningLog] = useState([]);
  const [gemasPersonagem, setGemasPersonagem] = useState([]);
  const [gemsVersion, setGemsVersion] = useState(0);

  const limitePeso = jogador?.limitePeso ?? 40;
  const limiteEspacos = jogador?.limiteEspacos ?? 20;

  // Relógio para o cooldown de mineração (1s).
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!characterId && characters.length) setCharacterId(characters[0].id);
  }, [characters, characterId]);

  // Aba inicial: permite abrir a página direto em "Minerar" a partir da ficha.
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Personagem inicial: o botão "Minerar" de cada ficha abre a mineração já
  // com aquele personagem selecionado.
  useEffect(() => {
    if (initialCharacterId) setCharacterId(initialCharacterId);
  }, [initialCharacterId]);

  // O histórico de descobertas é da sessão e do personagem selecionado.
  useEffect(() => {
    setMiningLog([]);
  }, [characterId]);

  // Restaura os cooldowns reais ao trocar de personagem ou recarregar a página.
  useEffect(() => {
    if (!characterId) {
      setCooldowns({});
      return undefined;
    }
    let alive = true;
    api
      .getMiningCooldowns?.(characterId)
      .then((d) => {
        if (!alive) return;
        const agoraMs = Date.now();
        const mapa = {};
        for (const c of d?.cooldowns || []) {
          if (c.restanteSeg > 0) mapa[c.veioId] = agoraMs + c.restanteSeg * 1000;
        }
        setCooldowns(mapa);
      })
      .catch(() => {
        if (alive) setCooldowns({});
      });
    return () => {
      alive = false;
    };
  }, [characterId]);

  // Inventário de gemas do personagem selecionado (para o resumo da mineração).
  useEffect(() => {
    if (!characterId) {
      setGemasPersonagem([]);
      return undefined;
    }
    let alive = true;
    api
      .getCharacterGemsDetailed?.(characterId)
      .then((d) => {
        if (alive) setGemasPersonagem(d?.gems || []);
      })
      .catch(() => {
        if (alive) setGemasPersonagem([]);
      });
    return () => {
      alive = false;
    };
  }, [characterId, gemsVersion]);

  // Inventário exibido = inventário real do personagem selecionado.
  useEffect(() => {
    const c = characters.find((ch) => ch.id === characterId);
    if (c) setInventario(c.inventory || []);
  }, [characterId, characters]);

  useEffect(() => {
    setCarteira(typeof jogador?.carteira === 'number' ? jogador.carteira : 0);
  }, [jogador?.carteira]);

  const atualizarCarteira = (cents) => {
    if (typeof cents !== 'number') return;
    setCarteira(cents);
    if (onWalletChange) onWalletChange(cents);
  };

  const tools = useMemo(() => getToolsPorLocal(local), [local]);

  const pesoAtual = inventario.reduce((s, i) => s + (i.peso || 0), 0);
  const espacosAtuais = inventario.reduce((s, i) => s + (i.espacos || 0), 0);

  const alerta = (msg, tipo) => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // Catálogo (gemas + veios) carregado uma vez; não depende da aba.
  useEffect(() => {
    api
      .getGemsCatalog?.()
      .then((d) => {
        setGemasLoja(d.gems || []);
        setMinerar({ veios: d.veios || [] });
      })
      .catch(() => {});
  }, []);

  const gemasFiltradas = useMemo(() => {
    const lista = gemasLoja.slice().sort(
      (a, b) => (RARITY_ORDER[a.raridade] ?? 0) - (RARITY_ORDER[b.raridade] ?? 0) || a.nome.localeCompare(b.nome),
    );
    return filtroRaridade === 'todas' ? lista : lista.filter((g) => g.raridade === filtroRaridade);
  }, [gemasLoja, filtroRaridade]);

  const personagemAtual = characters.find((c) => c.id === characterId);

  const equipamentosFiltrados = useMemo(() => {
    const lista = EQUIPAMENTOS.filter(
      (it) => equipCategory === 'todos' || it.grupo === equipCategory,
    );
    return lista.slice().sort((a, b) => {
      if (equipSort === 'nome') return a.nome.localeCompare(b.nome);
      if (equipSort === 'dano') return (b.danoBase || 0) - (a.danoBase || 0);
      if (equipSort === 'defesa') return (b.defesa || 0) - (a.defesa || 0);
      return (a.preco || 0) - (b.preco || 0) || a.nome.localeCompare(b.nome);
    });
  }, [equipCategory, equipSort]);

  const equipamentosPossuidosList = (() => {
    if (!personagemAtual) return [];
    const mapa = new Map();
    for (const it of personagemAtual.inventory || []) {
      if (it && ['arma', 'arma_fogo', 'armadura', 'acessorio'].includes(it.tipo)) {
        mapa.set(it.id, it);
      }
    }
    const eq = personagemAtual.equipment || {};
    for (const it of [eq.arma, eq.armadura, eq.acessorio, ...Object.values(eq.armas || {})]) {
      if (it?.id && !mapa.has(it.id)) mapa.set(it.id, it);
    }
    return [...mapa.values()];
  })();

  const equipamentoPossuido = (item) =>
    equipamentosPossuidosList.some((it) => it.id === item.id);

  const equipamentoEquipado = (item) => {
    const eq = personagemAtual?.equipment || {};
    if (item.tipo === 'armadura') return eq.armadura?.id === item.id;
    if (item.tipo === 'acessorio') return eq.acessorio?.id === item.id;
    return eq.armas?.[item.categoria]?.id === item.id || eq.arma?.id === item.id;
  };

  const comprarEquipamento = async (item) => {
    if (!characterId) {
      alerta('Escolha um personagem no topo da página.', 'erro');
      return;
    }
    if (equipamentoPossuido(item)) {
      alerta('Você já possui este equipamento.', 'erro');
      return;
    }
    if (carteira < (item.preco || 0)) {
      alerta(`❌ Ouro insuficiente para comprar ${item.nome}.`, 'erro');
      return;
    }
    try {
      const res = await api.buyEquipment?.(characterId, item);
      atualizarCarteira(res?.walletCents);
      setInventario((inv) => [...inv, res?.item || item]);
      alerta(`✅ ${item.nome} comprado! Equipe na ficha do personagem.`, 'sucesso');
      if (onRefresh) await onRefresh();
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    }
  };

  const gemasAgrupadas = useMemo(() => {
    const mapa = new Map();
    for (const g of gemasPersonagem) {
      const estado = g.estado || 'polido';
      const chave = `${g.gem_id}:${estado}`;
      const atual = mapa.get(chave) || { gemId: g.gem_id, estado, qtd: 0 };
      atual.qtd += 1;
      mapa.set(chave, atual);
    }
    return [...mapa.values()].sort((a, b) => a.gemId.localeCompare(b.gemId));
  }, [gemasPersonagem]);

  const nomeEstado = (estado) => NIVEIS_POLIMENTO[estado]?.nome || estado;
  const formatarHora = (ts) =>
    new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const comprarGema = async (g) => {
    if (!characterId) return alerta('Escolha um personagem no topo da página.', 'erro');
    try {
      const res = await api.buyGem?.(characterId, g.id);
      atualizarCarteira(res?.walletCents);
      const nome = getGemaById(g.id)?.nome || g.nome;
      alerta(`💎 ${nome} adicionada ao inventário!`, 'sucesso');
      if (onRefresh) onRefresh();
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    }
  };

  const restanteCooldown = (veio) => {
    const ate = cooldowns[veio.id];
    if (!ate) return 0;
    return Math.max(0, Math.ceil((ate - agora) / 1000));
  };

  const minerarGema = async (veio) => {
    if (!characterId) return alerta('Escolha um personagem no topo da página.', 'erro');
    setMining(true);
    try {
      const res = await api.mineGem?.(characterId, veio.id);
      const nome = getGemaById(res.gemId)?.nome || res.gemId;
      alerta(`⛏️ Você encontrou ${nome}!`, 'sucesso');
      atualizarCarteira(res?.walletCents);
      setMiningLog((log) => [
        { gemId: res.gemId, nome, estado: res.estado, veio: veio.nome, at: Date.now() },
        ...log,
      ].slice(0, 8));
      setGemsVersion((v) => v + 1);
      if (res?.cooldownMin) {
        setCooldowns((c) => ({ ...c, [veio.id]: Date.now() + res.cooldownMin * 60_000 }));
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    } finally {
      setMining(false);
    }
  };

  const comprar = async (ferramenta) => {
    if (!characterId) {
      alerta('Escolha um personagem no topo da página.', 'erro');
      return;
    }
    const preco = precoEmCents(ferramenta.preco);
    if (carteira < preco) {
      alerta(`❌ Você não tem moedas suficientes para o ${ferramenta.nome}.`, 'erro');
      return;
    }
    const novoPeso = pesoAtual + (ferramenta.peso || 0);
    const novosEspacos = espacosAtuais + (ferramenta.espacos || 0);
    if (novoPeso > limitePeso) {
      alerta('❌ Peso excedido: o inventário não aguenta mais carga.', 'erro');
      return;
    }
    if (novosEspacos > limiteEspacos) {
      alerta('❌ Espaços excedidos: não há onde guardar a ferramenta.', 'erro');
      return;
    }

    try {
      const res = await api.buyTool?.(characterId, ferramenta);
      atualizarCarteira(res?.walletCents);
      const item = res?.item || {
        id: ferramenta.id,
        nome: ferramenta.nome,
        tipo: ferramenta.tipo,
        peso: ferramenta.peso,
        espacos: ferramenta.espacos,
        usos: ferramenta.usos,
        raridade: ferramenta.raridade,
      };
      setInventario((inv) => [...inv, item]);
      if (onRefresh) onRefresh();
      alerta(`✅ ${ferramenta.nome} adicionado ao inventário!`, 'sucesso');
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    }
  };

  return (
    <div className="page tools-shop-page">
      <header className="topbar">
        <div>
          <h1>🛒 Loja</h1>
          <span className="player-name">Equipamentos, Ferramentas, Gemas e Mineração</span>
        </div>
        <div className="topbar-actions">
          <span className="wallet-chip" title="Sua carteira">💰 {formatCoins(carteira)}</span>
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        {/* Personagem: gemas e mineração são por personagem. */}
        <div className="forge-character-bar">
          <label htmlFor="shop-character">Personagem</label>
          <select
            id="shop-character"
            value={characterId || ''}
            onChange={(e) => setCharacterId(e.target.value || null)}
          >
            {characters.length === 0 && <option value="">Nenhum personagem</option>}
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Nv. {c.level}
              </option>
            ))}
          </select>
          {!characterId && (
            <span className="muted small">Crie um personagem para comprar equipamentos, gemas e minerar.</span>
          )}
        </div>

        <div className="shop-tabs">
          <button className={tab === 'equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>⚔️ Equipamentos</button>
          <button className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>🛠️ Ferramentas</button>
          <button className={tab === 'gems' ? 'active' : ''} onClick={() => setTab('gems')}>💎 Loja de Gemas</button>
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>⛏️ Minerar</button>
        </div>

        {tab === 'equipment' && (
          <section className="panel equipment-shop">
            <div className="equipment-shop-head">
              <div>
                <h2>⚔️ Equipamentos</h2>
                <p className="muted">
                  Armas, armaduras e acessórios. A compra vai para o inventário do
                  personagem selecionado — depois é só equipar na ficha.
                </p>
              </div>
              <div className="equipment-shop-controls">
                <label htmlFor="equip-sort">Ordenar por</label>
                <select id="equip-sort" value={equipSort} onChange={(e) => setEquipSort(e.target.value)}>
                  <option value="preco">Menor preço</option>
                  <option value="nome">Nome</option>
                  <option value="dano">Maior dano</option>
                  <option value="defesa">Maior defesa</option>
                </select>
              </div>
            </div>

            <div className="equipment-summary">
              <span>🧙 <strong>{personagemAtual?.name || 'Nenhum personagem'}</strong></span>
              <span>💰 <strong>{formatCoins(carteira)}</strong></span>
              <span>🎒 <strong>{equipamentosPossuidosList.length}</strong> equipamento(s)</span>
            </div>

            <div className="equip-category-tabs">
              {EQUIP_CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  className={equipCategory === cat.id ? 'active' : ''}
                  onClick={() => setEquipCategory(cat.id)}
                >
                  <span>{cat.icone} {cat.nome}</span>
                  <span className="equip-count">{contarEquipamentos(cat.id)}</span>
                </button>
              ))}
            </div>

            {equipamentosFiltrados.length === 0 ? (
              <p className="muted">Nenhum equipamento nesta categoria.</p>
            ) : (
              <div className="shop-grid equipment-grid">
                {equipamentosFiltrados.map((item) => {
                  const possui = equipamentoPossuido(item);
                  const equipado = equipamentoEquipado(item);
                  const preco = Number(item.preco || 0);
                  const semMoedas = carteira < preco;
                  const raridade = raridadePorPreco(preco);
                  return (
                    <article
                      className={`shop-card equipment-card ${equipado ? 'equipped' : possui ? 'owned' : ''}`}
                      key={item.id}
                    >
                      <header>
                        <div className="equipment-card-title">
                          <span className="equipment-icon">{iconeEquipamento(item)}</span>
                          <div>
                            <h3>{item.nome}</h3>
                            <span className="muted small">{grupoEquipamento(item)}</span>
                          </div>
                        </div>
                        <span className="rarity" data-rarity={raridade}>{rotuloRaridade(raridade)}</span>
                      </header>
                      <p className="desc">{item.descricao}</p>
                      <div className="equipment-stats">
                        {resumoEquipamento(item).map((linha, i) => (
                          <span key={i}>{linha}</span>
                        ))}
                      </div>
                      <footer>
                        <span className="price">💰 {formatCoins(preco)}</span>
                        {equipado ? (
                          <span className="equipment-badge equipped">✅ Equipado</span>
                        ) : possui ? (
                          <span className="equipment-badge owned">🎒 No inventário</span>
                        ) : (
                          <button
                            onClick={() => comprarEquipamento(item)}
                            disabled={!characterId || semMoedas}
                          >
                            {!characterId
                              ? 'Escolha um personagem'
                              : semMoedas
                                ? 'Ouro insuficiente'
                                : 'Comprar'}
                          </button>
                        )}
                      </footer>
                      {!possui && semMoedas && (
                        <p className="tool-limit">Faltam {formatCoins(preco - carteira)}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {personagemAtual && (
              <div className="tool-inventory equipment-inventory">
                <h3>🎒 Equipamentos de {personagemAtual.name}</h3>
                {equipamentosPossuidosList.length === 0 ? (
                  <p className="muted small">Nenhum equipamento comprado ainda.</p>
                ) : (
                  <div className="tool-inventory-list">
                    {equipamentosPossuidosList.map((it) => (
                      <span className="tool-inventory-chip" key={it.id}>
                        {iconeEquipamento(it)} {it.nome}
                        {equipamentoEquipado(it) ? ' ✅' : ''}
                      </span>
                    ))}
                  </div>
                )}
                <p className="muted small">
                  Para usar um item, abra a ficha do personagem e escolha o slot correspondente.
                </p>
              </div>
            )}
          </section>
        )}

        {tab === 'gems' && (
          <section className="panel">
            <h2>💎 Loja de Gemas</h2>
            <p className="muted">
              Compre gemas com o ouro da sua carteira. Elas entram no inventário do
              personagem selecionado e já podem ser equipadas; a Forja melhora e funde pedras.
            </p>
            <div className="shop-filter">
              <label htmlFor="gem-rarity">Raridade</label>
              <select id="gem-rarity" value={filtroRaridade} onChange={(e) => setFiltroRaridade(e.target.value)}>
                <option value="todas">Todas</option>
                <option value="comum">Comum</option>
                <option value="incomum">Incomum</option>
                <option value="rara">Rara</option>
                <option value="epica">Épica</option>
                <option value="lendaria">Lendária</option>
              </select>
              <span className="muted small">{gemasFiltradas.length} gemas à venda</span>
            </div>
            <div className="shop-grid">
              {gemasFiltradas.map((g) => (
                <article className="shop-card" key={g.id}>
                  <header>
                    <h3>💎 {g.nome}</h3>
                    <span className="rarity" data-rarity={g.raridade}>{rotuloRaridade(g.raridade)}</span>
                  </header>
                  <p className="desc">{g.tipo} · {g.bioma || 'qualquer bioma'}</p>
                  {g.descricao && <p className="desc small">{g.descricao}</p>}
                  <footer>
                    <span className="price">💰 {g.preco || 250} moedas</span>
                    <button onClick={() => comprarGema(g)} disabled={!characterId || carteira < (g.preco || 250)}>
                      {carteira < (g.preco || 250) ? 'Ouro insuficiente' : 'Comprar'}
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'mine' && (
          <section className="panel">
            <h2>⛏️ Mineração{personagemAtual ? ` — ${personagemAtual.name}` : ''}</h2>
            <p className="muted">
              Escolha um veio e minere. Cada personagem tem cooldowns próprios por veio.
              As gemas encontradas já saem utilizáveis e entram no inventário do personagem.
            </p>

            <div className="mining-summary">
              <span>🧙 Personagem: <strong>{personagemAtual?.name || 'Nenhum'}</strong></span>
              <span>💎 Gemas: <strong>{gemasPersonagem.length}</strong></span>
              <span>💰 Carteira: <strong>{formatCoins(carteira)}</strong></span>
            </div>

            {miningLog[0] && (
              <div className="mining-last">
                ⛏️ Última descoberta: <strong>{miningLog[0].nome}</strong>{' '}
                <span className="muted">({nomeEstado(miningLog[0].estado)})</span> no veio {miningLog[0].veio}.
              </div>
            )}

            <div className="shop-grid">
              {(minerar.veios || []).map((v) => {
                const restante = restanteCooldown(v);
                const bloqueado = mining || !characterId || restante > 0 || carteira < (v.custoCents || 0);
                return (
                  <article className="shop-card" key={v.id}>
                    <header>
                      <h3>⛏️ {v.nome}</h3>
                      <span className="rarity">Cooldown {v.cooldownMin} min</span>
                    </header>
                    <p className="desc">{v.descricao}</p>
                    <p className="desc">
                      Biomas: {(v.biomas || []).join(', ')} · Achado raro: +{v.chanceBonus}%
                    </p>
                    <footer>
                      <span className="price">{v.custoCents > 0 ? `💰 ${v.custoCents} moedas` : 'Grátis'}</span>
                      <button onClick={() => minerarGema(v)} disabled={bloqueado}>
                        {restante > 0
                          ? `Aguarde ${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`
                          : mining
                            ? 'Minerando...'
                            : !characterId
                              ? 'Escolha um personagem'
                              : carteira < (v.custoCents || 0)
                                ? 'Ouro insuficiente'
                                : 'Minerar'}
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>

            <div className="mining-bottom">
              <div className="mining-block">
                <h3>📜 Últimas descobertas</h3>
                {miningLog.length === 0 ? (
                  <p className="muted small">Minere para registrar suas descobertas nesta sessão.</p>
                ) : (
                  <ul className="mining-list">
                    {miningLog.map((item, i) => (
                      <li key={`${item.gemId}-${item.at}-${i}`}>
                        <span>
                          💎 {item.nome}{' '}
                          <span className="muted small">({nomeEstado(item.estado)})</span>
                        </span>
                        <span className="mining-list-meta">{item.veio} · {formatarHora(item.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mining-block">
                <h3>💎 Gemas de {personagemAtual?.name || 'seu personagem'}</h3>
                {gemasAgrupadas.length === 0 ? (
                  <p className="muted small">Nenhuma gema ainda. Minere ou compre na Loja de Gemas.</p>
                ) : (
                  <ul className="mining-list">
                    {gemasAgrupadas.map((g) => (
                      <li key={`${g.gemId}-${g.estado}`}>
                        <span>💎 {getGemaById(g.gemId)?.nome || g.gemId}</span>
                        <span className="mining-list-meta">{nomeEstado(g.estado)} ×{g.qtd}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="muted small">
                  As gemas mineradas já saem utilizáveis. Use a Forja para fundir e polir.
                </p>
              </div>
            </div>

            <p className="muted small">
              Dica: masmorras e batalhas também podem derrubar gemas automaticamente.
            </p>
          </section>
        )}

        {tab === 'tools' && (
          <>
            <div className="tools-shop-head">
              <div>
                <h2>📍 Cidade atual</h2>
                <select value={local} onChange={(e) => setLocal(e.target.value)} className="tools-locale-select">
                  {CIDADES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="tools-capacity">
                <span title="Peso">{ICONE_TRACKER.peso} {pesoAtual}/{limitePeso} kg</span>
                <span title="Espaços">{ICONE_TRACKER.espacos} {espacosAtuais}/{limiteEspacos}</span>
              </div>
            </div>

            {tools.length === 0 ? (
              <div className="tools-empty">
                <p className="muted">Nenhuma ferramenta disponível nesta cidade. Viaje para outro local.</p>
              </div>
            ) : (
              <div className="tools-grid">
                {tools.map((t) => {
                  const preco = precoEmCents(t.preco);
                  const cor = TOOL_RARITY[t.raridade] || '#fff';
                  const semMoedas = carteira < preco;
                  const excedePeso = pesoAtual + (t.peso || 0) > limitePeso;
                  const excedeEspacos = espacosAtuais + (t.espacos || 0) > limiteEspacos;
                  const bloqueado = semMoedas || excedePeso || excedeEspacos;
                  return (
                    <div className="tool-card" key={t.id} style={{ borderColor: cor }}>
                      <div className="tool-card-head">
                        <span className="tool-card-icon" style={{ color: cor, borderColor: cor }}>{t.icone}</span>
                        <div className="tool-card-title">
                          <strong>{t.nome}</strong>
                          <span className="tool-card-rarity" style={{ color: cor }}>{t.raridade}</span>
                        </div>
                      </div>
                      <p className="tool-card-desc">{t.descricao}</p>
                      <ul className="tool-card-effects">
                        {(t.efeitos || []).map((ef, i) => (<li key={i}>{ef}</li>))}
                      </ul>
                      <div className="tool-card-meta">
                        <span title="Peso">{ICONE_TRACKER.peso} {t.peso || 0}</span>
                        <span title="Espaços">{ICONE_TRACKER.espacos} {t.espacos || 0}</span>
                        <span title="Usos">{ICONE_TRACKER.usos} {t.usos || 1}</span>
                      </div>
                      <div className="tool-card-foot">
                        <span className="tool-card-price" style={{ color: cor }}>{formatPreco(t.preco)}</span>
                        <button className="tool-buy" onClick={() => comprar(t)} disabled={bloqueado}>Comprar</button>
                      </div>
                      {semMoedas && <p className="tool-limit">Faltam {formatCoins(preco - carteira)}</p>}
                      {!semMoedas && excedePeso && <p className="tool-limit">Peso insuficiente no inventário</p>}
                      {!semMoedas && !excedePeso && excedeEspacos && <p className="tool-limit">Sem espaço no inventário</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {inventario.length > 0 && tab === 'tools' && (
          <div className="tool-inventory">
            <h3>🎒 Seu inventário</h3>
            <div className="tool-inventory-list">
              {inventario.map((it, i) => (
                <span className="tool-inventory-chip" key={i}>{it.nome}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`tool-toast ${toast.tipo}`}>{toast.msg}</div>}
    </div>
  );
}
