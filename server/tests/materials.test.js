import { describe, it, expect } from 'vitest';
import {
  MATERIAIS,
  MATERIAL_LIST,
  getMaterialById,
  getMateriaisPorTipo,
  getMaterialPorAlias,
  calcularPrecoMaterial,
} from '../../src/game/materials.js';
import {
  MATERIAL_CATEGORIAS,
  MATERIAL_RARIDADES,
  MATERIAL_QUALIDADES,
  normalizarPrecoPorKg,
  precoKgEmCents,
  formatarPrecoPorKg,
  filtrarMateriais,
  ordenarMateriais,
  validarMaterial,
  camposPendentes,
} from '../../src/game/materialRules.js';

const IDS_ORIGINAIS = [
  'ferro', 'cobre', 'estanho', 'chumbo', 'bronze', 'ferroForjado',
  'aco', 'prata', 'ouro', 'latão', 'obsidiana', 'diamante',
];

describe('materials.js — catálogo normalizado', () => {
  it('preserva os 12 materiais já existentes e seus nomes', () => {
    for (const id of IDS_ORIGINAIS) {
      expect(MATERIAIS[id], `material ${id}`).toBeTruthy();
      expect(MATERIAIS[id].id).toBe(id);
      expect(typeof MATERIAIS[id].nome).toBe('string');
      expect(MATERIAIS[id].nome.length).toBeGreaterThan(0);
    }
  });

  it('contém 49 fichas: 5 minérios, 35 metais, 5 especiais e 4 mágicos', () => {
    expect(MATERIAL_LIST).toHaveLength(49);
    expect(getMateriaisPorTipo('minerio')).toHaveLength(5);
    expect(getMateriaisPorTipo('metal')).toHaveLength(35);
    expect(getMateriaisPorTipo('pedra')).toHaveLength(2);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'especial')).toHaveLength(5);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'magico')).toHaveLength(4);
  });

  it('toda ficha tem categoria oficial e campos normalizados', () => {
    for (const material of MATERIAL_LIST) {
      expect(material.categoria).toBeTruthy();
      expect(Array.isArray(material.aliases)).toBe(true);
      expect(Array.isArray(material.relacoes)).toBe(true);
      expect(Array.isArray(material.biomas)).toBe(true);
      expect(Array.isArray(material.aplicacoes)).toBe(true);
      expect(material.efeitos && typeof material.efeitos === 'object').toBe(true);
      expect(material.fisica && typeof material.fisica === 'object').toBe(true);
    }
  });

  it('mantém `tipo` legado (pedra) separado da categoria oficial (especial)', () => {
    for (const id of ['obsidiana', 'diamante']) {
      const material = getMaterialById(id);
      expect(material.tipo).toBe('pedra');
      expect(material.categoria).toBe('especial');
    }
  });

  it('ferro, cobre, estanho e chumbo são metais refinados', () => {
    for (const id of ['ferro', 'cobre', 'estanho', 'chumbo']) {
      const material = getMaterialById(id);
      expect(material.tipo).toBe('metal');
      expect(material.forma).toBe('refinado');
      expect(material.relacoes.some((relacao) => relacao.tipo === 'origem')).toBe(true);
    }
  });

  it('as versões brutas existem como minério bruto e ficam pendentes', () => {
    for (const id of ['minerioFerro', 'minerioCobre', 'minerioEstanho', 'minerioChumbo']) {
      const material = getMaterialById(id);
      expect(material.tipo).toBe('minerio');
      expect(material.forma).toBe('bruto');
      expect(material.precoPorKg).toBeNull();
      expect(material.status).toBe('pendente');
    }
  });

  it('fichas sem dados oficiais não inventam valores', () => {
    const pendentes = MATERIAL_LIST.filter((material) => material.status === 'pendente');
    expect(pendentes.length).toBeGreaterThan(0);
    for (const material of pendentes) {
      expect(material.dadosPendentes.length).toBeGreaterThan(0);
    }
  });
});

