// Dados do jogo: classes, atributos, magias, equipamentos e formulas.

import { RACES } from './races.js';

export const CLASSES = {
  guerreiro: {
    id: 'guerreiro',
    nome: 'Guerreiro',
    descricao: 'Mestre do combate corpo a corpo. Muita força e resistência.',
    bonus: { forca: 3, resistencia: 2, destreza: 1, inteligencia: 0, reflexos: 0 },
    hpPerLevel: 12,
    mpPerLevel: 3,
    levelUp: 'forca',
    spellList: ['golpe_sangrento', 'grito_de_guerra', 'muralha'],
  },
  mago: {
    id: 'mago',
    nome: 'Mago',
    descricao: 'Canaliza arcanos devastadores. Muita inteligência e mana.',
    bonus: { forca: 0, resistencia: 1, destreza: 0, inteligencia: 3, reflexos: 2 },
    hpPerLevel: 6,
    mpPerLevel: 10,
    levelUp: 'inteligencia',
    spellList: ['bola_de_fogo', 'raio', 'gelo', 'escudo_arcano'],
  },
  arqueiro: {
    id: 'arqueiro',
    nome: 'Arqueiro',
    descricao: 'Atirador de elite. Destreza e reflexos acima da média.',
    bonus: { forca: 1, resistencia: 0, destreza: 3, inteligencia: 1, reflexos: 2 },
    hpPerLevel: 8,
    mpPerLevel: 5,
    levelUp: 'destreza',
    spellList: ['tiro_preciso', 'chuva_de_flechas', 'flecha_ardente'],
  },
  clerigo: {
    id: 'clerigo',
    nome: 'Clérigo',
    descricao: 'Curandeiro sagrado. Sustenta o time com a fé.',
    bonus: { forca: 1, resistencia: 2, destreza: 1, inteligencia: 2, reflexos: 0 },
    hpPerLevel: 9,
    mpPerLevel: 8,
    levelUp: 'inteligencia',
    spellList: ['cura', 'cura_massa', 'luz_sagrada', 'benção'],
  },
  assassino: {
    id: 'assassino',
    nome: 'Assassino',
    descricao: 'Letal nas sombras. Reflexos e destreza incomparáveis.',
    bonus: { forca: 1, resistencia: 0, destreza: 3, inteligencia: 1, reflexos: 3 },
    hpPerLevel: 7,
    mpPerLevel: 5,
    levelUp: 'reflexos',
    spellList: ['golpe_preciso', 'veneno', 'sombra'],
  },
  paladino: {
    id: 'paladino',
    nome: 'Paladino',
    descricao: 'Cavaleiro sagrado que protege os aliados com fé e aço.',
    bonus: { forca: 2, resistencia: 2, destreza: 1, inteligencia: 1, reflexos: 0 },
    hpPerLevel: 10,
    mpPerLevel: 6,
    levelUp: 'forca',
    spellList: ['golpe_sagrado', 'escudo_divino', 'cura', 'benção'],
  },
};

