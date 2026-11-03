// ══════════════════════════════════════════════════════════════════════════════════════
// MINERAÇÃO DE MATERIAIS — Veios de mineração e drops de monstros
// ══════════════════════════════════════════════════════════════════════════════════════

// ── VEIOS DE MINERAÇÃO DE MATERIAIS ───────────────────────────────────────────
export const VEIOS_MATERIAIS = {
  // ── Minérios Comuns ─────────────────────────────────────────────────────────
  veio_ferro: {
    id: 'veio_ferro', nome: 'Veio de Ferro', tipo: 'minerio',
    material: 'ferro', bioma: 'montanhas',
    custoCents: 10, cooldownMin: 5, quantidade: 1.5,
    icone: '⛏️', descricao: 'Veio de ferro comum nas montanhas.',
  },
  veio_cobre: {
    id: 'veio_cobre', nome: 'Veio de Cobre', tipo: 'minerio',
    material: 'cobre', bioma: 'caverna',
    custoCents: 15, cooldownMin: 5, quantidade: 1.2,
    icone: '⛏️', descricao: 'Veio de cobre em cavernas.',
  },
  veio_estanho: {
    id: 'veio_estanho', nome: 'Veio de Estanho', tipo: 'minerio',
    material: 'estanho', bioma: 'caverna',
    custoCents: 12, cooldownMin: 5, quantidade: 1.2,
    icone: '⛏️', descricao: 'Veio de estanho mole em cavernas.',
  },
  veio_chumbo: {
    id: 'veio_chumbo', nome: 'Veio de Chumbo', tipo: 'minerio',
    material: 'chumbo', bioma: 'subterraneo',
    custoCents: 20, cooldownMin: 10, quantidade: 1.0,
    icone: '⛏️', descricao: 'Veio de chumbo pesado em áreas subterrâneas.',
  },

  // ── Metais ──────────────────────────────────────────────────────────────────
  veio_bronze: {
    id: 'veio_bronze', nome: 'Veio de Bronze', tipo: 'metal',
    material: 'bronze', bioma: 'montanhas',
    custoCents: 30, cooldownMin: 15, quantidade: 1.0,
    icone: '⛏️', descricao: 'Depósito de liga de bronze nas montanhas.',
  },
  veio_ferro_forjado: {
    id: 'veio_ferro_forjado', nome: 'Veio de Ferro Forjado', tipo: 'metal',
    material: 'ferroForjado', bioma: 'montanhas',
    custoCents: 50, cooldownMin: 15, quantidade: 0.8,
    icone: '⛏️', descricao: 'Veio de ferro forjado de alta qualidade.',
  },
  veio_aco: {
    id: 'veio_aco', nome: 'Veio de Aço', tipo: 'metal',
    material: 'aco', bioma: 'montanhas',
    custoCents: 80, cooldownMin: 20, quantidade: 0.7,
    icone: '⛏️', descricao: 'Veio de aço puro, raro e valioso.',
  },
  veio_prata: {
    id: 'veio_prata', nome: 'Veio de Prata', tipo: 'metal',
    material: 'prata', bioma: 'subterraneo',
    custoCents: 200, cooldownMin: 30, quantidade: 0.5,
    icone: '⛏️', descricao: 'Veio de prata preciosa em áreas subterrâneas.',
  },
  veio_ouro: {
    id: 'veio_ouro', nome: 'Veio de Ouro', tipo: 'metal',
    material: 'ouro', bioma: 'subterraneo',
    custoCents: 400, cooldownMin: 45, quantidade: 0.3,
    icone: '⛏️', descricao: 'Veio de ouro raro e valioso.',
  },
  veio_latao: {
    id: 'veio_latao', nome: 'Veio de Latão', tipo: 'metal',
    material: 'latão', bioma: 'montanhas',
    custoCents: 60, cooldownMin: 20, quantidade: 0.8,
    icone: '⛏️', descricao: 'Depósito de liga de latão nas montanhas.',
  },

  // ── Pedras Preciosas ────────────────────────────────────────────────────────
  veio_obsidiana: {
    id: 'veio_obsidiana', nome: 'Veio de Obsidiana', tipo: 'pedra',
    material: 'obsidiana', bioma: 'vulcao',
    custoCents: 400, cooldownMin: 60, quantidade: 0.4,
    icone: '⛏️', descricao: 'Veio de vidro vulcânico em vulcões.',
  },
  veio_diamante: {
    id: 'veio_diamante', nome: 'Veio de Diamante', tipo: 'pedra',
    material: 'diamante', bioma: 'subterraneo',
    custoCents: 1000, cooldownMin: 120, quantidade: 0.2,
    icone: '⛏️', descricao: 'Veio de diamante lendário, extremamente raro.',
  },
};

