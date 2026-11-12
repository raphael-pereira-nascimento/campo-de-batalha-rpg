import { describe, it, expect } from 'vitest';
import {
  CONTAMINACAO_ID,
  CONTAMINACAO_NOME,
  CONTAMINACAO_EFEITOS,
  CONTAMINACAO_APLICACOES,
  CONTAMINACAO_CONTRA_SAGRADOS,
  getAplicacaoContaminacao,
  calcularDanoContaminacao,
  iniciarContaminacao,
  processarTurnoContaminacao,
  reduzirPotenciaCura,
  descreverResistenciaACorrupcao,
  descreverContaminacao,
} from '../../src/game/contaminacao.js';

describe('Contaminação Pandemônica — identidade', () => {
  it('é uma condição própria, separada de Podridão e Corrupção', () => {
    expect(CONTAMINACAO_ID).toBe('contaminacaoPandemonica');
    expect(CONTAMINACAO_NOME).toBe('Contaminação Pandemônica');
    expect(CONTAMINACAO_EFEITOS.danoProgressivo).toBe(true);
    expect(CONTAMINACAO_EFEITOS.reduzEfeitosDeCura).toBe(true);
    expect(CONTAMINACAO_EFEITOS.maisIntensaEmSeresSagrados).toBe(true);
    expect(CONTAMINACAO_EFEITOS.maisIntensaEmEquipamentosDeLuz).toBe(true);
  });

  it('não cria estágios que a documentação não define', () => {
    for (const aplicacao of Object.values(CONTAMINACAO_APLICACOES)) {
      expect(aplicacao.estagio).toBeUndefined();
    }
  });

  it('registra as cinco aplicações documentadas', () => {
    expect(Object.keys(CONTAMINACAO_APLICACOES)).toHaveLength(5);
    expect(getAplicacaoContaminacao('contaminacaoProfana').chance).toBe(20);
    expect(getAplicacaoContaminacao('feridaPandemica').percentualDanoVidaMaxima).toBe(10);
    expect(getAplicacaoContaminacao('municaoContaminante').duracao).toBe(3);
    expect(getAplicacaoContaminacao('nucleoPandemico').reducaoPotenciaCuraProtecao).toBe(25);
    expect(getAplicacaoContaminacao('encantamentoLuz').duracao).toBe(2);
  });

  it('retorna null para aplicação desconhecida', () => {
    expect(getAplicacaoContaminacao('inexistente')).toBeNull();
    expect(getAplicacaoContaminacao()).toBeNull();
  });

  it('mantém os bônus contra seres sagrados e equipamentos de luz', () => {
    expect(CONTAMINACAO_CONTRA_SAGRADOS.danoAdicionalSeresSagrados).toBe(35);
    expect(CONTAMINACAO_CONTRA_SAGRADOS.danoEstruturalEquipamentosDeLuz).toBe(30);
  });
});

describe('Contaminação Pandemônica — dano progressivo', () => {
  it('calcula o dano por turno sobre a vida máxima', () => {
    expect(calcularDanoContaminacao(200, 10)).toBe(20);
    expect(calcularDanoContaminacao(50, 10)).toBe(5);
    expect(calcularDanoContaminacao('abc', 10)).toBe(0);
    expect(calcularDanoContaminacao(200, -10)).toBe(0);
  });

  it('exige a vida máxima quando a aplicação causa dano progressivo', () => {
    const semVida = iniciarContaminacao('feridaPandemica');
    expect(semVida.ok).toBe(false);
    expect(semVida.motivo).toContain('vida máxima');

    const comVida = iniciarContaminacao('feridaPandemica', { vidaMaxima: 200 });
    expect(comVida.ok).toBe(true);
    expect(comVida.estado.danoPorTurno).toBe(20);
    expect(comVida.estado.turnosRestantes).toBe(3);
    expect(comVida.estado.ativa).toBe(true);
  });

  it('aplica contaminação sem dano progressivo quando a ficha não define percentual', () => {
    const resultado = iniciarContaminacao('municaoContaminante');
    expect(resultado.ok).toBe(true);
    expect(resultado.estado.danoPorTurno).toBeNull();
    expect(resultado.estado.turnosRestantes).toBe(3);
  });

  it('rejeita aplicação desconhecida', () => {
    const resultado = iniciarContaminacao('inexistente');
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toContain('desconhecida');
  });

  it('processa os turnos até encerrar', () => {
    const inicio = iniciarContaminacao('feridaPandemica', { vidaMaxima: 200 });
    let estado = inicio.estado;

    const t1 = processarTurnoContaminacao(estado);
    expect(t1.dano).toBe(20);
    expect(t1.estado.turnosRestantes).toBe(2);
    expect(t1.encerrada).toBe(false);

    const t2 = processarTurnoContaminacao(t1.estado);
    const t3 = processarTurnoContaminacao(t2.estado);
    expect(t3.estado.turnosRestantes).toBe(0);
    expect(t3.encerrada).toBe(true);
    expect(t3.estado.ativa).toBe(false);

    const t4 = processarTurnoContaminacao(t3.estado);
    expect(t4.dano).toBe(0);
    expect(t4.encerrada).toBe(true);
  });

  it('rejeita estado inválido', () => {
    expect(processarTurnoContaminacao(null).ok).toBe(false);
    expect(processarTurnoContaminacao({}).ok).toBe(false);
  });
});

describe('Contaminação Pandemônica — cura e descrição', () => {
  it('reduz a potência de cura no percentual documentado', () => {
    expect(reduzirPotenciaCura(200, 25)).toBe(150);
    expect(reduzirPotenciaCura(100)).toBe(75);
    expect(reduzirPotenciaCura('abc', 25)).toBe(0);
  });

  it('não inventa percentual para a resistência à corrupção', () => {
    expect(descreverResistenciaACorrupcao()).toContain('não define percentual');
  });

  it('descreve a aplicação a partir do id ou do estado', () => {
    expect(descreverContaminacao('feridaPandemica')).toContain('Ferida Pandemônica');
    const inicio = iniciarContaminacao('municaoContaminante');
    expect(descreverContaminacao(inicio.estado)).toContain('Munição Contaminante');
    expect(descreverContaminacao('inexistente')).toBe('Contaminação Pandemônica');
  });
});