export const SPELLS = {
  golpe_sangrento: { nome: 'Golpe Sangrento', tipo: 'ataque', custo: 5, poder: 2.0, desc: 'Ataque físico brutal com força aumentada.' },
  grito_de_guerra: { nome: 'Grito de Guerra', tipo: 'buff', custo: 6, poder: 0.15, desc: 'Aumenta o dano físico de todos os aliados.' },
  muralha: { nome: 'Muralha', tipo: 'defesa', custo: 6, poder: 0.25, desc: 'Reduz o dano recebido nesta rodada.' },

  bola_de_fogo: { nome: 'Bola de Fogo', tipo: 'ataque', custo: 8, poder: 2.4, desc: 'Explosão de fogo devastadora.' },
  raio: { nome: 'Raio', tipo: 'ataque', custo: 6, poder: 1.8, desc: 'Descarga elétrica precisa.' },
  gelo: { nome: 'Gelo', tipo: 'ataque', custo: 7, poder: 1.6, desc: 'Congela o alvo e reduz a velocidade dele.' },
  escudo_arcano: { nome: 'Escudo Arcano', tipo: 'defesa', custo: 7, poder: 0.3, desc: 'Barreira mágica que absorve dano.' },

  tiro_preciso: { nome: 'Tiro Preciso', tipo: 'ataque', custo: 4, poder: 1.5, desc: 'Dano crítico elevado.' },
  chuva_de_flechas: { nome: 'Chuva de Flechas', tipo: 'ataque', custo: 9, poder: 2.2, desc: 'Acerta todos os inimigos.' },
  flecha_ardente: { nome: 'Flecha Ardente', tipo: 'ataque', custo: 6, poder: 1.9, desc: 'Flecha em chamas que causa queimadura.' },

  cura: { nome: 'Cura', tipo: 'cura', custo: 6, poder: 2.0, desc: 'Restaura HP com base na inteligência.' },
  cura_massa: { nome: 'Cura em Massa', tipo: 'cura', custo: 12, poder: 1.2, desc: 'Cura todos os aliados vivos.' },
  luz_sagrada: { nome: 'Luz Sagrada', tipo: 'ataque', custo: 7, poder: 1.9, desc: 'Dano divino contra um inimigo.' },
  benção: { nome: 'Benção', tipo: 'buff', custo: 5, poder: 0.1, desc: 'Aumenta o dano mágico dos aliados.' },

  golpe_preciso: { nome: 'Golpe Preciso', tipo: 'ataque', custo: 5, poder: 1.6, desc: 'Ataque certeiro que tem alta chance de crítico.' },
  veneno: { nome: 'Veneno', tipo: 'ataque', custo: 6, poder: 1.4, desc: 'Envenena o alvo, causando dano contínuo.' },
  sombra: { nome: 'Sombra', tipo: 'defesa', custo: 5, poder: 0.3, desc: 'Desaparece nas sombras, reduzindo muito o dano recebido.' },

  golpe_sagrado: { nome: 'Golpe Sagrado', tipo: 'ataque', custo: 7, poder: 2.0, desc: 'Espada envolta em luz sagrada.' },
  escudo_divino: { nome: 'Escudo Divino', tipo: 'defesa', custo: 7, poder: 0.3, desc: 'Barreira sagrada que absorve dano.' },
};

export const EQUIPMENT = {
  armas: {
    espada_curta: { nome: 'Espada Curta', tipo: 'arma', danoBase: 4, bonus: { forca: 1 } },
    espada_longa: { nome: 'Espada Longa', tipo: 'arma', danoBase: 7, bonus: { forca: 2 } },
    machado_de_guerra: { nome: 'Machado de Guerra', tipo: 'arma', danoBase: 9, bonus: { forca: 3 } },
    cajado_arcano: { nome: 'Cajado Arcano', tipo: 'arma', danoBase: 3, bonus: { inteligencia: 2 } },
    orbe_magico: { nome: 'Orbe Mágico', tipo: 'arma', danoBase: 2, bonus: { inteligencia: 3 } },
    arco_simples: { nome: 'Arco Simples', tipo: 'arma', danoBase: 5, bonus: { destreza: 2 } },
    arco_longo: { nome: 'Arco Longo', tipo: 'arma', danoBase: 8, bonus: { destreza: 3 } },
    adaga_dupla: { nome: 'Adaga Dupla', tipo: 'arma', danoBase: 4, bonus: { destreza: 3 } },
    martelo_sagrado: { nome: 'Martelo Sagrado', tipo: 'arma', danoBase: 6, bonus: { inteligencia: 1, resistencia: 1 } },
    adaga_ritual: { nome: 'Adaga Ritual', tipo: 'arma', danoBase: 5, bonus: { reflexos: 2 } },
    lanca_sagrada: { nome: 'Lança Sagrada', tipo: 'arma', danoBase: 8, bonus: { forca: 2, resistencia: 1 } },
  },
  armaduras: {
    roupa_de_aventureiro: { nome: 'Roupa de Aventureiro', tipo: 'armadura', defesa: 2 },
    couro: { nome: 'Armadura de Couro', tipo: 'armadura', defesa: 4 },
    cota_de_malha: { nome: 'Cota de Malha', tipo: 'armadura', defesa: 6, penalidade: { reflexos: -1 } },
    armadura_de_placas: { nome: 'Armadura de Placas', tipo: 'armadura', defesa: 9, penalidade: { reflexos: -1, destreza: -1 } },
    manto_arcano: { nome: 'Manto Arcano', tipo: 'armadura', defesa: 3, bonus: { inteligencia: 1 } },
    vestes_sagradas: { nome: 'Vestes Sagradas', tipo: 'armadura', defesa: 3, bonus: { inteligencia: 1 } },
    armadura_leve: { nome: 'Armadura Leve', tipo: 'armadura', defesa: 5, bonus: { reflexos: 1 } },
  },
};

