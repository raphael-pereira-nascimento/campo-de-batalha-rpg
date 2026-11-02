// ═════════════════════════════════════════════════════════════════════════════════════
// SISTEMA DE FORJA — Cálculos puros, sem importações externas
// ═════════════════════════════════════════════════════════════════════════════════════

// ============================================================================
// CÁLCULO DE PREÇO DE EQUIPAMENTO (versão standalone para evitar importação circular)
// ============================================================================
const PRECOS_EQUIPAMENTOS = {
  espada_curta: { precoBase: 120, raridade: 'comum' },
  espada_longa: { precoBase: 650, raridade: 'incomum' },
  machado_de_guerra: { precoBase: 1400, raridade: 'incomum' },
  adaga_dupla: { precoBase: 500, raridade: 'incomum' },
  martelo_sagrado: { precoBase: 1100, raridade: 'rara' },
  adaga_ritual: { precoBase: 700, raridade: 'rara' },
  espada_baioneta: { precoBase: 1600, raridade: 'rara' },
  arco_simples: { precoBase: 140, raridade: 'comum' },
  arco_longo: { precoBase: 750, raridade: 'incomum' },
  pistola: { precoBase: 300, raridade: 'comum' },
  mosquete: { precoBase: 1000, raridade: 'incomum' },
  rifle_de_caca: { precoBase: 2500, raridade: 'rara' },
  cajado_arcano: { precoBase: 800, raridade: 'incomum' },
  cajado_de_fogo: { precoBase: 1200, raridade: 'rara' },
  cajado_de_madeira_refinada: { precoBase: 450, raridade: 'comum' },
  orbe_magico: { precoBase: 950, raridade: 'incomum' },
  grimorio_de_iniciado: { precoBase: 600, raridade: 'comum' },
  orbe_de_cristal: { precoBase: 1500, raridade: 'rara' },
  catalisador_de_mana: { precoBase: 700, raridade: 'incomum' },
  roupa_de_aventureiro: { precoBase: 80, raridade: 'comum' },
  couro: { precoBase: 300, raridade: 'comum' },
  cota_de_malha: { precoBase: 800, raridade: 'incomum' },
  armadura_de_placas: { precoBase: 2400, raridade: 'rara' },
  manto_arcano: { precoBase: 650, raridade: 'incomum' },
  vestes_sagradas: { precoBase: 650, raridade: 'incomum' },
  armadura_leve: { precoBase: 550, raridade: 'incomum' },
  anel_de_forca: { precoBase: 350, raridade: 'comum' },
  anel_do_vento: { precoBase: 750, raridade: 'incomum' },
  amuleto_de_vitalidade: { precoBase: 900, raridade: 'rara' },
  luvas_de_precisao: { precoBase: 850, raridade: 'incomum' },
  bracelete_arcano: { precoBase: 700, raridade: 'incomum' },
  talisma_arcano: { precoBase: 1200, raridade: 'rara' },
};

function multRaridade(raridade) {
  switch (raridade) {
    case 'lendaria': return 10;
    case 'epica': return 5;
    case 'rara': return 2.5;
    case 'incomum': return 1.5;
    default: return 1;
  }
}

export function calcularPrecoEquipamento(equipId) {
  const equip = PRECOS_EQUIPAMENTOS[equipId];
  if (!equip) return 0;
  return Math.round(equip.precoBase * multRaridade(equip.raridade));
}

// ============================================================================
// COMPATIBILIDADE E INSTALAÇÃO DE GEMAS
// ============================================================================

export function verificarCompatibilidadeGema(equip, gemaId, slotIndex) {
  if (!equip || !gemaId) return { ok: false, motivo: 'Dados inválidos.' };
  if (slotIndex < 0 || slotIndex >= (equip.slots || 0)) {
    return { ok: false, motivo: 'Slot inexistente.' };
  }
  return { ok: true, motivo: 'Compatível.' };
}

export function instalarGema(equip, slotIndex, gemaId) {
  const compat = verificarCompatibilidadeGema(equip, gemaId, slotIndex);
  if (!compat.ok) return { ok: false, motivo: compat.motivo };
  const gemas = equip.gemasSlotadas ? [...equip.gemasSlotadas] : new Array(equip.slots || 0).fill(null);
  gemas[slotIndex] = { slot: slotIndex, gemaId };
  return { ok: true, equip: { ...equip, gemasSlotadas: gemas }, gemaInstalada: { id: gemaId, nome: gemaId } };
}

