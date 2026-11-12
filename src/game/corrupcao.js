// ═══════════════════════════════════════════════════════════════════════════════════════
// CORRUPÇÃO DO RUIDIUM — regras aprovadas
// Módulo puro: nenhum efeito colateral, nenhuma integração automática com o combate.
// Os valores abaixo foram copiados do complemento do catálogo e não devem ser alterados
// sem autorização do criador do RPG.
//
// A Corrupção é uma condição de personagem (0 a 100 pontos). Ela progride por estágios
// e NÃO é um bônus permanente de fabricação de equipamento: a potência mágica adicional
// é consequência do estágio atual.
// ═══════════════════════════════════════════════════════════════════════════════════════

export const CORRUPCAO_MIN = 0;
export const CORRUPCAO_MAX = 100;

// Estágios oficiais. `pontosMax` é inclusivo; o estágio final (Consumido) fica em 100.
export const CORRUPCAO_ESTAGIOS = [
  {
    id: 1,
    nome: 'Normal',
    pontosMin: 0,
    pontosMax: 19,
    penalidades: {},
    chanceEfeito: 0,
    efeito: 'Sem penalidades.',
    potenciaMagica: 0,
  },
  {
    id: 2,
    nome: 'Influenciado',
    pontosMin: 20,
    pontosMax: 39,
    penalidades: { reflexo: 5 },
    chanceEfeito: 0,
    efeito: 'Sussurros, vozes e pequenas ilusões.',
    potenciaMagica: 5,
  },
  {
    id: 3,
    nome: 'Perturbado',
    pontosMin: 40,
    pontosMax: 59,
    penalidades: { reflexo: 10, inteligencia: 5 },
    chanceEfeito: 10,
    efeito: '10% de chance de confundir uma ilusão com uma ameaça real.',
    potenciaMagica: 10,
  },
  {
    id: 4,
    nome: 'Corrompido',
    pontosMin: 60,
    pontosMax: 79,
    penalidades: { reflexo: 15, inteligencia: 10 },
    chanceEfeito: 15,
    efeito: '15% de chance de perder concentração em uma habilidade.',
    potenciaMagica: 15,
  },
  {
    id: 5,
    nome: 'Dominado',
    pontosMin: 80,
    pontosMax: 99,
    penalidades: { reflexo: 20, inteligencia: 15 },
    chanceEfeito: 20,
    efeito: '20% de chance de perder o controle de uma ação em combate.',
    potenciaMagica: 25,
  },
  {
    id: 6,
    nome: 'Consumido',
    pontosMin: 100,
    pontosMax: 100,
    penalidades: { reflexo: 20, inteligencia: 15 },
    chanceEfeito: 100,
    efeito: 'Perde o controle das ações; o mestre assume temporariamente o personagem.',
    potenciaMagica: null,
    potenciaMagicaDescricao: 'Poder extremo, mas sem controle consciente.',
    observacao: 'Consumido não significa morte automática.',
  },
];

// Ganho de Corrupção por ação ou exposição.
export const CORRUPCAO_GANHOS = {
  usarHabilidadeRuidium: {
    id: 'usarHabilidadeRuidium',
    nome: 'Utilizar habilidade especial de Ruidium',
    pontos: 1,
  },
  sofrerMagiaControleMental: {
    id: 'sofrerMagiaControleMental',
    nome: 'Sofrer magia de controle mental',
    pontos: 2,
  },
  forcarHabilidadeAlemLimite: {
    id: 'forcarHabilidadeAlemLimite',
    nome: 'Forçar habilidade de Ruidium além do limite',
    pontos: 3,
  },
  sofrerDescargaEnergiaRuidium: {
    id: 'sofrerDescargaEnergiaRuidium',
    nome: 'Sofrer descarga de energia de Ruidium',
    pontos: 2,
  },
  utilizarEquipamentoCorrompido: {
    id: 'utilizarEquipamentoCorrompido',
    nome: 'Utilizar equipamento já corrompido',
    pontos: 1,
  },
};

// Recuperação de Corrupção.
export const CORRUPCAO_RECUPERACOES = {
  descansoProlongado: {
    id: 'descansoProlongado',
    nome: 'Descanso prolongado',
    reducao: 5,
  },
  magiaPurificacao: {
    id: 'magiaPurificacao',
    nome: 'Magia de purificação',
    reducao: 15,
  },
  ritualEspiritual: {
    id: 'ritualEspiritual',
    nome: 'Ritual espiritual especializado',
    reducao: 'total',
  },
};

