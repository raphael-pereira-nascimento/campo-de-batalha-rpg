// Validação de fusão de gemas no servidor.
// Espelha a regra do cliente (src/game/gems.js -> verificarFusao), para que
// QUALQUER combinação compatível funcione online, e não só as 2 receitas
// históricas da forja. O servidor continua sendo a autoridade: ele resolve o
// resultado, cobra a mana e só então altera o inventário.
import { GEMS, GEM_LIST } from './gems.js';
import { FORGE_GEMS, FUSOES } from './forgeGems.js';

const RARITY_ORDER = { comum: 0, incomum: 1, rara: 2, epica: 3, lendaria: 4 };
const RARITY_MANA = { comum: 10, incomum: 20, rara: 30, epica: 50, lendaria: 80 };
const RARITY_ALIAS = {
  Comum: 'comum',
  Incomum: 'incomum',
  Rara: 'rara',
  'Épica': 'epica',
  Epica: 'epica',
  'Mítica': 'lendaria',
  Mitica: 'lendaria',
  'Lendária': 'lendaria',
  'Lendário': 'lendaria',
  Lendario: 'lendaria',
};

// Dados que existem no cliente (src/game/gems.js -> gemas) mas não no espelho
// enxuto do servidor. Mantê-los aqui deixa a fusão genérica idêntica.
const FORGE_EXTRA = {
  obsidiana: { custoFusaoMana: 30, fusoesCompativeis: ['agataDeFogo', 'rubi', 'granada'] },
  agataDeFogo: { custoFusaoMana: 20, fusoesCompativeis: ['rubi', 'obsidiana', 'granada'] },
  rubi: { custoFusaoMana: 50, fusoesCompativeis: ['diamante', 'obsidiana', 'pedraDeSangue', 'agataDeFogo'] },
  pedraDeSangue: { custoFusaoMana: 100, fusoesCompativeis: ['rubi', 'onix', 'lagrimasVermelhas'] },
};

