import { randomUUID } from 'node:crypto';
import { clamp } from '../utils.js';
import {
  CLASSES,
  SPELLS,
  EQUIPMENT,
  STATUS_DEFS,
  deriveStats,
  effectiveAttributes,
  speedOf,
  rollAttack,
  physicalDamage,
  magicDamage,
  efeitosDeHabilidades,
  MAX_PLAYERS_PER_BATTLE,
  armasDeEquipamento,
  melhorArma,
  armaParaAtaque,
  skillFromSpell,
} from './data.js';
import {
  manaRecuperada,
  pesoAtributo,
  alcanceVerticalDeArma,
  alcanceVerticalDeMagia,
  foraDoAlcanceVertical,
  distribuirXp,
  poolDeXp,
  danoFisicoGolpe,
  curaMagica,
  dificuldadeDoGolpe,
  DANO_COEF_MEGA,
  alvoNormalizado,
  desviouParaAliado,
  MULTI_FOGO_AMIGO_MULT,
  VOO,
  ALCANCE_VERTICAL,
  ALTITUDES,
} from './sistema.js';
import { estadoEclipse, sortearVarianteEclipse, aplicarEclipseEmChefe, aplicarVarianteEclipseEmChefe } from './eclipse.js';
import { RACES } from './races.js';
import { buildMonster, bossActionsPerTurn, chefeHpMultPorAdversarios } from './monsters.js';

let logCounter = 0;

function makeLog(text, kind = 'info') {
  logCounter += 1;
  return { id: logCounter, time: Date.now(), text, kind };
}

function attrLabel(name) {
  const labels = {
    forca: 'Força',
    inteligencia: 'Inteligência',
    resistencia: 'Resistência',
    destreza: 'Destreza',
    reflexos: 'Reflexos',
  };
  return labels[name] || name;
}

function skillsOf(p) {
  if (Array.isArray(p.skills) && p.skills.length) return p.skills;
  return (p.spells || [])
    .map((id) => SPELLS[id])
    .filter(Boolean)
    .map(skillFromSpell);
}

function classNameOf(p) {
  if (p.isMonster) return p.monsterName || p.charName;
  if (Array.isArray(p.classes) && p.classes.length) {
    return p.classes.map((c) => c.nome).join(' + ');
  }
  return CLASSES[p.cls]?.nome || p.cls;
}

function raceNamesOf(p) {
  if (Array.isArray(p.races) && p.races.length) return p.races.map((r) => r.nome);
  return p.race ? [RACES[p.race]?.nome || p.race] : [];
}

// Passivas das raças selecionadas somam seus efeitos mecânicos,
// junto das passivas extras compradas com pontos excedentes.
function efeitosDe(p) {
  if (p.isMonster) return p.monsterDef?.efeitos || {};
  const out = {};
  for (const race of p.races || []) {
    for (const [k, v] of Object.entries(race.efeito || {})) {
      out[k] = (out[k] || 0) + v;
    }
  }
  for (const [k, v] of Object.entries(efeitosDeHabilidades(p.habilidades))) {
    out[k] = (out[k] || 0) + v;
  }
  return out;
}

function hasStatus(p, id) {
  return Array.isArray(p.statuses) && p.statuses.some((s) => s.id === id);
}

// Resumo dos debuffs ativos (cegueira, lentidão, fraqueza) para as fórmulas.
function statusEffects(p) {
  const out = { accPenalty: 0, dodgePenalty: 0, danoMult: 1 };
  for (const s of p.statuses || []) {
    if (s.id === 'cegueira') out.accPenalty += 0.25;
    if (s.id === 'lentidao') {
      out.accPenalty += 0.1;
      out.dodgePenalty += 0.1;
    }
    if (s.id === 'fraqueza') out.danoMult *= 0.8;
  }
  return out;
}

function condicaoTexto(cond) {
  if (!cond) return 'nenhuma';
  const labels = {
    danoRecebido: `levar ${cond.valor} de dano`,
    hpPct: `HP abaixo de ${cond.valor}%`,
    kills: `conseguir ${cond.valor} abate(s)`,
    turnos: `após ${cond.valor} turno(s)`,
    aliadosCaidos: `${cond.valor} aliado(s) caído(s)`,
  };
  return labels[cond.tipo] || 'nenhuma';
}

export class BattleManager {
  constructor({ emit, saveBattle, onBattleEnd }) {
    this.battles = new Map();
    this.emit = emit;
    this.saveBattle = saveBattle;
    this.onBattleEnd = onBattleEnd;
  }

  listBattles() {
    return [...this.battles.values()].map((b) => ({
      id: b.id,
      name: b.name,
      mode: b.mode,
      status: b.status,
      players: b.participants.length,
      maxPlayers: MAX_PLAYERS_PER_BATTLE,
      hostName: b.hostName,
      hostRole: b.hostRole || null,
    }));
  }

  getBattle(id) {
    return this.battles.get(id) || null;
  }

  // Papéis do anfitrião ao entrar no combate:
  // 'jogador'        → apenas luta com seu personagem
  // 'mestre_jogador' → controla os inimigos e também luta (padrão no modo mestre)
  // 'mestre'         → somente mestre: controla os inimigos sem personagem próprio
  static resolveRole(mode, role) {
    if (mode !== 'mestre') return 'jogador';
    return ['mestre', 'mestre_jogador'].includes(role) ? role : 'mestre_jogador';
  }

  // `calendario` = { dia, tipoEclipse } do mundo do RPG (ver game/calendar.js).
  // `dungeonId` = opcional, indica que o encontro veio de uma dungeon.
  createBattle({ name, mode, host, hostName, character, role, aiEnabled, calendario, dungeonId }) {
    const normalized = ['todos', 'equipes', 'mestre'].includes(mode) ? mode : 'todos';
    const normalizedRole = BattleManager.resolveRole(normalized, role);
    const battle = {
      id: randomUUID(),
      name: name || 'Campo de Batalha',
      mode: normalized,
      status: 'lobby',
      host,
      hostName,
      hostRole: normalizedRole,
      aiEnabled: !!aiEnabled,
      participants: [],
      turnOrder: [],
      currentTurnIndex: 0,
      turno: 0,
      log: [],
      winner: null,
      createdAt: Date.now(),
      // Estado do Eclipse no momento da batalha (regra confirmada do criador).
      eclipse: estadoEclipse(calendario?.dia || 1, calendario?.tipoEclipse || 'comum'),
      dungeonId: dungeonId || null,
      xpPool: 0,
      monstrosAbatidosXp: [],
    };
    this.battles.set(battle.id, battle);
    if (normalizedRole === 'mestre') {
      battle.log.push(makeLog(`👑 ${hostName} entra como Mestre desta batalha.`));
    } else {
      this._joinCharacter(battle, host, hostName, character, null, 'hero');
    }
    this._logEclipse(battle);
    return battle;
  }

  _logEclipse(battle) {
    const e = battle.eclipse;
    if (!e) return;
    if (e.eclipseAtivo) {
      battle.log.push(
        makeLog(`🩸 ${e.icon} ${e.tipoNome.toUpperCase()} — DIA ${e.diaNoCiclo}/${e.periodo || 30}. Monstros +${Math.round((e.monstroMult - 1) * 100)}% e XP +${Math.round((e.xpMult - 1) * 100)}%.`, 'enemy'),
      );
    } else if (e.sinais) {
      battle.log.push(makeLog(`${e.icon} ${e.nome}: o Eclipse está se aproximando (${e.diasParaEclipse} dia(s)).`, 'info'));
    }
  }

  joinBattle({ battleId, playerId, playerName, character, team }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.status !== 'lobby') throw new Error('A batalha já começou.');
    if (battle.participants.length >= MAX_PLAYERS_PER_BATTLE)
      throw new Error(`Limite de ${MAX_PLAYERS_PER_BATTLE} participantes atingido.`);
    const already = battle.participants.find(
      (p) => p.characterId === character.id && !p.isMonster,
    );
    if (already) throw new Error('Este personagem já está na batalha.');