export function removerGema(equip, slotIndex, temMagiaRemocao = false) {
  if (!equip.gemasSlotadas || !equip.gemasSlotadas[slotIndex]) {
    return { ok: false, motivo: 'Não há gema neste slot.' };
  }
  if (!temMagiaRemocao) {
    return { ok: false, motivo: 'Remoção exige magia específica.' };
  }
  const gemas = [...equip.gemasSlotadas];
  const removida = gemas[slotIndex];
  gemas[slotIndex] = null;
  return { ok: true, equip: { ...equip, gemasSlotadas: gemas }, gemaRemovida: removida };
}

// ============================================================================
// REGRAS ESPECIAIS — FERRO ESTÍGIO E HONRÍNEO
// ============================================================================

export function podeUsarFerroEstigio(personagem) {
  const treinamento = personagem && personagem.treinamentos
    ? personagem.treinamentos.includes('ferroEstigio')
    : false;
  return {
    podeUsar: treinamento,
    motivo: treinamento ? '' : 'Ferro Estígio exige treinamento específico.',
  };
}

export function aplicarHonrineo(equip, personagem) {
  if (!equip || !personagem) {
    return { equip, modificacao: null, motivo: 'Dados inválidos.' };
  }
  // Honríneo adapta o equipamento ao usuário: ajusta bônus de atributos
  // com base nos atributos principais do personagem.
  const atributoPrincipal = personagem.classe === 'guerreiro' ? 'forca'
    : personagem.classe === 'mago' ? 'inteligencia'
    : personagem.classe === 'arqueiro' ? 'destreza'
    : 'forca';

  const modificacao = {
    tipo: 'adaptacao',
    atributo: atributoPrincipal,
    descricao: `Adaptado para ${personagem.nome} (${personagem.classe})`,
  };

  return {
    equip: { ...equip, honrineoAplicado: true },
    modificacao,
    motivo: 'Honríneo aplicado com sucesso.',
  };
}

// ============================================================================
// CÁLCULO DE ATRIBUTOS DO PERSONAGEM COM EQUIPAMENTO
// ============================================================================

export function calcularAtributosPersonagem(personagem, equipamentoEquipado = {}) {
  const atributos = { ...(personagem.attributes || personagem.atributos || {}) };

  for (const slot of Object.values(equipamentoEquipado)) {
    if (!slot) continue;
    if (slot.bonus) {
      for (const [attr, val] of Object.entries(slot.bonus)) {
        atributos[attr] = (atributos[attr] || 0) + val;
      }
    }
    if (slot.penalidade) {
      for (const [attr, val] of Object.entries(slot.penalidade)) {
        atributos[attr] = (atributos[attr] || 0) + val;
      }
    }
  }

  return atributos;
}

// ============================================================================
// CUSTO DE FABRICAÇÃO
// ============================================================================

export function calcularCustoFabricacao(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas = []) {
  let custo = calcularPrecoEquipamento(equipId);

  // Custo dos materiais primários e secundários
  const MATERIAIS_PRECO = {
    ferro: 5, cobre: 8, estanho: 6, chumbo: 10,
    bronze: 15, ferroForjado: 25, aco: 40, prata: 100, ouro: 200,
    obsidiana: 200, diamante: 500,
  };

  if (materialPrimarioId && MATERIAIS_PRECO[materialPrimarioId] !== undefined) {
    custo += MATERIAIS_PRECO[materialPrimarioId];
  }
  if (materialSecundarioId && MATERIAIS_PRECO[materialSecundarioId] !== undefined) {
    custo += Math.round(MATERIAIS_PRECO[materialSecundarioId] * 0.25); // secundário = até 25%
  }

  // Custo das gemas
  const GEMA_PRECO = { diamante: 500, obsidiana: 200 };
  for (const g of gemasSlotadas) {
    if (g && g.gemaId && GEMA_PRECO[g.gemaId] !== undefined) {
      custo += GEMA_PRECO[g.gemaId];
    }
  }

  return Math.round(custo);
}

// ============================================================================
// EXPORTAÇÕES PARA COMPATIBILIDADE COM OUTROS MÓDULOS
// ============================================================================

export const EQUIPAMENTOS = {};
export const EQUIPAMENTO_IDS = [];

export const MATERIAIS = {};
export const MATERIAL_IDS = [];

export function getEquipamentoById(id) {
  return PRECOS_EQUIPAMENTOS[id] ? { id, ...PRECOS_EQUIPAMENTOS[id] } : null;
}

export function getMaterialById(id) {
  return null;
}
