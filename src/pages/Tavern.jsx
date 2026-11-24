import { useEffect, useMemo, useState } from 'react';
import { api, isOffline } from '../api.js';
import { formatCoins } from '../game/tools.js';
import { STATUS_DEFS, TAVERN_CATEGORIES } from '../game/data.js';

const EFEITO_CHIP = {
  cura: '❤️',
  mana: '🔵',
  buffFisico: '💪',
  buffMagico: '✨',
  status: '🌿',
  removeStatus: '🧹',
  drunk: '🍺',
  resistencia: '🛡️',
  velocidade: '💨',
  dano: '⚔️',
};

// Buffs exclusivos dos sucos de teste (o motor só usa dano; os demais ficam
// registrados como efeito de teste, sem virar regra geral de combate).
const BUFF_TESTE_LABEL = {
  resistenciaFisica: ['resistência física', 'resistencia'],
  resistenciaMagica: ['resistência mágica', 'resistencia'],
  resistenciaVeneno: ['resistência a venenos', 'resistencia'],
  velocidade: ['velocidade', 'velocidade'],
  danoFisico: ['dano físico', 'dano'],
  danoMagico: ['dano mágico', 'dano'],
};

function rotuloStatus(id) {
  const s = STATUS_DEFS[id];
  return s ? `${s.icon} ${s.nome}` : id;
}

