import { useEffect, useRef, useState } from 'react';
import {
  NIVEIS_POLIMENTO,
  nivelInfo,
  gemaPolivel,
  polirPedra,
} from '../game/gems.js';

const ICONES_NIVEL = { destruida: '💥', bruta: '🪨', lapidada: '💎', polido: '💠', perfeita: '🌟' };

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

  // Duração da barra: tempo real em horas acelerado para ~2s na UI.
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
        // Conclui o polimento usando a chance de sucesso do nível.
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

  return (
    <div className="modal-backdrop" onClick={handleFechar}>
      <div className="modal polisher-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho da pedra */}
        <div className="polisher-head" style={{ borderColor: corAtual }}>
          <span className="polisher-icon" style={{ color: corAtual }}>{ICONES_NIVEL[estadoLocal] || '💎'}</span>
          <div>
            <h2>{gema.nome}</h2>
            <span className="tag" style={{ borderColor: corAtual, color: corAtual }}>
              {atual.nome} ({pctMultiplicador(atual.multiplicadorEfeito)}% efeito)
            </span>
          </div>
          <button className="modal-close" onClick={handleFechar}>✕</button>
        </div>

        {/* Informações do próximo nível */}
        {polivel && proximo ? (
          <>
            <div className="polisher-levels">
              <div className="polisher-level current" style={{ borderColor: corAtual, boxShadow: `0 0 14px ${corAtual}55` }}>
                <span className="polisher-level-icon">{ICONES_NIVEL[estadoLocal]}</span>
                <strong style={{ color: corAtual }}>{atual.nome}</strong>
                <small>{pctMultiplicador(atual.multiplicadorEfeito)}%</small>
              </div>
              <div className="polisher-arrow">→</div>
              <div className="polisher-level next" style={{ borderColor: corProximo, boxShadow: `0 0 16px ${corProximo}66` }}>
                <span className="polisher-level-icon">{ICONES_NIVEL[atual.proximoNivel] || '💎'}</span>
                <strong style={{ color: corProximo }}>{proximo.nome}</strong>
                <small>{pctMultiplicador(proximo.multiplicadorEfeito)}%</small>
              </div>
            </div>

            <div className="polisher-multiplier">
              Multiplicador de efeito: {pctMultiplicador(atual.multiplicadorEfeito)}% → {pctMultiplicador(proximo.multiplicadorEfeito)}%
            </div>

            <div className="polisher-custos">
              <div className="polisher-custo">
                <span className="polisher-custo-label">Custo em ouro</span>
                <span className={`polisher-custo-val ${ouro >= atual.custoOuro ? '' : 'carente'}`}>
                  🪙 {atual.custoOuro}
                </span>
              </div>
              <div className="polisher-custo">
                <span className="polisher-custo-label">Tempo</span>
                <span className="polisher-custo-val">⏳ {atual.tempoHoras} h</span>
              </div>
              <div className="polisher-custo">
                <span className="polisher-custo-label">Chance de sucesso</span>
                <span className="polisher-custo-val">🎲 {atual.chanceSucesso}%</span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="polisher-progress-wrap">
              <div
                className="polisher-progress"
                style={{ width: `${progresso}%`, background: `linear-gradient(90deg, ${corAtual}, ${corProximo})` }}
              />
              {polindo && <span className="polisher-progress-pct">{Math.round(progresso)}%</span>}
            </div>

            {polindo && <p className="polisher-status muted">Polindo a pedra... 👷🔨</p>}

            <div className="modal-actions">
              <button className="ghost" onClick={handleFechar} disabled={polindo}>Cancelar</button>
              <button onClick={handlePolir} disabled={polindo || !passouNoOuro}>
                {polindo ? 'Polindo...' : `Polir (${atual.custoOuro} 🪙)`}
              </button>
            </div>

            {passouNoOuro === false && (
              <p className="polisher-erro">Ouro insuficiente para este polimento.</p>
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

        {/* Toast de feedback */}
        {toast && (
          <div className={`polisher-toast ${toast.tipo}`}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}
