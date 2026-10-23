import { useMemo, useState, useEffect } from 'react';
import {
  gemasDisponiveis,
  getGemaById,
  verificarFusao,
  efeitosParaLista,
} from '../game/gems.js';
import GemPolisher from '../components/GemPolisher.jsx';
import { api } from '../api.js';

const RARITY_GLOW = {
  Comum: '#b8b8c8',
  Incomum: '#3ddc84',
  Rara: '#4a90e2',
  'Épica': '#7c5cff',
  'Mítica': '#ff5c8a',
  'Lendária': '#ffd166',
  'Lendário': '#ffd166',
};

const FUSION_ICONS = {
  obsidiana: '🪨',
  agataDeFogo: '🔥',
  rubi: '❤️‍🔥',
  pedraDeSangue: '🩸',
};

const DEFAULT_ICON = '💎';
const ESTADO_LABEL = {
  bruta: '⛓ Bruta',
  lapidada: '🔷 Lapidada',
  polido: '✨ Polida',
  perfeita: '🌟 Perfeita',
  destruida: '💥 Destruída',
};

function GemaSlot({ label, gema, pedras, onPick, onClear, onDrop }) {
  const slotLetra = label.trim().toLowerCase().endsWith('a') ? 'a' : 'b';
  const valor = gema ? `${gema.id}|${gema.estado}` : '';
  return (
    <div className={`forge-slot ${gema ? 'filled' : ''}`}>
      <div className="forge-slot-label">
        <span>{label}</span>
        {gema && <button className="forge-clear" onClick={onClear} title="Remover">✕</button>}
      </div>
      <div
        className={`forge-dropzone ${gema ? 'has-gem' : 'empty'}`}
        onClick={() => document.getElementById(`forge-select-${slotLetra}`)?.focus()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const chave = e.dataTransfer.getData('text/gem-key');
          if (chave) onDrop(chave);
        }}
      >
        {gema ? (
          <>
            <span className="forge-gem-icon">{FUSION_ICONS[gema.id] || DEFAULT_ICON}</span>
            <span className="forge-gem-name">{gema.nome}</span>
            <span className="forge-gem-rarity" style={{ color: RARITY_GLOW[gema.raridade] || '#fff' }}>
              {gema.raridade}
            </span>
            <span className={`forge-estado ${gema.estado === 'bruta' ? 'bruta' : 'polida'}`}>
              {ESTADO_LABEL[gema.estado] || gema.estado}
            </span>
          </>
        ) : (
          <>
            <span className="forge-drop-icon">🗡️</span>
            <span className="forge-drop-hint">Arraste uma gema aqui ou selecione abaixo</span>
          </>
        )}
      </div>
      <select
        id={`forge-select-${slotLetra}`}
        className="forge-select"
        value={valor}
        onChange={(e) => {
          const [id, estado] = e.target.value.split('|');
          if (id) onPick(id, estado);
        }}
      >
        <option value="">— Escolher {label} —</option>
        {pedras.map((g) => (
          <option key={`${g.id}|${g.estado}|${g.rowId || ''}`} value={`${g.id}|${g.estado}`}>
            {g.nome} ({ESTADO_LABEL[g.estado] || g.estado})
          </option>
        ))}
      </select>
    </div>
  );
}

