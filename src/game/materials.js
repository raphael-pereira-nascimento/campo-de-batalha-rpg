// ═════════════════════════════════════════════════════════════════════════════════════
// MATERIAIS — Catálogo de minérios, metais e pedras preciosas
// Dados puros. As regras de classificação, validação e composição ficam em materialRules.js.
// ═════════════════════════════════════════════════════════════════════════════════════

import {
  normalizarMaterial,
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
    aplicacoes: extra.aplicacoes || [],
    caracteristicasEspeciais: extra.caracteristicasEspeciais || [],
    efeitosNegativos: extra.efeitosNegativos || [],
    restricoes: extra.restricoes || [],
    observacoes: extra.observacoes || null,
    efeitos: {},
    relacoes: extra.relacoes || [],
    aliases: extra.aliases || [],
  };
}

const MATERIAIS_BASE = {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // MINÉRIOS — matérias-primas extraídas de minas, cavernas, masmorras e biomas
  // ═══════════════════════════════════════════════════════════════════════════════════
  minerioFerro: pendente('minerioFerro', 'Minério de Ferro', 'minerio'),
  minerioCobre: pendente('minerioCobre', 'Minério de Cobre', 'minerio'),
  minerioEstanho: pendente('minerioEstanho', 'Minério de Estanho', 'minerio'),
  minerioChumbo: pendente('minerioChumbo', 'Minério de Chumbo', 'minerio'),
  minerioDeHonra: pendente('minerioDeHonra', 'Minério de Honra', 'minerio'),

  // ═══════════════════════════════════════════════════════════════════════════════════
  // METAIS — materiais obtidos por processamento, refino ou fabricação
  // (inclui ligas e metais especiais; a classificação vem da documentação oficial)
  // ═══════════════════════════════════════════════════════════════════════════════════
  ferroDeFebre: pendente('ferroDeFebre', 'Ferro de Febre', 'metal'),
  ouroImperial: pendente('ouroImperial', 'Ouro Imperial', 'metal'),
  bronzeCelestial: pendente('bronzeCelestial', 'Bronze Celestial', 'metal'),
  satetsu: pendente('satetsu', 'Satetsu', 'metal'),
  acoRunico: pendente('acoRunico', 'Aço Rúnico', 'metal'),
  prataPandemomico: pendente('prataPandemomico', 'Prata Pandemônico', 'metal', {
    aliases: ['Prata Pandemônica'],
  }),
  prataSagrada: pendente('prataSagrada', 'Prata Sagrada', 'metal'),
  thinaum: pendente('thinaum', 'Thinaum', 'metal'),
  aurorum: pendente('aurorum', 'Aurorum', 'metal'),
  mournrlode: pendente('mournlode', 'Mournlode', 'metal'),

  // ═══════════════════════════════════════════════════════════════════════════════════
  // MATERIAIS MÁGICOS — o funcionamento depende de magia, gelo eterno, alma etc.
  // ═══════════════════════════════════════════════════════════════════════════════════
  geloEterno: pendente('geloEterno', 'Gelo Eterno', 'magico', { forma: 'natural' }),
  ebano: pendente('ebano', 'Ébano', 'magico', { forma: 'processado' }),
  stalhrim: pendente('stalhrim', 'Stalhrim', 'magico', { forma: 'natural' }),

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
  platina: pendente('platina', 'Platina', 'metal'),
  electrum: pendente('electrum', 'Electrum', 'metal'),
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
  honrineo: pendente('honrineo', 'Honríneo', 'metal', {
    aliases: ['Honrineo'],
  }),
  metalDasAlmas: pendente('metalDasAlmas', 'Metal das Almas', 'metal', {
    aliases: ['Minério da Alma', 'Metal da Alma'],
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

// ═════════════════════════════════════════════════════════════════════════════════════
// DADOS OFICIAIS EXTRAÍDOS DA DOCUMENTAÇÃO (raridade, qualidade, preço/kg)
// Só entram aqui informações registradas no PDF. O que não está documentado continua
// pendente — nada é preenchido por estimativa.
// ═════════════════════════════════════════════════════════════════════════════════════
const DADOS_OFICIAIS = {
  ferroFrio:        { raridade: 'rara',      qualidade: 'superior',    precoPorKg: { ouro: 5 } },
  mithril:          { raridade: 'epica',     qualidade: 'excepcional', precoPorKg: { ouro: 12 } },
  electrum:         { raridade: 'incomum',   qualidade: 'refinado',    precoPorKg: { ouro: 3 } },
  platina:          { raridade: 'rara',      qualidade: 'superior',    precoPorKg: { ouro: 12 } },
  satetsu:          { raridade: 'incomum',   qualidade: 'variavel',    precoPorKg: { ouro: 4 } },
  acoRunico:        { raridade: 'epica',     qualidade: 'superior',    precoPorKg: { ouro: 5 } },
  acoRubi:          { raridade: 'epica',     qualidade: 'excepcional', precoPorKg: { ouro: 30 } },
  oricalco:         {
    raridade: 'epica', qualidade: 'excepcional', precoPorKg: { ouro: 35 },
    restricoes: ['Vulnerável à antimagia (regra documentada).'],
  },
  acoDaedrico:      { raridade: 'lendaria',  qualidade: 'excepcional', precoPorKg: { ouro: 40 } },
  tenebrium:        {
    raridade: 'lendaria', qualidade: 'excepcional', precoPorKg: { ouro: 45 },
    efeitosNegativos: ['Pode provocar Podridão por exposição ou contato.'],
    restricoes: ['Exige preparação mágica rigorosa antes do uso em equipamentos.'],
    observacoes: 'A Podridão possui 5 estágios e progride com o tempo acumulado de exposição (ver podridao.js).',
  },
  aurorum:          { raridade: 'muitoRara', qualidade: 'superior',    precoPorKg: { ouro: 60 } },
  thinaum:          { raridade: 'lendaria',  qualidade: 'excepcional', precoPorKg: { ouro: 65 } },
  uru:              {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouro: 80 },
    aplicacoes: ['golem'],
    caracteristicasEspeciais: ['Núcleo de Uru (efeito documentado para golens).'],
  },
  vibranium:        {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouro: 100 },
    caracteristicasEspeciais: ['Absorve, armazena e redistribui energia cinética.'],
  },
  prataPandemomico: { raridade: 'lendaria',  qualidade: 'excepcional', precoPorKg: { ouro: 75 } },
  ouroImperial:     { raridade: 'muitoRara', qualidade: 'excepcional' },
  bronzeCelestial:  { raridade: 'epica',     qualidade: 'excepcional' },
  honrineo:         {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouropla: 25 },
    aliases: ['Honrineo'],
    caracteristicasEspeciais: ['Adaptação automática ao usuário.'],
  },
  minerioDeHonra:   {
    raridade: 'mitica', qualidade: 'perfeito', precoPorKg: { ouropla: 18 },
    aliases: ['Minério da Honra'],
  },
  ferroEstigio:     {
    restricoes: ['Exige treinamento específico para dominar seus efeitos.'],
  },
  ruidium:          {
    observacoes: 'Possui sistema próprio de Corrupção com cinco estágios (Normal a Consumido); valores completos pendentes.',
  },
  obsidiana:        { raridade: 'incomum',   qualidade: 'superior',    precoPorKg: { ouro: 8 } },
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
  const alvo = String(nomeOuAlias || '').trim().toLowerCase();
  if (!alvo) return null;
  return MATERIAL_LIST.find((material) => (
    material.nome.toLowerCase() === alvo
    || (material.aliases || []).some((alias) => String(alias).toLowerCase() === alvo)
  )) || null;
}

export function calcularPrecoMaterial(id, quantidadeKg) {
  const material = getMaterialById(id);
  if (!material) return 0;
  const precoKg = precoKgEmCents(material.precoPorKg);
  if (precoKg == null) return 0;
  return Math.round(precoKg * quantidadeKg);
}
