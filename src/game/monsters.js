// Bestiário do Campo de Batalha.
// Cada monstro tem atributos na escala 1-10 (mesma dos jogadores).
// Vida = Resistência × 10 e Mana = Inteligência × 2 (mesma fórmula dos jogadores).
// Chefes (escalaChefe: true) têm vida = soma do HP dos jogadores x multiplicador,
// e ganham múltiplas ações por turno conforme o número de jogadores.
// Hordas (horda.quantidade) têm vida = HP individual × quantidade.
// Monstros com voaNatural já entram em voo e têm alcance vertical definido.

import { manaMaxFrom } from './sistema.js';

export const MONSTERS = {
  manequim: {
    id: 'manequim',
    nome: 'Manequim de Treino',
    tipo: 'inimigo',
    nivel: 1,
    attributes: { forca: 3, inteligencia: 1, resistencia: 3, destreza: 1, reflexos: 1 },
    arma: { nome: 'Braço de Madeira', danoBase: 6 },
    spells: [],
    passiva: 'Treinamento: absorve menos dano de testes dos aventureiros.',
    efeitos: {},
  },
  esqueleto: {
    id: 'esqueleto',
    nome: 'Esqueleto',
    tipo: 'inimigo',
    nivel: 3,
    attributes: { forca: 4, inteligencia: 1, resistencia: 3, destreza: 2, reflexos: 2 },
    arma: { nome: 'Espada Enferrujada', danoBase: 8, elemento: 'fisico' },
    spells: [],
    passiva: 'Sem carne: não sangra.',
    efeitos: { imune: ['sangramento'] },
    fraquezas: ['luz'],
    resistencias: ['trevas'],
  },
  zumbi: {
    id: 'zumbi',
    nome: 'Zumbi',
    tipo: 'inimigo',
    nivel: 4,
    attributes: { forca: 5, inteligencia: 1, resistencia: 5, destreza: 1, reflexos: 1 },
    arma: { nome: 'Garras', danoBase: 9 },
    spells: [],
    passiva: 'Morto-vivo: resiste a morrer 1 vez por batalha e é imune a veneno e sangramento.',
    efeitos: { resisteMorte: 1, imune: ['veneno', 'sangramento'] },
  },
  mini_golem: {
    id: 'mini_golem',
    nome: 'Mini Golem',
    tipo: 'inimigo',
    nivel: 5,
    attributes: { forca: 5, inteligencia: 2, resistencia: 6, destreza: 1, reflexos: 2 },
    arma: { nome: 'Punho de Pedra', danoBase: 10, elemento: 'terra' },
    spells: [],
    passiva: 'Pele de rocha: reduz 20% do dano físico recebido.',
    efeitos: { reducaoDanoFisico: 0.2, imune: ['sangramento', 'veneno'] },
    fraquezas: ['agua'],
    resistencias: ['fogo', 'fisico'],
  },
  golem_pedra: {
    id: 'golem_pedra',
    nome: 'Golem de Pedra',
    tipo: 'chefe',
    nivel: 25,
    attributes: { forca: 8, inteligencia: 4, resistencia: 9, destreza: 1, reflexos: 3 },
    arma: { nome: 'Martelo de Rocha', danoBase: 16, elemento: 'terra' },
    spells: ['muralha'],
    passiva: 'Colosso: atinge vários inimigos, não sangra e não pode ser derrubado facilmente.',
    efeitos: { danoFisicoMult: 1.15, imune: ['sangramento', 'veneno'] },
    escalaChefe: true,
    multiplicadorHP: 2.5,
    fraquezas: ['agua', 'ar'],
    resistencias: ['terra', 'fisico'],
  },

  goblin: {
    id: 'goblin',
    nome: 'Goblin',
    tipo: 'inimigo',
    nivel: 2,
    attributes: { forca: 2, inteligencia: 1, resistencia: 2, destreza: 4, reflexos: 4 },
    arma: { nome: 'Adaga Tortas', danoBase: 6, elemento: 'fisico' },
    spells: [],
    passiva: 'Ligeiro: esquiva 15% mais e envenena com suas lâminas.',
    efeitos: { esquivaBonus: 0.15, ataqueStatus: { tipo: 'veneno', turnos: 3, dano: 3 } },
    fraquezas: ['luz'],
    resistencias: ['trevas'],
  },
  lobo: {
    id: 'lobo',
    nome: 'Lobo',
    tipo: 'inimigo',
    nivel: 3,
    attributes: { forca: 4, inteligencia: 1, resistencia: 3, destreza: 4, reflexos: 5 },
    arma: { nome: 'Presas', danoBase: 8 },
    spells: [],
    passiva: 'Alcateia: ataca em bando e suas mordidas causam sangramento.',
    efeitos: { ataqueStatus: { tipo: 'sangramento', turnos: 2, dano: 4 } },
  },
  esqueleto_arqueiro: {
    id: 'esqueleto_arqueiro',
    nome: 'Esqueleto Arqueiro',
    tipo: 'inimigo',
    nivel: 6,
    attributes: { forca: 2, inteligencia: 1, resistencia: 3, destreza: 5, reflexos: 4 },
    arma: { nome: 'Arco Ósseo', danoBase: 8, alcance: 'longo' },
    spells: [],
    passiva: 'Arqueiro: alcança inimigos em altitude média.',
    efeitos: { alcanceVertical: 2 },
    alcanceVertical: 2,
  },
  morcego_gigante: {
    id: 'morcego_gigante',
    nome: 'Morcego Gigante',
    tipo: 'inimigo',
    nivel: 9,
    attributes: { forca: 4, inteligencia: 1, resistencia: 3, destreza: 6, reflexos: 6 },
    arma: { nome: 'Garras', danoBase: 9 },
    spells: [],
    passiva: 'Voador: natura voa e ataca de altitude média.',
    efeitos: { voaNatural: true, esquivaBonus: 0.1 },
    voaNatural: true,
    altitude: 2,
    alcanceVertical: 1,
  },
  zumbi_bruto: {
    id: 'zumbi_bruto',
    nome: 'Zumbi Bruto',
    tipo: 'inimigo',
    nivel: 12,
    attributes: { forca: 7, inteligencia: 1, resistencia: 7, destreza: 2, reflexos: 2 },
    arma: { nome: 'Marreta', danoBase: 13 },
    spells: [],
    passiva: 'Brutamontes: causa +15% de dano físico e resiste à morte uma vez.',
    efeitos: { danoFisicoMult: 1.15, resisteMorte: 1, imune: ['veneno'] },
  },
  // ── Hordas ──────────────────────────────────────────────────────────────
  // Hordas aumentam o número de monstros em vez de aumentar o HP de um só.
  // A quantidade cai conforme o dano recebido (regra confirmada pelo criador).
  horda_goblins: {
    id: 'horda_goblins',
    nome: 'Horda de Goblins',
    tipo: 'horda',
    nivel: 2,
    attributes: { forca: 2, inteligencia: 1, resistencia: 2, destreza: 4, reflexos: 4 },
    arma: { nome: 'Adaga Tortas', danoBase: 6, elemento: 'fisico' },
    spells: [],
    passiva: 'Horda: o número de goblins diminui a cada golpe acertado.',
    efeitos: { esquivaBonus: 0.05 },
    horda: { quantidade: 5 },
  },
  horda_zumbis: {
    id: 'horda_zumbis',
    nome: 'Horda de Zumbis',
    tipo: 'horda',
    nivel: 6,
    attributes: { forca: 4, inteligencia: 1, resistencia: 4, destreza: 1, reflexos: 1 },
    arma: { nome: 'Garras', danoBase: 8 },
    spells: [],
    passiva: 'Horda lenta: muitos corpos, pouca resistência individual.',
    efeitos: { resisteMorte: 1 },
    horda: { quantidade: 6 },
  },
  bandido: {
    id: 'bandido',
    nome: 'Bandido',
    tipo: 'inimigo',
    nivel: 4,
    attributes: { forca: 4, inteligencia: 2, resistencia: 3, destreza: 3, reflexos: 3 },
    arma: { nome: 'Adaga de Assalto', danoBase: 9 },
    spells: [],
    passiva: 'Ataque traiçoeiro: alto dano quando tem a vantagem.',
    efeitos: {},
  },
  gigante: {
    id: 'gigante',
    nome: 'Gigante',
    tipo: 'inimigo',
    nivel: 8,
    attributes: { forca: 9, inteligencia: 1, resistencia: 8, destreza: 1, reflexos: 2 },
    arma: { nome: 'Clava de Madeira', danoBase: 14 },
    spells: [],
    passiva: 'Força bruta: causa 10% a mais de dano físico e golpes entorpecem.',
    efeitos: { danoFisicoMult: 1.1, ataqueStatus: { tipo: 'lentidao', turnos: 2 } },
  },
};

