import { query } from '../db/index.js';
import { CLASSES, ATTRIBUTE_KEYS } from '../game/data.js';
import { clamp } from '../utils.js';

// ---------------------------------------------------------------------------
// Regra de visibilidade do Registro do Mundo:
//  - "Minhas criações": tudo que o jogador criou (independente de publicação).
//  - "Catálogo do mundo": criações marcadas como públicas (is_public = true).
// A listagem padrão (para uso no jogo: FichaForm, CharacterSheet, Battle)
// devolve as públicas de todos + as privadas do próprio jogador.
// ---------------------------------------------------------------------------

function visibilityClause(viewerId, alias = '') {
  const c = alias ? `${alias}.` : '';
  return {
    where: `(${c}is_public = true OR ${c}creator_id = $1)`,
    params: [viewerId || null],
  };
}

export function validateCustomClass(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Informe o nome da classe.');
  const archetype = String(input.archetype || '').trim();
  if (!CLASSES[archetype]) {
    throw new Error('Arquétipo inválido. Escolha uma das 6 classes mecânicas.');
  }
  return {
    name,
    funcao: String(input.funcao || '').trim(),
    passiva: String(input.passiva || '').trim(),
    forcas: String(input.forcas || '').trim(),
    fraquezas: String(input.fraquezas || '').trim(),
    archetype,
    is_public: !!input.is_public,
  };
}

export async function createCustomClass(creatorId, input) {
  const data = validateCustomClass(input);
  const { rows } = await query(
    `INSERT INTO custom_classes
      (creator_id, name, funcao, passiva, forcas, fraquezas, archetype, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      creatorId,
      data.name,
      data.funcao,
      data.passiva,
      data.forcas,
      data.fraquezas,
      data.archetype,
      data.is_public,
    ],
  );
  return rows[0];
}

export async function listCustomClasses(viewerId) {
  const { where, params } = visibilityClause(viewerId, 'cc');
  const { rows } = await query(
    `SELECT cc.*, p.name AS creator_name
     FROM custom_classes cc
     JOIN players p ON p.id = cc.creator_id
     WHERE ${where}
     ORDER BY cc.created_at DESC`,
    params,
  );
  return rows;
}

export async function getCustomClass(id) {
  const { rows } = await query('SELECT * FROM custom_classes WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function updateCustomClass(id, creatorId, input) {
  const existing = await getCustomClass(id);
  if (!existing) throw new Error('Classe customizada não encontrada.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode editar esta classe.');
  const data = validateCustomClass(input);
  const { rows } = await query(
    `UPDATE custom_classes
     SET name = $1, funcao = $2, passiva = $3, forcas = $4, fraquezas = $5, archetype = $6, is_public = $7
     WHERE id = $8 RETURNING *`,
    [data.name, data.funcao, data.passiva, data.forcas, data.fraquezas, data.archetype, data.is_public, id],
  );
  return rows[0];
}

export async function deleteCustomClass(id, creatorId) {
  const existing = await getCustomClass(id);
  if (!existing) throw new Error('Classe customizada não encontrada.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir esta classe.');
  await query('DELETE FROM custom_classes WHERE id = $1', [id]);
}

// ---------- Monstros customizados ----------

const ELEMENTOS = ['fisico', 'fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'];

function sanitizeElementList(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((el) => ELEMENTOS.includes(el) && el !== 'fisico');
}

export function validateCustomMonster(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome do monstro.');
  const nivel = Math.max(1, Math.min(50, Number(input.nivel) || 1));
  const attributes = {};
  for (const key of ['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos']) {
    const v = Number(input.attributes?.[key]);
    attributes[key] = Number.isNaN(v) ? 1 : Math.max(1, Math.min(12, v));
  }
  const elemento = ELEMENTOS.includes(input.elemento) && input.elemento !== 'fisico' ? input.elemento : 'fisico';
  return {
    nome,
    nivel,
    attributes,
    arma: input.arma
      ? {
          nome: String(input.arma.nome || 'Ataque'),
          danoBase: Math.max(1, Number(input.arma.danoBase) || 6),
        }
      : null,
    spells: Array.isArray(input.spells) ? input.spells : [],
    passiva: String(input.passiva || '').trim(),
    escala_chefe: !!input.escala_chefe,
    multiplicador_hp: Math.max(0.5, Number(input.multiplicador_hp) || 3),
    elemento,
    fraquezas: sanitizeElementList(input.fraquezas),
    resistencias: sanitizeElementList(input.resistencias),
    is_public: !!input.is_public,
  };
}

export async function createCustomMonster(creatorId, input) {
  const data = validateCustomMonster(input);
  const { rows } = await query(
    `INSERT INTO custom_monsters
      (creator_id, nome, nivel, attributes, arma, spells, passiva, escala_chefe, multiplicador_hp,
       elemento, fraquezas, resistencias, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      creatorId,
      data.nome,
      data.nivel,
      JSON.stringify(data.attributes),
      data.arma ? JSON.stringify(data.arma) : null,
      JSON.stringify(data.spells),
      data.passiva,
      data.escala_chefe,
      data.multiplicador_hp,
      data.elemento,
      JSON.stringify(data.fraquezas),
      JSON.stringify(data.resistencias),
      data.is_public,
    ],
  );
  return decorateMonster(rows[0]);
}

