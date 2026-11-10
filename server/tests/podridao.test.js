import { describe, it, expect } from 'vitest';
import {
  PODRIDAO_ESTAGIOS,
  PODRIDAO_TRATAMENTOS,
  PODRIDAO_ARMA,
  getEstagioPodridao,
  getEstagioPorTurnos,
  calcularEstadoPodridao,
  avancarTurnoPodridao,
  tratarPodridao,
  rolarPodridaoArma,
  descreverEstagio,
} from '../../src/game/podridao.js';

describe('Podridão — estágios', () => {
  it('tem cinco estágios com a progressão aprovada', () => {
    expect(PODRIDAO_ESTAGIOS).toHaveLength(5);
    expect(PODRIDAO_ESTAGIOS.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
    expect(PODRIDAO_ESTAGIOS.map((e) => e.nome)).toEqual([
      'Inicial', 'Leve', 'Moderado', 'Grave', 'Crítico',
    ]);
  });

  it('atinge o estágio máximo em 10 turnos acumulados', () => {
    expect(getEstagioPorTurnos(0).id).toBe(1);
    expect(getEstagioPorTurnos(1).id).toBe(1);
    expect(getEstagioPorTurnos(2).id).toBe(2);
    expect(getEstagioPorTurnos(4).id).toBe(2);
    expect(getEstagioPorTurnos(5).id).toBe(3);
    expect(getEstagioPorTurnos(7).id).toBe(3);
    expect(getEstagioPorTurnos(8).id).toBe(4);
    expect(getEstagioPorTurnos(9).id).toBe(4);
    expect(getEstagioPorTurnos(10).id).toBe(5);
    expect(getEstagioPorTurnos(999).id).toBe(5);
  });

  it('busca estágio por id e trata ids inválidos', () => {
    expect(getEstagioPodridao(3).nome).toBe('Moderado');
    expect(getEstagioPodridao('5').id).toBe(5);
    expect(getEstagioPodridao(0)).toBeNull();
    expect(getEstagioPodridao('x')).toBeNull();
  });
});

describe('Podridão — cálculo sobre a vida máxima original', () => {
  it('reduz a vida máxima e calcula o dano por turno em cada estágio', () => {
    const esperado = [
      { turnos: 0, percentual: 5, reducao: 50, maxima: 950, dano: 50 },
      { turnos: 2, percentual: 15, reducao: 150, maxima: 850, dano: 100 },
      { turnos: 5, percentual: 25, reducao: 250, maxima: 750, dano: 150 },
      { turnos: 8, percentual: 35, reducao: 350, maxima: 650, dano: 200 },
      { turnos: 10, percentual: 45, reducao: 450, maxima: 550, dano: 250 },
    ];

    for (const caso of esperado) {
      const estado = calcularEstadoPodridao({
        vidaMaximaOriginal: 1000,
        turnosAcumulados: caso.turnos,
      });
      expect(estado.ok, `turnos ${caso.turnos}`).toBe(true);
      expect(estado.reducaoVidaMaxima, `percentual ${caso.turnos}`).toBe(caso.percentual);
      expect(estado.vidaMaximaOriginal - estado.vidaMaximaReduzida, `redução ${caso.turnos}`).toBe(caso.reducao);
      expect(estado.vidaMaximaReduzida, `máxima ${caso.turnos}`).toBe(caso.maxima);
      expect(estado.danoPorTurnoValor, `dano ${caso.turnos}`).toBe(caso.dano);
    }
  });

  it('calcula sempre sobre a vida máxima original, não sobre a reduzida', () => {
    const estado = calcularEstadoPodridao({ vidaMaximaOriginal: 1000, turnosAcumulados: 10 });
    // 20% de 1000 (original), e não 20% de 550 (reduzida).
    expect(estado.danoPorTurnoValor).toBe(250);
    expect(estado.vidaMaximaOriginal).toBe(1000);
    expect(estado.vidaMaximaReduzida).toBe(550);
  });

  it('arredonda o percentual para o inteiro mais próximo', () => {
    const estado = calcularEstadoPodridao({ vidaMaximaOriginal: 999, turnosAcumulados: 1 });
    expect(estado.estagio.id).toBe(1);
    expect(estado.reducaoVidaMaxima).toBe(5); // percentual do estágio
    expect(estado.vidaMaximaOriginal - estado.vidaMaximaReduzida).toBe(50); // 49,95
    expect(estado.danoPorTurnoValor).toBe(50); // 49,95
  });

  it('não deixa a vida máxima reduzida chegar a zero', () => {
    const estado = calcularEstadoPodridao({ vidaMaximaOriginal: 1, turnosAcumulados: 10 });
    expect(estado.vidaMaximaReduzida).toBe(1);
  });

  it('rejeita vida máxima inválida', () => {
    expect(calcularEstadoPodridao({ vidaMaximaOriginal: 0 }).ok).toBe(false);
    expect(calcularEstadoPodridao({ vidaMaximaOriginal: -10 }).ok).toBe(false);
    expect(calcularEstadoPodridao({}).ok).toBe(false);
  });
});

describe('Podridão — avanço de turnos', () => {
  it('avança um turno exposto e aplica o dano do novo estágio', () => {
    const inicial = calcularEstadoPodridao({ vidaMaximaOriginal: 1000, vidaAtual: 1000 });
    const turno1 = avancarTurnoPodridao(inicial);

    expect(turno1.turnosAcumulados).toBe(1);
    expect(turno1.estagio.id).toBe(1);
    expect(turno1.danoAplicado).toBe(50);
    expect(turno1.vidaAtual).toBe(900);
    expect(turno1.mudouEstagio).toBe(false);
  });

  it('muda de estágio no limiar de 2 turnos e usa o dano novo', () => {
    const estado = calcularEstadoPodridao({
      vidaMaximaOriginal: 1000,
      vidaAtual: 950,
      turnosAcumulados: 1,
    });
    const turno2 = avancarTurnoPodridao(estado);

    expect(turno2.turnosAcumulados).toBe(2);
    expect(turno2.estagio.id).toBe(2);
    expect(turno2.danoAplicado).toBe(100);
    expect(turno2.vidaAtual).toBe(850);
    expect(turno2.mudouEstagio).toBe(true);
  });

  it('sofre o dano mesmo sem acumular novo tempo de exposição', () => {
    const estado = calcularEstadoPodridao({
      vidaMaximaOriginal: 1000,
      vidaAtual: 500,
      turnosAcumulados: 5,
    });
    const turno = avancarTurnoPodridao(estado, { exposto: false });

    expect(turno.turnosAcumulados).toBe(5);
    expect(turno.estagio.id).toBe(3);
    expect(turno.danoAplicado).toBe(150);
    expect(turno.vidaAtual).toBe(350);
  });

  it('não deixa a vida atual ficar negativa', () => {
    const estado = calcularEstadoPodridao({
      vidaMaximaOriginal: 1000,
      vidaAtual: 10,
      turnosAcumulados: 10,
    });
    const turno = avancarTurnoPodridao(estado);
    expect(turno.vidaAtual).toBe(0);
  });

  it('rejeita estado inválido', () => {
    expect(avancarTurnoPodridao(null).ok).toBe(false);
    expect(avancarTurnoPodridao({ ok: false }).ok).toBe(false);
  });
});

describe('Podridão — tratamentos', () => {
  const estagio = (turnos) => calcularEstadoPodridao({
    vidaMaximaOriginal: 1000,
    vidaAtual: 600,
    turnosAcumulados: turnos,
  });

  it('o tratamento básico cobre os estágios I e II', () => {
    expect(PODRIDAO_TRATAMENTOS.basico.estagiosTratados).toEqual([1, 2]);
    const resultado = tratarPodridao(estagio(2), 'basico');
    expect(resultado.ok).toBe(true);
    expect(resultado.estado.tratado).toBe(true);
    expect(resultado.estado.vidaMaximaReduzida).toBe(1000);
    expect(resultado.estado.danoPorTurnoValor).toBe(0);
    expect(resultado.vidaMaximaRestaurada).toBe(150);
  });

  it('o tratamento básico não trata o estágio III', () => {
    const resultado = tratarPodridao(estagio(5), 'basico');
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toContain('não trata o estágio 3');
  });

  it('o tratamento avançado cobre até o estágio III', () => {
    expect(PODRIDAO_TRATAMENTOS.avancado.estagiosTratados).toEqual([1, 2, 3]);
    expect(tratarPodridao(estagio(5), 'avancado').ok).toBe(true);
    expect(tratarPodridao(estagio(8), 'avancado').ok).toBe(false);
  });

  it('o tratamento especializado cobre os estágios IV e V', () => {
    expect(PODRIDAO_TRATAMENTOS.especializado.estagiosTratados).toEqual([4, 5]);
    expect(tratarPodridao(estagio(8), 'especializado').ok).toBe(true);
    expect(tratarPodridao(estagio(10), 'especializado').ok).toBe(true);
    expect(tratarPodridao(estagio(2), 'especializado').ok).toBe(false);
  });

  it('restaura a vida máxima original ao tratar', () => {
    const resultado = tratarPodridao(estagio(10), 'especializado');
    expect(resultado.estado.vidaMaximaReduzida).toBe(1000);
    expect(resultado.vidaMaximaRestaurada).toBe(450);
  });

  it('é idempotente: tratar duas vezes não restaura vida a mais', () => {
    const primeira = tratarPodridao(estagio(10), 'especializado');
    const segunda = tratarPodridao(primeira.estado, 'especializado');
    expect(segunda.ok).toBe(true);
    expect(segunda.estado.vidaMaximaReduzida).toBe(1000);
    expect(segunda.motivo).toContain('já foi tratada');
  });

  it('rejeita tratamento desconhecido e estado inválido', () => {
    expect(tratarPodridao(estagio(1), 'inexistente').ok).toBe(false);
    expect(tratarPodridao(null, 'basico').ok).toBe(false);
  });

  it('estado tratado não sofre dano nem progride', () => {
    const curado = tratarPodridao(estagio(2), 'basico').estado;
    const turno = avancarTurnoPodridao(curado, { exposto: true });
    expect(turno.danoAplicado).toBe(0);
    expect(turno.turnosAcumulados).toBe(0);
  });
});

describe('Podridão — efeito das armas (documento oficial)', () => {
  it('usa 20% da vida máxima por turno durante 3 turnos', () => {
    expect(PODRIDAO_ARMA.danoPorTurnoPct).toBe(20);
    expect(PODRIDAO_ARMA.turnos).toBe(3);
  });

  it('usa 15% de chance em lâminas e 25% em equipamentos mágicos', () => {
    expect(PODRIDAO_ARMA.chance).toBeCloseTo(0.15);
    expect(PODRIDAO_ARMA.chanceEquipamentoMagico).toBeCloseTo(0.25);
  });

  it('rola a aplicação com chance determinística', () => {
    expect(rolarPodridaoArma({ aleatorio: () => 0.14 })).toBe(true);
    expect(rolarPodridaoArma({ aleatorio: () => 0.15 })).toBe(false);
    expect(rolarPodridaoArma({ magico: true, aleatorio: () => 0.24 })).toBe(true);
    expect(rolarPodridaoArma({ magico: true, aleatorio: () => 0.25 })).toBe(false);
  });

  it('descreve o estágio em texto legível', () => {
    const estado = calcularEstadoPodridao({ vidaMaximaOriginal: 1000, turnosAcumulados: 10 });
    const texto = descreverEstagio(estado);
    expect(texto).toContain('Estágio 5');
    expect(texto).toContain('Crítico');
    expect(texto).toContain('45%');
    expect(texto).toContain('25%');
    expect(descreverEstagio(null)).toContain('inválido');
  });
});
