import { query } from '../db/index.js';
import {
  CLASSES,
  SPELLS,
  EQUIPMENT,
  POTIONS,
  deriveStats,
  ATTRIBUTE_KEYS,
  POINTS_TO_DISTRIBUTE,
  MIN_ATTRIBUTE,
  MAX_ATTRIBUTE,
  MAX_ATTRIBUTE_WITH_BONUS,
} from '../game/data.js';
import { RACES } from '../game/races.js';

export async function createPlayer(name) {
  const trimmed = String(name).trim();
  if (!trimmed) throw new Error('Informe um nome de jogador.');
  const { rows } = await query(
    `INSERT INTO players (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [trimmed],
  );
  return rows[0];
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function sanitizeBonus(bonus) {
  const clean = {};
  for (const key of ATTRIBUTE_KEYS) {
    const v = Number(bonus?.[key]);
    if (!Number.isNaN(v)) clean[key] = Math.max(-3, Math.min(3, v));
  }
  if ('escolha' in (bonus || {})) clean.escolha = Number(bonus.escolha) || 1;
  return clean;
}

const SKILL_TYPES = ['fisico', 'magia', 'cura', 'buff', 'defesa'];

export function normalizeRaceDef(def = {}) {
  const preset = RACES[def.id];
  const base = preset || {};
  const clean = {
    id: String(def.id || 'raca').slice(0, 40),
    nome: String(def.nome || base.nome || 'Raça').slice(0, 40),
    bonus: sanitizeBonus(isObj(def.bonus) ? def.bonus : base.bonus),
    passiva: String(def.passiva ?? base.passiva ?? '').slice(0, 300),
    efeito: isObj(def.efeito) ? def.efeito : base.efeito || {},
  };
  if ('escolha' in clean.bonus) {
    clean.choice = ATTRIBUTE_KEYS.includes(def.choice) ? def.choice : 'forca';
  }
  return clean;
}

export function normalizeClassDef(def = {}) {
  const preset = CLASSES[def.id];
  const arch = def.archetype && CLASSES[def.archetype] ? CLASSES[def.archetype] : null;
  const base = preset || arch || {};
  return {
    id: String(def.id || 'classe').slice(0, 40),
    nome: String(def.nome || base.nome || 'Classe').slice(0, 40),
    bonus: sanitizeBonus(isObj(def.bonus) ? def.bonus : base.bonus),
    hpPerLevel: clampInt(def.hpPerLevel ?? base.hpPerLevel ?? 8, 1, 30),
    mpPerLevel: clampInt(def.mpPerLevel ?? base.mpPerLevel ?? 5, 1, 30),
    levelUp: ATTRIBUTE_KEYS.includes(def.levelUp) ? def.levelUp : base.levelUp || 'forca',
    spellList: Array.isArray(def.spellList) ? def.spellList : base.spellList || [],
    archetype: def.archetype || base.id || 'guerreiro',
    primary: !!def.primary,
  };
}

export function normalizeSkill(s = {}) {
  return {
    id: String(s.id || s.nome || 'golpe').slice(0, 40),
    nome: String(s.nome || 'Golpe').slice(0, 40),
    tipo: SKILL_TYPES.includes(s.tipo) ? s.tipo : 'magia',
    poder: clampInt(s.poder ?? 100, 10, 1000),
    custo: clampInt(s.custo ?? 0, 0, 99),
    cooldown: clampInt(s.cooldown ?? 0, 0, 20),
    todos: !!s.todos,
    desc: String(s.desc || '').slice(0, 200),
  };
}

function normalizeCondicao(c) {
  const tipos = ['danoRecebido', 'hpPct', 'kills', 'turnos', 'aliadosCaidos'];
  if (!isObj(c) || !tipos.includes(c.tipo)) return null;
  return { tipo: c.tipo, valor: Math.max(0, Number(c.valor) || 0) };
}

export function normalizeMegaSkill(s = null) {
  if (!isObj(s) || !s.nome) return null;
  const def = normalizeSkill(s);
  return {
    ...def,
    condicao: normalizeCondicao(s.condicao),
    modo:
      isObj(s.modo) && s.modo.turnos
        ? {
            turnos: clampInt(s.modo.turnos, 1, 10),
            danoMultPct: clampInt(s.modo.danoMultPct ?? 50, 0, 300),
          }
        : null,
  };
}

export function validateAttributes(attributes) {
  const cleaned = {};
  let total = 0;
  for (const key of ATTRIBUTE_KEYS) {
    const value = Number(attributes[key]);
    if (Number.isNaN(value)) throw new Error(`Atributo ${key} inválido.`);
    cleaned[key] = value;
    total += value;
  }
  if (total !== POINTS_TO_DISTRIBUTE) {
    throw new Error(`A soma dos atributos deve ser exatamente ${POINTS_TO_DISTRIBUTE}. Você distribuiu ${total}.`);
  }
  for (const key of ATTRIBUTE_KEYS) {
    if (cleaned[key] < MIN_ATTRIBUTE || cleaned[key] > MAX_ATTRIBUTE) {
      throw new Error(`${key} deve estar entre ${MIN_ATTRIBUTE} e ${MAX_ATTRIBUTE}.`);
    }
  }
  return cleaned;
}

function presetSkillsFrom(classes) {
  const out = [];
  for (const c of classes) {
    for (const id of c.spellList || []) {
      const s = SPELLS[id];
      if (!s) continue;
      const key = s.nome;
      if (out.some((x) => x.id === key)) continue;
      out.push({
        id: key,
        nome: s.nome,
        tipo: s.tipo === 'ataque' ? 'magia' : s.tipo,
        poder: Math.round((s.poder || 1) * 100),
        custo: s.custo || 0,
        cooldown: 0,
        todos: s.nome === 'Cura em Massa',
        desc: s.desc || '',
      });
    }
  }
  return out;
}

export function buildCharacterData(playerId, { name, attributes, races, classes, passiva, skills, ultimate, especial, equipment, race, raceChoice, class: legacyClass }) {
  const trimmed = String(name).trim();
  if (!trimmed) throw new Error('Informe o nome do personagem.');

  const rawRaces = Array.isArray(races) && races.length ? races : [{ id: race || 'humano', choice: raceChoice }];
  if (rawRaces.length > 3) throw new Error('Máximo de 3 raças por personagem.');
  const normRaces = rawRaces.map(normalizeRaceDef);

  const rawClasses = Array.isArray(classes) && classes.length ? classes : [{ id: legacyClass || 'guerreiro' }];
  if (rawClasses.length > 2) throw new Error('Máximo de 2 classes por personagem.');
  const normClasses = rawClasses.map(normalizeClassDef);
  if (!normClasses.some((c) => c.primary)) normClasses[0].primary = true;

  const attrs = validateAttributes(attributes);
  const equipmentObj = {
    arma: equipment?.arma ? { ...equipment.arma } : null,
    armadura: equipment?.armadura ? { ...equipment.armadura } : null,
  };

  const stats = deriveStats(normClasses, 1, attrs, equipmentObj, normRaces);
  const hpMax = stats.hpMax;
  const mpMax = stats.mpMax;

  const skillsList = [...presetSkillsFrom(normClasses), ...(Array.isArray(skills) ? skills.map(normalizeSkill) : [])];
  const primary = normClasses.find((c) => c.primary) || normClasses[0];

  return {
    playerId,
    name: trimmed,
    class: primary.archetype || primary.id,
    race: normRaces[0].id,
    custom_class_name: primary.id !== primary.archetype ? primary.nome : null,
    races: normRaces,
    classes: normClasses,
    passiva: String(passiva || '').trim().slice(0, 300),
    skills: skillsList,
    ultimate: normalizeMegaSkill(ultimate),
    especial: normalizeMegaSkill(especial),
    level: 1,
    xp: 0,
    hp_current: hpMax,
    hp_max: hpMax,
    mp_current: mpMax,
    mp_max: mpMax,
    attributes: attrs,
    equipment: equipmentObj,
    inventory: [
      potionItem('pocao_cura'),
      potionItem('pocao_cura'),
      potionItem('elixir_mana'),
    ],
    spells: skillsList.map((s) => s.id),
  };
}

export function potionItem(id) {
  const p = POTIONS[id];
  return { id, nome: p.nome, tipo: 'pocao', cura: p.cura || null, mana: p.mana || null };
}

export async function createCharacter(input) {
  const data = buildCharacterData(input.playerId, input);
  const { rows } = await query(
    `INSERT INTO characters
      (player_id, name, class, race, custom_class_name, races, classes, passiva, skills, ultimate, especial,
       level, xp, hp_current, hp_max, mp_current, mp_max,
       attributes, equipment, inventory, spells)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING *`,
    [
      data.playerId,
      data.name,
      data.class,
      data.race,
      data.custom_class_name,
      JSON.stringify(data.races),
      JSON.stringify(data.classes),
      data.passiva,
      JSON.stringify(data.skills),
      JSON.stringify(data.ultimate),
      JSON.stringify(data.especial),
      data.level,
      data.xp,
      data.hp_current,
      data.hp_max,
      data.mp_current,
      data.mp_max,
      JSON.stringify(data.attributes),
      JSON.stringify(data.equipment),
      JSON.stringify(data.inventory),
      JSON.stringify(data.spells),
    ],
  );
  return decorateCharacter(rows[0]);
}

export async function listCharacters(playerId) {
  const { rows } = await query(
    'SELECT * FROM characters WHERE player_id = $1 ORDER BY created_at DESC',
    [playerId],
  );
  return rows.map(decorateCharacter);
}

export async function getCharacter(id) {
  const { rows } = await query('SELECT * FROM characters WHERE id = $1', [id]);
  return rows[0] ? decorateCharacter(rows[0]) : null;
}

function decorateCharacter(row) {
  return {
    ...row,
    attributes: jsonOrObj(row.attributes),
    equipment: jsonOrObj(row.equipment),
    inventory: jsonOrObj(row.inventory),
    spells: jsonOrObj(row.spells),
    races: jsonOrObj(row.races) || [],
    classes: jsonOrObj(row.classes) || [],
    passiva: row.passiva || '',
    skills: jsonOrObj(row.skills) || [],
    ultimate: jsonOrObj(row.ultimate) || null,
    especial: jsonOrObj(row.especial) || null,
  };
}

function jsonOrObj(value) {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export async function equipItem(characterId, slot, itemId) {
  const char = await getCharacter(characterId);
  if (!char) throw new Error('Personagem não encontrado.');

  const catalog = slot === 'arma' ? EQUIPMENT.armas : EQUIPMENT.armaduras;
  const item = catalog[itemId];
  if (!item) throw new Error('Item não existe.');

  const equipment = { ...char.equipment, [slot]: itemId ? { id: itemId, ...item } : null };
  const stats = deriveStats(char.classes, char.level, char.attributes, equipment, char.races);
  const hpMax = stats.hpMax;
  const mpMax = stats.mpMax;
  await query(
    `UPDATE characters SET equipment = $1, hp_max = $2, mp_max = $3, hp_current = $4, mp_current = $5 WHERE id = $6`,
    [
      JSON.stringify(equipment),
      hpMax,
      mpMax,
      Math.min(char.hp_current, hpMax),
      Math.min(char.mp_current, mpMax),
      characterId,
    ],
  );
  return getCharacter(characterId);
}

export async function grantRewards(battle) {
  for (const p of battle.participants) {
    if (p.xpGained <= 0) continue;
    const char = await getCharacter(p.characterId);
    if (!char) continue;

    const xp = char.xp + p.xpGained;
    let level = char.level;
    let newXp = xp;
    while (newXp >= level * 100) {
      newXp -= level * 100;
      level += 1;
    }

    const levelsGained = level - char.level;
    const attributes = { ...char.attributes };
    if (levelsGained > 0) {
      const primary = (char.classes || []).find((c) => c.primary) || (char.classes || [])[0] || {};
      const upAttr = primary.levelUp || 'forca';
      attributes[upAttr] = Math.min(
        (attributes[upAttr] || 0) + levelsGained,
        MAX_ATTRIBUTE_WITH_BONUS,
      );
    }

    const stats = deriveStats(char.classes, level, attributes, char.equipment, char.races);
    const hpMax = stats.hpMax;
    const mpMax = stats.mpMax;
    await query(
      `UPDATE characters
       SET xp = $1, level = $2, hp_max = $3, mp_max = $4, hp_current = $5, mp_current = $6,
           attributes = $7
       WHERE id = $8`,
      [
        newXp,
        level,
        hpMax,
        mpMax,
        Math.min(char.hp_current + (hpMax - char.hp_max), hpMax),
        Math.min(char.mp_current + (mpMax - char.mp_max), mpMax),
        JSON.stringify(attributes),
        p.characterId,
      ],
    );
  }
}