export async function listCustomMonsters(viewerId) {
  const { where, params } = visibilityClause(viewerId, 'cm');
  const { rows } = await query(
    `SELECT cm.*, p.name AS creator_name
     FROM custom_monsters cm
     JOIN players p ON p.id = cm.creator_id
     WHERE ${where}
     ORDER BY cm.created_at DESC`,
    params,
  );
  return rows.map(decorateMonster);
}

export async function getCustomMonster(id) {
  const { rows } = await query('SELECT * FROM custom_monsters WHERE id = $1', [id]);
  return rows[0] ? decorateMonster(rows[0]) : null;
}

export async function updateCustomMonster(id, creatorId, input) {
  const existing = await getCustomMonster(id);
  if (!existing) throw new Error('Monstro customizado não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode editar este monstro.');
  const data = validateCustomMonster(input);
  const { rows } = await query(
    `UPDATE custom_monsters
     SET nome = $1, nivel = $2, attributes = $3, arma = $4, spells = $5, passiva = $6,
         escala_chefe = $7, multiplicador_hp = $8, elemento = $9, fraquezas = $10,
         resistencias = $11, is_public = $12
     WHERE id = $13 RETURNING *`,
    [
      data.nome,
      data.nivel,
      JSON.stringify(data.attributes),
      data.arma ? JSON.stringify(data.arma) : null,
      JSON.stringify(data.spells),
      data.passiva,
      data.escala_chefe,
      data.multiplicador_hp,
      data.elemento,
      JSON.stringify(data.fraquezas),
      JSON.stringify(data.resistencias),
      data.is_public,
      id,
    ],
  );
  return decorateMonster(rows[0]);
}

export async function deleteCustomMonster(id, creatorId) {
  const existing = await getCustomMonster(id);
  if (!existing) throw new Error('Monstro customizado não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir este monstro.');
  await query('DELETE FROM custom_monsters WHERE id = $1', [id]);
}

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function decorateMonster(row) {
  return {
    ...row,
    attributes: parseJson(row.attributes, {}),
    arma: parseJson(row.arma, null),
    spells: parseJson(row.spells, []),
    fraquezas: parseJson(row.fraquezas, []),
    resistencias: parseJson(row.resistencias, []),
    multiplicador_hp: Number(row.multiplicador_hp),
  };
}

// ---------- Raças customizadas ----------

export function validateCustomRace(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome da raça.');
  const bonus = {};
  for (const key of ATTRIBUTE_KEYS) {
    const v = Number(input.bonus?.[key]);
    if (!Number.isNaN(v)) bonus[key] = Math.max(-3, Math.min(3, v));
  }
  if (input.bonus?.escolha !== undefined) bonus.escolha = 1;
  return {
    nome: nome.slice(0, 40),
    bonus,
    passiva: String(input.passiva || '').trim().slice(0, 300),
    efeito: input.efeito && typeof input.efeito === 'object' && !Array.isArray(input.efeito) ? input.efeito : {},
    is_public: !!input.is_public,
  };
}