export const VEIOS_MATERIAIS_LIST = Object.values(VEIOS_MATERIAIS);
export const VEIOS_MATERIAIS_IDS = Object.keys(VEIOS_MATERIAIS);

export function getVeioMaterialById(id) {
  return VEIOS_MATERIAIS[id] || null;
}

export function getVeiosMateriaisPorTipo(tipo) {
  return VEIOS_MATERIAIS_LIST.filter(v => v.tipo === tipo);
}

export function getVeiosMateriaisPorBioma(bioma) {
  return VEIOS_MATERIAIS_LIST.filter(v => v.bioma === bioma);
}

// ── DROPS DE MATERIAIS POR MONSTRO/CHEFÃO ─────────────────────────────────────
// Cada chefe tem chance de dropar materiais específicos ao ser derrotado
export const DROPS_MATERIAIS_CHEFES = {
  minhoca_broca: [
    { material: 'ferro', quantidade: 2, chance: 0.8 },
    { material: 'chumbo', quantidade: 1, chance: 0.3 },
  ],
  jabuti_montanha: [
    { material: 'bronze', quantidade: 1, chance: 0.6 },
    { material: 'obsidiana', quantidade: 1, chance: 0.2 },
  ],
  dragao_obsidiana: [
    { material: 'obsidiana', quantidade: 2, chance: 0.7 },
    { material: 'diamante', quantidade: 1, chance: 0.1 },
    { material: 'prata', quantidade: 1, chance: 0.3 },
  ],
};

// Sistema de drop aleatório baseado no tipo do monstro
export const DROPS_MATERIAIS_POR_TIPO = {
  comum: [
    { material: 'ferro', quantidade: 1, chance: 0.4 },
    { material: 'cobre', quantidade: 1, chance: 0.2 },
  ],
  incomum: [
    { material: 'bronze', quantidade: 1, chance: 0.3 },
    { material: 'estanho', quantidade: 1, chance: 0.2 },
  ],
  rara: [
    { material: 'prata', quantidade: 1, chance: 0.2 },
    { material: 'ferroForjado', quantidade: 1, chance: 0.3 },
  ],
  epica: [
    { material: 'obsidiana', quantidade: 1, chance: 0.15 },
    { material: 'aco', quantidade: 1, chance: 0.2 },
  ],
  lendaria: [
    { material: 'diamante', quantidade: 1, chance: 0.05 },
    { material: 'ouro', quantidade: 1, chance: 0.1 },
  ],
};

/**
 * Calcula drops de materiais para um monstro derrotado com base na raridade/tipo.
 * Retorna array de { material, quantidade } para os drops que ocorreram.
 */
export function calcularDropsMonstro(tipoMonstro, nivel = 1) {
  const drops = DROPS_MATERIAIS_POR_TIPO[tipoMonstro] || DROPS_MATERIAIS_POR_TIPO.comum;
  const resultado = [];
  for (const drop of drops) {
    if (Math.random() < drop.chance) {
      // Quantidade varia com o nível do monstro
      const qtd = Math.max(1, Math.round(drop.quantidade * (1 + (nivel - 1) * 0.1)));
      resultado.push({ material: drop.material, quantidade: qtd });
    }
  }
  return resultado;
}

/**
 * Calcula drops específicos para um chefe derrotado.
 */
export function calcularDropsChefe(chefeId) {
  const drops = DROPS_MATERIAIS_CHEFES[chefeId];
  if (!drops) return [];
  const resultado = [];
  for (const drop of drops) {
    if (Math.random() < drop.chance) {
      resultado.push({ material: drop.material, quantidade: drop.quantidade });
    }
  }
  return resultado;
}
