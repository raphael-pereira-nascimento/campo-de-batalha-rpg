// ═════════════════════════════════════════════════════════════════════════════════════
// MATERIAIS — Catálogo de minérios, metais e pedras preciosas
// Dados puros. As regras de classificação, validação e composição ficam em materialRules.js.
// ═════════════════════════════════════════════════════════════════════════════════════

import {
  normalizarMaterial,
  normalizarTexto,
  getBiomas,
  precoKgEmCents,
} from './materialRules.js';

function fisicaPendente() {
  return {
    caracteristicas: null,
    dureza: null,
    resistencia: null,
    peso: null,
    densidade: null,
    flexibilidade: null,
    condutividadeMagica: null,
  };
}

// Cria uma ficha pendente sem inventar propriedades, preços ou efeitos.
function pendente(id, nome, tipo, extra = {}) {
  return {
    id,
    nome,
    tipo,
    categoria: extra.categoria || tipo,
    forma: extra.forma || (tipo === 'minerio' ? 'bruto' : tipo === 'metal' ? 'processado' : null),
    raridade: null,
    qualidade: null,
    precoPorKg: null,
    bioma: extra.bioma || null,
    biomas: extra.biomas || [],
    descricao: extra.descricao || null,
    imagem: extra.imagem || null,
    fisica: fisicaPendente(),
    compatibilidade: null,
    aplicacoes: extra.aplicacoes,
    caracteristicasEspeciais: extra.caracteristicasEspeciais || [],
    efeitosNegativos: extra.efeitosNegativos || [],
    restricoes: extra.restricoes || [],
    observacoes: extra.observacoes || null,
    efeitos: {},
    relacoes: extra.relacoes || [],
    aliases: extra.aliases || [],
  };
}

// Efeitos compartilhados por mais de uma categoria de arma. As funções evitam
// repetir o mesmo bloco no catálogo e devolvem um objeto novo a cada chamada.
function efeitoFerroFrioAtaque() {
  return {
    desc: 'Bônus contra fadas, seres feéricos, ilusões e encantamentos.',
    percentuais: {
      'dano contra fadas e seres feéricos': 20,
      'dano contra encantamentos': 10,
    },
    condicoes: ['Contra ilusões, reduz a dificuldade em um nível.'],
    alvo: 'fadas, seres feéricos, ilusões e encantamentos',
  };
}

function efeitoFerroFrioDefesa() {
  return {
    desc: 'Propriedades defensivas contra efeitos feéricos, ilusórios e encantamentos.',
    percentuais: {
      'resistência a efeitos feéricos': 20,
      'resistência a encantamentos': 10,
    },
    condicoes: ['Contra ilusões, reduz a dificuldade em um nível.'],
    alvo: 'efeitos feéricos, ilusórios e encantamentos',
  };
}

function efeitoPrataArma() {
  return {
    desc: 'Dobra o dano contra fantasmas e maldições.',
    percentuais: {
      'dano contra fantasmas': 100,
      'dano contra maldições': 100,
    },
    alvo: 'fantasmas e maldições',
  };
}

function efeitoTenebriumArma() {
  return {
    desc: 'Dano elevado contra classes resistentes e chance de aplicar Podridão.',
    percentuais: {
      'dano contra classes tanque': 65,
      'dano contra classes de vida mediana': 45,
    },
    condicoes: ['Nenhum acréscimo contra classes frágeis.'],
    chance: 15,
    duracao: '3 turnos',
    alvo: 'classes tanque e de vida mediana; Podridão no alvo atingido',
    status: 'podridao',
    especial: 'A Podridão causa 20% da vida máxima do alvo por turno durante 3 turnos.',
  };
}

// Metal das Almas duplica os efeitos comuns da Pedra da Alma, mas nunca os
// efeitos especiais de combate (que ficam em `regrasCombate`, com `naoDuplicar`).
function derivarEfeitosDuplicados(efeitosBase) {
  const efeitos = {};
  for (const [chave, efeito] of Object.entries(efeitosBase || {})) {
    if (!efeito) {
      efeitos[chave] = null;
      continue;
    }
    const percentuais = {};
    for (const [nome, valor] of Object.entries(efeito.percentuais || {})) {
      percentuais[nome] = Number(valor) * 2;
    }
    efeitos[chave] = {
      ...efeito,
      percentuais: Object.keys(percentuais).length ? percentuais : efeito.percentuais,
    };
  }
  return efeitos;
}