export async function createCustomRace(creatorId, input) {
  const data = validateCustomRace(input);
  const { rows } = await query(
    `INSERT INTO custom_races (creator_id, nome, bonus, passiva, efeito, is_public)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [creatorId, data.nome, JSON.stringify(data.bonus), data.passiva, JSON.stringify(data.efeito), data.is_public],
  );
  return decorateRace(rows[0]);
}

export async function listCustomRaces(viewerId) {
  const { where, params } = visibilityClause(viewerId, 'cr');
  const { rows } = await query(
    `SELECT cr.*, p.name AS creator_name
     FROM custom_races cr
     JOIN players p ON p.id = cr.creator_id
     WHERE ${where}
     ORDER BY cr.created_at DESC`,
    params,
  );
  return rows.map(decorateRace);
}

export async function getCustomRace(id) {
  const { rows } = await query('SELECT * FROM custom_races WHERE id = $1', [id]);
  return rows[0] ? decorateRace(rows[0]) : null;
}

export async function updateCustomRace(id, creatorId, input) {
  const existing = await getCustomRace(id);
  if (!existing) throw new Error('Raça customizada não encontrada.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode editar esta raça.');
  const data = validateCustomRace(input);
  const { rows } = await query(
    `UPDATE custom_races SET nome = $1, bonus = $2, passiva = $3, efeito = $4, is_public = $5
     WHERE id = $6 RETURNING *`,
    [data.nome, JSON.stringify(data.bonus), data.passiva, JSON.stringify(data.efeito), data.is_public, id],
  );
  return decorateRace(rows[0]);
}

export async function deleteCustomRace(id, creatorId) {
  const existing = await getCustomRace(id);
  if (!existing) throw new Error('Raça customizada não encontrada.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir esta raça.');
  await query('DELETE FROM custom_races WHERE id = $1', [id]);
}

export function decorateRace(row) {
  return {
    ...row,
    bonus: parseJson(row.bonus, {}),
    efeito: parseJson(row.efeito, {}),
  };
}

// ---------- Equipamentos customizados (armas e armaduras) ----------

export function validateCustomEquipment(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome do equipamento.');
  const tipo = input.tipo === 'armadura' ? 'armadura' : 'arma';
  const bonus = {};
  const penalidade = {};
  for (const key of ATTRIBUTE_KEYS) {
    const b = Number(input.bonus?.[key]);
    if (!Number.isNaN(b)) bonus[key] = Math.max(-3, Math.min(3, b));
    const p = Number(input.penalidade?.[key]);
    if (!Number.isNaN(p)) penalidade[key] = Math.max(-3, Math.min(3, p));
  }
  return {
    nome: nome.slice(0, 40),
    tipo,
    dano_base: tipo === 'arma' ? clamp(Number(input.dano_base), 1, 30) : 0,
    defesa: tipo === 'armadura' ? clamp(Number(input.defesa), 1, 20) : 0,
    bonus,
    penalidade,
    maleficio: String(input.maleficio || '').trim().slice(0, 200),
    is_public: !!input.is_public,
  };
}

export async function createCustomEquipment(creatorId, input) {
  const data = validateCustomEquipment(input);
  const { rows } = await query(
    `INSERT INTO custom_equipment (creator_id, nome, tipo, dano_base, defesa, bonus, penalidade, maleficio, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      creatorId,
      data.nome,
      data.tipo,
      data.dano_base,
      data.defesa,
      JSON.stringify(data.bonus),
      JSON.stringify(data.penalidade),
      data.maleficio,
      data.is_public,
    ],
  );
  return decorateEquipment(rows[0]);
}

export async function listCustomEquipment(viewerId) {
  const { where, params } = visibilityClause(viewerId, 'ce');
  const { rows } = await query(
    `SELECT ce.*, p.name AS creator_name
     FROM custom_equipment ce
     JOIN players p ON p.id = ce.creator_id
     WHERE ${where}
     ORDER BY ce.created_at DESC`,
    params,
  );
  return rows.map(decorateEquipment);
}

export async function getCustomEquipment(id) {
  const { rows } = await query('SELECT * FROM custom_equipment WHERE id = $1', [id]);
  return rows[0] ? decorateEquipment(rows[0]) : null;
}

