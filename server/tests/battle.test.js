import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BattleManager } from '../src/game/battleManager.js';

function makeCharacter(overrides = {}) {
  return {
    id: 'char-1',
    name: 'Hero',
    level: 1,
    race: 'humano',
    races: [{ id: 'humano', nome: 'Humano', bonus: { escolha: 1 }, passiva: '', efeito: {} }],
    classes: [
      {
        id: 'guerreiro',
        nome: 'Guerreiro',
        bonus: { forca: 3, resistencia: 2, destreza: 1 },
        hpPerLevel: 12,
        mpPerLevel: 3,
        levelUp: 'forca',
        spellList: [],
        archetype: 'guerreiro',
        primary: true,
      },
    ],
    passiva: '',
    attributes: { forca: 8, inteligencia: 4, resistencia: 8, destreza: 5, reflexos: 5 },
    equipment: {},
    spells: [],
    skills: [],
    inventory: [],
    ultimate: {
      nome: 'Fúria Ancestral',
      tipo: 'fisico',
      poder: 250,
      condicao: { tipo: 'turnos', valor: 2 },
      modo: { turnos: 3, danoMultPct: 50 },
    },
    especial: { nome: 'Meteoro', tipo: 'magia', poder: 300, condicao: { tipo: 'turnos', valor: 3 } },
    ...overrides,
  };
}

function makeManager() {
  const calls = { saved: 0, ended: 0 };
  const manager = new BattleManager({
    emit: () => {},
    saveBattle: () => {
      calls.saved += 1;
    },
    onBattleEnd: () => {
      calls.ended += 1;
    },
  });
  return { manager, calls };
}

function makeMonsterDef() {
  return {
    id: 'colosso',
    nome: 'Colosso',
    nivel: 30,
    attributes: { forca: 1, inteligencia: 1, resistencia: 30, destreza: 1, reflexos: 1 },
    arma: { nome: 'Punho Fraco', danoBase: 3 },
    spells: [],
    passiva: '',
    efeitos: {},
    escalaChefe: true,
    multiplicadorHP: 6,
  };
}

describe('BattleManager — barras', () => {
  it('ultimateBar e especialBar ficam limitadas a 100', () => {
    const { manager } = makeManager();
    const p = { isMonster: false, ultimateBar: 90, especialBar: 95 };
    const battle = { participants: [p] };
    manager._chargeUltimate(battle, p, 30);
    manager._chargeEspecial(battle, p, 20);
    expect(p.ultimateBar).toBe(100);
    expect(p.especialBar).toBe(100);
  });

  it('monstros não carregam barras', () => {
    const { manager } = makeManager();
    const p = { isMonster: true, ultimateBar: 0, especialBar: 0 };
    const battle = { participants: [p] };
    manager._chargeUltimate(battle, p, 50);
    manager._chargeEspecial(battle, p, 50);
    expect(p.ultimateBar).toBe(0);
    expect(p.especialBar).toBe(0);
  });
});

describe('BattleManager — condições', () => {
  const base = { role: 'hero', team: null, danoRecebido: 0, kills: 0, hp: 50, hpMax: 100, alive: true };

  it('turnos', () => {
    const { manager } = makeManager();
    const battle = { mode: 'todos', turno: 3, participants: [base] };
    expect(manager._condicaoAtendida(battle, base, { tipo: 'turnos', valor: 2 })).toBe(true);
    expect(manager._condicaoAtendida(battle, base, { tipo: 'turnos', valor: 5 })).toBe(false);
  });

  it('danoRecebido', () => {
    const { manager } = makeManager();
    const p = { ...base, danoRecebido: 30 };
    expect(manager._condicaoAtendida({ participants: [p] }, p, { tipo: 'danoRecebido', valor: 25 })).toBe(true);
  });

  it('hpPct', () => {
    const { manager } = makeManager();
    const p = { ...base, hp: 40 };
    expect(manager._condicaoAtendida({ participants: [p] }, p, { tipo: 'hpPct', valor: 50 })).toBe(true);
  });

  it('kills', () => {
    const { manager } = makeManager();
    const p = { ...base, kills: 2 };
    expect(manager._condicaoAtendida({ participants: [p] }, p, { tipo: 'kills', valor: 1 })).toBe(true);
  });

  it('aliadosCaidos', () => {
    const { manager } = makeManager();
    const p = { ...base, team: 'A' };
    const battle = {
      mode: 'equipes',
      turno: 3,
      participants: [
        p,
        { ...base, team: 'A', alive: false },
        { ...base, team: 'A', alive: true },
        { ...base, team: 'B', alive: false },
      ],
    };
    expect(manager._condicaoAtendida(battle, p, { tipo: 'aliadosCaidos', valor: 1 })).toBe(true);
    expect(manager._condicaoAtendida(battle, p, { tipo: 'aliadosCaidos', valor: 2 })).toBe(false);
  });
});

