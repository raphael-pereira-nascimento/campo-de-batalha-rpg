// ═════════════════════════════════════════════════════════════════════════════════════
// VIBRANIUM — absorção cinética, Pontos de Energia (PE) e sobrecarga
// Módulo puro: sem DOM, sem Node e sem importar o catálogo de materiais.
// Valores aprovados pelo criador (itens 1, 2 e 3 da ficha):
//   1. Capacidade: 40 PE/kg × multiplicador de qualidade (Perfeito ×1,5 = 60 PE/kg).
//   2. Sobrecarga: excedente não é armazenado, 25% de chance de descarga (15% em
//      Perfeito), 1 Trinca por descarga, 5 Trincas destroem a peça.
//   3. Absorção: 25% do dano cinético EFETIVO vira PE e abate o dano sofrido.
//      Com a capacidade cheia não há absorção: o dano entra integralmente.
// A tabela de massas por categoria também foi aprovada e fica aqui para que a
// capacidade em PE seja calculável sem inventar peso por peça.
// ═════════════════════════════════════════════════════════════════════════════════════

/** Percentual do dano cinético efetivo convertido em PE. */
export const ABSORCAO_PCT = 25;

/** Base de capacidade: PE por kg de Vibranium. */
export const PE_POR_KG = 40;

/** Único multiplicador de qualidade documentado. Qualidades sem valor usam 1. */
export const MULT_QUALIDADE_PE = {
  perfeito: 1.5,
};

export const MULT_QUALIDADE_PADRAO = 1;

/** Limite de PE gasto por turno (liberação/consumo). */
export const LIMITE_GASTO_TURNO = 20;

/** Ventilação passiva de um acessório de Vibranium, em PE por turno. */
export const VENTILACAO_ACESSORIO_PE = 5;

/** Chance de descarga descontrolada ao exceder a capacidade. */
export const CHANCE_DESCARGA_PCT = 25;
export const CHANCE_DESCARGA_PERFEITO_PCT = 15;

/** Trincas: penalidade a partir de 3; destruição em 5. */
export const TRINCAS_PENALIDADE = 3;
export const TRINCAS_DESTRUICAO = 5;
export const TRINCAS_PENALIDADE_PCT = 10;

/** Alcance da descarga descontrolada, em metros. */
export const RAIO_DESCARGA_M = 3;

/** Capacidade fixa do núcleo de um golem (evita 60 PE/kg em corpos enormes). */
export const CAPACIDADE_GOLEM_PE = 600;

/** Fração dos efeitos concedida pelo material secundário (regra do catálogo). */
export const FRACAO_SECUNDARIO = 0.25;

/**
 * Massa de referência por categoria de equipamento, aprovada junto da ficha.
 * `null` significa "usa capacidade fixa" (golem).
 */
export const MASSAS_REFERENCIA = {
  armadura: 12,
  armaLamina: 2,
  armaImpacto: 4,
  armaFogo: 5,
  acessorio: 0.5,
  equipamentoMagico: 1.5,
  golem: null,
};

/** Categorias de efeito que usam a massa de uma categoria mágica. */
export const CATEGORIAS_MAGICAS_PE = ['cajado', 'varinha', 'grimorio', 'orbe', 'catalisador'];

function inteiroNaoNegativo(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return 0;
  return Math.trunc(numero);
}

export function multiplicadorQualidade(qualidade) {
  return MULT_QUALIDADE_PE[qualidade] ?? MULT_QUALIDADE_PADRAO;
}

export function massaReferencia(categoria) {
  if (categoria == null) return null;
  if (Object.prototype.hasOwnProperty.call(MASSAS_REFERENCIA, categoria)) {
    return MASSAS_REFERENCIA[categoria];
  }
  if (CATEGORIAS_MAGICAS_PE.includes(categoria)) return MASSAS_REFERENCIA.equipamentoMagico;
  return null;
}

/**
 * Capacidade máxima de PE de uma peça.
 * @param {object} opcoes
 * @param {string} opcoes.categoria categoria de efeito (armadura, armaLamina, ...).
 * @param {string} [opcoes.qualidade] qualidade do material (só Perfeito tem multiplicador).
 * @param {number} [opcoes.fracaoMaterial] 1 para principal, 0.25 para secundário.
 */
export function capacidadePE({ categoria, qualidade = 'perfeito', fracaoMaterial = 1 } = {}) {
  const fracao = Number(fracaoMaterial);
  if (!Number.isFinite(fracao) || fracao <= 0) return 0;

  if (categoria === 'golem') {
    return inteiroNaoNegativo(CAPACIDADE_GOLEM_PE * fracao);
  }

  const massa = massaReferencia(categoria);
  if (massa == null) return 0;

  const bruto = PE_POR_KG * multiplicadorQualidade(qualidade) * massa * fracao;
  return inteiroNaoNegativo(bruto);
}

