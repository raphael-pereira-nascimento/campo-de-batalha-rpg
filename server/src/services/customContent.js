import { query } from '../db/index.js';
import { CLASSES, ATTRIBUTE_KEYS } from '../game/data.js';

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
  };
}

export async function createCustomClass(creatorId, input) {
  const data = validateCustomClass(input);
  const { rows } = await query(
    `INSERT INTO custom_classes
      (creator_id, name, funcao, passiva, forcas, fraquezas, archetype)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      creatorId,
      data.name,
      data.funcao,
      data.passiva,
      data.forcas,
      data.fraquezas,
      data.archetype,
    ],
  );
  return rows[0];
}

export async function listCustomClasses() {
  const { rows } = await query(
    `SELECT cc.*, p.name AS creator_name
     FROM custom_classes cc
     JOIN players p ON p.id = cc.creator_id
     ORDER BY cc.created_at DESC`,
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
     SET name = $1, funcao = $2, passiva = $3, forcas = $4, fraquezas = $5, archetype = $6
     WHERE id = $7 RETURNING *`,
    [data.name, data.funcao, data.passiva, data.forcas, data.fraquezas, data.archetype, id],
  );
  return rows[0];
}

export async function deleteCustomClass(id, creatorId) {
  const existing = await getCustomClass(id);
  if (!existing) throw new Error('Classe customizada não encontrada.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir esta classe.');
  await query('DELETE FROM custom_classes WHERE id = $1', [id]);
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
  };
}

export async function createCustomMonster(creatorId, input) {
  const data = validateCustomMonster(input);
  const { rows } = await query(
    `INSERT INTO custom_monsters
      (creator_id, nome, nivel, attributes, arma, spells, passiva, escala_chefe, multiplicador_hp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
    ],
  );
  return decorateMonster(rows[0]);
}

export async function listCustomMonsters() {
  const { rows } = await query(
    `SELECT cm.*, p.name AS creator_name
     FROM custom_monsters cm
     JOIN players p ON p.id = cm.creator_id
     ORDER BY cm.created_at DESC`,
  );
  return rows.map(decorateMonster);
}

export async function getCustomMonster(id) {
  const { rows } = await query('SELECT * FROM custom_monsters WHERE id = $1', [id]);
  return rows[0] ? decorateMonster(rows[0]) : null;
}

export async function deleteCustomMonster(id, creatorId) {
  const existing = await getCustomMonster(id);
  if (!existing) throw new Error('Monstro customizado não encontrado.');
  if (existing.creator_id !== creatorId) throw new Error('Apenas o criador pode excluir este monstro.');
  await query('DELETE FROM custom_monsters WHERE id = $1', [id]);
}

export function decorateMonster(row) {
  return {
    ...row,
    attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
    arma: row.arma && typeof row.arma === 'string' ? JSON.parse(row.arma) : row.arma,
    spells: typeof row.spells === 'string' ? JSON.parse(row.spells) : row.spells,
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
  };
}

export async function createCustomRace(creatorId, input) {
  const data = validateCustomRace(input);
  const { rows } = await query(
    `INSERT INTO custom_races (creator_id, nome, bonus, passiva, efeito)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [creatorId, data.nome, JSON.stringify(data.bonus), data.passiva, JSON.stringify(data.efeito)],
  );
  return decorateRace(rows[0]);
}

export async function listCustomRaces() {
  const { rows } = await query(
    `SELECT cr.*, p.name AS creator_name
     FROM custom_races cr
     JOIN players p ON p.id = cr.creator_id
     ORDER BY cr.created_at DESC`,
  );
  return rows.map(decorateRace);
}

export async function deleteCustomRace(id, creatorId) {
  const existing = await query('SELECT * FROM custom_races WHERE id = $1', [id]);
  if (!existing.rows[0]) throw new Error('Raça customizada não encontrada.');
  if (existing.rows[0].creator_id !== creatorId) throw new Error('Apenas o criador pode excluir esta raça.');
  await query('DELETE FROM custom_races WHERE id = $1', [id]);
}