export default function GemForge({ onBack, player, characters = [], onRefresh, walletCents = 0, onOpenToolShop, onEnterLobby }) {
  const [characterId, setCharacterId] = useState(() => characters?.[0]?.id || null);
  const [inventario, setInventario] = useState([]);
  const [carregandoInv, setCarregandoInv] = useState(false);

  const [gemaAId, setGemaAId] = useState('');
  const [gemaBId, setGemaBId] = useState('');
  const [gemaAEstado, setGemaAEstado] = useState('polido');
  const [gemaBEstado, setGemaBEstado] = useState('polido');

  const [ouro, setOuro] = useState(Number(walletCents) || 0);
  const [polindoGema, setPolindoGema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const personagem = useMemo(
    () => characters.find((c) => c.id === characterId) || null,
    [characters, characterId],
  );
  const mana = Number(personagem?.mp_current ?? 0);

  const receitasEspeciais = [
    { a: 'obsidiana', b: 'agataDeFogo', resultado: 'obsidiana_ardente' },
    { a: 'rubi', b: 'pedraDeSangue', resultado: 'rubi_abissal' },
  ];

  useEffect(() => {
    setOuro(Number(walletCents) || 0);
  }, [walletCents]);

  // Se a lista de personagens chegar depois, seleciona o primeiro.
  useEffect(() => {
    if (!characterId && characters.length) setCharacterId(characters[0].id);
  }, [characters, characterId]);

  const carregarInventario = async (id) => {
    if (!id) return;
    setCarregandoInv(true);
    try {
      const d = await api.getCharacterGemsDetailed?.(id);
      setInventario(d?.gems || []);
    } catch (e) {
      console.warn('[forja] inventário:', e.message);
    } finally {
      setCarregandoInv(false);
    }
  };

  useEffect(() => {
    carregarInventario(characterId);
  }, [characterId]);

  // Tudo que o personagem realmente possui. Sem personagem (offline/demo),
  // mostra o catálogo para a página não ficar vazia.
  const pedras = useMemo(() => {
    if (!characterId) {
      return gemasDisponiveis.map((g) => ({ ...g, key: `${g.id}|${g.estado}` }));
    }
    return inventario.map((row, i) => {
      const base = getGemaById(row.gem_id);
      const estado = row.estado || 'lapidada';
      return {
        ...(base || {
          id: row.gem_id,
          nome: row.gem_id,
          raridade: 'Comum',
          tipo: 'natural',
          efeitos: {},
          custoFusaoMana: 20,
        }),
        estado,
        rowId: row.id || `row-${i}`,
        key: `${row.gem_id}|${estado}|${row.id || i}`,
      };
    });
  }, [inventario, characterId]);

  // Combinações estáveis que já existem no inventário do personagem.
  // Ajuda o jogador a descobrir o que pode fundir sem testar às cegas.
  const combinacoes = useMemo(() => {
    const validas = pedras.filter((p) => p.estado && !['bruta', 'destruida'].includes(p.estado));
    const vistas = new Set();
    const out = [];
    for (let i = 0; i < validas.length; i += 1) {
      for (let j = i + 1; j < validas.length; j += 1) {
        const a = validas[i];
        const b = validas[j];
        if (!a || !b || a.id === b.id) continue;
        const chave = [a.id, b.id].sort().join('|');
        if (vistas.has(chave)) continue;
        const check = verificarFusao(a, b);
        if (check.ok) {
          vistas.add(chave);
          out.push({ a, b, resultado: check.resultado, chave });
        }
      }
    }
    return out;
  }, [pedras]);

  const acharPedra = (id, estado) => {
    const base = getGemaById(id);
    return base ? { ...base, estado } : null;
  };

  const gemaA = useMemo(() => acharPedra(gemaAId, gemaAEstado), [gemaAId, gemaAEstado]);
  const gemaB = useMemo(() => acharPedra(gemaBId, gemaBEstado), [gemaBId, gemaBEstado]);
  const resultado = useMemo(() => verificarFusao(gemaA, gemaB), [gemaA, gemaB]);
  const preview = resultado.ok ? resultado.resultado : null;

  // Custo da fusão instável (3x) — precisa existir mesmo quando não há receita.
  const custoInstavel =
    ((gemaA?.custoFusaoMana || 20) + (gemaB?.custoFusaoMana || 20)) * 3;

  const escolherParaSlot = (id, estado) => {
    if (!gemaAId) {
      setGemaAId(id);
      setGemaAEstado(estado);
    } else if (!gemaBId) {
      setGemaBId(id);
      setGemaBEstado(estado);
    } else {
      setGemaAId(id);
      setGemaAEstado(estado);
    }
  };

  const handleDragStart = (pedra) => (e) => {
    e.dataTransfer.setData('text/gem-key', `${pedra.id}|${pedra.estado}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (chave, letra) => {
    const [id, estado] = chave.split('|');
    if (!id) return;
    if (letra === 'a') {
      setGemaAId(id);
      setGemaAEstado(estado);
    } else {
      setGemaBId(id);
      setGemaBEstado(estado);
    }
  };

  const aviso = (() => {
    if (!gemaA || !gemaB) return null;
    if (resultado.bruta) {
      return { tipo: 'erro', msg: '⚠️ Pedras brutas precisam ser polidas antes de serem fundidas!' };
    }
    if (resultado.instavel || !resultado.ok) {
      return { tipo: 'aviso', msg: resultado.motivo || 'Fusão instável.' };
    }
    return null;
  })();

  const mostraToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const fundir = async () => {
    if (!gemaA || !gemaB || !resultado.ok) return;
    if (!characterId) {
      mostraToast('Selecione um personagem para fundir.');
      return;
    }
    if (gemaA.estado === 'bruta' || gemaB.estado === 'bruta') {
      mostraToast('Polir as gemas antes de fundir.');
      return;
    }
    if (mana < (preview?.custoManaTotal || 0)) {
      mostraToast(`Mana insuficiente: a fusão custa ${preview?.custoManaTotal}.`);
      return;
    }
    setLoading(true);
    try {
      await api.fuseGems(
        characterId,
        { id: gemaA.id, estado: gemaA.estado },
        { id: gemaB.id, estado: gemaB.estado },
        resultado.resultado,
      );
      mostraToast(`✨ ${resultado.resultado.nome} obtida!`);
      setGemaAId('');
      setGemaBId('');
      await carregarInventario(characterId);
      if (onRefresh) onRefresh();
    } catch (e) {
      mostraToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Chamada pelo modal de polimento: o servidor decide o resultado e debita
  // ouro/mana de verdade. Em modo offline usamos a regra local do modal.
  const polirNoServidor = async (gema, estadoAtual) => {
    if (!characterId) throw new Error('Selecione um personagem.');
    const res = await api.polishGem(characterId, gema.id, estadoAtual);
    return res;
  };

  const aoMudarEstado = async () => {
    await carregarInventario(characterId);
    // Descarta a seleção se a gema correspondente deixou de existir/ mudou.
    setGemaAId('');
    setGemaBId('');
    if (onRefresh) onRefresh();
  };

  return (
    <div className="page forge-page">
      <header className="topbar">
        <div>
          <h1>🔮 Forja de Gemas</h1>
          <span className="player-name">Fusão e polimento de pedras preciosas</span>
        </div>
        <div className="topbar-actions">
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <div className="forge-intro">
          <p>
            Combine duas pedras <strong>polidas e compatíveis</strong> na forja mágica.
            O custo da fusão é pago em <strong>Mana</strong>; o polimento custa
            <strong> ouro e mana</strong> de verdade. Gemas do mesmo tipo também podem
            ser fundidas — não só as receitas especiais.
          </p>
          <div className="forge-quick-links">
            {onOpenToolShop && (
              <button className="ghost" onClick={onOpenToolShop}>🛠️ Comprar ou minerar gemas</button>
            )}
            {onEnterLobby && (
              <button className="ghost" onClick={onEnterLobby}>⚔️ Ganhar gemas em batalhas</button>
            )}
            <button className="ghost" onClick={onBack}>👤 Voltar às fichas para equipar</button>
          </div>
        </div>

        {/* Seleção de personagem: cada personagem tem seu próprio inventário. */}
        <div className="forge-character-bar">
          <label htmlFor="forge-character">Personagem</label>
          <select
            id="forge-character"
            value={characterId || ''}
            onChange={(e) => {
              setCharacterId(e.target.value || null);
              setGemaAId('');
              setGemaBId('');
            }}
          >
            {characters.length === 0 && <option value="">Nenhum personagem</option>}
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Nv. {c.level}
              </option>
            ))}
          </select>
          <span className="forge-wallet">🪙 {ouro} · ⚡ {mana} mana</span>
        </div>

        {/* Inventário real do personagem — arrastáveis */}
        <div className="forge-inventory">
          <h3>
            💎 Pedras disponíveis{' '}
            <span className="muted">(clique para polir · arraste para fundir)</span>
          </h3>
          {carregandoInv ? (
            <p className="muted">Carregando inventário...</p>
          ) : pedras.length === 0 ? (
            <div className="registry-empty">
              <p style={{ marginTop: 0 }}><strong>Nenhuma gema ainda.</strong></p>
              <p>
                Ganhe gemas em batalhas, minere na Loja de Ferramentas ou compre na Loja de
                Gemas. Depois volte aqui para polir, fundir e equipar.
              </p>
              <div className="forge-quick-links" style={{ justifyContent: 'center' }}>
                {onOpenToolShop && (
                  <button className="ghost" onClick={onOpenToolShop}>🛠️ Ir para a Loja e mineração</button>
                )}
                {onEnterLobby && (
                  <button className="ghost" onClick={onEnterLobby}>⚔️ Entrar no Campo de Batalha</button>
                )}
              </div>
            </div>
          ) : (
            <div className="forge-gem-pool">
              {pedras.map((g) => (
                <div
                  key={g.key}
                  className={`forge-pool-gem ${g.estado === 'bruta' ? 'is-bruta' : ''}`}
                  draggable
                  onDragStart={handleDragStart(g)}
                  onClick={() => {
                    if (['bruta', 'lapidada', 'polido'].includes(g.estado)) {
                      setPolindoGema({ ...g, estado: g.estado });
                    } else {
                      escolherParaSlot(g.id, g.estado);
                    }
                  }}
                  title={
                    ['bruta', 'lapidada', 'polido'].includes(g.estado)
                      ? 'Clique para polir · arraste para a fusão'
                      : 'Arraste para fundir'
                  }
                  style={{ borderColor: RARITY_GLOW[g.raridade] || 'var(--border)' }}
                >
                  <span>{FUSION_ICONS[g.id] || DEFAULT_ICON}</span>
                  <strong>{g.nome}</strong>
                  <small>
                    {g.raridade} · {ESTADO_LABEL[g.estado] || g.estado}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slots A e B */}
        <div className="forge-slots">
          <GemaSlot
            label="Gema A"
            gema={gemaA}
            pedras={pedras}
            onPick={(id, estado) => { setGemaAId(id); setGemaAEstado(estado); }}
            onDrop={(chave) => handleDrop(chave, 'a')}
            onClear={() => setGemaAId('')}
          />
          <div className="forge-fusion-glyph">🔥</div>
          <GemaSlot
            label="Gema B"
            gema={gemaB}
            pedras={pedras}
            onPick={(id, estado) => { setGemaBId(id); setGemaBEstado(estado); }}
            onDrop={(chave) => handleDrop(chave, 'b')}
            onClear={() => setGemaBId('')}
          />
        </div>

        {/* Alertas */}
        {aviso && (
          <div className={`forge-alert ${aviso.tipo === 'erro' ? 'forge-alert-red' : 'forge-alert-yellow'}`}>
            {aviso.msg}
          </div>
        )}

        {!gemaA || !gemaB ? (
          <div className="forge-empty">
            <p className="muted">Selecione Gema A e Gema B para verificar a fusão.</p>
          </div>
        ) : !resultado.ok ? (
          <div className="forge-instavel-panel">
            <h3>⚠️ Fusão Instável</h3>
            <div className="forge-instavel-row">
              <span className="forge-instavel-key">Custo de Mana (triplicado)</span>
              <span className="forge-instavel-val mana">⚡ {custoInstavel}</span>
            </div>
            <div className="forge-instavel-row">
              <span className="forge-instavel-key">Chance de destruir as gemas</span>
              <span className="forge-instavel-val perigo">50%</span>
            </div>
            <p className="muted">
              Essa combinação não forma uma receita conhecida. Escolha gemas do mesmo
              tipo ou combinações compatíveis para uma fusão estável.
            </p>
          </div>
        ) : (
          <div className="forge-preview">
            <div className="forge-preview-glow">
              <span className="forge-preview-icon">🔥</span>
            </div>
            <h3 className="forge-preview-title">Fusão Estável</h3>
            <div className="forge-result-name" style={{ color: RARITY_GLOW[preview.raridade] || '#fff' }}>
              {preview.nome}
            </div>
            <div className="forge-result-rarity">{preview.raridade}</div>

            <div className="forge-cost">
              <span className="forge-cost-label">Custo da Fusão</span>
              <span className="forge-cost-value mana">⚡ {preview.custoManaTotal} de Mana</span>
            </div>

            <div className="forge-effects">
              <h4>Efeitos</h4>
              <div className="forge-ef-list">
                {efeitosParaLista(preview.efeitos).length === 0 ? (
                  <div className="forge-ef-row buff">✨ Gema de valor — pode ser equipada.</div>
                ) : (
                  efeitosParaLista(preview.efeitos).map((ef, i) => (
                    <div key={i} className={`forge-ef-row ${ef.tipo === 'debuff' ? 'debuff' : 'buff'}`}>
                      {ef.tipo === 'debuff' ? '❌' : '✨'}
                      <span>{ef.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              className="forge-fundir"
              onClick={fundir}
              disabled={!resultado.ok || loading || !characterId || gemaA?.estado === 'bruta' || gemaB?.estado === 'bruta'}
            >
              {loading ? 'Fundindo...' : 'Fundir gemas'}
            </button>
          </div>
        )}

        {/* Combinações que já existem no inventário: o jogador não precisa
            adivinhar quais pedras são compatíveis. */}
        <div className="forge-recipes">
          <h3>🧪 Combinações prontas no seu inventário ({combinacoes.length})</h3>
          {combinacoes.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nenhuma combinação estável no momento. Polir as gemas (clique nelas), conseguir
              mais pedras na Loja/mineração ou usar gemas do mesmo tipo também libera fusões.
            </p>
          ) : (
            <div className="forge-recipe-list">
              {combinacoes.slice(0, 8).map((c) => (
                <div className="forge-recipe" key={c.chave}>
                  <span>
                    <strong>{c.a.nome}</strong> + <strong>{c.b.nome}</strong> →{' '}
                    <strong style={{ color: RARITY_GLOW[c.resultado.raridade] || 'var(--text)' }}>
                      {c.resultado.nome}
                    </strong>{' '}
                    <span className="muted">· ⚡ {c.resultado.custoManaTotal} mana</span>
                  </span>
                  <button
                    className="ghost"
                    onClick={() => {
                      setGemaAId(c.a.id);
                      setGemaAEstado(c.a.estado);
                      setGemaBId(c.b.id);
                      setGemaBEstado(c.b.estado);
                    }}
                  >
                    Carregar na forja
                  </button>
                </div>
              ))}
              {combinacoes.length > 8 && (
                <p className="muted" style={{ margin: 0 }}>
                  + {combinacoes.length - 8} outras combinações disponíveis.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="forge-recipes">
          <h3>📜 Receitas especiais</h3>
          <div className="forge-recipe-list">
            {receitasEspeciais.map((r) => {
              const a = getGemaById(r.a);
              const b = getGemaById(r.b);
              const res = getGemaById(r.resultado);
              const temA = pedras.some((p) => p.id === r.a && !['bruta', 'destruida'].includes(p.estado));
              const temB = pedras.some((p) => p.id === r.b && !['bruta', 'destruida'].includes(p.estado));
              return (
                <div className="forge-recipe" key={r.resultado}>
                  <span>
                    <strong>{a?.nome || r.a}</strong> + <strong>{b?.nome || r.b}</strong> →{' '}
                    <strong>{res?.nome || r.resultado}</strong>
                  </span>
                  <span className={temA && temB ? 'forge-ok' : 'muted'}>
                    {temA && temB ? '✅ Você tem as duas!' : 'Faltam gemas (ou precisam ser polidas)'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>

      {/* Polidor de pedras — abre ao clicar numa gema polível */}
      {polindoGema && (
        <GemPolisher
          gema={polindoGema}
          ouro={ouro}
          mana={mana}
          jogador={player || {}}
          onOuroChange={setOuro}
          onManaChange={onRefresh}
          onEstadoChange={aoMudarEstado}
          onPolir={polirNoServidor}
          onClose={() => setPolindoGema(null)}
        />
      )}
    </div>
  );
}
