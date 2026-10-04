// ─────────────────────────────────────────────────────────────────────────────
// DUNGEONS — CONFIRMADA (progressão inicial definida pelo criador)
//   Manequim de madeira → LV 1–5
//   Esqueleto           → LV 5–10
//   Zumbi               → LV 10–15
//   Mini Golem          → mini-chefe LV 20
//   Golem de Pedra      → chefe LV 25
// PROVISÓRIO: quantidade de ondas, recompensas em moedas e gemas.
// ─────────────────────────────────────────────────────────────────────────────
import { MONSTERS, buildMonster, monsterXp } from './monsters.js';
import { estadoEclipse } from './eclipse.js';

export const DUNGEONS = [
  {
    id: 'sala_treino',
    nome: 'Sala de Treinamento',
    nivelMin: 1,
    nivelMax: 5,
    icone: '🪵',
    descricao: 'Manequins de madeira e goblins de treino. O primeiro sangue de qualquer aventureiro.',
    flavour: 'O cheiro de serragem enche o corredor.',
    ondas: [
      { monstro: 'horda_goblins', quantidade: 1, rotulo: 'Horda de goblins' },
      { monstro: 'manequim', quantidade: 2, rotulo: 'Manequins de madeira' },
    ],
    chefe: null,
    subchefe: null,
    puzzles: ['Alvo de treino: acerte o manequim 3x seguidas para liberar a sala.'],
    recompensas: { xp: 180, moedas: 120, gemas: [], equipamentos: [] },
  },
  {
    id: 'cripta_ossada',
    nome: 'Cripta Ossuda',
    nivelMin: 5,
    nivelMax: 10,
    icone: '💀',
    descricao: 'Esqueletos guardam túmulos antigos e o primeiro golem incompleto.',
    flavour: 'O som de ossos rolando ecoa por anos.',
    ondas: [
      { monstro: 'esqueleto', quantidade: 2, rotulo: 'Esqueletos' },
      { monstro: 'esqueleto_arqueiro', quantidade: 1, rotulo: 'Esqueleto arqueiro' },
    ],
    subchefe: 'mini_golem',
    chefe: null,
    puzzles: ['Quebre os três sarcófagos antes de tocar no selo final.'],
    recompensas: { xp: 320, moedas: 240, gemas: ['obsidiana'], equipamentos: [] },
  },
  {
    id: 'panteao_camuflado',
    nome: 'Panteão Camuflado',
    nivelMin: 10,
    nivelMax: 15,
    icone: '🧟',
    descricao: 'Zumbis, sarcófagos selados e uma horda que não deveria existir.',
    flavour: 'Eles se movem. Devagar. Mas se movem.',
    ondas: [
      { monstro: 'horda_zumbis', quantidade: 1, rotulo: 'Horda de zumbis' },
      { monstro: 'zumbi_bruto', quantidade: 1, rotulo: 'Zumbi Bruto' },
    ],
    subchefe: 'zumbi_bruto',
    chefe: null,
    puzzles: ['Ilumine as velas na ordem correta antes do amanhecer.'],
    recompensas: { xp: 480, moedas: 400, gemas: ['pedra_de_sangue'], equipamentos: [] },
  },
  {
    id: 'oficina_ferro',
    nome: 'Oficina de Ferro',
    nivelMin: 18,
    nivelMax: 22,
    icone: '🔨',
    descricao: 'Um ferreiro obra mini-golems. Você precisa parar a montagem.',
    flavour: 'Marteladas ritmadas. Algo está sendo acordado.',
    ondas: [
      { monstro: 'goblin', quantidade: 3, rotulo: 'Goblins Soldados' },
      { monstro: 'morcego_gigante', quantidade: 1, rotulo: 'Morcego Gigante' },
    ],
    subchefe: 'mini_golem',
    chefe: null,
    puzzles: ['Resolva o mecanismo da forja sem acionar a bigorna.'],
    recompensas: { xp: 700, moedas: 700, gemas: ['diamante'], equipamentos: ['martelo_sagrado'] },
  },
  {
    id: 'golem_pedra',
    nome: 'Câmara do Golem de Pedra',
    nivelMin: 23,
    nivelMax: 30,
    icone: '🗿',
    descricao: 'O Golem de Pedra desperta. Chefes ganham novas habilidades e passivas.',
    flavour: 'A pedra respira. Devagar. Como um coração adormecido.',
    ondas: [
      { monstro: 'esqueleto', quantidade: 2, rotulo: 'Guardas' },
      { monstro: 'morcego_gigante', quantidade: 2, rotulo: 'Morcegos Gigantes' },
    ],
    subchefe: 'mini_golem',
    chefe: 'golem_pedra',
    puzzles: ['Enfraqueça os pilares antes do despertar do Golem.'],
    recompensas: { xp: 1200, moedas: 1500, gemas: ['diamante'], equipamentos: ['martelo_sagrado'] },
  },
];

export const DUNGEON_KEYS = DUNGEONS.map((d) => d.id);

/** Dungeon indicada para um nível (a de faixa que contém o nível, ou a próxima). */
export function dungeonPorNivel(nivel) {
  const n = Number(nivel) || 1;
  return DUNGEONS.find((d) => n >= d.nivelMin && n <= d.nivelMax)
    || DUNGEONS.find((d) => n < d.nivelMin)
    || DUNGEONS[DUNGEONS.length - 1];
}