const MATERIAIS_BASE = {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // MINÉRIOS — matérias-primas extraídas de minas, cavernas, masmorras e biomas
  // ═══════════════════════════════════════════════════════════════════════════════════
  minerioFerro: pendente('minerioFerro', 'Minério de Ferro', 'minerio'),
  minerioCobre: pendente('minerioCobre', 'Minério de Cobre', 'minerio'),
  minerioEstanho: pendente('minerioEstanho', 'Minério de Estanho', 'minerio'),
  minerioChumbo: pendente('minerioChumbo', 'Minério de Chumbo', 'minerio'),
  minerioDeHonra: pendente('minerioDeHonra', 'Minério de Honra', 'minerio', {
    caracteristicasEspeciais: [
      'Minério original do universo do RPG, extremamente raro.',
      'Negro e arroxeado, semelhante à obsidiana.',
      'Material ferroso com propriedades estruturais semelhantes às do Adamantino.',
      'Utilizado para produzir Honríneo.',
      'Pode originar um Espírito Protetor durante a criação.',
      'Associado à criação da Armadura do Último Honrado.',
    ],
    relacoes: [{ materialId: 'honrineo', tipo: 'origem' }],
  }),
  minerioDaAlma: pendente('minerioDaAlma', 'Minério da Alma', 'minerio', {
    caracteristicasEspeciais: [
      'Matéria-prima necessária para produzir o Metal das Almas.',
    ],
    relacoes: [{ materialId: 'metalDasAlmas', tipo: 'origem' }],
    observacoes: 'Ficha detalhada ainda não recuperada; nenhum efeito foi inventado.',
  }),
  satetsu: pendente('satetsu', 'Satetsu', 'minerio', {
    forma: 'bruto',
    caracteristicasEspeciais: [
      'Também conhecido como Areia de Ferro.',
      'Matéria-prima mineral, não um metal refinado.',
    ],
  }),

  // ═══════════════════════════════════════════════════════════════════════════════════
  // METAIS — materiais obtidos por processamento, refino ou fabricação
  // (inclui ligas e metais especiais; a classificação vem da documentação oficial)
  // ═══════════════════════════════════════════════════════════════════════════════════
  ferroDeFebre: pendente('ferroDeFebre', 'Ferro de Febre', 'metal', {
    caracteristicasEspeciais: ['Acúmulo de calor.'],
    observacoes: 'Ficha completa aprovada no complemento, mas os valores e descrições por categoria ainda não foram recuperados.',
  }),
  ouroImperial: pendente('ouroImperial', 'Ouro Imperial', 'metal'),
  bronzeCelestial: pendente('bronzeCelestial', 'Bronze Celestial', 'metal'),
  acoRunico: pendente('acoRunico', 'Aço Rúnico', 'metal'),
  prataPandemomico: pendente('prataPandemomico', 'Prata Pandemônica', 'metal', {
    aliases: ['Prata Pandemônico'],
  }),
  prataSagrada: pendente('prataSagrada', 'Prata Sagrada', 'metal'),
  thinaum: pendente('thinaum', 'Thinaun', 'metal', {
    aliases: ['Thinaum'],
  }),
  aurorum: pendente('aurorum', 'Aurorum', 'metal'),
  mournlode: pendente('mournlode', 'Mournlode', 'metal', {
    caracteristicasEspeciais: [
      'Energia espiritual.',
      'Purificação de maldições.',
      'Aplicações contra mortos-vivos e criaturas sobrenaturais.',
    ],
    observacoes: 'Preço definido; raridade, qualidade e efeitos individuais por categoria ainda não foram recuperados.',
  }),

  // ═══════════════════════════════════════════════════════════════════════════════════
  // MATERIAIS MÁGICOS — o funcionamento depende de magia, gelo eterno, alma etc.
  // ═══════════════════════════════════════════════════════════════════════════════════
  geloEterno: pendente('geloEterno', 'Gelo Eterno', 'magico', { forma: 'natural' }),
  ebano: pendente('ebano', 'Ébano', 'magico', { forma: 'processado' }),
  stalhrim: pendente('stalhrim', 'Stalhrim', 'magico', { forma: 'natural' }),
  pedraDaAlma: {
    id: 'pedraDaAlma', nome: 'Pedra da Alma', tipo: 'magico', categoria: 'magico',
    forma: null, raridade: null, qualidade: null, precoPorKg: null, bioma: null,
    descricao: 'Material espiritual associado à absorção de almas de criaturas.',
    imagem: null,
    fisica: fisicaPendente(),
    compatibilidade: null,
    caracteristicasEspeciais: [
      'Armazena a essência de criaturas e transmite suas propriedades aos equipamentos.',
      'A aparência e a energia mudam conforme a alma armazenada.',
      'Não pode armazenar almas de jogadores ou seres inteligentes.',
      'Relativamente resistente a impactos físicos, mas vulnerável a ataques espirituais e antimagia.',
    ],
    efeitosNegativos: [
      'Não pode armazenar almas de jogadores ou seres inteligentes.',
      'Vulnerável a ataques espirituais e antimagia.',
    ],
    restricoes: [],
    observacoes: 'As regras de combate especiais não são duplicadas no Metal das Almas.',
    efeitos: {
      armadura: {
        desc: 'Proteção espiritual e contra possessão.',
        percentuais: {
          'resistência a danos espirituais': 30,
          'resistência contra maldições': 20,
          'resistência contra possessão': 25,
          'Mana máxima': 10,
        },
        especial: 'Uma vez por combate, pode reduzir em 50% o dano de um golpe que poderia derrotar o usuário.',
      },
      armaLamina: {
        desc: 'Dano contra fantasmas, espíritos e criaturas amaldiçoadas.',
        percentuais: {
          'dano contra fantasmas e espíritos': 35,
          'dano contra criaturas amaldiçoadas': 25,
          'perfuração espiritual': 20,
          'resistência espiritual ignorada': 20,
        },
        especial: 'Pode atingir criaturas incorpóreas e ignorar 20% da resistência espiritual.',
      },
      armaImpacto: {
        desc: 'Dano contra golens espirituais e criaturas sobrenaturais.',
        percentuais: {
          'dano contra golens espirituais': 30,
          'dano contra criaturas sobrenaturais': 20,
        },
        chance: 20,
        alvo: 'habilidades espirituais ou mágicas em preparação',
        especial: '20% de chance de interromper habilidades espirituais; acertos críticos têm 25% de chance de interromper uma habilidade em preparação.',
      },
      armaFogo: {
        desc: 'Dano e precisão contra criaturas espirituais.',
        percentuais: {
          'dano contra criaturas espirituais': 25,
          'precisão contra fantasmas': 10,
        },
        chance: 15,
        alvo: 'criaturas espirituais',
        especial: 'Chance de causar perturbação espiritual; disparos podem atingir criaturas incorpóreas.',
      },
      acessorio: {
        desc: 'Proteção espiritual e recuperação de Mana.',
        percentuais: {
          'resistência contra maldições': 20,
          'resistência contra possessão': 25,
          'recuperação de Mana': 15,
        },
        especial: 'Detecta criaturas espirituais próximas e permite utilizar uma propriedade passiva de uma alma armazenada.',
      },
      equipamentoMagico: {
        desc: 'Potência de magias espirituais e absorção de almas.',
        percentuais: {
          'potência de magias espirituais': 30,
          'invocação': 20,
          'eficiência de absorção de almas': 25,
          'custo de magias espirituais': -15,
        },
        especial: 'Pode reproduzir uma propriedade mágica da criatura armazenada, se houver compatibilidade.',
      },
      golem: {
        desc: 'Resistência espiritual e recuperação fora de combate.',
        percentuais: {
          'resistência a danos espirituais': 35,
          'dano contra criaturas espirituais': 25,
          'recuperação de vida máxima por turno fora de combate': 5,
        },
        especial: 'Imunidade à possessão; pode utilizar uma propriedade da alma armazenada para desenvolver uma habilidade especial.',
      },
    },
    regrasCombate: [
      {
        id: 'dano',
        descricao: '+300% de dano durante 3 turnos.',
        percentual: 300,
        duracao: '3 turnos',
        naoDuplicar: true,
      },
      {
        id: 'protecao',
        descricao: 'Proteção de 50% durante 3 turnos.',
        percentual: 50,
        duracao: '3 turnos',
        naoDuplicar: true,
      },
      {
        id: 'potenciaMagica',
        descricao: '+300% de potência mágica durante 3 turnos.',
        percentual: 300,
        duracao: '3 turnos',
        naoDuplicar: true,
      },
    ],
    relacoes: [],
    aliases: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════════════
  // MATERIAIS UTILITÁRIOS — preços oficiais do PDF; efeitos ainda pendentes
  // ═══════════════════════════════════════════════════════════════════════════════════
  carvaoVegetal: pendente('carvaoVegetal', 'Carvão Vegetal', 'especial', { forma: 'processado' }),
  carvaoMineral: pendente('carvaoMineral', 'Carvão Mineral', 'especial', { forma: 'bruto' }),
  antracito: pendente('antracito', 'Antracito', 'especial', { forma: 'bruto' }),
  carvaoMagico: pendente('carvaoMagico', 'Carvão Mágico', 'magico', { forma: 'processado' }),

  // ═══════════════════════════════════════════════════════════════════════════════════
  // METAIS JÁ CADASTRADOS NO PROJETO
  // ═══════════════════════════════════════════════════════════════════════════════════
  ferro: {
    id: 'ferro', nome: 'Ferro', tipo: 'metal', forma: 'refinado',
    raridade: 'comum', qualidade: null, precoPorKg: { bronze: 5 }, bioma: 'montanhas',
    descricao: 'O metal mais comum, usado em equipamentos básicos.',
    imagem: 'assets/materiais/ferro.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Dano físico padrão', bonus: { forca: 0 } },
      armaImpacto:  { desc: 'Dano físico padrão', bonus: { forca: 0 } },
      armaFogo:     { desc: 'Sem efeito especial', bonus: {} },
      armadura:     { desc: 'Proteção básica', bonus: { resistencia: 1 } },
      acessorio:    { desc: 'Sem efeito', bonus: {} },
      equipamentoMagico: { desc: 'Sem efeito', bonus: {} },
      golem:        { desc: 'Golem comum', bonus: { resistencia: 1 } },
    },
    relacoes: [{ materialId: 'minerioFerro', tipo: 'origem' }],
    aliases: [],
  },
  cobre: {
    id: 'cobre', nome: 'Cobre', tipo: 'metal', forma: 'refinado',
    raridade: 'comum', qualidade: null, precoPorKg: { bronze: 8 }, bioma: 'caverna',
    descricao: 'Metal maleável, conduz eletricidade e magia levemente.',
    imagem: 'assets/materiais/cobre.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Leve condução mágica', bonus: { inteligencia: 0 } },
      armaImpacto:  { desc: 'Sem efeito', bonus: {} },
      armaFogo:     { desc: '+5% dano de fogo', bonus: { inteligencia: 1 } },
      armadura:     { desc: 'Proteção básica', bonus: { resistencia: 0 } },
      acessorio:    { desc: 'Condução sutil', bonus: { inteligencia: 0 } },
      equipamentoMagico: { desc: 'Condução mana +5%', bonus: { inteligencia: 1 } },
      golem:        { desc: 'Condutor elétrico fraco', bonus: { inteligencia: 0 } },
    },
    relacoes: [{ materialId: 'minerioCobre', tipo: 'origem' }],
    aliases: [],
    caracteristicasEspeciais: [
      'Conduz eletricidade sem necessidade de revestimento.',
    ],
    observacoes: 'O complemento registra “preço aumentado em 10%”, mas não informa a referência usada; o preço atual do projeto foi preservado.',
  },
  estanho: {
    id: 'estanho', nome: 'Estanho', tipo: 'metal', forma: 'refinado',
    raridade: 'comum', qualidade: null, precoPorKg: { bronze: 6 }, bioma: 'caverna',
    descricao: 'Metal macio, usado principalmente em ligas.',
    imagem: 'assets/materiais/estanho.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Sem efeito', bonus: {} },
      armaImpacto:  { desc: 'Sem efeito', bonus: {} },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção mínima', bonus: { resistencia: 0 } },
      acessorio:    { desc: 'Sem efeito', bonus: {} },
      equipamentoMagico: { desc: 'Sem efeito', bonus: {} },
      golem:        { desc: 'Material de enchimento', bonus: {} },
    },
    relacoes: [{ materialId: 'minerioEstanho', tipo: 'origem' }],
    aliases: [],
    caracteristicasEspeciais: [
      'Propriedades semelhantes às do ferro.',
      'Mais macio e maleável que o ferro.',
    ],
  },
  chumbo: {
    id: 'chumbo', nome: 'Chumbo', tipo: 'metal', forma: 'refinado',
    raridade: 'comum', qualidade: null, precoPorKg: { bronze: 10 }, bioma: 'subterraneo',
    descricao: 'Metal pesado, bloqueia magia e radiação.',
    imagem: 'assets/materiais/chumbo.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Pesado, reduz precisão', bonus: { destreza: -1 } },
      armaImpacto:  { desc: 'Dano contundente pesado', bonus: { forca: 1 } },
      armaFogo:     { desc: 'Bloqueia fogo mágico', bonus: { inteligencia: -1 } },
      armadura:     { desc: 'Proteção pesada', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Bloqueia leituras mentais', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Inibe magia', bonus: { inteligencia: -1 } },
      golem:        { desc: 'Pesado e lento', bonus: { resistencia: 2, destreza: -1 } },
    },
    relacoes: [{ materialId: 'minerioChumbo', tipo: 'origem' }],
    aliases: [],
    caracteristicasEspeciais: [
      'Possui 30% de chance de causar envenenamento.',
    ],
    restricoes: [
      'O uso na fabricação de armas exige encantamento ou um processo especializado e complicado.',
    ],
  },
  bronze: {
    id: 'bronze', nome: 'Bronze', tipo: 'metal', forma: 'processado',
    raridade: 'comum', qualidade: null, precoPorKg: { bronze: 15 }, bioma: 'montanhas',
    descricao: 'Liga de cobre e estanho, durável e acessível.',
    imagem: 'assets/materiais/bronze.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Bom equilíbrio', bonus: { forca: 1 } },
      armaImpacto:  { desc: 'Contundente efetivo', bonus: { forca: 1 } },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção sólida', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Resistente', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de bronze resistente', bonus: { resistencia: 2 } },
    },
    relacoes: [
      { materialId: 'cobre', tipo: 'componente' },
      { materialId: 'estanho', tipo: 'componente' },
    ],
    aliases: [],
  },
  ferroForjado: {
    id: 'ferroForjado', nome: 'Ferro Forjado', tipo: 'metal', forma: 'processado',
    raridade: 'incomum', qualidade: null, precoPorKg: { bronze: 25 }, bioma: 'montanhas',
    descricao: 'Ferro trabalhado em forja, mais forte que o ferro bruto.',
    imagem: 'assets/materiais/ferro_forjado.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Lâmina afiada', bonus: { forca: 1, destreza: 1 } },
      armaImpacto:  { desc: 'Impacto pesado', bonus: { forca: 2 } },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção sólida', bonus: { resistencia: 3 } },
      acessorio:    { desc: 'Durável', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de ferro robusto', bonus: { resistencia: 3, forca: 1 } },
    },
    relacoes: [{ materialId: 'ferro', tipo: 'origem' }],
    aliases: [],
  },
  aco: {
    id: 'aco', nome: 'Aço', tipo: 'metal', forma: 'processado',
    raridade: 'incomum', qualidade: null, precoPorKg: { bronze: 40 }, bioma: 'montanhas',
    descricao: 'Liga de ferro e carbono, superior para armas e armaduras.',
    imagem: 'assets/materiais/aco.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Lâmina superior', bonus: { forca: 2 } },
      armaImpacto:  { desc: 'Golpes pesados', bonus: { forca: 3 } },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção excelente', bonus: { resistencia: 4 } },
      acessorio:    { desc: 'Resistente', bonus: { resistencia: 2 } },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de aço formidável', bonus: { resistencia: 4, forca: 2 } },
    },
    relacoes: [{
      materialId: 'ferro', tipo: 'origem',
      observacao: 'Liga de ferro e carbono; o carbono não está cadastrado no catálogo.',
    }],
    aliases: [],
  },
  prata: {
    id: 'prata', nome: 'Prata', tipo: 'metal', forma: 'processado',
    raridade: 'rara', qualidade: null, precoPorKg: { bronze: 100 }, bioma: 'subterraneo',
    descricao: 'Metal precioso, eficaz contra criaturas sobrenaturais.',
    imagem: 'assets/materiais/prata.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Eficaz contra mortos-vivos', bonus: { forca: 1, inteligencia: 1 } },
      armaImpacto:  { desc: 'Contundente sagrado', bonus: { forca: 1, inteligencia: 1 } },
      armaFogo:     { desc: 'Canaliza magia sagrada', bonus: { inteligencia: 2 } },
      armadura:     { desc: 'Resistência a maldições', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Proteção espiritual', bonus: { inteligencia: 1 } },
      equipamentoMagico: { desc: 'Amplifica magia sagrada', bonus: { inteligencia: 2 } },
      golem:        { desc: 'Golem de prata sagrado', bonus: { inteligencia: 2 } },
    },
    relacoes: [],
    aliases: [],
    caracteristicasEspeciais: [
      '+20% nos efeitos medicinais e de cura.',
    ],
    observacoes: 'Os efeitos anti-mortos-vivos das fichas anteriores não foram confirmados neste complemento e devem ser revisados.',
  },
  ouro: {
    id: 'ouro', nome: 'Ouro', tipo: 'metal', forma: 'processado',
    raridade: 'rara', qualidade: null, precoPorKg: { bronze: 200 }, bioma: 'subterraneo',
    descricao: 'Metal precioso, valorizado e maleável.',
    imagem: 'assets/materiais/ouro.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Decorativo, fraco', bonus: { forca: 0 } },
      armaImpacto:  { desc: 'Macio, pouco efetivo', bonus: { forca: 0 } },
      armaFogo:     { desc: 'Conduz magia solar', bonus: { inteligencia: 1 } },
      armadura:     { desc: 'Estética, pouca proteção', bonus: { resistencia: 1 } },
      acessorio:    { desc: 'Símbolo de riqueza', bonus: {} },
      equipamentoMagico: { desc: 'Condução solar', bonus: { inteligencia: 2 } },
      golem:        { desc: 'Golem dourado ornamental', bonus: { inteligencia: 1 } },
    },
    relacoes: [],
    aliases: [],
    caracteristicasEspeciais: [
      '+15% de experiência.',
      '+15% nos efeitos de magia e encantamentos.',
    ],
    observacoes: 'Não há distribuição adicional por categoria recuperada; os efeitos atuais por categoria são dados anteriores do projeto.',
  },
  latão: {
    id: 'latão', nome: 'Latão', tipo: 'metal', forma: 'processado',
    raridade: 'incomum', qualidade: null, precoPorKg: { bronze: 30 }, bioma: 'montanhas',
    descricao: 'Liga de cobre e zinco, usado em armas de fogo e instrumentos.',
    imagem: 'assets/materiais/latao.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Sem efeito', bonus: {} },
      armaImpacto:  { desc: 'Sem efeito', bonus: {} },
      armaFogo:     { desc: 'Condução de pólvora', bonus: { inteligencia: 0 } },
      armadura:     { desc: 'Proteção decorativa', bonus: { resistencia: 0 } },
      acessorio:    { desc: 'Sem efeito', bonus: {} },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de latão dourado', bonus: { resistencia: 1 } },
    },
    relacoes: [{
      materialId: 'cobre', tipo: 'componente',
      observacao: 'Liga de cobre e zinco; o zinco não está cadastrado no catálogo.',
    }],
    aliases: [],
  },
  platina: pendente('platina', 'Platina', 'metal', {
    caracteristicasEspeciais: [
      'Condução mágica 10% superior à do Electrum.',
      '+10% na potência de magias e encantamentos.',
      '-55% de dano ácido de até média potência.',
      '+25% em efeitos de catalisadores.',
      '+25% em efeitos medicinais.',
      'Não possui propriedades anti-fantasma ou anti-maldição da Prata.',
    ],
  }),
  electrum: pendente('electrum', 'Electrum', 'metal', {
    caracteristicasEspeciais: [
      'Conduz eletricidade melhor que outros metais e tem maior afinidade com eletricidade.',
      '+5% de aprimoramento físico dos equipamentos.',
      'Benefícios de suporte inferiores aos do Ouro e da Prata.',
      'Não reproduz o bônus de experiência do Ouro nem os benefícios medicinais da Prata.',
    ],
  }),
  ferroFrio: pendente('ferroFrio', 'Ferro Frio', 'metal'),
  acoDaedrico: pendente('acoDaedrico', 'Aço Daédrico', 'metal'),
  tenebrium: pendente('tenebrium', 'Tenebrium', 'metal'),
  oricalco: pendente('oricalco', 'Oricalco', 'metal'),
  uru: pendente('uru', 'Uru', 'metal'),
  vibranium: pendente('vibranium', 'Vibranium', 'metal'),
  ruidium: pendente('ruidium', 'Ruidium', 'metal'),
  adamantino: pendente('adamantino', 'Adamantino', 'metal', {
    aliases: ['Minério de Adamantino'],
  }),
  mithril: pendente('mithril', 'Mithril', 'metal', {
    aliases: ['Minério de Mithril'],
  }),
  acoRubi: pendente('acoRubi', 'Aço-Rubi', 'metal', {
    aliases: ['Aço Rubi', 'Minério de Aço-Rubi'],
  }),
  ferroEstigio: pendente('ferroEstigio', 'Ferro Estígio', 'metal', {
    aliases: ['Ferro Estigio'],
  }),
  acoNegro: pendente('acoNegro', 'Aço Negro', 'metal', {
    caracteristicasEspeciais: ['Liga especial.'],
    observacoes: 'Ficha detalhada ainda não recuperada; nenhum efeito foi inventado.',
  }),
  honrineo: pendente('honrineo', 'Honríneo', 'metal', {
    aliases: ['Honrineo'],
  }),
  metalDasAlmas: pendente('metalDasAlmas', 'Metal das Almas', 'metal', {
    aliases: ['Metal da Alma'],
    observacoes: 'Produzido a partir do Minério da Alma, que é matéria-prima e possui ficha própria.',
  }),

  // ═══════════════════════════════════════════════════════════════════════════════════
  // MATERIAIS ESPECIAIS — pedras vulcânicas/cristalinas usadas na fabricação
  // (continuam existindo também como gemas no sistema de gemas)
  // ═══════════════════════════════════════════════════════════════════════════════════
  obsidiana: {
    id: 'obsidiana', nome: 'Obsidiana', tipo: 'pedra', forma: null,
    raridade: 'epica', qualidade: null, precoPorKg: { bronze: 200 }, bioma: 'vulcao',
    descricao: 'Vidro vulcânico cortante, usado em lâminas e pontas.',
    imagem: 'assets/materiais/obsidiana.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Corte extremamente afiado', bonus: { forca: 2, destreza: 1 } },
      armaImpacto:  { desc: 'Estilhaça ao impacto', bonus: { forca: 1 } },
      armaFogo:     { desc: 'Resistente ao calor', bonus: { inteligencia: 1 } },
      armadura:     { desc: 'Resistência ao fogo', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Obsidiana protetora', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Canaliza fogo', bonus: { inteligencia: 2 } },
      golem:        { desc: 'Golem de obsidiana cortante', bonus: { forca: 2, resistencia: 2 } },
    },
    relacoes: [],
    aliases: ['Vidro de Dragão'],
  },
  diamante: {
    id: 'diamante', nome: 'Diamante', tipo: 'pedra', forma: null,
    raridade: 'lendaria', qualidade: null, precoPorKg: { bronze: 500 }, bioma: 'subterraneo',
    descricao: 'A pedra mais dura, usada em lâminas e pontas de elite.',
    imagem: 'assets/materiais/diamante.png',
    fisica: fisicaPendente(),
    compatibilidade: null,
    efeitos: {
      armaLamina:   { desc: 'Corte extremamente afiado', bonus: { forca: 3, destreza: 2 } },
      armaImpacto:  { desc: 'Quebra qualquer coisa', bonus: { forca: 3 } },
      armaFogo:     { desc: 'Refrata luz solar', bonus: { inteligencia: 2 } },
      armadura:     { desc: 'Proteção absoluta', bonus: { resistencia: 5 } },
      acessorio:    { desc: 'Brilho protetor', bonus: { resistencia: 2 } },
      equipamentoMagico: { desc: 'Amplifica toda magia', bonus: { inteligencia: 3 } },
      golem:        { desc: 'Golem de diamante lendário', bonus: { resistencia: 5, forca: 3 } },
    },
    relacoes: [],
    aliases: [],
  },
};

