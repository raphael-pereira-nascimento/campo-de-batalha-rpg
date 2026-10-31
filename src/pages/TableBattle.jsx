import { useCallback, useMemo, useState } from 'react';
import { ATTRIBUTE_NAMES } from '../config.js';
import { danoFisicoAtaque, danoBaseDaArma, danoMagico } from '../game/sistema.js';
import { MONSTERS } from '../game/monsters.js';
import { SPELLS, STATUS_DEFS, armasDeEquipamento, melhorArma, skillFromSpell } from '../game/data.js';

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

// Chefes com mecânica de proteção: só recebem dano direto após quebrar a proteção.
// A proteção fica vulnerável por N turnos antes de recarregar.
// eclipseOnly: só tem proteção na forma Eclipse.
// eclipseExtra: tem proteção nas duas formas, mas ganha HP extra no Eclipse.
const PROTECTION_CHEFS = {
  minhoca_broca: { baseHp: 180, vulnerableTurns: 3, rechargeTurns: 2, eclipseOnly: true },
  jabuti_montanha: { baseHp: 220, vulnerableTurns: 3, rechargeTurns: 2, eclipseExtra: true },
  dragao_obsidiana: { baseHp: 260, vulnerableTurns: 3, rechargeTurns: 2, eclipseExtra: true },
};

function makeProtection(cfg, eclipse = false) {
  if (cfg.eclipseOnly && !eclipse) return null;
  const hp = eclipse ? Math.round(cfg.baseHp * 1.5) : cfg.baseHp;
  return {
    hp, maxHp: hp,
    state: 'active', // active | vulnerable | recharging
    vulnerableTurnsLeft: 0,
    rechargeTurnsLeft: 0,
  };
}

// Aplica dano a um combatente respeitando a proteção do chefe.
// Retorna { danoReal, protecaoDano, protecaoQuebrou, vulneravel, msg }.
function applyDamageWithProtection(target, dmg) {
  const prot = target.protection;
  if (!prot) return { danoReal: dmg, protecaoDano: 0, protecaoQuebrou: false, vulneravel: false, msg: '' };

  if (prot.state === 'active') {
    // Dano vai para a proteção.
    const absorvido = Math.min(dmg, prot.hp);
    const novoHp = prot.hp - absorvido;
    const quebrou = novoHp <= 0;
    if (quebrou) {
      prot.state = 'vulnerable';
      prot.vulnerableTurnsLeft = PROTECTION_CHEFS[target._bossId]?.vulnerableTurns ?? 3;
      prot.hp = 0;
      return {
        danoReal: 0, protecaoDano: absorvido, protecaoQuebrou: true, vulneravel: true,
        msg: `🛡️ A proteção de ${target.name} se QUEBROU! Ficará vulnerável por ${prot.vulnerableTurnsLeft} turno(s).`,
      };
    }
    prot.hp = novoHp;
    return {
      danoReal: 0, protecaoDano: absorvido, protecaoQuebrou: false, vulneravel: false,
      msg: `🛡️ ${target.name} absorveu ${absorvido} dano na proteção (${novoHp}/${prot.maxHp}).`,
    };
  }

  if (prot.state === 'vulnerable') {
    // Dano direto ao chefe.
    return { danoReal: dmg, protecaoDano: 0, protecaoQuebrou: false, vulneravel: true, msg: '' };
  }

  // recharging: proteção não está disponível ainda, dano direto ao chefe.
  return { danoReal: dmg, protecaoDano: 0, protecaoQuebrou: false, vulneravel: false, msg: '' };
}

// Avança os contadores de proteção de todos os lutadores no início de cada turno.
function processProtectionTick(fighters) {
  let changed = false;
  const next = fighters.map((f) => {
    const prot = f.protection;
    if (!prot) return f;
    if (prot.state === 'vulnerable') {
      prot.vulnerableTurnsLeft -= 1;
      changed = true;
      if (prot.vulnerableTurnsLeft <= 0) {
        prot.state = 'recharging';
        prot.rechargeTurnsLeft = PROTECTION_CHEFS[f._bossId]?.rechargeTurns ?? 2;
      }
    } else if (prot.state === 'recharging') {
      prot.rechargeTurnsLeft -= 1;
      changed = true;
      if (prot.rechargeTurnsLeft <= 0) {
        prot.state = 'active';
        prot.hp = prot.maxHp;
      }
    }
    return f;
  });
  return changed ? next : fighters;
}

