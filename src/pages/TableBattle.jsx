import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BUFF_DEBUFF_PRESETS = [
  { id: 'forca_up', name: 'Força+', icon: '💪', type: 'buff', stat: 'forca', value: 2, color: 'var(--accent)' },
  { id: 'forca_down', name: 'Fraqueza', icon: '🦐', type: 'debuff', stat: 'forca', value: -2, color: 'var(--hp-red)' },
  { id: 'vel_up', name: 'Acelerar', icon: '⚡', type: 'buff', stat: 'speed', value: 3, color: 'var(--accent)' },
  { id: 'vel_down', name: 'Desacelerar', icon: '🐌', type: 'debuff', stat: 'speed', value: -3, color: 'var(--hp-red)' },
  { id: 'ref_up', name: 'Escudo', icon: '🛡️', type: 'buff', stat: 'reflexos', value: 2, color: 'var(--accent)' },
  { id: 'ref_down', name: 'Vulnerável', icon: '💔', type: 'debuff', stat: 'reflexos', value: -2, color: 'var(--hp-red)' },
  { id: 'regen', name: 'Regenerar', icon: '💚', type: 'buff', stat: 'regen', value: 3, color: 'var(--accent)' },
  { id: 'veneno', name: 'Veneno', icon: '☠️', type: 'debuff', stat: 'poison', value: 3, color: 'var(--hp-red)' },
  { id: 'int_up', name: 'Foco', icon: '🧠', type: 'buff', stat: 'inteligencia', value: 2, color: 'var(--accent)' },
  { id: 'res_up', name: 'Aura', icon: '✨', type: 'buff', stat: 'resistencia', value: 2, color: 'var(--accent)' },
];

const DICE_FACES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

let _nextId = 1;
const uid = () => `tb_${_nextId++}`;

function makeFighter(name, team, attrs = {}) {
  const a = { forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5, ...attrs };
  const hpMax = 20 + (a.resistencia || 5) * 3;
  const mpMax = 10 + (a.inteligencia || 5) * 2;
  return {
    id: uid(), name, team,
    hp: hpMax, hpMax,
    mp: mpMax, mpMax,
    speed: a.destreza || 5,
    reflexos: a.reflexos || 5,
    forca: a.forca || 5,
    inteligencia: a.inteligencia || 5,
    resistencia: a.resistencia || 5,
    destreza: a.destreza || 5,
    statusEffects: [],
  };
}

function effectiveStat(fighter, stat) {
  let base = fighter[stat] || 0;
  for (const e of fighter.statusEffects) {
    if (e.stat === stat) base += e.value;
  }
  return Math.max(0, base);
}

function computeHitChance(attacker, defender) {
  const atkMod = effectiveStat(attacker, 'destreza') + effectiveStat(attacker, 'forca') * 0.3;
  const defMod = effectiveStat(defender, 'reflexos') + effectiveStat(defender, 'resistencia') * 0.2;
  const base = 0.5;
  const delta = (atkMod - defMod) * 0.04;
  return Math.max(0.05, Math.min(0.95, base + delta));
}

function computeDamage(attacker, isCrit) {
  const base = effectiveStat(attacker, 'forca') * 2 + Math.floor(Math.random() * 4) + 1;
  return isCrit ? base * 2 : base;
}

