// Raças do jogo, baseadas na wiki "RPG Antigo Mundo".
// Cada raça tem:
//  - bonus: modificadores de atributo (podem ser negativos). 'escolha' = o jogador
//           escolhe em qual atributo recebe o bônus.
//  - passiva: descrição textual.
//  - efeito: efeitos mecânicos ativos em combate (quando existem).

export const RACES = {
  humano: {
    id: 'humano',
    nome: 'Humano',
    bonus: { escolha: 1 },
    passiva: 'Aprende qualquer coisa 30% mais fácil. Ganha +10% de XP nas batalhas.',
    efeito: { xpMult: 1.1 },
  },
  gigante: {
    id: 'gigante',
    nome: 'Gigante',
    bonus: { forca: 2, resistencia: 1, reflexos: -1 },
    passiva: 'Corpo colossal: ataques físicos causam +10% de dano.',
    efeito: { danoFisicoMult: 1.1 },
  },
  goblin: {
    id: 'goblin',
    nome: 'Goblin',
    bonus: { destreza: 1, reflexos: 1 },
    passiva: 'Ligeiro: 40% mais rápido que humanos. +15% de chance de esquiva.',
    efeito: { esquivaBonus: 0.15 },
  },
  vampiro: {
    id: 'vampiro',
    nome: 'Vampiro',
    bonus: { destreza: 1, reflexos: 1, resistencia: -1 },
    passiva: 'Sede de Sangue: cura 10% do dano que causa.',
    efeito: { rouboVida: 0.1 },
  },
  zumbi: {
    id: 'zumbi',
    nome: 'Zumbi',
    bonus: { forca: 1, resistencia: 1 },
    passiva: 'Morto-Vivo: resiste a ser derrotado 1 vez por batalha (fica com 1 HP).',
    efeito: { resisteMorte: 1 },
  },
  sereia: {
    id: 'sereia',
    nome: 'Sereia / Tritão',
    bonus: { inteligencia: 1, reflexos: 1 },
    passiva: 'Hidrocinese fraca: recupera 5 MP por turno.',
    efeito: { regenMana: 5 },
  },
  fada: {
    id: 'fada',
    nome: 'Fada',
    bonus: { inteligencia: 1, destreza: 1 },
    passiva: 'Essência da Natureza: +10% de mana máxima.',
    efeito: { manaMaxMult: 1.1 },
  },
  elfo_luz: {
    id: 'elfo_luz',
    nome: 'Elfo da Luz',
    bonus: { inteligencia: 1, destreza: 1 },
    passiva: 'Heliocinese fraca: fala com animais diurnos e manipula luz sutilmente.',
    efeito: {},
  },
  elfo_lua: {
    id: 'elfo_lua',
    nome: 'Elfo da Lua',
    bonus: { inteligencia: 1, reflexos: 1 },
    passiva: 'Umbracinese: domina sombras e fala com animais noturnos.',
    efeito: {},
  },
  meio_elfo: {
    id: 'meio_elfo',
    nome: 'Meio-Elfo',
    bonus: { inteligencia: 1, destreza: 1 },
    passiva: 'Herança das fadas: +5% de chance de crítico.',
    efeito: { critBonus: 0.05 },
  },
  nemi_humano: {
    id: 'nemi_humano',
    nome: 'Nemi-Humano',
    bonus: { escolha: 1 },
    passiva: 'Transforma-se em criaturas pequenas ou em híbrido delas, herdando as habilidades.',
    efeito: {},
  },
  medi_humano: {
    id: 'medi_humano',
    nome: 'Medi-Humano',
    bonus: { escolha: 1 },
    passiva: 'Transforma-se em criaturas médias ou em híbrido delas, herdando as habilidades.',
    efeito: {},
  },
  enor_humano: {
    id: 'enor_humano',
    nome: 'Enor-Humano',
    bonus: { escolha: 1 },
    passiva: 'Transforma-se em criaturas grandes ou em híbrido delas, herdando as habilidades.',
    efeito: {},
  },
  lobisomem: {
    id: 'lobisomem',
    nome: 'Lobisomem',
    bonus: { forca: 1, reflexos: 1 },
    passiva: 'Instinto Selvagem: ataques físicos causam +10% de dano.',
    efeito: { danoFisicoMult: 1.1 },
  },
  harpia: {
    id: 'harpia',
    nome: 'Harpia',
    bonus: { reflexos: 1, destreza: 1 },
    passiva: 'Asas velozes: +15% de chance de esquiva.',
    efeito: { esquivaBonus: 0.15 },
  },
  semi_anjo: {
    id: 'semi_anjo',
    nome: 'Semi-Anjo',
    bonus: { inteligencia: 1, reflexos: 1 },
    passiva: 'Luz Divina: recupera 5 MP por turno.',
    efeito: { regenMana: 5 },
  },
  semi_demonio: {
    id: 'semi_demonio',
    nome: 'Semi-Demônio',
    bonus: { forca: 1, inteligencia: 1, resistencia: -1 },
    passiva: 'Sangue Infernal: +5% de chance de crítico.',
    efeito: { critBonus: 0.05 },
  },
  gnomo: {
    id: 'gnomo',
    nome: 'Gnomo',
    bonus: { destreza: 1, inteligencia: 1 },
    passiva: 'Furtivo: +5% de chance de crítico.',
    efeito: { critBonus: 0.05 },
  },
  anao: {
    id: 'anao',
    nome: 'Anão',
    bonus: { forca: 1, resistencia: 1 },
    passiva: 'Robustez: recebe 10% a menos de dano físico.',
    efeito: { reducaoDanoFisico: 0.1 },
  },
  draconiano: {
    id: 'draconiano',
    nome: 'Draconiano',
    bonus: { forca: 1, inteligencia: 1 },
    passiva: 'Fôlego de Dragão: manipula pirocinese e pode se metamorfosear em um dragão.',
    efeito: {},
  },
  rockman: {
    id: 'rockman',
    nome: 'Rockman',
    bonus: { forca: 1, resistencia: 1 },
    passiva: 'Pele de Pedra: recebe 10% a menos de dano físico.',
    efeito: { reducaoDanoFisico: 0.1 },
  },
  ent: {
    id: 'ent',
    nome: "Ent",
    bonus: { resistencia: 1, inteligencia: 1 },
    passiva: 'Regeneração: cura 5% do HP máximo no início de cada turno.',
    efeito: { regenHpPct: 0.05 },
  },
  orc: {
    id: 'orc',
    nome: 'Orc',
    bonus: { forca: 2, inteligencia: -1 },
    passiva: 'Fúria: causa +20% de dano quando está com menos de 50% do HP.',
    efeito: { furia: true },
  },
};

export const RACE_KEYS = Object.keys(RACES);
