// Bestiário do Campo de Batalha.
// Cada monstro tem atributos na escala 1-10 (mesma dos jogadores).
// Vida = Resistência x 10 e Mana = Inteligência x 10 (mesma fórmula).
// Chefes (escalaChefe: true) têm vida = soma do HP dos jogadores x multiplicador,
// e ganham múltiplas ações por turno conforme o número de jogadores.

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
    arma: { nome: 'Espada Enferrujada', danoBase: 8 },
    spells: [],
    passiva: 'Sem carne: não sangra.',
    efeitos: { imune: ['sangramento'] },
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
    arma: { nome: 'Punho de Pedra', danoBase: 10 },
    spells: [],
    passiva: 'Pele de rocha: reduz 20% do dano físico recebido.',
    efeitos: { reducaoDanoFisico: 0.2, imune: ['sangramento', 'veneno'] },
  },
  golem_pedra: {
    id: 'golem_pedra',
    nome: 'Golem de Pedra',
    tipo: 'chefe',
    nivel: 25,
    attributes: { forca: 8, inteligencia: 4, resistencia: 9, destreza: 1, reflexos: 3 },
    arma: { nome: 'Martelo de Rocha', danoBase: 16 },
    spells: ['muralha'],
    passiva: 'Colosso: atinge vários inimigos, não sangra e não pode ser derrubado facilmente.',
    efeitos: { danoFisicoMult: 1.15, imune: ['sangramento', 'veneno'] },
    escalaChefe: true,
    multiplicadorHP: 2.5,
  },

  goblin: {
    id: 'goblin',
    nome: 'Goblin',
    tipo: 'inimigo',
    nivel: 2,
    attributes: { forca: 2, inteligencia: 1, resistencia: 2, destreza: 4, reflexos: 4 },
    arma: { nome: 'Adaga Tortas', danoBase: 6 },
    spells: [],
    passiva: 'Ligeiro: esquiva 15% mais e envenena com suas lâminas.',
    efeitos: { esquivaBonus: 0.15, ataqueStatus: { tipo: 'veneno', turnos: 3, dano: 3 } },
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
export function monsterXp(def) {
  return Math.round((def.nivel || 1) * 12 + (def.escalaChefe ? 120 : 0));
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
  const hpMax = Math.round(def.attributes.resistencia * 10);
  const mpMax = Math.round(def.attributes.inteligencia * 10);
  let hp = hpMax;
  if (def.escalaChefe) {
    hp = Math.max(50, Math.round(playerHpSum * (def.multiplicadorHP || 3)));
  }
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
        ? { id: def.id + '_arma', nome: def.arma.nome, danoBase: def.arma.danoBase }
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
    xpValue: monsterXp(def),
  };
}
