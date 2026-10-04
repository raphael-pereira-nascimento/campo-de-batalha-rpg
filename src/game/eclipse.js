// ─────────────────────────────────────────────────────────────────────────────
// O ECLIPSE — CONFIRMADA (existência, efeitos e periodicidade de ~30 dias)
// PROVISÓRIA: os multiplicadores numéricos e os buffs por raça.
// ─────────────────────────────────────────────────────────────────────────────
export const ECLIPSE_PERIODO = 30; // CONFIRMADA: aproximadamente a cada 30 dias

// Cronograma dentro do ciclo (dia 1..30):
//   1–24  normal | 25–27 primeiros sinais | 28–29 atividade crescente
//   30   Eclipse | dias seguintes: influência residual
export const FASES_ECLIPSE = {
  normal: {
    id: 'normal',
    nome: 'Dia comum',
    icon: '☀️',
    desc: 'O mundo está tranquilo. Monstros em seu estado habitual.',
    atividadeMult: 1,
    xpMult: 1,
    monstroMult: 1,
    chefeMult: 1,
    chefeAcoesExtra: 0,
    varianteChance: 0,
    agressividade: 1,
  },
  sinais: {
    id: 'sinais',
    nome: 'Primeiros sinais',
    icon: '🌑',
    desc: 'O céu escurece nas bordas. Monstros inquietos e XP levemente maior.',
    atividadeMult: 1.15,
    xpMult: 1.1,
    monstroMult: 1.05,
    chefeMult: 1.1,
    chefeAcoesExtra: 0,
    varianteChance: 0.05,
    agressividade: 1.15,
  },
  inquietacao: {
    id: 'inquietacao',
    nome: 'Atividade crescente',
    icon: '🌒',
    desc: 'Monstros saem em bandos, ficam mais fortes e o XP aumenta.',
    atividadeMult: 1.35,
    xpMult: 1.25,
    monstroMult: 1.15,
    chefeMult: 1.25,
    chefeAcoesExtra: 0,
    varianteChance: 0.15,
    agressividade: 1.35,
  },
  eclipse: {
    id: 'eclipse',
    nome: 'O ECLIPSE',
    icon: '🩸',
    desc: 'O evento mundial: monstros pacíficos ficam agressivos, chefes ganham novas habilidades, XP e recompensas sobem.',
    atividadeMult: 1.75,
    xpMult: 1.5,
    monstroMult: 1.35,
    chefeMult: 1.5,
    chefeAcoesExtra: 1,
    varianteChance: 0.35,
    agressividade: 2,
  },
  residual: {
    id: 'residual',
    nome: 'Influência residual',
    icon: '🌘',
    desc: 'O Eclipse passou, mas o mundo ainda está alterado.',
    atividadeMult: 1.1,
    xpMult: 1.05,
    monstroMult: 1.05,
    chefeMult: 1.05,
    chefeAcoesExtra: 0,
    varianteChance: 0.05,
    agressividade: 1.1,
  },
};

export const TIPOS_ECLIPSE = {
  comum: { id: 'comum', nome: 'Eclipse Comum', desc: 'O evento padrão de 30 em 30 dias.' },
  maior: { id: 'maior', nome: 'Eclipse Maior', desc: 'Mais forte e mais longo. Modificadores maiores.' },
  raro: { id: 'raro', nome: 'Eclipse Raro', desc: 'Evento excepcional: multiplicadores extremos.' },
};

// Multiplicadores por tipo de eclipse (PROVISÓRIO).
const ESCALA_TIPO = {
  comum: 1,
  maior: 1.5,
  raro: 2.25,
};

/** Dia dentro do ciclo de 30 dias (1..30). */
export function diaNoCiclo(dia) {
  const d = Math.max(1, Math.floor(Number(dia) || 1));
  return ((d - 1) % ECLIPSE_PERIODO) + 1;
}

function faseDoCiclo(diaCiclo) {
  if (diaCiclo >= ECLIPSE_PERIODO) return 'eclipse';
  if (diaCiclo >= 28) return 'inquietacao';
  if (diaCiclo >= 25) return 'sinais';
  return 'normal';
}

