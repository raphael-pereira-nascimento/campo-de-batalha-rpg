// ══════════════════════════════════════════════════════════════════════════════════════
// SISTEMA DE FORJA — Cálculos puros para crafting de equipamentos
// Importa de materials.js e equipments.js (sem dependência circular)
// ══════════════════════════════════════════════════════════════════════════════════════

import { MATERIAIS, getMaterialById, calcularPrecoMaterial } from './materials.js';
import { EQUIPAMENTOS, getEquipamentoById, calcularPrecoEquipamento as calcPrecoCat } from './equipments.js';

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

  // Gemas slotadas adicionam seus bônus
  for (const g of gemasSlotadas) {
    if (g && g.gemaId) {
      // Os bônus das gemas viriam do catálogo de gems.js
      // Aqui apenas registramos que a gema está instalada
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

  // Custo dos materiais primários e secundários
  if (materialPrimarioId) {
    custo += calcularPrecoMaterial(materialPrimarioId, 1);
  }
  if (materialSecundarioId) {
    custo += Math.round(calcularPrecoMaterial(materialSecundarioId, 1) * 0.25);
  }

  // Custo das gemas (usar preços aproximados)
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

  // Verificar Ferro Estígio
  if (materialPrimarioId === 'ferroEstigio' || materialSecundarioId === 'ferroEstigio') {
    const pode = podeUsarFerroEstigio(personagem);
    if (!pode.podeUsar) {
      return { ok: false, motivo: pode.motivo };
    }
  }

  // Calcular atributos finais
  const resultado = calcularAtributosEquipamento(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas);
  if (!resultado.ok) return resultado;

  // Calcular custo
  const custo = calcularCustoFabricacao(equipId, materialPrimarioId, materialSecundarioId, gemasSlotadas);

  // Aplicar Honríneo se solicitado
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
// EXPORTAÇÕES PARA COMPATIBILIDADE COM OUTROS MÓDULOS
// ============================================================================

export const MATERIAL_IDS = Object.keys(MATERIAIS);
export const EQUIPAMENTO_IDS = Object.keys(EQUIPAMENTOS);

export { MATERIAIS, EQUIPAMENTOS, getMaterialById, getEquipamentoById };
