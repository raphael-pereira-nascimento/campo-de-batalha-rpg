import { describe, it, expect } from 'vitest';
import {
  MATERIAL_CATEGORIAS,
  CATEGORIAS_DADOS,
  CATEGORIA_POR_TIPO,
  MATERIAL_RARIDADES,
  MATERIAL_QUALIDADES,
  MATERIAL_APLICACOES,
  EQUIPAMENTO_CATEGORIAS,
  FISICA_CAMPOS,
  getCategoria,
  getCategoriaEfeitoEquipamento,
  getEfeitoPorEquipamento,
  normalizarMaterial,
  validarMaterial,
  camposPendentes,
} from '../../src/game/materialRules.js';

describe('schema — categorias e classificações', () => {
  it('categoria oficial tem as cinco entradas de exibição', () => {
    expect(MATERIAL_CATEGORIAS.minerio).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.metal).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.especial).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.magico).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.golem).toBeTruthy();
  });

  it('golem é filtro por aplicação, não uma categoria gravável', () => {
    expect(MATERIAL_CATEGORIAS.golem.tipoFiltro).toBe('aplicacao');
    expect(CATEGORIAS_DADOS).toEqual(['minerio', 'metal', 'especial', 'magico']);
    expect(CATEGORIAS_DADOS).not.toContain('golem');
  });

  it('pedra é categoria legada e é convertida para especial', () => {
    expect(MATERIAL_CATEGORIAS.pedra.legado).toBe(true);
    expect(MATERIAL_CATEGORIAS.pedra.oculto).toBe(true);
    expect(CATEGORIA_POR_TIPO.pedra).toBe('especial');
    expect(getCategoria({ tipo: 'pedra' })).toBe('especial');
    expect(getCategoria({ categoria: 'magico' })).toBe('magico');
    expect(getCategoria(null)).toBeNull();
  });

  it('raridade e qualidade são escalas separadas', () => {
    const raridades = Object.values(MATERIAL_RARIDADES).sort((a, b) => a.ordem - b.ordem);
    expect(raridades.map((r) => r.nome)).toEqual([
      'Comum', 'Incomum', 'Rara', 'Épica', 'Muito rara', 'Lendária', 'Mítica',
    ]);

    const qualidades = Object.values(MATERIAL_QUALIDADES).sort((a, b) => a.ordem - b.ordem);
    expect(qualidades.map((q) => q.nome)).toEqual([
      'Variável', 'Inferior', 'Comum', 'Refinado', 'Superior', 'Excepcional', 'Perfeito',
    ]);
    expect(MATERIAL_QUALIDADES.variavel.especial).toBe(true);
    expect(MATERIAL_QUALIDADES.variavel.ordem).toBe(0);

    // As duas escalas não podem ser confundidas: qualidade tem "Perfeito";
    // raridade tem "Mítica".
    expect(MATERIAL_RARIDADES.perfeito).toBeUndefined();
    expect(MATERIAL_QUALIDADES.mitica).toBeUndefined();
  });

  it('aplicações cobrem as onze categorias de efeito', () => {
    expect(Object.keys(EQUIPAMENTO_CATEGORIAS)).toEqual([
      'armadura', 'armaLamina', 'armaImpacto', 'armaFogo', 'acessorio',
      'cajado', 'varinha', 'grimorio', 'orbe', 'catalisador', 'golem',
    ]);
    expect(Object.keys(MATERIAL_APLICACOES).sort()).toEqual(Object.keys(EQUIPAMENTO_CATEGORIAS).sort());
  });
});

