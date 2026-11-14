// ═══════════════════════════════════════════════════════════════════════════════════════
// RUNAS ELEMENTAIS — dados e metadados aprovados
// Módulo puro: nenhum efeito colateral, nenhuma integração automática com o combate.
//
// Regras documentadas:
// - Runas podem ser instaladas em equipamentos de qualquer metal.
// - Cada runa ocupa um encaixe que poderia receber uma pedra preciosa.
// - Sem Aço Rúnico: 1 runa, com efeito reduzido em 50%.
// - Com Aço Rúnico: 2 runas simultâneas, com efeito aumentado em 50%.
// - Duas runas só podem ser usadas juntas quando forem de elementos diferentes.
//
// Os efeitos individuais de cada runa não foram definidos na documentação
// recuperada. Este módulo registra apenas os elementos e as regras de uso.
// ═══════════════════════════════════════════════════════════════════════════════════════

export const RUNAS_ELEMENTOS = [
  { id: 'agua', nome: 'Água' },
  { id: 'gelo', nome: 'Gelo' },
  { id: 'fogo', nome: 'Fogo' },
  { id: 'ar', nome: 'Ar' },
  { id: 'planta', nome: 'Planta' },
  { id: 'pedra', nome: 'Pedra' },
  { id: 'eletrico', nome: 'Elétrico' },
  { id: 'luz', nome: 'Luz' },
  { id: 'sombrio', nome: 'Sombrio' },
  { id: 'psiquico', nome: 'Psíquico' },
  { id: 'dor', nome: 'Dor' },
  { id: 'veneno', nome: 'Veneno' },
  { id: 'tempo', nome: 'Tempo' },
  { id: 'sangue', nome: 'Sangue' },
  { id: 'metais', nome: 'Metais' },
  { id: 'ilusao', nome: 'Ilusão' },
  { id: 'areia', nome: 'Areia' },
];

export const RUNAS_REGRA_SEM_ACO_RUNICO = {
  maxRunas: 1,
  multiplicadorEfeito: 0.5,
  descricao: 'Sem Aço Rúnico, o equipamento aceita 1 runa e o efeito dela é reduzido em 50%.',
};

export const RUNAS_REGRA_COM_ACO_RUNICO = {
  maxRunas: 2,
  multiplicadorEfeito: 1.5,
  descricao: 'Com Aço Rúnico, o equipamento aceita 2 runas simultâneas e o efeito delas é aumentado em 50%.',
};

export const RUNAS_COMBINACAO = {
  elementosDiferentesObrigatorio: true,
  descricao: 'Duas runas simultâneas precisam ser de elementos diferentes.',
};

export const RUNAS_ENCAIXE = {
  ocupaEncaixePedraPreciosa: true,
  descricao: 'Cada runa ocupa um encaixe que poderia receber uma pedra preciosa.',
};

// Efeito-base aprovado para as runas (proposta implementada, NÃO é dado
// oficial): passivo de +10% de dano e +10% de resistência ao elemento da runa;
// ativo com 20% de chance de aplicar o efeito elemental por 2 turnos.
// O multiplicador do Aço Rúnico incide sobre a potência (dano/resistência e
// chance), mas NÃO sobre a duração. Os efeitos individuais de cada elemento
// continuam pendentes de definição oficial.
export const RUNAS_EFEITO_BASE = {
  oficial: false,
  origem: 'proposta aprovada',
  passivo: {
    bonusDanoPct: 10,
    resistenciaPct: 10,
  },
  ativo: {
    chancePct: 20,
    duracaoTurnos: 2,
  },
  descricao: 'Efeito elemental genérico aprovado; identidade individual de cada runa ainda pendente.',
};

export const RUNAS_OBSERVACOES = [
  'As runas não são exclusivas do Aço Rúnico; qualquer equipamento pode recebê-las.',
  'O Aço Rúnico aumenta a potência das runas e permite duas inscrições simultâneas.',
  'Os efeitos individuais de cada elemento ainda não foram definidos.',
  'O efeito-base de +10% de dano/resistência e 20% de chance por 2 turnos é uma proposta aprovada, não um valor oficial.',
];

// Ficha individual das 17 runas. A identidade (elemento) é aprovada; o efeito
// próprio de cada runa continua PENDENTE. `efeitoIndividual: null` é intencional:
// não inventamos comportamento, número, duração ou alvo por elemento.
export const RUNAS_FICHAS = RUNAS_ELEMENTOS.map((elemento) => ({
  id: elemento.id,
  nome: `Runa de ${elemento.nome}`,
  elemento: elemento.id,
  elementoNome: elemento.nome,
  efeitoIndividual: null,
  efeitoOficial: false,
  status: 'pendente',
  observacoes: 'Identidade do elemento aprovada; efeito individual ainda não documentado.',
}));

export function fichaRuna(id, temAcoRunico = false) {
  const elemento = getElementoRuna(id);
  if (!elemento) return null;
  const ficha = RUNAS_FICHAS.find((item) => item.id === elemento.id);
  return {
    ...ficha,
    regra: { ...getRegraRunas(temAcoRunico) },
    efeitoGenerico: efeitoRuna(elemento.id, temAcoRunico),
  };
}