describe('materialRules.js — preços por kg', () => {
  it('aceita número antigo como quantidade de bronze', () => {
    expect(normalizarPrecoPorKg(5)).toEqual({ bronze: 5 });
    expect(precoKgEmCents(5)).toBe(5);
  });

  it('normaliza o alias histórico cobre para bronze', () => {
    expect(normalizarPrecoPorKg({ cobre: 7 })).toEqual({ bronze: 7 });
    expect(precoKgEmCents({ cobre: 7 })).toBe(7);
  });

  it('converte objetos de moedas para centavos de bronze', () => {
    expect(precoKgEmCents({ bronze: 5 })).toBe(5);
    expect(precoKgEmCents({ prata: 1 })).toBe(100);
    expect(precoKgEmCents({ ouro: 1, prata: 2 })).toBe(1200);
    expect(precoKgEmCents({ ouropla: 1 })).toBe(10000);
    expect(precoKgEmCents({ platina: 1 })).toBe(100000);
  });

  it('rejeita preços inválidos', () => {
    expect(normalizarPrecoPorKg(-1)).toBeNull();
    expect(normalizarPrecoPorKg({ moedaInexistente: 1 })).toBeNull();
    expect(precoKgEmCents({ bronze: -1 })).toBeNull();
    expect(precoKgEmCents('5')).toBeNull();
  });

  it('formata o preço com as moedas do jogo', () => {
    expect(formatarPrecoPorKg({ bronze: 5 })).toBe('5 Bronze / kg');
    expect(formatarPrecoPorKg({ ouro: 1, prata: 2 })).toBe('1 Ouro + 2 Prata / kg');
    expect(formatarPrecoPorKg({ ouropla: 1, ouro: 2 })).toBe('1 Ouropla + 2 Ouro / kg');
    expect(formatarPrecoPorKg(getMaterialById('ferro'))).toBe('5 Bronze / kg');
    expect(formatarPrecoPorKg(null)).toBe('Preço não definido');
  });

  it('calcula o preço do material em centavos de bronze', () => {
    expect(calcularPrecoMaterial('ferro', 2)).toBe(10);
    expect(calcularPrecoMaterial('prata', 1)).toBe(100);
    expect(calcularPrecoMaterial('minerioFerro', 1)).toBe(0);
    expect(calcularPrecoMaterial('materialInexistente', 1)).toBe(0);
  });
});

describe('materials.js — aliases e relações', () => {
  it('resolve os nomes alternativos combinados', () => {
    expect(getMaterialPorAlias('Vidro de Dragão')?.id).toBe('obsidiana');
    expect(getMaterialPorAlias('Minério de Mithril')?.id).toBe('mithril');
    expect(getMaterialPorAlias('Minério de Honra')?.id).toBe('minerioDeHonra');
    expect(getMaterialPorAlias('Honrineo')?.id).toBe('honrineo');
    expect(getMaterialPorAlias('Minério da Alma')?.id).toBe('metalDasAlmas');
    expect(getMaterialPorAlias('Aço Rubi')?.id).toBe('acoRubi');
  });

  it('liga metais refinados aos minérios de origem', () => {
    const ferro = getMaterialById('ferro');
    expect(ferro.relacoes).toContainEqual({ materialId: 'minerioFerro', tipo: 'origem' });
  });
});

