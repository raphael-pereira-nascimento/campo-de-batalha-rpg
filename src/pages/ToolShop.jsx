import { useMemo, useState } from 'react';
import {
  TOOLS,
  TOOL_RARITY,
  CIDADES,
  getToolsPorLocal,
  precoEmCents,
  formatPreco,
  formatCoins,
} from '../game/tools.js';

const ICONE_TRACKER = { peso: '🏋️', espacos: '🎒', usos: '🔧' };

export default function ToolShop({ jogador, localAtual = 'Porto Ferro', onComprar, onBack }) {
  const [local, setLocal] = useState(localAtual);
  const [carteira, setCarteira] = useState(typeof jogador?.carteira === 'number' ? jogador.carteira : 0);
  const [inventario, setInventario] = useState(jogador?.inventario || []);
  const [toast, setToast] = useState(null);

  // Limites de capacidade do inventário (peso e espaços). Se o jogador não
  // definir, usa limites padrão derivados.
  const limitePeso = jogador?.limitePeso ?? 40;
  const limiteEspacos = jogador?.limiteEspacos ?? 20;

  const tools = useMemo(() => getToolsPorLocal(local), [local]);

  const pesoAtual = inventario.reduce((s, i) => s + (i.peso || 0), 0);
  const espacosAtuais = inventario.reduce((s, i) => s + (i.espacos || 0), 0);

  const alerta = (msg, tipo) => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
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
          <h1>🛠️ Loja de Ferramentas</h1>
          <span className="player-name">Ferramentas de polimento e lapidação</span>
        </div>
        <div className="topbar-actions">
          <span className="wallet-chip" title="Sua carteira">💰 {formatCoins(carteira)}</span>
          <button className="ghost" onClick={onBack}>← Voltar</button>
        </div>
      </header>

      <div className="content">
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
            <span title="Peso">
              {ICONE_TRACKER.peso} {pesoAtual}/{limitePeso} kg
            </span>
            <span title="Espaços">
              {ICONE_TRACKER.espacos} {espacosAtuais}/{limiteEspacos}
            </span>
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

                  <div className="tool-card-stats">
                    <span className="tool-stat" title="Peso">{ICONE_TRACKER.peso} {t.peso}kg</span>
                    <span className="tool-stat" title="Espaços">{ICONE_TRACKER.espacos} {t.espacos} esp.</span>
                    <span className="tool-stat" title="Durabilidade">{ICONE_TRACKER.usos} {t.usos} usos</span>
                  </div>

                  <div className="tool-card-footer">
                    <span className="tool-price" style={{ borderColor: cor, color: cor }}>
                      {formatPreco(t.preco)}
                    </span>
                    <button
                      className="tool-buy"
                      onClick={() => comprar(t)}
                      disabled={bloqueado}
                      title={semMoedas ? 'Moedas insuficientes' : excedePeso ? 'Peso excedido' : excedeEspacos ? 'Espaços insuficientes' : ''}
                    >
                      Comprar
                    </button>
                  </div>

                  {semMoedas && <p className="tool-limit">Faltam {formatCoins(preco - carteira)}</p>}
                  {!semMoedas && excedePeso && <p className="tool-limit">Peso insuficiente no inventário</p>}
                  {!semMoedas && !excedePeso && excedeEspacos && <p className="tool-limit">Sem espaço no inventário</p>}
                </div>
              );
            })}
          </div>
        )}

        {inventario.length > 0 && (
          <div className="tool-inventory">
            <h3>🎒 Seu inventário</h3>
            <div className="tool-inventory-list">
              {inventario.map((it, i) => (
                <span className="tool-inventory-chip" key={i}>
                  {it.nome}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`tool-toast ${toast.tipo}`}>{toast.msg}</div>}
    </div>
  );
}