export function descreverFichaRuna(id, temAcoRunico = false) {
  const ficha = fichaRuna(id, temAcoRunico);
  if (!ficha) return 'Runa desconhecida.';
  return `${ficha.nome} — efeito individual pendente de definição oficial.`
    + ` Regra atual: ${ficha.regra.descricao}`;
}

export function getElementoRuna(id) {
  if (!id) return null;
  const alvo = String(id).toLowerCase();
  return RUNAS_ELEMENTOS.find((elemento) => elemento.id === alvo) || null;
}

export function getRegraRunas(temAcoRunico) {
  return temAcoRunico ? RUNAS_REGRA_COM_ACO_RUNICO : RUNAS_REGRA_SEM_ACO_RUNICO;
}

// Valida uma lista de runas (ids ou objetos com `elemento`/`id`).
export function validarRunas(runas, temAcoRunico = false) {
  const regra = getRegraRunas(temAcoRunico);
  const lista = Array.isArray(runas) ? runas : [];
  const erros = [];

  const elementos = lista.map((runa) => {
    if (typeof runa === 'string') return runa;
    return runa?.elemento || runa?.id || null;
  });

  if (lista.length > regra.maxRunas) {
    erros.push(`O limite é de ${regra.maxRunas} runa(s) ${temAcoRunico ? 'com' : 'sem'} Aço Rúnico.`);
  }

  for (const elemento of elementos) {
    if (!getElementoRuna(elemento)) {
      erros.push(`Elemento de runa inválido: ${elemento ?? 'ausente'}.`);
    }
  }

  if (RUNAS_COMBINACAO.elementosDiferentesObrigatorio && elementos.length > 1) {
    const normalizados = elementos.map((elemento) => String(elemento ?? '').toLowerCase());
    if (new Set(normalizados).size !== normalizados.length) {
      erros.push('Duas runas simultâneas precisam ser de elementos diferentes.');
    }
  }

  return {
    ok: erros.length === 0,
    erros,
    maxRunas: regra.maxRunas,
    multiplicadorEfeito: regra.multiplicadorEfeito,
    elementos,
  };
}

// Aplica o multiplicador documentado ao efeito base de uma runa.
export function calcularEfeitoRuna(valorBase, temAcoRunico = false) {
  const base = Number(valorBase);
  if (!Number.isFinite(base)) return 0;
  return base * getRegraRunas(temAcoRunico).multiplicadorEfeito;
}

// Efeito aprovado de uma runa (genérico por elemento). Retorna `null` para
// elemento desconhecido. A identidade individual de cada runa continua pendente.
export function efeitoRuna(elemento, temAcoRunico = false) {
  const el = getElementoRuna(elemento);
  if (!el) return null;
  const multiplicador = getRegraRunas(temAcoRunico).multiplicadorEfeito;
  return {
    elemento: el.id,
    nome: el.nome,
    oficial: RUNAS_EFEITO_BASE.oficial,
    origem: RUNAS_EFEITO_BASE.origem,
    multiplicador,
    passivo: {
      bonusDanoPct: RUNAS_EFEITO_BASE.passivo.bonusDanoPct * multiplicador,
      resistenciaPct: RUNAS_EFEITO_BASE.passivo.resistenciaPct * multiplicador,
    },
    ativo: {
      chancePct: RUNAS_EFEITO_BASE.ativo.chancePct * multiplicador,
      duracaoTurnos: RUNAS_EFEITO_BASE.ativo.duracaoTurnos,
    },
  };
}

// Modificadores no formato canônico de `combatEffects`/`materialRules`.
// Ainda não são aplicados automaticamente: servem para a futura integração
// de runas na forja e no combate, sem inventar a identidade de cada runa.
export function modificadoresRuna(elemento, temAcoRunico = false) {
  const efeito = efeitoRuna(elemento, temAcoRunico);
  if (!efeito) return [];
  return [
    {
      tipo: 'bonus',
      valor: efeito.passivo.bonusDanoPct,
      unidade: 'percentual',
      alvo: `dano de ${efeito.elemento}`,
      condicao: null,
      fonte: 'runa',
      elemento: efeito.elemento,
    },
    {
      tipo: 'resistencia',
      valor: efeito.passivo.resistenciaPct,
      unidade: 'percentual',
      alvo: `resistência a ${efeito.elemento}`,
      condicao: null,
      fonte: 'runa',
      elemento: efeito.elemento,
    },
    {
      tipo: 'chance',
      valor: efeito.ativo.chancePct,
      unidade: 'percentual',
      alvo: `aplicar efeito de ${efeito.elemento}`,
      duracao: `${efeito.ativo.duracaoTurnos} turnos`,
      condicao: null,
      fonte: 'runa',
      elemento: efeito.elemento,
    },
  ];
}

export function descreverRegrasRunas() {
  return [
    RUNAS_REGRA_SEM_ACO_RUNICO.descricao,
    RUNAS_REGRA_COM_ACO_RUNICO.descricao,
    RUNAS_COMBINACAO.descricao,
    RUNAS_ENCAIXE.descricao,
  ].join(' ');
}
