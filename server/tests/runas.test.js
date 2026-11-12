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