/** Todas as dungeons liberadas para o nível (inclui faixa imediatamente acima). */
export function dungeonsDisponiveis(nivel, dia = 1, tipoEclipse = 'comum') {
  const n = Number(nivel) || 1;
  const est = estadoEclipse(dia, tipoEclipse);
  return DUNGEONS
    .filter((d) => n >= d.nivelMin - 2)
    .map((d) => {
      const sensivelEclipse = d.nivelMin >= 18;
      const bonusEclipse = sensivelEclipse && est.eclipseAtivo ? 1.5 : 1;
      const bloqueada = n < d.nivelMin;
      return {
        ...d,
        bloqueada,
        motivoBloqueio: bloqueada ? `Requer nível ${d.nivelMin}` : null,
        recompensaXp: Math.round(d.recompensas.xp * bonusEclipse),
        recompensaMoedas: Math.round(d.recompensas.moedas * bonusEclipse),
        bonusEclipse,
      };
    });
}

/** XP total previsto de uma dungeon (sem contar o Eclipse). */
export function dungeonXpTotal(d) {
  let xp = d.recompensas?.xp || 0;
  if (d.subchefe && MONSTERS[d.subchefe]) xp += monsterXp(MONSTERS[d.subchefe]);
  if (d.chefe && MONSTERS[d.chefe]) xp += monsterXp(MONSTERS[d.chefe]);
  return xp;
}

/**
 * Escala um participante pelo Eclipse (multiplicador por atributo já aplicado
 * nos números finais). Hordes escalam o HP por corpo, não só o total.
 */
function escalaEclipse(p, est) {
  if (!est.eclipseAtivo) return p;
  const fator = est.monstroMult;
  if (p.horda) {
    p.horda.hpPorUnidade = Math.max(1, Math.round(p.horda.hpPorUnidade * fator));
    p.hp = p.hpMax = p.horda.hpPorUnidade * p.horda.quantidade;
  } else {
    p.hp = p.hpMax = Math.round(p.hpMax * fator);
  }
  p.eclipse = true;
  p.passiva = `${p.passiva || ''} Eclipse: +${Math.round((fator - 1) * 100)}% de atributos.`.trim();
  return p;
}

/**
 * Monta os encontros de uma dungeon como participantes prontos para batalha.
 * `nivelJogadores` ajusta a escala dos chefes (soma de HP dos jogadores).
 */
export function montarEncontro(dungeonId, { nivelJogadores = 1, dia = 1, tipoEclipse = 'comum' } = {}) {
  const d = DUNGEONS.find((x) => x.id === dungeonId);
  if (!d) return null;
  const est = estadoEclipse(dia, tipoEclipse);

  // Soma de HP aproximada dos jogadores (usa RES típica do nível para o chefe).
  const resTipica = Math.min(10, 3 + Math.floor(nivelJogadores / 4));
  const somaHpJogadores = Math.max(120, resTipica * 10 * Math.max(1, nivelJogadores));

  const participantes = [];
  const monstroIds = [];
  for (const onda of d.ondas) {
    for (let i = 0; i < onda.quantidade; i += 1) {
      const def = MONSTERS[onda.monstro];
      if (!def) continue;
      const p = buildMonster({ ...def, _uid: `${d.id}_${onda.monstro}_${i}` }, somaHpJogadores);
      p.ondaRotulo = onda.rotulo;
      escalaEclipse(p, est);
      participantes.push(p);
      monstroIds.push(onda.monstro);
    }
  }

  if (d.subchefe && MONSTERS[d.subchefe]) {
    const p = buildMonster({ ...MONSTERS[d.subchefe], _uid: `${d.id}_subchefe` }, somaHpJogadores);
    p.ondaRotulo = 'Subchefe';
    escalaEclipse(p, est);
    participantes.push(p);
    monstroIds.push(d.subchefe);
  }

  if (d.chefe && MONSTERS[d.chefe]) {
    const p = buildMonster({ ...MONSTERS[d.chefe], _uid: `${d.id}_chefe` }, somaHpJogadores);
    p.ondaRotulo = 'Chefe';
    escalaEclipse(p, est);
    if (est.eclipseAtivo) {
      // Chefes ganham ação extra e HP conforme o multiplicador de chefe.
      p.acoesPorTurno = (p.acoesPorTurno || 1) + est.chefeAcoesExtra;
      p.hp = p.hpMax = Math.round(p.hpMax * est.chefeMult);
    }
    participantes.push(p);
    monstroIds.push(d.chefe);
  }

  return {
    dungeon: d,
    eclipse: est,
    somaHpJogadores,
    participantes,
    // Ids na ordem de entrada: a página usa para montar a batalha pelo socket.
    monstroIds,
    recompensas: {
      ...d.recompensas,
      xp: Math.round((d.recompensas?.xp || 0) * (est.eclipseAtivo ? est.xpMult : 1)),
      moedas: Math.round((d.recompensas?.moedas || 0) * (est.eclipseAtivo ? 1.5 : 1)),
    },
  };
}