describe('BattleManager — efeitos de status', () => {
  function makeTarget(overrides = {}) {
    return {
      charName: 'Alvo',
      hp: 50,
      hpMax: 100,
      mp: 10,
      mpMax: 10,
      alive: true,
      isMonster: false,
      statuses: [],
      ...overrides,
    };
  }
  function makeBattle(p) {
    return { participants: [p], log: [] };
  }

  it('queimadura causa dano a cada turno e expira', () => {
    const { manager } = makeManager();
    const p = makeTarget();
    const battle = makeBattle(p);
    manager._applyStatus(battle, p, { tipo: 'queimadura', turnos: 2, dano: 5 }, { charName: 'Caster' });
    expect(p.statuses).toHaveLength(1);
    manager._processStatuses(battle, p);
    expect(p.hp).toBe(45);
    expect(p.statuses[0].turnos).toBe(1);
    manager._processStatuses(battle, p);
    expect(p.hp).toBe(40);
    expect(p.statuses).toHaveLength(0);
  });

  it('imunidade de monstro impede o status (esqueleto não sangra)', () => {
    const { manager } = makeManager();
    const p = makeTarget({
      charName: 'Esqueleto',
      isMonster: true,
      monsterDef: { efeitos: { imune: ['sangramento'] } },
    });
    const battle = makeBattle(p);
    manager._applyStatus(battle, p, { tipo: 'sangramento', turnos: 2, dano: 4 }, { charName: 'Caster' });
    expect(p.statuses).toHaveLength(0);
  });

  it('regeneração recupera HP por turno e expira', () => {
    const { manager } = makeManager();
    const p = makeTarget();
    const battle = makeBattle(p);
    manager._applyStatus(battle, p, { tipo: 'regeneracao', turnos: 2, dano: 6 }, null);
    manager._processStatuses(battle, p);
    expect(p.hp).toBe(56);
    manager._processStatuses(battle, p);
    expect(p.hp).toBe(62);
    expect(p.statuses).toHaveLength(0);
  });

  it('congelamento faz o alvo pular o turno', () => {
    const { manager } = makeManager();
    const battle = manager.createBattle({
      name: 'T',
      mode: 'todos',
      host: 'p1',
      hostName: 'H',
      character: makeCharacter({ id: 'c1', name: 'Alfa' }),
    });
    manager.joinBattle({
      battleId: battle.id,
      playerId: 'p2',
      playerName: 'Beta',
      character: makeCharacter({ id: 'c2', name: 'Beta' }),
      team: null,
    });
    manager.startBattle({ battleId: battle.id, playerId: 'p1' });
    const current = battle.participants[battle.turnOrder[battle.currentTurnIndex]];
    const other = battle.participants.find((q) => q !== current);
    manager._applyStatus(battle, current, { tipo: 'congelamento', turnos: 2 }, other);
    const beforeTurn = battle.currentTurnIndex;
    manager.handleAction({
      battleId: battle.id,
      characterId: current.characterId,
      playerId: current.playerId,
      action: { type: 'attack', targetId: other.characterId },
    });
    const log = battle.log.map((l) => l.text).join('\n');
    expect(log).toContain('está congelado e pula o turno');
    expect(battle.currentTurnIndex).not.toBe(beforeTurn);
  });

  it('fraqueza reduz o multiplicador de dano físico', () => {
    const { manager } = makeManager();
    const p = { isMonster: false, races: [], statuses: [{ id: 'fraqueza', turnos: 2 }], alive: true, hp: 100, hpMax: 100, ultimateMode: false };
    expect(manager._physMult(p)).toBeCloseTo(0.8);
  });

  it('cegueira reduz a chance de acerto do atacante', () => {
    const { manager } = makeManager();
    const atk = { attributes: { destreza: 5, reflexos: 5, inteligencia: 4 }, statuses: [] };
    const def = { attributes: { destreza: 5, reflexos: 5, inteligencia: 4 }, dodge: false, statuses: [] };
    const normal = manager._rollToHit(atk, def, 'physical');
    const cego = manager._rollToHit({ ...atk, statuses: [{ id: 'cegueira', turnos: 3 }] }, def, 'physical');
    expect(cego.chance).toBeLessThan(normal.chance);
  });

  it('monstro com ataqueStatus aplica o status ao acertar', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { manager } = makeManager();
    const battle = manager.createBattle({
      name: 'T',
      mode: 'mestre',
      host: 'p1',
      hostName: 'M',
      character: makeCharacter(),
    });
    manager.addMonster({
      battleId: battle.id,
      hostId: 'p1',
      monsterDef: {
        ...makeMonsterDef(),
        efeitos: { ataqueStatus: { tipo: 'sangramento', turnos: 2, dano: 4 } },
      },
    });
    manager.startBattle({ battleId: battle.id, playerId: 'p1' });
    const hero = battle.participants.find((q) => !q.isMonster);
    const boss = battle.participants.find((q) => q.isMonster);
    let guard = 0;
    while (!hero.statuses.length && guard < 50) {
      guard += 1;
      const cur = battle.participants[battle.turnOrder[battle.currentTurnIndex]];
      const id = cur.isMonster ? cur.uid : cur.characterId;
      const targetId = cur.isMonster ? hero.characterId : boss.uid;
      manager.handleAction({
        battleId: battle.id,
        characterId: id,
        playerId: 'p1',
        action: { type: 'attack', targetId },
      });
    }
    expect(hero.statuses.map((s) => s.id)).toContain('sangramento');
    vi.restoreAllMocks();
  });
});

