import { describe, it, expect } from 'vitest';
import {
  MATERIAIS,
  MATERIAL_LIST,
  getMaterialById,
  getMateriaisPorCategoria,
  getMateriaisParaGolem,
  getMaterialPorAlias,
  calcularPrecoMaterial,
} from '../../src/game/materials.js';
import {
  formatarPrecoPorKg,
  formatarPrecoQuantidade,
  calcularPrecoPorQuantidade,
  precoKgEmCents,
} from '../../src/game/materialRules.js';

const OFICIAIS = {
  ferroFrio: { raridade: 'rara', qualidade: 'superior', precoCents: 5000 },
  mithril: { raridade: 'epica', qualidade: 'excepcional', precoCents: 12000 },
  electrum: { raridade: 'incomum', qualidade: 'refinado', precoCents: 3000 },
  platina: { raridade: 'rara', qualidade: 'superior', precoCents: 12000 },
  satetsu: { raridade: 'incomum', qualidade: 'variavel', precoCents: 4000 },
  acoRunico: { raridade: 'epica', qualidade: 'superior', precoCents: 5000 },
  acoRubi: { raridade: 'epica', qualidade: 'excepcional', precoCents: 30000 },
  oricalco: { raridade: 'epica', qualidade: 'excepcional', precoCents: 35000 },
  acoDaedrico: { raridade: 'lendaria', qualidade: 'excepcional', precoCents: 40000 },
  tenebrium: { raridade: 'lendaria', qualidade: 'excepcional', precoCents: 45000 },
  aurorum: { raridade: 'muitoRara', qualidade: 'superior', precoCents: 60000 },
  thinaum: { raridade: 'lendaria', qualidade: 'excepcional', precoCents: 65000 },
  uru: { raridade: 'mitica', qualidade: 'perfeito', precoCents: 80000 },
  vibranium: { raridade: 'mitica', qualidade: 'perfeito', precoCents: 100000 },
  prataPandemomico: { raridade: 'lendaria', qualidade: 'excepcional', precoCents: 75000 },
  honrineo: { raridade: 'mitica', qualidade: 'perfeito', precoCents: 250000 },
  minerioDeHonra: { raridade: 'mitica', qualidade: 'perfeito', precoCents: 180000 },
  obsidiana: { raridade: 'incomum', qualidade: 'superior', precoCents: 8000 },
  ouroImperial: { raridade: 'muitoRara', qualidade: 'excepcional', precoCents: null },
  bronzeCelestial: { raridade: 'epica', qualidade: 'excepcional', precoCents: null },
  carvaoVegetal: { raridade: null, qualidade: null, precoCents: 2 },
  carvaoMineral: { raridade: null, qualidade: null, precoCents: 4 },
  antracito: { raridade: null, qualidade: null, precoCents: 15 },
  carvaoMagico: { raridade: null, qualidade: null, precoCents: 15000 },
};

const SEM_PRECO = [
  'minerioFerro', 'minerioCobre', 'minerioEstanho', 'minerioChumbo',
  'ferroDeFebre', 'ouroImperial', 'bronzeCelestial', 'prataSagrada',
  'mournrlode', 'geloEterno', 'ebano', 'stalhrim', 'ruidium', 'adamantino',
  'ferroEstigio', 'metalDasAlmas',
];

const CAMPOS_OBRIGATORIOS = [
  'id', 'nome', 'categoria', 'tipo', 'forma', 'raridade', 'qualidade',
  'precoPorKg', 'bioma', 'descricao', 'fisica', 'compatibilidade',
  'aplicacoes', 'caracteristicasEspeciais', 'efeitosNegativos', 'restricoes',
  'observacoes', 'efeitos', 'relacoes', 'aliases', 'dadosPendentes', 'status',
];

describe('catálogo — dados oficiais do documento', () => {
  it('preserva raridade, qualidade e preço de cada material aprovado', () => {
    for (const [id, esperado] of Object.entries(OFICIAIS)) {
      const material = getMaterialById(id);
      expect(material, id).toBeTruthy();
      expect(material.raridade, `${id}.raridade`).toBe(esperado.raridade);
      expect(material.qualidade, `${id}.qualidade`).toBe(esperado.qualidade);
      expect(precoKgEmCents(material.precoPorKg), `${id}.preco`).toBe(esperado.precoCents);
    }
  });

  it('converte os preços oficiais para centavos de bronze', () => {
    expect(precoKgEmCents(getMaterialById('ferroFrio').precoPorKg)).toBe(5000);
    expect(precoKgEmCents(getMaterialById('minerioDeHonra').precoPorKg)).toBe(180000);
    expect(precoKgEmCents(getMaterialById('honrineo').precoPorKg)).toBe(250000);
    expect(precoKgEmCents(getMaterialById('carvaoVegetal').precoPorKg)).toBe(2);
  });

  it('calcula preço por quantidade sem alterar o preço/kg', () => {
    expect(calcularPrecoPorQuantidade(getMaterialById('ferro'), 2.5)).toBe(13);
    expect(calcularPrecoPorQuantidade(getMaterialById('ferroFrio'), 2)).toBe(10000);
    expect(formatarPrecoQuantidade(getMaterialById('ferro'), 2)).toBe('10 Bronze');
    expect(calcularPrecoMaterial('carvaoVegetal', 3)).toBe(6);
    expect(calcularPrecoPorQuantidade({ bronze: 5 }, -1)).toBeNull();
    expect(calcularPrecoPorQuantidade(getMaterialById('minerioFerro'), 1)).toBeNull();
  });

  it('não inventa preço para fichas sem valor documentado', () => {
    for (const id of SEM_PRECO) {
      const material = getMaterialById(id);
      expect(material, id).toBeTruthy();
      expect(material.precoPorKg, `${id}.precoPorKg`).toBeNull();
      expect(formatarPrecoPorKg(material), `${id}.preco`).toBe('Preço não definido');
    }
  });
});

