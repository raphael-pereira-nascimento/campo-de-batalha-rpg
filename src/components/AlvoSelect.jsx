import { ALVO_TIPOS } from '../game/sistema.js';

// Opções curtas de modo de alvo (rótulos completos ficam em sistema.js).
const TIPOS = [
  { id: 'unico', icon: '🎯', label: 'Único' },
  { id: 'area', icon: '💥', label: 'Área' },
  { id: 'cone', icon: '🔺', label: 'Cone' },
  { id: 'explosao', icon: '💣', label: 'Explosão' },
];

/**
 * Seletor de modo de alvo de um golpe/arma multi-alvo.
 * `alvo`/`alvos`/`splash` vêm do form; `onChange(patch)` aplica a mudança.
 * - unico    → um alvo (padrão)
 * - area     → todos os inimigos automaticamente
 * - cone     → o jogador escolhe até `alvos` inimigos
 * - explosao → alvo principal + `alvos - 1` vizinhos com `splash`% do dano
 */
export default function AlvoSelect({ alvo, alvos, splash, onChange, disabled = false }) {
  const tipo = ALVO_TIPOS[alvo] ? alvo : 'unico';
  const max = alvos || 3;
  const splashPct = Math.round((splash || 0.5) * 100);

  const desc =
    tipo === 'area'
      ? 'Varre a área: acerta TODOS os inimigos vivos com 100% do dano.'
      : tipo === 'cone'
        ? `Projéteis em leque: você escolhe até ${max} inimigos, todos com 100% do dano.`
        : tipo === 'explosao'
          ? `Alvo principal com 100% + até ${max - 1} vizinhos escolhidos com ${splashPct}% do dano.`
          : 'Um único alvo — o padrão de qualquer golpe.';

  return (
    <div className="alvo-select">
      <span className="field-label">Alvo do golpe</span>
      <div className="alvo-chips">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            className={`chip-btn${tipo === t.id ? ' on' : ''}`}
            onClick={() => onChange({ alvo: t.id })}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {(tipo === 'cone' || tipo === 'explosao') && (
        <div className="alvo-opts">
          <label className="alvo-opt">
            <span>Alvos máx.</span>
            <input
              type="number"
              min={2}
              max={10}
              disabled={disabled}
              value={max}
              onChange={(e) =>
                onChange({ alvos: Math.max(2, Math.min(10, Number(e.target.value) || 3)) })
              }
            />
          </label>
          {tipo === 'explosao' && (
            <label className="alvo-opt">
              <span>Vizinhos (%)</span>
              <input
                type="number"
                min={10}
                max={100}
                step={5}
                disabled={disabled}
                value={splashPct}
                onChange={(e) =>
                  onChange({
                    splash: Math.max(10, Math.min(100, Number(e.target.value) || 50)) / 100,
                  })
                }
              />
            </label>
          )}
        </div>
      )}

      <p className="hint">{desc}</p>
    </div>
  );
}
