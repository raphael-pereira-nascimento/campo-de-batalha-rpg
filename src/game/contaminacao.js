// ═══════════════════════════════════════════════════════════════════════════════════════
// CONTAMINAÇÃO PANDEMÔNICA — condição própria da Prata Pandemônica
// Módulo puro: nenhum efeito colateral, nenhuma integração automática com o combate.
//
// A Contaminação NÃO é a Podridão do Tenebrium nem a Corrupção do Ruidium.
// Ela representa a contaminação profana descrita na ficha da Prata Pandemônica:
// dano progressivo, redução de cura, menor resistência a corrupção e efeitos mais
// intensos em seres sagrados e equipamentos de luz.
//
// A documentação não define uma tabela de estágios para esta condição. Por isso
// este módulo NÃO cria estágios: apenas registra as aplicações e os cálculos
// explicitamente documentados.
// ═══════════════════════════════════════════════════════════════════════════════════════

export const CONTAMINACAO_ID = 'contaminacaoPandemonica';
export const CONTAMINACAO_NOME = 'Contaminação Pandemônica';

// Efeitos gerais documentados para uma criatura contaminada.
export const CONTAMINACAO_EFEITOS = {
  danoProgressivo: true,
  reduzEfeitosDeCura: true,
  reduzResistenciaACorrupcao: true,
  maisIntensaEmSeresSagrados: true,
  maisIntensaEmEquipamentosDeLuz: true,
};

// Aplicações por categoria de equipamento. Cada entrada usa somente os números
// registrados na ficha da Prata Pandemônica.
export const CONTAMINACAO_APLICACOES = {
  contaminacaoProfana: {
    id: 'contaminacaoProfana',
    nome: 'Contaminação Profana',
    origem: 'armadura',
    chance: 20,
    duracao: 2,
    percentualDanoVidaMaxima: null,
    alvo: 'criaturas sagradas que atingirem diretamente a armadura',
    descricao: '20% de chance de contaminar criaturas sagradas por 2 turnos.',
  },
  feridaPandemica: {
    id: 'feridaPandemica',
    nome: 'Ferida Pandemônica',
    origem: 'armaLamina',
    chance: 25,
    duracao: 3,
    percentualDanoVidaMaxima: 10,
    alvo: 'adversário atingido',
    descricao: '25% de chance de provocar contaminação, causando 10% da vida máxima do adversário por turno durante 3 turnos.',
  },
  municaoContaminante: {
    id: 'municaoContaminante',
    nome: 'Munição Contaminante',
    origem: 'armaFogo',
    chance: 20,
    duracao: 3,
    percentualDanoVidaMaxima: null,
    alvo: 'adversário atingido',
    descricao: '20% de chance de aplicar contaminação por 3 turnos.',
  },
  nucleoPandemico: {
    id: 'nucleoPandemico',
    nome: 'Núcleo Pandemônico',
    origem: 'golem',
    chance: null,
    duracao: 2,
    percentualDanoVidaMaxima: null,
    reducaoPotenciaCuraProtecao: 25,
    alvo: 'inimigos próximos',
    descricao: 'Reduz em 25% a potência de cura e proteção dos inimigos próximos por 2 turnos.',
  },
  encantamentoLuz: {
    id: 'encantamentoLuz',
    nome: 'Perda de eficiência de encantamentos de luz',
    origem: 'equipamentoDeLuz',
    chance: 20,
    duracao: 2,
    percentualDanoVidaMaxima: null,
    alvo: 'encantamentos de luz em equipamentos atingidos',
    descricao: '20% de chance de perder temporariamente a eficiência por 2 turnos.',
  },
  // Efeito oficial da Prata Pandemônica em armas de impacto. Não é uma
  // contaminação de dano progressivo: interrompe cura/proteção sagrada.
  rupturaProfana: {
    id: 'rupturaProfana',
    nome: 'Ruptura Profana',
    origem: 'armaImpacto',
    chance: 30,
    duracao: 2,
    percentualDanoVidaMaxima: null,
    interrompeCuraProtecao: true,
    somenteCritico: true,
    alvo: 'habilidades de cura ou proteção sagrada',
    descricao: 'Acertos críticos têm 30% de chance de interromper habilidades de cura ou proteção sagrada por 2 turnos.',
  },
};

