// ═══════════════════════════════════════════════════════════════════════════════════════
// EFEITOS DE COMBATE — avaliação pura de modificadores
// Módulo sem efeitos colaterais, compartilhado pelo combate offline e online.
//
// Regras aprovadas implementadas aqui:
// - cada percentual tem tipo explícito (bônus/redução/resistência/chance/custo);
// - efeitos condicionais só valem quando a condição é atendida;
// - condições em texto livre permanecem descritivas (não são inventadas);
// - resistência é limitada a 75% (imunidades oficiais continuam descritivas);
// - penalidades sempre se aplicam;
// - dano = round(base × (1 + bônus% / 100)), depois resistência;
// - status temporários calculam dano pela vida máxima ORIGINAL.
// ═══════════════════════════════════════════════════════════════════════════════════════

export const LIMITE_RESISTENCIA_PCT = 75;

// ── Texto e números ────────────────────────────────────────────────────────────────
export function normalizarTextoEfeito(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizarChance(chance, padrao = 1) {
  if (chance == null || chance === '') return padrao;
  const numero = Number(chance);
  if (!Number.isFinite(numero)) return padrao;
  const fracao = numero > 1 ? numero / 100 : numero;
  return Math.min(1, Math.max(0, fracao));
}

function numeroValido(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function comparar(valor, operador = '>=', alvo) {
  const a = Number(valor);
  const b = Number(alvo);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  switch (operador) {
    case '>': return a > b;
    case '<': return a < b;
    case '<=': return a <= b;
    case '===':
    case '=':
    case '==': return a === b;
    case '!==':
    case '!=': return a !== b;
    case '>=':
    default: return a >= b;
  }
}

// ── Condições ──────────────────────────────────────────────────────────────────────
// Condições estruturadas: { tipo, valor, operador, alvo, elemento, status, atributo }.
// Texto livre devolve `atende: null` (descritiva) para nunca ser aplicado por engano.
export function avaliarCondicao(condicao, contexto = {}) {
  if (condicao == null || condicao === '') return { atende: true, descritiva: false };
  if (typeof condicao === 'string') {
    return { atende: null, descritiva: true, motivo: `Condição descritiva: ${condicao}` };
  }
  if (typeof condicao !== 'object' || Array.isArray(condicao)) {
    return { atende: null, descritiva: true, motivo: 'Condição em formato desconhecido.' };
  }

  const tipo = condicao.tipo || 'sempre';
  const operador = condicao.operador || '>=';
  const valor = numeroValido(condicao.valor);

  switch (tipo) {
    case 'sempre':
      return { atende: true, descritiva: false };
    case 'danoRecebido':
      return { atende: comparar(contexto.danoRecebido || 0, operador, valor ?? 0), descritiva: false };
    case 'hpPct':
      return { atende: comparar(contexto.hpPct || 0, operador, valor ?? 0), descritiva: false };
    case 'turnos':
      return { atende: comparar(contexto.turnos || 0, operador, valor ?? 0), descritiva: false };
    case 'status': {
      const procurado = condicao.status || condicao.alvo;
      const lista = Array.isArray(contexto.statuses) ? contexto.statuses : [];
      return { atende: lista.includes(procurado), descritiva: false };
    }
    case 'elemento':
      return { atende: contexto.elemento === condicao.elemento, descritiva: false };
    case 'classe': {
      const classes = Array.isArray(contexto.classes) ? contexto.classes : [];
      return { atende: classes.includes(condicao.classe || condicao.alvo), descritiva: false };
    }
    case 'alvo':
      return { atende: contexto.tipoAlvo === (condicao.alvo || condicao.valor), descritiva: false };
    case 'atributo': {
      const chave = normalizarTextoEfeito(condicao.atributo || condicao.alvo);
      return {
        atende: comparar(contexto.atributos?.[chave] || 0, operador, valor ?? 0),
        descritiva: false,
      };
    }
    case 'sistema':
      return { atende: (contexto.sistemas || []).includes(condicao.sistema), descritiva: false };
    default:
      return {
        atende: null,
        descritiva: true,
        motivo: `Tipo de condição não automatizado: ${tipo}.`,
      };
  }
}

export function condicaoAtendida(condicao, contexto = {}) {
  return avaliarCondicao(condicao, contexto).atende === true;
}

// ── Percentuais ────────────────────────────────────────────────────────────────────
function alvoCombina(modificador, filtro) {
  if (!filtro) return true;
  return filtro.test(normalizarTextoEfeito(modificador?.alvo));
}

// Soma percentuais por tipo, respeitando condições. Modificadores com condição
// descritiva entram em `ignorados` e não alteram o resultado.
export function somarPercentuais(modificadores = [], contexto = {}, opcoes = {}) {
  const filtro = opcoes.filtroAlvo ? new RegExp(opcoes.filtroAlvo, 'i') : null;
  const out = {
    bonus: 0,
    reducao: 0,
    resistencia: 0,
    chance: 0,
    custo: 0,
    penalidade: 0,
    aplicados: [],
    ignorados: [],
  };

  for (const modificador of modificadores || []) {
    if (!modificador) continue;
    if (filtro && !alvoCombina(modificador, filtro)) continue;
    const avaliacao = avaliarCondicao(modificador.condicao, contexto);
    if (avaliacao.atende === false) continue;
    if (avaliacao.atende === null) {
      out.ignorados.push({ ...modificador, motivo: avaliacao.motivo });
      continue;
    }
    const valor = numeroValido(modificador.valor);
    if (valor == null) continue;

    if (modificador.tipo === 'bonus') out.bonus += valor;
    else if (modificador.tipo === 'reducao') out.reducao += Math.abs(valor);
    else if (modificador.tipo === 'resistencia') out.resistencia += valor;
    else if (modificador.tipo === 'chance') out.chance += valor;
    else if (modificador.tipo === 'custo') out.custo += valor;
    else if (modificador.tipo === 'penalidade') out.penalidade += Math.abs(valor);
    else continue;

    out.aplicados.push(modificador);
  }

  out.resistencia = Math.max(0, Math.min(LIMITE_RESISTENCIA_PCT, out.resistencia));
  out.reducao = Math.max(0, Math.min(100, out.reducao));
  return out;
}

// Resistência só vale para dano (não para cura, peso, velocidade etc.).
export function resistenciaDeDano(modificadores = [], contexto = {}) {
  const soma = somarPercentuais(modificadores, contexto, {
    filtroAlvo: '(dano|elemento)',
  });
  return soma.resistencia;
}

// Bônus de dano causado. Exclui "dano recebido/sofrido", que é defesa do alvo.
export function bonusDeDano(modificadores = [], contexto = {}) {
  const aplicaveis = (modificadores || []).filter((modificador) => {
    const alvo = normalizarTextoEfeito(modificador?.alvo);
    return modificador?.tipo === 'bonus'
      && /^dano/.test(alvo)
      && !/recebido|sofrido/.test(alvo);
  });
  return somarPercentuais(aplicaveis, contexto).bonus;
}

// Fórmula aprovada: bônus do atacante, arredondamento, depois resistência do alvo.
export function calcularDanoComPerfil({
  danoBase,
  modificadoresAtaque = [],
  modificadoresDefesa = [],
  contextoAtaque = {},
  contextoDefesa = {},
} = {}) {
  const base = Number(danoBase);
  if (!Number.isFinite(base) || base < 0) {
    return { dano: 0, bonusPct: 0, resistenciaPct: 0 };
  }
  const bonusPct = bonusDeDano(modificadoresAtaque, contextoAtaque);
  const resistenciaPct = resistenciaDeDano(modificadoresDefesa, contextoDefesa);
  let dano = Math.round(base * (1 + bonusPct / 100));
  dano = Math.round(dano * (1 - resistenciaPct / 100));
  return { dano: Math.max(0, dano), bonusPct, resistenciaPct };
}

// ── Penalidades (sempre aplicadas) ─────────────────────────────────────────────────
const ALIAS_ATRIBUTO = {
  forca: 'forca',
  inteligencia: 'inteligencia',
  resistencia: 'resistencia',
  destreza: 'destreza',
  reflexos: 'reflexos',
  reflexo: 'reflexos',
};

function chaveAtributo(alvo) {
  return ALIAS_ATRIBUTO[normalizarTextoEfeito(alvo)] || null;
}

export function aplicarPenalidadesPercentuais(atributos = {}, modificadores = [], contexto = {}) {
  const out = { ...(atributos || {}) };
  const aplicadas = [];

  for (const modificador of modificadores || []) {
    if (modificador?.tipo !== 'penalidade') continue;
    if (modificador.unidade && !['percentual', 'pontos'].includes(modificador.unidade)) continue;
    const avaliacao = avaliarCondicao(modificador.condicao, contexto);
    if (avaliacao.atende !== true) continue;
    const chave = chaveAtributo(modificador.alvo);
    if (!chave || out[chave] == null) continue;
    const valor = Math.abs(numeroValido(modificador.valor) ?? 0);
    out[chave] = modificador.unidade === 'pontos'
      ? out[chave] - valor
      : out[chave] * (1 - Math.min(100, valor) / 100);
    aplicadas.push({ atributo: chave, valor, unidade: modificador.unidade || 'percentual' });
  }

  return { atributos: out, aplicadas };
}

// Penalidades de Corrupção são percentuais oficiais por estágio.
export function aplicarCorrupcaoEmAtributos(atributos = {}, penalidades = {}) {
  const out = { ...(atributos || {}) };
  const aplicadas = [];
  for (const [atributo, valor] of Object.entries(penalidades || {})) {
    const chave = chaveAtributo(atributo);
    const numero = Math.abs(numeroValido(valor) ?? 0);
    if (!chave || out[chave] == null || numero === 0) continue;
    out[chave] = out[chave] * (1 - Math.min(100, numero) / 100);
    aplicadas.push({ atributo: chave, valor: numero });
  }
  return { atributos: out, aplicadas };
}

// ── Status temporários ────────────────────────────────────────────────────────────
// Dano do primeiro turno calculado sobre a vida máxima ORIGINAL. Status que já
// trazem `dano` explícito mantêm o valor do golpe/item.
export function danoDeStatus(status, alvo = {}) {
  if (!status) return 0;
  const danoExplicito = numeroValido(status.dano);
  if (danoExplicito != null && danoExplicito > 0) return Math.round(danoExplicito);

  const percentual = numeroValido(
    status.danoPctVidaMaxima
    ?? status.percentualDanoVidaMaxima
    ?? 0,
  );
  if (percentual == null || percentual <= 0) return 0;

  const vidaOriginal = numeroValido(alvo.hpMaxOriginal ?? alvo.hpMax) ?? 0;
  return Math.max(0, Math.round((vidaOriginal * percentual) / 100));
}

// Redução de cura/proteção acumulada dos status ativos (ex.: Contaminação 25%).
export function reducaoDeCuraPct(statuses = []) {
  let total = 0;
  for (const status of statuses || []) {
    const valor = numeroValido(
      status?.reducaoCuraPct
      ?? status?.reducaoPotenciaCuraProtecao
      ?? 0,
    );
    if (valor != null && valor > 0) total += valor;
  }
  return Math.min(100, total);
}

// Chave usada para "efeito idêntico não acumula" no combate.
export function chaveStatusEfeito(status = {}) {
  return [
    status.id || status.tipo || '',
    normalizarTextoEfeito(status.origem),
  ].join('|');
}
