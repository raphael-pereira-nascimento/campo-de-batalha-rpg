// Validação dos golpes do Registro do Mundo no modo offline.
// Espelha `server/src/services/skillValidation.js`: o localStorage precisa
// aplicar os mesmos clamps/normalizações do servidor, senão um golpe salvo
// offline muda de comportamento quando o servidor volta.

import { STATUS_KEYS, ELEMENTOS } from './data.js';
import { ALVO_TIPOS } from './sistema.js';

const SKILL_TYPES = ['fisico', 'magia', 'cura', 'buff', 'defesa'];
export const NIVEL_GOLPE_MIN = 1;
export const NIVEL_GOLPE_MAX = 30;
const ALVOS = Object.keys(ALVO_TIPOS);
const ALVOS_LEGADOS = { proximo: 'unico', aleatorio: 'unico', multi: 'cone', todos: 'area' };
const SKILL_KINDS = ['dano', 'cura', 'buff', 'defesa'];

function numero(valor, padrao, min, max) {
  const n = Number(valor);
  const v = Number.isFinite(n) ? n : padrao;
  return Math.max(min, Math.min(max, Math.round(v)));
}

// Espelho de `server/src/services/skillValidation.js`. Golpes sem estes
// campos continuam nível 1, físicos e desbloqueados.
export function normalizarMetadadosGolpe(input = {}) {
  const elemento = ELEMENTOS.includes(input.elemento) ? input.elemento : 'fisico';
  const nivel = numero(input.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX);
  return {
    elemento,
    nivel,
    desbloqueado: input.desbloqueado === undefined ? true : !!input.desbloqueado,
  };
}

export function golpesDisponiveis(skills = [], level = 1) {
  const nivel = numero(level, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX);
  return (Array.isArray(skills) ? skills : []).filter((skill) => {
    if (!skill || skill.desbloqueado === false) return false;
    return numero(skill.nivel, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MIN, NIVEL_GOLPE_MAX) <= nivel;
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

export function validateOfflineSkill(input = {}) {
  const nome = String(input.nome ?? '').trim();
  if (!nome) throw new Error('Informe o nome do golpe.');
  const tipo = SKILL_TYPES.includes(input.tipo) ? input.tipo : 'magia';
  const tipoCategoria = SKILL_KINDS.includes(input.tipo_categoria)
    ? input.tipo_categoria
    : (tipo === 'fisico' || tipo === 'magia' ? 'dano' : tipo);
  const alvo = ALVOS.includes(input.alvo) ? input.alvo : (ALVOS_LEGADOS[input.alvo] || 'unico');
  const suporte = tipo === 'buff' || tipo === 'defesa';
  const status = normalizarStatus(input.status);
  return {
    ...input,
    ...normalizarMetadadosGolpe(input),
    nome: nome.slice(0, 40),
    tipo,
    poder: numero(input.poder, 100, 10, 1000),
    custo: numero(input.custo, 0, 0, 99),
    cooldown: numero(input.cooldown, 0, 0, 20),
    todos: !!input.todos,
    descricao: String(input.descricao ?? '').trim().slice(0, 200),
    alvo: tipoCategoria === 'dano' || tipoCategoria === 'cura' ? alvo : 'unico',
    alvos: numero(input.alvos, 3, 2, 10),
    splash: numero((Number(input.splash) || 0) * 100, 50, 0, 100) / 100,
    afetaAliados: suporte && !!input.afetaAliados,
    buffTipo: tipo === 'buff' && (input.buffTipo === 'fisico' || input.buffTipo === 'magico')
      ? input.buffTipo : null,
    duracao: suporte ? numero(input.duracao, 3, 1, 8) : null,
    status,
  };
}
