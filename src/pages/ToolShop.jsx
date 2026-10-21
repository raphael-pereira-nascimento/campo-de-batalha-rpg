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
import { api } from '../api.js';

const ICONE_TRACKER = { peso: '🏋️', espacos: '🎒', usos: '🔧' };

export default function ToolShop({ jogador, localAtual = 'Porto Ferro', onComprar, onBack, character, player, onRefresh }) {
  const [local, setLocal] = useState(localAtual);
  const [carteira, setCarteira] = useState(typeof jogador?.carteira === 'number' ? jogador.carteira : 0);
  const [inventario, setInventario] = useState(jogador?.inventario || []);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('tools');
  const [gemasLoja, setGemasLoja] = useState([]);
  const [minerar, setMinerar] = useState({ veios: [] });
  const [mining, setMining] = useState(false);
  const characterId = character?.id || jogador?.characterId || null;

  const limitePeso = jogador?.limitePeso ?? 40;
  const limiteEspacos = jogador?.limiteEspacos ?? 20;

  const tools = useMemo(() => getToolsPorLocal(local), [local]);

  const pesoAtual = inventario.reduce((s, i) => s + (i.peso || 0), 0);
  const espacosAtuais = inventario.reduce((s, i) => s + (i.espacos || 0), 0);

  const alerta = (msg, tipo) => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (tab === 'gems') {
      api.getGemsCatalog?.().then((d) => setGemasLoja(d.gems || [])).catch(() => {});
    }
    if (tab === 'mine') {
      api.getGemsCatalog?.().then((d) => setMinerar((m) => ({ ...m, veios: d.veios || [] }))).catch(() => {});
    }
  }, [tab]);

  const comprarGema = async (g) => {
    if (!characterId) return alerta('Selecione um personagem na tela de Personagens.', 'erro');
    try {
      await api.buyGem?.(characterId, g.id);
      alerta(`💎 ${g.nome} adicionada ao inventário!`, 'sucesso');
      if (onRefresh) onRefresh();
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    }
  };

  const minerarGema = async (veioId) => {
    if (!characterId) return alerta('Selecione um personagem na tela de Personagens.', 'erro');
    setMining(true);
    try {
      const res = await api.mineGem?.(characterId, veioId);
      alerta(`⛏️ Minerou: ${res.gemId}!`, 'sucesso');
      if (onRefresh) onRefresh();
    } catch (e) {
      alerta(`❌ ${e.message}`, 'erro');
    } finally {
      setMining(false);
    }
  };

  const comprar = (ferramenta) => {
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

    const item = {
      id: ferramenta.id,
      nome: ferramenta.nome,
      tipo: ferramenta.tipo,
      peso: ferramenta.peso,
      espacos: ferramenta.espacos,
      usos: ferramenta.usos,
      raridade: ferramenta.raridade,
    };
    setCarteira((c) => c - preco);
    setInventario((inv) => [...inv, item]);
    if (onComprar) onComprar(ferramenta, preco);
    alerta(`✅ ${ferramenta.nome} adicionado ao inventário!`, 'sucesso');
  };

  return (
    <div className="page tools-shop-page">
      <header className="topbar">
        <div>
          <h1>🛠️ Loja</h1>
          <span className="player-name">Ferramentas, Gemas e Mineração</span>
        </div>
        <div className="topbar-actions">
          <span className="wallet-chip" title="Sua carteira">💰 {formatCoins(carteira)}</span>
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
        <div className="shop-tabs">
          <button className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>🛠️ Ferramentas</button>
          <button className={tab === 'gems' ? 'active' : ''} onClick={() => setTab('gems')}>💎 Loja de Gemas</button>
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>⛏️ Minerar</button>
        </div>

        {tab === 'gems' && (
          <section className="panel">
            <h2>💎 Loja de Gemas</h2>
            <p className="muted">Compre gemas com ouro. Gemas compradas vêm brutas — use a Forja para polir/fundir.</p>
            <div className="shop-grid">
              {gemasLoja.map((g) => (
                <article className="shop-card" key={g.id}>
                  <header>
                    <h3>💎 {g.nome}</h3>
                    <span className="rarity" data-rarity={g.raridade}>{g.raridade}</span>
                  </header>
                  <p className="desc">Bioma: {g.bioma} · Estado: {g.estado}</p>
                  <footer>
                    <span className="price">💰 {g.preco || 250} moedas</span>
                    <button onClick={() => comprarGema(g)} disabled={!characterId}>Comprar</button>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'mine' && (
          <section className="panel">
            <h2>⛏️ Mineração</h2>
            <p className="muted">As 3 formas: botão com cooldown, veios/biomas e integrado às masmorras. Escolha um veio e mine gemas brutas.</p>
            <div className="shop-grid">
              {(minerar.veios || []).map((v) => (
                <article className="shop-card" key={v.id}>
                  <header>
                    <h3>⛏️ {v.nome}</h3>
                    <span className="rarity">Cooldown {v.cooldownMin} min</span>
                  </header>
                  <p className="desc">Biomas: {(v.biomas || []).join(', ')} · Bônus raro: +{v.chanceBonus}%</p>
                  <footer>
                    <span className="price">{v.custoCents > 0 ? `💰 ${v.custoCents} moedas` : 'Grátis'}</span>
                    <button onClick={() => minerarGema(v.id)} disabled={mining || !characterId}>{mining ? 'Minerando...' : 'Minerar'}</button>
                  </footer>
                </article>
              ))}
            </div>
            <p className="muted small">Dica: Nas dungeons também há chance de encontrar veios profundos (drop integrado).</p>
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