// Ações por turno de um chefe conforme o nº de jogadores.
export function bossActionsPerTurn(playerCount) {
  if (playerCount <= 4) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 12) return 3;
  return 4;
}

// XP concedido por abater um monstro.
// Hordas valem XP por unidade: cada corpo abatido dá o seu XP.
export function monsterXp(def, unidades = 1) {
  const base = (def.nivel || 1) * 12 + (def.escalaChefe ? 120 : 0);
  return Math.round(base * Math.max(1, unidades));
}

// XP total de uma horda inteira.
export function monsterXpHorda(def) {
  return monsterXp(def, def?.horda?.quantidade || 1);
}

// Converte um monstro customizado (do banco) em definição do bestiário.
export function defFromCustomMonster(row) {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.escala_chefe ? 'chefe' : 'inimigo',
    nivel: row.nivel,
    attributes: row.attributes,
    arma: row.arma,
    spells: row.spells,
    passiva: row.passiva || '',
    efeitos: {},
    escalaChefe: row.escala_chefe,
    multiplicadorHP: Number(row.multiplicador_hp) || 3,
  };
}

// Monta um monstro pronto para entrar em batalha.
// `playerHpSum` só é usado para chefes: vida = soma do HP dos jogadores x multiplicador.
export function buildMonster(def, playerHpSum = 0) {
  const hpPorUnidade = Math.round(def.attributes.resistencia * 10);
  // Monstros não têm bônus separados de atributo: usa a mesma regra (INT × 2).
  const mpMax = manaMaxFrom(def.attributes.inteligencia, def.attributes.inteligencia);
  let hp = hpPorUnidade;
  if (def.escalaChefe) {
    hp = Math.max(50, Math.round(playerHpSum * (def.multiplicadorHP || 3)));
  }
  // Horda: vida = HP individual × quantidade de corpos.
  const unidadesHorda = def.horda?.quantidade || 0;
  if (unidadesHorda > 0) hp = hpPorUnidade * unidadesHorda;
  const voa = !!def.voaNatural;
  return {
    uid: def._uid || def.id,
    characterId: def._uid || null,
    monsterId: def.id,
    monsterName: def.nome,
    charName: def.nome,
    playerId: null,
    playerName: 'Mestre',
    cls: def.id,
    race: null,
    level: def.nivel || 1,
    attributes: { ...def.attributes },
    equipment: {
      arma: def.arma
        ? { id: def.id + '_arma', nome: def.arma.nome, danoBase: def.arma.danoBase, elemento: def.arma.elemento || null }
        : null,
      armadura: null,
    },
    spells: [...(def.spells || [])],
    skills: (def.spells || [])
      .map((id) => {
        const s = { golpe_sangrento: { nome: 'Golpe Sangrento', tipo: 'magia', poder: 200, custo: 5 }, muralha: { nome: 'Muralha', tipo: 'defesa', poder: 25, custo: 6 } }[id];
        return s ? { id: s.nome, ...s } : null;
      })
      .filter(Boolean),
    ultimate: null,
    especial: null,
    inventory: [],
    hp,
    hpMax: hp,
    mp: mpMax,
    mpMax,
    defesa: 0,
    alive: true,
    team: null,
    role: 'enemy',
    defense: false,
    dodge: false,
    buffPhysical: 1,
    buffMagic: 1,
    buffTurns: 0,
    statuses: [],
    kills: 0,
    xpGained: 0,
    ultimateBar: 0,
    especialBar: 0,
    danoRecebido: 0,
    ultimateMode: false,
    ultimateModeTurns: 0,
    ultimateModeMult: 0,
    ultimateSkillUsed: false,
    cooldowns: {},
    isMonster: true,
    isBoss: !!def.escalaChefe,
    resistDeathUsed: false,
    passiva: def.passiva || '',
    monsterDef: def,
    xpValue: unidadesHorda > 0 ? monsterXpHorda(def) : monsterXp(def),
    fraquezas: def.fraquezas || [],
    resistencias: def.resistencias || [],
    elemento: def.elemento || null,
    // ── Voo ──
    voando: voa,
    altitude: voa ? (def.altitude || 2) : 0,
    vooTipo: voa ? 'natural' : null,
    vooNatural: voa,
    vooTurnos: 0,
    vooFadiga: 0,
    // Alcance vertical de quem ataca (alcança voadores até esta altitude).
    alcanceVertical: def.alcanceVertical ?? null,
    // ── Horda ──
    horda: unidadesHorda > 0
      ? { quantidade: unidadesHorda, hpPorUnidade, inicial: unidadesHorda }
      : null,
    xpPorUnidade: monsterXp(def),
    contribuicao: { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 },
  };
}
