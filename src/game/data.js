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
  golpe_sangrento: { nome: 'Golpe Sangrento', tipo: 'ataque', custo: 5, poder: 2.0, desc: 'Ataque físico brutal com força aumentada.', status: { tipo: 'sangramento', turnos: 2, dano: 6 } },
  grito_de_guerra: { nome: 'Grito de Guerra', tipo: 'buff', custo: 6, poder: 0.15, desc: 'Aumenta o dano físico de todos os aliados.' },
  muralha: { nome: 'Muralha', tipo: 'defesa', custo: 6, poder: 0.25, desc: 'Reduz o dano recebido nesta rodada.' },

  bola_de_fogo: { nome: 'Bola de Fogo', tipo: 'ataque', custo: 8, poder: 2.4, desc: 'Explosão de fogo devastadora.', status: { tipo: 'queimadura', turnos: 3, dano: 5 } },
  raio: { nome: 'Raio', tipo: 'ataque', custo: 6, poder: 1.8, desc: 'Descarga elétrica precisa.' },
  gelo: { nome: 'Gelo', tipo: 'ataque', custo: 7, poder: 1.6, desc: 'Congela o alvo e reduz a velocidade dele.', status: { tipo: 'congelamento', turnos: 2 } },
  escudo_arcano: { nome: 'Escudo Arcano', tipo: 'defesa', custo: 7, poder: 0.3, desc: 'Barreira mágica que absorve dano.' },

  tiro_preciso: { nome: 'Tiro Preciso', tipo: 'ataque', custo: 4, poder: 1.5, desc: 'Dano crítico elevado.' },
  chuva_de_flechas: { nome: 'Chuva de Flechas', tipo: 'ataque', custo: 9, poder: 2.2, desc: 'Acerta todos os inimigos.' },
  flecha_ardente: { nome: 'Flecha Ardente', tipo: 'ataque', custo: 6, poder: 1.9, desc: 'Flecha em chamas que causa queimadura.', status: { tipo: 'queimadura', turnos: 3, dano: 6 } },

  cura: { nome: 'Cura', tipo: 'cura', custo: 6, poder: 2.0, desc: 'Restaura HP com base na inteligência.' },
  cura_massa: { nome: 'Cura em Massa', tipo: 'cura', custo: 12, poder: 1.2, desc: 'Cura todos os aliados vivos.' },
  luz_sagrada: { nome: 'Luz Sagrada', tipo: 'ataque', custo: 7, poder: 1.9, desc: 'Dano divino contra um inimigo.' },
  benção: { nome: 'Benção', tipo: 'buff', custo: 5, poder: 0.1, desc: 'Aumenta o dano mágico dos aliados.' },

  golpe_preciso: { nome: 'Golpe Preciso', tipo: 'ataque', custo: 5, poder: 1.6, desc: 'Ataque certeiro que tem alta chance de crítico.' },
  veneno: { nome: 'Veneno', tipo: 'ataque', custo: 6, poder: 1.4, desc: 'Envenena o alvo, causando dano contínuo.', status: { tipo: 'veneno', turnos: 3, dano: 4 } },
  sombra: { nome: 'Sombra', tipo: 'defesa', custo: 5, poder: 0.3, desc: 'Desaparece nas sombras, reduzindo muito o dano recebido.' },

  golpe_sagrado: { nome: 'Golpe Sagrado', tipo: 'ataque', custo: 7, poder: 2.0, desc: 'Espada envolta em luz sagrada.' },
  escudo_divino: { nome: 'Escudo Divino', tipo: 'defesa', custo: 7, poder: 0.3, desc: 'Barreira sagrada que absorve dano.' },
};

export const WEAPON_STATES = {
  otima:       { nome: 'Ótima',       cor: '#3ddc84', multDano: 1.0, multDefesa: 1.0 },
  manutencao:  { nome: 'Manutenção',  cor: '#f5c542', multDano: 0.85, multDefesa: 0.9 },
  danificada:  { nome: 'Danificada',  cor: '#ff6b35', multDano: 0.65, multDefesa: 0.7 },
  quebrada:    { nome: 'Quebrada',    cor: '#dc3545', multDano: 0.0,  multDefesa: 0.0 },
};

export const ALCANCE_TYPES = {
  corpo:  { nome: 'Corpo a Corpo', ordem: 1 },
  medio:  { nome: 'Médio Alcance', ordem: 2 },
  longo:  { nome: 'Longo Alcance', ordem: 3 },
};