    let chosenTeam = null;
    if (battle.mode === 'equipes') {
      chosenTeam = team === 'B' ? 'B' : 'A';
    }
    this._joinCharacter(battle, playerId, playerName, character, chosenTeam, 'hero');
    return battle;
  }

  _joinCharacter(battle, playerId, playerName, character, team, role) {
    const races = JSON.parse(
      JSON.stringify(
        character.races && character.races.length
          ? character.races
          : [
              {
                id: character.race || 'humano',
                nome: RACES[character.race]?.nome || 'Humano',
                bonus: RACES[character.race]?.bonus || {},
                passiva: RACES[character.race]?.passiva || '',
                efeito: RACES[character.race]?.efeito || {},
              },
            ],
      ),
    );
    const classes = JSON.parse(
      JSON.stringify(character.classes && character.classes.length ? character.classes : []),
    );
    const stats = deriveStats(classes, character.level, character.attributes, character.equipment, races);
    battle.participants.push({
      uid: randomUUID(),
      characterId: character.id,
      playerId,
      playerName,
      charName: character.name,
      cls: classes[0]?.archetype || character.class,
      classes,
      races,
      passiva: character.passiva || '',
      race: character.race || (races[0] && races[0].id) || null,
      level: character.level,
      attributes: { ...character.attributes },
      equipment: JSON.parse(JSON.stringify(character.equipment || {})),
      spells: [...(character.spells || [])],
      skills: JSON.parse(JSON.stringify(character.skills || [])),
      ultimate: JSON.parse(JSON.stringify(character.ultimate || null)),
      especial: JSON.parse(JSON.stringify(character.especial || null)),
      gender: character.gender || null,
      habilidades: JSON.parse(JSON.stringify(character.habilidades || [])),
      inventory: JSON.parse(JSON.stringify(character.inventory || [])),
      hp: stats.hpMax,
      hpMax: stats.hpMax,
      mp: stats.mpMax,
      mpMax: stats.mpMax,
      defesa: stats.defesa,
      alive: true,
      team,
      role,
      isMonster: false,
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
      // ── Recarga das armas de fogo (id da arma → turnos de espera) ──
      wpnRecarga: {},
      // ── Arsenal: usos restantes das armas utilitárias nesta batalha ──
      wpnUsos: (() => {
        const usos = {};
        for (const { arma } of armasDeEquipamento(character.equipment)) {
          if (arma.categoria === 'utilitaria' && arma.usosMax) usos[arma.id] = arma.usosMax;
        }
        return usos;
      })(),
      drunk: false,
      drunkTurns: 0,
      // ── Mana: gasto do turno (recuperação = gasto ÷ 2) ──
      manaGastoTurno: 0,
      // ── Voo ──
      voando: false,
      altitude: 0,
      vooTipo: null,          // 'natural' | 'magico'
      vooTurnos: 0,
      vooFadiga: 0,
      vooNatural: (efeitosDe({ races }) || {}).vooNatural > 0,
      // ── XP por participação ──
      contribuicao: { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 },
    });
    battle.log.push(
      makeLog(`${playerName} entra na batalha com ${character.name} (${classNameOf(battle.participants[battle.participants.length - 1])})`),
    );
  }

  addMonster({ battleId, hostId, monsterDef, modoChefeDinamico }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.mode !== 'mestre') throw new Error('Só é possível adicionar inimigos em batalhas de mestre.');
    if (battle.status !== 'lobby') throw new Error('A batalha já começou.');
    if (battle.host !== hostId) throw new Error('Apenas o mestre pode adicionar inimigos.');
    if (battle.participants.length >= MAX_PLAYERS_PER_BATTLE)
      throw new Error(`Limite de ${MAX_PLAYERS_PER_BATTLE} participantes atingido.`);

    const uid = randomUUID();
    const eclipse = battle.eclipse || estadoEclipse(1);
    // Variante de monstro sorteada durante o Eclipse (regra do criador).
    const variante = sortearVarianteEclipse(eclipse);
    let def = { ...monsterDef, _uid: uid };
    // Chefes de bioma têm forma eclipsada própria (golpe extra + passiva).
    def = aplicarVarianteEclipseEmChefe(def, eclipse);
    if (variante) {
      // Sufixo para o nome não virar "Sedento Horda de Goblins".
      def.nome = `${def.nome} (${variante.prefixo})`;
      def.efeitos = { ...(def.efeitos || {}), ...variante.efeitos };
      def.passiva = `${def.passiva || ''} ${variante.desc}`.trim();
      def.varianteEclipse = variante.id;
    }
    const m = buildMonster(def);
    m.uid = uid;
    const heroes = battle.participants.filter((q) => !q.isMonster);
    const playerCount = heroes.length;
    const sumHeroHp = heroes.reduce((s, h) => s + h.hpMax, 0);

    // Durante o Eclipse os monstros ficam mais fortes (multiplicador por atributo).
    if (eclipse.monstroMult !== 1) {
      const escala = eclipse.monstroMult;
      const resAntes = def.attributes?.resistencia || 0;
      for (const key of Object.keys(m.attributes)) {
        m.attributes[key] = Math.max(1, Math.min(12, Math.round(m.attributes[key] * escala * 10) / 10));
      }
      const fatorRes = resAntes > 0 ? m.attributes.resistencia / resAntes : 1;
      if (m.horda) {
        m.horda.hpPorUnidade = Math.round(m.horda.hpPorUnidade * fatorRes);
        m.hp = m.hpMax = m.horda.hpPorUnidade * m.horda.quantidade;
      } else if (m.isBoss) {
        // Chefes são escalados pelo HP dos jogadores no startBattle.
        m.hp = m.hpMax = Math.round(m.hpMax * escala);
      } else {
        m.hp = m.hpMax = Math.round(m.hpMax * fatorRes);
      }
      m.eclipse = true;
      m.passiva = `${m.passiva} Eclipse: +${Math.round((escala - 1) * 100)}% de atributos.`;
    }

    if (modoChefeDinamico) {
      // Modo Chefe Dinâmico: vira chefe com HP = soma do HP dos jogadores x 2.0
      // (× bônus por nº de adversários) e acoesPorTurno conforme o nº de jogadores.
      m.isBoss = true;
      m.monsterDef = { ...m.monsterDef, multiplicadorHP: 2.0 };
      m.hp = m.hpMax = Math.max(50, Math.round(sumHeroHp * 2.0 * chefeHpMultPorAdversarios(playerCount)));
      if (playerCount <= 4) m.acoesPorTurno = 1;
      else if (playerCount <= 8) m.acoesPorTurno = 2;
      else if (playerCount <= 12) m.acoesPorTurno = 3;
      else m.acoesPorTurno = 4;
    } else if (m.isBoss) {
      // Regra do criador (soma do HP × multiplicador) + bônus por adversários.
      m.hp = m.hpMax = Math.max(50, Math.round(sumHeroHp * (def.multiplicadorHP || 3) * chefeHpMultPorAdversarios(playerCount)));
    }
    m.monsterDef = { ...m.monsterDef, acoesPorTurno: m.acoesPorTurno };
    battle.participants.push(m);
    battle.log.push(makeLog(`🐲 ${m.monsterName} entra na batalha pelo lado do mestre!${m.isBoss ? ` (CHEFE · vida ajustada para ${playerCount} adversário(s))` : ''}`, 'enemy'));
    return battle;
  }

  removeMonster({ battleId, hostId, participantId }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.status !== 'lobby') throw new Error('A batalha já começou, não é possível remover.');
    if (battle.host !== hostId) throw new Error('Apenas o mestre pode remover inimigos.');
    battle.participants = battle.participants.filter((p) => p.uid !== participantId);
    battle.log.push(makeLog('Um inimigo deixou a batalha.'));
    return battle;
  }

  leaveBattle({ battleId, characterId }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.status !== 'lobby') throw new Error('A batalha já começou, não é possível sair.');
    battle.participants = battle.participants.filter(
      (p) => !(p.characterId === characterId && !p.isMonster),
    );
    battle.log.push(makeLog('Um jogador deixou a batalha.'));
    if (battle.participants.length === 0) {
      this.battles.delete(battleId);
      return null;
    }
    return battle;
  }

  startBattle({ battleId, playerId }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.status !== 'lobby') throw new Error('A batalha já começou.');
    if (battle.host !== playerId) throw new Error('Apenas o anfitrião pode começar a batalha.');
    if (battle.participants.length < 2) throw new Error('São necessários pelo menos 2 participantes.');

    const heroes = battle.participants.filter((p) => !p.isMonster && p.alive);
    const enemies = battle.participants.filter((p) => p.isMonster && p.alive);
    const eclipse = battle.eclipse || estadoEclipse(1);
    if (battle.mode === 'mestre') {
      if (heroes.length < 1) throw new Error('Adicione ao menos 1 jogador.');
      if (enemies.length < 1) throw new Error('Adicione ao menos 1 inimigo.');
      const sum = heroes.reduce((s, h) => s + h.hpMax, 0);
      enemies.forEach((e) => {
        if (e.isBoss) {
          // Recalcula no início: soma do HP × multiplicador × bônus por adversários.
          const hpBase = Math.max(50, Math.round(sum * (e.monsterDef.multiplicadorHP || 3) * chefeHpMultPorAdversarios(heroes.length)));
          const ajustado = aplicarEclipseEmChefe(
            { ...e, hp: hpBase, hpMax: hpBase, acoesPorTurno: e.acoesPorTurno },
            { estado: eclipse, hpBase },
          );
          e.hp = e.hpMax = ajustado.hpMax;
          e.acoesPorTurno = ajustado.acoesPorTurno;
          if (ajustado.passiva) e.passiva = ajustado.passiva;
        }
      });
    }
    // O turno extra do chefe durante o Eclipse entra na ordem de turnos.
    battle.eclipse = eclipse;

    battle.status = 'in_progress';
    const indices = [];
    battle.participants.forEach((p, i) => {
      if (p.alive) indices.push(i);
    });
    indices.sort((a, b) => {
      const pa = battle.participants[a];
      const pb = battle.participants[b];
      // Iniciativa: velocidade + bônus de passivas (ex.: Elfo da Lua).
      const sa = speedOf(pa.attributes, pa.level) + (efeitosDe(pa).iniciativaBonus || 0) * 10;
      const sb = speedOf(pb.attributes, pb.level) + (efeitosDe(pb).iniciativaBonus || 0) * 10;
      return sb - sa;
    });
    let turnOrder = [...indices];
    if (battle.mode === 'mestre') {
      const extra = [];
      for (const idx of indices) {
        const p = battle.participants[idx];
        if (p.isBoss) {
          const count = p.acoesPorTurno ?? bossActionsPerTurn(heroes.length);
          for (let i = 1; i < count; i += 1) extra.push(idx);
        }
      }
      turnOrder = [...indices, ...extra];
    }
    battle.turnOrder = turnOrder;
    battle.currentTurnIndex = 0;
    battle.turno = 0;
    battle.log.push(makeLog('⚔️ A batalha começou!'));
    this._announceTurn(battle);
    this.saveBattle(battle);
    this.emit(battle);
    return battle;
  }

  _current(battle) {
    if (battle.status !== 'in_progress') return null;
    const idx = battle.turnOrder[battle.currentTurnIndex];
    return idx === undefined ? null : battle.participants[idx];
  }

  _announceTurn(battle) {
    const cur = this._current(battle);
    if (!cur) return;
    const tag = cur.isMonster ? ` (${cur.monsterName})` : ` (${classNameOf(cur)})`;
    battle.log.push(makeLog(`▶️ Turno de ${cur.charName}${tag}`));
  }

  _condicaoAtendida(battle, p, cond) {
    if (!cond) return true;
    switch (cond.tipo) {
      case 'danoRecebido':
        return (p.danoRecebido || 0) >= cond.valor;
      case 'hpPct':
        return p.hp <= Math.ceil((p.hpMax * cond.valor) / 100);
      case 'kills':
        return (p.kills || 0) >= cond.valor;
      case 'turnos':
        return (battle.turno || 0) >= cond.valor;
      case 'aliadosCaidos': {
        const sameSide = (q) =>
          battle.mode === 'mestre'
            ? q.role === p.role
            : p.team
              ? q.team === p.team
              : q.role === p.role;
        const fallen = battle.participants.filter((q) => q !== p && !q.alive && sameSide(q));
        return fallen.length >= cond.valor;
      }
      default:
        return true;
    }
  }

  _resolveTurnGains(battle, p) {
    const efeito = efeitosDe(p);
    // Recuperação de mana CONFIRMADA: o que foi gasto ÷ 2, no máximo 10% do MP total.
    const gastoTurno = Number(p.manaGastoTurno) || 0;
    const rec = this._regenMana(p);
    p.manaGastoTurno = 0;
    if (rec > 0) {
      const base = manaRecuperada(gastoTurno);
      const teto = base > rec ? ' (teto de 10% do MP atingido)' : '';
      battle.log.push(makeLog(`💧 ${p.charName} recupera ${rec} de MP (gasto ${gastoTurno} ÷ 2${teto}).`, 'heal'));
    }
    if (efeito.regenMana) {
      const extra = efeito.regenMana;
      const before = p.mp;
      p.mp = clamp(p.mp + extra, 0, p.mpMax);
      if (p.mp > before) battle.log.push(makeLog(`✨ ${p.charName} recupera mais ${p.mp - before} de MP (passiva).`, 'heal'));
    }
    this._processFlight(battle, p);
    if (efeito.regenHpPct && p.alive) {
      const heal = Math.max(1, Math.round(p.hpMax * efeito.regenHpPct));
      const before = p.hp;
      p.hp = clamp(p.hp + heal, 0, p.hpMax);
      if (p.hp > before) battle.log.push(makeLog(`🌿 ${p.charName} regenera ${p.hp - before} de HP.`, 'heal'));
    }
    this._processStatuses(battle, p);
    if (p.buffTurns > 0) {
      p.buffTurns -= 1;
      if (p.buffTurns === 0) {
        p.buffPhysical = 1;
        p.buffMagic = 1;
      }
    }
    if (p.drunk && p.drunkTurns > 0) {
      p.drunkTurns -= 1;
      if (p.drunkTurns === 0) {
        p.drunk = false;
        battle.log.push(makeLog(`🍺 ${p.charName} recuperou a sobriedade.`, 'info'));
      }
    }
    if (p.ultimateMode) {
      p.ultimateModeTurns -= 1;
      if (p.ultimateModeTurns <= 0) {
        p.ultimateMode = false;
        p.ultimateModeMult = 0;
        p.ultimateBar = 0;
        battle.log.push(makeLog(`🔥 ${p.charName} sai do Modo Ultimate.`));
      }
    }
    for (const key of Object.keys(p.cooldowns || {})) {
      if (p.cooldowns[key] > 0) p.cooldowns[key] -= 1;
    }
    p.defense = false;
    p.dodge = false;
  }

  _dodgeBonus(target) {
    return efeitosDe(target).esquivaBonus || 0;
  }

  _critBonus(attacker) {
    return efeitosDe(attacker).critBonus || 0;
  }

  // Atributos efetivos considerando o status "Bêbado":
  // +1 em Força, -1 em Destreza e -1 em Reflexo nas rolagens.
  _rollAttrs(p) {
    if (!p.drunk) return p.attributes;
    return {
      ...p.attributes,
      forca: (p.attributes?.forca || 0) + 1,
      destreza: (p.attributes?.destreza || 0) - 1,
      reflexos: (p.attributes?.reflexos || 0) - 1,
    };
  }

  // Atributo Final do participante (base + raça/classe/equipamento/gemas),
  // já com o efeito de bêbado. Mesmo conceito da vida/mana — ver
  // effectiveAttributes em data.js.
  _finalAttrs(p) {
    return effectiveAttributes(
      this._rollAttrs(p),
      p.equipment || {},
      p.races || null,
      p.classes || null,
    );
  }

  _withDrunk(p) {
    return { ...p, attributes: this._rollAttrs(p) };
  }

  // Recuperação de mana no fim do turno: GASTO ÷ 2, limitado a 10% do MP
  // total (regra confirmada). O gasto medido é o do turno que acabou de passar
  // (manaGastoTurno). Respeita o máximo e monstros não recuperam mana.
  _regenMana(p) {
    if (p.isMonster || !p.alive) return 0;
    const gasto = Number(p.manaGastoTurno) || 0;
    if (gasto <= 0) return 0;
    const gain = manaRecuperada(gasto, p.mpMax);
    if (gain <= 0) return 0;
    const before = p.mp;
    p.mp = clamp(p.mp + gain, 0, p.mpMax);
    return Math.max(0, p.mp - before);
  }

  // ── VOO ────────────────────────────────────────────────────────────────
  // Voo é condição de combate: dá altitude e alcance, nunca invulnerabilidade.
  // Cada ação `voo` sobe/desce/aterrissa. Voo mágico gasta Mana; voo natural
  // cansa (fadiga) e exige teste de controle com Destreza/Reflexos/Resistência.
  _vooDisponivel(p) {
    return { natural: !!p.vooNatural, magico: !p.isMonster };
  }

  _alcanceVerticalDoGolpe(p, skill, weapon) {
    if (skill) {
      if (skill.alcanceVertical) return alcanceVerticalDeMagia(skill);
      const catalogo = Object.values(SPELLS).find((s) => s.nome === skill.nome || s.nome === skill.id);
      if (catalogo) return alcanceVerticalDeMagia(catalogo);
      if (skill.tipo === 'fisico') return alcanceVerticalDeArma(weapon);
      return ALCANCE_VERTICAL.magico;
    }
    if (p.alcanceVertical != null) return Number(p.alcanceVertical);
    return alcanceVerticalDeArma(weapon);
  }

  _processFlight(battle, p) {
    if (!p.voando || p.isMonster) return;
    p.vooTurnos += 1;
    // Voo mágico: manutenção em Mana por turno; sem Mana, cai.
    if (p.vooTipo === 'magico') {
      if (p.mp < VOO.manaPorTurno) {
        this._aterrissar(battle, p, 'A mana para manter o voo acabou.');
        return;
      }
      p.mp -= VOO.manaPorTurno;
      p.manaGastoTurno = (p.manaGastoTurno || 0) + VOO.manaPorTurno;
    }
    // Voo natural: fadiga acumulada e teste de controle.
    if (p.vooTipo === 'natural' && p.vooTurnos >= VOO.fadigaTurnos) {
      const controle = pesoAtributo('controleVoo', this._rollAttrs(p))
        + pesoAtributo('resistenciaVoo', this._rollAttrs(p));
      const d20 = Math.floor(Math.random() * 20) + 1;
      const dif = 15;
      if (d20 + controle < dif) {
        this._aterrissar(battle, p, `fadiga: controle (d20 ${d20} + ${Math.round(controle)}) < ${dif}`);
        return;
      }
      battle.log.push(makeLog(`🕊️ ${p.charName} resiste à fadiga do voo (d20 ${d20} + ${Math.round(controle)} ≥ ${dif}).`));
    }
  }

  _aterrissar(battle, p, motivo = '') {
    if (!p.voando) return;
    p.voando = false;
    p.altitude = 0;
    p.vooTipo = null;
    p.vooTurnos = 0;
    p.vooFadiga = 0;
    battle.log.push(makeLog(`🛬 ${p.charName} aterrissa${motivo ? ` (${motivo})` : ''}.`, 'info'));
  }

  _alternarVoo(battle, p, dir = 'subir') {
    if (p.voando && (dir === 'aterrissar' || dir === 'descer')) {
      this._aterrissar(battle, p, dir === 'aterrissar' ? 'pouso voluntário' : '');
      return;
    }
    if (!p.voando) {
      // Decolagem: voo natural (raça) ou voo mágico (gasta Mana).
      if (p.vooNatural) {
        p.vooTipo = 'natural';
      } else {
        if (p.isMonster) throw new Error('Este participante não consegue voar.');
        if (p.mp < VOO.manaSubida) throw new Error(`Mana insuficiente para voar (precisa de ${VOO.manaSubida} MP).`);
        p.mp -= VOO.manaSubida;
        p.manaGastoTurno = (p.manaGastoTurno || 0) + VOO.manaSubida;
        p.vooTipo = 'magico';
      }
      p.voando = true;
      p.altitude = VOO.bonusAltitude;
      p.vooTurnos = 0;
      battle.log.push(
        makeLog(`🕊️ ${p.charName} decola (${p.vooTipo === 'natural' ? 'voo natural' : `voo mágico, −${VOO.manaSubida} MP`}) e fica na altitude ${p.altitude}.`, 'buff'),
      );
      return;
    }
    const novo = Math.max(0, Math.min(ALTITUDES.alto, (p.altitude || 0) + (dir === 'descer' ? -1 : 1) * VOO.bonusAltitude));
    p.altitude = novo;
    if (novo === 0) {
      this._aterrissar(battle, p, ' altitude zero');
      return;
    }
    const controle = pesoAtributo('controleVoo', this._rollAttrs(p));
    battle.log.push(makeLog(`🕊️ ${p.charName} ${dir === 'descer' ? 'desce' : 'sobe'} para a altitude ${novo} (controle ${Math.round(controle)}).`, 'buff'));
  }

  _rollToHit(attacker, defender, kind, { poder = 100, status = null } = {}) {
    const dodgeBonus = this._dodgeBonus(defender);
    const stAtk = statusEffects(attacker);
    const stDef = statusEffects(defender);
    const critThresh = 21 - Math.round(this._critBonus(attacker) * 20);
    const atkA = this._rollAttrs(attacker);
    const defA = this._rollAttrs(defender);
    let acc, dodge, chance;
    if (kind === 'magic') {
      // INT é o atributo da magia; REF ajuda na mira.
      acc = pesoAtributo('ataqueMagico', atkA);
      dodge = defender.dodge
        ? pesoAtributo('esquiva', defA) + pesoAtributo('esquiva', defA) * 0.5
        : pesoAtributo('esquiva', defA);
      chance = clamp(0.35 + (acc - dodge) * 0.035 - dodgeBonus - stAtk.accPenalty + stDef.dodgePenalty, 0.15, 0.95);
    } else {
      // DEX manda na precisão, REF ajuda, FOR dá peso ao golpe.
      acc = pesoAtributo('ataqueFisico', atkA);
      dodge = defender.dodge
        ? defA.destreza + defA.reflexos
        : pesoAtributo('esquiva', defA);
      chance = clamp(0.35 + (acc - dodge) * 0.03 - dodgeBonus - stAtk.accPenalty + stDef.dodgePenalty, 0.15, 0.95);
    }
    // Dificuldade do golpe: golpes mais fortes/efeitos mais pesados reduzem o alvo.
    const dificuldade = dificuldadeDoGolpe({ poder, status });
    const threshold = clamp(Math.round(20 * chance) - dificuldade, 1, 19);
    const res = rollAttack();
    if (res.isCrit) return { hit: true, crit: true, roll: res.rolls[0], chance: threshold, dificuldade };
    if (res.isFail) return { hit: false, crit: false, roll: res.rolls[0], chance: threshold, dificuldade };
    if (res.rolls[0] >= critThresh) return { hit: true, crit: true, roll: res.rolls[0], chance: threshold, dificuldade };
    return { hit: res.rolls[0] <= threshold, crit: false, roll: res.rolls[0], chance: threshold, dificuldade };
  }

  _physMult(p) {
    const efeito = efeitosDe(p);
    let mult = efeito.danoFisicoMult || 1;
    if (efeito.furia && p.alive && p.hp < p.hpMax * 0.5) mult *= 1.2;
    if (p.ultimateMode) mult *= 1 + (p.ultimateModeMult || 0);
    return mult * statusEffects(p).danoMult;
  }

  _magMult(p) {
    let mult = efeitosDe(p).danoMagicoMult || 1;
    if (p.ultimateMode) mult *= 1 + (p.ultimateModeMult || 0);
    return mult * statusEffects(p).danoMult;
  }

  // Categoria da arma para a habilidade de especialização.
  _armaCategoria(weapon) {
    if (!weapon) return null;
    if (weapon.tipo === 'arma_fogo') return 'fogo';
    const alcance = weapon.alcance || 'corpo';
    if (alcance === 'longo') {
      return (weapon.bonus?.inteligencia || 0) >= 2 ? 'magica' : 'distancia';
    }
    return 'corpo';
  }

  // Especialização em arma: +10% de dano com a categoria escolhida na criação.
  _especializacaoMult(p, weapon) {
    const esp = (p.habilidades || []).find((h) => h.tipo === 'especializacao');
    if (!esp?.categoria) return 1;
    return this._armaCategoria(weapon) === esp.categoria ? 1.1 : 1;
  }

  // Multiplicador elemental: monstros podem declarar fraquezas/resistencias.
  _elemMult(atkElemento, target) {
    if (!atkElemento || atkElemento === 'fisico') return 1;
    const fracos = target.fraquezas || [];
    const resis = target.resistencias || [];
    if (fracos.includes(atkElemento)) return 1.5;
    if (resis.includes(atkElemento)) return 0.5;
    return 1;
  }

  _lifesteal(battle, p, damageDealt) {
    const pct = efeitosDe(p).rouboVida || 0;
    if (pct <= 0 || !p.alive) return;
    const heal = Math.max(1, Math.round(damageDealt * pct));
    const before = p.hp;
    p.hp = clamp(p.hp + heal, 0, p.hpMax);
    if (p.hp > before) battle.log.push(makeLog(`🩸 ${p.charName} drena ${p.hp - before} de HP.`, 'heal'));
  }

  _chargeUltimate(battle, p, amount) {
    if (p.isMonster) return;
    p.ultimateBar = clamp((p.ultimateBar || 0) + amount, 0, 100);
  }

  _chargeEspecial(battle, p, amount) {
    if (p.isMonster) return;
    p.especialBar = clamp((p.especialBar || 0) + amount, 0, 100);
  }

  _applyDamage(target, baseDamage, battle, source, kind = null) {
    if (target.defense) {
      battle.log.push(makeLog(`${target.charName} se defendeu! Dano reduzido pela metade.`, 'defense'));
      baseDamage = Math.round(baseDamage / 2);
    }
    const efeito = efeitosDe(target);
    if (kind === 'physical' && efeito.reducaoDanoFisico) {
      baseDamage = Math.round(baseDamage * (1 - efeito.reducaoDanoFisico));
    }
    if (kind === 'magic' && efeito.reducaoDanoMagico) {
      baseDamage = Math.round(baseDamage * (1 - efeito.reducaoDanoMagico));
    }
    const reduced = Math.max(0, baseDamage - target.defesa);
    const finalDamage = reduced === 0 ? Math.max(1, Math.round(baseDamage * 0.1)) : reduced;

    // ── Horda: o HP é um pool e os corpos caem conforme o pool cruza os
    // limites de hpPorUnidade (funciona em qualquer escala de dano/vida) ──
    // O último corpo nunca sai pela contagem: ele morre com dano normal.
    if (target.horda && target.horda.quantidade > 1) {
      const porUnidade = Math.max(1, target.horda.hpPorUnidade);
      const hpDepois = clamp(target.hp - finalDamage, 0, target.hpMax);
      const restantes = Math.max(1, Math.ceil(hpDepois / porUnidade));
      const abatidos = target.horda.quantidade - restantes;
      if (abatidos > 0) {
        target.horda.quantidade = restantes;
        target.hpMax = Math.max(1, porUnidade * restantes);
        target.hp = hpDepois;
        target.danoRecebido = (target.danoRecebido || 0) + finalDamage;
        if (source && !source.isMonster) {
          source.contribuicao = source.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
          source.contribuicao.dano += finalDamage;
        }
        this._chargeUltimate(battle, target, finalDamage * 0.8);
        if (source && !source.isMonster) this._chargeUltimate(battle, source, finalDamage * 1.0);
        battle.log.push(
          makeLog(
            `💥 ${source ? source.charName : 'Algo'} causa ${finalDamage} de dano em ${target.charName}: ${abatidos} abatido(s), restam ${target.horda.quantidade}.`,
            'damage',
          ),
        );
        if (source) source.kills = (source.kills || 0) + abatidos;
        if (target.hp <= 0) {
          if (source) source.kills = (source.kills || 0) + 1;
          this._killIfDead(battle, target);
        }
        return finalDamage;
      }
    }

    if (finalDamage >= target.hp && efeito.resisteMorte && !target.resistDeathUsed) {
      target.resistDeathUsed = true;
      target.hp = 1;
      battle.log.push(makeLog(`💢 ${target.charName} resiste à morte e permanece de pé com 1 HP!`, 'death'));
      return finalDamage;
    }

    target.hp = clamp(target.hp - finalDamage, 0, target.hpMax);
    target.danoRecebido = (target.danoRecebido || 0) + finalDamage;
    if (source && !source.isMonster) {
      // XP por participação: o dano causado conta para a divisão do XP.
      source.contribuicao = source.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
      source.contribuicao.dano += finalDamage;
    }
    this._chargeUltimate(battle, target, finalDamage * 0.8);
    if (source && !source.isMonster) this._chargeUltimate(battle, source, finalDamage * 1.0);
    battle.log.push(
      makeLog(
        `💥 ${source ? source.charName : 'Algo'} causa ${finalDamage} de dano em ${target.charName}. (dano ${baseDamage} - defesa ${target.defesa})`,
        'damage',
      ),
    );
    this._killIfDead(battle, target);
    return finalDamage;
  }

  _killIfDead(battle, target) {
    if (target.hp > 0 || !target.alive) return;
    target.alive = false;
    target.defense = false;
    target.dodge = false;
    battle.log.push(makeLog(`☠️ ${target.charName} foi derrotado!`, 'death'));
  }

  // Aplica (ou renova) um efeito de status, respeitando imunidades.
  _applyStatus(battle, target, status, source) {
    if (!target.alive || !status || !STATUS_DEFS[status.tipo]) return;
    const def = STATUS_DEFS[status.tipo];
    const imune = efeitosDe(target).imune || [];
    if (Array.isArray(imune) && imune.includes(status.tipo)) {
      battle.log.push(makeLog(`🛡️ ${target.charName} não é afetado por ${def.nome.toLowerCase()}.`, 'info'));
      return;
    }
    const chance = status.chance ?? 1;
    if (chance < 1 && Math.random() > chance) {
      battle.log.push(makeLog(`💨 ${target.charName} resiste a ${def.nome.toLowerCase()}.`, 'info'));
      return;
    }
    const existing = (target.statuses || []).find((s) => s.id === status.tipo);
    if (existing) {
      existing.turnos = Math.max(existing.turnos, status.turnos || 1);
      if (status.dano) existing.dano = status.dano;
    } else {
      target.statuses = target.statuses || [];
      target.statuses.push({
        id: status.tipo,
        nome: def.nome,
        turnos: status.turnos || 1,
        dano: status.dano || 0,
      });
    }
    const origem = source ? `${source.charName} aplica` : 'Aplicado';
    battle.log.push(
      makeLog(
        `${def.icon} ${origem} ${def.nome.toLowerCase()} em ${target.charName} (${status.turnos || 1} turno(s)).`,
        'status',
      ),
    );
  }

  // Processa os status no início do turno: dano/cura por turno e expiração.
  _processStatuses(battle, p) {
    if (!p.statuses || p.statuses.length === 0) return;
    for (let i = p.statuses.length - 1; i >= 0; i--) {
      const s = p.statuses[i];
      const def = STATUS_DEFS[s.id];
      if (s.id === 'congelamento') {
        s.turnos -= 1;
        if (s.turnos <= 0) {
          p.statuses.splice(i, 1);
          battle.log.push(makeLog(`🧊 ${p.charName} se libertou do gelo.`));
        }
        continue;
      }
      if (!def) {
        p.statuses.splice(i, 1);
        continue;
      }
      if (s.dano && p.alive) {
        if (def.tipo === 'dot') {
          const before = p.hp;
          p.hp = clamp(p.hp - s.dano, 0, p.hpMax);
          p.danoRecebido = (p.danoRecebido || 0) + (before - p.hp);
          this._chargeUltimate(battle, p, (before - p.hp) * 0.8);
          battle.log.push(makeLog(`${def.icon} ${p.charName} sofre ${before - p.hp} de dano de ${def.nome.toLowerCase()}.`, 'damage'));
          this._killIfDead(battle, p);
          if (!p.alive) continue;
        } else if (def.tipo === 'hot') {
          const before = p.hp;
          p.hp = clamp(p.hp + s.dano, 0, p.hpMax);
          if (p.hp > before) battle.log.push(makeLog(`${def.icon} ${p.charName} regenera ${p.hp - before} de HP.`, 'heal'));
        }
      }
      s.turnos -= 1;
      if (s.turnos <= 0) {
        p.statuses.splice(i, 1);
        battle.log.push(makeLog(`${def.icon} ${def.nome.toLowerCase()} em ${p.charName} acabou.`, 'info'));
      }
    }
  }

  _marcarAcerto(p) {
    if (!p || p.isMonster) return;
    p.contribuicao = p.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
    p.contribuicao.acertos += 1;
  }

  _marcarSuporte(p, qtd = 1) {
    if (!p || p.isMonster) return;
    p.contribuicao = p.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
    p.contribuicao.suporte += qtd;
  }

  // Lista os inimigos vivos de `p` conforme o modo da batalha.
  _inimigos(battle, p) {
    return battle.participants.filter((q) => {
      if (!q.alive || q === p) return false;
      if (battle.mode === 'mestre') return !!q.isMonster !== !!p.isMonster;
      if (battle.mode === 'equipes') return q.team !== p.team;
      return true; // 'todos': vale-tudo, todos os outros são adversários
    });
  }

  // Lista os aliados vivos de `p` (para fogo amigo). No modo 'todos' não há aliados.
  _aliadosDe(battle, p) {
    return battle.participants.filter((q) => {
      if (!q.alive || q === p) return false;
      if (battle.mode === 'mestre') return !!q.isMonster === !!p.isMonster;
      if (battle.mode === 'equipes') return q.team === p.team;
      return false;
    });
  }

  // Seleciona os alvos de um golpe: principal + extras escolhidos (cone/explosão)
  // ou todos os inimigos (área). Mantém apenas inimigos vivos.
  _alvosDoGolpe(battle, p, spec, primary, extras = []) {
    const inimigos = this._inimigos(battle, p);
    const out = [];
    if (spec.tipo === 'area') {
      if (primary && primary.alive && inimigos.includes(primary)) out.push(primary);
      for (const t of inimigos) if (!out.includes(t)) out.push(t);
      return out;
    }
    const max = Math.max(1, spec.max || 1);
    if (primary && primary.alive) out.push(primary);
    for (const t of extras) {
      if (out.length >= max) break;
      if (t && t.alive && t !== p && inimigos.includes(t) && !out.includes(t)) out.push(t);
    }
    return out;
  }

  // Escolhe, para a IA, os alvos extras (cone/explosão) — a área escolhe sozinha.
  // Preferência: alvos com menor % de vida restante.
  _extrasDeIa(battle, p, spec, primary) {
    if (!spec || spec.tipo === 'unico' || spec.tipo === 'area') return [];
    return this._inimigos(battle, p)
      .filter((t) => t !== primary)
      .sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)
      .slice(0, Math.max(0, (spec.max || 1) - 1));
  }

  // Golpe de área/cone/explosão saiu pela culatra: atinge aliados (dano reduzido).
  _fogoAmigoMulti(battle, p, spec, kind, nome, danoBase, elemento) {
    battle.log.push(
      makeLog(`⚠️ ${p.charName} erra a mira de ${nome} (d20 baixo) e o golpe sai pela culatra!`, 'miss'),
    );
    const aliados = this._aliadosDe(battle, p);
    if (!aliados.length) {
      battle.log.push(makeLog('💨 O golpe se perde sem atingir ninguém.', 'info'));
      return;
    }
    const alvos =
      spec.tipo === 'area' ? aliados : [aliados[Math.floor(Math.random() * aliados.length)]];
    const elem = elemento || 'fisico';
    const multBase = spec.danoMult || 1;
    for (const t of alvos) {
      const total = Math.max(1, Math.round(danoBase * multBase * MULTI_FOGO_AMIGO_MULT * this._elemMult(elem, t)));
      battle.log.push(makeLog(`💥 ${p.charName} atinge o aliado ${t.charName} por engano: ${total} de dano.`, 'damage'));
      this._applyDamage(t, total, battle, p, kind);
    }
  }

  _resolveAttack(battle, p, target, weapon, extras = []) {
    const weaponName = weapon ? weapon.nome : 'as mãos';
    // Recarga: a arma de fogo só volta a atirar depois de cumprir a espera.
    if (this._armasRecarregaveis(weapon) && this._recargaRestante(p, weapon) > 0) {
      battle.log.push(
        makeLog(`⏳ ${weaponName} está em recarga (${this._recargaRestante(p, weapon)} turno(s)).`, 'miss'),
      );
      return;
    }
    const spec = alvoNormalizado(weapon || {});
    const alvos = this._alvosDoGolpe(battle, p, spec, target, extras);
    const principal = alvos[0];
    if (!principal) {
      battle.log.push(makeLog(`🎯 ${p.charName} não encontrou alvos para atacar.`, 'miss'));
      return;
    }
    // Alcance vertical: golpe corpo a corpo não alcança quem está no ar.
    const alcance = this._alcanceVerticalDoGolpe(p, null, weapon);
    if (foraDoAlcanceVertical(alcance, principal)) {
      battle.log.push(
        makeLog(`🕊️ ${weaponName} não alcança ${principal.charName} na altitude ${principal.altitude} (${p.charName} chega até a altitude ${alcance}).`, 'miss'),
      );
      return;
    }
    const mira = this._rollToHit(p, principal, 'physical');
    // O tiro saiu: a arma entra em recarga mesmo se errar (ou sair pela culatra).
    this._recarregarArma(p, weapon);
    const dmg = physicalDamage(
      this._withDrunk(p),
      weapon,
      this._physMult(p) * this._especializacaoMult(p, weapon) * (p.buffPhysical || 1),
    );
    const danoBase = dmg.total;
    // Falha crítica (d20 = 1): golpe multi-alvo pode sair pela culatra.
    if (mira.roll === 1) {
      if (spec.tipo !== 'unico' && desviouParaAliado(mira.roll)) {
        this._fogoAmigoMulti(battle, p, spec, 'physical', weaponName, danoBase, weapon?.elemento);
        return;
      }
      battle.log.push(makeLog(`❌ ${p.charName} falha ao atacar ${principal.charName} com ${weaponName}! (d20 = 1)`, 'miss'));
      return;
    }
    if (!mira.hit) {
      battle.log.push(makeLog(`💨 ${p.charName} erra o ataque em ${principal.charName}. (d20 = ${mira.roll}, precisava de ${mira.chance})`, 'miss'));
      return;
    }
    this._marcarAcerto(p);
    const atkElem = weapon?.elemento || 'fisico';
    const ataqueStatus = efeitosDe(p).ataqueStatus;
    alvos.forEach((t, i) => {
      if (!t.alive) return;
      if (foraDoAlcanceVertical(alcance, t)) {
        battle.log.push(makeLog(`🕊️ ${weaponName} não alcança ${t.charName} na altitude ${t.altitude}.`, 'miss'));
        return;
      }
      const res = i === 0 ? mira : this._rollToHit(p, t, 'physical');
      if (i > 0 && (res.roll === 1 || !res.hit)) {
        battle.log.push(makeLog(`💨 ${p.charName} erra o ataque em ${t.charName}. (d20 = ${res.roll})`, 'miss'));
        return;
      }
      const elemM = this._elemMult(atkElem, t);
      const multSec = i > 0 ? spec.splash : spec.danoMult;
      const total = Math.round(danoBase * (res.crit ? 2 : 1) * multSec * elemM);
      const elemTag = elemM > 1 ? ` ⚡${atkElem} fragiliza!` : elemM < 1 ? ` 🛡${atkElem} resistido!` : '';
      battle.log.push(
        makeLog(
          `${res.crit ? '✨ CRÍTICO! ' : ''}⚔️ ${p.charName} ataca ${t.charName} com ${weaponName}: ${total} de dano.${elemTag}`,
          'attack',
        ),
      );
      this._chargeEspecial(battle, p, res.crit ? 15 : 8);
      const dealt = this._applyDamage(t, total, battle, p, 'physical');
      if (dealt > 0) this._lifesteal(battle, p, dealt);
      if (!t.alive && !t.horda) p.kills += 1;
      if (ataqueStatus && t.alive) this._applyStatus(battle, t, ataqueStatus, p);
    });
  }

  // Núcleo dos golpes de dano (magia/físico de habilidade e golpe MEGA),
  // possivelmente em vários alvos. Preserva o texto de log de alvo único.
  _resolverGolpeDeDano(battle, p, target, skill, extras = [], { mega = false } = {}) {
    const nome = skill.nome;
    const kind = skill.tipo === 'fisico' ? 'physical' : 'magic';
    const spec = alvoNormalizado(skill);
    const alcance = this._alcanceVerticalDoGolpe(p, skill, melhorArma(p.equipment));
    const alvos = this._alvosDoGolpe(battle, p, spec, target, extras);
    const principal = alvos[0];
    if (!principal) {
      battle.log.push(makeLog(`🎯 ${nome} não encontrou alvos.`, 'miss'));
      return;
    }
    if (foraDoAlcanceVertical(alcance, principal)) {
      battle.log.push(
        makeLog(`🕊️ ${nome} não alcança ${principal.charName} na altitude ${principal.altitude} (alcance vertical ${alcance}).`, 'miss'),
      );
      return;
    }
    const mira = this._rollToHit(p, principal, kind, { poder: skill.poder, status: skill.status });
    // Dano base (independe do alvo: usa apenas os atributos do atacante).
    let danoBase;
    if (skill.tipo === 'fisico') {
      const mult = this._physMult(p) * (p.buffPhysical || 1);
      danoBase = danoFisicoGolpe(this._finalAttrs(p).forca, skill.poder, mult, mega ? DANO_COEF_MEGA : undefined);
    } else {
      danoBase = magicDamage(p, { poder: skill.poder }, this._magMult(p) * (p.buffMagic || 1)).total;
    }
    // Falha crítica (d20 = 1): golpe multi-alvo pode sair pela culatra.
    if (mira.roll === 1) {
      if (spec.tipo !== 'unico' && desviouParaAliado(mira.roll)) {
        this._fogoAmigoMulti(battle, p, spec, kind, nome, danoBase, skill.elemento);
        return;
      }
      battle.log.push(makeLog(`❌ ${p.charName} falha ao ${mega ? 'desferir' : 'usar'} ${nome}! (d20 = 1)`, 'miss'));
      return;
    }
    if (!mira.hit) {
      battle.log.push(makeLog(`💨 ${p.charName} erra ${nome} em ${principal.charName}. (d20 = ${mira.roll}, precisava de ${mira.chance}${mira.dificuldade ? `, dificuldade +${mira.dificuldade}` : ''})`, 'miss'));
      return;
    }
    this._marcarAcerto(p);
    const elem = skill.elemento || 'fisico';
    alvos.forEach((t, i) => {
      if (!t.alive) return;
      if (foraDoAlcanceVertical(alcance, t)) {
        battle.log.push(makeLog(`🕊️ ${nome} não alcança ${t.charName} na altitude ${t.altitude}.`, 'miss'));
        return;
      }
      const res = i === 0 ? mira : this._rollToHit(p, t, kind, { poder: skill.poder, status: skill.status });
      if (i > 0 && (res.roll === 1 || !res.hit)) {
        battle.log.push(makeLog(`💨 ${p.charName} erra ${nome} em ${t.charName}. (d20 = ${res.roll}${res.dificuldade ? `, dificuldade +${res.dificuldade}` : ''})`, 'miss'));
        return;
      }
      const em = this._elemMult(elem, t);
      const multSec = i > 0 ? spec.splash : spec.danoMult;
      const total = Math.round(danoBase * (res.crit ? 2 : 1) * multSec * em);
      const tag = em > 1 ? ` ⚡${elem} fragiliza!` : em < 1 ? ` 🛡${elem} resistido!` : '';
      const dif = res.dificuldade ? ` dificuldade +${res.dificuldade}.` : '';
      battle.log.push(
        makeLog(
          `${res.crit ? '✨ CRÍTICO! ' : ''}${mega ? '💫' : '✨'} ${p.charName} ${mega ? 'desfere' : 'usa'} ${nome} em ${t.charName}: ${total} de dano (${skill.poder}%)${mega ? '!' : '.'}${dif}${tag}`,
          'attack',
        ),
      );
      if (!mega) this._chargeEspecial(battle, p, res.crit ? 15 : 8);
      const dealt = this._applyDamage(t, total, battle, p, kind);
      if (dealt > 0) this._lifesteal(battle, p, dealt);
      if (!t.alive && !t.horda) p.kills += 1;
      if (skill.status && t.alive) this._applyStatus(battle, t, skill.status, p);
    });
    if (!mega) this._setCooldown(p, skill);
  }

  _setCooldown(p, skill) {
    if (!skill.cooldown) return;
    p.cooldowns = p.cooldowns || {};
    p.cooldowns[skill.id] = skill.cooldown;
  }

  // ── Recarga de armas de fogo ─────────────────────────────────────────────
  // Armas com `recarga > 0` (armas de fogo; utilitárias ficam de fora porque já
  // têm limite de usos por batalha) ficam indisponíveis por `recarga` turnos do
  // próprio dono após cada disparo. O contador diminui no fim do turno do dono
  // (`_advanceTurn`), então gravamos `recarga + 1`: o primeiro turno depois do
  // disparo já consome 1, e "recarga: 1" = exatamente 1 turno de espera.
  _armasRecarregaveis(weapon) {
    return !!(weapon && weapon.id && weapon.recarga > 0 && weapon.categoria !== 'utilitaria');
  }

  _recargaRestante(p, weapon) {
    if (!weapon || !weapon.id || !p.wpnRecarga) return 0;
    return p.wpnRecarga[weapon.id] || 0;
  }

  _recarregarArma(p, weapon) {
    if (!this._armasRecarregaveis(weapon)) return;
    p.wpnRecarga = p.wpnRecarga || {};
    p.wpnRecarga[weapon.id] = weapon.recarga + 1;
  }

  _consumirRecarga(p) {
    if (!p || !p.wpnRecarga) return;
    for (const key of Object.keys(p.wpnRecarga)) {
      if (p.wpnRecarga[key] > 0) p.wpnRecarga[key] -= 1;
    }
  }

  _resolveSkill(battle, p, target, skill, extras = []) {
    const cost = skill.custo || 0;
    if (p.mp < cost) {
      battle.log.push(makeLog(`❌ ${p.charName} não tem MP suficiente para ${skill.nome}.`, 'miss'));
      return;
    }
    if ((p.cooldowns || {})[skill.id] > 0) {
      battle.log.push(makeLog(`⏳ ${skill.nome} está em recarga (${p.cooldowns[skill.id]} turno(s)).`, 'miss'));
      return;
    }
    p.mp -= cost;
    p.manaGastoTurno = (p.manaGastoTurno || 0) + cost;

    if (skill.tipo === 'cura') {
      // Cura reformada: INT Final × poder% × 1,4 × 10 (mesma escala do dano).
      const healing = curaMagica(this._finalAttrs(p).inteligencia, skill.poder);
      const allies = battle.participants.filter(
        (q) =>
          q.alive &&
          q !== p &&
          (battle.mode === 'mestre'
            ? q.role === p.role
            : battle.mode !== 'equipes' || q.team === p.team),
      );
      const targets = skill.todos ? allies : [target && target.alive ? target : p];
      targets.forEach((t) => {
        const before = t.hp;
        t.hp = clamp(t.hp + healing, 0, t.hpMax);
        if (!p.isMonster) {
          p.contribuicao = p.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
          p.contribuicao.cura += t.hp - before;
        }
        battle.log.push(makeLog(`💚 ${p.charName} usa ${skill.nome} em ${t.charName}: cura ${t.hp - before} de HP.`, 'heal'));
      });
      this._marcarSuporte(p, targets.length);
      this._setCooldown(p, skill);
      return;
    }

    if (skill.tipo === 'buff') {
      p.buffPhysical = p.buffPhysical || 1;
      p.buffMagic = p.buffMagic || 1;
      p.buffPhysical += skill.poder / 100;
      p.buffMagic += skill.poder / 100;
      p.buffTurns = 3;
      battle.log.push(makeLog(`🔮 ${p.charName} usa ${skill.nome}: dano de aliados aumentado em ${skill.poder}%.`, 'buff'));
      this._marcarSuporte(p);
      this._setCooldown(p, skill);
      return;
    }

    if (skill.tipo === 'defesa') {
      p.defense = true;
      p.buffTurns = Math.max(p.buffTurns, 1);
      battle.log.push(makeLog(`🛡️ ${p.charName} usa ${skill.nome}: reduzirá muito o dano recebido.`, 'buff'));
      this._marcarSuporte(p);
      this._setCooldown(p, skill);
      return;
    }

    this._resolverGolpeDeDano(battle, p, target, skill, extras, { mega: false });
  }

  // Golpe ultimate (durante o Modo Ultimate) e Golpe Especial (gasta 100% da barra).
  _resolveMegaSkill(battle, p, target, skill, extras = []) {
    if (skill.tipo === 'cura') {
      // Cura mega: mesma fórmula com coeficiente 2,2 (DANO_COEF_MEGA).
      const healing = curaMagica(this._finalAttrs(p).inteligencia, skill.poder, 1, DANO_COEF_MEGA);
      const allies = battle.participants.filter(
        (q) =>
          q.alive &&
          q !== p &&
          (battle.mode === 'mestre'
            ? q.role === p.role
            : battle.mode !== 'equipes' || q.team === p.team),
      );
      const targets = skill.todos ? allies : [target && target.alive ? target : p];
      targets.forEach((t) => {
        const before = t.hp;
        t.hp = clamp(t.hp + healing, 0, t.hpMax);
        if (!p.isMonster) {
          p.contribuicao = p.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
          p.contribuicao.cura += t.hp - before;
        }
        battle.log.push(makeLog(`💚 ${p.charName} desfere ${skill.nome} em ${t.charName}: cura ${t.hp - before} de HP.`, 'heal'));
      });
      this._marcarSuporte(p, targets.length);
      return;
    }
    if (skill.tipo === 'buff') {
      p.buffPhysical = (p.buffPhysical || 1) + skill.poder / 100;
      p.buffMagic = (p.buffMagic || 1) + skill.poder / 100;
      p.buffTurns = Math.max(p.buffTurns, 3);
      battle.log.push(makeLog(`🔮 ${p.charName} usa ${skill.nome}: poder aliado +${skill.poder}%.`, 'buff'));
      this._marcarSuporte(p);
      return;
    }
    if (skill.tipo === 'defesa') {
      p.defense = true;
      battle.log.push(makeLog(`🛡️ ${p.charName} usa ${skill.nome}: defesa total!`, 'buff'));
      this._marcarSuporte(p);
      return;
    }

    this._resolverGolpeDeDano(battle, p, target, skill, extras, { mega: true });
  }

  _resolveItem(battle, p, item) {
    if (item.tipo !== 'pocao' && item.tipo !== 'bebida' && item.tipo !== 'comida') {
      battle.log.push(makeLog(`❌ ${item.nome} não pode ser usado em combate.`, 'miss'));
      return;
    }
    const idx = p.inventory.findIndex((it) => it.id === item.id);
    if (idx === -1) {
      battle.log.push(makeLog(`❌ ${p.charName} não possui ${item.nome}.`, 'miss'));
      return;
    }
    p.inventory.splice(idx, 1);
    const consumiu = [];
    if (item.cura) {
      const before = p.hp;
      p.hp = clamp(p.hp + item.cura, 0, p.hpMax);
      consumiu.push(`cura ${p.hp - before} de HP`);
    }
    if (item.mana) {
      const before = p.mp;
      p.mp = clamp(p.mp + item.mana, 0, p.mpMax);
      consumiu.push(`restaura ${p.mp - before} de MP`);
    }
    // Bebidas: efeitos extras (buff de dano, status em si, álcool e antídoto).
    if (item.removeStatus) {
      const alvos = Array.isArray(item.removeStatus) ? item.removeStatus : [item.removeStatus];
      const antes = (p.statuses || []).length;
      p.statuses = (p.statuses || []).filter((s) => !alvos.includes(s.id));
      const removidos = antes - p.statuses.length;
      if (removidos > 0) consumiu.push(`remove ${removidos} efeito(s) nocivo(s)`);
    }
    if (item.status) {
      this._applyStatus(battle, p, item.status, null);
    }
    if (item.buffFisico) {
      p.buffPhysical = (p.buffPhysical || 1) + item.buffFisico;
      consumiu.push(`+${Math.round(item.buffFisico * 100)}% dano físico`);
    }
    if (item.buffMagico) {
      p.buffMagic = (p.buffMagic || 1) + item.buffMagico;
      consumiu.push(`+${Math.round(item.buffMagico * 100)}% dano mágico`);
    }
    if (item.buffFisico || item.buffMagico) {
      p.buffTurns = Math.max(p.buffTurns || 0, item.buffTurns || 3);
    }
    if (item.drunk) {
      p.drunk = true;
      p.drunkTurns = Math.max(p.drunkTurns || 0, item.drunkTurns || 3);
      consumiu.push('fica bêbado');
    }
    const icone = item.tipo === 'bebida' ? (item.emoji || '🍺') : item.tipo === 'comida' ? (item.emoji || '🍽️') : '🧪';
    const detalhe = consumiu.length ? `: ${consumiu.join(', ')}.` : '.';
    battle.log.push(makeLog(`${icone} ${p.charName} usa ${item.nome}${detalhe}`, 'heal'));
  }

  handleAction({ battleId, characterId, playerId, action }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.status !== 'in_progress') throw new Error('A batalha não está em andamento.');

    const p = battle.participants.find(
      (q) => q.characterId === characterId || q.uid === characterId,
    );
    if (!p) throw new Error('Participante não está na batalha.');
    if (!p.alive) throw new Error('Este participante está derrotado.');

    const current = this._current(battle);
    if (!current) throw new Error('Não é o seu turno ainda. Aguarde.');
    const isItsTurn = p.isMonster ? current.uid === p.uid : current.characterId === characterId;
    if (!isItsTurn) throw new Error('Não é o seu turno ainda. Aguarde.');
    if (p.isMonster && playerId !== battle.host) {
      throw new Error('Somente o mestre controla os inimigos.');
    }

    this._resolveTurnGains(battle, p);

    if (!p.alive) {
      battle.log.push(makeLog(`☠️ ${p.charName} sucumbe aos efeitos de status.`, 'death'));
      this._checkEnd(battle);
      this.emit(battle);
      return battle;
    }

    if (hasStatus(p, 'congelamento')) {
      battle.log.push(makeLog(`🧊 ${p.charName} está congelado e pula o turno.`));
      this._advanceTurn(battle);
      this._aiLoop(battle);
      this.emit(battle);
      return battle;
    }

    let target = battle.participants.find(
      (q) => q.characterId === action.targetId || q.uid === action.targetId,
    ) || null;
    // Multi-alvo: `action.targetIds` traz a lista completa (o 1º é o principal).
    const idsExtras = Array.isArray(action.targetIds) ? action.targetIds : [];
    if (!target && idsExtras.length) {
      target = battle.participants.find(
        (q) => q.characterId === idsExtras[0] || q.uid === idsExtras[0],
      ) || null;
    }
    const alvosExtras = idsExtras
      .map((id) => battle.participants.find((q) => q.characterId === id || q.uid === id))
      .filter((q) => q && q.alive && q !== target && q !== p);

    // Toda ação do turno vale como participação na divisão do XP.
    p.contribuicao = p.contribuicao || { dano: 0, cura: 0, acertos: 0, acoes: 0, suporte: 0 };
    p.contribuicao.acoes += 1;

    if (battle.mode === 'mestre' && target) {
      if (p.isMonster && target.isMonster) throw new Error('Inimigos atacam apenas os jogadores.');
      if (!p.isMonster && !target.isMonster) throw new Error('Escolha um alvo inimigo.');
    }

    switch (action.type) {
      case 'attack': {
        if (!target || !target.alive) throw new Error('Escolha um alvo vivo.');
        const weapon = armaParaAtaque(p.equipment, action.weaponId);
        this._resolveAttack(battle, p, target, weapon, alvosExtras);
        break;
      }
      case 'attackUtility': {
        // Arma utilitária: causa dano + aplica debuff, consumindo 1 uso.
        if (!target || !target.alive) throw new Error('Escolha um alvo vivo.');
        const util = (armasDeEquipamento(p.equipment) || []).find((e) => e.slot === 'utilitaria');
        if (!util || !util.arma) throw new Error('Nenhuma arma utilitária equipada.');
        const restante = (p.wpnUsos && p.wpnUsos[util.arma.id]) ?? util.arma.usosMax ?? 1;
        if (restante <= 0) throw new Error(`${util.arma.nome} está sem usos nesta batalha.`);
        p.wpnUsos = p.wpnUsos || {};
        p.wpnUsos[util.arma.id] = restante - 1;
        if (util.arma.efeito) {
          battle.log.push(makeLog(`🧰 ${p.charName} usa ${util.arma.nome}.`));
        }
        this._resolveAttack(battle, p, target, util.arma);
        if (target.alive && util.arma.efeito) {
          this._applyStatus(battle, target, util.arma.efeito, p);
        }
        break;
      }
      case 'magic': {
        const skills = skillsOf(p);
        let skill = skills.find((s) => s.id === action.spellId || s.nome === action.spellId);
        // Fallback: MP/ids do catálogo (monstros e magias vindas de SPELLS).
        if (!skill && SPELLS[action.spellId]) skill = skillFromSpell(SPELLS[action.spellId]);
        if (!skill) throw new Error('Golpe/magia desconhecido.');
        if ((skill.tipo === 'fisico' || skill.tipo === 'magia') && (!target || !target.alive)) {
          throw new Error('Escolha um alvo vivo.');
        }
        this._resolveSkill(battle, p, target, skill, alvosExtras);
        break;
      }
      case 'defend': {
        p.defense = true;
        battle.log.push(makeLog(`🛡️ ${p.charName} assume posição de defesa.`));
        break;
      }
      case 'dodge': {
        p.dodge = true;
        battle.log.push(makeLog(`💨 ${p.charName} foca em esquivar dos próximos ataques.`));
        break;
      }
      case 'voo': {
        // Voo: subir, descer ou aterrissar (regra confirmada pelo criador).
        const dir = ['subir', 'descer', 'aterrissar'].includes(action.dir) ? action.dir : 'subir';
        const podeVoo = !p.isMonster || p.vooNatural || p.voando || p.monsterDef?.voaNatural;
        if (!podeVoo) throw new Error('Este participante não consegue voar.');
        this._alternarVoo(battle, p, dir);
        break;
      }
      case 'useItem': {
        const item = p.inventory.find((it) => it.id === action.itemId);
        if (!item) throw new Error('Item não encontrado.');
        this._resolveItem(battle, p, item);
        break;
      }
      case 'ultimate': {
        const ult = p.ultimate;
        if (!ult) throw new Error('Você não tem ultimate.');
        if ((p.ultimateBar || 0) < 100)
          throw new Error(`Barra de Ultimate incompleta (${Math.round(p.ultimateBar || 0)}%).`);
        if (p.ultimateMode) throw new Error('Você já está no Modo Ultimate.');
        if (!this._condicaoAtendida(battle, p, ult.condicao)) {
          throw new Error(`Condição não cumprida: ${condicaoTexto(ult.condicao)}.`);
        }
        const modo = ult.modo || { turnos: 3, danoMultPct: 50 };
        p.ultimateMode = true;
        p.ultimateModeTurns = modo.turnos;
        p.ultimateModeMult = modo.danoMultPct / 100;
        p.ultimateBar = 0;
        p.ultimateSkillUsed = false;
        battle.log.push(
          makeLog(`🔥 ${p.charName} ATIVA A ULTIMATE ${ult.nome}! Modo Ultimate por ${modo.turnos} turno(s), dano +${modo.danoMultPct}%.`, 'win'),
        );
        break;
      }
      case 'ultimateSkill': {
        const ult = p.ultimate;
        if (!ult) throw new Error('Você não tem ultimate.');
        if (!p.ultimateMode) throw new Error('Ative o Modo Ultimate primeiro.');
        if (p.ultimateSkillUsed) throw new Error('O golpe ultimate já foi usado nesta ativação.');
        if ((ult.tipo === 'fisico' || ult.tipo === 'magia') && (!target || !target.alive)) {
          throw new Error('Escolha um alvo vivo.');
        }
        this._resolveMegaSkill(battle, p, target, ult, alvosExtras);
        p.ultimateSkillUsed = true;
        break;
      }
      case 'especial': {
        const esp = p.especial;
        if (!esp) throw new Error('Você não tem golpe especial.');
        if ((p.especialBar || 0) < 100)
          throw new Error(`Barra de Especial incompleta (${Math.round(p.especialBar || 0)}%).`);
        if (!this._condicaoAtendida(battle, p, esp.condicao)) {
          throw new Error(`Condição não cumprida: ${condicaoTexto(esp.condicao)}.`);
        }
        if ((esp.tipo === 'fisico' || esp.tipo === 'magia') && (!target || !target.alive)) {
          throw new Error('Escolha um alvo vivo.');
        }
        this._resolveMegaSkill(battle, p, target, esp, alvosExtras);
        p.especialBar = 0;
        break;
      }
      default:
        throw new Error('Ação desconhecida.');
    }

    const ended = this._checkEnd(battle);
    if (!ended) {
      this._advanceTurn(battle);
    }
    if (!this._checkEnd(battle)) {
      this._aiLoop(battle);
    }
    this.emit(battle);
    return battle;
  }

  // Alterna o status "Bêbado" de um combatente (herói) durante a batalha.
  toggleDrunk({ battleId, participantId }) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error('Batalha não encontrada.');
    if (battle.status !== 'in_progress') throw new Error('A batalha não está em andamento.');
    const p = battle.participants.find(
      (q) => q.characterId === participantId || q.uid === participantId,
    );
    if (!p) throw new Error('Participante não encontrado.');
    if (p.isMonster) throw new Error('Apenas personagens podem ficar bêbados.');
    p.drunk = !p.drunk;
    battle.log.push(makeLog(`🍺 ${p.charName} ${p.drunk ? 'ficou bêbado!' : 'recuperou a sobriedade.'}`));
    this.saveBattle(battle);
    this.emit(battle);
    return battle;
  }

  // Executa turnos da IA em sequência até ser turno de jogador ou a batalha acabar.
  _aiLoop(battle) {
    if (!battle.aiEnabled) return;
    let limit = battle.turnOrder.length * 2;
    while (limit-- > 0) {
      const cur = this._current(battle);
      if (!cur || !cur.alive || !cur.isMonster) return;
      this._aiAction(battle, cur);
      if (this._checkEnd(battle)) return;
      this._advanceTurn(battle);
    }
  }

  _advanceTurn(battle) {
    // Fim do turno de quem acabou de agir: avança a recarga das armas de fogo.
    this._consumirRecarga(this._current(battle));
    const aliveCount = battle.participants.filter((q) => q.alive).length;
    if (aliveCount <= 1) return;
    battle.turno = (battle.turno || 0) + 1;
    let attempts = battle.turnOrder.length * 2;
    do {
      battle.currentTurnIndex = (battle.currentTurnIndex + 1) % battle.turnOrder.length;
      attempts -= 1;
      const cur = this._current(battle);
      if (cur && cur.alive) {
        this._announceTurn(battle);
        return;
      }
    } while (attempts > 0);
  }

  // IA simples: ataca o herói com menor HP%; usa skill se tiver MP.
  _aiAction(battle, p) {
    const heroes = battle.participants.filter((h) => !h.isMonster && h.alive);
    if (!heroes.length) return;
    const target = heroes.reduce((a, b) => (a.hp / a.hpMax) < (b.hp / b.hpMax) ? a : b);
    this._resolveTurnGains(battle, p);
    if (!p.alive) {
      battle.log.push(makeLog(`☠️ ${p.charName} sucumbe aos efeitos de status.`, 'death'));
      return;
    }
    if (p.spells?.length && p.mp > 0) {
      const usaveis = (p.spells || [])
        .map((sid) => SPELLS[sid])
        .filter((sk) => sk && (sk.custo || 0) <= p.mp);
      if (usaveis.length) {
        // Prefere um golpe de dano; entre eles, prioriza multi-alvo se houver
        // mais de um herói vivo (a área/cone o golpe se espalha sozinho).
        const ataques = usaveis.filter((sk) => sk.tipo === 'ataque');
        const multiAlvo = ataques.find((sk) => sk.alvo);
        const escolhido = (heroes.length > 1 && multiAlvo) || ataques[0] || usaveis[0];
        const espec = alvoNormalizado(escolhido);
        this._resolveSkill(
          battle,
          p,
          target,
          skillFromSpell(escolhido),
          this._extrasDeIa(battle, p, espec, target),
        );
        return;
      }
    }
    const weapon = melhorArma(p.equipment);
    const especArma = alvoNormalizado(weapon || {});
    this._resolveAttack(battle, p, target, weapon, this._extrasDeIa(battle, p, especArma, target));
  }

  // XP: o grupo recebe um total e cada jogador recebe uma parte
  // proporcional à participação (dano, cura, acertos, ações, abates).
  _distribuirXpFinal(battle, vencedores) {
    const monstrosMortos = battle.participants.filter((q) => q.isMonster && !q.alive);
    const xpMonstros = [];
    for (const m of monstrosMortos) {
      if (m.horda) {
        // Horda: XP por corpo abatido, não pela horda inteira.
        const abatidos = Math.max(1, (m.horda.inicial || 1) - (m.horda.quantidade || 0));
        xpMonstros.push(Math.round((m.xpPorUnidade || m.xpValue || 0) * abatidos));
      } else {
        xpMonstros.push(m.xpValue || 0);
      }
    }
    const chefeDerrotado = monstrosMortos.some((m) => m.isBoss);
    const eclipse = battle.eclipse || estadoEclipse(1);
    const pool = poolDeXp({ chefeDerrotado, monstrosDerrotados: xpMonstros, eclipseMult: eclipse.xpMult });
    battle.xpPool = pool;

    const lista = (vencedores || []).filter((p) => !p.isMonster);
    const dist = distribuirXp(lista, pool);
    for (const d of dist) {
      const p = lista.find((q) => q.uid === d.uid);
      if (!p) continue;
      const mult = efeitosDe(p).xpMult || 1;
      p.xpGained = Math.round(d.xpGained * mult);
      p.xpShare = Math.round(d.share * 100);
      p.xpContribuicao = Math.round(d.contribuicao);
    }
    battle.log.push(
      makeLog(
        `📊 XP total ${pool} dividido por participação: ${dist.map((d) => `${d.uid.slice(0, 4)} ${Math.round(d.share * 100)}%`).join(' · ')}`,
        'info',
      ),
    );
    return pool;
  }

  _checkEnd(battle) {
    const alive = battle.participants.filter((q) => q.alive);
    if (alive.length === 0) {
      battle.winner = 'Empate';
      return this._finish(battle);
    }

    if (battle.mode === 'mestre') {
      const heroes = alive.filter((q) => !q.isMonster);
      const enemies = alive.filter((q) => q.isMonster);
      if (enemies.length === 0) {
        battle.winner = 'Os Aventureiros';
        this._distribuirXpFinal(battle, heroes);
        return this._finish(battle);
      }
      if (heroes.length === 0) {
        battle.winner = `${battle.hostName} (Mestre)`;
        return this._finish(battle);
      }
      return false;
    }

    if (battle.mode === 'todos') {
      if (alive.length === 1) {
        battle.winner = alive[0].playerName;
        this._distribuirXpFinal(battle, alive);
        return this._finish(battle);
      }
      return false;
    }

    const teams = {};
    alive.forEach((q) => {
      teams[q.team] = (teams[q.team] || 0) + 1;
    });
    const teamNames = { A: 'Equipe A', B: 'Equipe B' };
    if (Object.keys(teams).length === 1) {
      const winningTeam = Object.keys(teams)[0];
      battle.winner = teamNames[winningTeam];
      const equipeVencedora = battle.participants.filter((q) => q.alive && q.team === winningTeam);
      this._distribuirXpFinal(battle, equipeVencedora);
      return this._finish(battle);
    }
    return false;
  }

  _finish(battle) {
    battle.status = 'finished';
    battle.finishedAt = Date.now();
    battle.log.push(makeLog(`🏆 ${battle.winner} venceu a batalha!`, 'win'));
    const comXp = battle.participants.filter((p) => !p.isMonster && p.xpGained > 0);
    if (comXp.length) {
      battle.log.push(
        makeLog(
          `📊 XP por participação: ${comXp.map((p) => `${p.charName} ${p.xpGained} XP (${p.xpShare ?? 0}%)`).join(' · ')}`,
          'info',
        ),
      );
    }
    this.saveBattle(battle);
    if (this.onBattleEnd) this.onBattleEnd(battle);
    return true;
  }
}