describe('materialRules.js — filtros e ordenação', () => {
  it('filtra por categoria oficial, incluindo o filtro de golens', () => {
    expect(filtrarMateriais(MATERIAL_LIST, { categoria: 'metal' })).toHaveLength(35);
    expect(filtrarMateriais(MATERIAL_LIST, { categoria: 'minerio' })).toHaveLength(5);
    expect(filtrarMateriais(MATERIAL_LIST, { categoria: 'especial' })).toHaveLength(5);
    expect(filtrarMateriais(MATERIAL_LIST, { categoria: 'magico' })).toHaveLength(4);
    const golem = filtrarMateriais(MATERIAL_LIST, { categoria: 'golem' });
    expect(golem).toHaveLength(13);
    expect(golem.some((m) => m.id === 'uru')).toBe(true);
    expect(golem.every((m) => m.aplicacoes.includes('golem'))).toBe(true);
  });

  it('busca por nome, id e alias, ignorando acentos', () => {
    expect(filtrarMateriais(MATERIAL_LIST, { busca: 'mithril' }).map((m) => m.id)).toEqual(['mithril']);
    expect(filtrarMateriais(MATERIAL_LIST, { busca: 'minerio de honra' }).map((m) => m.id)).toEqual(['minerioDeHonra']);
    expect(filtrarMateriais(MATERIAL_LIST, { busca: 'VIDRO DE DRAGAO' }).map((m) => m.id)).toEqual(['obsidiana']);
  });

  it('filtra por raridade, qualidade e bioma', () => {
    const lendarios = filtrarMateriais(MATERIAL_LIST, { raridade: 'lendaria' }).map((m) => m.id);
    expect(lendarios).toHaveLength(5);
    expect(lendarios).toContain('diamante');
    expect(lendarios).toContain('tenebrium');
    expect(filtrarMateriais(MATERIAL_LIST, { raridade: 'mitica' })).toHaveLength(4);
    expect(filtrarMateriais(MATERIAL_LIST, { raridade: 'pendente' })).toHaveLength(18);
    expect(filtrarMateriais(MATERIAL_LIST, { bioma: 'vulcao' }).map((m) => m.id)).toEqual(['obsidiana']);
    for (const material of filtrarMateriais(MATERIAL_LIST, { qualidade: 'pendente' })) {
      expect(material.qualidade).toBeNull();
    }
  });

  it('mantém materiais sem preço no fim ao ordenar por preço', () => {
    const ordenados = ordenarMateriais(MATERIAL_LIST, 'preco-asc');
    expect(ordenados[0].id).toBe('carvaoVegetal');
    const primeiroSemPreco = ordenados.findIndex((m) => m.precoPorKg == null);
    expect(primeiroSemPreco).toBeGreaterThan(0);
    expect(ordenados.slice(primeiroSemPreco).every((m) => m.precoPorKg == null)).toBe(true);
  });

  it('ordena por raridade respeitando a ordem do projeto', () => {
    const ordenados = ordenarMateriais(MATERIAL_LIST, 'raridade');
    const diamante = ordenados.findIndex((m) => m.id === 'diamante');
    const obsidiana = ordenados.findIndex((m) => m.id === 'obsidiana');
    const ferro = ordenados.findIndex((m) => m.id === 'ferro');
    expect(diamante).toBeGreaterThan(obsidiana);
    expect(obsidiana).toBeGreaterThan(ferro);
  });
});

describe('materialRules.js — validação', () => {
  it('as classificações usadas no catálogo existem', () => {
    expect(MATERIAL_CATEGORIAS.minerio).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.metal).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.especial).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.magico).toBeTruthy();
    expect(MATERIAL_CATEGORIAS.pedra).toBeTruthy();
    expect(MATERIAL_RARIDADES.lendaria).toBeTruthy();
    expect(MATERIAL_RARIDADES.muitoRara).toBeTruthy();
    expect(MATERIAL_RARIDADES.mitica).toBeTruthy();
    expect(MATERIAL_QUALIDADES.perfeito).toBeTruthy();
    expect(MATERIAL_QUALIDADES.variavel).toBeTruthy();
  });

  it('valida uma ficha estruturalmente correta', () => {
    expect(validarMaterial(getMaterialById('ferro')).ok).toBe(true);
  });

  it('rejeita categoria, raridade, qualidade e preço inválidos', () => {
    const ferro = getMaterialById('ferro');
    expect(validarMaterial({ ...ferro, categoria: 'inexistente', tipo: 'inexistente' }).ok).toBe(false);
    expect(validarMaterial({ ...ferro, raridade: 'inexistente' }).ok).toBe(false);
    expect(validarMaterial({ ...ferro, qualidade: 'inexistente' }).ok).toBe(false);
    expect(validarMaterial({ ...ferro, precoPorKg: { moedaInexistente: 1 } }).ok).toBe(false);
  });

  it('lista como pendentes os dados que faltam sem bloquear a ficha', () => {
    const campos = camposPendentes(getMaterialById('ferro'));
    expect(campos).toContain('qualidade');
    expect(campos).toContain('fisica.dureza');
    expect(campos).toContain('compatibilidade');
  });
});
