// Raças do jogo, baseadas na wiki "RPG Antigo Mundo".
// Cada raça tem:
//  - bonus: modificadores de atributo (podem ser negativos). 'escolha' = o jogador
//           escolhe em qual atributo recebe o bônus.
//  - passiva: descrição textual.
//  - efeito: efeitos mecânicos ativos em combate (todas as raças têm algum).
//  - generos: variações por gênero — bonus extra (+1 atributo) e/ou
//             extraEfeito (passiva mecânica adicional) aplicados na criação da ficha.

export const GENDERS = {
  masculino: { id: 'masculino', nome: 'Masculino', icon: '♂' },
  feminino: { id: 'feminino', nome: 'Feminino', icon: '♀' },
};

export const RACES = {
  humano: {
    id: 'humano',
    nome: 'Humano',
    bonus: { escolha: 1 },
    passiva: 'Aprende qualquer coisa 30% mais fácil. Ganha +10% de XP nas batalhas.',
    efeito: { xpMult: 1.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Vigor humano: +1 Força.' },
      feminino: { bonus: { reflexos: 1 }, passivaExtra: 'Agilidade humana: +1 Reflexos.' },
    },
  },
  gigante: {
    id: 'gigante',
    nome: 'Gigante',
    bonus: { forca: 2, resistencia: 1, reflexos: -1 },
    passiva: 'Corpo colossal: ataques físicos causam +10% de dano.',
    efeito: { danoFisicoMult: 1.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Titã: +1 Força.' },
      feminino: {
        bonus: { resistencia: 1 },
        extraEfeito: { reducaoDanoFisico: 0.05 },
        passivaExtra: 'Pele de montanha: recebe -5% de dano físico e +1 Resistência.',
      },
    },
  },
  goblin: {
    id: 'goblin',
    nome: 'Goblin',
    bonus: { destreza: 1, reflexos: 1 },
    passiva: 'Ligeiro: 40% mais rápido que humanos. +15% de chance de esquiva.',
    efeito: { esquivaBonus: 0.15 },
    generos: {
      masculino: { bonus: { destreza: 1 }, passivaExtra: 'Batedor: +1 Destreza.' },
      feminino: { extraEfeito: { esquivaBonus: 0.05 }, passivaExtra: 'Travessa: +5% de esquiva.' },
    },
  },
  vampiro: {
    id: 'vampiro',
    nome: 'Vampiro',
    bonus: { destreza: 1, reflexos: 1, resistencia: -1 },
    passiva: 'Sede de Sangue: cura 10% do dano que causa.',
    efeito: { rouboVida: 0.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Nosferatu: +1 Força.' },
      feminino: { extraEfeito: { rouboVida: 0.05 }, passivaExtra: 'Sedutora: drena +5% a mais de vida.' },
    },
  },
  zumbi: {
    id: 'zumbi',
    nome: 'Zumbi',
    bonus: { forca: 1, resistencia: 1 },
    passiva: 'Morto-Vivo: resiste a ser derrotado 1 vez por batalha (fica com 1 HP).',
    efeito: { resisteMorte: 1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Carcassa bruta: +1 Força.' },
      feminino: { bonus: { resistencia: 1 }, passivaExtra: 'Carcassa tenaz: +1 Resistência.' },
    },
  },
  sereia: {
    id: 'sereia',
    nome: 'Sereia / Tritão',
    bonus: { inteligencia: 1, reflexos: 1 },
    passiva: 'Hidrocinese fraca: recupera 5 MP por turno.',
    efeito: { regenMana: 5 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Tritão das marés: +1 Força.' },
      feminino: { extraEfeito: { regenMana: 2 }, passivaExtra: 'Canto das águas: recupera +2 MP por turno.' },
    },
  },
  fada: {
    id: 'fada',
    nome: 'Fada',
    bonus: { inteligencia: 1, destreza: 1 },
    passiva: 'Essência da Natureza: +10% de mana máxima.',
    efeito: { manaMaxMult: 1.1 },
    generos: {
      masculino: { bonus: { inteligencia: 1 }, passivaExtra: 'Fae eremita: +1 Inteligência.' },
      feminino: { extraEfeito: { manaMaxMult: 0.05 }, passivaExtra: 'Rainha do bosque: +5% de mana máxima.' },
    },
  },
  elfo_luz: {
    id: 'elfo_luz',
    nome: 'Elfo da Luz',
    bonus: { inteligencia: 1, destreza: 1 },
    passiva: 'Heliocinese: recupera 3 MP por turno e causa +5% de dano mágico. Fala com animais diurnos.',
    efeito: { regenMana: 3, danoMagicoMult: 1.05 },
    generos: {
      masculino: { bonus: { inteligencia: 1 }, passivaExtra: 'Guardião solar: +1 Inteligência.' },
      feminino: { extraEfeito: { danoMagicoMult: 1.05 }, passivaExtra: 'Aurora: causa +5% a mais de dano mágico.' },
    },
  },
  elfo_lua: {
    id: 'elfo_lua',
    nome: 'Elfo da Lua',
    bonus: { inteligencia: 1, reflexos: 1 },
    passiva: 'Umbracinese: +8% de esquiva e age antes (+2 de iniciativa). Fala com animais noturnos.',
    efeito: { esquivaBonus: 0.08, iniciativaBonus: 2 },
    generos: {
      masculino: { bonus: { reflexos: 1 }, passivaExtra: 'Sentinela noturna: +1 Reflexos.' },
      feminino: { extraEfeito: { iniciativaBonus: 1 }, passivaExtra: 'Filha do crepúsculo: +1 de iniciativa.' },
    },
  },
  meio_elfo: {
    id: 'meio_elfo',
    nome: 'Meio-Elfo',
    bonus: { inteligencia: 1, destreza: 1 },
    passiva: 'Herança das fadas: +5% de chance de crítico.',
    efeito: { critBonus: 0.05 },
    generos: {
      masculino: { bonus: { destreza: 1 }, passivaExtra: 'Andarilho: +1 Destreza.' },
      feminino: { extraEfeito: { critBonus: 0.03 }, passivaExtra: 'Sorte feérica: +3% de crítico.' },
    },
  },
  nemi_humano: {
    id: 'nemi_humano',
    nome: 'Nemi-Humano',
    bonus: { escolha: 1 },
    passiva: 'Corpo pequeno e esquivado: +5% de chance de esquiva.',
    efeito: { esquivaBonus: 0.05 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Musgo pequeno: +1 Força.' },
      feminino: { bonus: { destreza: 1 }, passivaExtra: 'Plumas leves: +1 Destreza.' },
    },
  },
  medi_humano: {
    id: 'medi_humano',
    nome: 'Medi-Humano',
    bonus: { escolha: 1 },
    passiva: 'Equilíbrio perfeito: +5% de dano físico e +5% de dano mágico.',
    efeito: { danoFisicoMult: 1.05, danoMagicoMult: 1.05 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Ombros largos: +1 Força.' },
      feminino: { bonus: { inteligencia: 1 }, passivaExtra: 'Mente afiada: +1 Inteligência.' },
    },
  },
  enor_humano: {
    id: 'enor_humano',
    nome: 'Enor-Humano',
    bonus: { escolha: 1 },
    passiva: 'Porte colossal: +10% de dano físico e recebe 5% menos dano físico.',
    efeito: { danoFisicoMult: 1.1, reducaoDanoFisico: 0.05 },
    generos: {
      masculino: { bonus: { resistencia: 1 }, passivaExtra: 'Muralha viva: +1 Resistência.' },
      feminino: { bonus: { forca: 1 }, passivaExtra: 'Guerreira enorme: +1 Força.' },
    },
  },
  lobisomem: {
    id: 'lobisomem',
    nome: 'Lobisomem',
    bonus: { forca: 1, reflexos: 1 },
    passiva: 'Instinto Selvagem: ataques físicos causam +10% de dano.',
    efeito: { danoFisicoMult: 1.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Alfa: +1 Força.' },
      feminino: { extraEfeito: { esquivaBonus: 0.05 }, passivaExtra: 'Loba veloz: +5% de esquiva.' },
    },
  },
  harpia: {
    id: 'harpia',
    nome: 'Harpia',
    bonus: { reflexos: 1, destreza: 1 },
    passiva: 'Asas velozes: +15% de chance de esquiva.',
    efeito: { esquivaBonus: 0.15 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Harpius: +1 Força.' },
      feminino: { extraEfeito: { esquivaBonus: 0.05 }, passivaExtra: 'Voo pluma: +5% de esquiva.' },
    },
  },
  semi_anjo: {
    id: 'semi_anjo',
    nome: 'Semi-Anjo',
    bonus: { inteligencia: 1, reflexos: 1 },
    passiva: 'Luz Divina: recupera 5 MP por turno.',
    efeito: { regenMana: 5 },
    generos: {
      masculino: { bonus: { resistencia: 1 }, passivaExtra: 'Guardião celeste: +1 Resistência.' },
      feminino: { extraEfeito: { regenMana: 2 }, passivaExtra: 'Bênção serena: recupera +2 MP por turno.' },
    },
  },
  semi_demonio: {
    id: 'semi_demonio',
    nome: 'Semi-Demônio',
    bonus: { forca: 1, inteligencia: 1, resistencia: -1 },
    passiva: 'Sangue Infernal: +5% de chance de crítico.',
    efeito: { critBonus: 0.05 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Bruto infernal: +1 Força.' },
      feminino: { extraEfeito: { critBonus: 0.03 }, passivaExtra: 'Malícia: +3% de crítico.' },
    },
  },
  gnomo: {
    id: 'gnomo',
    nome: 'Gnomo',
    bonus: { destreza: 1, inteligencia: 1 },
    passiva: 'Furtivo: +5% de chance de crítico.',
    efeito: { critBonus: 0.05 },
    generos: {
      masculino: { bonus: { inteligencia: 1 }, passivaExtra: 'Inventor: +1 Inteligência.' },
      feminino: { extraEfeito: { esquivaBonus: 0.03 }, passivaExtra: 'Passos de rato: +3% de esquiva.' },
    },
  },
  anao: {
    id: 'anao',
    nome: 'Anão',
    bonus: { forca: 1, resistencia: 1 },
    passiva: 'Robustez: recebe 10% a menos de dano físico.',
    efeito: { reducaoDanoFisico: 0.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Barba de ferro: +1 Força.' },
      feminino: { extraEfeito: { reducaoDanoFisico: 0.05 }, passivaExtra: 'Forja ancestral: recebe -5% de dano físico.' },
    },
  },
  draconiano: {
    id: 'draconiano',
    nome: 'Draconiano',
    bonus: { forca: 1, inteligencia: 1 },
    passiva: 'Fôlego de Dragão: pirocinese — +10% de dano mágico.',
    efeito: { danoMagicoMult: 1.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Escamas brutamontes: +1 Força.' },
      feminino: { bonus: { inteligencia: 1 }, passivaExtra: 'Chama interior: +1 Inteligência.' },
    },
  },
  rockman: {
    id: 'rockman',
    nome: 'Rockman',
    bonus: { forca: 1, resistencia: 1 },
    passiva: 'Pele de Pedra: recebe 10% a menos de dano físico.',
    efeito: { reducaoDanoFisico: 0.1 },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Bloco maciço: +1 Força.' },
      feminino: { extraEfeito: { reducaoDanoFisico: 0.05 }, passivaExtra: 'Basalto: recebe -5% de dano físico.' },
    },
  },
  ent: {
    id: 'ent',
    nome: 'Ent',
    bonus: { resistencia: 1, inteligencia: 1 },
    passiva: 'Regeneração: cura 5% do HP máximo no início de cada turno.',
    efeito: { regenHpPct: 0.05 },
    generos: {
      masculino: { extraEfeito: { regenHpPct: 0.02 }, passivaExtra: 'Seiva antiga: regenera +2% de HP por turno.' },
      feminino: { bonus: { inteligencia: 1 }, passivaExtra: 'Flor da sabedoria: +1 Inteligência.' },
    },
  },
  orc: {
    id: 'orc',
    nome: 'Orc',
    bonus: { forca: 2, inteligencia: -1 },
    passiva: 'Fúria: causa +20% de dano quando está com menos de 50% do HP.',
    efeito: { furia: true },
    generos: {
      masculino: { bonus: { forca: 1 }, passivaExtra: 'Bruto guerreiro: +1 Força.' },
      feminino: { bonus: { destreza: 1 }, passivaExtra: 'Caçadora feroz: +1 Destreza.' },
    },
  },
};

export const RACE_KEYS = Object.keys(RACES);

// Aplica as variações de gênero (bonus +1 e passivas extras) à definição da raça.
// O resultado é gravado na ficha, então servidor e combate recebem tudo pronto.
export function applyGenderToRace(raceDef, gender) {
  if (!raceDef || !gender) return raceDef;
  const g = raceDef.generos?.[gender];
  if (!g) return raceDef;
  return {
    ...raceDef,
    bonus: { ...(raceDef.bonus || {}), ...(g.bonus || {}) },
    efeito: { ...(raceDef.efeito || {}), ...(g.extraEfeito || {}) },
    passiva: [raceDef.passiva, g.passivaExtra].filter(Boolean).join(' '),
  };
}
