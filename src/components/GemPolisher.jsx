import { useEffect, useRef, useState } from 'react';
import {
  NIVEIS_POLIMENTO,
  nivelInfo,
  gemaPolivel,
  polirPedra,
  calcularCustoPolimento,
} from '../game/gems.js';

const ICONES_NIVEL = { destruida: '💥', bruta: '🪨', lapidada: '💎', polido: '💠', perfeita: '🌟' };
const CADEIA = ['bruta', 'lapidada', 'polido', 'perfeita'];

const BENEFICIOS_LAPIDADOR = [
  { badge: '+15%', texto: 'de chance de sucesso' },
  { badge: '-20%', texto: 'de custo de mana' },
  { badge: '✦', texto: 'Falha segura: a pedra não degrada (exceto bruta)' },
];

export default function GemPolisher({
  gema,
  ouro = 0,
  mana = 0,
  jogador = {},
  onOuroChange,
  onManaChange,
  onEstadoChange,
  onPolirFalhaProtegida,
  onClose,
}) {
  const [progresso, setProgresso] = useState(0);
  const [polindo, setPolindo] = useState(false);
  const [toast, setToast] = useState(null);
  const [estadoLocal, setEstadoLocal] = useState(gema?.estado);
  const timer = useRef(null);

  const eLapidador = jogador.profissao === 'Lapidador';

  const atual = gema ? nivelInfo(estadoLocal) : null;
  const proximo = gema && atual?.proximoNivel ? NIVEIS_POLIMENTO[atual.proximoNivel] : null;
  const polivel = !!gema && gemaPolivel(estadoLocal);
  const custo = atual ? calcularCustoPolimento(atual, jogador) : null;
  const passouNoOuro = custo && ouro >= custo.custoOuro;
  const passouNoMana = custo && mana >= custo.custoMana;
  const podePolir = passouNoOuro && passouNoMana;
  const duracaoMs = 2000;

  const brutaProtegida = eLapidador && estadoLocal === 'bruta';
  const textoRisco = eLapidador && !brutaProtegida
    ? 'Pedra mantém estado atual (protegido por Lapidador)'
    : brutaProtegida
    ? 'Pedra bruta ainda pode ser destruída na falha'
    : 'Falha degrada a pedra para o nível anterior';

  useEffect(() => {
    return () => clearInterval(timer.current);
  }, []);

  if (!gema || !atual || !custo) return null;

  const mostrarToast = (msg, tipo) => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2600);
  };

  const handlePolir = () => {
    if (!polivel || polindo) return;
    if (!podePolir) {
      mostrarToast(
        passouNoOuro ? `❌ Mana insuficiente (precisa de ${custo.custoMana})` : `❌ Ouro insuficiente (precisa de ${custo.custoOuro})`,
        'erro'
      );
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
        const resultado = polirPedra(gema, ouro, jogador, mana);
        if (resultado.ok) {
          if (onOuroChange) onOuroChange(resultado.ouroRestante);
          if (onManaChange && resultado.manaRestante !== undefined) onManaChange(resultado.manaRestante);
          setEstadoLocal(resultado.estadoNovo);
          if (onEstadoChange) onEstadoChange(gema.id, resultado.estadoNovo);
          if (resultado.protegido && onPolirFalhaProtegida) {
            onPolirFalhaProtegida(gema.id, resultado.custoMana);
            mostrarToast('🛡️ Falha! A pedra foi protegida pelo Lapidador.', 'aviso');
          } else {
            mostrarToast(
              resultado.sucesso ? '✅ Pedra polida com sucesso!' : '❌ Falha no polimento!',
              resultado.sucesso ? 'sucesso' : 'erro'
            );
          }
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
  const temDescontoMana = custo.custoManaOriginal > custo.custoMana;
  const temBonusChance = custo.chanceSucesso > custo.chanceSucessoOriginal;

  return (
    <div className="modal-backdrop" onClick={handleFechar}>
      <div className="polisher-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Coluna esquerda: a "bancada de polimento" ── */}
        <aside className="polisher-bench">
          <div className="polisher-gem-orbit" style={{ ['--c']: corAtual }}>
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

          {eLapidador && (
            <div className="polisher-bonus-card">
              <div className="polisher-bonus-title">⭐ Bônus da Profissão: Lapidador</div>
              <ul className="polisher-bonus-list">
                {BENEFICIOS_LAPIDADOR.map((b, i) => (
                  <li key={i}>
                    <span className="polisher-bonus-badge">{b.badge}</span>
                    <span>{b.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                  <span className="polisher-custo-label">Custo em ouro</span>
                  <span className={`polisher-custo-val ${ouro >= custo.custoOuro ? '' : 'carente'}`}>🪙 {custo.custoOuro}</span>
                </div>
                <div className="polisher-custo">
                  <span className="polisher-custo-label">Custo de mana {temDescontoMana && <span className="polisher-badge-gold">-20%</span>}</span>
                  <span className={`polisher-custo-val ${mana >= custo.custoMana ? '' : 'carente'}`}>
                    ⚡{' '}
                    {temDescontoMana && <s className="polisher-orig">{custo.custoManaOriginal}</s>}{' '}
                    {custo.custoMana}
                  </span>
                </div>
                <div className="polisher-custo">
                  <span className="polisher-custo-label">Chance de sucesso {temBonusChance && <span className="polisher-badge-gold">+15%</span>}</span>
                  <span className="polisher-custo-val">🎲 {custo.chanceSucesso}%</span>
                </div>
              </div>

              <div className="polisher-multiplier">
                Efeito: <strong style={{ color: corAtual }}>{pctMultiplicador(atual.multiplicadorEfeito)}%</strong>
                <span className="polisher-multiplier-arrow">→</span>
                <strong style={{ color: corProximo }}>{pctMultiplicador(proximo.multiplicadorEfeito)}%</strong>
              </div>

              {/* Risco de falha */}
              <div className={`polisher-risco ${eLapidador && !brutaProtegida ? 'protegido' : ''}`}>
                <span className="polisher-risco-ico">{eLapidador && !brutaProtegida ? '🛡️' : '⚠️'}</span>
                <span>{textoRisco}</span>
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
                <button className="polisher-polir" onClick={handlePolir} disabled={polindo || !podePolir}>
                  {polindo ? 'Polindo...' : `Polir por ${custo.custoOuro} 🪙 / ${custo.custoMana} ⚡`}
                </button>
              </div>

              {passouNoOuro === false && (
                <p className="polisher-erro">Você não tem ouro suficiente para este polimento.</p>
              )}
              {passouNoMana === false && passouNoOuro && (
                <p className="polisher-erro">Você não tem mana suficiente para este polimento.</p>
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