const tipoBase = (tipo) => String(tipo || '').toLowerCase().split(/[\s(/]/)[0];
const parKey = (a, b) => [a, b].sort().join('|');

function normalizarRaridade(raridade) {
  if (!raridade) return 'comum';
  const s = String(raridade);
  if (RARITY_ORDER[s] !== undefined) return s;
  return RARITY_ALIAS[s] || s.toLowerCase();
}

// Resolve gemas do catálogo OU exclusivas da forja para o formato usado na fusão.
export function resolveGem(id) {
  const daForja = FORGE_GEMS[id];
  if (daForja) {
    const raridadeId = normalizarRaridade(daForja.raridade);
    const extra = FORGE_EXTRA[id] || {};
    return {
      ...daForja,
      raridadeId,
      custoFusaoMana: extra.custoFusaoMana ?? RARITY_MANA[raridadeId] ?? 20,
      fusoesCompativeis: extra.fusoesCompativeis || [],
    };
  }
  const doCatalogo = GEMS[id];
  if (doCatalogo) {
    const raridadeId = normalizarRaridade(doCatalogo.raridade);
    return {
      ...doCatalogo,
      raridadeId,
      custoFusaoMana: RARITY_MANA[raridadeId] ?? 20,
      fusoesCompativeis: (doCatalogo.fusao || []).slice(),
    };
  }
  return null;
}

// Pares que o catálogo declara como fundíveis (campo gem.fusao).
const PARES_COMPATIVEIS = (() => {
  const set = new Set();
  for (const g of GEM_LIST) {
    for (const f of g.fusao || []) set.add(parKey(g.id, f));
  }
  return set;
})();

function resultadoGenerico(gemaA, gemaB) {
  const ordemA = RARITY_ORDER[gemaA.raridadeId] ?? 1;
  const ordemB = RARITY_ORDER[gemaB.raridadeId] ?? 1;
  const alvo = Math.min(4, Math.max(ordemA, ordemB) + 1);
  const tipo = tipoBase(gemaA.tipo);
  const usados = new Set([gemaA.id, gemaB.id]);

  let candidatos = GEM_LIST.filter(
    (g) => RARITY_ORDER[g.raridade] === alvo && tipoBase(g.tipo) === tipo && !usados.has(g.id),
  );
  if (!candidatos.length) {
    candidatos = GEM_LIST.filter((g) => RARITY_ORDER[g.raridade] === alvo && !usados.has(g.id));
  }
  if (!candidatos.length) candidatos = GEM_LIST.filter((g) => !usados.has(g.id));

  const escolhida = candidatos[0];
  if (!escolhida) return null;

  return {
    id: escolhida.id,
    nome: escolhida.nome,
    raridade: escolhida.raridade,
    raridadeId: escolhida.raridade,
    custoManaTotal: (gemaA.custoFusaoMana || 20) + (gemaB.custoFusaoMana || 20),
    efeitos: escolhida.efeitos || {},
    descricao: `Fusão de ${gemaA.nome} + ${gemaB.nome}. ${escolhida.descricao || ''}`.trim(),
  };
}

// Retorna { ok, resultado?|motivo?, instavel? }.
export function verificarFusaoServer(gemAInput, gemBInput) {
  const gemaA = resolveGem(gemAInput?.id);
  const gemaB = resolveGem(gemBInput?.id);
  if (!gemaA || !gemaB) {
    return { ok: false, motivo: 'Gema desconhecida.' };
  }
  if (gemaA.id === gemaB.id) {
    return { ok: false, motivo: 'Não é possível fundir uma gema com ela mesma.' };
  }
  if (gemAInput.estado === 'bruta' || gemBInput.estado === 'bruta') {
    return {
      ok: false,
      bruta: true,
      motivo: 'Pedras brutas precisam ser polidas antes de serem fundidas.',
    };
  }

  // 1) Receita explícita da forja (Obsidiana Ardente, Rubi Abissal...).
  const receita = FUSOES.find((r) => parKey(r.ingredientes[0], r.ingredientes[1]) === parKey(gemaA.id, gemaB.id));
  if (receita) {
    const alvo = GEMS[receita.resultadoId];
    if (!alvo) return { ok: false, motivo: 'Gema resultante inválida.' };
    return {
      ok: true,
      resultado: {
        id: alvo.id,
        nome: alvo.nome,
        raridade: alvo.raridade,
        raridadeId: alvo.raridade,
        custoManaTotal: receita.custoMana,
        efeitos: alvo.efeitos || {},
        descricao: alvo.descricao || '',
      },
    };
  }

  // 2) Receita declarada no catálogo (campo fusao_requisito).
  const par = parKey(gemaA.id, gemaB.id);
  const doCatalogo = GEM_LIST.find(
    (g) =>
      Array.isArray(g.fusao_requisito) &&
      g.fusao_requisito.length === 2 &&
      parKey(g.fusao_requisito[0], g.fusao_requisito[1]) === par,
  );
  if (doCatalogo) {
    return {
      ok: true,
      resultado: {
        id: doCatalogo.id,
        nome: doCatalogo.nome,
        raridade: doCatalogo.raridade,
        raridadeId: doCatalogo.raridade,
        custoManaTotal: (gemaA.custoFusaoMana || 20) + (gemaB.custoFusaoMana || 20),
        efeitos: doCatalogo.efeitos || {},
        descricao: doCatalogo.descricao || '',
      },
    };
  }

  // 3) Compatibilidade: par declarado no catálogo, listas mútuas ou mesmo tipo.
  const listado =
    PARES_COMPATIVEIS.has(par) ||
    (gemaA.fusoesCompativeis || []).includes(gemaB.id) ||
    (gemaB.fusoesCompativeis || []).includes(gemaA.id) ||
    tipoBase(gemaA.tipo) === tipoBase(gemaB.tipo);

  if (!listado) {
    return {
      ok: false,
      instavel: true,
      motivo: 'Combinação instável: as gemas não são compatíveis.',
    };
  }

  const resultado = resultadoGenerico(gemaA, gemaB);
  if (!resultado) {
    return { ok: false, instavel: true, motivo: 'Nenhuma gema compatível para resultar desta fusão.' };
  }
  return { ok: true, resultado };
}
