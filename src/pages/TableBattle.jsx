import { useCallback, useMemo, useState } from 'react';
import { ATTRIBUTE_NAMES } from '../config.js';
import { danoFisicoAtaque, danoBaseDaArma } from '../game/sistema.js';

const BUFF_DEBUFF_PRESETS = [
  { id: 'forca_up', name: 'Força+', icon: '💪', type: 'buff', stat: 'forca', value: 2 },
  { id: 'forca_down', name: 'Fraqueza', icon: '🦐', type: 'debuff', stat: 'forca', value: -2 },
  { id: 'vel_up', name: 'Acelerar', icon: '⚡', type: 'buff', stat: 'destreza', value: 3 },
  { id: 'vel_down', name: 'Desacelerar', icon: '🐌', type: 'debuff', stat: 'destreza', value: -3 },
  { id: 'ref_up', name: 'Escudo', icon: '🛡️', type: 'buff', stat: 'reflexos', value: 2 },
  { id: 'ref_down', name: 'Vulnerável', icon: '💔', type: 'debuff', stat: 'reflexos', value: -2 },
  { id: 'regen', name: 'Regenerar', icon: '💚', type: 'buff', stat: 'regen', value: 3 },
  { id: 'veneno', name: 'Veneno', icon: '☠️', type: 'debuff', stat: 'poison', value: 3 },
  { id: 'int_up', name: 'Foco', icon: '🧠', type: 'buff', stat: 'inteligencia', value: 2 },
  { id: 'res_up', name: 'Aura', icon: '✨', type: 'buff', stat: 'resistencia', value: 2 },
];

const STAT_OPTIONS = ['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos'];
const STAT_SHORT = { forca: 'FOR', inteligencia: 'INT', resistencia: 'RES', destreza: 'VEL', reflexos: 'REF' };
const ICON_SUGGESTIONS = ['🔥', '❄️', '⚡', '💀', '🌿', '🌙', '⭐', '🗡️', '🔮', '🧪', '👁️', '🩸'];

let _nextId = 1;
const uid = () => `tb_${_nextId++}`;

function makeFighter(name, team, attrs = {}) {
  const a = { forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5, ...attrs };
  const hpMax = 500 + (a.resistencia || 5) * 10;
  const mpMax = 10 + (a.inteligencia || 5) * 2;
  return {
    id: uid(), name, team,
    hp: hpMax, hpMax, mp: mpMax, mpMax,
    speed: a.destreza || 5, reflexos: a.reflexos || 5,
    forca: a.forca || 5, inteligencia: a.inteligencia || 5,
    resistencia: a.resistencia || 5, destreza: a.destreza || 5,
    statusEffects: [],
  };
}

function fighterFromCharacter(c, team) {
  const attrs = c.attributes || {};
  return makeFighter(c.name, team, attrs);
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
  // Mesmo sistema do combate principal: (FOR Final + danoBase da arma) × 10 — sem dados.
  // Lutadores de mesa não têm equipamento => mãos nuas (danoBaseDaArma(null) = 2).
  const base = danoFisicoAtaque(effectiveStat(attacker, 'forca'), danoBaseDaArma(null));
  return isCrit ? base * 2 : base;
}

