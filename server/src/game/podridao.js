// ═══════════════════════════════════════════════════════════════════════════════════════
// PODRIDÃO DO TENEBRIUM — regras aprovadas
// Módulo puro: nenhum efeito colateral, nenhuma integração automática com o combate.
// Os valores abaixo foram copiados da documentação oficial e não devem ser alterados
// sem autorização do criador do RPG.
// ═══════════════════════════════════════════════════════════════════════════════════════

// Estágios oficiais. Todos os percentuais são calculados sobre a VIDA MÁXIMA ORIGINAL,
// nunca sobre a vida máxima já reduzida.
export const PODRIDAO_ESTAGIOS = [
  {
    id: 1,
    nome: 'Inicial',
    reducaoVidaMaxima: 5,
    danoPorTurno: 5,
    turnosAcumulados: 0,
    turnosAdicionais: 0,
  },
  {
    id: 2,
    nome: 'Leve',
    reducaoVidaMaxima: 15,
    danoPorTurno: 10,
    turnosAcumulados: 2,
    turnosAdicionais: 2,
  },
  {
    id: 3,
    nome: 'Moderado',
    reducaoVidaMaxima: 25,
    danoPorTurno: 15,
    turnosAcumulados: 5,
    turnosAdicionais: 3,
  },
  {
    id: 4,
    nome: 'Grave',
    reducaoVidaMaxima: 35,
    danoPorTurno: 20,
    turnosAcumulados: 8,
    turnosAdicionais: 3,
  },
  {
    id: 5,
    nome: 'Crítico',
    reducaoVidaMaxima: 45,
    danoPorTurno: 25,
    turnosAcumulados: 10,
    turnosAdicionais: 2,
  },
];

// Tratamentos oficiais.
export const PODRIDAO_TRATAMENTOS = {
  basico: {
    id: 'basico',
    nome: 'Tratamento básico',
    estagiosTratados: [1, 2],
    descricao: 'Trata os estágios I e II.',
  },
  avancado: {
    id: 'avancado',
    nome: 'Tratamento avançado',
    estagiosTratados: [1, 2, 3],
    descricao: 'Trata até o estágio III.',
  },
  especializado: {
    id: 'especializado',
    nome: 'Tratamento especializado',
    estagiosTratados: [4, 5],
    descricao: 'Trata os estágios IV e V.',
  },
};

// Efeito de Podridão aplicado por armas de Tenebrium (documentado no PDF).
// É uma mecânica DIFERENTE da exposição: dano por turno durante poucos turnos.
export const PODRIDAO_ARMA = {
  danoPorTurnoPct: 20,
  turnos: 3,
  chance: 0.15,
  chanceEquipamentoMagico: 0.25,
};

// Arredondamento usado para converter percentual em pontos de vida.
// Registrado como provisório em PENDENCIAS.md: a documentação define o percentual,
// mas não define o arredondamento.
export function arredondarVida(valor) {
  return Math.round(valor);
}

export function getEstagioPodridao(estagioId) {
  return PODRIDAO_ESTAGIOS.find((estagio) => estagio.id === Number(estagioId)) || null;
}

// Vida atual nunca fica negativa nem passa do máximo informado.
// Zero é um valor válido (personagem caído) e não pode virar "vida cheia".
function limitarVidaAtual(vidaAtual, vidaMaxima) {
  if (vidaAtual == null) return vidaMaxima;
  const valor = Number(vidaAtual);
  if (!Number.isFinite(valor)) return vidaMaxima;
  return Math.max(0, Math.min(valor, vidaMaxima));
}

export function getEstagioPorTurnos(turnosAcumulados) {
  const turnos = Math.max(0, Number(turnosAcumulados) || 0);
  let atual = PODRIDAO_ESTAGIOS[0];
  for (const estagio of PODRIDAO_ESTAGIOS) {
    if (turnos >= estagio.turnosAcumulados) atual = estagio;
  }
  return atual;
}

// Calcula o estado da Podridão a partir do tempo acumulado de exposição.
// `tratado` interrompe a progressão: o estado volta a saudável e a vida máxima perdida
// é recuperada.
export function calcularEstadoPodridao({
  vidaMaximaOriginal,
  vidaAtual = null,
  turnosAcumulados = 0,
  tratado = false,
} = {}) {
  const vidaMax = Number(vidaMaximaOriginal);
  if (!Number.isFinite(vidaMax) || vidaMax <= 0) {
    return { ok: false, motivo: 'Vida máxima original inválida.' };
  }

  if (tratado) {
    return {
      ok: true,
      tratado: true,
      estagio: null,
      turnosAcumulados: 0,
      reducaoVidaMaxima: 0,
      vidaMaximaOriginal: vidaMax,
      vidaMaximaReduzida: vidaMax,
      danoPorTurno: 0,
      danoPorTurnoValor: 0,
      vidaAtual: limitarVidaAtual(vidaAtual, vidaMax),
    };
  }

  const estagio = getEstagioPorTurnos(turnosAcumulados);
  const reducao = arredondarVida((vidaMax * estagio.reducaoVidaMaxima) / 100);
  const dano = arredondarVida((vidaMax * estagio.danoPorTurno) / 100);
  const vidaMaximaReduzida = Math.max(1, vidaMax - reducao);

  return {
    ok: true,
    tratado: false,
    estagio,
    turnosAcumulados: Math.max(0, Number(turnosAcumulados) || 0),
    reducaoVidaMaxima: estagio.reducaoVidaMaxima,
    vidaMaximaOriginal: vidaMax,
    vidaMaximaReduzida,
    danoPorTurno: estagio.danoPorTurno,
    danoPorTurnoValor: dano,
    vidaAtual: limitarVidaAtual(vidaAtual, vidaMaximaReduzida),
  };
}