export const POTIONS = {
  pocao_cura: { nome: 'Poção de Cura', tipo: 'pocao', cura: 25, desc: 'Restaura 25 de HP.' },
  pocao_cura_grande: { nome: 'Poção de Cura Grande', tipo: 'pocao', cura: 60, desc: 'Restaura 60 de HP.' },
  elixir_mana: { nome: 'Elixir de Mana', tipo: 'pocao', mana: 25, desc: 'Restaura 25 de MP.' },
  elixir_mana_grande: { nome: 'Elixir de Mana Grande', tipo: 'pocao', mana: 60, desc: 'Restaura 60 de MP.' },
};

export const ATTRIBUTE_KEYS = ['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos'];
export const ATTRIBUTE_NAMES = {
  forca: 'Força',
  inteligencia: 'Inteligência',
  resistencia: 'Resistência',
  destreza: 'Destreza',
  reflexos: 'Reflexos',
};

export const POINTS_TO_DISTRIBUTE = 30;
export const MIN_ATTRIBUTE = 1;
export const MAX_ATTRIBUTE = 10;
export const MAX_ATTRIBUTE_WITH_BONUS = 12;
export const MAX_PLAYERS_PER_BATTLE = 20;

// Atributos efetivos = base + bônus de raças (com penalidade) + bônus de classes + equipamento
//
// Penalidade por raças múltiplas:
//   1 raça  = bônus cheio (100%)
//   2 raças = soma dos bônus x 0.70
//   3 raças = soma dos bônus x 0.55
// Passivas e efeitos raciais NÃO são reduzidos; apenas os bônus de atributo.

export function raceBonusTotal(races) {
  const bonus = {};
  for (const race of races || []) {
    for (const [key, value] of Object.entries(race.bonus || {})) {
      if (key === 'escolha') {
        const chosen = race.choice || 'forca';
        bonus[chosen] = (bonus[chosen] || 0) + value;
      } else {
        bonus[key] = (bonus[key] || 0) + value;
      }
    }
  }
  const count = Array.isArray(races) ? races.length : 0;
  const factor = count >= 3 ? 0.55 : count === 2 ? 0.7 : 1;
  if (factor !== 1) {
    for (const key of Object.keys(bonus)) bonus[key] = Math.round(bonus[key] * factor);
  }
  return bonus;
}

export function classBonusTotal(classes) {
  const bonus = {};
  for (const cls of classes || []) {
    for (const [key, value] of Object.entries(cls.bonus || {})) {
      bonus[key] = (bonus[key] || 0) + value;
    }
  }
  return bonus;
}

export function applyRaceBonus(raceId, attributes) {
  const race = RACES[raceId] || RACES.humano;
  const res = { ...attributes };
  for (const [key, value] of Object.entries(race.bonus)) {
    if (key === 'escolha') {
      const chosen = res._raceChoice || 'forca';
      res[chosen] = (res[chosen] || 0) + value;
      continue;
    }
    res[key] = (res[key] || 0) + value;
  }
  return res;
}

