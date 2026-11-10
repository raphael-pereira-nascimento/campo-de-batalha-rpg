import { MATERIAL_LIST, MATERIAIS, getMaterialById, getMateriaisPorTipo, getMaterialPorAlias, getMateriaisParaGolem } from '../../src/game/materials.js';
import {
  MATERIAL_CATEGORIAS, MATERIAL_RARIDADES, MATERIAL_QUALIDADES,
  filtrarMateriais, calcularBonusComposicao, getEfeitoPorEquipamento,
  formatarPrecoPorKg, precoKgEmCents, camposPendentes,
} from '../../src/game/materialRules.js';

const contar = (lista) => lista.reduce((acc, item) => {
  acc[item] = (acc[item] || 0) + 1;
  return acc;
}, {});

const dump = {
  total: MATERIAL_LIST.length,
  porCategoria: contar(MATERIAL_LIST.map((m) => m.categoria)),
  porTipo: contar(MATERIAL_LIST.map((m) => m.tipo)),
  porRaridade: contar(MATERIAL_LIST.map((m) => m.raridade ?? 'pendente')),
  porQualidade: contar(MATERIAL_LIST.map((m) => m.qualidade ?? 'pendente')),
  porStatus: contar(MATERIAL_LIST.map((m) => m.status)),
  comPreco: MATERIAL_LIST.filter((m) => m.precoPorKg != null).map((m) => m.id),
  semPreco: MATERIAL_LIST.filter((m) => m.precoPorKg == null).map((m) => m.id),
  golem: getMateriaisParaGolem().map((m) => m.id),
  lendaria: MATERIAL_LIST.filter((m) => m.raridade === 'lendaria').map((m) => m.id),
  muitoRara: MATERIAL_LIST.filter((m) => m.raridade === 'muitoRara').map((m) => m.id),
  mitica: MATERIAL_LIST.filter((m) => m.raridade === 'mitica').map((m) => m.id),
  qualidadePendente: MATERIAL_LIST.filter((m) => m.qualidade == null).length,
  raridadePendente: MATERIAL_LIST.filter((m) => m.raridade == null).length,
  aliases: {
    honra: getMaterialPorAlias('Minério de Honra')?.id ?? null,
    honrineo: getMaterialPorAlias('Honrineo')?.id ?? null,
    vidro: getMaterialPorAlias('Vidro de Dragão')?.id ?? null,
    mithril: getMaterialPorAlias('Minério de Mithril')?.id ?? null,
    alma: getMaterialPorAlias('Minério da Alma')?.id ?? null,
    rubi: getMaterialPorAlias('Aço Rubi')?.id ?? null,
  },
  precoMaisBarato: [...MATERIAL_LIST]
    .filter((m) => m.precoPorKg != null)
    .sort((a, b) => precoKgEmCents(a.precoPorKg) - precoKgEmCents(b.precoPorKg))
    .slice(0, 8)
    .map((m) => [m.id, formatarPrecoPorKg(m), camposPendentes(m).length]),
  efeitos: Object.fromEntries(
    ['aco', 'ferro', 'estanho', 'bronze', 'cobre', 'ouro', 'tenebrium', 'uru'].map((id) => {
      const m = getMaterialById(id);
      return [id, {
        categoria: m.categoria,
        aplicacoes: m.aplicacoes,
        efeitos: Object.fromEntries(
          Object.entries(m.efeitos).filter(([, v]) => v).map(([k, v]) => [k, { desc: v.desc, bonus: v.bonus, percentuais: v.percentuais, penalidades: v.penalidades, condicoes: v.condicoes, especial: v.especial }]),
        ),
      }];
    }),
  ),
  composicoes: {
    acoEstanhoGolem: calcularBonusComposicao(getMaterialById('aco'), getMaterialById('estanho'), 'golem'),
    acoImpacto: calcularBonusComposicao(getMaterialById('aco'), null, 'armaImpacto'),
    cobreOuroCajado: calcularBonusComposicao(getMaterialById('cobre'), getMaterialById('ouro'), 'cajado'),
    tenebriumImpacto: calcularBonusComposicao(getMaterialById('tenebrium'), getMaterialById('ferro'), 'armaImpacto'),
    uruGolem: calcularBonusComposicao(getMaterialById('uru'), getMaterialById('aco'), 'golem'),
    diamanteArmadura: calcularBonusComposicao(getMaterialById('diamante'), null, 'armadura'),
  },
  exemploPendente: camposPendentes(getMaterialById('ferro')),
  exemploCompleto: MATERIAL_LIST.filter((m) => m.status === 'completo').map((m) => m.id),
};

window.__DUMP__ = dump;
document.getElementById('saida').textContent = JSON.stringify(dump, null, 2);