let _nextId = 1;
const uid = () => `tb_${_nextId++}`;

function makeFighter(name, team, attrs = {}, extra = {}) {
  const a = { forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5, ...attrs };
  const hpMax = extra.hpMax ?? (500 + (a.resistencia || 5) * 10);
  const mpMax = extra.mpMax ?? ((a.inteligencia || 5) * 10);
  return {
    id: uid(), name, team,
    hp: extra.hp ?? hpMax, hpMax,
    mp: extra.mp ?? mpMax, mpMax,
    speed: a.destreza || 5, reflexos: a.reflexos || 5,
    forca: a.forca || 5, inteligencia: a.inteligencia || 5,
    resistencia: a.resistencia || 5, destreza: a.destreza || 5,
    statusEffects: [],
    initiative: null,
    protection: extra.protection || null,
    equipment: extra.equipment || {},
    spells: extra.spells || [],
    skills: extra.skills || [],
    inventory: extra.inventory || [],
    level: extra.level || 1,
    _charId: extra._charId || null,
    ...extra,
  };
}

function fighterFromCharacter(c, team) {
  const attrs = c.attributes || {};
  return makeFighter(c.name, team, attrs, {
    equipment: c.equipment || {},
    spells: c.spells || [],
    skills: c.skills || [],
    inventory: c.inventory || [],
    level: c.level || 1,
    _charId: c.id,
  });
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
  const [initiativeOrder, setInitiativeOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [initiativeRolled, setInitiativeRolled] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('ally');
  const [newAttrs, setNewAttrs] = useState({ forca: 5, inteligencia: 5, resistencia: 5, destreza: 5, reflexos: 5 });

  const [atkAttacker, setAtkAttacker] = useState('');
  const [atkDefender, setAtkDefender] = useState('');
const [lastRoll, setLastRoll] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [diceFaces, setDiceFaces] = useState(20);
  const [diceQty, setDiceQty] = useState(1);
  const [diceBonus, setDiceBonus] = useState(0);
  const [diceRolls, setDiceRolls] = useState([]);
  const [diceTotal, setDiceTotal] = useState(null);

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
  const [bossId, setBossId] = useState('');
  const [bossEclipse, setBossEclipse] = useState(false);

  // Estados das ações rápidas (espelham o painel do Campo de Batalha)
  const [actionMode, setActionMode] = useState('attack'); // attack | spell | item
  const [actAttacker, setActAttacker] = useState('');
  const [actTargets, setActTargets] = useState([]);
  const [selWeaponId, setSelWeaponId] = useState('');
  const [selSpellId, setSelSpellId] = useState('');
  const [selItemId, setSelItemId] = useState('');

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

  // Lista as armas de um lutador (fallback: desarmado, dano base 2).
  const armasDoLutador = useCallback((f) => {
    if (!f) return [];
    const lista = armasDeEquipamento(f.equipment || {});
    if (lista.length === 0) {
      lista.push({ id: 'desarmado', nome: 'Desarmado', danoBase: 2, slot: 'perto', categoria: 'corpo_a_corpo', recarga: 0 });
    }
    return lista;
  }, []);

  const magiasDoLutador = useCallback((f) => {
    if (!f) return [];
    return (f.spells || [])
      .map((sid) => ({ sid, spell: SPELLS[sid], skill: skillFromSpell(sid, gameData) }))
      .filter((x) => x.spell);
  }, [gameData, SPELLS]);

  const itensDoLutador = useCallback((f) => {
    if (!f) return [];
    return (f.inventory || []).filter((it) => it && it.tipo !== 'equipamento');
  }, []);

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
    setFighters((prevFighters) => {
      const next = [...prevFighters, makeFighter(newName.trim(), newTeam, { ...newAttrs })];
      if (initiativeRolled) {
        setInitiativeOrder((prevOrder) => [...prevOrder, next[next.length - 1].id]);
      }
      return next;
    });
    setNewName('');
  }, [newName, newTeam, newAttrs, initiativeRolled]);

  const removeFighter = useCallback((id) => {
    setFighters((prevFighters) => {
      const removedIdx = prevFighters.findIndex((f) => f.id === id);
      const updated = prevFighters.filter((f) => f.id !== id);
      setInitiativeOrder((prevOrder) => {
        if (!prevOrder.includes(id)) return prevOrder;
        const next = prevOrder.filter((fid) => fid !== id);
        const curIdx = prevOrder.indexOf(id);
        let newIdx = currentTurnIndex;
        if (curIdx <= currentTurnIndex) newIdx = Math.max(0, currentTurnIndex - 1);
        if (newIdx >= next.length) newIdx = Math.max(0, next.length - 1);
        setCurrentTurnIndex(newIdx);
        return next;
      });
      return updated;
    });
  }, [currentTurnIndex]);

  const importCharacter = useCallback((charId) => {
    const c = characters.find((ch) => ch.id === charId);
    if (!c) return;
    setFighters((prevFighters) => {
      const next = [...prevFighters, { ...fighterFromCharacter(c, importTeam), _charId: charId }];
      if (initiativeRolled) {
        setInitiativeOrder((prevOrder) => [...prevOrder, next[next.length - 1].id]);
      }
      return next;
    });
  }, [characters, importTeam, initiativeRolled]);

  const bosses = useMemo(
    () => Object.values(MONSTERS)
      .filter((m) => m.tipo === 'chefe')
      .sort((a, b) => (a.nivel || 0) - (b.nivel || 0)),
    [],
  );

  const addBoss = useCallback(() => {
    const def = MONSTERS[bossId];
    if (!def) return;
    const cfg = PROTECTION_CHEFS[def.id];
    const protection = cfg ? makeProtection(cfg, bossEclipse) : null;

    // Nova fórmula de escala de chefe: baseHp + (soma do HP dos aliados × hpEscalaFator)
    const allyHpSum = allies.reduce((sum, f) => sum + f.hpMax, 0);
    const fatorEscala = def.hpEscalaFator || 0.5;
    const baseHp = def.baseHp || 0;
    const bossHp = Math.max(50, Math.round(baseHp + allyHpSum * fatorEscala));

    const f = makeFighter(
      `${bossEclipse && def.varianteEclipse ? '🌑 ' : ''}${def.icone || '👑'} ${def.nome}${bossEclipse && def.varianteEclipse ? ` (${def.varianteEclipse.sufixo || 'Eclipse'})` : ''}`,
      'enemy',
      { ...def.attributes },
      { protection, _bossId: def.id, _eclipse: bossEclipse && def.varianteEclipse ? true : null, hpMax: bossHp, hp: bossHp }
    );
    setFighters((prevFighters) => {
      const next = [...prevFighters, f];
      if (initiativeRolled) {
        setInitiativeOrder((prevOrder) => [...prevOrder, next[next.length - 1].id]);
      }
      return next;
    });
    const golpes = (def.spells || []).map((s) => SPELLS[s]?.nome || s).join(', ');
    const protoTxt = protection
      ? ` 🛡️ Proteção: ${protection.hp}/${protection.maxHp} (${bossEclipse ? 'Eclipse' : 'normal'})`
      : '';
    addLog(`👑 ${def.nome} (Nv.${def.nivel}) entra na mesa como inimigo! Passiva: ${def.passiva || '—'}${golpes ? ` Golpes: ${golpes}.` : ''}${protoTxt} HP: ${bossHp}`);
    setBossId('');
  }, [bossId, addLog, initiativeRolled, bossEclipse, allies]);

  // Rola iniciativa (D20 + VEL) para todos que ainda não têm e define a ordem de turnos.
  const rollInitiative = useCallback(() => {
    setFighters((prev) =>
      prev.map((f) => ({
        ...f,
        initiative: f.initiative ?? Math.floor(Math.random() * 20) + 1 + effectiveStat(f, 'destreza'),
      }))
    );
    const order = [...fighters]
      .filter((f) => f.hp > 0)
      .sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0))
      .map((f) => f.id);
    setInitiativeOrder(order);
    setCurrentTurnIndex(0);
    setInitiativeRolled(true);
    addLog(`🎯 Iniciativa rolada! Ordem: ${order.map((id) => fighters.find((f) => f.id === id)?.name).join(' → ')}`);
  }, [fighters, addLog, effectiveStat]);

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

  // Executa uma ação rápida: ataque físico, magia (consome MP) ou item (cura).
  const executarAcao = useCallback(() => {
    const attacker = fighters.find((f) => f.id === actAttacker);
    if (!attacker || attacker.hp <= 0 || actTargets.length === 0) return;

    // Respeita a ordem de turno quando a iniciativa já foi rolada.
    if (initiativeRolled && initiativeOrder.length > 0) {
      const currentId = initiativeOrder[currentTurnIndex];
      if (actAttacker !== currentId) {
        const current = fighters.find((f) => f.id === currentId);
        addLog(`⛔ Não é a vez de ${attacker.name}. Aguarde a vez de ${current ? current.name : '—'}.`);
        return;
      }
    }

    if (actionMode === 'attack') {
      const armas = armasDoLutador(attacker);
      const arma = armas.find((a) => a.id === selWeaponId) || melhorArma(attacker.equipment) || armas[0];
      const defender = fighters.find((f) => f.id === actTargets[0]);
      if (!defender || defender.hp <= 0) return;

      const roll = Math.floor(Math.random() * 20) + 1;
      const chance = computeHitChance(attacker, defender);
      const threshold = Math.ceil(chance * 20);
      const hit = roll >= threshold;
      const isCrit = roll === 20;

      if (hit) {
        const dmg = Math.round(danoFisicoAtaque(effectiveStat(attacker, 'forca'), danoBaseDaArma(arma)) * (isCrit ? 2 : 1));
        const res = applyDamageWithProtection(defender, dmg);
        setFighters((prev) => prev.map((f) => {
          if (f.id !== defender.id) return f;
          if (res.protecaoDano > 0) {
            return { ...f, protection: { ...f.protection, hp: Math.max(0, f.protection?.hp - res.protecaoDano) } };
          }
          return { ...f, hp: Math.max(0, f.hp - res.danoReal) };
        }));
        const suffix = res.msg ? ` ${res.msg}` : res.danoReal > 0 ? ` → ${dmg} dano` : '';
        addLog(`⚔️ ${attacker.name} ataca ${defender.name} com ${arma.nome || 'desarmado'} → D20:${roll} (${threshold}+) ${isCrit ? 'CRÍTICO ' : ''}${suffix}`);
        if (res.protecaoQuebrou) addLog(res.msg);
      } else {
        addLog(`⚔️ ${attacker.name} erra ${defender.name} com ${arma.nome || 'desarmado'} → D20:${roll} (${threshold}+)`);
      }
      setActTargets([]);
      return;
    }

    if (actionMode === 'spell') {
      const m = magiasDoLutador(attacker).find((x) => x.sid === selSpellId);
      if (!m) return;
      const custo = m.spell.custo || 0;
      if ((attacker.mp || 0) < custo) { addLog(`🔮 ${attacker.name} não tem MP suficiente (${custo})`); return; }
      const defender = fighters.find((f) => f.id === actTargets[0]);
      if (!defender || defender.hp <= 0) return;

      const poder = m.spell.poder || 1.6;
      const dmg = Math.round(danoMagico(effectiveStat(attacker, 'inteligencia'), poder));
      const res = applyDamageWithProtection(defender, dmg);
      setFighters((prev) => prev.map((f) => {
        if (f.id === attacker.id) return { ...f, mp: Math.max(0, f.mp - custo) };
        if (f.id === defender.id) {
          if (res.protecaoDano > 0) {
            return { ...f, protection: { ...f.protection, hp: Math.max(0, f.protection?.hp - res.protecaoDano) } };
          }
          return { ...f, hp: Math.max(0, f.hp - res.danoReal) };
        }
        return f;
      }));
      const suffix = res.msg ? ` ${res.msg}` : res.danoReal > 0 ? ` → ${dmg} dano` : '';
      addLog(`🔮 ${attacker.name} lança ${m.spell.nome} em ${defender.name} ${suffix} (MP ${custo})`);
      if (res.protecaoQuebrou) addLog(res.msg);

      if (m.spell.status) {
        const st = m.spell.status;
        const def = STATUS_DEFS[st.tipo] || {};
        const tipoBuff = st.tipo === 'dot' || st.tipo === 'veneno' ? 'debuff' : st.tipo === 'hot' ? 'buff' : 'debuff';
        const statMap = { veneno: 'poison', regeneracao: 'regen' };
        const eff = {
          uid: uid(), name: def.nome || st.tipo, icon: def.icon || '✦',
          stat: statMap[st.tipo] || 'custom', value: st.dano || 0,
          duration: st.turnos || 2, type: tipoBuff,
        };
        setFighters((prev) => prev.map((f) => f.id === defender.id ? { ...f, statusEffects: [...f.statusEffects, eff] } : f));
        addLog(`✨ ${defender.name} recebe ${eff.name} por ${eff.duration} rodadas`);
      }
      setActTargets([]);
      return;
    }

    if (actionMode === 'item') {
      const itens = itensDoLutador(attacker);
      const it = itens.find((x) => x.id === selItemId);
      if (!it) return;
      const alvo = fighters.find((f) => f.id === actTargets[0]) || attacker;
      let hpDelta = 0, mpDelta = 0;
      if (it.cura) hpDelta += it.cura;
      if (it.mana) mpDelta += it.mana;
      setFighters((prev) => prev.map((f) => {
        if (f.id !== alvo.id) return f;
        let hp = Math.max(0, Math.min(f.hpMax, f.hp + hpDelta));
        let mp = Math.max(0, Math.min(f.mpMax, f.mp + mpDelta));
        return { ...f, hp, mp };
      }));
      addLog(`🧪 ${attacker.name} usa ${it.nome} em ${alvo.name}${hpDelta ? ` +${hpDelta} HP` : ''}${mpDelta ? ` +${mpDelta} MP` : ''}`);
      setActTargets([]);
      return;
    }
  }, [
    fighters, actAttacker, actTargets, actionMode, selWeaponId, selSpellId, selItemId,
    armasDoLutador, magiasDoLutador, itensDoLutador, addLog, STATUS_DEFS, SPELLS,
    initiativeRolled, initiativeOrder, currentTurnIndex,
  ]);

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

    // Respeita a ordem de turno quando a iniciativa já foi rolada.
    if (initiativeRolled && initiativeOrder.length > 0) {
      const currentId = initiativeOrder[currentTurnIndex];
      if (atkAttacker !== currentId) {
        const current = fighters.find((f) => f.id === currentId);
        addLog(`⛔ Não é a vez de ${attacker.name}. Aguarde a vez de ${current ? current.name : '—'}.`);
        return;
      }
    }

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
          const res = applyDamageWithProtection(defender, dmg);
          setFighters((prev) => prev.map((f) => {
            if (f.id !== defender.id) return f;
            if (res.protecaoDano > 0) {
              return { ...f, protection: { ...f.protection, hp: Math.max(0, f.protection?.hp - res.protecaoDano) } };
            }
            return { ...f, hp: Math.max(0, f.hp - res.danoReal) };
          }));
          const critText = isCrit ? ' 🎯 CRÍTICO!' : '';
          const suffix = res.msg ? ` ${res.msg}` : res.danoReal > 0 ? ` → ${dmg} dano${isCrit ? ' x2' : ''}` : '';
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} vs ${threshold}+ → ACERTA${critText}${suffix}`);
          if (res.protecaoQuebrou) addLog(res.msg);
          setRollResult({ roll: finalRoll, threshold, hit: true, isCrit, damage: res.danoReal });
        } else {
          addLog(`${attacker.name} ataca ${defender.name} → D20: ${finalRoll} vs ${threshold}+ → ERRA`);
          setRollResult({ roll: finalRoll, threshold, hit: false, isCrit: false, damage: 0 });
        }
      }
    }, 60);
  }, [atkAttacker, atkDefender, fighters, addLog, initiativeRolled, initiativeOrder, currentTurnIndex]);

  const nextTurn = useCallback(() => {
    if (initiativeOrder.length === 0) {
      // Sem iniciativa rolando: comportamento antigo (próxima rodada)
      setFighters((prev) => processProtectionTick(prev));
      tickEffects();
      setRound((r) => r + 1);
      setRollResult(null);
      addLog(`═══ Rodada ${round + 1} ═══`);
      return;
    }
    const advance = (idx) => {
      const nextIdx = idx + 1;
      if (nextIdx >= initiativeOrder.length) {
        // Fim da rodada: processa efeitos e proteção, incrementa rodada e reinicia a ordem
        setFighters((prev) => processProtectionTick(prev));
        tickEffects();
        setRound((r) => r + 1);
        setCurrentTurnIndex(0);
        addLog(`═══ Fim da rodada ${round}. Iniciando rodada ${round + 1} ═══`);
      } else {
        const nextFighter = fighters.find((f) => f.id === initiativeOrder[nextIdx]);
        if (nextFighter && nextFighter.hp <= 0) {
          // Pula combatentes derrotados
          advance(nextIdx);
        } else {
          setCurrentTurnIndex(nextIdx);
        }
      }
      setRollResult(null);
    };
    advance(currentTurnIndex);
  }, [currentTurnIndex, initiativeOrder, round, fighters, tickEffects, addLog]);

  const doRoll = useCallback(() => {
    const faces = Math.max(2, Math.min(100, Number(diceFaces) || 20));
    const qty = Math.max(1, Math.min(5, Number(diceQty) || 1));
    const bonus = Number(diceBonus) || 0;
    setRolling(true);
    setDiceRolls([]);
    setDiceTotal(null);
    let steps = 0;
    const interval = setInterval(() => {
      steps += 1;
      const rolls = Array.from({ length: qty }, () => Math.floor(Math.random() * faces) + 1);
      setDiceRolls(rolls);
      setDiceTotal(rolls.reduce((s, n) => s + n, 0) + bonus);
      if (steps >= 12) {
        clearInterval(interval);
        setRolling(false);
        const finalRolls = Array.from({ length: qty }, () => Math.floor(Math.random() * faces) + 1);
        const total = finalRolls.reduce((s, n) => s + n, 0) + bonus;
        setDiceRolls(finalRolls);
        setDiceTotal(total);
        addLog(`🎲 Rola ${qty}d${faces}${bonus >= 0 ? '+' + bonus : bonus} → [${finalRolls.join(', ')}] = ${total}`);
      }
    }, 60);
  }, [diceFaces, diceQty, diceBonus, addLog]);

  const renderFighterCard = (f) => {
    const hpPct = f.hpMax > 0 ? (f.hp / f.hpMax) * 100 : 0;
    const mpPct = f.mpMax > 0 ? (f.mp / f.mpMax) * 100 : 0;
    const dead = f.hp <= 0;
    const isTurn = initiativeRolled && initiativeOrder.length > 0 && initiativeOrder[currentTurnIndex] === f.id;
    const turnPos = initiativeRolled ? initiativeOrder.indexOf(f.id) + 1 : null;
    return (
      <div key={f.id} className={`fighter-card ${dead ? 'fighter-dead' : ''} ${isTurn ? 'fighter-turn' : ''}`}>
        <div className="fighter-card-header">
          <span className="fighter-card-name">{dead && '☠️ '}{f.name}{isTurn ? ' ◀── vez' : ''}</span>
          {turnPos && <span className="turn-pos">#{turnPos}</span>}
          <button className="ghost remove-x" onClick={() => removeFighter(f.id)}>✕</button>
        </div>
        <div className="fighter-card-stats-row">
          {[
            { label: 'INI', val: f.initiative ?? '—' },
            { label: 'VEL', val: effectiveStat(f, 'destreza') },
            { label: 'REF', val: effectiveStat(f, 'reflexos') },
            { label: 'FOR', val: effectiveStat(f, 'forca') },
            { label: 'INT', val: effectiveStat(f, 'inteligencia') },
            { label: 'RES', val: effectiveStat(f, 'resistencia') },
          ].map(({ label, val }) => (
            <span key={label} className={`fighter-card-stat ${label === 'INI' && isTurn ? 'stat-ini-turn' : ''}`}>{label} {val}</span>
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
          {f.protection && (
            <div className="fighter-card-bar-row protection-row">
              <span className="bar-label">🛡️ Prot</span>
              <div className="stat-bar-wrap">
                <div className={`stat-bar stat-bar-prot ${f.protection.state === 'vulnerable' ? 'prot-vuln' : ''}`} style={{ width: `${f.protection.maxHp > 0 ? (f.protection.hp / f.protection.maxHp) * 100 : 0}%` }} />
                <span className="stat-num">{f.protection.hp}/{f.protection.maxHp}</span>
              </div>
              <span className={`prot-state ${f.protection.state}`}>
                {f.protection.state === 'active' ? 'ativo'
                  : f.protection.state === 'vulnerable' ? `vulnerável ${f.protection.vulnerableTurnsLeft}t`
                  : `recarregando ${f.protection.rechargeTurnsLeft}t`}
              </span>
            </div>
          )}
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
        <div className="topbar-left">
          <h1>📋 Batalha de Mesa</h1>
          <span className="player-name">Rodada {round}</span>
          {initiativeRolled && initiativeOrder.length > 0 && (
            <span className="turn-badge">
              🎯 Vez de:{' '}
              <strong>{fighters.find((f) => f.id === initiativeOrder[currentTurnIndex])?.name}</strong>
              {currentTurnIndex + 1}/{initiativeOrder.length}
            </span>
          )}
        </div>
        <div className="topbar-right">
          <button className="ghost" onClick={onBack}>← Voltar</button>
          <button
            onClick={rollInitiative}
            disabled={initiativeRolled || fighters.length === 0}
            className={initiativeRolled ? 'ghost' : ''}
          >
            {initiativeRolled ? '✅ Iniciativa definida' : '🎲 Rolar Iniciativa'}
          </button>
          <button onClick={nextTurn} disabled={fighters.length === 0} className="btn-next-turn">
            ➡️ Próximo Turno
          </button>
        </div>
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

          <section className="panel">
            <h2>👑 Adicionar Chefão de Bioma</h2>
            <p className="muted small">Entra como inimigo com os atributos do bestiário. Golpes, passiva, especial e ultimate vão para a crônica.</p>
            <div className="table-battle-form">
              <select value={bossId} onChange={(e) => setBossId(e.target.value)}>
                <option value="">Escolha um chefão...</option>
                {bosses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icone || '👑'} {b.nome} (Nv.{b.nivel}){b.bioma ? ` — ${b.bioma}` : ''}
                  </option>
                ))}
              </select>
              <button onClick={addBoss} disabled={!bossId}>Invocar chefão</button>
              {bossId && PROTECTION_CHEFS[bossId] && (
                <label className="check-label inline" style={{ marginLeft: 10 }}>
                  <input
                    type="checkbox"
                    checked={bossEclipse}
                    onChange={(e) => setBossEclipse(e.target.checked)}
                  />
                  🌑 Modo Eclipse (proteção extra)
                </label>
              )}
            </div>
            {bossId && (() => {
              const b = MONSTERS[bossId];
              const cfg = PROTECTION_CHEFS[bossId];
              if (!b) return null;
              const proto = cfg ? makeProtection(cfg, bossEclipse) : null;
              return (
                <div className="muted small" style={{ marginTop: 8 }}>
                  <div><strong>Passiva:</strong> {b.passiva}</div>
                  <div><strong>Golpes:</strong> {(b.spells || []).map((s) => SPELLS[s]?.nome || s).join(' · ')}</div>
                  {(b.especial || b.ultimate) && (
                    <div>
                      {b.especial && <><strong>Especial:</strong> {SPELLS[b.especial]?.nome || b.especial} </>}
                      {b.ultimate && <><strong>Ultimate:</strong> {SPELLS[b.ultimate]?.nome || b.ultimate}</>}
                      {b.varianteEclipse?.spell && (
                        <> · <strong>Eclipse:</strong> {SPELLS[b.varianteEclipse.spell]?.nome || b.varianteEclipse.spell}</>
                      )}
                    </div>
                  )}
                  {proto && (
                    <div style={{ marginTop: 6, padding: 6, background: 'rgba(255, 209, 102, 0.12)', border: '1px solid var(--accent-2)', borderRadius: 8 }}>
                      <strong>🛡️ Proteção do chefe:</strong> {proto.hp}/{proto.maxHp} HP ・
                      vulnerável {cfg.vulnerableTurns}t ・ recarrega {cfg.rechargeTurns}t
                      {bossEclipse ? ' (Eclipse: +50% HP)' : ''}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {characters.length > 0 && (
            <section className="panel">
              <h2>📥 Importar Ficha</h2>              <div className="table-battle-form">
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

          <section className="panel attack-section">
            <h2>⚔️ Ataque com Dado</h2>
            <div className="attack-panel attack-command">
              <div className="attack-row">
                <div className="attack-field">
                  <label>Atacante</label>
                  <select value={atkAttacker} onChange={(e) => setAtkAttacker(e.target.value)}>
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                    ))}
                  </select>
                </div>
                <span className="attack-vs">⚔</span>
                <div className="attack-field">
                  <label>Alvo</label>
                  <select value={atkDefender} onChange={(e) => setAtkDefender(e.target.value)}>
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp})</option>
                    ))}
                  </select>
                </div>
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
                <button className="dice-btn dice-btn-roll" onClick={rollDice} disabled={rolling || !atkAttacker || !atkDefender}>
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

          <section className="panel actions-section">
            <h2>🎯 Ações Rápidas (igual ao Campo de Batalha)</h2>
            <div className="attack-panel actions-command">
              {/* Linha 1: Atacante + Modo */}
              <div className="actions-row">
                <div className="action-field">
                  <label>Atacante</label>
                  <select value={actAttacker} onChange={(e) => { setActAttacker(e.target.value); setActTargets([]); }}>
                    <option value="">—</option>
                    {alive.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} (HP {f.hp} MP {f.mp})</option>
                    ))}
                  </select>
                </div>
                <div className="action-field">
                  <label>Modo</label>
                  <select value={actionMode} onChange={(e) => {
                    setActionMode(e.target.value);
                    setSelSpellId('');
                    setSelItemId('');
                    setActTargets([]);
                  }}>
                    <option value="attack">⚔️ Ataque</option>
                    <option value="spell">🔮 Magia</option>
                    <option value="item">🧪 Item</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Arma / Magia / Item (apenas o relevante) */}
              {actAttacker && actionMode === 'attack' && (
                <div className="actions-row">
                  <div className="action-field">
                    <label>Arma</label>
                    <select value={selWeaponId} onChange={(e) => setSelWeaponId(e.target.value)}>
                      {armasDoLutador(fighters.find((f) => f.id === actAttacker)).map((a) => (
                        <option key={a.id} value={a.id}>{a.nome} (dano base {danoBaseDaArma(a)})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {actAttacker && actionMode === 'spell' && (
                <div className="actions-row">
                  <div className="action-field">
                    <label>Magia</label>
                    <select value={selSpellId} onChange={(e) => setSelSpellId(e.target.value)}>
                      <option value="">— Escolha uma magia —</option>
                      {magiasDoLutador(fighters.find((f) => f.id === actAttacker)).map((x) => (
                        <option key={x.sid} value={x.sid}>{x.spell.nome} (MP {x.spell.custo || 0})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {actAttacker && actionMode === 'item' && (
                <div className="actions-row">
                  <div className="action-field">
                    <label>Item</label>
                    <select value={selItemId} onChange={(e) => setSelItemId(e.target.value)}>
                      <option value="">— Escolha um item —</option>
                      {itensDoLutador(fighters.find((f) => f.id === actAttacker)).map((it) => (
                        <option key={it.id} value={it.id}>{it.nome}{it.cura ? ` +${it.cura} HP` : ''}{it.mana ? ` +${it.mana} MP` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Linha 3: Alvo(s) */}
              {actAttacker && (
                <div className="actions-row">
                  <div className="action-field action-field-full">
                    <label>Alvo(s)</label>
                    <select multiple size={Math.min(4, Math.max(1, alive.length))} value={actTargets} onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                      setActTargets(vals);
                    }}>
                      {alive.filter((f) => f.id !== actAttacker).map((f) => (
                        <option key={f.id} value={f.id}>{f.team === 'ally' ? '🛡️' : '⚔️'} {f.name} (HP {f.hp})</option>
                      ))}
                      {alive.length <= 1 && <option disabled>Sem outros alvos vivos</option>}
                    </select>
                    <small className="muted">Segure Ctrl/Cmd para múltiplos alvos</small>
                  </div>
                </div>
              )}

              {/* Botão executar */}
              <div className="actions-row actions-row-execute">
                <button className="dice-btn dice-btn-execute" onClick={executarAcao} disabled={!actAttacker || actTargets.length === 0 || (actionMode === 'spell' && !selSpellId) || (actionMode === 'item' && !selItemId)}>
                  ▶ Executar Ação
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>🎲 Dado de Decisão (fora do combate)</h2>
            <p className="muted small">Use para decidir situações: se um buff/debuff vale, se o ambiente reage, testes de perícia, sorte do Mestre etc.</p>
            <div className="attack-panel">
              <div className="attack-selects">
                <label>
                  Dados
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={diceQty}
                    onChange={(e) => setDiceQty(Math.max(1, Math.min(5, +e.target.value || 1)))}
                  />
                </label>
                <span className="vs-text">d</span>
                <label>
                  Lados
                  <select value={diceFaces} onChange={(e) => setDiceFaces(Number(e.target.value))}>
                    {[2, 4, 6, 8, 10, 12, 20, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label>
                  Bônus
                  <input
                    type="number"
                    min={-10}
                    max={10}
                    value={diceBonus}
                    onChange={(e) => setDiceBonus(Math.max(-10, Math.min(10, +e.target.value || 0)))}
                  />
                </label>
              </div>
              <div className="dice-area">
                <button className="dice-btn" onClick={doRoll} disabled={rolling}>
                  {rolling ? '🎲...' : `🎲 Rolar ${diceQty}d${diceFaces}${diceBonus >= 0 ? '+' + diceBonus : diceBonus}`}
                </button>
                {diceRolls.length > 0 && !rolling && (
                  <div className="dice-result neutral">
                    <span className="dice-number">{diceTotal}</span>
                    <span className="dice-label">[{diceRolls.join(', ')}]{diceBonus ? ` ${diceBonus > 0 ? '+' : ''}${diceBonus}` : ''}</span>
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
