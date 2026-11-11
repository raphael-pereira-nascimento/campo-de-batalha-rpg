import { describe, it, expect } from 'vitest';
import {
  calcularAtributosEquipamento,
  calcularCustoFabricacao,
  craftarEquipamento,
  podeUsarFerroEstigio,
} from '../../src/game/forge.js';
import { getMaterialById } from '../../src/game/materials.js';
import {
  calcularBonusComposicao,
  getCategoriaEfeitoEquipamento,
} from '../../src/game/materialRules.js';

describe('forja — categoria de efeito por tipo de equipamento', () => {
  it('usa a categoria real de cada equipamento', () => {
    const esperado = {
      espada_longa: 'armaLamina',
      machado_de_guerra: 'armaImpacto',
      pistola: 'armaFogo',
      armadura_de_placas: 'armadura',
      anel_de_forca: 'acessorio',
      cajado_arcano: 'cajado',
      orbe_magico: 'varinha',
      grimorio_de_iniciado: 'grimorio',
      orbe_de_cristal: 'orbe',
      catalisador_de_mana: 'catalisador',
    };

    for (const [equipId, categoria] of Object.entries(esperado)) {
      const resultado = calcularAtributosEquipamento(equipId, 'ferro', null);
      expect(resultado.ok, equipId).toBe(true);
      expect(resultado.categoriaEfeito, equipId).toBe(categoria);
    }
  });

  it('cajado usa o fallback mágico em vez da subcategoria', () => {
    const resultado = calcularAtributosEquipamento('cajado_arcano', 'cobre', null);

    expect(resultado.categoriaEfeito).toBe('cajado');
    expect(resultado.composicao.bonusFinal).toEqual({ inteligencia: 1 });
    // Bônus próprio do cajado (2) + efeito do cobre (1)
    expect(resultado.atributos).toEqual({ inteligencia: 3 });
  });

  it('arma de impacto soma o efeito de impacto ao bônus do equipamento', () => {
    const resultado = calcularAtributosEquipamento('machado_de_guerra', 'aco', null);

    expect(resultado.categoriaEfeito).toBe('armaImpacto');
    expect(resultado.composicao.bonusFinal).toEqual({ forca: 3 });
    expect(resultado.atributos).toEqual({ forca: 6 });
  });

  it('arma de lâmina soma o efeito de lâmina', () => {
    const resultado = calcularAtributosEquipamento('espada_longa', 'aco', null);

    expect(resultado.categoriaEfeito).toBe('armaLamina');
    expect(resultado.composicao.bonusFinal).toEqual({ forca: 2 });
    expect(resultado.atributos).toEqual({ forca: 4 });
  });

  it('armadura usa o efeito de armadura', () => {
    const resultado = calcularAtributosEquipamento('armadura_de_placas', 'diamante', null);

    expect(resultado.categoriaEfeito).toBe('armadura');
    expect(resultado.composicao.bonusFinal).toEqual({ resistencia: 5 });
    expect(resultado.atributos).toEqual({ resistencia: 5 });
  });

  it('acessório usa o efeito de acessório', () => {
    const resultado = calcularAtributosEquipamento('anel_de_forca', 'bronze', null);

    expect(resultado.categoriaEfeito).toBe('acessorio');
    expect(resultado.composicao.bonusFinal).toEqual({ resistencia: 1 });
    expect(resultado.atributos).toEqual({ forca: 1, resistencia: 1 });
  });
});