export async function updateCustomEquipment(id, creatorId, input) {
  const existing = await getCustomEquipment(id);
  if (!existing) throw new Error('Equipamento não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode editar este equipamento.');
  const data = validateCustomEquipment(input);
  const { rows } = await query(
    `UPDATE custom_equipment
     SET nome = $1, tipo = $2, dano_base = $3, defesa = $4, bonus = $5, penalidade = $6, maleficio = $7, is_public = $8
     WHERE id = $9 RETURNING *`,
    [
      data.nome,
      data.tipo,
      data.dano_base,
      data.defesa,
      JSON.stringify(data.bonus),
      JSON.stringify(data.penalidade),
      data.maleficio,
      data.is_public,
      id,
    ],
  );
  return decorateEquipment(rows[0]);
}

export async function deleteCustomEquipment(id, creatorId) {
  const existing = await getCustomEquipment(id);
  if (!existing) throw new Error('Equipamento não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir este equipamento.');
  await query('DELETE FROM custom_equipment WHERE id = $1', [id]);
}

export function decorateEquipment(row) {
  return {
    ...row,
    bonus: parseJson(row.bonus, {}),
    penalidade: parseJson(row.penalidade, {}),
  };
}

// ---------- Golpes customizados ----------

const SKILL_TYPES = ['fisico', 'magia', 'cura', 'buff', 'defesa'];
const ALVOS = ['unico', 'proximo', 'aleatorio', 'todos', 'multi'];
const SKILL_KINDS = ['dano', 'cura', 'buff', 'defesa'];

export function validateCustomSkill(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome do golpe.');
  const tipo = SKILL_TYPES.includes(input.tipo) ? input.tipo : 'magia';
  const tipoCategoria = SKILL_KINDS.includes(input.tipo_categoria) ? input.tipo_categoria : (tipo === 'fisico' || tipo === 'magia' ? 'dano' : tipo);
  const alvo = ALVOS.includes(input.alvo) ? input.alvo : 'unico';
  return {
    nome: nome.slice(0, 40),
    tipo,
    poder: clamp(Number(input.poder), 10, 1000),
    custo: clamp(Number(input.custo), 0, 99),
    cooldown: clamp(Number(input.cooldown), 0, 20),
    todos: !!input.todos,
    descricao: String(input.descricao || '').trim().slice(0, 200),
    alvo: tipoCategoria === 'dano' || tipoCategoria === 'cura' ? alvo : 'unico',
    alvos: clamp(Number(input.alvos) || 3, 2, 10),
    splash: clamp(Number(input.splash) || 0.5, 0, 1),
    is_public: !!input.is_public,
  };
}

export async function createCustomSkill(creatorId, input) {
  const data = validateCustomSkill(input);
  const { rows } = await query(
    `INSERT INTO custom_skills
      (creator_id, nome, tipo, poder, custo, cooldown, todos, descricao, alvo, alvos, splash, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      creatorId,
      data.nome,
      data.tipo,
      data.poder,
      data.custo,
      data.cooldown,
      data.todos,
      data.descricao,
      data.alvo,
      data.alvos,
      data.splash,
      data.is_public,
    ],
  );
  return rows[0];
}

export async function listCustomSkills(viewerId) {
  const { where, params } = visibilityClause(viewerId, 'cs');
  const { rows } = await query(
    `SELECT cs.*, p.name AS creator_name
     FROM custom_skills cs
     JOIN players p ON p.id = cs.creator_id
     WHERE ${where}
     ORDER BY cs.created_at DESC`,
    params,
  );
  return rows;
}

export async function getCustomSkill(id) {
  const { rows } = await query('SELECT * FROM custom_skills WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function updateCustomSkill(id, creatorId, input) {
  const existing = await getCustomSkill(id);
  if (!existing) throw new Error('Golpe não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode editar este golpe.');
  const data = validateCustomSkill(input);
  const { rows } = await query(
    `UPDATE custom_skills
     SET nome = $1, tipo = $2, poder = $3, custo = $4, cooldown = $5, todos = $6, descricao = $7,
         alvo = $8, alvos = $9, splash = $10, is_public = $11
     WHERE id = $12 RETURNING *`,
    [
      data.nome,
      data.tipo,
      data.poder,
      data.custo,
      data.cooldown,
      data.todos,
      data.descricao,
      data.alvo,
      data.alvos,
      data.splash,
      data.is_public,
      id,
    ],
  );
  return rows[0];
}

export async function deleteCustomSkill(id, creatorId) {
  const existing = await getCustomSkill(id);
  if (!existing) throw new Error('Golpe não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir este golpe.');
  await query('DELETE FROM custom_skills WHERE id = $1', [id]);
}
