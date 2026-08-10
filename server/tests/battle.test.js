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
    expect(boss.hpMax).toBe(600); // 100 (HP do herói) x 6

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
