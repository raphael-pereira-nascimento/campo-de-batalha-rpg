// crypto.randomUUID só existe em contexto seguro (HTTPS/localhost).
// Fallback garante que o modo offline funcione via HTTP/IP de rede sem tela branca.
const randomUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
import {
  CLASSES,
  SPELLS,
  EQUIPMENT,
  STATUS_DEFS,
  deriveStats,
  speedOf,
  rollAttack,
  physicalDamage,
  magicDamage,
  rollDamage,
  efeitosDeHabilidades,
  MAX_PLAYERS_PER_BATTLE,
} from './data.js';
import {
  manaRecuperada,
  pesoAtributo,
  alcanceVerticalDeArma,
  alcanceVerticalDeMagia,
  foraDoAlcanceVertical,
  distribuirXp,
  poolDeXp,
  VOO,
  ALCANCE_VERTICAL,
  ALTITUDES,
} from './sistema.js';
import { estadoEclipse, sortearVarianteEclipse, aplicarEclipseEmChefe } from './eclipse.js';
import { RACES } from './races.js';
import { buildMonster, bossActionsPerTurn } from './monsters.js';

let logCounter = 0;

function makeLog(text, kind = 'info') {
  logCounter += 1;
  return { id: logCounter, time: Date.now(), text, kind };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
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

function skillFromSpell(s) {
  return {
    id: s.nome,
    nome: s.nome,
    tipo: s.tipo === 'ataque' ? 'magia' : s.tipo,
    poder: Math.round((s.poder || 1) * 100),
    custo: s.custo || 0,
    cooldown: 0,
    todos: s.nome === 'Cura em Massa',
    status: s.status ? { ...s.status } : null,
    elemento: s.elemento || null,
    alcanceVertical: s.alcanceVertical || null,
    desc: s.desc || '',
  };
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
      drunk: false,
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
    const def = { ...monsterDef, _uid: uid };
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
      // e acoesPorTurno conforme o nº de jogadores (1-4=1, 5-8=2, 9-12=3, 13+=4).
      m.isBoss = true;
      m.monsterDef = { ...m.monsterDef, multiplicadorHP: 2.0 };
      m.hp = m.hpMax = Math.max(50, Math.round(sumHeroHp * 2.0));
      if (playerCount <= 4) m.acoesPorTurno = 1;
      else if (playerCount <= 8) m.acoesPorTurno = 2;
      else if (playerCount <= 12) m.acoesPorTurno = 3;
      else m.acoesPorTurno = 4;
    } else if (m.isBoss) {
      m.hp = m.hpMax = Math.max(50, Math.round(sumHeroHp * (def.multiplicadorHP || 3)));
    }
    m.monsterDef = { ...m.monsterDef, acoesPorTurno: m.acoesPorTurno };
    battle.participants.push(m);
    battle.log.push(makeLog(`🐲 ${m.monsterName} entra na batalha pelo lado do mestre!${m.isBoss ? ' (CHEFE)' : ''}`, 'enemy'));
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
          const hpBase = Math.max(50, Math.round(sum * (e.monsterDef.multiplicadorHP || 3)));
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
    // Recuperação de mana CONFIRMADA: o que foi gasto ÷ 2 (+ passivas de raça).
    const gastoTurno = Number(p.manaGastoTurno) || 0;
    const rec = this._regenMana(p);
    p.manaGastoTurno = 0;
    if (rec > 0) {
      battle.log.push(makeLog(`💧 ${p.charName} recupera ${rec} de MP (gasto ${gastoTurno} ÷ 2).`, 'heal'));
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

  _withDrunk(p) {
    return { ...p, attributes: this._rollAttrs(p) };
  }

  // Recuperação de mana no fim do turno: GASTO ÷ 2 (regra confirmada).
  // O gasto medido é o do turno que acabou de passar (manaGastoTurno).
  // Respeita o máximo e monstros não recuperam mana.
  _regenMana(p) {
    if (p.isMonster || !p.alive) return 0;
    const gasto = Number(p.manaGastoTurno) || 0;
    if (gasto <= 0) return 0;
    const gain = manaRecuperada(gasto);
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

  _rollToHit(attacker, defender, kind) {
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
    const threshold = Math.round(20 * chance);
    const res = rollAttack();
    if (res.isCrit) return { hit: true, crit: true, roll: res.rolls[0], chance: threshold };
    if (res.isFail) return { hit: false, crit: false, roll: res.rolls[0], chance: threshold };
    if (res.rolls[0] >= critThresh) return { hit: true, crit: true, roll: res.rolls[0], chance: threshold };
    return { hit: res.rolls[0] <= threshold, crit: false, roll: res.rolls[0], chance: threshold };
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

    // ── Horda: o dano reduz o número de corpos em vez de só encurtar o HP ──
    // O último corpo nunca sai pela contagem: ele morre com dano normal.
    if (target.horda && target.horda.quantidade > 1) {
      const porUnidade = Math.max(1, target.horda.hpPorUnidade);
      const abatidos = Math.min(
        target.horda.quantidade - 1,
        Math.floor(finalDamage / porUnidade),
      );
      if (abatidos > 0) {
        target.horda.quantidade -= abatidos;
        target.hpMax = Math.max(1, porUnidade * target.horda.quantidade);
        target.hp = clamp(target.hp - finalDamage, 0, target.hpMax);
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

  _resolveAttack(battle, p, target, weapon) {
    const weaponName = weapon ? weapon.nome : 'as mãos';
    // Alcance vertical: golpe corpo a corpo não alcança quem está no ar.
    const alcance = this._alcanceVerticalDoGolpe(p, null, weapon);
    if (foraDoAlcanceVertical(alcance, target)) {
      battle.log.push(
        makeLog(`🕊️ ${weaponName} não alcança ${target.charName} na altitude ${target.altitude} (${p.charName} chega até a altitude ${alcance}).`, 'miss'),
      );
      return;
    }
    const res = this._rollToHit(p, target, 'physical');
    if (res.roll === 1) {
      battle.log.push(makeLog(`❌ ${p.charName} falha ao atacar ${target.charName} com ${weaponName}! (d20 = 1)`, 'miss'));
      return;
    }
    if (!res.hit) {
      battle.log.push(makeLog(`💨 ${p.charName} erra o ataque em ${target.charName}. (d20 = ${res.roll}, precisava de ${res.chance})`, 'miss'));
      return;
    }
    this._marcarAcerto(p);
    const dmg = physicalDamage(this._withDrunk(p), weapon, this._physMult(p) * this._especializacaoMult(p, weapon));
    let total = res.crit ? dmg.total * 2 : dmg.total;
    const atkElem = weapon?.elemento || 'fisico';
    const elemM = this._elemMult(atkElem, target);
    total = Math.round(total * elemM);
    const elemTag = elemM > 1 ? ` ⚡${atkElem} fragiliza!` : elemM < 1 ? ` 🛡${atkElem} resistido!` : '';
    battle.log.push(
      makeLog(
        `${res.crit ? '✨ CRÍTICO! ' : ''}⚔️ ${p.charName} ataca ${target.charName} com ${weaponName}: dados [${dmg.rolls.join(', ')}] + bônus = ${total} de dano.${elemTag}`,
        'attack',
      ),
    );
    this._chargeEspecial(battle, p, res.crit ? 15 : 8);
    const dealt = this._applyDamage(target, total, battle, p, 'physical');
    if (dealt > 0) this._lifesteal(battle, p, dealt);
    if (!target.alive && !target.horda) p.kills += 1;
    const ataqueStatus = efeitosDe(p).ataqueStatus;
    if (ataqueStatus && target.alive) this._applyStatus(battle, target, ataqueStatus, p);
  }

  _setCooldown(p, skill) {
    if (!skill.cooldown) return;
    p.cooldowns = p.cooldowns || {};
    p.cooldowns[skill.id] = skill.cooldown;
  }

  _resolveSkill(battle, p, target, skill) {
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
      const healing = Math.round(p.attributes.inteligencia * (skill.poder / 100) * 1.4);
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

    const kind = skill.tipo === 'fisico' ? 'physical' : 'magic';
    // Alcance vertical da magia: algumas magias não alcançam voadores.
    const alcance = this._alcanceVerticalDoGolpe(p, skill, p.equipment?.arma || null);
    if (foraDoAlcanceVertical(alcance, target)) {
      battle.log.push(
        makeLog(`🕊️ ${skill.nome} não alcança ${target.charName} na altitude ${target.altitude} (alcance vertical ${alcance}).`, 'miss'),
      );
      return;
    }
    const res = this._rollToHit(p, target, kind);
    if (res.roll === 1) {
      battle.log.push(makeLog(`❌ ${p.charName} falha ao usar ${skill.nome}! (d20 = 1)`, 'miss'));
      return;
    }
    if (!res.hit) {
      battle.log.push(makeLog(`💨 ${p.charName} erra ${skill.nome} em ${target.charName}. (d20 = ${res.roll}, precisava de ${res.chance})`, 'miss'));
      return;
    }
    this._marcarAcerto(p);
    let dmg;
    if (skill.tipo === 'fisico') {
      const base = Math.round(this._rollAttrs(p).forca * 1.5 * (skill.poder / 100));
      const qty = Math.max(1, Math.round(skill.poder / 100));
      const mult = this._physMult(p) * (p.buffPhysical || 1);
      dmg = rollDamage(6, qty, Math.round(base * mult));
    } else {
      dmg = magicDamage(p, { poder: skill.poder / 100 });
      dmg.total = Math.round(dmg.total * this._magMult(p));
    }
    const total0 = res.crit ? dmg.total * 2 : dmg.total;
    const skElem = skill.elemento || 'fisico';
    const skElemM = this._elemMult(skElem, target);
    const total = Math.round(total0 * skElemM);
    const skElemTag = skElemM > 1 ? ` ⚡${skElem} fragiliza!` : skElemM < 1 ? ` 🛡${skElem} resistido!` : '';
    battle.log.push(
      makeLog(
        `${res.crit ? '✨ CRÍTICO! ' : ''}✨ ${p.charName} usa ${skill.nome} em ${target.charName}: ${total} de dano (${skill.poder}%).${skElemTag}`,
        'attack',
      ),
    );
    this._chargeEspecial(battle, p, res.crit ? 15 : 8);
    const dealt = this._applyDamage(target, total, battle, p, kind);
    if (dealt > 0) this._lifesteal(battle, p, dealt);
    if (!target.alive && !target.horda) p.kills += 1;
    this._setCooldown(p, skill);
    if (skill.status) this._applyStatus(battle, target, skill.status, p);
  }

  // Golpe ultimate (durante o Modo Ultimate) e Golpe Especial (gasta 100% da barra).
  _resolveMegaSkill(battle, p, target, skill) {
    if (skill.tipo === 'cura') {
      const healing = Math.round(p.attributes.inteligencia * (skill.poder / 100) * 2.2);
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

    const kind = skill.tipo === 'fisico' ? 'physical' : 'magic';
    const alcance = this._alcanceVerticalDoGolpe(p, skill, p.equipment?.arma || null);
    if (foraDoAlcanceVertical(alcance, target)) {
      battle.log.push(
        makeLog(`🕊️ ${skill.nome} não alcança ${target.charName} na altitude ${target.altitude} (alcance vertical ${alcance}).`, 'miss'),
      );
      return;
    }
    const res = this._rollToHit(p, target, kind);
    if (res.roll === 1) {
      battle.log.push(makeLog(`❌ ${p.charName} falha ao desferir ${skill.nome}! (d20 = 1)`, 'miss'));
      return;
    }
    if (!res.hit) {
      battle.log.push(makeLog(`💨 ${p.charName} erra ${skill.nome} em ${target.charName}. (d20 = ${res.roll}, precisava de ${res.chance})`, 'miss'));
      return;
    }
    this._marcarAcerto(p);
    let dmg;
    if (skill.tipo === 'fisico') {
      const base = Math.round(this._rollAttrs(p).forca * 2.2 * (skill.poder / 100));
      const qty = Math.max(1, Math.round(skill.poder / 100));
      const mult = this._physMult(p) * (p.buffPhysical || 1);
      dmg = rollDamage(6, qty, Math.round(base * mult));
    } else {
      dmg = magicDamage(p, { poder: skill.poder / 100 });
      dmg.total = Math.round(dmg.total * this._magMult(p));
    }
    const total0m = res.crit ? dmg.total * 2 : dmg.total;
    const meElem = skill.elemento || 'fisico';
    const meElemM = this._elemMult(meElem, target);
    const total = Math.round(total0m * meElemM);
    const meElemTag = meElemM > 1 ? ` ⚡${meElem} fragiliza!` : meElemM < 1 ? ` 🛡${meElem} resistido!` : '';
    battle.log.push(
      makeLog(
        `${res.crit ? '✨ CRÍTICO! ' : ''}💫 ${p.charName} desfere ${skill.nome} em ${target.charName}: ${total} de dano (${skill.poder}%)!${meElemTag}`,
        'attack',
      ),
    );
    const dealt = this._applyDamage(target, total, battle, p, kind);
    if (dealt > 0) this._lifesteal(battle, p, dealt);
    if (!target.alive && !target.horda) p.kills += 1;
  }

  _resolveItem(battle, p, item) {
    if (item.tipo !== 'pocao') {
      battle.log.push(makeLog(`❌ ${item.nome} não pode ser usado em combate.`, 'miss'));
      return;
    }
    const idx = p.inventory.findIndex((it) => it.id === item.id);
    if (idx === -1) {
      battle.log.push(makeLog(`❌ ${p.charName} não possui ${item.nome}.`, 'miss'));
      return;
    }
    p.inventory.splice(idx, 1);
    if (item.cura) {
      const before = p.hp;
      p.hp = clamp(p.hp + item.cura, 0, p.hpMax);
      battle.log.push(makeLog(`🧪 ${p.charName} usa ${item.nome}: cura ${p.hp - before} de HP.`, 'heal'));
    }
    if (item.mana) {
      const before = p.mp;
      p.mp = clamp(p.mp + item.mana, 0, p.mpMax);
      battle.log.push(makeLog(`🧪 ${p.charName} usa ${item.nome}: restaura ${p.mp - before} de MP.`, 'heal'));
    }
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

    const target = battle.participants.find(
      (q) => q.characterId === action.targetId || q.uid === action.targetId,
    ) || null;

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
        const weapon = p.equipment.arma ? EQUIPMENT.armas[p.equipment.arma.id] : null;
        this._resolveAttack(battle, p, target, weapon);
        break;
      }
      case 'magic': {
        const skills = skillsOf(p);
        const skill = skills.find((s) => s.id === action.spellId || s.nome === action.spellId);
        if (!skill) throw new Error('Golpe/magia desconhecido.');
        if ((skill.tipo === 'fisico' || skill.tipo === 'magia') && (!target || !target.alive)) {
          throw new Error('Escolha um alvo vivo.');
        }
        this._resolveSkill(battle, p, target, skill);
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
        this._resolveMegaSkill(battle, p, target, ult);
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
        this._resolveMegaSkill(battle, p, target, esp);
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
      const usable = (p.spells || []).filter((sid) => {
        const sk = SPELLS[sid];
        return sk && (sk.custo || 0) <= p.mp;
      });
      if (usable.length) {
        this._resolveSkill(p, target, usable[0], battle);
        return;
      }
    }
    const weapon = p.equipment.arma ? EQUIPMENT.armas[p.equipment.arma.id] : null;
    this._resolveAttack(battle, p, target, weapon);
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