// A Pedra da Alma é usada como base para o Metal das Almas (efeitos comuns em
// dobro). As regras especiais de combate ficam fora de `efeitos` justamente para
// não serem duplicadas (decisão oficial registrada na documentação).
const PEDRA_DA_ALMA_EFEITOS = MATERIAIS_BASE.pedraDaAlma.efeitos;
const PEDRA_DA_ALMA_REGRAS_COMBATE = MATERIAIS_BASE.pedraDaAlma.regrasCombate;

// ═════════════════════════════════════════════════════════════════════════════════════
// DADOS OFICIAIS EXTRAÍDOS DA DOCUMENTAÇÃO (raridade, qualidade, preço/kg)
// Só entram aqui informações registradas no PDF. O que não está documentado continua
// pendente — nada é preenchido por estimativa.
// ═════════════════════════════════════════════════════════════════════════════════════
const DADOS_OFICIAIS = {
  ferroFrio: {
    raridade: 'rara', qualidade: 'superior', precoPorKg: { ouro: 5 },
    efeitos: {
      armaLamina: efeitoFerroFrioAtaque(),
      armaImpacto: efeitoFerroFrioAtaque(),
      armaFogo: efeitoFerroFrioAtaque(),
      armadura: efeitoFerroFrioDefesa(),
      acessorio: {
        desc: 'Aplica as propriedades especiais do Ferro Frio.',
        percentuais: {
          'efeitos contra fadas e seres feéricos': 20,
          'efeitos contra encantamentos': 10,
        },
        condicoes: ['Contra ilusões, reduz a dificuldade em um nível.'],
      },
      equipamentoMagico: null,
      golem: null,
    },
    observacoes: 'Não possui desvantagem definida até o momento. Equipamentos mágicos e golens não têm efeitos definidos.',
  },
  mithril: {
    raridade: 'epica', qualidade: 'excepcional', precoPorKg: { ouro: 12 },
    efeitos: {
      armadura: {
        desc: 'Leveza e resistência elevadas.',
        percentuais: { peso: -40, resistência: 15 },
      },
      armaLamina: {
        desc: 'Precisão e velocidade elevadas.',
        percentuais: { precisão: 10, velocidade: 10 },
      },
      armaImpacto: {
        desc: 'Mais velocidade e menos peso.',
        percentuais: { velocidade: 10, peso: -10 },
      },
      armaFogo: {
        desc: 'Mais leve e resistente à corrosão.',
        percentuais: { peso: -15, 'resistência à corrosão': 10 },
      },
      acessorio: {
        desc: 'Aumenta Destreza e Reflexo.',
        percentuais: { destreza: 10, reflexo: 10 },
      },
      equipamentoMagico: {
        desc: 'Reduz o custo da magia vinculada.',
        percentuais: { 'custo da magia vinculada': -10 },
      },
      golem: {
        desc: 'Golem mais rápido e defensivo.',
        percentuais: { velocidade: 25, defesa: 15 },
      },
    },
  },
  electrum: {
    raridade: 'incomum', qualidade: 'refinado', precoPorKg: { ouro: 3 },
    caracteristicasEspeciais: [
      'Condução mágica.',
      'Conduz eletricidade melhor que outros metais e tem maior afinidade com eletricidade.',
      '+5% em bônus de experiência.',
      '+5% em efeitos medicinais e de cura.',
      'Não recebe os bônus de experiência e medicina nos mesmos valores do Ouro e da Prata.',
      'Não possui bônus físico específico definido.',
    ],
    efeitos: {
      geral: {
        desc: 'Propriedades gerais de condução, experiência e cura.',
        percentuais: {
          'bônus de experiência': 5,
          'efeitos medicinais e de cura': 5,
        },
        especial: 'Conduz eletricidade melhor que outros metais, com maior afinidade elétrica. Não possui bônus físico específico definido.',
      },
    },
    observacoes: 'Bônus físico legado removido conforme o documento consolidado; a distribuição por categoria não foi estabelecida, então as propriedades são gerais.',
  },
  prata: {
    efeitos: {
      armadura: {
        desc: 'Reduz o dano de efeitos anti-fantasma e anti-maldição.',
        percentuais: {
          'redução de dano anti-fantasma': 50,
          'redução de dano anti-maldição': 50,
        },
      },
      armaLamina: efeitoPrataArma(),
      armaImpacto: efeitoPrataArma(),
      armaFogo: efeitoPrataArma(),
      geral: {
        desc: 'Efeitos medicinais e de cura ampliados.',
        percentuais: { 'efeitos medicinais e de cura': 20 },
        especial: 'As armaduras reduzem em 50% o dano anti-fantasma e anti-maldição; as armas dobram o dano contra fantasmas e maldições.',
      },
    },
    observacoes: 'Efeitos oficiais da Prata substituem os efeitos legados por categoria (D-30). Armaduras reduzem 50% do dano anti-fantasma/anti-maldição; armas dobram o dano contra fantasmas/maldições; efeitos medicinais +20%.',
  },
  platina: {
    raridade: 'rara', qualidade: 'superior', precoPorKg: { ouro: 12 },
    efeitos: {
      geral: {
        desc: 'Condução mágica, potência de magias e efeitos medicinais.',
        percentuais: {
          'potência de magias e encantamentos': 10,
          'dano ácido de até média potência': -55,
          'efeitos de catalisadores': 25,
          'efeitos medicinais': 25,
        },
        especial: 'Condução mágica 10% superior à do Electrum. Menos maleável que Ouro, Prata e Electrum, com menor resistência a impactos. Não possui os efeitos anti-fantasmas e anti-maldições da Prata.',
      },
    },
    caracteristicasEspeciais: [
      'Condução mágica 10% superior à do Electrum.',
      '+10% na potência de magias e encantamentos.',
      '-55% de dano ácido de até média potência.',
      '+25% em efeitos de catalisadores.',
      '+25% em efeitos medicinais.',
      'Não possui propriedades anti-fantasma ou anti-maldição da Prata.',
    ],
  },
  satetsu: {
    raridade: 'incomum', qualidade: 'variavel', precoPorKg: { ouro: 4 },
    efeitos: {
      armadura: {
        desc: 'Aumenta o dano físico e corpo a corpo do usuário, mas reduz a Mana.',
        percentuais: {
          'dano físico e corpo a corpo do usuário': 50,
          mana: -50,
        },
      },
      armaLamina: {
        desc: 'Dano elevado contra armaduras metálicas.',
        percentuais: { 'dano contra armaduras metálicas': 30 },
      },
      armaImpacto: {
        desc: 'Aumenta a velocidade.',
        percentuais: { velocidade: 20 },
      },
      armaFogo: {
        desc: 'Ajuda contra equipamentos metálicos, mas possui penalidade elétrica.',
        ajustes: { '1d20 contra equipamentos metálicos': 2 },
        especial: 'Possui penalidade elétrica.',
      },
      acessorio: {
        desc: 'Reduz a chance de perda por magia de condução magnética.',
        ajustes: { 'chance de perda por magia de condução magnética': -2 },
      },
      equipamentoMagico: {
        desc: 'Aumenta o dano de magias metálicas e o acerto.',
        percentuais: { 'dano em magias metálicas': 30 },
        ajustes: { '1d20 para acertar': 1 },
      },
      golem: {
        desc: 'Manipulação magnética.',
        ajustes: {
          acerto: 2,
          'dificuldade de ser acertado por ataques metálicos': -2,
        },
        especial: 'Manipulação magnética.',
      },
    },
    observacoes: 'Matéria-prima mineral, não um metal refinado; qualidade variável (D-06).',
  },
  acoRunico: {
    raridade: 'epica', qualidade: 'superior', precoPorKg: { ouro: 5 },
    efeitos: {
      armadura: {
        desc: 'Resistência mágica e contra maldições.',
        percentuais: {
          'resistência contra danos mágicos': 20,
          'resistência contra maldições': 15,
        },
        especial: 'Pode gerar proteção rúnica temporária.',
      },
      armaLamina: {
        desc: 'Dano mágico e físico elevados.',
        percentuais: { 'dano mágico': 15, 'dano físico': 10 },
        especial: 'Runas podem adicionar elementos e melhorar a perfuração.',
      },
      armaImpacto: {
        desc: 'Dano contra golens e estruturas.',
        percentuais: {
          'dano contra golens e estruturas': 20,
          'resistência da arma': 15,
        },
        especial: 'Pode gerar ondas de choque e armazenar energia dos golpes.',
      },
      armaFogo: {
        desc: 'Cano resistente e disparos precisos.',
        percentuais: { 'resistência do cano': 15, precisão: 10 },
        especial: 'Melhora a estabilidade e a eficiência de munição encantada.',
      },
      acessorio: {
        desc: 'Eficiência de encantamentos e resistência mágica.',
        percentuais: {
          'eficiência de encantamentos': 10,
          'resistência a efeitos mágicos negativos': 10,
        },
        especial: 'Pode armazenar uma runa passiva.',
      },
      equipamentoMagico: {
        desc: 'Potência e eficiência de magias rúnicas.',
        percentuais: {
          'potência de magias vinculadas às runas': 20,
          'custo de Mana de magias rúnicas': -10,
          'chance de acerto em magias rúnicas': 15,
        },
        especial: 'Pode armazenar uma magia.',
      },
      golem: {
        desc: 'Defesa e resistência mágica elevadas.',
        percentuais: { defesa: 20, 'resistência mágica': 15 },
        especial: 'Pode usar runas para habilidades especiais e alterá-las trocando runas.',
      },
    },
    observacoes: 'Sistema de runas em runas.js: 2 runas com efeitos +50%; sem Aço Rúnico, 1 runa com efeito reduzido em 50%; runas simultâneas devem ser de elementos diferentes.',
  },
  acoRubi: {
    raridade: 'epica', qualidade: 'excepcional', precoPorKg: { ouro: 30 },
    efeitos: {
      armadura: {
        desc: 'Reduz a chance de receber ataques críticos conforme o peso da armadura.',
        percentuais: {
          'chance de receber ataques críticos — armaduras leves': -15,
          'chance de receber ataques críticos — armaduras médias': -30,
          'chance de receber ataques críticos — armaduras pesadas': -45,
        },
      },
      armaLamina: {
        desc: 'Ignora metade da resistência a danos dos inimigos.',
        percentuais: { 'resistência a danos ignorada': 50 },
        especial: 'Ignora metade da resistência a danos do inimigo; não é um acréscimo de 50% ao dano final.',
      },
      armaImpacto: {
        desc: 'Ignora imunidades, mas causa menos dano contra inimigos imunes.',
        percentuais: { 'dano contra inimigos imunes ao elemento': -50 },
        especial: 'Ignora imunidades a elementos ou determinados tipos de dano.',
      },
      armaFogo: {
        desc: 'Ignora parte da resistência e reduz o barulho dos disparos.',
        percentuais: {
          'resistência a danos ignorada': 25,
          'barulho dos disparos': -50,
        },
      },
      acessorio: {
        desc: 'Reduz o consumo de Mana e aumenta a resistência elemental.',
        percentuais: {
          'consumo de Mana': -25,
          'resistência contra magias elementais': 5,
        },
      },
      equipamentoMagico: {
        desc: 'Aumenta a potência das magias, mas encarece a Mana.',
        percentuais: {
          'potência das magias': 35,
          'aumento do consumo de Mana': 20,
        },
      },
      golem: {
        desc: 'Ignora resistência e aumenta danos críticos.',
        percentuais: {
          'resistência dos inimigos ignorada': 50,
          'danos críticos': 12,
        },
      },
    },
  },
  oricalco: {
    raridade: 'epica', qualidade: 'excepcional', precoPorKg: { ouro: 35 },
    efeitos: {
      armadura: {
        desc: 'Aumenta a velocidade geral do usuário.',
        percentuais: { 'velocidade geral do usuário': 20 },
      },
      armaLamina: {
        desc: 'Ignora proteções mágicas.',
        percentuais: {
          'proteção de escudos mágicos e feitiços de proteção ignorada': 45,
        },
      },
      armaImpacto: {
        desc: 'Interrompe canalização de magias.',
        especial: 'Interrompe instantaneamente a canalização de magias de adversários. Em erro crítico, pode interromper magias de aliados; o aliado mantém a magia com 19 ou 20 no 1d20.',
      },
      armaFogo: {
        desc: 'Ignora parte dos feitiços de proteção, mas consome Mana a cada disparo.',
        percentuais: {
          'feitiços de proteção ignorados': 30,
          'Mana máxima consumida por disparo': 10,
        },
      },
      acessorio: {
        desc: 'Dobra a durabilidade dos equipamentos do usuário.',
        percentuais: { 'durabilidade dos equipamentos do usuário': 100 },
      },
      equipamentoMagico: {
        desc: 'Facilita magias, mas fragiliza o usuário.',
        especial: 'Reduz a dificuldade das magias em um nível.',
        penalidades: {
          'dano recebido pelo usuário': 30,
        },
      },
      golem: {
        desc: 'Corpo inquebrável e roubo de Mana.',
        percentuais: {
          'proteções mágicas ignoradas': 40,
          'Mana adversária roubada em ataques críticos': 65,
        },
        especial: 'O corpo do golem não pode ser quebrado.',
      },
    },
    efeitosNegativos: [
      'Pode quebrar no primeiro golpe ou primeiro uso se o adversário utilizar magia antimagia no ataque ou diretamente contra o usuário.',
    ],
    restricoes: ['Vulnerável à antimagia (regra documentada).'],
    observacoes: 'Propriedades físicas semelhantes às do aço; difícil de manusear e indestrutível contra danos e desgastes naturais, exceto antimagia.',
  },
  acoDaedrico: {
    raridade: 'lendaria', qualidade: 'excepcional', precoPorKg: { ouro: 40 },
    efeitos: {
      armadura: {
        desc: 'Mais resistente e menos grossa que o aço comum.',
        percentuais: { 'resistência contra danos em geral': 45 },
      },
      armaLamina: {
        desc: 'Críticos mais fortes e estrutura reforçada.',
        percentuais: {
          'força dos danos críticos': 15,
          'resistência estrutural': 200,
        },
        especial: 'Três vezes a resistência estrutural das lâminas de aço comum.',
      },
      armaImpacto: {
        desc: 'Chance de atordoar o inimigo.',
        chance: 25,
        alvo: 'inimigo',
        especial: 'Chance de causar atordoamento.',
      },
      armaFogo: {
        desc: 'Não emperra nem explode, mas causa menos dano.',
        percentuais: { dano: -15 },
        especial: 'Reduz em um nível a dificuldade para acertar disparos.',
      },
      acessorio: {
        desc: 'Destreza, Atletismo/Agarre e resistência a cegueira/atordoamento.',
        percentuais: { destreza: 15 },
        ajustes: { '1d20 em Atletismo/Agarre': 1 },
        chance: 15,
        especial: 'Chance de ignorar cegueira e atordoamento.',
      },
      equipamentoMagico: {
        desc: 'Reduz o consumo de Mana.',
        percentuais: { 'consumo de Mana': -20 },
      },
      golem: {
        desc: 'Golem ágil, resistente e imune a atordoamento/cegueira.',
        percentuais: { destreza: 30, resistência: 25, 'vida total': 30 },
        especial: 'Não sofre atordoamento ou cegueira.',
      },
    },
    observacoes: 'Mantido como ficha separada do Uru (D-26); conferir a distinção entre os dois materiais.',
  },
  tenebrium: {
    raridade: 'lendaria', qualidade: 'excepcional', precoPorKg: { ouro: 45 },
    descricao: 'Metal de infusão mágica voltado à Podridão, ao enfraquecimento de adversários e à exploração de classes inimigas.',
    efeitos: {
      armadura: {
        desc: 'Concede imunidade aos danos de Podridão.',
        especial: 'Não pode ser utilizada na armadura inteira.',
      },
      armaLamina: efeitoTenebriumArma(),
      armaImpacto: efeitoTenebriumArma(),
      armaFogo: efeitoTenebriumArma(),
      acessorio: {
        desc: 'Aumenta a eficácia dos equipamentos feitos de Tenebrium.',
        percentuais: { 'eficácia de equipamentos de Tenebrium': 10 },
      },
      equipamentoMagico: {
        desc: 'Substitui o elemento original do equipamento por dano físico e pode aplicar Podridão.',
        chance: 25,
        duracao: '3 turnos',
        alvo: 'alvo atingido',
        status: 'podridao',
        especial: 'A Podridão causa 20% da vida máxima do alvo por turno durante 3 turnos.',
      },
      golem: {
        desc: 'Alterna entre um modo de velocidade e um modo de resistência.',
        especial: {
          descricao: 'Modos do golem de Tenebrium.',
          modos: [
            {
              nome: 'Velocidade',
              percentuais: { velocidade: 60, 'dano recebido': 40 },
              descricao: 'Fica mais frágil e recebe mais dano.',
            },
            {
              nome: 'Resistência',
              percentuais: {
                'dano causado': 30,
                'resistência a danos': 50,
                velocidade: -60,
              },
              descricao: 'Todo dano causado aplica Podridão: 15% de chance, 20% da vida máxima por turno durante 3 turnos.',
            },
          ],
        },
      },
    },
    efeitosNegativos: [
      'Pode provocar Podridão por exposição ou contato.',
      'Armas de Tenebrium curam em 50% do dano que causariam alvos que usam Tenebrium, alvos ligados à Podridão e mortos-vivos.',
    ],
    restricoes: [
      'Exige preparação mágica rigorosa antes do uso em equipamentos.',
      'Não é usado para forjar uma lâmina inteira; é infundido em bordas, ligas e filamentos de metais comuns.',
      'Não existem espadas feitas de 100% Tenebrium puro por forja.',
      'A armadura não pode ser inteira de Tenebrium.',
      'Sem armazenamento em caixa de chumbo ou Pedra de Sangue, o minério pode provocar Podridão no usuário.',
    ],
    observacoes: 'A Podridão possui 5 estágios e progride com o tempo acumulado de exposição (ver podridao.js). Os 20% de dano por turno são calculados sobre a vida máxima do alvo.',
  },
  aurorum:          { raridade: 'muitoRara', qualidade: 'superior',    precoPorKg: { ouro: 60 } },
  thinaum: {
    raridade: 'lendaria', qualidade: 'excepcional', precoPorKg: { ouro: 65 },
    descricao: 'Metal escuro com reflexos violetas, especializado em capturar, aprisionar e impedir a libertação de almas.',
    caracteristicasEspeciais: [
      'Grande afinidade com almas e energias espirituais.',
      'Estrutura resistente e semelhante à do aço.',
      'Aprisiona essências espirituais em sua estrutura.',
      'Não necessita de pedra preciosa para capturar almas.',
      'Não utiliza as habilidades das almas aprisionadas.',
    ],
    efeitos: {
      armadura: {
        desc: 'Resistência espiritual e contra maldições e possessão.',
        percentuais: {
          'resistência contra danos espirituais': 35,
          'resistência contra maldições': 25,
          'resistência contra possessão': 30,
        },
        chance: 10,
        duracao: '2 turnos',
        alvo: 'criatura espiritual que atacar diretamente a armadura',
        especial: 'Prisão Espiritual: 10% de chance de aprisionar temporariamente parte da essência, reduzindo sua potência em 20% por 2 turnos. Criaturas espirituais não possuem diretamente o usuário enquanto a armadura estiver intacta.',
      },
      armaLamina: {
        desc: 'Dano contra fantasmas, espíritos, criaturas amaldiçoadas e criaturas que ressuscitam.',
        percentuais: {
          'dano contra fantasmas e espíritos': 25,
          'dano contra criaturas amaldiçoadas': 20,
          'dano contra criaturas que possuem capacidade de ressuscitar': 15,
        },
        chance: 30,
        alvo: 'inimigo derrotado pelo golpe final',
        especial: 'Captura de Alma: 30% de chance de aprisionar a alma de um inimigo derrotado pelo golpe final.',
      },
      armaImpacto: {
        desc: 'Dano contra golens espirituais e criaturas sobrenaturais, com interrupção espiritual.',
        percentuais: {
          'dano contra golens espirituais': 25,
          'dano contra criaturas sobrenaturais': 20,
          'chance de interromper habilidades espirituais': 20,
        },
        chance: 25,
        duracao: '2 turnos',
        alvo: 'adversário atingido por acerto crítico',
        especial: 'Impacto Aprisionador: acertos críticos possuem 25% de chance de impedir que o adversário utilize habilidades espirituais durante 2 turnos.',
      },
      armaFogo: {
        desc: 'Dano contra criaturas espirituais e que tentam ressuscitar.',
        percentuais: {
          'dano contra criaturas espirituais': 20,
          'precisão contra fantasmas': 15,
          'dano contra inimigos que tentam ressuscitar': 25,
        },
        chance: 20,
        alvo: 'criatura espiritual derrotada pelo disparo',
        especial: 'Munição Aprisionadora: 20% de chance de aprisionar a essência de uma criatura espiritual derrotada pelo disparo.',
      },
      acessorio: {
        desc: 'Resistência a possessão e maldições, com detecção de almas.',
        percentuais: {
          'resistência a possessão': 25,
          'resistência a maldições': 20,
        },
        especial: 'Guardião de Almas: detecta almas aprisionadas e identifica se uma criatura possui alma ou essência espiritual; armazena uma alma capturada enquanto estiver equipado.',
      },
      equipamentoMagico: {
        desc: 'Potência para magias espirituais e de aprisionamento.',
        percentuais: {
          'potência de magias espirituais': 25,
          'potência de magias de aprisionamento': 20,
          'custo de mana de magias de contenção espiritual': -15,
        },
        duracao: '3 turnos',
        alvo: 'área determinada',
        especial: 'Aprisionamento Mágico: cria uma barreira espiritual que impede a saída de almas de uma área durante 3 turnos.',
      },
      golem: {
        desc: 'Golem carcereiro espiritual.',
        percentuais: {
          'resistência contra criaturas espirituais': 30,
          'dano contra fantasmas e seres amaldiçoados': 25,
          'resistência contra possessão': 20,
        },
        especial: 'Carcereiro Espiritual: aprisiona temporariamente uma criatura espiritual derrotada, impedindo seu retorno ao combate por meios sobrenaturais.',
      },
    },
    efeitosNegativos: [
      'Não consome a alma: aprisiona, mas não utiliza as habilidades da criatura.',
      'Cada peça de equipamento pode aprisionar apenas uma alma por vez.',
      'Almas inteligentes não podem ser aprisionadas.',
    ],
    restricoes: ['Almas aprisionadas podem ser libertadas por magia específica ou procedimentos especiais.'],
  },
  uru: {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouro: 80 },
    descricao: 'Metal extremamente resistente e denso, especializado em armazenamento e amplificação de energia mágica.',
    caracteristicasEspeciais: [
      'Excelente condutividade mágica.',
      'Armazena energia mágica e pode liberá-la posteriormente.',
      'Suporta encantamentos complexos sem perder integridade estrutural.',
      'Propriedade especial — Núcleo de Energia: armazena energia recebida de ataques mágicos para usar em seus próprios efeitos.',
    ],
    efeitos: {
      armadura: {
        desc: 'Resistência física, mágica, a impactos e a elementos.',
        percentuais: {
          'resistência física': 45,
          'resistência mágica': 35,
          'resistência contra impactos': 25,
          'resistência contra elementos': 20,
        },
        especial: 'Absorve 20% do dano mágico recebido e armazena essa energia para fortalecer a defesa ou alimentar um encantamento.',
      },
      armaLamina: {
        desc: 'Dano físico, resistência estrutural e perfuração elevados.',
        percentuais: {
          'dano físico': 25,
          'resistência estrutural da arma': 20,
          perfuração: 15,
          'dano contra adversários protegidos por escudos mágicos': 20,
        },
        especial: 'Descarga Arcana: libera a energia armazenada em um ataque, acrescentando 30% de dano mágico ao golpe.',
      },
      armaImpacto: {
        desc: 'Impacto físico elevado contra golens e estruturas.',
        percentuais: {
          'dano físico': 35,
          'dano contra golens e estruturas': 25,
          'resistência da arma': 20,
          'chance de atordoar adversários': 15,
        },
        especial: 'Impacto Energético: acumula energia equivalente a 5% do dano causado; ao liberar, causa um ataque adicional equivalente a 50% da energia armazenada.',
      },
      armaFogo: {
        desc: 'Cano resistente, preciso e protegido contra superaquecimento.',
        percentuais: {
          'resistência do cano': 25,
          precisão: 15,
          'resistência contra superaquecimento': 20,
          'dano contra criaturas mágicas': 20,
        },
        especial: 'Munição Arcana: transfere energia mágica para a munição, que pode receber até +30% de dano mágico adicional.',
      },
      acessorio: {
        desc: 'Resistência mágica, recuperação de mana e potência de encantamentos.',
        percentuais: {
          'resistência mágica': 20,
          'recuperação de mana': 20,
          'potência de encantamentos': 15,
          'resistência contra efeitos negativos mágicos': 15,
        },
        especial: 'Reserva Arcana: armazena energia equivalente a 20% da Mana Máxima do usuário para pagar custos de magias.',
      },
      equipamentoMagico: {
        desc: 'Potência, estabilidade e eficiência mágica elevadas.',
        percentuais: {
          'potência mágica': 40,
          'estabilidade dos encantamentos': 25,
          'custo de mana': -20,
          'precisão de magias no 1d20': 20,
        },
        especial: 'Amplificação Arcana: armazena uma magia preparada e permite liberá-la sem prepará-la novamente, respeitando a capacidade do equipamento.',
      },
      golem: {
        desc: 'Golem resistente, energizado e capaz de converter energia mágica em ataques.',
        percentuais: {
          resistência: 45,
          'vida máxima': 30,
          dano: 25,
          'resistência mágica': 20,
        },
        especial: 'Núcleo de Uru: absorve 20% do dano mágico recebido e converte a energia armazenada em ataques mágicos ou em encantamentos próprios.',
      },
    },
    efeitosNegativos: [
      'É mais pesado que Mithril e Aço Rúnico.',
      'Encantamentos complexos exigem maior preparação.',
      'A energia armazenada não pode ultrapassar a capacidade do equipamento.',
      'Sobrecarga pode liberar uma descarga mágica descontrolada.',
    ],
    restricoes: ['Exige técnicas extremamente avançadas de fabricação.'],
  },
  vibranium:        {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouro: 100 },
    descricao: 'Absorve, armazena e redistribui energia, com especialização em energia cinética e impactos.',
    caracteristicasEspeciais: [
      'Absorção de energia.',
      'Armazenamento de energia.',
      'Redistribuição de energia.',
      'Especialização em energia cinética e impactos.',
    ],
    // Apenas a direção dos efeitos foi aprovada; não há percentuais recuperados.
    efeitos: {
      armadura:          { desc: 'Absorve parte da energia dos impactos recebidos.' },
      armaLamina:        { desc: 'Acumula energia durante os golpes.' },
      armaImpacto:       { desc: 'Libera energia acumulada nos ataques.' },
      armaFogo:          { desc: 'Absorve ou controla o recuo dos disparos.' },
      acessorio:         { desc: 'Oferece proteção contra impactos.' },
      equipamentoMagico: { desc: 'Armazena energia para utilização mágica posterior.' },
      golem:             { desc: 'Absorve ataques e devolve a energia aos adversários.' },
    },
    efeitosNegativos: [
      'Capacidade máxima de armazenamento.',
      'Possibilidade de sobrecarga.',
      'Dificuldade de fabricação.',
    ],
    observacoes: 'Direção dos efeitos aprovada, mas os valores numéricos individuais ainda não foram recuperados e não são regras definitivas.',
  },
  prataPandemomico: {
    raridade: 'lendaria', qualidade: 'excepcional', precoPorKg: { ouro: 75 },
    descricao: 'Prata contaminada por uma energia mágica anormal, capaz de transmitir doenças sobrenaturais, enfraquecer criaturas e provocar alterações no organismo.',
    caracteristicasEspeciais: [
      'Energia mágica contaminante.',
      'Afinidade com magia de veneno, maldição e corrupção.',
      'Sua presença provoca desconforto em seres sagrados.',
      'Coloração prateada escurecida, com veios roxos, negros ou avermelhados.',
    ],
    efeitos: {
      armadura: {
        desc: 'Resistência contra venenos, maldições, criaturas sagradas e magias de luz.',
        percentuais: {
          'resistência contra venenos': 35,
          'resistência contra maldições': 25,
          'resistência contra criaturas sagradas': 30,
          'resistência contra magias de luz': 20,
        },
        chance: 20,
        duracao: '2 turnos',
        alvo: 'criaturas sagradas que atingirem diretamente a armadura',
        status: 'contaminacaoPandemonica',
        especial: 'Contaminação Profana: 20% de chance de contaminar criaturas sagradas por 2 turnos.',
      },
      armaLamina: {
        desc: 'Dano elevado contra seres sagrados, criaturas de luz e criaturas curativas.',
        percentuais: {
          'dano contra seres sagrados': 35,
          'dano contra criaturas de luz': 30,
          'dano contra criaturas curativas': 25,
        },
        chance: 25,
        duracao: '3 turnos',
        alvo: 'adversário atingido',
        status: 'contaminacaoPandemonica',
        especial: 'Ferida Pandemônica: 25% de chance de provocar contaminação, causando 10% da vida máxima do adversário por turno durante 3 turnos.',
      },
      armaImpacto: {
        desc: 'Dano contra seres sagrados, golens de luz e criaturas sobrenaturais.',
        percentuais: {
          'dano contra seres sagrados': 30,
          'dano contra golens de luz': 25,
          'dano contra criaturas sobrenaturais': 20,
        },
        chance: 30,
        duracao: '2 turnos',
        alvo: 'habilidades de cura ou proteção sagrada',
        status: 'contaminacaoPandemonica',
        especial: 'Ruptura Profana: acertos críticos têm 30% de chance de interromper habilidades de cura ou proteção sagrada por 2 turnos.',
      },
      armaFogo: {
        desc: 'Dano contra criaturas sagradas e de luz, com precisão contra equipamentos sagrados.',
        percentuais: {
          'dano contra criaturas sagradas': 30,
          'dano contra criaturas de luz': 25,
          'precisão contra adversários que utilizam equipamentos sagrados': 15,
        },
        chance: 20,
        duracao: '3 turnos',
        alvo: 'adversário atingido',
        status: 'contaminacaoPandemonica',
        especial: 'Munição Contaminante: 20% de chance de aplicar contaminação por 3 turnos.',
      },
      acessorio: {
        desc: 'Resistência contra contaminação, maldições e magias de luz.',
        percentuais: {
          'resistência contra contaminação': 30,
          'resistência contra maldições': 25,
          'resistência contra magias de luz': 20,
        },
        especial: 'Percepção Pandemônica: identifica seres sagrados, equipamentos consagrados e fontes de energia sagrada nas proximidades.',
      },
      equipamentoMagico: {
        desc: 'Potência para magias de veneno, corrupção e maldição.',
        percentuais: {
          'potência de magias de veneno': 40,
          'potência de magias de corrupção': 35,
          'eficiência de magias de maldição': 25,
          'custo de mana de magias de contaminação': -15,
        },
        especial: 'Profanação Mágica: magias contra seres sagrados recebem +30% de potência adicional.',
      },
      golem: {
        desc: 'Golem profano, resistente à luz e perigoso contra criaturas sagradas.',
        percentuais: {
          'resistência contra magias de luz': 35,
          'dano contra criaturas sagradas': 30,
          'dano contra golens de luz': 25,
          'resistência contra maldições': 20,
        },
        duracao: '2 turnos',
        alvo: 'inimigos próximos',
        status: 'contaminacaoPandemonica',
        especial: 'Núcleo Pandemônico: libera uma área de contaminação que reduz em 25% a potência de cura e proteção dos inimigos próximos por 2 turnos.',
      },
    },
    efeitosNegativos: [
      'Seres sagrados podem detectar sua presença.',
      'Equipamentos de Prata Sagrada podem purificar sua contaminação.',
      'A fabricação exige isolamento para impedir contaminação de outros materiais.',
      'Usuários sem proteção adequada podem sofrer contaminação por contato prolongado.',
      'Não recebe bônus especiais contra criaturas comuns.',
    ],
    observacoes: 'A Contaminação Pandemônica é uma condição própria, separada da Podridão e da Corrupção (ver contaminacao.js).',
  },
  ouroImperial:     { raridade: 'muitoRara', qualidade: 'excepcional', precoPorKg: { ouro: 50 } },
  bronzeCelestial:  { raridade: 'epica',     qualidade: 'excepcional', precoPorKg: { ouro: 25 } },
  adamantino: {
    precoPorKg: { ouro: 20 },
    descricao: 'Material especializado em resistência estrutural extrema.',
    efeitos: {
      armadura: {
        desc: 'Resistência estrutural extrema.',
        percentuais: {
          'resistência estrutural': 30,
          'resistência a impactos': 15,
          'velocidade do usuário': -10,
        },
      },
      armaLamina: {
        desc: 'Dano elevado e maior perfuração.',
        percentuais: { dano: 20, perfuração: 15 },
      },
      armaImpacto: {
        desc: 'Eficácia contra estruturas e escudos.',
        percentuais: { 'eficácia contra estruturas e escudos': 25 },
      },
      armaFogo: {
        desc: 'Cano mais resistente.',
        percentuais: { 'resistência do cano': 20 },
      },
      acessorio: {
        desc: 'Proteção adicional.',
        percentuais: { proteção: 15 },
      },
      equipamentoMagico: {
        desc: 'Estabilidade mágica aumentada.',
        percentuais: { 'estabilidade mágica': 15 },
      },
      golem: {
        desc: 'Golem defensivo e mais lento.',
        percentuais: { defesa: 40, ataque: 20, velocidade: -20 },
      },
    },
    observacoes: 'Preço e efeitos aprovados no complemento do catálogo; raridade e qualidade não foram informadas.',
  },
  ferroDeFebre: {
    raridade: 'rara', qualidade: 'superior', precoPorKg: { ouro: 18 },
    caracteristicasEspeciais: ['Acúmulo de calor.'],
    observacoes: 'Ficha completa aprovada no complemento, mas os valores e descrições por categoria ainda não foram recuperados.',
  },
  mournlode: {
    precoPorKg: { ouro: 70 },
    caracteristicasEspeciais: [
      'Energia espiritual.',
      'Purificação de maldições.',
      'Aplicações contra mortos-vivos e criaturas sobrenaturais.',
    ],
    observacoes: 'Preço definido; raridade, qualidade e efeitos individuais por categoria ainda não foram recuperados.',
  },
  honrineo:         {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouropla: 25 },
    descricao: 'Adapta automaticamente o equipamento às necessidades e características do usuário.',
    caracteristicasEspeciais: [
      'Adaptação automática ao usuário.',
      'A adaptação pode alterar peso, rigidez, maleabilidade, forma, equilíbrio e características de utilização.',
      'Produzido a partir do Minério de Honra.',
    ],
    // Apenas a propriedade de adaptação foi aprovada; não há percentuais recuperados.
    efeitos: {
      armadura:          { desc: 'Adaptação automática às características do usuário.' },
      armaLamina:        { desc: 'Adaptação automática às características do usuário.' },
      armaImpacto:       { desc: 'Adaptação automática às características do usuário.' },
      armaFogo:          { desc: 'Adaptação automática às características do usuário.' },
      acessorio:         { desc: 'Adaptação automática às características do usuário.' },
      equipamentoMagico: { desc: 'Adaptação automática às características do usuário.' },
    },
    observacoes: 'A propriedade de adaptação está aprovada, mas não há números específicos recuperados para cada categoria.',
  },
  minerioDeHonra:   {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouropla: 18 },
    aliases: ['Minério da Honra'],
  },
  ferroEstigio:     {
    restricoes: ['Exige treinamento específico para dominar seus efeitos.'],
  },
  ruidium:          {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouro: 90 },
    descricao: 'Material ligado à influência psíquica, manipulação mental, ilusões e alteração de percepção.',
    caracteristicasEspeciais: [
      'Influência psíquica.',
      'Manipulação mental.',
      'Ilusões.',
      'Alteração de percepção.',
      'Corrupção progressiva da mente e da autonomia.',
    ],
    observacoes: 'Possui sistema próprio de Corrupção implementado em corrupcao.js. Não há bônus numéricos específicos de fabricação por categoria.',
  },
  metalDasAlmas: {
    descricao: 'Metal espiritual que transmite as propriedades da alma armazenada com os efeitos da Pedra da Alma em dobro, mas é extremamente frágil.',
    efeitos: derivarEfeitosDuplicados(PEDRA_DA_ALMA_EFEITOS),
    regrasCombate: PEDRA_DA_ALMA_REGRAS_COMBATE,
    efeitosNegativos: [
      'Fragilidade extrema durante a fabricação e a utilização.',
      'Um erro de fabricação pode inutilizar o material.',
      'O metal pronto é extremamente vulnerável a impactos e falhas críticas.',
      'Sua estrutura física é muito inferior à de metais convencionais.',
    ],
    restricoes: [
      'Produzido a partir do Minério da Alma.',
      'Exige muito cuidado e precisão durante a fabricação.',
    ],
    relacoes: [{ materialId: 'minerioDaAlma', tipo: 'origem' }],
    observacoes: 'Os efeitos comuns da Pedra da Alma são duplicados; os três efeitos especiais de combate (+300% de dano, 50% de proteção e +300% de potência mágica por 3 turnos) não são duplicados.',
  },
  obsidiana: {
    raridade: 'incomum', qualidade: 'superior', precoPorKg: { ouro: 8 },
    descricao: 'Vidro vulcânico extremamente cortante, com afinidade por fogo e escuridão.',
    efeitos: {
      armadura: {
        desc: 'Resistência contra fogo, escuridão e maldições, com leveza e fragilidade a impactos.',
        percentuais: {
          'resistência contra fogo': 30,
          'resistência contra escuridão': 25,
          'resistência contra maldições': 20,
          peso: -15,
        },
        penalidades: {
          'resistência contra impactos contundentes': -25,
        },
        chance: 20,
        especial: 'Proteção Vulcânica: 20% de chance de reduzir em 50% o dano de fogo recebido.',
      },
      armaLamina: {
        desc: 'Dano físico, perfuração e dano contra criaturas de fogo elevados.',
        percentuais: {
          'dano físico': 35,
          perfuração: 25,
          'dano contra criaturas de fogo': 20,
        },
        penalidades: {
          'resistência estrutural contra impactos fortes': -30,
        },
        chance: 25,
        duracao: '2 turnos',
        alvo: 'adversário atingido',
        especial: 'Fio Obsidiano: 25% de chance de causar sangramento por 2 turnos.',
      },
      armaImpacto: {
        desc: 'Dano físico e contra criaturas de fogo e sombrias.',
        percentuais: {
          'dano físico': 20,
          'dano contra criaturas de fogo': 25,
          'dano contra criaturas sombrias': 15,
        },
        penalidades: {
          'resistência estrutural da arma': -30,
        },
        especial: 'Fragmentação Obsidiana: acertos críticos liberam fragmentos que causam 20% do dano original aos inimigos próximos.',
      },
      armaFogo: {
        desc: 'Precisão, dano contra criaturas de fogo e resistência à corrosão.',
        percentuais: {
          precisão: 20,
          'dano contra criaturas de fogo': 15,
          'resistência contra corrosão': 10,
          'perfuração da munição': 25,
        },
        especial: 'Projétil Obsidiano: munições recebem +25% de perfuração, mas são frágeis e podem quebrar antes do disparo.',
      },
      acessorio: {
        desc: 'Resistência contra fogo, escuridão e maldições.',
        percentuais: {
          'resistência contra fogo': 20,
          'resistência contra escuridão': 15,
          'resistência contra maldições': 10,
        },
        especial: 'Visão Vulcânica: detecta fontes de calor e criaturas próximas que emitem energia térmica.',
      },
      equipamentoMagico: {
        desc: 'Potência para magias de fogo e escuridão.',
        percentuais: {
          'potência de magias de fogo': 25,
          'potência de magias de escuridão': 25,
          'estabilidade mágica': 15,
          'custo de mana de magias de fogo': -10,
        },
        especial: 'Amplificação Vulcânica: magias de fogo recebem +30% de potência adicional em ambientes vulcânicos.',
      },
      golem: {
        desc: 'Golem ofensivo de fogo e escuridão, frágil a impactos contundentes.',
        percentuais: {
          'dano físico': 30,
          'resistência contra fogo': 35,
          'dano de fogo': 25,
          defesa: 20,
        },
        penalidades: {
          'resistência contra impactos contundentes': -20,
        },
        especial: 'Núcleo Vulcânico: acumula calor durante o combate e libera uma explosão de fragmentos incandescentes que causa dano aos inimigos próximos.',
      },
    },
    efeitosNegativos: [
      'É vulnerável a impactos contundentes.',
      'Não pode ser trabalhada em forjas convencionais.',
      'Equipamentos de obsidiana podem sofrer fraturas se utilizados de maneira inadequada.',
      'Não possui resistência especial contra gelo.',
    ],
    restricoes: ['Exige técnicas de fabricação diferentes das utilizadas em metais.'],
  },
  carvaoVegetal:    { precoPorKg: { bronze: 2 } },
  carvaoMineral:    { precoPorKg: { bronze: 4 } },
  antracito:        { precoPorKg: { bronze: 15 } },
  carvaoMagico:     { precoPorKg: { ouro: 15 } },
};