function limitarPontos(pontos) {
  const valor = Number(pontos);
  if (!Number.isFinite(valor)) return CORRUPCAO_MIN;
  return Math.max(CORRUPCAO_MIN, Math.min(Math.trunc(valor), CORRUPCAO_MAX));
}

export function getEstagioCorrupcao(pontos) {
  const valor = limitarPontos(pontos);
  return CORRUPCAO_ESTAGIOS.find(
    (estagio) => valor >= estagio.pontosMin && valor <= estagio.pontosMax,
  ) || CORRUPCAO_ESTAGIOS[0];
}

// Calcula o estado atual da Corrupção a partir da pontuação.
export function calcularEstadoCorrupcao(pontos = 0) {
  const valor = limitarPontos(pontos);
  const estagio = getEstagioCorrupcao(valor);

  return {
    ok: true,
    pontos: valor,
    estagio,
    penalidades: { ...estagio.penalidades },
    chanceEfeito: estagio.chanceEfeito,
    efeito: estagio.efeito,
    potenciaMagica: estagio.potenciaMagica,
    potenciaMagicaDescricao: estagio.potenciaMagicaDescricao || null,
    consumido: estagio.nome === 'Consumido',
  };
}

// Adiciona Corrupção. Aceita a chave do motivo (`motivo`) ou uma quantidade explícita.
export function adicionarCorrupcao(estadoOuPontos, motivoOuPontos = 'usarHabilidadeRuidium') {
  const pontosAtuais = typeof estadoOuPontos === 'object' && estadoOuPontos !== null
    ? estadoOuPontos.pontos
    : estadoOuPontos;

  let ganho;
  if (typeof motivoOuPontos === 'number') {
    ganho = motivoOuPontos;
  } else {
    const motivo = CORRUPCAO_GANHOS[motivoOuPontos];
    if (!motivo) {
      return { ok: false, motivo: `Motivo de Corrupção desconhecido: ${motivoOuPontos}.` };
    }
    ganho = motivo.pontos;
  }

  const anterior = calcularEstadoCorrupcao(pontosAtuais);
  const novo = calcularEstadoCorrupcao(anterior.pontos + ganho);

  return {
    ok: true,
    ganho,
    pontosAnteriores: anterior.pontos,
    pontos: novo.pontos,
    estagioAnterior: anterior.estagio,
    estagio: novo.estagio,
    mudouEstagio: novo.estagio.id !== anterior.estagio.id,
    estado: novo,
  };
}

// Remove Corrupção por um dos métodos aprovados.
export function recuperarCorrupcao(estadoOuPontos, metodo) {
  const recuperacao = CORRUPCAO_RECUPERACOES[metodo];
  if (!recuperacao) {
    return { ok: false, motivo: `Método de recuperação desconhecido: ${metodo}.` };
  }

  const pontosAtuais = typeof estadoOuPontos === 'object' && estadoOuPontos !== null
    ? estadoOuPontos.pontos
    : estadoOuPontos;
  const anterior = calcularEstadoCorrupcao(pontosAtuais);

  const pontos = recuperacao.reducao === 'total'
    ? CORRUPCAO_MIN
    : Math.max(CORRUPCAO_MIN, anterior.pontos - recuperacao.reducao);
  const novo = calcularEstadoCorrupcao(pontos);

  return {
    ok: true,
    recuperacao,
    pontosAnteriores: anterior.pontos,
    pontos: novo.pontos,
    estagioAnterior: anterior.estagio,
    estagio: novo.estagio,
    mudouEstagio: novo.estagio.id !== anterior.estagio.id,
    estado: novo,
  };
}

export function descreverEstagioCorrupcao(estadoOuPontos) {
  const estado = typeof estadoOuPontos === 'object' && estadoOuPontos !== null && estadoOuPontos.estagio
    ? estadoOuPontos
    : calcularEstadoCorrupcao(estadoOuPontos);

  const partes = [`${estado.estagio.nome} (${estado.pontos}/100)`];
  const penalidades = Object.entries(estado.penalidades || {});
  if (penalidades.length) {
    partes.push(penalidades.map(([atributo, valor]) => `-${valor}% ${atributo}`).join(', '));
  }
  if (estado.potenciaMagica != null) {
    partes.push(`+${estado.potenciaMagica}% de potência mágica`);
  } else if (estado.potenciaMagicaDescricao) {
    partes.push(estado.potenciaMagicaDescricao);
  }
  if (estado.efeito) partes.push(estado.efeito);

  return partes.join(' — ');
}