describe('catálogo — integridade das fichas', () => {
  it('toda ficha tem os campos do schema', () => {
    for (const material of MATERIAL_LIST) {
      for (const campo of CAMPOS_OBRIGATORIOS) {
        expect(Object.prototype.hasOwnProperty.call(material, campo), `${material.id}.${campo}`).toBe(true);
      }
      expect(Array.isArray(material.aplicacoes), material.id).toBe(true);
      expect(Array.isArray(material.dadosPendentes), material.id).toBe(true);
      expect(['pendente', 'completo']).toContain(material.status);
    }
  });

  it('nenhuma ficha tem propriedade inventada em efeitos sem descrição', () => {
    for (const material of MATERIAL_LIST) {
      for (const [chave, efeito] of Object.entries(material.efeitos)) {
        if (!efeito) continue;
        expect(typeof efeito.desc === 'string' || efeito.desc == null, `${material.id}.${chave}`).toBe(true);
        if (efeito.bonus) {
          for (const [atributo, valor] of Object.entries(efeito.bonus)) {
            expect(Number.isFinite(Number(valor)), `${material.id}.${chave}.${atributo}`).toBe(true);
          }
        }
      }
    }
  });

  it('mantém pendentes os materiais cujos efeitos ainda não foram definidos', () => {
    for (const id of ['tenebrium', 'uru', 'vibranium', 'ruidium', 'ferroEstigio', 'metalDasAlmas']) {
      const material = getMaterialById(id);
      expect(Object.values(material.efeitos).some(Boolean), `${id}.efeitos`).toBe(false);
    }
  });

  it('Tenebrium registra os efeitos negativos e as restrições oficiais', () => {
    const tenebrium = getMaterialById('tenebrium');
    expect(tenebrium.efeitosNegativos.some((t) => t.includes('Podridão'))).toBe(true);
    expect(tenebrium.restricoes.some((t) => t.includes('preparação mágica'))).toBe(true);
    expect(tenebrium.observacoes).toContain('5 estágios');
  });

  it('Uru é material de golem e tem núcleo documentado', () => {
    const uru = getMaterialById('uru');
    expect(uru.aplicacoes).toContain('golem');
    expect(uru.caracteristicasEspeciais.some((t) => t.includes('Núcleo'))).toBe(true);
  });

  it('Vibranium registra a absorção de energia cinética', () => {
    const vibranium = getMaterialById('vibranium');
    expect(vibranium.caracteristicasEspeciais.some((t) => t.includes('cinética'))).toBe(true);
  });
});

describe('catálogo — categorias e golems', () => {
  it('separa minérios, metais, especiais e mágicos', () => {
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'minerio')).toHaveLength(5);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'metal')).toHaveLength(35);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'especial')).toHaveLength(5);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'magico')).toHaveLength(4);
    expect(MATERIAL_LIST).toHaveLength(49);
  });

  it('lista os materiais usados em golens por aplicação', () => {
    const golem = getMateriaisParaGolem();
    expect(golem).toHaveLength(13);
    expect(golem.every((m) => m.aplicacoes.includes('golem'))).toBe(true);
    expect(golem.map((m) => m.id)).toContain('uru');
    expect(getMateriaisPorCategoria('golem').map((m) => m.id)).toEqual(golem.map((m) => m.id));
    // O mesmo metal continua disponível em armadura; golem não é categoria exclusiva.
    expect(getMaterialById('aco').categoria).toBe('metal');
    expect(getMaterialById('aco').aplicacoes).toContain('golem');
  });

  it('materiais especiais e mágicos não são forçados a metais', () => {
    for (const id of ['obsidiana', 'diamante', 'carvaoVegetal', 'carvaoMineral', 'antracito']) {
      expect(getMaterialById(id).categoria, id).toBe('especial');
    }
    for (const id of ['geloEterno', 'ebano', 'stalhrim', 'carvaoMagico']) {
      expect(getMaterialById(id).categoria, id).toBe('magico');
    }
  });

  it('mantém todos os ids anteriores no catálogo', () => {
    const esperados = [
      'ferro', 'cobre', 'estanho', 'chumbo', 'bronze', 'ferroForjado',
      'aco', 'prata', 'ouro', 'latão', 'obsidiana', 'diamante',
    ];
    for (const id of esperados) expect(MATERIAIS[id], id).toBeTruthy();
  });
});

describe('catálogo — busca por nome e alias', () => {
  it('encontra pelo nome exato', () => {
    expect(getMaterialPorAlias('Ferro')?.id).toBe('ferro');
    expect(getMaterialPorAlias('Aço-Rubi')?.id).toBe('acoRubi');
  });

  it('encontra por alias com e sem acento', () => {
    // O alias "Honrineo" (sem acento) aponta para "Honríneo".
    expect(getMaterialPorAlias('Honrineo')?.id).toBe('honrineo');
    expect(getMaterialPorAlias('Honríneo')?.id).toBe('honrineo');
    expect(getMaterialPorAlias('aco rubi')?.id).toBe('acoRubi');
    expect(getMaterialPorAlias('Aço Rubi')?.id).toBe('acoRubi');
  });

  it('ignora caixa e espaços nas pontas', () => {
    expect(getMaterialPorAlias('  FERRO FRIO  ')?.id).toBe('ferroFrio');
  });

  it('retorna null para nome vazio ou desconhecido', () => {
    expect(getMaterialPorAlias('')).toBeNull();
    expect(getMaterialPorAlias('   ')).toBeNull();
    expect(getMaterialPorAlias('material inexistente')).toBeNull();
  });
});