export const MATERIAIS = Object.fromEntries(
  Object.entries(MATERIAIS_BASE).map(([id, material]) => {
    const oficial = DADOS_OFICIAIS[id] || {};
    return [id, normalizarMaterial({ ...material, ...oficial, id })];
  }),
);

export const MATERIAL_LIST = Object.values(MATERIAIS);
export const MATERIAL_IDS = Object.keys(MATERIAIS);

export function getMaterialById(id) {
  return MATERIAIS[id] || null;
}

export function getMateriaisPorTipo(tipo) {
  return MATERIAL_LIST.filter((material) => material.tipo === tipo);
}

export function getMateriaisPorCategoria(categoria) {
  if (!categoria || categoria === 'todas') return MATERIAL_LIST;
  // "Materiais utilizados em golens" é um filtro por aplicação.
  if (categoria === 'golem') return getMateriaisParaGolem();
  return MATERIAL_LIST.filter((material) => material.categoria === categoria);
}

export function getMateriaisParaGolem() {
  return MATERIAL_LIST.filter((material) => (material.aplicacoes || []).includes('golem'));
}

export function getMateriaisPorRaridade(raridade) {
  return MATERIAL_LIST.filter((material) => material.raridade === raridade);
}

export function getMateriaisPorQualidade(qualidade) {
  return MATERIAL_LIST.filter((material) => material.qualidade === qualidade);
}

export function getMateriaisPorBioma(bioma) {
  return MATERIAL_LIST.filter((material) => getBiomas(material).includes(bioma));
}

export function getMateriaisPendentes() {
  return MATERIAL_LIST.filter((material) => material.status === 'pendente');
}

export function getMateriaisCompletos() {
  return MATERIAL_LIST.filter((material) => material.status === 'completo');
}

export function getMaterialPorAlias(nomeOuAlias) {
  const alvo = normalizarTexto(nomeOuAlias);
  if (!alvo) return null;
  return MATERIAL_LIST.find((material) => (
    normalizarTexto(material.nome) === alvo
    || (material.aliases || []).some((alias) => normalizarTexto(alias) === alvo)
  )) || null;
}

export function calcularPrecoMaterial(id, quantidadeKg) {
  const material = getMaterialById(id);
  if (!material) return 0;
  const precoKg = precoKgEmCents(material.precoPorKg);
  if (precoKg == null) return 0;
  return Math.round(precoKg * quantidadeKg);
}
