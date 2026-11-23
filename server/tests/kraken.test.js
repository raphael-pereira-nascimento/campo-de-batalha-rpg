// Regressões do Kraken do Abismo Eclipse: passiva, CD 16/18, status, horda e arena.
// Regras confirmadas pelo criador; números provisórios documentados em PENDENCIAS.md (D-54+).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BattleManager } from '../src/game/battleManager.js';
import { MONSTERS } from '../src/game/monsters.js';
import { SPELLS, STATUS_DEFS, skillFromSpell } from '../src/game/data.js';

function makeCharacter(overrides = {}) {
  return {
    id: 'char-1',
    name: 'Hero',
    level: 1,
    race: 'humano',
    races: [{ id: 'humano', nome: 'Humano', bonus: {}, passiva: '', efeito: {} }],
    classes: [{
      id: 'guerreiro', nome: 'Guerreiro', bonus: { forca: 3, resistencia: 2, destreza: 1 },
      hpPerLevel: 12, mpPerLevel: 3, levelUp: 'forca', spellList: [],
      archetype: 'guerreiro', primary: true,
    }],
    passiva: '',
    attributes: { forca: 8, inteligencia: 4, resistencia: 8, destreza: 5, reflexos: 5 },
    equipment: {},
    spells: [],
    skills: [],
    inventory: [],
    ...overrides,
  };
}

function makeKrakenBattle() {
  const manager = new BattleManager({ emit: () => {}, saveBattle: () => {}, onBattleEnd: () => {} });
  const battle = manager.createBattle({
    name: 'Kraken',
    mode: 'mestre',
    host: 'p1',
    hostName: 'Mestre',
    character: makeCharacter(),
    calendario: { dia: 1, tipoEclipse: 'comum' },
  });
  manager.addMonster({
    battleId: battle.id,
    hostId: 'p1',
    monsterDef: MONSTERS.kraken_abismo_eclipse,
  });
  manager.startBattle({ battleId: battle.id, playerId: 'p1' });
  return {
    manager,
    battle,
    hero: battle.participants.find((p) => !p.isMonster),
    kraken: battle.participants.find((p) => p.isMonster && !p.horda),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Kraken Eclipse — definição e ativação', () => {
  it('a definição isEclipse força a batalha para o dia 30 do Eclipse', () => {
    const { battle, kraken } = makeKrakenBattle();
    expect(battle.eclipse.eclipseAtivo).toBe(true);
    expect(battle.eclipse.dia).toBe(30);
    expect(kraken.isEclipse).toBe(true);
    expect(kraken.arenaEffect).toBe('Água Profunda Corrompida');
  });

  it('o chefe recebe as três habilidades com os CDs de teste corretos', () => {
    expect(SPELLS.tentaculos_da_loucura.saveDC).toBe(16);
    expect(SPELLS.mare_negra.saveDC).toBe(18);
    expect(SPELLS.chamado_do_abismo.cooldown).toBe(4);
    expect(skillFromSpell(SPELLS.chamado_do_abismo).cooldown).toBe(4);
    const { kraken } = makeKrakenBattle();
    const chaves = kraken.skills.filter((s) => s.kraken).map((s) => s.chave);
    expect(chaves).toContain('tentaculos_da_loucura');
    expect(chaves).toContain('mare_negra');
    expect(chaves).toContain('chamado_do_abismo');
  });
});

describe('Kraken Eclipse — Coração da Tempestade', () => {
  it('cura 5% do HP máximo no início do turno', () => {
    const { manager, battle, kraken } = makeKrakenBattle();
    kraken.hp = 100;
    manager._resolveTurnGains(battle, kraken);
    // 5% de hpMax + cura recebida (sem redução de cura no herói de teste).
    expect(kraken.hp).toBe(100 + Math.max(1, Math.round(kraken.hpMax * 0.05)));
  });

  it('dano de Luz anula a cura no turno seguinte', () => {
    const { manager, battle, kraken, hero } = makeKrakenBattle();
    kraken.hp = 100;
    manager._applyDamage(kraken, 100, battle, hero, 'magic', 'luz');
    expect(kraken.ultimoDanoLuzSagradoTurno).toBe(battle.turno);
    manager._resolveTurnGains(battle, kraken);
    expect(kraken.hp).toBeLessThan(100);
  });

  it('Sagrado é alias de Luz e também anula a cura', () => {
    const { manager, battle, kraken, hero } = makeKrakenBattle();
    manager._applyDamage(kraken, 100, battle, hero, 'magic', 'Sagrado');
    expect(kraken.ultimoDanoLuzSagradoTurno).toBe(battle.turno);
    const hpAposDano = kraken.hp;
    manager._resolveTurnGains(battle, kraken);
    expect(kraken.hp).toBe(hpAposDano);
  });

  it('Luz Sagrada (nome do catálogo) é normalizada como Luz', () => {
    const { manager, battle, kraken, hero } = makeKrakenBattle();
    manager._applyDamage(kraken, 50, battle, hero, 'magic', 'Luz Sagrada');
    expect(kraken.ultimoDanoLuzSagradoTurno).toBe(battle.turno);
  });
});

