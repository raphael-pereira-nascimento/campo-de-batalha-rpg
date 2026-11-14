import { describe, it, expect } from 'vitest';
import {
  RUNAS_ELEMENTOS,
  RUNAS_REGRA_SEM_ACO_RUNICO,
  RUNAS_REGRA_COM_ACO_RUNICO,
  RUNAS_COMBINACAO,
  RUNAS_ENCAIXE,
  getElementoRuna,
  getRegraRunas,
  validarRunas,
  calcularEfeitoRuna,
  descreverRegrasRunas,
  RUNAS_EFEITO_BASE,
  efeitoRuna,
  modificadoresRuna,
} from '../../src/game/runas.js';

describe('Runas elementais — dados aprovados', () => {
  it('tem os 17 elementos definidos no documento', () => {
    expect(RUNAS_ELEMENTOS).toHaveLength(17);
    expect(RUNAS_ELEMENTOS.map((e) => e.nome)).toEqual([
      'Água', 'Gelo', 'Fogo', 'Ar', 'Planta', 'Pedra', 'Elétrico', 'Luz', 'Sombrio',
      'Psíquico', 'Dor', 'Veneno', 'Tempo', 'Sangue', 'Metais', 'Ilusão', 'Areia',
    ]);
  });

  it('encontra elementos pelo id sem depender de acento', () => {
    expect(getElementoRuna('fogo').nome).toBe('Fogo');
    expect(getElementoRuna('FOGO').nome).toBe('Fogo');
    expect(getElementoRuna('ilusao').nome).toBe('Ilusão');
    expect(getElementoRuna('inexistente')).toBeNull();
    expect(getElementoRuna()).toBeNull();
  });

  it('registra as regras de encaixe e combinação', () => {
    expect(RUNAS_ENCAIXE.ocupaEncaixePedraPreciosa).toBe(true);
    expect(RUNAS_COMBINACAO.elementosDiferentesObrigatorio).toBe(true);
    expect(RUNAS_REGRA_SEM_ACO_RUNICO.maxRunas).toBe(1);
    expect(RUNAS_REGRA_SEM_ACO_RUNICO.multiplicadorEfeito).toBe(0.5);
    expect(RUNAS_REGRA_COM_ACO_RUNICO.maxRunas).toBe(2);
    expect(RUNAS_REGRA_COM_ACO_RUNICO.multiplicadorEfeito).toBe(1.5);
  });
});

describe('Runas elementais — regras de uso', () => {
  it('sem Aço Rúnico aceita uma runa com efeito reduzido', () => {
    expect(getRegraRunas(false).maxRunas).toBe(1);
    expect(validarRunas(['fogo'], false).ok).toBe(true);
    expect(calcularEfeitoRuna(100, false)).toBe(50);
  });

  it('com Aço Rúnico aceita duas runas de elementos diferentes', () => {
    expect(getRegraRunas(true).maxRunas).toBe(2);
    const resultado = validarRunas(['fogo', 'gelo'], true);
    expect(resultado.ok).toBe(true);
    expect(resultado.multiplicadorEfeito).toBe(1.5);
    expect(calcularEfeitoRuna(100, true)).toBe(150);
  });

  it('bloqueia duas runas sem Aço Rúnico', () => {
    const resultado = validarRunas(['fogo', 'gelo'], false);
    expect(resultado.ok).toBe(false);
    expect(resultado.erros.some((erro) => erro.includes('limite'))).toBe(true);
  });

  it('bloqueia duas runas do mesmo elemento mesmo com Aço Rúnico', () => {
    const resultado = validarRunas(['fogo', 'fogo'], true);
    expect(resultado.ok).toBe(false);
    expect(resultado.erros.some((erro) => erro.includes('elementos diferentes'))).toBe(true);
  });

  it('aceita runas como objetos com elemento ou id', () => {
    expect(validarRunas([{ elemento: 'agua' }], false).ok).toBe(true);
    expect(validarRunas([{ id: 'pedra' }], false).ok).toBe(true);
    expect(validarRunas([{}], false).ok).toBe(false);
  });

  it('rejeita elemento desconhecido', () => {
    const resultado = validarRunas(['inexistente'], false);
    expect(resultado.ok).toBe(false);
    expect(resultado.erros.some((erro) => erro.includes('inválido'))).toBe(true);
  });

  it('trata entrada vazia como lista vazia', () => {
    expect(validarRunas(null, false).ok).toBe(true);
    expect(validarRunas(undefined, true).elementos).toEqual([]);
  });

  it('não inventa efeito numérico para valor inválido', () => {
    expect(calcularEfeitoRuna('abc', true)).toBe(0);
  });

  it('descreve as quatro regras principais', () => {
    const texto = descreverRegrasRunas();
    expect(texto).toContain('1 runa');
    expect(texto).toContain('2 runas');
    expect(texto).toContain('elementos diferentes');
    expect(texto).toContain('pedra preciosa');
  });
});

