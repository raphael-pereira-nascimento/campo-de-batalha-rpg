import { describe, it, expect } from 'vitest';
import {
  CORRUPCAO_ESTAGIOS,
  CORRUPCAO_GANHOS,
  CORRUPCAO_RECUPERACOES,
  CORRUPCAO_MAX,
  getEstagioCorrupcao,
  calcularEstadoCorrupcao,
  adicionarCorrupcao,
  recuperarCorrupcao,
  descreverEstagioCorrupcao,
} from '../../src/game/corrupcao.js';

describe('Corrupção do Ruidium — estágios', () => {
  it('tem os seis estágios aprovados', () => {
    expect(CORRUPCAO_ESTAGIOS.map((e) => e.nome)).toEqual([
      'Normal', 'Influenciado', 'Perturbado', 'Corrompido', 'Dominado', 'Consumido',
    ]);
  });

  it('respeita as faixas de pontos', () => {
    expect(getEstagioCorrupcao(0).nome).toBe('Normal');
    expect(getEstagioCorrupcao(19).nome).toBe('Normal');
    expect(getEstagioCorrupcao(20).nome).toBe('Influenciado');
    expect(getEstagioCorrupcao(39).nome).toBe('Influenciado');
    expect(getEstagioCorrupcao(40).nome).toBe('Perturbado');
    expect(getEstagioCorrupcao(59).nome).toBe('Perturbado');
    expect(getEstagioCorrupcao(60).nome).toBe('Corrompido');
    expect(getEstagioCorrupcao(79).nome).toBe('Corrompido');
    expect(getEstagioCorrupcao(80).nome).toBe('Dominado');
    expect(getEstagioCorrupcao(99).nome).toBe('Dominado');
    expect(getEstagioCorrupcao(100).nome).toBe('Consumido');
  });

  it('limita a pontuação entre 0 e 100', () => {
    expect(calcularEstadoCorrupcao(-10).pontos).toBe(0);
    expect(calcularEstadoCorrupcao(150).pontos).toBe(CORRUPCAO_MAX);
    expect(calcularEstadoCorrupcao('abc').pontos).toBe(0);
  });

  it('aplica as penalidades por estágio', () => {
    expect(calcularEstadoCorrupcao(20).penalidades).toEqual({ reflexo: 5 });
    expect(calcularEstadoCorrupcao(40).penalidades).toEqual({ reflexo: 10, inteligencia: 5 });
    expect(calcularEstadoCorrupcao(60).penalidades).toEqual({ reflexo: 15, inteligencia: 10 });
    expect(calcularEstadoCorrupcao(80).penalidades).toEqual({ reflexo: 20, inteligencia: 15 });
  });

  it('aplica as chances de efeito por estágio', () => {
    expect(calcularEstadoCorrupcao(39).chanceEfeito).toBe(0);
    expect(calcularEstadoCorrupcao(40).chanceEfeito).toBe(10);
    expect(calcularEstadoCorrupcao(60).chanceEfeito).toBe(15);
    expect(calcularEstadoCorrupcao(80).chanceEfeito).toBe(20);
  });

  it('aplica a potência mágica adicional', () => {
    expect(calcularEstadoCorrupcao(0).potenciaMagica).toBe(0);
    expect(calcularEstadoCorrupcao(20).potenciaMagica).toBe(5);
    expect(calcularEstadoCorrupcao(40).potenciaMagica).toBe(10);
    expect(calcularEstadoCorrupcao(60).potenciaMagica).toBe(15);
    expect(calcularEstadoCorrupcao(80).potenciaMagica).toBe(25);
    expect(calcularEstadoCorrupcao(100).potenciaMagica).toBeNull();
  });

  it('marca o estado consumido sem tratar como morte', () => {
    const consumido = calcularEstadoCorrupcao(100);
    expect(consumido.consumido).toBe(true);
    expect(consumido.efeito).toContain('mestre assume');
    expect(consumido.estagio.observacao).toContain('não significa morte');
  });
});

describe('Corrupção do Ruidium — ganhos', () => {
  it('usa os valores aprovados por ação', () => {
    expect(CORRUPCAO_GANHOS.usarHabilidadeRuidium.pontos).toBe(1);
    expect(CORRUPCAO_GANHOS.sofrerMagiaControleMental.pontos).toBe(2);
    expect(CORRUPCAO_GANHOS.forcarHabilidadeAlemLimite.pontos).toBe(3);
    expect(CORRUPCAO_GANHOS.sofrerDescargaEnergiaRuidium.pontos).toBe(2);
    expect(CORRUPCAO_GANHOS.utilizarEquipamentoCorrompido.pontos).toBe(1);
  });

  it('progride pelos estágios sem salto automático', () => {
    const resultado = adicionarCorrupcao(19, 'usarHabilidadeRuidium');
    expect(resultado.pontos).toBe(20);
    expect(resultado.mudouEstagio).toBe(true);
    expect(resultado.estagio.nome).toBe('Influenciado');
  });

  it('não passa de 100 ao ganhar Corrupção', () => {
    const resultado = adicionarCorrupcao(99, 'forcarHabilidadeAlemLimite');
    expect(resultado.pontos).toBe(100);
    expect(resultado.estagio.nome).toBe('Consumido');
  });

  it('rejeita motivo desconhecido', () => {
    const resultado = adicionarCorrupcao(10, 'motivoInexistente');
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toContain('desconhecido');
  });
});

describe('Corrupção do Ruidium — recuperação', () => {
  it('usa as reduções aprovadas', () => {
    expect(CORRUPCAO_RECUPERACOES.descansoProlongado.reducao).toBe(5);
    expect(CORRUPCAO_RECUPERACOES.magiaPurificacao.reducao).toBe(15);
    expect(CORRUPCAO_RECUPERACOES.ritualEspiritual.reducao).toBe('total');
  });

  it('reduz por descanso e purificação sem ficar negativo', () => {
    expect(recuperarCorrupcao(30, 'descansoProlongado').pontos).toBe(25);
    expect(recuperarCorrupcao(10, 'magiaPurificacao').pontos).toBe(0);
  });

  it('o ritual remove toda a Corrupção', () => {
    const resultado = recuperarCorrupcao(95, 'ritualEspiritual');
    expect(resultado.pontos).toBe(0);
    expect(resultado.estagio.nome).toBe('Normal');
  });

  it('rejeita método desconhecido', () => {
    const resultado = recuperarCorrupcao(30, 'metodoInexistente');
    expect(resultado.ok).toBe(false);
  });
});

describe('Corrupção do Ruidium — descrição', () => {
  it('descreve o estágio com penalidades e potência mágica', () => {
    const texto = descreverEstagioCorrupcao(60);
    expect(texto).toContain('Corrompido');
    expect(texto).toContain('-15% reflexo');
    expect(texto).toContain('+15% de potência mágica');
  });

  it('descreve o estado consumido', () => {
    const texto = descreverEstagioCorrupcao(100);
    expect(texto).toContain('Consumido');
    expect(texto).toContain('Poder extremo, mas sem controle consciente.');
  });
});