export const EQUIPMENT = {
  armas: {
    // ── Armas brancas ─────────────────────
    espada_curta: { nome: 'Espada Curta', tipo: 'arma', danoBase: 4, bonus: { forca: 1 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Lâmina curta e ágil, ideal para combate apertado.' },
    espada_longa: { nome: 'Espada Longa', tipo: 'arma', danoBase: 7, bonus: { forca: 2 }, socketSlots: 2, alcance: 'corpo', recarga: 0, descricao: 'Versátil e equilibrada, a clássica espada medieval.' },
    machado_de_guerra: { nome: 'Machado de Guerra', tipo: 'arma', danoBase: 9, bonus: { forca: 3 }, socketSlots: 3, alcance: 'corpo', recarga: 0, descricao: 'Pesado e devastador, machados cortam armaduras com facilidade.' },
    adaga_dupla: { nome: 'Adaga Dupla', tipo: 'arma', danoBase: 4, bonus: { destreza: 3 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Lâminas gêmeas para o assassino implacável.' },
    martelo_sagrado: { nome: 'Martelo Sagrado', tipo: 'arma', danoBase: 6, bonus: { inteligencia: 1, resistencia: 1 }, socketSlots: 3, alcance: 'corpo', recarga: 0, descricao: 'Arma de clérigos, esmaga com fé inabalável.' },
    adaga_ritual: { nome: 'Adaga Ritual', tipo: 'arma', danoBase: 5, bonus: { reflexos: 2 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Usada em rituais, corta com precisão sobrenatural.' },

    // ── Armas de longo alcance ─────────────
    arco_simples: { nome: 'Arco Simples', tipo: 'arma', danoBase: 5, bonus: { destreza: 2 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Confiável e silencioso, perfeito para emboscadas.' },
    arco_longo: { nome: 'Arco Longo', tipo: 'arma', danoBase: 8, bonus: { destreza: 3 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Alcance superior, letal à distância.' },
    lanca_sagrada: { nome: 'Lança Sagrada', tipo: 'arma', danoBase: 8, bonus: { forca: 2, resistencia: 1 }, socketSlots: 2, alcance: 'medio', recarga: 0, descricao: 'Reach advantage — perfura inimigos antes que cheguem perto.' },

    // ── Magias canalizadas ─────────────────
    cajado_arcano: { nome: 'Cajado Arcano', tipo: 'arma', danoBase: 3, bonus: { inteligencia: 2 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Canaliza energia arcanosa através de um cristal precioso.' },
    orbe_magico: { nome: 'Orbe Mágico', tipo: 'arma', danoBase: 2, bonus: { inteligencia: 3 }, socketSlots: 1, alcance: 'longo', recarga: 0, descricao: 'Esfera flutuante que amplifica magia pura.' },

    // ── Armas de fogo ──────────────────────
    pistola: { nome: 'Pistola', tipo: 'arma_fogo', danoBase: 6, bonus: { destreza: 1 }, socketSlots: 1, alcance: 'longo', recarga: 1, descricao: 'Rápida e letal, mas imprecisa à distância.' },
    mosquete: { nome: 'Mosquete', tipo: 'arma_fogo', danoBase: 8, bonus: { forca: 1 }, socketSlots: 2, alcance: 'longo', recarga: 2, descricao: 'O ye olde clássico — lenta mas devastadora.' },
    bacamarte: { nome: 'Bacamarte', tipo: 'arma_fogo', danoBase: 7, bonus: { forca: 1 }, socketSlots: 1, alcance: 'medio', recarga: 2, descricao: 'Dispara chumbos em cone, eficaz contra grupos.' },
    rifle_de_caca: { nome: 'Rifle de Caça', tipo: 'arma_fogo', danoBase: 9, bonus: { destreza: 2 }, socketSlots: 2, alcance: 'longo', recarga: 2, descricao: 'Precisão cirúrgica, cara e rara.' },
    besta_pesada: { nome: 'Besta Pesada', tipo: 'arma_fogo', danoBase: 7, bonus: { forca: 1 }, socketSlots: 2, alcance: 'longo', recarga: 1, descricao: 'Mais lenta que arco mas ignora parcialmente defesa.' },
    espada_baioneta: { nome: 'Espada Baioneta', tipo: 'arma_fogo', danoBase: 5, bonus: { forca: 1, destreza: 1 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Mosquete com baioneta — funciona como lança em combate corpo a corpo.' },
    cajado_de_fogo: { nome: 'Cajado de Fogo', tipo: 'arma_fogo', danoBase: 4, bonus: { inteligencia: 2 }, socketSlots: 2, alcance: 'longo', recarga: 1, descricao: 'Cajado arcano que dispara projéteis de fogo incandescentes.' },
    arco_composto: { nome: 'Arco Composto', tipo: 'arma_fogo', danoBase: 7, bonus: { destreza: 2 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Arco reforçado com lâmina — multiclasse de precisão.' },
  },
  armaduras: {
    roupa_de_aventureiro: { nome: 'Roupa de Aventureiro', tipo: 'armadura', defesa: 2, socketSlots: 1, descricao: 'Proteção básica, leve e flexível.' },
    couro: { nome: 'Armadura de Couro', tipo: 'armadura', defesa: 4, socketSlots: 2, descricao: 'Boa proteção sem sacrificar mobilidade.' },
    cota_de_malha: { nome: 'Cota de Malha', tipo: 'armadura', defesa: 6, socketSlots: 3, penalidade: { reflexos: -1 }, descricao: 'Malha de anéis entrelaços — robusta e confiável.' },
    armadura_de_placas: { nome: 'Armadura de Placas', tipo: 'armadura', defesa: 9, socketSlots: 4, penalidade: { reflexos: -1, destreza: -1 }, descricao: 'Fortaleza ambulante — pesada mas praticamente impenetrável.' },
    manto_arcano: { nome: 'Manto Arcano', tipo: 'armadura', defesa: 3, socketSlots: 2, bonus: { inteligencia: 1 }, descricao: 'Tecido encantado que canaliza mana e protege o conjurador.' },
    vestes_sagradas: { nome: 'Vestes Sagradas', tipo: 'armadura', defesa: 3, socketSlots: 2, bonus: { inteligencia: 1 }, descricao: 'Roupas rituais imbuídas de fé divina.' },
    armadura_leve: { nome: 'Armadura Leve', tipo: 'armadura', defesa: 5, socketSlots: 2, bonus: { reflexos: 1 }, descricao: 'Proteção reforçada com mobilidade.' },
  },
};

// Efeitos de status aplicados em batalha.
// tipo: dot = dano por turno | hot = cura por turno | debuff = penalidade passiva | cc = controle (pula turnos)
export const STATUS_DEFS = {
  queimadura: { id: 'queimadura', nome: 'Queimadura', icon: '🔥', tipo: 'dot', desc: 'Causa dano de fogo a cada turno.' },
  sangramento: { id: 'sangramento', nome: 'Sangramento', icon: '🩸', tipo: 'dot', desc: 'Perde HP a cada turno.' },
  veneno: { id: 'veneno', nome: 'Veneno', icon: '☠️', tipo: 'dot', desc: 'Causa dano de veneno a cada turno.' },
  regeneracao: { id: 'regeneracao', nome: 'Regeneração', icon: '🌿', tipo: 'hot', desc: 'Recupera HP a cada turno.' },
  lentidao: { id: 'lentidao', nome: 'Lentidão', icon: '🐢', tipo: 'debuff', desc: 'Reduz a precisão e a esquiva.' },
  cegueira: { id: 'cegueira', nome: 'Cegueira', icon: '🌫️', tipo: 'debuff', desc: 'Reduz muito a chance de acerto.' },
  fraqueza: { id: 'fraqueza', nome: 'Fraqueza', icon: '💢', tipo: 'debuff', desc: 'Reduz o dano físico e mágico causado.' },
  congelamento: { id: 'congelamento', nome: 'Congelamento', icon: '🧊', tipo: 'cc', desc: 'Pula os turnos até se libertar do gelo.' },
};

export const STATUS_KEYS = Object.keys(STATUS_DEFS);

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

// ── Helpers para o Arsenal / Compendium ─────────────────

export const WEAPON_CATEGORIES = {
  branca: { nome: 'Armas Brancas', icon: '⚔️', filter: (w) => w.tipo === 'arma' && ['corpo', 'medio'].includes(w.alcance || 'corpo') },
  fogo:   { nome: 'Armas de Fogo', icon: '🔫', filter: (w) => w.tipo === 'arma_fogo' },
  magica: { nome: 'Armas Mágicas', icon: '✨', filter: (w) => w.tipo === 'arma' && w.alcance === 'longo' && (w.bonus?.inteligencia || 0) >= 2 },
};

export function getWeaponsByCategory(categoryKey) {
  const cat = WEAPON_CATEGORIES[categoryKey];
  if (!cat) return [];
  return Object.entries(EQUIPMENT.armas)
    .filter(([, w]) => cat.filter(w))
    .map(([id, w]) => ({ id, ...w }));
}

export function getAllWeapons() {
  return Object.entries(EQUIPMENT.armas).map(([id, w]) => ({ id, ...w }));
}

export function getAllArmors() {
  return Object.entries(EQUIPMENT.armaduras).map(([id, a]) => ({ id, ...a }));
}