describe('schema — normalização da ficha', () => {
  it('completa todos os campos sem inventar dados', () => {
    const normalizado = normalizarMaterial({
      id: 'teste',
      nome: 'Teste',
      tipo: 'pedra',
      efeitos: { armadura: { desc: 'Efeito real', bonus: { resistencia: 1 } } },
    });

    expect(normalizado.tipo).toBe('pedra');
    expect(normalizado.categoria).toBe('especial');
    expect(normalizado.forma).toBeNull();
    expect(normalizado.raridade).toBeNull();
    expect(normalizado.qualidade).toBeNull();
    expect(normalizado.precoPorKg).toBeNull();
    expect(normalizado.bioma).toBeNull();
    expect(normalizado.compatibilidade).toBeNull();
    expect(normalizado.aplicacoes).toEqual(['armadura']);
    expect(normalizado.caracteristicasEspeciais).toEqual([]);
    expect(normalizado.efeitosNegativos).toEqual([]);
    expect(normalizado.restricoes).toEqual([]);
    expect(normalizado.observacoes).toBeNull();
    expect(normalizado.status).toBe('pendente');
  });

  it('mantém todas as categorias de efeito e o fallback mágico', () => {
    const normalizado = normalizarMaterial({
      id: 'teste',
      nome: 'Teste',
      tipo: 'metal',
      efeitos: { equipamentoMagico: { desc: 'Fallback', bonus: { inteligencia: 1 } } },
    });

    for (const chave of Object.keys(EQUIPAMENTO_CATEGORIAS)) {
      expect(Object.prototype.hasOwnProperty.call(normalizado.efeitos, chave), chave).toBe(true);
      expect(normalizado.efeitos[chave]).toBeNull();
    }
    expect(normalizado.efeitos.equipamentoMagico).toBeTruthy();
  });

  it('normaliza os sete campos físicos', () => {
    const normalizado = normalizarMaterial({ id: 'x', nome: 'X', tipo: 'metal' });
    expect(Object.keys(normalizado.fisica)).toEqual(Object.keys(FISICA_CAMPOS));
    for (const valor of Object.values(normalizado.fisica)) expect(valor).toBeNull();
  });

  it('deduz aplicações a partir dos efeitos quando não declaradas', () => {
    const normalizado = normalizarMaterial({
      id: 'x',
      nome: 'X',
      tipo: 'metal',
      efeitos: {
        armadura: { desc: 'a', bonus: {} },
        golem: { desc: 'g', bonus: {} },
      },
    });
    expect(normalizado.aplicacoes).toEqual(['armadura', 'golem']);
  });

  it('respeita aplicações declaradas, mesmo fora dos efeitos', () => {
    const normalizado = normalizarMaterial({
      id: 'x',
      nome: 'X',
      tipo: 'metal',
      aplicacoes: ['golem', 'golem', 'armadura'],
    });
    expect(normalizado.aplicacoes).toEqual(['golem', 'armadura']);
  });
});

describe('schema — categoria de efeito da forja', () => {
  it('mapeia armas por subcategoria', () => {
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma', subcategoria: 'lâmina' })).toBe('armaLamina');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma', subcategoria: 'lamina' })).toBe('armaLamina');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma', subcategoria: 'impacto' })).toBe('armaImpacto');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma', subcategoria: 'fogo' })).toBe('armaFogo');
  });

  it('mapeia as categorias mágicas e os demais tipos', () => {
    for (const tipo of ['cajado', 'varinha', 'grimorio', 'orbe', 'catalisador']) {
      expect(getCategoriaEfeitoEquipamento({ tipo }), tipo).toBe(tipo);
    }
    expect(getCategoriaEfeitoEquipamento({ tipo: 'armadura' })).toBe('armadura');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'acessorio' })).toBe('acessorio');
    expect(getCategoriaEfeitoEquipamento({ tipo: 'golem' })).toBe('golem');
    expect(getCategoriaEfeitoEquipamento('golem')).toBe('golem');
    expect(getCategoriaEfeitoEquipamento(null)).toBeNull();
  });

  it('usa armaLamina como padrão de arma sem subcategoria conhecida', () => {
    expect(getCategoriaEfeitoEquipamento({ tipo: 'arma' })).toBe('armaLamina');
  });
});

describe('schema — validação', () => {
  const base = {
    id: 'teste',
    nome: 'Teste',
    categoria: 'metal',
    aliases: [],
    aplicacoes: ['armadura'],
    efeitos: { armadura: { desc: 'ok', bonus: { resistencia: 1 } } },
  };

  it('aceita ficha mínima válida', () => {
    expect(validarMaterial(base).ok).toBe(true);
  });

  it('rejeita aplicação inválida', () => {
    expect(validarMaterial({ ...base, aplicacoes: ['inexistente'] }).ok).toBe(false);
    expect(validarMaterial({ ...base, aplicacoes: 'golem' }).ok).toBe(false);
  });

  it('rejeita listas e textos inválidos nos novos campos', () => {
    expect(validarMaterial({ ...base, caracteristicasEspeciais: 'x' }).ok).toBe(false);
    expect(validarMaterial({ ...base, efeitosNegativos: 1 }).ok).toBe(false);
    expect(validarMaterial({ ...base, restricoes: {} }).ok).toBe(false);
    expect(validarMaterial({ ...base, observacoes: 5 }).ok).toBe(false);
    expect(validarMaterial({ ...base, compatibilidade: 'armadura' }).ok).toBe(false);
  });

  it('rejeita bônus não numérico', () => {
    expect(validarMaterial({
      ...base,
      efeitos: { armadura: { desc: 'x', bonus: { resistencia: 'muito' } } },
    }).ok).toBe(false);
  });

  it('aceita os campos estendidos de efeito', () => {
    const material = {
      ...base,
      efeitos: {
        armadura: {
          desc: 'Efeito completo',
          bonus: { resistencia: 1 },
          percentuais: { vidaMaxima: 5 },
          penalidades: { destreza: -1 },
          condicoes: ['contra fogo'],
          especial: 'Imunidade a calor.',
        },
      },
    };
    expect(validarMaterial(material).ok).toBe(true);
  });

  it('rejeita percentuais e penalidades não numéricos', () => {
    const comPercentualInvalido = {
      ...base,
      efeitos: {
        armadura: { desc: 'x', bonus: {}, percentuais: { vidaMaxima: 'muito' } },
      },
    };
    const comPenalidadeInvalida = {
      ...base,
      efeitos: {
        armadura: { desc: 'x', bonus: {}, penalidades: { destreza: 'muita' } },
      },
    };
    expect(validarMaterial(comPercentualInvalido).ok).toBe(false);
    expect(validarMaterial(comPenalidadeInvalida).ok).toBe(false);
  });

  it('rejeita condições que não são lista e especial de tipo inválido', () => {
    expect(validarMaterial({
      ...base,
      efeitos: { armadura: { desc: 'x', bonus: {}, condicoes: 'contra fogo' } },
    }).ok).toBe(false);
    expect(validarMaterial({
      ...base,
      efeitos: { armadura: { desc: 'x', bonus: {}, especial: ['a'] } },
    }).ok).toBe(false);
  });

  it('aceita especial como objeto', () => {
    expect(validarMaterial({
      ...base,
      efeitos: { armadura: { desc: 'x', bonus: {}, especial: { tipo: 'aura' } } },
    }).ok).toBe(true);
  });

  it('lista pendências sem bloquear a validação', () => {
    const pendentes = camposPendentes(base);
    expect(pendentes).toContain('raridade');
    expect(pendentes).toContain('qualidade');
    expect(pendentes).toContain('precoPorKg');
    expect(pendentes).toContain('bioma');
    expect(pendentes).toContain('compatibilidade');
    expect(pendentes).toContain('fisica.densidade');
    expect(pendentes).not.toContain('categoria');
    expect(pendentes).not.toContain('aplicacoes');
    expect(pendentes).not.toContain('efeitos');
  });
});

