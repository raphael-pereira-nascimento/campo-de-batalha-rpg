import { useEffect, useMemo, useState } from 'react';
import { api, isOffline } from '../api.js';
import { formatCoins } from '../game/tools.js';

const EFEITO_CHIP = {
  cura: '❤️',
  mana: '🔵',
  buffFisico: '💪',
  buffMagico: '✨',
  status: '🌿',
  removeStatus: '🧹',
  drunk: '🍺',
};

// Resume os efeitos de uma bebida em etiquetas legíveis.
function efeitosDaBebida(b) {
  const out = [];
  if (b.cura) out.push({ k: 'cura', txt: `+${b.cura} HP` });
  if (b.mana) out.push({ k: 'mana', txt: `+${b.mana} MP` });
  if (b.buffFisico) out.push({ k: 'buffFisico', txt: `+${Math.round(b.buffFisico * 100)}% dano físico (${b.buffTurns || 3}t)` });
  if (b.buffMagico) out.push({ k: 'buffMagico', txt: `+${Math.round(b.buffMagico * 100)}% dano mágico (${b.buffTurns || 3}t)` });
  if (b.status) out.push({ k: 'status', txt: `Regenera ${b.status.dano} HP/turno (${b.status.turnos}t)` });
  if (b.removeStatus) out.push({ k: 'removeStatus', txt: 'Limpa efeitos nocivos' });
  if (b.drunk) out.push({ k: 'drunk', txt: `Embriaga (${b.drunkTurns || 3}t): +1 FOR, −1 DEX/REF` });
  return out;
}

export default function Tavern({ player, characters = [], onBack, onRefresh, onWalletChange }) {
  const [items, setItems] = useState(null);
  const [carteira, setCarteira] = useState(0);
  const [charId, setCharId] = useState(characters[0]?.id || '');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

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

  const comprar = async (bebida) => {
    if (!charId) {
      alerta('❌ Escolha um personagem para guardar a bebida.', 'erro');
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
      alerta(`✅ ${bebida.emoji || '🍺'} ${bebida.nome} guardada na mochila!`, 'sucesso');
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page tavern-page">
      <header className="topbar">
        <div>
          <h1>🍺 Taverna</h1>
          <span className="player-name">Bebidas de todo o tipo para a batalha</span>
        </div>
        <div className="topbar-actions">
          <span className="wallet-chip" title="Sua carteira">💰 {formatCoins(carteira)}</span>
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
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
            As bebidas compradas vão para o inventário do personagem e podem ser usadas na aba{' '}
            <strong>Item</strong> durante a batalha.
          </p>
        </div>

        {items === null ? (
          <p className="muted">Abrindo o balcão…</p>
        ) : lista.length === 0 ? (
          <p className="muted">A taverna está vazia hoje.</p>
        ) : (
          <div className="tavern-grid">
            {lista.map((b) => {
              const semMoedas = carteira < b.preco;
              const semChar = !charId;
              const bloqueado = semMoedas || semChar || busy;
              return (
                <div className="tavern-card" key={b.id}>
                  <div className="tavern-card-head">
                    <span className="tavern-card-icon">{b.emoji || '🍺'}</span>
                    <strong>{b.nome}</strong>
                  </div>
                  <p className="tavern-card-desc">{b.desc}</p>
                  <div className="tavern-card-tags">
                    {efeitosDaBebida(b).map((e, i) => (
                      <span className="tavern-tag" key={i}>
                        {EFEITO_CHIP[e.k] || '•'} {e.txt}
                      </span>
                    ))}
                  </div>
                  <div className="tavern-card-footer">
                    <span className="tavern-price">{formatCoins(b.preco)}</span>
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
            })}
          </div>
        )}

        <p className="muted small tavern-foot">
          Jogador: {player?.name || 'Jogador'}
          {isOffline() ? ' · modo offline (salvo no navegador)' : ''}
        </p>
      </div>

      {toast && <div className={`tool-toast ${toast.tipo}`}>{toast.msg}</div>}
    </div>
  );
}