export function effectiveAttributes(attributes, equipment = {}, races = null, classes = null) {
  const eff = { ...attributes };
  if (Array.isArray(races)) {
    for (const [k, v] of Object.entries(raceBonusTotal(races))) eff[k] = (eff[k] || 0) + v;
  } else if (races) {
    const rb = applyRaceBonus(races, {});
    for (const [k, v] of Object.entries(rb)) eff[k] = (eff[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(classBonusTotal(classes))) eff[k] = (eff[k] || 0) + v;
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    if (item.bonus) {
      for (const [k, v] of Object.entries(item.bonus)) eff[k] = (eff[k] || 0) + v;
    }
    if (item.penalidade) {
      // Malefícios sempre reduzem o atributo (armaduras do catálogo guardam
      // valores negativos; equipamentos customizados guardam valores positivos).
      for (const [k, v] of Object.entries(item.penalidade)) eff[k] = (eff[k] || 0) - Math.abs(v);
    }
  }
  for (const key of Object.keys(eff)) {
    if (key.startsWith('_')) continue;
    eff[key] = Math.max(1, eff[key] || 1);
  }
  return eff;
}

// Formula de vida/mana com classe primária:
// Vida = Resistência x 10 + hpPerLevel(primária) x (nível - 1)
// Mana = Inteligência x 10 + mpPerLevel(primária) x (nível - 1)
export function deriveStats(classes, level, attributes, equipment = {}, races = null) {
  const eff = effectiveAttributes(attributes, equipment, races, classes);
  const list = Array.isArray(classes) ? classes : classes ? [classes] : [];
  const primary = list.find((c) => c.primary) || list[0] || null;
  const hpPerLevel = primary?.hpPerLevel || 10;
  const mpPerLevel = primary?.mpPerLevel || 5;
  const hpMax = eff.resistencia * 10 + Math.max(0, (level || 1) - 1) * hpPerLevel;
  const mpMax = eff.inteligencia * 10 + Math.max(0, (level || 1) - 1) * mpPerLevel;

  let defesa = 0;
  for (const item of Object.values(equipment)) {
    if (item && item.defesa) defesa += item.defesa;
  }

  return { hpMax, mpMax, defesa, effectiveAttributes: eff };
}

// Velocidade define a ordem dos turnos
export function speedOf(attributes, level) {
  return attributes.reflexos * 2 + attributes.destreza + level;
}

// Rolagem de d20 para acerto
export function rollDice(sides, qty = 1, bonus = 0) {
  let total = bonus;
  const rolls = [];
  for (let i = 0; i < qty; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    total += r;
  }
  return { rolls, total };
}

export function rollAttack() {
  const { rolls, total } = rollDice(20);
  const isCrit = rolls[0] === 20;
  const isFail = rolls[0] === 1;
  return { rolls, total, isCrit, isFail };
}

// Dano físico: dados baseados na arma + Força (recalibrado para HP x10)
export function physicalDamage(attacker, weapon, racialMult = 1) {
  const danoBase = weapon ? weapon.danoBase || 4 : 2;
  const dados = Math.max(1, Math.round(danoBase / 3) + 1);
  const bonusForca = weapon && weapon.bonus ? weapon.bonus.forca || 0 : 0;
  const bonus = Math.round(attacker.attributes.forca * 1.5 + bonusForca * 2);
  const multi = (attacker._buffPhysical || 1) * racialMult;
  return rollDamage(6, dados, Math.round(bonus * multi));
}

// Dano mágico: baseado na inteligência e no poder da magia
export function magicDamage(attacker, spell) {
  const bonus = Math.round(attacker.attributes.inteligencia * (spell.poder || 1) * 1.4);
  const multi = attacker._buffMagic || 1;
  const extra = Math.round(bonus * multi);
  const qty = Math.max(1, Math.round(spell.poder));
  return rollDamage(6, qty, extra);
}

export function rollDamage(diceSides, diceQty, bonus) {
  const { rolls, total } = rollDice(diceSides, diceQty, bonus);
  return { rolls, total };
}