/**
 * Estado do Eclipse para um dia do calendário do RPG.
 * Retorna a fase, se o Eclipse está ativo, sinais de aproximação e os
 * multiplicadores que o combate deve aplicar.
 */
export function estadoEclipse(dia = 1, tipo = 'comum') {
  const d = Math.max(1, Math.floor(Number(dia) || 1));
  const ciclo = Math.floor((d - 1) / ECLIPSE_PERIODO) + 1;
  const diaCiclo = diaNoCiclo(d);
  const baseId = faseDoCiclo(diaCiclo);
  // No dia 1 do novo ciclo ainda sobra influência do Eclipse anterior.
  const id = baseId === 'normal' && diaCiclo === 1 ? 'residual' : baseId;
  const base = FASES_ECLIPSE[id];
  const escala = ESCALA_TIPO[tipo] || 1;

  const escalaMult = (v) => Math.round(v * escala * 100) / 100;
  return {
    dia: d,
    ciclo,
    diaNoCiclo: diaCiclo,
    periodo: ECLIPSE_PERIODO,
    tipo,
    tipoNome: (TIPOS_ECLIPSE[tipo] || TIPOS_ECLIPSE.comum).nome,
    fase: id,
    nome: base.nome,
    icon: base.icon,
    desc: base.desc,
    eclipseAtivo: id === 'eclipse',
    sinais: ['sinais', 'inquietacao', 'eclipse'].includes(id),
    diasParaEclipse: ((ECLIPSE_PERIODO - diaCiclo + ECLIPSE_PERIODO) % ECLIPSE_PERIODO),
    atividadeMult: escalaMult(base.atividadeMult),
    xpMult: escalaMult(base.xpMult),
    monstroMult: escalaMult(base.monstroMult),
    chefeMult: escalaMult(base.chefeMult),
    chefeAcoesExtra: escala >= 1.5 && id === 'eclipse' ? 1 : base.chefeAcoesExtra,
    varianteChance: Math.min(0.9, Math.round(base.varianteChance * escala * 100) / 100),
    agressividade: escalaMult(base.agressividade),
  };
}

// ── Buffs de raça durante o Eclipse (PROVISÓRIO, só no Eclipse ativo) ──
export const BUFFS_ECLIPSE_RACA = {
  draconiano: { danoMagicoMult: 0.15, passiva: 'Fôlego de Dragão: +15% de dano mágico durante o Eclipse.' },
  fada: { manaMaxMult: 0.1, passiva: 'Essência da Natureza: +10% de Mana máxima no Eclipse.' },
  vampiro: { rouboVida: 0.05, passiva: 'Sede de Sangue: +5% de roubo de vida no Eclipse.' },
  orc: { danoFisicoMult: 0.1, passiva: 'Fúria: +10% de dano físico durante o Eclipse.' },
  zumbi: { resisteMorte: 1, passiva: 'Morto-vivo: resiste à morte uma vez durante o Eclipse.' },
  semi_demonio: { critBonus: 0.05, passiva: 'Sangue infernal: +5% de crítico no Eclipse.' },
  elfo_lua: { esquivaBonus: 0.05, passiva: 'Umbracinese: +5% de esquiva no Eclipse.' },
  anao: { reducaoDanoFisico: 0.05, passiva: 'Robustez: -5% de dano físico no Eclipse.' },
  harpia: { esquivaBonus: 0.05, passiva: 'Voo pluma: +5% de esquiva no Eclipse.' },
  semi_anjo: { regenMana: 3, passiva: 'Luz Divina: +3 MP por turno no Eclipse.' },
};

/** Efeitos extras de uma raça durante o Eclipse (vazio fora do Eclipse). */
export function buffsEclipseRaca(races, estado) {
  const out = {};
  const notas = [];
  if (!estado?.eclipseAtivo) return { efeitos: out, notas };
  for (const r of races || []) {
    const buff = BUFFS_ECLIPSE_RACA[r.id];
    if (!buff) continue;
    for (const [k, v] of Object.entries(buff)) {
      if (k === 'passiva') continue;
      out[k] = (out[k] || 0) + v;
    }
    if (buff.passiva) notas.push(buff.passiva);
  }
  return { efeitos: out, notas };
}