// Avança um turno de exposição. Afastar-se do material NÃO reinicia o tempo acumulado:
// passe `exposto: false` para apenas sofrer o dano do turno sem acumular tempo novo.
export function avancarTurnoPodridao(estado, { exposto = true } = {}) {
  if (!estado || estado.ok !== true) {
    return { ok: false, motivo: 'Estado de Podridão inválido.' };
  }
  if (estado.tratado) {
    return { ...estado, danoAplicado: 0 };
  }

  const turnos = estado.turnosAcumulados + (exposto ? 1 : 0);
  const proximo = calcularEstadoPodridao({
    vidaMaximaOriginal: estado.vidaMaximaOriginal,
    vidaAtual: estado.vidaAtual,
    turnosAcumulados: turnos,
  });

  const vidaAtual = Math.max(0, (estado.vidaAtual || 0) - proximo.danoPorTurnoValor);

  return {
    ...proximo,
    vidaAtual,
    danoAplicado: proximo.danoPorTurnoValor,
    mudouEstagio: proximo.estagio?.id !== estado.estagio?.id,
  };
}

// Aplica o tratamento. O estágio precisa estar coberto pelo tratamento escolhido.
export function tratarPodridao(estado, tipoTratamento) {
  const tratamento = PODRIDAO_TRATAMENTOS[tipoTratamento];
  if (!tratamento) {
    return { ok: false, motivo: `Tratamento desconhecido: ${tipoTratamento}.` };
  }
  if (!estado || estado.ok !== true) {
    return { ok: false, motivo: 'Estado de Podridão inválido.' };
  }
  if (estado.tratado) {
    return { ok: true, estado, motivo: 'A Podridão já foi tratada.' };
  }

  const estagioId = estado.estagio?.id;
  if (!tratamento.estagiosTratados.includes(estagioId)) {
    return {
      ok: false,
      motivo: `${tratamento.nome} não trata o estágio ${estagioId}.`,
      tratamento,
      estagioAtual: estado.estagio,
    };
  }

  const curado = calcularEstadoPodridao({
    vidaMaximaOriginal: estado.vidaMaximaOriginal,
    vidaAtual: estado.vidaAtual,
    tratado: true,
  });

  return {
    ok: true,
    tratamento,
    vidaMaximaRestaurada: estado.vidaMaximaOriginal - estado.vidaMaximaReduzida,
    estado: curado,
  };
}

// Rolagem de aplicação de Podridão por arma (regra separada da exposição).
export function rolarPodridaoArma({ magico = false, aleatorio = Math.random } = {}) {
  const chance = magico ? PODRIDAO_ARMA.chanceEquipamentoMagico : PODRIDAO_ARMA.chance;
  return Number(aleatorio()) < chance;
}

// Status de combate da Podridão de arma. `chance` e `turnos` podem vir do
// efeito documentado do material; o dano é SEMPRE 20% da vida máxima original.
export function criarStatusPodridaoArma({ magico = false, chance = null, turnos = null } = {}) {
  const chanceFinal = Number.isFinite(Number(chance))
    ? Number(chance)
    : (magico ? PODRIDAO_ARMA.chanceEquipamentoMagico : PODRIDAO_ARMA.chance);
  const turnosFinal = Number(turnos) > 0 ? Math.trunc(Number(turnos)) : PODRIDAO_ARMA.turnos;
  return {
    tipo: 'podridao',
    chance: chanceFinal > 1 ? chanceFinal / 100 : chanceFinal,
    turnos: turnosFinal,
    danoPctVidaMaxima: PODRIDAO_ARMA.danoPorTurnoPct,
    origem: 'Tenebrium',
  };
}

export function descreverEstagio(estado) {
  if (!estado || estado.ok !== true) return 'Estado de Podridão inválido.';
  if (estado.tratado) return 'Podridão tratada: sem redução de vida máxima e sem dano contínuo.';
  return `Estágio ${estado.estagio.id} — ${estado.estagio.nome}: `
    + `-${estado.reducaoVidaMaxima}% de vida máxima e ${estado.danoPorTurno}% de dano por turno `
    + `(${estado.danoPorTurnoValor} pontos sobre ${estado.vidaMaximaOriginal} de vida original).`;
}
