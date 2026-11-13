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
  ouroImperial: { raridade: 'muitoRara', qualidade: 'excepcional', precoCents: 50000 },
  bronzeCelestial: { raridade: 'epica', qualidade: 'excepcional', precoCents: 25000 },
  adamantino: { raridade: null, qualidade: null, precoCents: 20000 },
  ferroDeFebre: { raridade: 'rara', qualidade: 'superior', precoCents: 18000 },
  mournlode: { raridade: null, qualidade: null, precoCents: 70000 },
  ruidium: { raridade: 'mitica', qualidade: 'perfeito', precoCents: 90000 },
  carvaoVegetal: { raridade: null, qualidade: null, precoCents: 2 },
  carvaoMineral: { raridade: null, qualidade: null, precoCents: 4 },
  antracito: { raridade: null, qualidade: null, precoCents: 15 },
  carvaoMagico: { raridade: null, qualidade: null, precoCents: 15000 },
};

const SEM_PRECO = [
  'minerioFerro', 'minerioCobre', 'minerioEstanho', 'minerioChumbo',
  'prataSagrada', 'geloEterno', 'ebano', 'stalhrim',
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
    for (const id of [
      'ruidium', 'ferroEstigio', 'ferroDeFebre', 'ouroImperial', 'bronzeCelestial',
      'mournlode', 'minerioDeHonra', 'minerioDaAlma', 'aurorum', 'prataSagrada',
    ]) {
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

  it('Vibranium registra a direção dos efeitos sem percentuais', () => {
    const vibranium = getMaterialById('vibranium');
    expect(vibranium.efeitos.armadura.desc).toContain('Absorve');
    expect(vibranium.efeitos.golem.desc).toContain('devolve a energia');
    for (const efeito of Object.values(vibranium.efeitos).filter(Boolean)) {
      // A normalização representa ausência de valores como objeto vazio.
      expect(efeito.percentuais || {}).toEqual({});
      expect(efeito.bonus || {}).toEqual({});
    }
    expect(vibranium.efeitosNegativos.some((t) => t.includes('sobrecarga'))).toBe(true);
  });

  it('Adamantino tem preço aprovado e percentuais por categoria', () => {
    const adamantino = getMaterialById('adamantino');
    expect(precoKgEmCents(adamantino.precoPorKg)).toBe(20000);
    expect(adamantino.efeitos.armadura.percentuais['resistência estrutural']).toBe(30);
    expect(adamantino.efeitos.armaLamina.percentuais).toEqual({ dano: 20, perfuração: 15 });
    expect(adamantino.efeitos.golem.percentuais).toEqual({ defesa: 40, ataque: 20, velocidade: -20 });
  });

  it('Honríneo descreve a adaptação automática sem inventar percentuais', () => {
    const honrineo = getMaterialById('honrineo');
    expect(honrineo.raridade).toBe('mitica');
    expect(honrineo.qualidade).toBe('perfeito');
    expect(precoKgEmCents(honrineo.precoPorKg)).toBe(250000);
    for (const chave of ['armadura', 'armaLamina', 'armaImpacto', 'armaFogo', 'acessorio', 'equipamentoMagico']) {
      expect(honrineo.efeitos[chave].desc, chave).toContain('Adaptação automática');
      expect(honrineo.efeitos[chave].percentuais || {}, chave).toEqual({});
    }
    expect(honrineo.efeitos.golem).toBeFalsy();
  });

  it('Mournlode usa a chave correta e fica pendente de efeitos', () => {
    expect(getMaterialById('mournlode')).toBeTruthy();
    expect(getMaterialById('mournlode').nome).toBe('Mournlode');
    expect(MATERIAIS.mournrlode).toBeUndefined();
    expect(precoKgEmCents(getMaterialById('mournlode').precoPorKg)).toBe(70000);
  });

  it('Ruidium tem preço e sistema de Corrupção, sem efeitos numéricos por categoria', () => {
    const ruidium = getMaterialById('ruidium');
    expect(precoKgEmCents(ruidium.precoPorKg)).toBe(90000);
    expect(ruidium.raridade).toBe('mitica');
    expect(ruidium.qualidade).toBe('perfeito');
    expect(ruidium.observacoes).toContain('corrupcao.js');
    expect(Object.values(ruidium.efeitos).some(Boolean)).toBe(false);
  });

  it('Ouro Imperial e Bronze Celestial preservam classificação e preço', () => {
    expect(precoKgEmCents(getMaterialById('ouroImperial').precoPorKg)).toBe(50000);
    expect(precoKgEmCents(getMaterialById('bronzeCelestial').precoPorKg)).toBe(25000);
    expect(Object.values(getMaterialById('ouroImperial').efeitos).some(Boolean)).toBe(false);
    expect(Object.values(getMaterialById('bronzeCelestial').efeitos).some(Boolean)).toBe(false);
  });

  it('metais convencionais registram as propriedades aprovadas no complemento', () => {
    expect(getMaterialById('ouro').caracteristicasEspeciais).toContain('+15% de experiência.');
    expect(getMaterialById('prata').caracteristicasEspeciais)
      .toContain('+20% nos efeitos medicinais e de cura.');
    expect(getMaterialById('cobre').caracteristicasEspeciais)
      .toContain('Conduz eletricidade sem necessidade de revestimento.');
    expect(getMaterialById('chumbo').caracteristicasEspeciais)
      .toContain('Possui 30% de chance de causar envenenamento.');
    expect(getMaterialById('platina').caracteristicasEspeciais).toContain('+25% em efeitos de catalisadores.');
    expect(getMaterialById('electrum').caracteristicasEspeciais)
      .toContain('+5% em bônus de experiência.');
    expect(getMaterialById('electrum').caracteristicasEspeciais)
      .toContain('+5% em efeitos medicinais e de cura.');
    expect(getMaterialById('electrum').caracteristicasEspeciais.join(' ')).not.toContain('aprimoramento físico');
  });

  it('Prata usa os efeitos oficiais de anti-fantasma e anti-maldição', () => {
    const prata = getMaterialById('prata');
    expect(prata.efeitos.armadura.percentuais).toEqual({
      'redução de dano anti-fantasma': 50,
      'redução de dano anti-maldição': 50,
    });
    expect(prata.efeitos.armaLamina.percentuais).toEqual({
      'dano contra fantasmas': 100,
      'dano contra maldições': 100,
    });
    expect(prata.efeitos.geral.percentuais).toEqual({ 'efeitos medicinais e de cura': 20 });
  });

  it('Tenebrium define efeitos por categoria e mantém a Podridão fora dos efeitos', () => {
    const tenebrium = getMaterialById('tenebrium');
    expect(tenebrium.efeitos.armadura.desc).toContain('imunidade');
    expect(tenebrium.efeitos.acessorio.percentuais).toEqual({ 'eficácia de equipamentos de Tenebrium': 10 });
    expect(tenebrium.efeitos.armaLamina.status).toBe('podridao');
    expect(tenebrium.efeitos.golem.especial.modos).toHaveLength(2);
    expect(tenebrium.efeitosNegativos.join(' ')).toContain('curam em 50%');
  });

  it('Uru descreve os efeitos e o Núcleo de Energia sem duplicar a ficha', () => {
    const uru = getMaterialById('uru');
    expect(uru.efeitos.armadura.percentuais['resistência física']).toBe(45);
    expect(uru.efeitos.armaLamina.especial).toContain('Descarga Arcana');
    expect(uru.efeitos.golem.especial).toContain('Núcleo de Uru');
    expect(uru.efeitosNegativos.some((t) => t.includes('mais pesado'))).toBe(true);
  });

  it('Thinaun captura almas sem consumir suas habilidades', () => {
    const thinaun = getMaterialById('thinaum');
    expect(thinaun.efeitos.armaLamina.especial).toContain('Captura de Alma');
    expect(thinaun.efeitos.armadura.percentuais['resistência contra possessão']).toBe(30);
    expect(thinaun.efeitosNegativos.some((t) => t.includes('não utiliza as habilidades'))).toBe(true);
  });

  it('Prata Pandemônica aplica Contaminação Pandemônica, não Podridão nem Corrupção', () => {
    const prata = getMaterialById('prataPandemomico');
    expect(prata.nome).toBe('Prata Pandemônica');
    expect(prata.efeitos.armadura.status).toBe('contaminacaoPandemonica');
    expect(prata.efeitos.armaLamina.chance).toBe(25);
    expect(prata.efeitos.armaLamina.especial).toContain('10% da vida máxima');
    expect(prata.observacoes).toContain('separada da Podridão e da Corrupção');
    expect(prata.efeitos.geral).toBeFalsy();
  });

  it('Obsidiana define efeitos oficiais com penalidades explícitas', () => {
    const obsidiana = getMaterialById('obsidiana');
    expect(obsidiana.efeitos.armadura.percentuais['resistência contra fogo']).toBe(30);
    expect(obsidiana.efeitos.armadura.penalidades['resistência contra impactos contundentes']).toBe(-25);
    expect(obsidiana.efeitos.armaLamina.especial).toContain('sangramento');
    expect(obsidiana.efeitos.golem.penalidades['resistência contra impactos contundentes']).toBe(-20);
  });

  it('Metal das Almas duplica os percentuais da Pedra da Alma e preserva as regras de combate', () => {
    const pedra = getMaterialById('pedraDaAlma');
    const metal = getMaterialById('metalDasAlmas');

    expect(metal.efeitos.armadura.percentuais['resistência a danos espirituais']).toBe(60);
    expect(metal.efeitos.armaLamina.percentuais['dano contra fantasmas e espíritos']).toBe(70);
    expect(metal.efeitos.golem.percentuais['resistência a danos espirituais']).toBe(70);
    expect(metal.efeitos.armadura.percentuais['resistência a danos espirituais'])
      .toBe(pedra.efeitos.armadura.percentuais['resistência a danos espirituais'] * 2);

    expect(metal.regrasCombate).toHaveLength(3);
    expect(metal.regrasCombate.every((regra) => regra.naoDuplicar)).toBe(true);
    expect(metal.regrasCombate.map((regra) => regra.id)).toEqual(['dano', 'protecao', 'potenciaMagica']);
    expect(metal.relacoes).toContainEqual({ materialId: 'minerioDaAlma', tipo: 'origem' });
  });
});

describe('catálogo — categorias e golems', () => {
  it('separa minérios, metais, especiais e mágicos', () => {
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'minerio')).toHaveLength(7);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'metal')).toHaveLength(35);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'especial')).toHaveLength(5);
    expect(MATERIAL_LIST.filter((m) => m.categoria === 'magico')).toHaveLength(5);
    expect(MATERIAL_LIST).toHaveLength(52);
  });

  it('lista os materiais usados em golens por aplicação', () => {
    const golem = getMateriaisParaGolem();
    expect(golem).toHaveLength(25);
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
    for (const id of ['geloEterno', 'ebano', 'stalhrim', 'carvaoMagico', 'pedraDaAlma']) {
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