export default function TableBattle({ onBack, characters = [], gameData }) {
  const [fighters, setFighters] = useState([]);
  const [round, setRound] = useState(1);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('ally');
  const [newAttrs, setNewAttrs] = useState({ forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5 });

  const [atkAttacker, setAtkAttacker] = useState('');
  const [atkDefender, setAtkDefender] = useState('');
  const [lastRoll, setLastRoll] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);

  const [buffTarget, setBuffTarget] = useState('');
  const [buffPreset, setBuffPreset] = useState(BUFF_DEBUFF_PRESETS[0].id);
  const [buffDuration, setBuffDuration] = useState(3);

  const [customBuffs, setCustomBuffs] = useState([]);
  const [customDebuffs, setCustomDebuffs] = useState([]);
  const [cbName, setCbName] = useState('');
  const [cbStat, setCbStat] = useState('forca');
  const [cbValue, setCbValue] = useState(2);
  const [cbIcon, setCbIcon] = useState('🔥');
  const [importTeam, setImportTeam] = useState('ally');

  const [log, setLog] = useState([]);

  const allies = useMemo(() => fighters.filter((f) => f.team === 'ally'), [fighters]);
  const enemies = useMemo(() => fighters.filter((f) => f.team === 'enemy'), [fighters]);
  const alive = useMemo(() => fighters.filter((f) => f.hp > 0), [fighters]);
  const importedIds = useMemo(() => new Set(fighters.map((f) => f._charId).filter(Boolean)), [fighters]);

  const allPresets = useMemo(() => [
    ...BUFF_DEBUFF_PRESETS,
    ...customBuffs.map((c) => ({ ...c, id: c.uid, type: 'buff' })),
    ...customDebuffs.map((c) => ({ ...c, id: c.uid, type: 'debuff' })),
  ], [customBuffs, customDebuffs]);

  const addLog = useCallback((text) => {
    setLog((prev) => [...prev.slice(-50), { id: Date.now() + Math.random(), text, round }]);
  }, [round]);

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

  const setHp = useCallback((id, val) => {
    setFighters((prev) => prev.map((f) => f.id === id ? { ...f, hp: Math.max(0, Math.min(f.hpMax, Number(val) || 0)) } : f));
  }, []);

  const setMp = useCallback((id, val) => {
    setFighters((prev) => prev.map((f) => f.id === id ? { ...f, mp: Math.max(0, Math.min(f.mpMax, Number(val) || 0)) } : f));
  }, []);

  const addFighter = useCallback(() => {
    if (!newName.trim()) return;
    setFighters((prev) => [...prev, makeFighter(newName.trim(), newTeam, { ...newAttrs })]);
    setNewName('');
  }, [newName, newTeam, newAttrs]);

  const removeFighter = useCallback((id) => {
    setFighters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const importCharacter = useCallback((charId) => {
    const c = characters.find((ch) => ch.id === charId);
    if (!c) return;
    setFighters((prev) => [...prev, { ...fighterFromCharacter(c, importTeam), _charId: charId }]);
  }, [characters, importTeam]);

  const applyBuff = useCallback(() => {
    if (!buffTarget || !buffPreset) return;
    const preset = allPresets.find((b) => b.id === buffPreset);
    if (!preset) return;
    const eff = { ...preset, duration: buffDuration, uid: uid() };
    setFighters((prev) => prev.map((f) => {
      if (f.id !== buffTarget) return f;
      return { ...f, statusEffects: [...f.statusEffects, eff] };
    }));
    const target = fighters.find((f) => f.id === buffTarget);
    addLog(`${preset.icon} ${target?.name} recebe ${preset.name} por ${buffDuration} rodadas`);
  }, [buffTarget, buffPreset, buffDuration, fighters, allPresets, addLog]);

  const addCustomEffect = useCallback((type) => {
    const list = type === 'buff' ? customBuffs : customDebuffs;
    if (list.length >= 3) return;
    if (!cbName.trim()) return;
    const eff = {
      uid: uid(), name: cbName.trim(), icon: cbIcon || '✨',
      stat: cbStat, value: type === 'buff' ? Math.abs(cbValue) : -Math.abs(cbValue),
      type,
    };
    if (type === 'buff') setCustomBuffs((p) => [...p, eff]);
    else setCustomDebuffs((p) => [...p, eff]);
    setCbName('');
  }, [cbName, cbStat, cbValue, cbIcon, customBuffs, customDebuffs]);

  const removeCustomEffect = useCallback((type, uid_) => {
    if (type === 'buff') setCustomBuffs((p) => p.filter((e) => e.uid !== uid_));
    else setCustomDebuffs((p) => p.filter((e) => e.uid !== uid_));
  }, []);

  const tickEffects = useCallback(() => {
    setFighters((prev) => prev.map((f) => {
      let hpDelta = 0;
      for (const e of f.statusEffects) {
        if (e.stat === 'regen' && e.duration > 0) hpDelta += e.value;
        if (e.stat === 'poison' && e.duration > 0) hpDelta -= e.value;
      }
      const updated = f.statusEffects.map((e) => ({ ...e, duration: e.duration - 1 })).filter((e) => e.duration > 0);
      if (hpDelta !== 0) {
        if (hpDelta > 0) addLog(`💚 ${f.name} regenera ${hpDelta} HP`);
        if (hpDelta < 0) addLog(`☠️ ${f.name} sofre ${Math.abs(hpDelta)} de veneno`);
        return { ...f, statusEffects: updated, hp: Math.max(0, Math.min(f.hpMax, f.hp + hpDelta)) };
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
      setLastRoll(Math.floor(Math.random() * 20) + 1);
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
          setFighters((prev) => prev.map((f) => f.id === defender.id ? { ...f, hp: newHp } : f));
          const critText = isCrit ? ' 🎯 CRÍTICO!' : '';
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} vs ${threshold}+ → ACERTA${critText} (${dmg} dano${isCrit ? ' x2' : ''})`);
          setRollResult({ roll: finalRoll, threshold, hit: true, isCrit, damage: dmg });
        } else {
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} vs ${threshold}+ → ERRA`);
          setRollResult({ roll: finalRoll, threshold, hit: false, isCrit: false, damage: 0 });
        }
      }
    }, 60);
  }, [atkAttacker, atkDefender, fighters, addLog]);

  const nextRound = useCallback(() => {
    tickEffects();
    setRound((r) => r + 1);
    setRollResult(null);
    addLog(`═══ Rodada ${round + 1} ═══`);
  }, [round, tickEffects, addLog]);

  const renderFighterCard = (f) => {
    const hpPct = f.hpMax > 0 ? (f.hp / f.hpMax) * 100 : 0;
    const mpPct = f.mpMax > 0 ? (f.mp / f.mpMax) * 100 : 0;
    const dead = f.hp <= 0;
    return (
      <div key={f.id} className={`fighter-card ${dead ? 'fighter-dead' : ''}`}>
        <div className="fighter-card-header">
          <span className="fighter-card-name">{dead && '☠️ '}{f.name}</span>
          <button className="ghost remove-x" onClick={() => removeFighter(f.id)}>✕</button>
        </div>
        <div className="fighter-card-stats-row">
          {[
            { label: 'VEL', val: effectiveStat(f, 'destreza') },
            { label: 'REF', val: effectiveStat(f, 'reflexos') },
            { label: 'FOR', val: effectiveStat(f, 'forca') },
            { label: 'INT', val: effectiveStat(f, 'inteligencia') },
            { label: 'RES', val: effectiveStat(f, 'resistencia') },
          ].map(({ label, val }) => (
            <span key={label} className="fighter-card-stat">{label} {val}</span>
          ))}
        </div>
        <div className="fighter-card-bars">
          <div className="fighter-card-bar-row">
            <span className="bar-label">HP</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar stat-bar-hp" style={{ width: `${hpPct}%` }} />
              <input type="number" className="stat-input" value={f.hp} min={0} max={f.hpMax} onChange={(e) => setHp(f.id, e.target.value)} />
              <span className="stat-max">/{f.hpMax}</span>
            </div>
            <div className="stat-btns">
              <button className="stat-btn stat-btn-dmg" onClick={() => { adjustHp(f.id, -1); addLog(`💔 ${f.name} -1 HP`); }}>-1</button>
              <button className="stat-btn stat-btn-dmg" onClick={() => { adjustHp(f.id, -5); addLog(`💥 ${f.name} -5 HP`); }}>-5</button>
              <button className="stat-btn stat-btn-heal" onClick={() => { adjustHp(f.id, 1); addLog(`💚 ${f.name} +1 HP`); }}>+1</button>
              <button className="stat-btn stat-btn-heal" onClick={() => { adjustHp(f.id, 5); addLog(`💚 ${f.name} +5 HP`); }}>+5</button>
            </div>
          </div>
          <div className="fighter-card-bar-row">
            <span className="bar-label">MP</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar stat-bar-mp" style={{ width: `${mpPct}%` }} />
              <input type="number" className="stat-input" value={f.mp} min={0} max={f.mpMax} onChange={(e) => setMp(f.id, e.target.value)} />
              <span className="stat-max">/{f.mpMax}</span>
            </div>
            <div className="stat-btns">
              <button className="stat-btn" onClick={() => adjustMp(f.id, -1)}>-1</button>
              <button className="stat-btn" onClick={() => adjustMp(f.id, -5)}>-5</button>
              <button className="stat-btn" onClick={() => adjustMp(f.id, 1)}>+1</button>
              <button className="stat-btn" onClick={() => adjustMp(f.id, 5)}>+5</button>
            </div>
          </div>
        </div>
        {f.statusEffects.length > 0 && (
          <div className="fighter-card-effects">
            {f.statusEffects.map((e) => (
              <span key={e.uid} className={`effect-tag ${e.type}`} title={`${e.name} (${e.duration} rodadas)`}>
                {e.icon} {e.duration}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

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

      <div className="table-battle-layout">
        <div className="table-battle-main">

          <section className="panel">
            <h2>🛡️ Aliados</h2>
            <div className="fighter-cards-grid">
              {allies.map(renderFighterCard)}
              {allies.length === 0 && <p className="muted">Nenhum aliado</p>}
            </div>
          </section>

          <section className="panel">
            <h2>⚔️ Inimigos</h2>
            <div className="fighter-cards-grid">
              {enemies.map(renderFighterCard)}
              {enemies.length === 0 && <p className="muted">Nenhum inimigo</p>}
            </div>
          </section>

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
              {STAT_OPTIONS.map((attr) => (
                <label key={attr} className="attr-mini-label">
                  {STAT_SHORT[attr]}
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

          {characters.length > 0 && (
            <section className="panel">
              <h2>📥 Importar Ficha</h2>
              <div className="table-battle-form">
                <select id="import-char-select" defaultValue="">
                  <option value="" disabled>Escolha uma ficha...</option>
                  {characters.filter((c) => !importedIds.has(c.id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (Nv.{c.level})</option>
                  ))}
                </select>
                <select value={importTeam} onChange={(e) => setImportTeam(e.target.value)}>
                  <option value="ally">Aliado</option>
                  <option value="enemy">Inimigo</option>
                </select>
                <button
                  onClick={() => {
                    const sel = document.getElementById('import-char-select');
                    if (sel && sel.value) importCharacter(sel.value);
                  }}
                >
                  Importar
                </button>
              </div>
            </section>
          )}

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
                <span className="vs-text">⚡</span>
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
                        <span className="chance-text">Chance: {(chance * 100).toFixed(0)}% (precisa de {threshold}+ no D20)</span>
                        <span className="modifier-text">VEL: {effectiveStat(a, 'destreza')} vs REF: {effectiveStat(d, 'reflexos')}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              <div className="dice-area">
                <button className="dice-btn" onClick={rollDice} disabled={rolling || !atkAttacker || !atkDefender}>
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

          <section className="panel battle-log-panel">
            <h2>Crônica da Mesa</h2>
            <div className="battle-log">
              {log.map((l) => (
                <div key={l.id} className="log-line log-info">{l.text}</div>
              ))}
            </div>
          </section>
        </div>

        <aside className="table-battle-sidebar">
          <section className="panel">
            <h2>✨ Aplicar Efeito</h2>
            <div className="buff-panel-sidebar">
              <label>
                Combatente
                <select value={buffTarget} onChange={(e) => setBuffTarget(e.target.value)}>
                  <option value="">—</option>
                  {fighters.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Efeito
                <select value={buffPreset} onChange={(e) => setBuffPreset(e.target.value)}>
                  {allPresets.map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name} ({b.value > 0 ? '+' : ''}{b.value} {STAT_SHORT[b.stat] || b.stat})</option>
                  ))}
                </select>
              </label>
              <label>
                Rodadas
                <input type="number" min={1} max={10} value={buffDuration} onChange={(e) => setBuffDuration(Math.max(1, Math.min(10, +e.target.value || 1)))} />
              </label>
              <button onClick={applyBuff} disabled={!buffTarget}>Aplicar</button>
            </div>
          </section>

          <section className="panel">
            <h2>🔧 Buffs Customizados ({customBuffs.length}/3)</h2>
            <div className="custom-effects-list">
              {customBuffs.map((e) => (
                <div key={e.uid} className="custom-effect-item buff">
                  <span>{e.icon} {e.name} (+{e.value} {STAT_SHORT[e.stat]})</span>
                  <button className="ghost remove-x" onClick={() => removeCustomEffect('buff', e.uid)}>✕</button>
                </div>
              ))}
              {customBuffs.length < 3 && (
                <div className="custom-effect-form">
                  <input value={cbName} onChange={(e) => setCbName(e.target.value)} placeholder="Nome" maxLength={20} />
                  <select value={cbIcon} onChange={(e) => setCbIcon(e.target.value)}>
                    {ICON_SUGGESTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <select value={cbStat} onChange={(e) => setCbStat(e.target.value)}>
                    {STAT_OPTIONS.map((s) => <option key={s} value={s}>{STAT_SHORT[s]}</option>)}
                  </select>
                  <input type="number" min={1} max={10} value={cbValue} onChange={(e) => setCbValue(Math.max(1, Math.min(10, +e.target.value || 1)))} style={{ width: 50 }} />
                  <button onClick={() => addCustomEffect('buff')} disabled={!cbName.trim()}>+</button>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <h2>🔧 Debuffs Customizados ({customDebuffs.length}/3)</h2>
            <div className="custom-effects-list">
              {customDebuffs.map((e) => (
                <div key={e.uid} className="custom-effect-item debuff">
                  <span>{e.icon} {e.name} ({e.value} {STAT_SHORT[e.stat]})</span>
                  <button className="ghost remove-x" onClick={() => removeCustomEffect('debuff', e.uid)}>✕</button>
                </div>
              ))}
              {customDebuffs.length < 3 && (
                <div className="custom-effect-form">
                  <input value={cbName} onChange={(e) => setCbName(e.target.value)} placeholder="Nome" maxLength={20} />
                  <select value={cbIcon} onChange={(e) => setCbIcon(e.target.value)}>
                    {ICON_SUGGESTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <select value={cbStat} onChange={(e) => setCbStat(e.target.value)}>
                    {STAT_OPTIONS.map((s) => <option key={s} value={s}>{STAT_SHORT[s]}</option>)}
                  </select>
                  <input type="number" min={1} max={10} value={cbValue} onChange={(e) => setCbValue(Math.max(1, Math.min(10, +e.target.value || 1)))} style={{ width: 50 }} />
                  <button onClick={() => addCustomEffect('debuff')} disabled={!cbName.trim()}>+</button>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