// ── Variantes de monstros durante o Eclipse (PROVISÓRIO) ──
export const VARIANTES_ECLIPSE = {
  possesso: {
    id: 'possesso',
    nome: 'Possesso',
    prefixo: 'Possuído',
    efeitos: { danoFisicoMult: 0.15, danoMagicoMult: 0.15 },
    desc: 'Monstro possuído: +15% de dano físico e mágico.',
  },
  sangue: {
    id: 'sangue',
    nome: 'Sangue Sedento',
    prefixo: 'Sedento',
    efeitos: { rouboVida: 0.2 },
    desc: 'Sedento de sangue: cura 20% do dano que causa.',
  },
  furia: {
    id: 'furia',
    nome: 'Fúria Eclipse',
    prefixo: 'Furioso',
    efeitos: { esquivaBonus: 0.1, danoFisicoMult: 0.1 },
    desc: 'Furioso: +10% de esquiva e +10% de dano físico.',
  },
  ungido: {
    id: 'ungido',
    nome: 'Ungido pela Sombra',
    prefixo: 'Sombrio',
    efeitos: { reducaoDanoMagico: 0.25 },
    desc: 'Ungido pela sombra: -25% de dano mágico recebido.',
  },
};

/** Sorteia (ou não) uma variante de monstro para o Eclipse. */
export function sortearVarianteEclipse(estado, random = Math.random) {
  if (!estado?.eclipseAtivo) return null;
  const chaves = Object.keys(VARIANTES_ECLIPSE);
  if (!chaves.length || random() > (estado.varianteChance || 0)) return null;
  return VARIANTES_ECLIPSE[chaves[Math.floor(random() * chaves.length)]];
}

/** Multiplica os atributos de um monstro conforme o Eclipse (PROVISÓRIO). */
export function aplicarEclipseEmMonstro(monsterDef, estado) {
  if (!estado || estado.monstroMult === 1) return monsterDef;
  const m = estado.monstroMult;
  const attributes = { ...monsterDef.attributes };
  for (const k of Object.keys(attributes)) {
    attributes[k] = Math.max(1, Math.min(12, Math.round((attributes[k] || 1) * m * 10) / 10));
  }
  return {
    ...monsterDef,
    attributes,
    efeitos: { ...(monsterDef.efeitos || {}) },
    eclipse: estado.eclipseAtivo,
    passiva: estado.eclipseAtivo
      ? `${monsterDef.passiva || ''} Durante o Eclipse: +${Math.round((m - 1) * 100)}% de atributos.`.trim()
      : monsterDef.passiva,
  };
}

/**
 * Chefe durante o Eclipse ganha HP extra, ação extra e passiva própria.
 * `hpBase` é o HP que o chefe teria fora do Eclipse (regra do criador:
 * HP do chefe = soma do HP do grupo x multiplicador).
 */
export function aplicarEclipseEmChefe(chefe, { estado, hpBase } = {}) {
  if (!chefe || !estado) return chefe;
  const mult = estado.chefeMult || 1;
  const extra = estado.chefeAcoesExtra || 0;
  if (mult === 1 && extra === 0) return chefe;
  const base = hpBase ?? chefe.hpMax ?? 0;
  const hp = Math.max(50, Math.round(base * mult));
  const acoes = (chefe.acoesPorTurno || 1) + extra;
  return {
    ...chefe,
    hpMax: hp,
    hp: hp,
    acoesPorTurno: acoes,
    efeitos: { ...(chefe.efeitos || {}), ...(estado.eclipseAtivo ? { danoFisicoMult: 0.15, danoMagicoMult: 0.15 } : {}) },
    passiva: `${chefe.passiva || 'Chefe.'} Eclipse: +${Math.round((mult - 1) * 100)}% de HP e +${extra} ação(ões) por turno.`.trim(),
  };
}