describe('Kraken Eclipse — testes de Reflexo e status', () => {
  it('Tentáculos da Loucura: CD 16, até 3 alvos e Confusão/Medo por 2 turnos', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // d20 = 1 → falha garantida
    const { manager, battle, kraken } = makeKrakenBattle();
    const skill = { ...skillFromSpell(SPELLS.tentaculos_da_loucura), poder: 0.01, alvosMax: 3 };
    manager._resolveKrakenSkill(battle, kraken, battle.participants.find((p) => !p.isMonster), skill);
    const herois = battle.participants.filter((p) => !p.isMonster);
    expect(battle.log.some((l) => l.text.includes('vs CD 16'))).toBe(true);
    expect(herois.some((h) => h.statuses.some((s) => ['confusao', 'medo'].includes(s.id)))).toBe(true);
  });

  it('Maré Negra: CD 18, Cegueira e Veneno por 3 turnos em todos', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { manager, battle, kraken } = makeKrakenBattle();
    const skill = { ...skillFromSpell(SPELLS.mare_negra), poder: 0.01 };
    manager._resolveKrakenSkill(battle, kraken, battle.participants.find((p) => !p.isMonster), skill);
    const heroi = battle.participants.find((p) => !p.isMonster);
    expect(battle.log.some((l) => l.text.includes('vs CD 18'))).toBe(true);
    expect(heroi.statuses.map((s) => s.id)).toContain('cegueira');
    expect(heroi.statuses.map((s) => s.id)).toContain('veneno');
  });

  it('Confusão e Medo reduzem acerto; Medo também reduz esquiva', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { manager } = makeKrakenBattle();
    const atk = { attributes: { forca: 5, destreza: 5, reflexos: 5, inteligencia: 5 }, statuses: [] };
    const def = { attributes: { forca: 5, destreza: 5, reflexos: 5, inteligencia: 5 }, statuses: [], dodge: false };
    const base = manager._rollToHit(atk, def, 'physical').chance;
    atk.statuses = [{ id: 'confusao', turnos: 2 }];
    const confuso = manager._rollToHit(atk, def, 'physical').chance;
    atk.statuses = [{ id: 'medo', turnos: 2 }];
    const medroso = manager._rollToHit(atk, def, 'physical').chance;
    expect(confuso).toBeLessThan(base);
    expect(medroso).toBeLessThan(base);
    expect(STATUS_DEFS.confusao).toBeDefined();
    expect(STATUS_DEFS.medo).toBeDefined();
  });
});

describe('Kraken Eclipse — horda e arena', () => {
  it('Chamado do Abismo invoca 1d4+2 Marinheiros Afogados com moral cheia', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // d4 = 4 → 4 + 2 = 6 corpos
    const { manager, battle, kraken } = makeKrakenBattle();
    const skill = skillFromSpell(SPELLS.chamado_do_abismo);
    manager._resolveKrakenSkill(battle, kraken, null, skill);
    const horda = battle.participants.find((p) => p.horda);
    expect(horda).toBeDefined();
    expect(horda.horda.quantidade).toBe(6);
    expect(horda.horda.moral).toBe(100);
    expect(horda.hp).toBe(horda.horda.hpPorUnidade * 6);
    expect(battle.log.some((l) => l.text.includes('Chamado do Abismo'))).toBe(true);
  });

  it('abates reduzem a Moral da horda', () => {
    const { manager, battle, hero } = makeKrakenBattle();
    const m = battle.participants.find((p) => p.isMonster && !p.horda);
    const def = MONSTERS.horda_marinheiros_afogados;
    const horda = {
      ...m,
      isMonster: true,
      horda: { quantidade: 4, inicial: 4, hpPorUnidade: 100, moral: 100, moralMax: 100, danoEscalonavel: 0.12 },
      hp: 400,
      hpMax: 400,
      defesa: 0,
      statuses: [],
      alive: true,
      charName: def.nome,
    };
    manager._applyDamage(horda, 200, battle, hero, 'physical');
    expect(horda.horda.quantidade).toBe(2);
    expect(horda.horda.moral).toBe(79); // 100 - 2 abates*10 - 200/200
    expect(manager._danoHordaMult(horda)).toBeLessThan(manager._danoHordaMult({ ...horda, horda: { ...horda.horda, quantidade: 4, moral: 100 } }));
  });

  it('Água Profunda Corrompida aplica -2 DEX/REF sem Respiração Aquática', () => {
    const { manager, battle, hero } = makeKrakenBattle();
    expect(hero.arenaPenalizada).toBe(true);
    const attrs = manager._rollAttrs(hero, battle);
    expect(attrs.destreza).toBe(3);
    expect(attrs.reflexos).toBe(3);

    hero.statuses = [{ id: 'respiracao_aquatica', turnos: 3 }];
    manager._atualizarFlagsArena(battle);
    expect(hero.arenaPenalizada).toBe(false);
    const protegido = manager._rollAttrs(hero, battle);
    expect(protegido.destreza).toBe(5);
    expect(protegido.reflexos).toBe(5);
  });

  it('Respirador Abissal (acessório) também protege da arena', () => {
    const { manager, battle, hero } = makeKrakenBattle();
    hero.equipment = { acessorio: { id: 'respirador_abissal', nome: 'Respirador Abissal', efeito: { respiracaoAquatica: true } } };
    manager._atualizarFlagsArena(battle);
    expect(hero.arenaPenalizada).toBe(false);
    expect(manager._rollAttrs(hero, battle).reflexos).toBe(5);
  });
});
