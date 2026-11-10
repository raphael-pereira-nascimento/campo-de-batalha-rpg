import { describe, it, expect } from 'vitest';
import { getMaterialById } from '../../src/game/materials.js';
import {
  calcularBonusComposicao,
  getEfeitoPorEquipamento,
  getEfeitosPorCategoria,
  CATEGORIAS_MAGICAS,
  EQUIPAMENTO_CATEGORIAS,
} from '../../src/game/materialRules.js';

describe('composição — principal 100% e secundário até 25%', () => {
  it('aplica integralmente o bônus do material principal', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('aco'),
      null,
      'armaImpacto',
    );

    expect(resultado.ok).toBe(true);
    expect(resultado.principal.bonus).toEqual({ forca: 3 });
    expect(resultado.secundario.bonusOriginal).toEqual({});
    expect(resultado.bonusFinal).toEqual({ forca: 3 });
    expect(resultado.avisos.some((aviso) => aviso.includes('secundário'))).toBe(true);
  });

  it('aplica 25% ao secundário, arredondando para baixo', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('estanho'),
      getMaterialById('aco'),
      'golem',
    );

    // Aço: resistência 4 e força 2. 25% => 1 e 0 (arredondado para baixo).
    expect(resultado.ok).toBe(true);
    expect(resultado.bonusFinal).toEqual({ resistencia: 1 });
    expect(resultado.secundario.bonusAplicado).toEqual({ resistencia: 1 });
    expect(resultado.secundario.ignorados.some((item) => item.atributo === 'forca')).toBe(true);
  });

  it('não acumula o mesmo atributo concedido pelo principal', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('aco'),
      getMaterialById('bronze'),
      'armaImpacto',
    );

    expect(resultado.bonusFinal.forca).toBe(3);
    expect(resultado.secundario.bonusAplicado.forca).toBeUndefined();
    expect(resultado.secundario.ignorados.some((item) => item.atributo === 'forca')).toBe(true);
  });

  it('ignora o secundário quando é o mesmo material do principal', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('ferro'),
      getMaterialById('ferro'),
      'armadura',
    );

    expect(resultado.bonusFinal).toEqual({ resistencia: 1 });
    expect(resultado.avisos.some((aviso) => aviso.includes('mesmo material'))).toBe(true);
  });

  it('não exige material secundário', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('ferro'),
      null,
      'armadura',
    );

    expect(resultado.ok).toBe(true);
    expect(resultado.bonusFinal).toEqual({ resistencia: 1 });
    expect(resultado.secundario.materialId).toBeNull();
  });

  it('rejeita composição sem categoria de equipamento', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('ferro'),
      getMaterialById('aco'),
      null,
    );

    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toContain('categoria');
  });
});

describe('efeitos — categorias mágicas e fallback', () => {
  it('mapeia todas as categorias de equipamento do projeto', () => {
    for (const chave of [
      'armadura', 'armaLamina', 'armaImpacto', 'armaFogo', 'acessorio',
      'cajado', 'varinha', 'grimorio', 'orbe', 'catalisador', 'golem',
    ]) {
      expect(EQUIPAMENTO_CATEGORIAS[chave], chave).toBeTruthy();
    }
  });

  it('usa equipamentoMagico como fallback das categorias mágicas', () => {
    const cobre = getMaterialById('cobre');

    for (const categoria of CATEGORIAS_MAGICAS) {
      const efeito = getEfeitoPorEquipamento(cobre, categoria);
      expect(efeito, categoria).toBeTruthy();
      expect(efeito.fallback).toBe(true);
      expect(efeito.origem).toBe('equipamentoMagico');
      expect(efeito.bonus).toEqual({ inteligencia: 1 });
    }
  });

  it('prefere o efeito explícito da categoria quando ele existe', () => {
    const material = {
      efeitos: {
        cajado: { desc: 'Cajado explícito', bonus: { inteligencia: 2 } },
        equipamentoMagico: { desc: 'Fallback', bonus: { inteligencia: 1 } },
      },
    };

    const efeito = getEfeitoPorEquipamento(material, 'cajado');
    expect(efeito.fallback).toBe(false);
    expect(efeito.desc).toBe('Cajado explícito');
    expect(efeito.bonus).toEqual({ inteligencia: 2 });
  });

  it('lista apenas categorias com efeito disponível', () => {
    const cobre = getMaterialById('cobre');
    const categorias = getEfeitosPorCategoria(cobre).filter((item) => item.efeito);
    expect(categorias.length).toBeGreaterThan(0);
    expect(categorias.some((item) => CATEGORIAS_MAGICAS.includes(item.chave))).toBe(true);
  });

  it('compõe bônus mágicos com fallback', () => {
    const resultado = calcularBonusComposicao(
      getMaterialById('cobre'),
      getMaterialById('ouro'),
      'cajado',
    );

    // Cobre: inteligência 1 (fallback). Ouro: inteligência 2 (fallback).
    expect(resultado.bonusFinal).toEqual({ inteligencia: 1 });
    expect(resultado.secundario.ignorados.some((item) => item.atributo === 'inteligencia')).toBe(true);
  });
});