describe('schema — resolução de efeitos por equipamento', () => {
  const material = {
    id: 'teste',
    efeitos: {
      armadura: {
        desc: 'Efeito direto',
        bonus: { resistencia: 2 },
        modificadores: [{ tipo: 'status', alvo: 'queimadura', valor: 20 }],
      },
      equipamentoMagico: {
        desc: 'Efeito mágico',
        percentuais: { dano: 10 },
      },
    },
    efeitosGerais: [
      { tipo: 'especial', alvo: 'teste geral', valor: 5 },
    ],
  };

  it('combina o efeito direto com os efeitos gerais', () => {
    const efeito = getEfeitoPorEquipamento(material, 'armadura');
    expect(efeito.origem).toBe('armadura');
    expect(efeito.fallback).toBe(false);
    expect(efeito.bonus.resistencia).toBe(2);
    expect(efeito.modificadores).toHaveLength(2);
    expect(efeito.modificadores.map((m) => m.alvo).sort())
      .toEqual(['queimadura', 'teste geral']);
  });

  it('efeito idêntico do específico substitui o geral, sem acumular', () => {
    const efeito = getEfeitoPorEquipamento({
      id: 'teste',
      efeitos: {
        armadura: {
          desc: 'Específico',
          modificadores: [{ tipo: 'especial', alvo: 'Teste Geral', valor: 20 }],
        },
      },
      efeitosGerais: [
        { tipo: 'especial', alvo: 'teste geral', valor: 5 },
      ],
    }, 'armadura');
    expect(efeito.modificadores).toHaveLength(1);
    expect(efeito.modificadores[0].valor).toBe(20);
  });

  it('categorias mágicas caem no fallback equipamentoMagico', () => {
    const efeito = getEfeitoPorEquipamento(material, 'cajado');
    expect(efeito.origem).toBe('equipamentoMagico');
    expect(efeito.fallback).toBe(true);
    expect(efeito.percentuais).toEqual({ dano: 10 });
  });

  it('usa efeitos.geral quando não há efeito da categoria', () => {
    const comGeral = {
      id: 'teste',
      efeitos: { geral: { desc: 'Geral', percentuais: { cura: 20 } } },
    };
    const efeito = getEfeitoPorEquipamento(comGeral, 'armadura');
    expect(efeito.origem).toBe('geral');
    expect(efeito.percentuais).toEqual({ cura: 20 });
  });

  it('não aplica efeitos.geral a golens nem com incluirGerais desligado', () => {
    const comGeral = {
      id: 'teste',
      efeitos: { geral: { desc: 'Geral', percentuais: { cura: 20 } } },
    };
    expect(getEfeitoPorEquipamento(comGeral, 'golem')).toBeNull();

    const semGerais = getEfeitoPorEquipamento(material, 'armadura', { incluirGerais: false });
    expect(semGerais.modificadores).toHaveLength(1);
    expect(semGerais.modificadores[0].alvo).toBe('queimadura');
  });
});