/** Estado de PE de um participante/peça durante o combate. */
export function estadoInicialPE(config = {}) {
  return {
    pe: 0,
    peMax: inteiroNaoNegativo(config.peMax),
    trincas: inteiroNaoNegativo(config.trincas),
  };
}

export function chanceDescargaPct(qualidade) {
  return qualidade === 'perfeito'
    ? CHANCE_DESCARGA_PERFEITO_PCT
    : CHANCE_DESCARGA_PCT;
}

/**
 * Absorve dano cinético efetivo.
 * Fórmula aprovada: `PE = floor(25% × dano efetivo)`, limitado ao espaço restante;
 * `dano sofrido = dano efetivo − PE ganhos`. O excedente não é armazenado e entra
 * na checagem de sobrecarga.
 *
 * @returns {{
 *   danoFinal: number, peGanhos: number, peAtual: number, excedente: number,
 *   sobrecarga: null | { excedente: number, chancePct: number, disparou: boolean }
 * }}
 */
export function absorverDanoCinetico({
  danoEfetivo,
  peAtual = 0,
  peMax = 0,
  qualidade = 'perfeito',
  rolador = Math.random,
} = {}) {
  const dano = Math.max(0, Math.round(Number(danoEfetivo) || 0));
  const capacidade = inteiroNaoNegativo(peMax);
  const atual = Math.min(Math.max(0, inteiroNaoNegativo(peAtual)), capacidade);
  if (dano === 0 || capacidade === 0) {
    return {
      danoFinal: dano,
      peGanhos: 0,
      peAtual: atual,
      excedente: 0,
      sobrecarga: null,
    };
  }

  const bruto = Math.trunc((dano * ABSORCAO_PCT) / 100);
  const espaco = capacidade - atual;
  const peGanhos = Math.min(bruto, espaco);
  const excedente = Math.max(0, bruto - peGanhos);
  const danoFinal = Math.max(0, dano - peGanhos);

  let sobrecarga = null;
  if (excedente > 0) {
    const chancePct = chanceDescargaPct(qualidade);
    const sorteio = typeof rolador === 'function' ? Number(rolador()) : 1;
    const disparou = Number.isFinite(sorteio) && sorteio * 100 < chancePct;
    sobrecarga = { excedente, chancePct, disparou };
  }

  return {
    danoFinal,
    peGanhos,
    peAtual: atual + peGanhos,
    excedente,
    sobrecarga,
  };
}

/** Dano da descarga descontrolada: todo o PE acumulado vira dano de força. */
export function danoDeDescarga(peAtual) {
  return Math.max(0, Math.trunc(Number(peAtual) || 0));
}

/** Dano de uma liberação controlada (onda de choque, descarga do golem). */
export function danoDeLiberacao(peGasto, percentual = 50) {
  const pe = Math.max(0, Math.trunc(Number(peGasto) || 0));
  const pct = Math.min(100, Math.max(0, Number(percentual) || 0));
  return Math.trunc((pe * pct) / 100);
}

/** Gasta PE respeitando o teto por turno e o estoque disponível. */
export function gastarPE({ peAtual, custo, gastoNoTurno = 0, limiteTurno = LIMITE_GASTO_TURNO } = {}) {
  const atual = Math.max(0, inteiroNaoNegativo(peAtual));
  const pedido = Math.max(0, inteiroNaoNegativo(custo));
  const jaGasto = Math.max(0, inteiroNaoNegativo(gastoNoTurno));
  const limite = Math.max(0, inteiroNaoNegativo(limiteTurno));
  const disponivelTurno = Math.max(0, limite - jaGasto);
  const gasto = Math.min(pedido, atual, disponivelTurno);
  return {
    gasto,
    peAtual: atual - gasto,
    gastoNoTurno: jaGasto + gasto,
    bloqueado: gasto < pedido,
  };
}

/** Registra uma Trinca por descarga e informa a penalidade vigente. */
export function registrarTrinca(trincas = 0) {
  const total = Math.max(0, inteiroNaoNegativo(trincas) + 1);
  return {
    trincas: total,
    destruido: total >= TRINCAS_DESTRUICAO,
    penalidadeResistenciaPct: total >= TRINCAS_PENALIDADE ? TRINCAS_PENALIDADE_PCT : 0,
  };
}

/**
 * Lê a configuração de Vibranium de um participante (apenas armadura equipada).
 * Monstros nunca recebem a absorção de equipamento.
 */
export function configVibraniumDoParticipante(participante) {
  if (!participante || participante.isMonster || !participante.alive) return null;
  const armadura = participante.equipment?.armadura;
  const config = armadura?.vibranium;
  if (!config || !(Number(config.peMax) > 0)) return null;
  return config;
}