export default function TableBattle({ onBack }) {
  const [fighters, setFighters] = useState([
    makeFighter('Guerreiro', 'ally', { forca: 7, resistencia: 6, destreza: 4, reflexos: 4, inteligencia: 3 }),
    makeFighter('Mago', 'ally', { forca: 3, inteligencia: 8, resistencia: 4, destreza: 5, reflexos: 5 }),
    makeFighter('Orc', 'enemy', { forca: 8, inteligencia: 3, resistencia: 7, destreza: 3, reflexos: 3 }),
    makeFighter('Goblin', 'enemy', { forca: 4, inteligencia: 5, resistencia: 3, destreza: 7, reflexos: 6 }),
  ]);
  const [round, setRound] = useState(1);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('ally');
  const [newAttrs, setNewAttrs] = useState({ forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5 });

  const [atkAttacker, setAtkAttacker] = useState('');
  const [atkDefender, setAtkDefender] = useState('');
  const [lastRoll, setLastRoll] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const rollAnimRef = useRef(null);

  const [buffTarget, setBuffTarget] = useState('');
  const [buffPreset, setBuffPreset] = useState(BUFF_DEBUFF_PRESETS[0].id);
  const [buffDuration, setBuffDuration] = useState(3);

  const [log, setLog] = useState([]);

  const allies = useMemo(() => fighters.filter((f) => f.team === 'ally'), [fighters]);
  const enemies = useMemo(() => fighters.filter((f) => f.team === 'enemy'), [fighters]);
  const alive = useMemo(() => fighters.filter((f) => f.hp > 0), [fighters]);

  const addLog = useCallback((text) => {
    setLog((prev) => [...prev.slice(-50), { id: Date.now() + Math.random(), text, round }]);
  }, [round]);

  const updateFighter = useCallback((id, patch) => {
    setFighters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const addFighter = useCallback(() => {
    if (!newName.trim()) return;
    setFighters((prev) => [...prev, makeFighter(newName.trim(), newTeam, { ...newAttrs })]);
    setNewName('');
  }, [newName, newTeam, newAttrs]);

  const removeFighter = useCallback((id) => {
    setFighters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const applyBuff = useCallback(() => {
    if (!buffTarget || !buffPreset) return;
    const preset = BUFF_DEBUFF_PRESETS.find((b) => b.id === buffPreset);
    if (!preset) return;
    const eff = { ...preset, duration: buffDuration, uid: uid() };
    setFighters((prev) => prev.map((f) => {
      if (f.id !== buffTarget) return f;
      return { ...f, statusEffects: [...f.statusEffects, eff] };
    }));
    const target = fighters.find((f) => f.id === buffTarget);
    addLog(`${preset.icon} ${target?.name} recebe ${preset.name} por ${buffDuration} rodadas`);
  }, [buffTarget, buffPreset, buffDuration, fighters, addLog]);

  const tickEffects = useCallback(() => {
    setFighters((prev) => prev.map((f) => {
      const updated = f.statusEffects
        .map((e) => ({ ...e, duration: e.duration - 1 }))
        .filter((e) => e.duration > 0);
      let hpDelta = 0;
      for (const e of f.statusEffects) {
        if (e.stat === 'regen' && e.duration > 0) hpDelta += e.value;
        if (e.stat === 'poison' && e.duration > 0) hpDelta -= e.value;
      }
      if (hpDelta !== 0) {
        const newHp = Math.max(0, Math.min(f.hpMax, f.hp + hpDelta));
        if (hpDelta > 0) addLog(`💚 ${f.name} regenera ${hpDelta} HP`);
        if (hpDelta < 0) addLog(`☠️ ${f.name} sofre ${Math.abs(hpDelta)} de veneno`);
        return { ...f, statusEffects: updated, hp: newHp };
      }
      return { ...f, statusEffects: updated };
    }));
  }, [addLog]);

  const rollDice = useCallback(() => {
    if (!atkAttacker || !atkDefender) return;
    const attacker = fighters.find((f) => f.id === atkAttacker);
    const defender = fighters.find((f) => f.id === atkDefender);
    if (!attacker || !defender || defender.hp <= 0) return;

    setRolling(true);
    setRollResult(null);
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setLastRoll(DICE_FACES[Math.floor(Math.random() * 20)]);
      if (step >= 15) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setLastRoll(finalRoll);
        setRolling(false);

        const hitChance = computeHitChance(attacker, defender);
        const threshold = Math.ceil(hitChance * 20);
        const hit = finalRoll >= threshold;
        const isCrit = finalRoll === 20;

        if (hit) {
          const dmg = computeDamage(attacker, isCrit);
          const newHp = Math.max(0, defender.hp - dmg);
          updateFighter(defender.id, { hp: newHp });
          const critText = isCrit ? ' 🎯 CRÍTICO!' : '';
          addLog(
            `${attacker.name} ataca ${defender.name} → D20: ${finalRoll} vs ${threshold}+ → ACERTA${critText} (${dmg} dano${isCrit ? ' x2' : ''})`,
          );
          setRollResult({ roll: finalRoll, threshold, hit: true, isCrit, damage: dmg, attacker, defender });
        } else {
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} vs ${threshold}+ → ERRA`);
          setRollResult({ roll: finalRoll, threshold, hit: false, isCrit: false, damage: 0, attacker, defender });
        }
      }
    }, 60);
  }, [atkAttacker, atkDefender, fighters, updateFighter, addLog]);

  const nextRound = useCallback(() => {
    tickEffects();
    setRound((r) => r + 1);
    setRollResult(null);
    addLog(`═══ Rodada ${round + 1} ═══`);
  }, [round, tickEffects, addLog]);

  const setHp = useCallback((id, val) => {
    setFighters((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const hp = Math.max(0, Math.min(f.hpMax, Number(val) || 0));
      return { ...f, hp };
    }));
  }, []);

  const setMp = useCallback((id, val) => {
    setFighters((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const mp = Math.max(0, Math.min(f.mpMax, Number(val) || 0));
      return { ...f, mp };
    }));
  }, []);

  const adjustHp = useCallback((id, delta) => {
    setFighters((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const hp = Math.max(0, Math.min(f.hpMax, f.hp + delta));
      return { ...f, hp };
    }));
  }, []);

  const adjustMp = useCallback((id, delta) => {
    setFighters((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const mp = Math.max(0, Math.min(f.mpMax, f.mp + delta));
      return { ...f, mp };
    }));
  }, []);

  const renderTeamTable = (team, label, emoji) => (
    <section className="panel">
      <h2>{emoji} {label}</h2>
      <table className="table-battle-grid">
        <thead>
          <tr>
            <th>Nome</th>
            <th>HP</th>
            <th>MP</th>
            <th>VEL</th>
            <th>REF</th>
            <th>FOR</th>
            <th>INT</th>
            <th>RES</th>
            <th>Efeitos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {team.map((f) => {
            const hpPct = f.hpMax > 0 ? (f.hp / f.hpMax) * 100 : 0;
            const mpPct = f.mpMax > 0 ? (f.mp / f.mpMax) * 100 : 0;
            const dead = f.hp <= 0;
            return (
              <tr key={f.id} className={dead ? 'fighter-dead' : ''}>
                <td className="fighter-name-cell">
                  {dead && '☠️ '}{f.name}
                </td>
                <td className="hp-cell">
                  <div className="stat-bar-wrap">
                    <div className="stat-bar stat-bar-hp" style={{ width: `${hpPct}%` }} />
                    <input
                      type="number"
                      className="stat-input"
                      value={f.hp}
                      min={0}
                      max={f.hpMax}
                      onChange={(e) => setHp(f.id, e.target.value)}
                    />
                    <span className="stat-max">/{f.hpMax}</span>
                  </div>
                  <div className="stat-btns">
                    <button className="stat-btn stat-btn-dmg" onClick={() => { adjustHp(f.id, -1); addLog(`💔 ${f.name} -1 HP`); }}>-1</button>
                    <button className="stat-btn stat-btn-dmg" onClick={() => { adjustHp(f.id, -5); addLog(`💥 ${f.name} -5 HP`); }}>-5</button>
                    <button className="stat-btn stat-btn-heal" onClick={() => { adjustHp(f.id, 1); addLog(`💚 ${f.name} +1 HP`); }}>+1</button>
                    <button className="stat-btn stat-btn-heal" onClick={() => { adjustHp(f.id, 5); addLog(`💚 ${f.name} +5 HP`); }}>+5</button>
                  </div>
                </td>
                <td className="mp-cell">
                  <div className="stat-bar-wrap">
                    <div className="stat-bar stat-bar-mp" style={{ width: `${mpPct}%` }} />
                    <input
                      type="number"
                      className="stat-input"
                      value={f.mp}
                      min={0}
                      max={f.mpMax}
                      onChange={(e) => setMp(f.id, e.target.value)}
                    />
                    <span className="stat-max">/{f.mpMax}</span>
                  </div>
                  <div className="stat-btns">
                    <button className="stat-btn" onClick={() => adjustMp(f.id, -1)}>-1</button>
                    <button className="stat-btn" onClick={() => adjustMp(f.id, -5)}>-5</button>
                    <button className="stat-btn" onClick={() => adjustMp(f.id, 1)}>+1</button>
                    <button className="stat-btn" onClick={() => adjustMp(f.id, 5)}>+5</button>
                  </div>
                </td>
                <td className="stat-num">{effectiveStat(f, 'destreza')}</td>
                <td className="stat-num">{effectiveStat(f, 'reflexos')}</td>
                <td className="stat-num">{effectiveStat(f, 'forca')}</td>
                <td className="stat-num">{effectiveStat(f, 'inteligencia')}</td>
                <td className="stat-num">{effectiveStat(f, 'resistencia')}</td>
                <td className="effects-cell">
                  {f.statusEffects.map((e) => (
                    <span
                      key={e.uid}
                      className={`effect-tag ${e.type}`}
                      title={`${e.name} (${e.duration} rodadas)`}
                    >
                      {e.icon} {e.duration}
                    </span>
                  ))}
                </td>
                <td>
                  <button className="ghost remove-x" onClick={() => removeFighter(f.id)}>✕</button>
                </td>
              </tr>
            );
          })}
          {team.length === 0 && (
            <tr><td colSpan={10} className="muted">Nenhum combatente</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>📋 Batalha de Mesa</h1>
          <span className="player-name">Rodada {round}</span>
        </div>
        <button className="ghost" onClick={onBack}>← Voltar</button>
        <button onClick={nextRound}>Próxima Rodada →</button>
      </header>

      <div className="content">
        {renderTeamTable(allies, 'Aliados', '🛡️')}
        {renderTeamTable(enemies, 'Inimigos', '⚔️')}

        <section className="panel">
          <h2>➕ Adicionar Combatente</h2>
          <div className="table-battle-form">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome"
              onKeyDown={(e) => e.key === 'Enter' && addFighter()}
            />
            <select value={newTeam} onChange={(e) => setNewTeam(e.target.value)}>
              <option value="ally">Aliado</option>
              <option value="enemy">Inimigo</option>
            </select>
            {['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos'].map((attr) => (
              <label key={attr} className="attr-mini-label">
                {attr.slice(0, 3).toUpperCase()}
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newAttrs[attr]}
                  onChange={(e) => setNewAttrs((p) => ({ ...p, [attr]: Math.max(1, Math.min(12, +e.target.value || 1)) }))}
                />
              </label>
            ))}
            <button onClick={addFighter} disabled={!newName.trim()}>Adicionar</button>
          </div>
        </section>

        <section className="panel">
          <h2>⚔️ Ataque com Dado</h2>
          <div className="attack-panel">
            <div className="attack-selects">
              <label>
                Atacante
                <select value={atkAttacker} onChange={(e) => setAtkAttacker(e.target.value)}>
                  <option value="">—</option>
                  {alive.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                  ))}
                </select>
              </label>
              <span className="vs-text">⚡ ataca</span>
              <label>
                Alvo
                <select value={atkDefender} onChange={(e) => setAtkDefender(e.target.value)}>
                  <option value="">—</option>
                  {alive.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                  ))}
                </select>
              </label>
            </div>
            {atkAttacker && atkDefender && (
              <div className="attack-info">
                {(() => {
                  const a = fighters.find((f) => f.id === atkAttacker);
                  const d = fighters.find((f) => f.id === atkDefender);
                  if (!a || !d) return null;
                  const chance = computeHitChance(a, d);
                  const threshold = Math.ceil(chance * 20);
                  return (
                    <>
                      <span className="chance-text">
                        Chance: {(chance * 100).toFixed(0)}% (precisa de {threshold}+ no D20)
                      </span>
                      <span className="modifier-text">
                        VEL do atacante: {effectiveStat(a, 'destreza')} | REF do alvo: {effectiveStat(d, 'reflexos')}
                      </span>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="dice-area">
              <button
                className="dice-btn"
                onClick={rollDice}
                disabled={rolling || !atkAttacker || !atkDefender}
              >
                {rolling ? '🎲...' : '🎲 Rolar D20'}
              </button>
              {lastRoll !== null && !rolling && (
                <div className={`dice-result ${rollResult?.hit ? (rollResult?.isCrit ? 'crit' : 'hit') : 'miss'}`}>
                  <span className="dice-number">{lastRoll}</span>
                  <span className="dice-label">
                    {rollResult?.isCrit && '🎯 CRÍTICO! '}
                    {rollResult?.hit ? `ACERTA! (${rollResult?.damage} dano)` : 'ERRA!'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>✨ Buffs / Debuffs</h2>
          <div className="buff-panel">
            <label>
              Combatente
              <select value={buffTarget} onChange={(e) => setBuffTarget(e.target.value)}>
                <option value="">—</option>
                {fighters.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.team === 'ally' ? 'Aliado' : 'Inimigo'})</option>
                ))}
              </select>
            </label>
            <label>
              Efeito
              <select value={buffPreset} onChange={(e) => setBuffPreset(e.target.value)}>
                {BUFF_DEBUFF_PRESETS.map((b) => (
                  <option key={b.id} value={b.id}>{b.icon} {b.name} ({b.type === 'buff' ? 'Buff' : 'Debuff'} {b.stat} {b.value > 0 ? '+' : ''}{b.value})</option>
                ))}
              </select>
            </label>
            <label>
              Rodadas
              <input
                type="number"
                min={1}
                max={10}
                value={buffDuration}
                onChange={(e) => setBuffDuration(Math.max(1, Math.min(10, +e.target.value || 1)))}
              />
            </label>
            <button onClick={applyBuff} disabled={!buffTarget}>Aplicar</button>
          </div>
        </section>

        <section className="panel battle-log-panel">
          <h2>Crônica da Mesa</h2>
          <div className="battle-log">
            {log.map((l) => (
              <div key={l.id} className="log-line log-info">{l.text}</div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
