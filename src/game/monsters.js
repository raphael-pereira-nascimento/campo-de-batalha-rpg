// Bestiário do Campo de Batalha.
// Cada monstro tem atributos na escala 1-10 (mesma dos jogadores).
// Vida = 500 + (Resistência × 10) e Mana = (Inteligência × 10)
// (mesma fórmula dos jogadores — reformulação da vida/mana).
// Chefes (escalaChefe: true) têm vida = soma do HP dos jogadores x multiplicador,
// e ganham múltiplas ações por turno conforme o número de jogadores.
// Hordas (horda.quantidade) têm vida = HP individual × quantidade.
// Monstros com voaNatural já entram em voo e têm alcance vertical definido.

import { manaMaxFrom } from './sistema.js';
import { SPELLS, skillFromSpell } from './data.js';

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
    arma: { nome: 'Martelo de Rocha', danoBase: 16, elemento: 'terra', alvo: 'area' },
    spells: ['muralha'],
    passiva: 'Colosso: atinge vários inimigos, não sangra e não pode ser derrubado facilmente.',
    efeitos: { danoFisicoMult: 1.15, imune: ['sangramento', 'veneno'] },
    escalaChefe: true,
    multiplicadorHP: 2.5,
    fraquezas: ['agua', 'ar'],
    resistencias: ['terra', 'fisico'],
  },
  // ── Chefes de Bioma (PROVISÓRIO: números sujeitos a ajuste) ──────────
  kraken: {
    id: 'kraken',
    nome: 'Kraken',
    tipo: 'chefe',
    bioma: 'oceano',
    icone: '🦑',
    nivel: 28,
    attributes: { forca: 9, inteligencia: 6, resistencia: 9, destreza: 4, reflexos: 5 },
    arma: { nome: 'Tentáculos do Abismo', danoBase: 17, elemento: 'agua' },
    spells: ['tentaculo_esmagador', 'redemoinho_aguas_profundas', 'maremoto_colossal'],
    especial: 'redemoinho_aguas_profundas',
    ultimate: 'maremoto_colossal',
    passiva: 'Terror dos Mares: tentáculos atingem vários alvos e o redemoinho cega quem for pego.',
    efeitos: { danoFisicoMult: 1.2, imune: ['sangramento'] },
    escalaChefe: true,
    multiplicadorHP: 2.8,
    fraquezas: ['ar', 'luz'],
    resistencias: ['agua', 'fisico'],
    varianteEclipse: {
      sufixo: 'Eclipsado',
      spell: 'abismo_eclipsado',
      passiva: 'No Eclipse, o abismo olha de volta: invoca a fúria total do oceano profundo.',
      efeitos: { danoFisicoMult: 0.15, danoMagicoMult: 0.15 },
    },
  },
  espirito_floresta: {
    id: 'espirito_floresta',
    nome: 'Espírito da Floresta',
    tipo: 'chefe',
    bioma: 'floresta',
    icone: '🌲',
    nivel: 26,
    attributes: { forca: 6, inteligencia: 9, resistencia: 8, destreza: 5, reflexos: 5 },
    arma: { nome: 'Galhos Ancestrais', danoBase: 15, elemento: 'terra' },
    spells: ['raiz_enraizante', 'floresta_vingativa', 'fúria_natureza'],
    especial: 'floresta_vingativa',
    ultimate: 'fúria_natureza',
    passiva: 'Guardião Antigo: raízes prendem os invasores e a floresta inteira luta ao seu lado.',
    efeitos: { danoMagicoMult: 1.2, imune: ['veneno'] },
    escalaChefe: true,
    multiplicadorHP: 2.6,
    fraquezas: ['fogo'],
    resistencias: ['terra', 'agua'],
    varianteEclipse: {
      sufixo: 'Eclipsado',
      spell: 'fome_da_copa',
      passiva: 'No Eclipse, a floresta tem fome: a copa devora a luz e os invasores.',
      efeitos: { danoFisicoMult: 0.1, danoMagicoMult: 0.2 },
    },
  },
  monstro_pantano: {
    id: 'monstro_pantano',
    nome: 'Monstro do Pântano',
    tipo: 'chefe',
    bioma: 'pantano',
    icone: '🐊',
    nivel: 27,
    attributes: { forca: 8, inteligencia: 5, resistencia: 9, destreza: 3, reflexos: 3 },
    arma: { nome: 'Garras Lodosas', danoBase: 16, elemento: 'trevas' },
    spells: ['lama_acida', 'bolor_toxico', 'pestilencia_pantanal'],
    especial: 'bolor_toxico',
    ultimate: 'pestilencia_pantanal',
    passiva: 'Pestilência Viva: imune a veneno, espalha toxinas que corroem por turnos.',
    efeitos: { danoFisicoMult: 1.15, imune: ['veneno', 'sangramento'] },
    escalaChefe: true,
    multiplicadorHP: 2.7,
    fraquezas: ['fogo', 'luz'],
    resistencias: ['agua', 'trevas'],
    varianteEclipse: {
      sufixo: 'Eclipsado',
      spell: 'pestilencia_eclipsada',
      passiva: 'No Eclipse, o pântano apodrece o próprio ar: ninguém respira impune.',
      efeitos: { danoFisicoMult: 0.15, danoMagicoMult: 0.15 },
    },
  },
  yeti: {
    id: 'yeti',
    nome: 'Yeti',
    tipo: 'chefe',
    bioma: 'montanhas geladas',
    icone: '❄️',
    nivel: 26,
    attributes: { forca: 9, inteligencia: 3, resistencia: 9, destreza: 4, reflexos: 4 },
    arma: { nome: 'Punhos Glaciais', danoBase: 17, elemento: 'agua' },
    spells: ['golpe_gelo', 'avalancha', 'furia_glacial'],
    especial: 'avalancha',
    ultimate: 'furia_glacial',
    passiva: 'Filho da Nevasca: congela quem tocar e avalanchas varrem o campo inteiro.',
    efeitos: { danoFisicoMult: 1.2, imune: ['congelamento'] },
    escalaChefe: true,
    multiplicadorHP: 2.7,
    fraquezas: ['fogo'],
    resistencias: ['agua', 'fisico'],
    varianteEclipse: {
      sufixo: 'Eclipsado',
      spell: 'inverno_eclipsado',
      passiva: 'No Eclipse, o inverno nunca termina: a nevasca congela até a coragem.',
      efeitos: { danoFisicoMult: 0.2, danoMagicoMult: 0.1 },
    },
  },
  minhoca_broca: {
    id: 'minhoca_broca',
    nome: 'Minhoca de Broca',
    tipo: 'chefe',
    bioma: 'subterrâneo',
    icone: '🪱',
    nivel: 25,
    attributes: { forca: 8, inteligencia: 4, resistencia: 8, destreza: 6, reflexos: 4 },
    arma: { nome: 'Mandíbulas Trituradoras', danoBase: 16, elemento: 'terra' },
    spells: ['perfuracao_terrena', 'tremor_subterraneo', 'colapso_caverna'],
    especial: 'tremor_subterraneo',
    ultimate: 'colapso_caverna',
    passiva: 'Devoradora de Túneis: emerge do solo sem aviso e desaba a caverna sobre todos.',
    efeitos: { danoFisicoMult: 1.15, esquivaBonus: 0.1 },
    escalaChefe: true,
    multiplicadorHP: 2.6,
    fraquezas: ['ar'],
    resistencias: ['terra', 'fisico'],
    varianteEclipse: {
      sufixo: 'Eclipsada',
      spell: 'fenda_eclipsada',
      passiva: 'No Eclipse, a terra se abre em fendas que engolem exércitos inteiros.',
      efeitos: { danoFisicoMult: 0.15, danoMagicoMult: 0.15 },
    },
  },
  jabuti_montanha: {
    id: 'jabuti_montanha',
    nome: 'Jabuti Casco de Montanha',
    tipo: 'chefe',
    bioma: 'montanhas',
    icone: '🐢',
    nivel: 27,
    attributes: { forca: 8, inteligencia: 3, resistencia: 10, destreza: 2, reflexos: 3 },
    arma: { nome: 'Casco Sísmico', danoBase: 17, elemento: 'terra', alvo: 'area' },
    spells: ['impacto_casco', 'onda_pedregulho', 'terremoto_montanha'],
    especial: 'onda_pedregulho',
    ultimate: 'terremoto_montanha',
    passiva: 'Montanha Viva: casco quase impenetrável reduz dano físico e cada passo é um tremor.',
    efeitos: { danoFisicoMult: 1.15, reducaoDanoFisico: 0.2, imune: ['sangramento'] },
    escalaChefe: true,
    multiplicadorHP: 2.9,
    fraquezas: ['agua'],
    resistencias: ['terra', 'fisico'],
    varianteEclipse: {
      sufixo: 'Eclipsado',
      spell: 'cataclismo_eclipsado',
      passiva: 'No Eclipse, a montanha anda: o casco racha o mundo em dois.',
      efeitos: { danoFisicoMult: 0.2, danoMagicoMult: 0.1 },
    },
  },
  dragao_obsidiana: {
    id: 'dragao_obsidiana',
    nome: 'Dragão de Obsidiana',
    tipo: 'chefe',
    bioma: 'vulcão',
    icone: '🐉',
    nivel: 30,
    attributes: { forca: 10, inteligencia: 8, resistencia: 10, destreza: 6, reflexos: 6 },
    arma: { nome: 'Garras de Obsidiana', danoBase: 19, elemento: 'fogo' },
    spells: ['baforada_obsidiana', 'chuva_lava', 'apocalipse_obsidiana'],
    especial: 'chuva_lava',
    ultimate: 'apocalipse_obsidiana',
    passiva: 'Coração Vulcânico: voa desde o início, cospe obsidiana derretida e ri do fogo.',
    efeitos: { danoFisicoMult: 1.2, danoMagicoMult: 1.15, voaNatural: true, imune: ['queimadura'] },
    voaNatural: true,
    altitude: 3,
    alcanceVertical: 2,
    escalaChefe: true,
    multiplicadorHP: 3.0,
    fraquezas: ['agua'],
    resistencias: ['fogo', 'terra'],
    varianteEclipse: {
      sufixo: 'Eclipsado',
      spell: 'sol_negro',
      passiva: 'No Eclipse, nasce o Sol Negro: o céu queima antes mesmo do fogo chegar.',
      efeitos: { danoFisicoMult: 0.15, danoMagicoMult: 0.2 },
    },
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
    efeitos: { esquivaBonus: 0.15, ataqueStatus: { tipo: 'veneno', turnos: 3, dano: 30 } },
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
    efeitos: { ataqueStatus: { tipo: 'sangramento', turnos: 2, dano: 40 } },
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
    arma: { nome: 'Clava de Madeira', danoBase: 14, alvo: 'cone', alvos: 3 },
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
  // Mesma fórmula de vida dos jogadores (reforma da vida): 500 + (RES × 10).
  const hpPorUnidade = 500 + Math.round(def.attributes.resistencia * 10);
  // Monstros não têm bônus separados de atributo: usa INT × 10
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
        ? {
            id: def.id + '_arma',
            nome: def.arma.nome,
            danoBase: def.arma.danoBase,
            elemento: def.arma.elemento || null,
            categoria: def.arma.categoria || null,
            alcance: def.arma.alcance || null,
            // Multi-alvo: alguns monstros atacam vários inimigos (área/cone/explosão).
            alvo: def.arma.alvo || null,
            alvos: def.arma.alvos || null,
            splash: def.arma.splash || null,
            danoMult: def.arma.danoMult || null,
          }
        : null,
      armadura: null,
    },
    spells: [...(def.spells || [])],
    skills: (def.spells || []).map((id) => skillFromSpell(SPELLS[id])).filter(Boolean),
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