describe('Runas elementais — efeito genérico aprovado', () => {
  it('registra o efeito-base como proposta, não como dado oficial', () => {
    expect(RUNAS_EFEITO_BASE.oficial).toBe(false);
    expect(RUNAS_EFEITO_BASE.passivo.bonusDanoPct).toBe(10);
    expect(RUNAS_EFEITO_BASE.passivo.resistenciaPct).toBe(10);
    expect(RUNAS_EFEITO_BASE.ativo.chancePct).toBe(20);
    expect(RUNAS_EFEITO_BASE.ativo.duracaoTurnos).toBe(2);
  });

  it('aplica o multiplicador do Aço Rúnico sobre potência e chance', () => {
    const semAco = efeitoRuna('fogo', false);
    expect(semAco.multiplicador).toBe(0.5);
    expect(semAco.passivo.bonusDanoPct).toBe(5);
    expect(semAco.passivo.resistenciaPct).toBe(5);
    expect(semAco.ativo.chancePct).toBe(10);

    const comAco = efeitoRuna('fogo', true);
    expect(comAco.multiplicador).toBe(1.5);
    expect(comAco.passivo.bonusDanoPct).toBe(15);
    expect(comAco.passivo.resistenciaPct).toBe(15);
    expect(comAco.ativo.chancePct).toBe(30);
  });

  it('não multiplica a duração do efeito ativo', () => {
    expect(efeitoRuna('gelo', false).ativo.duracaoTurnos).toBe(2);
    expect(efeitoRuna('gelo', true).ativo.duracaoTurnos).toBe(2);
  });

  it('não inventa efeito para elemento desconhecido', () => {
    expect(efeitoRuna('inexistente')).toBeNull();
    expect(efeitoRuna()).toBeNull();
    expect(modificadoresRuna('inexistente')).toEqual([]);
  });

  it('converte o efeito em modificadores canônicos', () => {
    const modificadores = modificadoresRuna('gelo', false);
    expect(modificadores).toHaveLength(3);

    const [bonus, resistencia, chance] = modificadores;
    expect(bonus.tipo).toBe('bonus');
    expect(bonus.valor).toBe(5);
    expect(bonus.unidade).toBe('percentual');
    expect(bonus.alvo).toContain('gelo');
    expect(bonus.fonte).toBe('runa');
    expect(bonus.elemento).toBe('gelo');

    expect(resistencia.tipo).toBe('resistencia');
    expect(resistencia.valor).toBe(5);

    expect(chance.tipo).toBe('chance');
    expect(chance.valor).toBe(10);
    expect(chance.duracao).toBe('2 turnos');
  });

  it('usa os valores ampliados com Aço Rúnico nos modificadores', () => {
    const [bonus, resistencia, chance] = modificadoresRuna('gelo', true);
    expect(bonus.valor).toBe(15);
    expect(resistencia.valor).toBe(15);
    expect(chance.valor).toBe(30);
  });
});
