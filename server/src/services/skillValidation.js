// Validação pura dos golpes personalizados do Registro do Mundo.
// Fica em módulo separado do `customContent.js` para poder ser testada sem
// abrir o banco e para ser usada pelo cliente/offline quando necessário.

import { STATUS_KEYS, ELEMENTOS } from '../game/data.js';
import { clamp } from '../utils.js';

export const SKILL_TYPES = ['fisico', 'magia', 'cura', 'buff', 'defesa'];
// Estrutura técnica da árvore (P-15/P-01 ainda pendentes): nível manual 1–30,
// o mesmo intervalo usado pelo ajuste de nível das fichas. Nenhum custo oficial
// de desbloqueio foi criado — a flag é apenas um controle do jogador/mestre.
export const NIVEL_GOLPE_MIN = 1;
export const NIVEL_GOLPE_MAX = 30;
// Vocabulário usado pelo motor e por `AlvoSelect`.
export const ALVOS_OFICIAIS = ['unico', 'area', 'cone', 'explosao'];
// Vocabulário antigo aceito por golpes já salvos no Registro.
const ALVOS_LEGADOS = { proximo: 'unico', aleatorio: 'unico', multi: 'cone', todos: 'area' };
const SKILL_KINDS = ['dano', 'cura', 'buff', 'defesa'];

function numero(valor, padrao, min, max) {
  const n = Number(valor);
  return clamp(Number.isFinite(n) ? n : padrao, min, max);
}

// Metadados da árvore de habilidades. Golpes antigos (sem estes campos) são
// tratados como nível 1, elemento físico e já desbloqueados — compatibilidade
// com todas as fichas salvas antes da árvore existir.
export function normalizarMetadadosGolpe(input = {}) {
  const elemento = ELEMENTOS.includes(input.elemento) ? input.elemento : 'fisico';
  const nivel = Math.round(numero(input.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX));
  return {
    elemento,
    nivel,
    desbloqueado: input.desbloqueado === undefined ? true : !!input.desbloqueado,
  };
}

// Um golpe só entra no combate quando foi desbloqueado e o personagem já
// alcançou o nível em que ele é adquirido. A árvore continua salva na ficha.
export function golpesDisponiveis(skills = [], level = 1) {
  const nivel = Math.round(numero(level, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX));
  return (Array.isArray(skills) ? skills : []).filter((skill) => {
    if (!skill || skill.desbloqueado === false) return false;
    const requerido = Math.round(
      numero(skill.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX),
    );
    return requerido <= nivel;
  });
}

function normalizarStatus(status) {
  if (typeof status === 'string') {
    return STATUS_KEYS.includes(status) ? { tipo: status, turnos: 2, dano: 0 } : null;
  }
  if (!status || typeof status !== 'object' || !STATUS_KEYS.includes(status.tipo)) return null;
  return {
    tipo: status.tipo,
    turnos: numero(status.turnos ?? status.duracao, 2, 1, 8),
    dano: numero(status.dano ?? status.valor, 0, 0, 999),
  };
}

export function validateCustomSkill(input = {}) {
  const nome = String(input.nome ?? '').trim();
  if (!nome) throw new Error('Informe o nome do golpe.');
  const tipo = SKILL_TYPES.includes(input.tipo) ? input.tipo : 'magia';
  const tipoCategoria = SKILL_KINDS.includes(input.tipo_categoria)
    ? input.tipo_categoria
    : (tipo === 'fisico' || tipo === 'magia' ? 'dano' : tipo);
  const alvo = ALVOS_OFICIAIS.includes(input.alvo)
    ? input.alvo
    : (ALVOS_LEGADOS[input.alvo] || 'unico');
  const suporte = tipo === 'buff' || tipo === 'defesa';

  return {
    ...normalizarMetadadosGolpe(input),
    nome: nome.slice(0, 40),
    tipo,
    // `poder` ausente/inválido deve valer 100%, como no resto do sistema.
    poder: numero(input.poder, 100, 10, 1000),
    custo: numero(input.custo, 0, 0, 99),
    cooldown: numero(input.cooldown, 0, 0, 20),
    todos: !!input.todos,
    descricao: String(input.descricao ?? '').trim().slice(0, 200),
    alvo: tipoCategoria === 'dano' || tipoCategoria === 'cura' ? alvo : 'unico',
    alvos: numero(input.alvos, 3, 2, 10),
    splash: numero(input.splash, 0.5, 0, 1),
    afeta_aliados: suporte && !!input.afetaAliados,
    buff_tipo: tipo === 'buff' && (input.buffTipo === 'fisico' || input.buffTipo === 'magico')
      ? input.buffTipo
      : null,
    duracao: suporte ? numero(input.duracao, 3, 1, 8) : null,
    status: normalizarStatus(input.status),
    is_public: !!input.is_public,
  };
}

// Golpes personalizados com o mesmo nome/id de um golpe de classe compartilham
// recarga e são resolvidos duas vezes. Mantém o primeiro e renomeia os demais.
export function dedupeSkillIds(skills = []) {
  const vistos = new Set();
  const out = [];
  for (const skill of skills) {
    const original = String(skill?.id || 'golpe');
    const base = original.slice(0, 36);
    let id = original;
    let n = 2;
    while (vistos.has(id)) id = `${base}_${n++}`;
    vistos.add(id);
    out.push(id === original ? skill : { ...skill, id });
  }
  return out;
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

// Converte a linha do banco para o formato usado por `normalizeSkill`/`montarGolpe`.
export function decorateCustomSkill(row) {
  if (!row) return row;
  const status = normalizarStatus(parseJson(row.status, null));
  return {
    ...row,
    status,
    splash: Number.isFinite(Number(row.splash)) ? Number(row.splash) : 0.5,
    alvos: Number.isFinite(Number(row.alvos)) ? Number(row.alvos) : 3,
    afetaAliados: !!(row.afetaAliados ?? row.afeta_aliados),
    buffTipo: row.buffTipo ?? row.buff_tipo ?? null,
    duracao: row.duracao == null ? null : Number(row.duracao),
    ...normalizarMetadadosGolpe(row),
  };
}
