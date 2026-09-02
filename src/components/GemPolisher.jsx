import { useEffect, useRef, useState } from 'react';
import {
  NIVEIS_POLIMENTO,
  nivelInfo,
  gemaPolivel,
  polirPedra,
} from '../game/gems.js';

const ICONES_NIVEL = { destruida: '💥', bruta: '🪨', lapidada: '💎', polido: '💠', perfeita: '🌟' };
const CADEIA = ['bruta', 'lapidada', 'polido', 'perfeita'];

export default function GemPolisher({ gema, ouro = 0, onOuroChange, onEstadoChange, onClose }) {
  const [progresso, setProgresso] = useState(0);
  const [polindo, setPolindo] = useState(false);
  const [toast, setToast] = useState(null);
  const [estadoLocal, setEstadoLocal] = useState(gema?.estado);
  const timer = useRef(null);

  const atual = gema ? nivelInfo(estadoLocal) : null;
  const proximo = gema && atual?.proximoNivel ? NIVEIS_POLIMENTO[atual.proximoNivel] : null;
  const polivel = !!gema && gemaPolivel(estadoLocal);
  const passouNoOuro = atual && ouro >= atual.custoOuro;
  const duracaoMs = 2000;

  useEffect(() => {
    return () => clearInterval(timer.current);
  }, []);

  if (!gema || !atual) return null;

  const mostrarToast = (msg, tipo) => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2600);
  };

  const handlePolir = () => {
    if (!polivel || polindo) return;
    if (!passouNoOuro) {
      mostrarToast(`❌ Ouro insuficiente (precisa de ${atual.custoOuro})`, 'erro');
      return;
    }
    setPolindo(true);
    setProgresso(0);

    const inicio = Date.now();
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - inicio) / duracaoMs) * 100);
      setProgresso(p);
      if (p >= 100) {
        clearInterval(timer.current);
        const resultado = polirPedra(gema, ouro);
        if (resultado.ok) {
          if (onOuroChange) onOuroChange(resultado.ouroRestante);
          setEstadoLocal(resultado.estadoNovo);
          if (onEstadoChange) onEstadoChange(gema.id, resultado.estadoNovo);
          mostrarToast(
            resultado.sucesso ? '✅ Pedra polida com sucesso!' : '❌ Falha no polimento!',
            resultado.sucesso ? 'sucesso' : 'erro'
          );
        } else {
          mostrarToast(resultado.motivo || '❌ Não foi possível polir.', 'erro');
        }
        setPolindo(false);
      }
    }, 50);
  };

  const handleFechar = () => {
    clearInterval(timer.current);
    onClose();
  };

  const corAtual = atual.corVisual;
  const corProximo = proximo ? proximo.corVisual : corAtual;
  const pctMultiplicador = (m) => Math.round((m || 0) * 100);
  const idxAtual = CADEIA.indexOf(estadoLocal);

  return (
    <div className="modal-backdrop" onClick={handleFechar}>
      <div className="polisher-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Coluna esquerda: a "bancada de polimento" ── */}
        <aside className="polisher-bench">
          <div className="polisher-gem-orbit" style={{ ['--c' ]: corAtual }}>
            <div className="polisher-gem" style={{ color: corAtual, borderColor: corAtual }}>
              {ICONES_NIVEL[estadoLocal] || '💎'}
            </div>
            <div className="polisher-gem-ring" style={{ borderColor: corAtual }} />
          </div>

          <div className="polisher-gem-nome">{gema.nome}</div>
          <span className="polisher-gem-tag" style={{ borderColor: corAtual, color: corAtual }}>
            {atual.nome} · {pctMultiplicador(atual.multiplicadorEfeito)}% efeito
          </span>

          {/* Fases de polimento */}
          <div className="polisher-track">
            {CADEIA.map((lvl, i) => {
              const info = NIVEIS_POLIMENTO[lvl];
              const estado = i < idxAtual ? 'done' : i === idxAtual ? 'current' : 'todo';
              return (
                <div key={lvl} className="polisher-phase">
                  <div
                    className={`polisher-phase-dot ${estado}`}
                    style={estado === 'current' ? { background: info.corVisual, boxShadow: `0 0 12px ${info.corVisual}` } : estado === 'done' ? { background: info.corVisual } : {}}
                  >
                    {estado === 'done' ? '✓' : ICONES_NIVEL[lvl]}
                  </div>
                  <small style={i === idxAtual ? { color: info.corVisual, fontWeight: 700 } : {}}>{info.nome}</small>
                  {i < CADEIA.length - 1 && <div className="polisher-track-line" />}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Coluna direita: informações e controles ── */}
        <section className="polisher-panel">
          <button className="modal-close" onClick={handleFechar}>✕</button>

          <h2>Polimento da Pedra</h2>
          <p className="polisher-subtitle">Leve a gema ao próximo nível para ampliar seus efeitos.</p>

          {polivel && proximo ? (
            <>
              <div className="polisher-vs">
                <div className="polisher-vs-card" style={{ borderColor: corAtual }}>
                  <strong style={{ color: corAtual }}>{atual.nome}</strong>
                  <small>{pctMultiplicador(atual.multiplicadorEfeito)}%</small>
                </div>
                <span className="polisher-vs-arrow">→</span>
                <div className="polisher-vs-card next" style={{ borderColor: corProximo, background: `radial-gradient(circle at 50% 0%, ${corProximo}26, transparent 70%)` }}>
                  <strong style={{ color: corProximo }}>{proximo.nome}</strong>
                  <small>{pctMultiplicador(proximo.multiplicadorEfeito)}%</small>
                </div>
              </div>

              <div className="polisher-custos">
                <div className="polisher-custo">
                  <span className="polisher-custo-label">Custo</span>
                  <span className={`polisher-custo-val ${ouro >= atual.custoOuro ? '' : 'carente'}`}>🪙 {atual.custoOuro}</span>
                </div>
                <div className="polisher-custo">
                  <span className="polisher-custo-label">Tempo</span>
                  <span className="polisher-custo-val">⏳ {atual.tempoHoras}h</span>
                </div>
                <div className="polisher-custo">
                  <span className="polisher-custo-label">Chance</span>
                  <span className="polisher-custo-val">🎲 {atual.chanceSucesso}%</span>
                </div>
              </div>

              <div className="polisher-multiplier">
                Efeito: <strong style={{ color: corAtual }}>{pctMultiplicador(atual.multiplicadorEfeito)}%</strong>
                <span className="polisher-multiplier-arrow">→</span>
                <strong style={{ color: corProximo }}>{pctMultiplicador(proximo.multiplicadorEfeito)}%</strong>
              </div>

              <div className="polisher-progress-wrap">
                <div
                  className="polisher-progress"
                  style={{ width: `${progresso}%`, background: `linear-gradient(90deg, ${corAtual}, ${corProximo})` }}
                />
                {polindo && <span className="polisher-progress-pct">{Math.round(progresso)}%</span>}
              </div>

              {polindo && <p className="polisher-status">Polindo a pedra... 👷🔨</p>}

              <div className="polisher-actions">
                <button className="ghost" onClick={handleFechar} disabled={polindo}>Cancelar</button>
                <button className="polisher-polir" onClick={handlePolir} disabled={polindo || !passouNoOuro}>
                  {polindo ? 'Polindo...' : `Polir por ${atual.custoOuro} 🪙`}
                </button>
              </div>

              {passouNoOuro === false && (
                <p className="polisher-erro">Você não tem ouro suficiente para este polimento.</p>
              )}
            </>
          ) : (
            <p className="muted">
              {estadoLocal === 'perfeita'
                ? 'Esta pedra já está no nível máximo de polimento.'
                : estadoLocal === 'destruida'
                ? 'Esta pedra foi destruída e não pode ser polida.'
                : 'Este nível não pode ser polido.'}
            </p>
          )}
        </section>

        {/* Toast de feedback */}
        {toast && <div className={`polisher-toast ${toast.tipo}`}>{toast.msg}</div>}
      </div>
    </div>
  );
}