describe('BattleManager — fluxo completo de ultimate/especial', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enche as barras, ativa a ultimate, usa o golpe ultimate e dispara o especial', () => {
    const { manager, calls } = makeManager();
    const character = makeCharacter();
    const battle = manager.createBattle({
      name: 'Teste',
      mode: 'mestre',
      host: 'p1',
      hostName: 'Mestre',
      character,
    });
    const hero = battle.participants[0];

    manager.addMonster({ battleId: battle.id, hostId: 'p1', monsterDef: makeMonsterDef() });
    const boss = battle.participants.find((q) => q.isMonster);
    expect(boss.hpMax).toBe(hero.hpMax * 6); // Chefe escala com HP do herói (500+RES×10) × 6

    manager.startBattle({ battleId: battle.id, playerId: 'p1' });
    expect(battle.status).toBe('in_progress');

    const heroTurn = () =>
      battle.participants[battle.turnOrder[battle.currentTurnIndex]] === hero;
    const actHero = (action) =>
      manager.handleAction({
        battleId: battle.id,
        characterId: hero.characterId,
        playerId: 'p1',
        action,
      });
    const actMonster = () => {
      const cur = battle.participants[battle.turnOrder[battle.currentTurnIndex]];
      if (cur === boss) {
        manager.handleAction({
          battleId: battle.id,
          characterId: boss.uid,
          playerId: 'p1',
          action: { type: 'attack', targetId: hero.characterId },
        });
      }
    };

    let guard = 0;
    const acted = { ultimate: false, ultSkill: false, especial: false };
    while (guard < 200) {
      guard += 1;
      if (heroTurn()) {
        if (!acted.ultimate && hero.ultimateBar >= 100) {
          actHero({ type: 'ultimate' });
          acted.ultimate = true;
        } else if (acted.ultimate && !acted.ultSkill && hero.ultimateMode) {
          actHero({ type: 'ultimateSkill', targetId: boss.uid });
          acted.ultSkill = true;
        } else if (!acted.especial && hero.especialBar >= 100) {
          actHero({ type: 'especial', targetId: boss.uid });
          acted.especial = true;
        } else {
          actHero({ type: 'attack', targetId: boss.uid });
        }
      } else {
        actMonster();
      }
      if (acted.especial) break;
    }

    const log = battle.log.map((l) => l.text).join('\n');
    expect(log).toContain('ATIVA A ULTIMATE');
    expect(log).toContain('desfere Fúria Ancestral');
    expect(log).toContain('desfere Meteoro');
    expect(acted.ultimate && acted.ultSkill && acted.especial).toBe(true);
    expect(hero.ultimateModeTurns).toBeLessThanOrEqual(3);
    expect(calls.saved).toBeGreaterThan(0);
  });
});