describe('forja — composição principal/secundário', () => {
  it('não acumula o mesmo atributo concedido pelo principal', () => {
    const resultado = calcularAtributosEquipamento('machado_de_guerra', 'aco', 'bronze');

    expect(resultado.composicao.bonusFinal).toEqual({ forca: 3 });
    expect(resultado.atributos).toEqual({ forca: 6 });
    expect(resultado.composicao.secundario.ignorados.some((item) => item.atributo === 'forca')).toBe(true);
  });

  it('arredonda para baixo o bônus de 25% do secundário', () => {
    // Estanho não concede força em armas de impacto; o aço concede 3.
    // 25% de 3 = 0,75, truncado para 0.
    const resultado = calcularAtributosEquipamento('machado_de_guerra', 'estanho', 'aco');

    expect(resultado.composicao.bonusFinal).toEqual({});
    expect(resultado.atributos).toEqual({ forca: 3 });
    expect(resultado.composicao.secundario.ignorados.some((item) => item.motivo.includes('zero'))).toBe(true);
  });

  it('aplica 25% quando o valor do secundário é suficiente', () => {
    // Aço em golem: resistência 4 e força 2. 25% => 1 e 0.
    const composicao = calcularBonusComposicao(
      getMaterialById('estanho'),
      getMaterialById('aco'),
      'golem',
    );

    expect(composicao.ok).toBe(true);
    expect(composicao.bonusFinal).toEqual({ resistencia: 1 });
    expect(composicao.secundario.bonusAplicado).toEqual({ resistencia: 1 });
  });

  it('exposição da composição bate com a regra central', () => {
    const composicao = calcularBonusComposicao(
      getMaterialById('aco'),
      getMaterialById('bronze'),
      'armaImpacto',
    );
    const resultado = calcularAtributosEquipamento('machado_de_guerra', 'aco', 'bronze');

    expect(resultado.composicao.bonusFinal).toEqual(composicao.bonusFinal);
    expect(resultado.composicao.categoria).toBe(composicao.categoria);
  });

  it('bloqueia composição declarada como incompatível', () => {
    const materialRestrito = {
      id: 'teste',
      nome: 'Material de teste',
      compatibilidade: ['armadura'],
      efeitos: {
        armaLamina: { desc: 'Efeito real', bonus: { forca: 1 } },
      },
    };

    const composicao = calcularBonusComposicao(materialRestrito, null, 'armaLamina');
    expect(composicao.ok).toBe(false);
    expect(composicao.motivo).toContain('não é compatível');
  });

  it('craftarEquipamento grava categoria, composição e atributos finais', () => {
    const resultado = craftarEquipamento('espada_longa', 'aco', 'estanho');

    expect(resultado.ok).toBe(true);
    expect(resultado.categoriaEfeito).toBe('armaLamina');
    expect(resultado.equip.categoriaEfeito).toBe('armaLamina');
    expect(resultado.equip.atributosFinais).toEqual({ forca: 4 });
    expect(resultado.equip.materiais.primario.id).toBe('aco');
    expect(resultado.equip.materiais.secundario.id).toBe('estanho');
    expect(resultado.equip.composicao.bonusFinal).toEqual({ forca: 2 });
  });

  it('rejeita equipamento inexistente', () => {
    expect(calcularAtributosEquipamento('nao_existe', 'ferro', null).ok).toBe(false);
    expect(craftarEquipamento('nao_existe', 'ferro').ok).toBe(false);
  });
});

describe('forja — custo de fabricação', () => {
  it('mantém o padrão antigo de 1 kg principal + 0,25 kg secundário', () => {
    // Espada Longa: 650 + ferro 5 + estanho 6 × 0,25 = 1,5 (arredondado) = 657
    expect(calcularCustoFabricacao('espada_longa', 'ferro', 'estanho')).toBe(657);
  });

  it('aceita quantidades informadas em kg', () => {
    expect(calcularCustoFabricacao(
      'espada_longa',
      'ferro',
      'estanho',
      [],
      { primarioKg: 2, secundarioKg: 1 },
    )).toBe(666);
  });

  it('trata quantidade negativa como zero', () => {
    expect(calcularCustoFabricacao(
      'espada_longa',
      'ferro',
      null,
      [],
      { primarioKg: -5 },
    )).toBe(650);
  });

  it('não soma material sem preço cadastrado', () => {
    expect(calcularCustoFabricacao('espada_longa', 'minerioFerro')).toBe(650);
  });

  it('cobra o preço base quando não há materiais', () => {
    expect(calcularCustoFabricacao('espada_longa')).toBe(650);
    expect(calcularCustoFabricacao('nao_existe')).toBe(0);
  });

  it('soma o preço fixo das gemas conhecidas', () => {
    expect(calcularCustoFabricacao('espada_longa', null, null, [{ gemaId: 'diamante' }])).toBe(1150);
    expect(calcularCustoFabricacao('espada_longa', null, null, [{ gemaId: 'obsidiana' }])).toBe(850);
  });
});

describe('forja — Ferro Estígio', () => {
  it('exige treinamento específico', () => {
    const semTreino = podeUsarFerroEstigio({ treinamentos: [] });
    expect(semTreino.podeUsar).toBe(false);
    expect(semTreino.motivo).toContain('treinamento');

    const comTreino = podeUsarFerroEstigio({ treinamentos: ['ferroEstigio'] });
    expect(comTreino.podeUsar).toBe(true);
  });

  it('bloqueia o crafting sem o treinamento', () => {
    const resultado = craftarEquipamento('espada_longa', 'ferroEstigio', null, [], { treinamentos: [] });
    expect(resultado.ok).toBe(false);
    expect(resultado.motivo).toContain('treinamento');
  });

  it('permite o crafting com o treinamento', () => {
    const resultado = craftarEquipamento(
      'espada_longa',
      'ferroEstigio',
      null,
      [],
      { treinamentos: ['ferroEstigio'] },
    );
    expect(resultado.ok).toBe(true);
  });
});

describe('forja — mapeamento direto', () => {
  it('reaproveita getCategoriaEfeitoEquipamento', () => {
    expect(getCategoriaEfeitoEquipamento({ tipo: 'cajado' })).toBe('cajado');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma', subcategoria: 'fogo' })).toBe('armaFogo');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma', subcategoria: 'impacto' })).toBe('armaImpacto');
  });
});