// Bônus documentados contra seres sagrados e equipamentos de luz.
export const CONTAMINACAO_CONTRA_SAGRADOS = {
  danoAdicionalSeresSagrados: 35,
  danoEstruturalEquipamentosDeLuz: 30,
  chancePerdaEficienciaEncantamentosDeLuz: 20,
  duracaoPerdaEficiencia: 2,
};

// Regra específica para equipamentos mágicos de luz feitos com Prata Pandemônica
// como material principal.
export const CONTAMINACAO_PRATA_PANDEMONICA_MAGIA = {
  potenciaMagiasCorrupcao: 30,
  perdaPotenciaMagiasLuz: 20,
};

function limitarPercentual(percentual) {
  const valor = Number(percentual);
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return valor;
}

function limitarTurnos(turnos) {
  const valor = Number(turnos);
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return Math.trunc(valor);
}

function limitarVidaMaxima(vidaMaxima) {
  const valor = Number(vidaMaxima);
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return valor;
}

export function getAplicacaoContaminacao(id) {
  return CONTAMINACAO_APLICACOES[id] || null;
}

// Status de combate a partir de uma aplicação oficial. A chance é convertida
// para fração (0–1), formato usado pelo motor de batalha.
export function criarStatusContaminacao(aplicacaoId) {
  const aplicacao = getAplicacaoContaminacao(aplicacaoId);
  if (!aplicacao) return null;
  return {
    tipo: CONTAMINACAO_ID,
    chance: aplicacao.chance != null ? aplicacao.chance / 100 : 1,
    turnos: aplicacao.duracao,
    danoPctVidaMaxima: aplicacao.percentualDanoVidaMaxima,
    reducaoPotenciaCuraProtecao: aplicacao.reducaoPotenciaCuraProtecao ?? null,
    interrompeCuraProtecao: aplicacao.interrompeCuraProtecao === true,
    somenteCritico: aplicacao.somenteCritico === true,
    origem: aplicacao.nome,
  };
}

// Contaminação Profana (armadura) e Núcleo Pandemônico (golem) são aplicações
// oficiais, mas dependem de gatilhos que o motor ainda não representa:
// - Contaminação Profana reage a criaturas sagradas que atingem a armadura;
// - Núcleo Pandemônico afeta inimigos próximos ao golem.
// As funções abaixo preparam a estrutura para uso manual/descritivo, sempre com
// `automatico: false`, sem conectar um comportamento que não foi definido.
export function criarEfeitoContaminacaoProfana() {
  const status = criarStatusContaminacao('contaminacaoProfana');
  if (!status) return null;
  return {
    ...status,
    aplicacaoId: 'contaminacaoProfana',
    nome: 'Contaminação Profana',
    automatico: false,
    gatilho: 'criatura sagrada atinge diretamente a armadura',
    alvo: CONTAMINACAO_APLICACOES.contaminacaoProfana.alvo,
    motivoPendente: 'Aplicação reativa de armadura ainda não conectada ao motor de combate.',
  };
}

export function criarEfeitoNucleoPandemico() {
  const status = criarStatusContaminacao('nucleoPandemico');
  if (!status) return null;
  return {
    ...status,
    aplicacaoId: 'nucleoPandemico',
    nome: 'Núcleo Pandemônico',
    automatico: false,
    gatilho: 'inimigos próximos do golem',
    alvo: CONTAMINACAO_APLICACOES.nucleoPandemico.alvo,
    motivoPendente: 'Efeito de área do golem ainda não conectado ao motor de combate.',
  };
}