describe('BattleManager — melhorias do Mestre', () => {
  // Regra confirmada pelo criador: a recuperação de mana é o GASTO ÷ 2.
  it('recupera mana no fim do turno: gasto ÷ 2', () => {
    const { manager } = makeManager();
    const p = {
      isMonster: false,
      alive: true,
      charName: 'Hero',
      attributes: { inteligencia: 7 },
      mp: 10,
      mpMax: 50,
      manaGastoTurno: 6,
    };
    const gain = manager._regenMana(p);
    expect(gain).toBe(3);
    expect(p.mp).toBe(13);
  });

  it('não recupera mana se nada foi gasto no turno', () => {
    const { manager } = makeManager();
    const p = {
      isMonster: false,
      alive: true,
      charName: 'Hero',
      attributes: { inteligencia: 20 },
      mp: 10,
      mpMax: 50,
      manaGastoTurno: 0,
    };
    expect(manager._regenMana(p)).toBe(0);
    expect(p.mp).toBe(10);
  });

  it('não regenera mana em monstros', () => {
    const { manager } = makeManager();
    const p = {
      isMonster: true,
      alive: true,
      attributes: { inteligencia: 20 },
      mp: 1,
      mpMax: 100,
      manaGastoTurno: 8,
    };
    expect(manager._regenMana(p)).toBe(0);
    expect(p.mp).toBe(1);
  });

  it('recuperação de mana respeita o máximo', () => {
    const { manager } = makeManager();
    const p = {
      isMonster: false,
      alive: true,
      attributes: { inteligencia: 20 },
      mp: 48,
      mpMax: 50,
      manaGastoTurno: 8,
    };
    expect(manager._regenMana(p)).toBe(2);
    expect(p.mp).toBe(50);
  });

  it('Modo Chefe Dinâmico usa multiplicador 2.0 e acoesPorTurno por nº de jogadores', () => {
    const { manager } = makeManager();
    const battle = manager.createBattle({
      name: 'T',
      mode: 'mestre',
      host: 'p1',
      hostName: 'M',
      character: makeCharacter({ id: 'c1', name: 'A', attributes: { forca: 5, resistencia: 8, inteligencia: 4, destreza: 5, reflexos: 5 } }),
    });
    // Herói HP max
    const hero = battle.participants[0];
    // adiciona mais 4 jogadores para totalizar 5 (faixa 5-8 => 2 ações)
    manager.joinBattle({
      battleId: battle.id,
      playerId: 'p2', playerName: '2', character: makeCharacter({ id: 'c2', name: 'B', attributes: { forca: 5, resistencia: 8, inteligencia: 4, destreza: 5, reflexos: 5 } }), team: null,
    });
    manager.joinBattle({
      battleId: battle.id,
      playerId: 'p3', playerName: '3', character: makeCharacter({ id: 'c3', name: 'C', attributes: { forca: 5, resistencia: 8, inteligencia: 4, destreza: 5, reflexos: 5 } }), team: null,
    });
    manager.joinBattle({
      battleId: battle.id,
      playerId: 'p4', playerName: '4', character: makeCharacter({ id: 'c4', name: 'D', attributes: { forca: 5, resistencia: 8, inteligencia: 4, destreza: 5, reflexos: 5 } }), team: null,
    });
    manager.joinBattle({
      battleId: battle.id,
      playerId: 'p5', playerName: '5', character: makeCharacter({ id: 'c5', name: 'E', attributes: { forca: 5, resistencia: 8, inteligencia: 4, destreza: 5, reflexos: 5 } }), team: null,
    });

    const sumHeroHp = battle.participants.filter((q) => !q.isMonster).reduce((s, h) => s + h.hpMax, 0);
    manager.addMonster({
      battleId: battle.id,
      hostId: 'p1',
      monsterDef: { id: 'zumbi', nome: 'Zumbi', nivel: 4, attributes: { forca: 5, inteligencia: 1, resistencia: 5, destreza: 1, reflexos: 1 }, arma: { nome: 'G', danoBase: 9 }, spells: [], passiva: '', efeitos: {} },
      modoChefeDinamico: true,
    });
    const boss = battle.participants.find((q) => q.isMonster);
    expect(boss.isBoss).toBe(true);
    expect(boss.hpMax).toBe(Math.max(50, Math.round(sumHeroHp * 2.0)));
    expect(boss.acoesPorTurno).toBe(2); // 5 jogadores => faixa 5-8
  });

  it('Bêbado ajusta os atributos de rolagem (+1 Força, -1 Destreza/Reflexo)', () => {
    const { manager } = makeManager();
    const p = {
      charName: 'Hero',
      alive: true,
      isMonster: false,
      attributes: { forca: 8, destreza: 5, reflexos: 5, inteligencia: 4 },
    };
    const sober = manager._rollAttrs(p);
    expect(sober.forca).toBe(8);
    expect(sober.destreza).toBe(5);
    expect(sober.reflexos).toBe(5);

    const drunk = manager._rollAttrs({ ...p, drunk: true });
    expect(drunk.forca).toBe(9);
    expect(drunk.destreza).toBe(4);
    expect(drunk.reflexos).toBe(4);
  });

  it('toggleDrunk alterna o status e bloqueia monstros', () => {
    const { manager } = makeManager();
    const battle = manager.createBattle({
      name: 'T', mode: 'mestre', host: 'p1', hostName: 'M',
      character: makeCharacter({ id: 'c1', name: 'Alfa' }),
    });
    manager.addMonster({
      battleId: battle.id, hostId: 'p1',
      monsterDef: { id: 'zumbi', nome: 'Zumbi', nivel: 4, attributes: { forca: 5, inteligencia: 1, resistencia: 5, destreza: 1, reflexos: 1 }, arma: { nome: 'G', danoBase: 9 }, spells: [], passiva: '', efeitos: {}, escalaChefe: true, multiplicadorHP: 2 },
    });
    manager.startBattle({ battleId: battle.id, playerId: 'p1' });
    const hero = battle.participants.find((q) => !q.isMonster);
    const monster = battle.participants.find((q) => q.isMonster);
    manager.toggleDrunk({ battleId: battle.id, participantId: hero.characterId });
    expect(hero.drunk).toBe(true);
    manager.toggleDrunk({ battleId: battle.id, participantId: hero.characterId });
    expect(hero.drunk).toBe(false);
    expect(() =>
      manager.toggleDrunk({ battleId: battle.id, participantId: monster.uid })
    ).toThrow();
  });
});