export function decorateRace(row) {
  return {
    ...row,
    bonus: typeof row.bonus === 'string' ? JSON.parse(row.bonus) : row.bonus,
    efeito: row.efeito && typeof row.efeito === 'string' ? JSON.parse(row.efeito) : row.efeito || {},
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
  };
}

function clamp(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function createCustomEquipment(creatorId, input) {
  const data = validateCustomEquipment(input);
  const { rows } = await query(
    `INSERT INTO custom_equipment (creator_id, nome, tipo, dano_base, defesa, bonus, penalidade, maleficio)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      creatorId,
      data.nome,
      data.tipo,
      data.dano_base,
      data.defesa,
      JSON.stringify(data.bonus),
      JSON.stringify(data.penalidade),
      data.maleficio,
    ],
  );
  return decorateEquipment(rows[0]);
}

export async function listCustomEquipment() {
  const { rows } = await query(
    `SELECT ce.*, p.name AS creator_name
     FROM custom_equipment ce
     JOIN players p ON p.id = ce.creator_id
     ORDER BY ce.created_at DESC`,
  );
  return rows;
}

export async function getCustomEquipment(id) {
  const { rows } = await query('SELECT * FROM custom_equipment WHERE id = $1', [id]);
  return rows[0] ? decorateEquipment(rows[0]) : null;
}

export async function deleteCustomEquipment(id, creatorId) {
  const existing = await query('SELECT * FROM custom_equipment WHERE id = $1', [id]);
  if (!existing.rows[0]) throw new Error('Equipamento não encontrado.');
  if (existing.rows[0].creator_id !== creatorId) throw new Error('Apenas o criador pode excluir este equipamento.');
  await query('DELETE FROM custom_equipment WHERE id = $1', [id]);
}

export function decorateEquipment(row) {
  return {
    ...row,
    bonus: row.bonus && typeof row.bonus === 'string' ? JSON.parse(row.bonus) : row.bonus || {},
    penalidade: row.penalidade && typeof row.penalidade === 'string' ? JSON.parse(row.penalidade) : row.penalidade || {},
  };
}

// ---------- Golpes customizados ----------

const SKILL_TYPES = ['fisico', 'magia', 'cura', 'buff', 'defesa'];

export function validateCustomSkill(input) {
  const nome = String(input.nome || '').trim();
  if (!nome) throw new Error('Informe o nome do golpe.');
  return {
    nome: nome.slice(0, 40),
    tipo: SKILL_TYPES.includes(input.tipo) ? input.tipo : 'magia',
    poder: clamp(Number(input.poder), 10, 1000),
    custo: clamp(Number(input.custo), 0, 99),
    cooldown: clamp(Number(input.cooldown), 0, 20),
    todos: !!input.todos,
    descricao: String(input.descricao || '').trim().slice(0, 200),
  };
}

export async function createCustomSkill(creatorId, input) {
  const data = validateCustomSkill(input);
  const { rows } = await query(
    `INSERT INTO custom_skills (creator_id, nome, tipo, poder, custo, cooldown, todos, descricao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [creatorId, data.nome, data.tipo, data.poder, data.custo, data.cooldown, data.todos, data.descricao],
  );
  return rows[0];
}

export async function listCustomSkills() {
  const { rows } = await query(
    `SELECT cs.*, p.name AS creator_name
     FROM custom_skills cs
     JOIN players p ON p.id = cs.creator_id
     ORDER BY cs.created_at DESC`,
  );
  return rows;
}

export async function deleteCustomSkill(id, creatorId) {
  const existing = await query('SELECT * FROM custom_skills WHERE id = $1', [id]);
  if (!existing.rows[0]) throw new Error('Golpe não encontrado.');
  if (existing.rows[0].creator_id !== creatorId) throw new Error('Apenas o criador pode excluir este golpe.');
  await query('DELETE FROM custom_skills WHERE id = $1', [id]);
}
