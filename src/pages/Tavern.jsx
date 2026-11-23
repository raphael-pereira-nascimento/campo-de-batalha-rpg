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
};

function rotuloStatus(id) {
  const s = STATUS_DEFS[id];
  return s ? `${s.icon} ${s.nome}` : id;
}

const SUCO_BUFF_LABEL = {
  resistenciaFisica: 'resistência física',
  resistenciaMagica: 'resistência mágica',
  resistenciaVeneno: 'resistência a venenos',
  velocidade: 'velocidade',
  danoFisico: 'dano físico',
  danoMagico: 'dano mágico',
};

// Resume os efeitos de uma bebida em etiquetas legíveis.
function efeitosDaBebida(b) {
  const out = [];
  if (b.curaPct) out.push({ k: 'cura', txt: `+${b.curaPct}% da Vida máxima` });
  if (b.cura) out.push({ k: 'cura', txt: `+${b.cura} HP` });
  if (b.manaPct) out.push({ k: 'mana', txt: `+${b.manaPct}% da Mana máxima` });
  if (b.mana) out.push({ k: 'mana', txt: `+${b.mana} MP` });
  if (b.buffFisico) out.push({ k: 'buffFisico', txt: `+${Math.round(b.buffFisico * 100)}% dano físico (${b.buffTurns || 3}t)` });
  if (b.buffMagico) out.push({ k: 'buffMagico', txt: `+${Math.round(b.buffMagico * 100)}% dano mágico (${b.buffTurns || 3}t)` });
  if (b.sucoBuffs && typeof b.sucoBuffs === 'object') {
    for (const [k, v] of Object.entries(b.sucoBuffs)) {
      const label = SUCO_BUFF_LABEL[k] || k;
      const icon = k.startsWith('dano') ? (k === 'danoMagico' ? 'buffMagico' : 'buffFisico') : 'status';
      out.push({ k: icon, txt: `+${v}% ${label}` });
    }
  }
  if (b.status) out.push({ k: 'status', txt: `Regenera ${b.status.dano} HP/turno (${b.status.turnos}t)` });
  if (b.removeStatus) {
    const arr = Array.isArray(b.removeStatus) ? b.removeStatus : [b.removeStatus];
    out.push({ k: 'removeStatus', txt: `Limpa ${arr.map(rotuloStatus).join(', ')}` });
  }
  if (b.drunk) out.push({ k: 'drunk', txt: `Embriaga (${b.drunkTurns || 3}t): +1 FOR, −1 DEX/REF` });
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

  // Filtro rápido: tudo, só bebidas ou só comidas + busca textual.
  const listaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((b) => {
      if (filtro !== 'tudo' && (b.tipo || 'bebida') !== filtro) return false;
      if (!q) return true;
      const texto = [
        b.nome,
        b.desc,
        b.categoria,
        b.qualidade,
        b.tipo,
        ...(Array.isArray(b.removeStatus) ? b.removeStatus : b.removeStatus ? [b.removeStatus] : []),
      ].filter(Boolean).join(' ').toLowerCase();
      return texto.includes(q);
    });
  }, [lista, filtro, busca]);

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
    const temBuffs = Boolean(b.buffFisico || b.buffMagico || (b.sucoBuffs && Object.keys(b.sucoBuffs).length > 0));
    const duracaoBuffs = temBuffs ? (b.buffTurns || 3) : null;
    const qualidadeClass = b.qualidade ? ` quality-${String(b.qualidade).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}` : '';
    return (
      <div className={`tavern-card${destacada ? ' is-featured' : ''}${b.testeUltimoCopo ? ' is-test-item' : ''}${qualidadeClass}`} key={b.id}>
        <div className="tavern-card-head">
          <span className="tavern-card-icon tavern-card-img-placeholder" title="Imagem / espaço reservado">
            {b.emoji || (b.tipo === 'comida' ? '🍽️' : '🍺')}
          </span>
          <strong>{b.nome}</strong>
          <span className="tavern-kind">{b.tipo === 'comida' ? '🍽️ Comida' : '🍺 Bebida'}</span>
        </div>
        {(b.qualidade || b.testeUltimoCopo) && (
          <div className="tavern-card-tags" style={{ marginBottom: 6 }}>
            <span className="tavern-tag">📂 Categoria: {b.tipo === 'comida' ? 'Comida' : 'Bebida'}</span>
            {b.qualidade && <span className="tavern-tag">🏷️ Qualidade: {b.qualidade}</span>}
            {b.testeUltimoCopo && <span className="tavern-tag">🧪 Item de teste</span>}
          </div>
        )}
        <p className="tavern-card-desc">{b.desc}</p>
        <div className="tavern-card-tags">
          {efeitosDaBebida(b).map((e, i) => (
            <span className="tavern-tag" key={i}>
              {EFEITO_CHIP[e.k] || '•'} {e.txt}
            </span>
          ))}
          {duracaoBuffs && <span className="tavern-tag">⏱️ Duração dos buffs: {duracaoBuffs} turnos</span>}
          {!temBuffs && b.testeUltimoCopo && <span className="tavern-tag">⏱️ Recuperação instantânea</span>}
        </div>
        <div className="tavern-card-footer">
          <span className="tavern-price">
            {formatCoins(b.preco)}
            {b.precoTeste ? <span className="muted small"> (teste)</span> : null}
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
          <label style={{ flex: 1, minWidth: 220 }}>
            <span className="muted small">Pesquisar bebida/comida</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: suco de laranja, hidromel, cura..."
              aria-label="Pesquisar bebida ou comida na taverna"
              style={{ width: '100%' }}
            />
          </label>
          <p className="muted small">
            O que você comprar vai para o inventário do personagem e pode ser usado na aba{' '}
            <strong>Item</strong> durante a batalha. <em>Pendure o casaco e escolha o que vai te acompanhar na próxima batalha.</em>
          </p>
        </div>

        <div className="tavern-filters">
          <button className={`ghost${filtro === 'tudo' ? ' is-active' : ''}`} onClick={() => setFiltro('tudo')}>Tudo</button>
          <button className={`ghost${filtro === 'bebida' ? ' is-active' : ''}`} onClick={() => setFiltro('bebida')}>🍺 Bebidas</button>
          <button className={`ghost${filtro === 'comida' ? ' is-active' : ''}`} onClick={() => setFiltro('comida')}>🍽️ Comidas</button>
        </div>

        {items === null ? (
          <p className="muted">Abrindo o balcão…</p>
        ) : listaFiltrada.length === 0 ? (
          <p className="muted">
            {busca.trim() ? `Nenhum item encontrado para "${busca.trim()}".` : 'A taverna está vazia hoje.'}
          </p>
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

        <p className="muted small tavern-foot">
          Jogador: {player?.name || 'Jogador'}
          {isOffline() ? ' · modo offline (salvo no navegador)' : ''}
          {' '}· 📜 Bebeu demais? O efeito de embriaguez passa em alguns turnos de combate.
          {' '}Comida regenera e sustenta — mas não embriaga.
        </p>
      </div>
    </main>
  );
}