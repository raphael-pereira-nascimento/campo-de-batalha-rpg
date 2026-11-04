// ════════════════════════════════════════════════════════════════════════════════════════
// SISTEMA DE FORJA — Cálculos puros para crafting de equipamentos
// Importa de materials.js e equipments.js (sem dependência circular)
// ═══════════════════════════════════════════════════════════════════════════════════════

import { MATERIAIS, getMaterialById, calcularPrecoMaterial } from './materials.js';
import { EQUIPAMENTOS, getEquipamentoById, calcularPrecoEquipamento as calcPrecoCat } from './equipments.js';
import { getGemaById } from './gems.js';

// ============================================================================
// CÁLCULO DE PREÇO DE EQUIPAMENTO (delega para equipments.js)
// ============================================================================
export function calcularPrecoEquipamento(equipId) {
  return calcPrecoCat(equipId);
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

// Bônus de conjunto: quando o personagem usa múltiplos itens do mesmo material primário
export const BONUS_CONJUNTO = {
  ferro:   { 2: { forca: 1 }, 3: { forca: 2 }, 4: { forca: 3, resistencia: 1 } },
  cobre:   { 2: { inteligencia: 1 }, 3: { inteligencia: 2 }, 4: { inteligencia: 3 } },
  bronze:  { 2: { forca: 1, resistencia: 1 }, 3: { forca: 2, resistencia: 2 }, 4: { forca: 3, resistencia: 3 } },
  aco:     { 2: { forca: 2 }, 3: { forca: 3, resistencia: 1 }, 4: { forca: 4, resistencia: 2 } },
  prata:   { 2: { inteligencia: 1, resistencia: 1 }, 3: { inteligencia: 2, resistencia: 2 }, 4: { inteligencia: 3, resistencia: 3 } },
  ouro:    { 2: { inteligencia: 2 }, 3: { inteligencia: 3 }, 4: { inteligencia: 4, sorte: 1 } },
  obsidiana: { 2: { forca: 1, inteligencia: 1 }, 3: { forca: 2, inteligencia: 2 }, 4: { forca: 3, inteligencia: 3 } },
  diamante:  { 2: { forca: 2, resistencia: 1 }, 3: { forca: 3, resistencia: 2, inteligencia: 1 }, 4: { forca: 4, resistencia: 3, inteligencia: 2 } },
};

/**
 * Calcula os bônus de conjunto baseados nos materiais primários dos itens equipados.
 * Retorna um objeto com os atributos adicionais do conjunto.
 */
export function calcularBonusConjunto(equipamentoEquipado = {}) {
  const contagemMateriais = {};
  for (const slot of Object.values(equipamentoEquipado)) {
    if (!slot || !slot.materiais) continue;
    // Item quebrado não conta para o conjunto
    if (slot.durabilidade != null && slot.durabilidade <= 0) continue;
    const matPrimario = slot.materiais.primario;
    if (matPrimario) {
      contagemMateriais[matPrimario] = (contagemMateriais[matPrimario] || 0) + 1;
    }
  }

  const bonusConjunto = {};
  for (const [material, qtd] of Object.entries(contagemMateriais)) {
    const niveis = BONUS_CONJUNTO[material];
    if (!niveis) continue;
    let melhorNivel = 0;
    for (const [nivelMin, bonus] of Object.entries(niveis)) {
      if (qtd >= Number(nivelMin)) {
        melhorNivel = Number(nivelMin);
      }
    }
    if (melhorNivel > 0) {
      const bonus = niveis[melhorNivel];
      for (const [attr, val] of Object.entries(bonus)) {
        bonusConjunto[attr] = (bonusConjunto[attr] || 0) + val;
      }
    }
  }

  return bonusConjunto;
}

export function calcularAtributosPersonagem(personagem, equipamentoEquipado = {}) {
  const atributos = { ...(personagem.attributes || personagem.atributos || {}) };

  for (const slot of Object.values(equipamentoEquipado)) {
    if (!slot) continue;
    // Item quebrado (durabilidade 0) não concede bônus
    if (slot.durabilidade != null && slot.durabilidade <= 0) continue;
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

  // Aplica bônus de conjunto
  const bonusConjunto = calcularBonusConjunto(equipamentoEquipado);
  for (const [attr, val] of Object.entries(bonusConjunto)) {
    atributos[attr] = (atributos[attr] || 0) + val;
  }

  return atributos;
}

// ============================================================================
// CÁLCULO DE ATRIBUTOS DO EQUIPAMENTO CRAFTADO (com materiais primário/secundário)
// ============================================================================

export function calcularAtributosEquipamento(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas = []) {
  const equip = getEquipamentoById(equipId);
  if (!equip) return { ok: false, motivo: 'Equipamento não encontrado.' };

  const matPrimario = materialPrimarioId ? getMaterialById(materialPrimarioId) : null;
  const matSecundario = materialSecundarioId ? getMaterialById(materialSecundarioId) : null;

  const atributos = { ...(equip.bonus || {}) };

  // Material primário = 100% dos efeitos
  if (matPrimario) {
    const efeito = matPrimario.efeitos?.[equip.subcategoria || 'armaLamina'];
    if (efeito && efeito.bonus) {
      for (const [attr, val] of Object.entries(efeito.bonus)) {
        atributos[attr] = (atributos[attr] || 0) + val;
      }
    }
  }

  // Material secundário = até 25% dos efeitos (arredondado para baixo)
  if (matSecundario) {
    const efeito = matSecundario.efeitos?.[equip.subcategoria || 'armaLamina'];
    if (efeito && efeito.bonus) {
      for (const [attr, val] of Object.entries(efeito.bonus)) {
        const bonusParcial = Math.floor(val * 0.25);
        if (bonusParcial !== 0) {
          atributos[attr] = (atributos[attr] || 0) + bonusParcial;
        }
      }
    }
  }

  // Gemas slotadas aplicam seus bônus por tipo de equipamento
  const gemaEquipTipo = equip.tipo === 'arma' ? 'arma'
    : equip.tipo === 'armadura' ? 'armadura'
    : equip.tipo === 'acessorio' ? 'acessorio'
    : null;

  for (const g of gemasSlotadas) {
    if (!g || !g.gemaId) continue;
    const gema = getGemaById(g.gemaId);
    if (!gema) continue;
    const efeito = gema.efeitos?.[gemaEquipTipo];
    if (!efeito || !efeito.bonus) continue;
    for (const [attr, val] of Object.entries(efeito.bonus)) {
      atributos[attr] = (atributos[attr] || 0) + val;
    }
  }

  return {
    ok: true,
    equip: { ...equip, materialPrimario: matPrimario?.id, materialSecundario: matSecundario?.id },
    atributos,
    materiais: { primario: matPrimario, secundario: matSecundario },
  };
}

// ============================================================================
// CUSTO DE FABRICAÇÃO
// ============================================================================
export function calcularCustoFabricacao(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas = []) {
  const equip = getEquipamentoById(equipId);
  if (!equip) return 0;

  let custo = equip.precoBase || 0;

  if (materialPrimarioId) {
    custo += calcularPrecoMaterial(materialPrimarioId, 1);
  }
  if (materialSecundarioId) {
    custo += Math.round(calcularPrecoMaterial(materialSecundarioId, 1) * 0.25);
  }

  const GEMA_PRECO = { diamante: 500, obsidiana: 200 };
  for (const g of gemasSlotadas) {
    if (g && g.gemaId && GEMA_PRECO[g.gemaId] !== undefined) {
      custo += GEMA_PRECO[g.gemaId];
    }
  }

  return Math.round(custo);
}

// ============================================================================
// CRAFTING DE EQUIPAMENTO
// ============================================================================

export function craftarEquipamento(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas = [], personagem = null) {
  const equip = getEquipamentoById(equipId);
  if (!equip) return { ok: false, motivo: 'Equipamento não encontrado.' };

  if (materialPrimarioId === 'ferroEstigio' || materialSecundarioId === 'ferroEstigio') {
    const pode = podeUsarFerroEstigio(personagem);
    if (!pode.podeUsar) {
      return { ok: false, motivo: pode.motivo };
    }
  }

  const resultado = calcularAtributosEquipamento(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas);
  if (!resultado.ok) return resultado;

  const custo = calcularCustoFabricacao(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas);

  let honrineo = null;
  if (personagem) {
    honrineo = aplicarHonrineo(resultado.equip, personagem);
  }

  return {
    ok: true,
    equip: {
      ...resultado.equip,
      custo,
      materiais: resultado.materiais,
      atributosFinais: resultado.atributos,
      gemasSlotadas,
      honrineoAplicado: honrineo ? true : false,
    },
    custo,
    atributos: resultado.atributos,
    honrineo,
  };
}

// ============================================================================
// MELHORIA / APRRIMORAMENTO DE EQUIPAMENTO (+1, +2, etc.)
// ============================================================================

const MELHORIA_CUSTO_BASE = 500;
const MELHORIA_CUSTO_MULT = 1.5;

const MELHORIA_BONUS_POR_NIVEL = {
  arma: { forca: 1 },
  armadura: { resistencia: 1 },
  acessorio: { inteligencia: 1 },
  cajado: { inteligencia: 1 },
  varinha: { inteligencia: 1 },
  grimorio: { inteligencia: 1 },
  orbe: { inteligencia: 1 },
  catalisador: { inteligencia: 1 },
};

export function calcularCustoMelhoria(nivelAtual = 0) {
  return Math.round(MELHORIA_CUSTO_BASE * Math.pow(MELHORIA_CUSTO_MULT, nivelAtual));
}

export function melhorarEquipamento(equip, personagem = null) {
  if (!equip) return { ok: false, motivo: 'Equipamento inválido.' };

  const nivelAtual = Number(equip.melhoriaNivel || 0);
  const nivelNovo = nivelAtual + 1;
  const custo = calcularCustoMelhoria(nivelAtual);

  const tipoBonus = MELHORIA_BONUS_POR_NIVEL[equip.tipo] || { forca: 1 };
  const atributosAdicionados = {};
  for (const [attr, val] of Object.entries(tipoBonus)) {
    atributosAdicionados[attr] = val;
  }

  const atributosFinais = { ...(equip.atributosFinais || equip.bonus || {}) };
  for (const [attr, val] of Object.entries(atributosAdicionados)) {
    atributosFinais[attr] = (atributosFinais[attr] || 0) + val;
  }

  const equipMelhorado = {
    ...equip,
    melhoriaNivel: nivelNovo,
    atributosFinais,
    custoMelhoria: custo,
  };

  return {
    ok: true,
    equip: equipMelhorado,
    custo,
    nivelNovo,
    atributosAdicionados,
  };
}

// ============================================================================
// DESMONTAGEM / SALVAGEM DE EQUIPAMENTO
// ============================================================================

const DESMONTAGEM_RECUPERACAO_POR_RARIDADE = {
  comum: 0.5,
  incomum: 0.4,
  rara: 0.35,
  epica: 0.3,
  lendaria: 0.25,
};

export function desmontarEquipamento(equip) {
  if (!equip) return { ok: false, motivo: 'Equipamento inválido.' };

  const materiais = equip.materiais;
  if (!materiais || (!materiais.primario && !materiais.secundario)) {
    return { ok: false, motivo: 'Este equipamento não possui materiais para recuperar.' };
  }

  const raridade = equip.raridade || 'comum';
  const taxaBase = DESMONTAGEM_RECUPERACAO_POR_RARIDADE[raridade] || 0.5;
  const nivelMelhoria = Number(equip.melhoriaNivel || 0);
  const bonusMelhoria = Math.min(0.25, nivelMelhoria * 0.05);
  const taxaFinal = Math.min(0.9, taxaBase + bonusMelhoria);

  const materiaisRecuperados = {};

  if (materiais.primario && materiais.primario.id) {
    const qtd = Math.max(1, Math.round((materiais.primario.quantidade || 1) * taxaFinal));
    materiaisRecuperados[materiais.primario.id] = qtd;
  }

  if (materiais.secundario && materiais.secundario.id) {
    const qtd = Math.max(1, Math.round((materiais.secundario.quantidade || 1) * taxaFinal));
    materiaisRecuperados[materiais.secundario.id] = qtd;
  }

  const gemasRecuperadas = [];
  if (equip.gemasSlotadas) {
    for (const g of equip.gemasSlotadas) {
      if (g && g.gemaId) {
        gemasRecuperadas.push({ id: g.gemaId, slot: g.slot });
      }
    }
  }

  return {
    ok: true,
    materiaisRecuperados,
    gemasRecuperadas,
    taxaRecuperacao: taxaFinal,
    nivelMelhoria,
    raridade,
  };
}

// ============================================================================
// DURABILIDADE E REPARO DE EQUIPAMENTO
// ============================================================================

const DURABILIDADE_MAX_POR_RARIDADE = {
  comum: 100,
  incomum: 120,
  rara: 150,
  epica: 180,
  lendaria: 200,
};

const CUSTO_REPARO_POR_PONTO_POR_RARIDADE = {
  comum: 2,
  incomum: 3,
  rara: 5,
  epica: 8,
  lendaria: 12,
};

export function calcularDurabilidadeMax(raridade = 'comum') {
  return DURABILIDADE_MAX_POR_RARIDADE[raridade] || 100;
}

export function calcularCustoReparoPorPonto(raridade = 'comum') {
  return CUSTO_REPARO_POR_PONTO_POR_RARIDADE[raridade] || 2;
}

export function inicializarDurabilidade(equip) {
  if (!equip) return 0;
  return calcularDurabilidadeMax(equip.raridade || 'comum');
}

export function aplicarDanoDurabilidade(durabilidadeAtual, dano = 1) {
  const nova = Math.max(0, durabilidadeAtual - dano);
  return {
    durabilidadeNova: nova,
    quebrado: nova <= 0,
  };
}

export function calcularCustoReparoCompleto(equip, durabilidadeAtual) {
  if (!equip) return null;
  const durMax = calcularDurabilidadeMax(equip.raridade || 'comum');
  if (durabilidadeAtual >= durMax) return null;

  const pontosReparar = durMax - durabilidadeAtual;
  const custoPorPonto = calcularCustoReparoPorPonto(equip.raridade || 'comum');
  const custoTotal = pontosReparar * custoPorPonto;

  return {
    custoTotal,
    pontosReparar,
    durabilidadeAtual,
    durabilidadeMax: durMax,
  };
}

export function repararEquipamento(equip, durabilidadeAtual) {
  if (!equip) return { ok: false, motivo: 'Equipamento inválido.' };

  const reparo = calcularCustoReparoCompleto(equip, durabilidadeAtual);
  if (!reparo) {
    return { ok: false, motivo: 'Este equipamento não precisa de reparo.' };
  }

  return {
    ok: true,
    custo: reparo.custoTotal,
    durabilidadeNova: reparo.durabilidadeMax,
    pontosReparados: reparo.pontosReparar,
  };
}

// ============================================================================
// EXPORTAÇÕES PARA COMPATIBILIDADE COM OUTROS MÓDULOS
// ============================================================================

export const MATERIAL_IDS = Object.keys(MATERIAIS);
export const EQUIPAMENTO_IDS = Object.keys(EQUIPAMENTOS);

export { MATERIAIS, EQUIPAMENTOS, getMaterialById, getEquipamentoById };