// Busca tolerante a acento, caixa e espaços: "laranja", "LARANJA" e
// "laranja revigorante" encontram o mesmo item.
function normalizarTexto(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function nomeCategoria(id) {
  return TAVERN_CATEGORIES.find((c) => c.id === id)?.nome || '';
}

// Resume os efeitos de uma bebida em etiquetas legíveis.
function efeitosDaBebida(b) {
  const out = [];
  if (b.cura) out.push({ k: 'cura', txt: `+${b.cura} HP` });
  if (b.mana) out.push({ k: 'mana', txt: `+${b.mana} MP` });
  if (b.buffFisico) out.push({ k: 'buffFisico', txt: `+${Math.round(b.buffFisico * 100)}% dano físico (${b.buffTurns || 3}t)` });
  if (b.buffMagico) out.push({ k: 'buffMagico', txt: `+${Math.round(b.buffMagico * 100)}% dano mágico (${b.buffTurns || 3}t)` });
  if (b.status) out.push({ k: 'status', txt: `Regenera ${b.status.dano} HP/turno (${b.status.turnos}t)` });
  if (b.removeStatus) {
    const arr = Array.isArray(b.removeStatus) ? b.removeStatus : [b.removeStatus];
    out.push({ k: 'removeStatus', txt: `Limpa ${arr.map(rotuloStatus).join(', ')}` });
  }
  if (b.drunk) out.push({ k: 'drunk', txt: `Embriaga (${b.drunkTurns || 3}t): +1 FOR, −1 DEX/REF` });
  // Sucos de teste: recuperação em % da máxima e buffs com duração em turnos.
  if (b.curaPctVidaMaxima) out.push({ k: 'cura', txt: `+${b.curaPctVidaMaxima}% Vida máx. (instantâneo)` });
  if (b.manaPctMaxima) out.push({ k: 'mana', txt: `+${b.manaPctMaxima}% Mana máx. (instantâneo)` });
  if (b.buffsTeste) {
    for (const [chave, valor] of Object.entries(b.buffsTeste)) {
      const info = BUFF_TESTE_LABEL[chave];
      if (!info || !valor) continue;
      out.push({ k: info[1], txt: `+${Math.round(valor * 100)}% ${info[0]} (${b.buffTurns || 1}t)` });
    }
  }
  return out;
}

export default function Tavern({ player, characters = [], onBack, onRefresh, onWalletChange }) {
  const [items, setItems] = useState(null);
  const [carteira, setCarteira] = useState(0);
  const [charId, setCharId] = useState(characters[0]?.id || '');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filtro, setFiltro] = useState('tudo');
  const [busca, setBusca] = useState('');

  const alerta = (msg, tipo) => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let alive = true;
    api.getTavern().then((d) => {
      if (alive) setItems(d?.items || {});
    }).catch(() => alive && setItems({}));
    api.getWallet().then((d) => {
      if (!alive) return;
      const cents = d && d.wallet && typeof d.wallet === 'object' ? d.wallet.cents : Number(d?.wallet) || 0;
      setCarteira(cents);
      if (onWalletChange) onWalletChange(cents);
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lista = useMemo(() => Object.entries(items || {}).map(([id, b]) => ({ id, ...b })), [items]);

  const termos = useMemo(
    () => normalizarTexto(busca).split(/\s+/).filter(Boolean),
    [busca],
  );

  // Filtro rápido (tudo/bebidas/comidas) combinado com a busca textual.
  const listaFiltrada = useMemo(() => {
    let out = lista;
    if (filtro !== 'tudo') out = out.filter((b) => (b.tipo || 'bebida') === filtro);
    if (termos.length === 0) return out;
    return out.filter((b) => {
      const texto = normalizarTexto([
        b.nome,
        b.id,
        b.desc,
        nomeCategoria(b.categoria),
        b.tipo,
        b.qualidade,
        b.tier,
        b.sucoTeste ? 'teste suco laranja' : '',
        ...efeitosDaBebida(b).map((e) => e.txt),
      ].join(' '));
      return termos.every((t) => texto.includes(t));
    });
  }, [lista, filtro, termos]);

  const destaque = useMemo(() => listaFiltrada.find((b) => b.destaque) || null, [listaFiltrada]);

  // Agrupa o menu pelas seções da taverna (o destaque sai da grade normal).
  const grupos = useMemo(() => {
    const porCat = {};
    for (const b of listaFiltrada) {
      if (b.destaque) continue;
      const id = b.categoria || 'outros';
      (porCat[id] = porCat[id] || []).push(b);
    }
    const cats = TAVERN_CATEGORIES
      .map((c) => ({ ...c, itens: porCat[c.id] || [] }))
      .filter((g) => g.itens.length > 0);
    if (porCat.outros) cats.push({ id: 'outros', nome: 'Outros Itens', icon: '🍶', blurb: 'O que sobrou no balcão.', itens: porCat.outros });
    return cats;
  }, [listaFiltrada]);

  const comprar = async (bebida) => {
    if (!charId) {
      alerta('❌ Escolha um personagem para guardar o item.', 'erro');
      return;
    }
    if (carteira < bebida.preco) {
      alerta(`❌ Faltam ${formatCoins(bebida.preco - carteira)} para ${bebida.nome}.`, 'erro');
      return;
    }
    setBusy(true);
    try {
      await api.buyDrink(bebida.id, charId);
      const nova = Math.max(0, carteira - bebida.preco);
      setCarteira(nova);
      if (onWalletChange) onWalletChange(nova);
      if (onRefresh) await onRefresh();
      alerta(`✅ ${bebida.emoji || '🍺'} ${bebida.nome} guardado na mochila!`, 'sucesso');
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    } finally {
      setBusy(false);
    }
  };

  const cardBebida = (b, destacada = false) => {
    const semMoedas = carteira < b.preco;
    const semChar = !charId;
    const bloqueado = semMoedas || semChar || busy;
    return (
      <div className={`tavern-card${destacada ? ' is-featured' : ''}`} key={b.id}>
        <div className="tavern-card-head">
          <span className="tavern-card-icon">{b.emoji || (b.tipo === 'comida' ? '🍽️' : '🍺')}</span>
          <strong>{b.nome}</strong>
          <span className="tavern-kind">{b.tipo === 'comida' ? '🍽️ Comida' : '🍺 Bebida'}</span>
        </div>
        {b.sucoTeste && (
          <div className="tavern-test-head">
            <span className="tavern-quality" data-quality={String(b.qualidade || 'comum').toLowerCase()}>
              {b.qualidade} · {b.tier}
            </span>
            <span className="tavern-test-badge" title="Conteúdo de teste do Último Copo">TESTE</span>
          </div>
        )}
        <p className="tavern-card-desc">{b.desc}</p>
        <div className="tavern-card-tags">
          {efeitosDaBebida(b).map((e, i) => (
            <span className="tavern-tag" key={i}>
              {EFEITO_CHIP[e.k] || '•'} {e.txt}
            </span>
          ))}
        </div>
        <div className="tavern-card-footer">
          <span
            className={`tavern-price${b.precoTeste ? ' is-test' : ''}`}
            title={b.precoTeste ? 'Preço provisório de teste' : undefined}
          >
            {formatCoins(b.preco)}{b.precoTeste ? ' (teste)' : ''}
          </span>
          <button
            className="tavern-buy"
            onClick={() => comprar(b)}
            disabled={bloqueado}
            title={semChar ? 'Escolha um personagem' : semMoedas ? 'Moedas insuficientes' : ''}
          >
            Comprar
          </button>
        </div>
        {semMoedas && <p className="tool-limit">Faltam {formatCoins(b.preco - carteira)}</p>}
      </div>
    );
  };

  return (
    <main className="page tavern-page">
      <header className="topbar">
        <div>
          <h1>🍺 O Último Copo</h1>
          <span className="player-name">Taverna · Bebidas e comidas para a próxima batalha</span>
        </div>
        <div className="topbar-actions">
          <span className="wallet-chip" title="Sua carteira">💰 {formatCoins(carteira)}</span>
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <div className="tavern-sign">
          <span className="tavern-sign-icon" aria-hidden="true">🍻</span>
          <div className="tavern-sign-text">
            <strong>Bem-vindo ao Último Copo</strong>
            <p>
              O taverneiro enxuga uma caneca e acena: — Sente-se, forasteiro. Temos o que cura,
              o que fortalece, o que enche a barriga e o que se arrepende amanhã.
            </p>
          </div>
        </div>

        <div className="tavern-head">
          <label>
            <span className="muted small">Guardar em:</span>
            <select value={charId} onChange={(e) => setCharId(e.target.value)}>
              {characters.length === 0 && <option value="">Nenhum personagem</option>}
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <p className="muted small">
            O que você comprar vai para o inventário do personagem e pode ser usado na aba{' '}
            <strong>Item</strong> durante a batalha. <em>Pendure o casaco e escolha o que vai te acompanhar na próxima batalha.</em>
          </p>
        </div>

        <div className="tavern-filters">
          <div className="tavern-search">
            <span className="tavern-search-icon" aria-hidden="true">🔎</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setBusca(''); }}
              placeholder="Buscar item, efeito ou categoria…"
              aria-label="Buscar no cardápio da taverna"
            />
            {busca && (
              <button
                type="button"
                className="tavern-search-clear"
                onClick={() => setBusca('')}
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
          <button className={`ghost${filtro === 'tudo' ? ' is-active' : ''}`} onClick={() => setFiltro('tudo')}>Tudo</button>
          <button className={`ghost${filtro === 'bebida' ? ' is-active' : ''}`} onClick={() => setFiltro('bebida')}>🍺 Bebidas</button>
          <button className={`ghost${filtro === 'comida' ? ' is-active' : ''}`} onClick={() => setFiltro('comida')}>🍽️ Comidas</button>
        </div>

        {items === null ? (
          <p className="muted">Abrindo o balcão…</p>
        ) : (
          <>
            {busca.trim() && listaFiltrada.length > 0 && (
              <p className="muted small tavern-search-count">
                {listaFiltrada.length} {listaFiltrada.length === 1 ? 'item encontrado' : 'itens encontrados'} para “{busca.trim()}”
              </p>
            )}
            {listaFiltrada.length === 0 ? (
              <div className="tavern-empty">
                <p className="muted">
                  {busca.trim()
                    ? `Nenhum item encontrado para “${busca.trim()}”.`
                    : 'A taverna está vazia hoje.'}
                </p>
                {busca.trim() && (
                  <button className="ghost" onClick={() => { setBusca(''); setFiltro('tudo'); }}>
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <>
                {destaque && (
                  <section className="tavern-section tavern-featured">
                    <div className="tavern-section-head">
                      <h2>⭐ Sugestão do Taverneiro</h2>
                      <p className="muted small">A bebida que o balcão recomenda hoje — pelo bem ou pelo mal.</p>
                    </div>
                    <div className="tavern-grid">
                      {cardBebida(destaque, true)}
                    </div>
                  </section>
                )}

                {grupos.map((g) => (
                  <section className="tavern-section" key={g.id}>
                    <div className="tavern-section-head">
                      <h2>{g.icon} {g.nome}</h2>
                      {g.blurb && <p className="muted small">{g.blurb}</p>}
                    </div>
                    <div className="tavern-grid">
                      {g.itens.map((b) => cardBebida(b))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </>
        )}

        <p className="muted small tavern-foot">
          Jogador: {player?.name || 'Jogador'}
          {isOffline() ? ' · modo offline (salvo no navegador)' : ''}
          {' '}· 📜 Bebeu demais? O efeito de embriaguez passa em alguns turnos de combate.
          {' '}Comida regenera e sustenta — mas não embriaga.
          {' '}🍊 Os sucos de laranja são itens de teste: curam em % da máxima, não acumulam buffs entre si e duram turnos de combate; preços são provisórios.
        </p>
      </div>
    </main>
  );
}