// Dano por turno documentado para a contaminação (ex.: 10% da vida máxima).
// A função apenas aplica o percentual; não define arredondamento oficial.
export function calcularDanoContaminacao(vidaMaxima, percentualDanoVidaMaxima = 10) {
  const vida = limitarVidaMaxima(vidaMaxima);
  const percentual = limitarPercentual(percentualDanoVidaMaxima);
  return (vida * percentual) / 100;
}

// Cria o estado de uma contaminação a partir de uma aplicação documentada.
export function iniciarContaminacao(aplicacaoId, opcoes = {}) {
  const aplicacao = getAplicacaoContaminacao(aplicacaoId);
  if (!aplicacao) {
    return { ok: false, motivo: `Aplicação de contaminação desconhecida: ${aplicacaoId}.` };
  }

  let danoPorTurno = null;
  if (aplicacao.percentualDanoVidaMaxima != null) {
    if (opcoes.vidaMaxima == null) {
      return {
        ok: false,
        motivo: 'Informe a vida máxima para calcular o dano progressivo da contaminação.',
        aplicacao,
      };
    }
    danoPorTurno = calcularDanoContaminacao(
      opcoes.vidaMaxima,
      aplicacao.percentualDanoVidaMaxima,
    );
  }

  return {
    ok: true,
    aplicacao,
    estado: {
      id: CONTAMINACAO_ID,
      nome: CONTAMINACAO_NOME,
      aplicacaoId: aplicacao.id,
      turnosRestantes: limitarTurnos(aplicacao.duracao),
      danoPorTurno,
      percentualDanoVidaMaxima: aplicacao.percentualDanoVidaMaxima,
      reducaoPotenciaCuraProtecao: aplicacao.reducaoPotenciaCuraProtecao ?? null,
      alvo: aplicacao.alvo,
      ativa: limitarTurnos(aplicacao.duracao) > 0,
    },
  };
}

// Processa um turno da contaminação: devolve o dano do turno e o novo estado.
export function processarTurnoContaminacao(estadoOuAplicacao) {
  const estado = typeof estadoOuAplicacao === 'object' && estadoOuAplicacao !== null
    && estadoOuAplicacao.turnosRestantes != null
    ? estadoOuAplicacao
    : null;

  if (!estado) {
    return { ok: false, motivo: 'Estado de contaminação inválido.' };
  }

  if (!estado.ativa || estado.turnosRestantes <= 0) {
    return {
      ok: true,
      dano: 0,
      estado: { ...estado, turnosRestantes: 0, ativa: false },
      encerrada: true,
    };
  }

  const turnosRestantes = estado.turnosRestantes - 1;
  return {
    ok: true,
    dano: estado.danoPorTurno ?? 0,
    estado: {
      ...estado,
      turnosRestantes,
      ativa: turnosRestantes > 0,
    },
    encerrada: turnosRestantes <= 0,
  };
}

// Redução de cura/proteção documentada (ex.: Núcleo Pandemônico, 25% por 2 turnos).
export function reduzirPotenciaCura(valor, percentual = 25) {
  const base = Number(valor);
  if (!Number.isFinite(base)) return 0;
  const reducao = limitarPercentual(percentual);
  return base * (1 - reducao / 100);
}

// Resistência menor contra magias de corrupção: a documentação não define um
// percentual. A função devolve a descrição, sem inventar número.
export function descreverResistenciaACorrupcao() {
  return 'A contaminação reduz a resistência do alvo contra magias de corrupção; a documentação não define percentual.';
}

export function descreverContaminacao(estadoOuAplicacao) {
  let aplicacao = null;

  if (typeof estadoOuAplicacao === 'string') {
    aplicacao = getAplicacaoContaminacao(estadoOuAplicacao);
  } else if (estadoOuAplicacao) {
    aplicacao = estadoOuAplicacao.aplicacao
      || getAplicacaoContaminacao(estadoOuAplicacao.aplicacaoId)
      || null;
  }

  if (!aplicacao) return CONTAMINACAO_NOME;
  return `${CONTAMINACAO_NOME} — ${aplicacao.nome}: ${aplicacao.descricao}`;
}
