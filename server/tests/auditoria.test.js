// Regressões da auditoria de buffs/cura, Ações Rápidas/canhões e criação de golpes.
// Cada caso aqui reproduziu um bug real confirmado por leitura de código.
import { describe, it, expect } from 'vitest';
import { BattleManager } from '../src/game/battleManager.js';
import { normalizeSkill } from '../src/services/characters.js';
import { ALVO_TIPOS } from '../src/game/sistema.js';

function audMakeManager() {
  return new BattleManager({ emit: () => {}, saveBattle: () => {}, onBattleEnd: () => {} });
}

function audMakeCharacter(overrides = {}) {
  return {
    id: 'char-1',
    name: 'Hero',
    level: 1,
    race: 'humano',
    races: [{ id: 'humano', nome: 'Humano', bonus: {}, passiva: '', efeito: {} }],
    classes: [{
      id: 'guerreiro', nome: 'Guerreiro', bonus: { forca: 3 }, hpPerLevel: 12, mpPerLevel: 3,
      levelUp: 'forca', spellList: [], archetype: 'guerreiro', primary: true,
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

function audMakeMonsterDef(overrides = {}) {
  return {
    id: 'colosso', nome: 'Colosso', nivel: 5,
    attributes: { forca: 1, inteligencia: 1, resistencia: 10, destreza: 1, reflexos: 1 },
    arma: { nome: 'Punho', danoBase: 3 },
    spells: [], passiva: '', efeitos: {},
    ...overrides,
  };
}

describe('Auditoria — criação de golpes (normalizeSkill)', () => {
  it('preserva alvo area/cone/explosao como chave, não como rótulo', () => {
    for (const alvo of Object.keys(ALVO_TIPOS)) {
      const golpe = normalizeSkill({ nome: `Golpe ${alvo}`, tipo: 'magia', alvo });
      expect(golpe.alvo).toBe(alvo);
      expect(ALVO_TIPOS[golpe.alvo]).toBeTruthy();
    }
  });

  it('rejeita alvo inválido em vez de gravar lixo', () => {
    const golpe = normalizeSkill({ nome: 'Golpe', alvo: 'nao-existe' });
    expect(golpe.alvo).toBe(null);
  });
});

describe('Auditoria — congelamento em monstros da IA', () => {
  it('monstro congelado pela IA não ataca e consome a duração', () => {
    const manager = audMakeManager();
    const battle = manager.createBattle({
      name: 'IA', mode: 'mestre', host: 'p1', hostName: 'M',
      character: audMakeCharacter(), aiEnabled: true,
    });
    manager.addMonster({ battleId: battle.id, hostId: 'p1', monsterDef: audMakeMonsterDef() });
    manager.startBattle({ battleId: battle.id, playerId: 'p1' });
    const monstro = battle.participants.find((q) => q.isMonster);
    const heroi = battle.participants.find((q) => !q.isMonster);

    manager._applyStatus(battle, monstro, { tipo: 'congelamento', turnos: 2 }, heroi);
    battle.currentTurnIndex = battle.turnOrder.indexOf(monstro.uid);
    const hpAntes = heroi.hp;
    manager._aiAction(battle, monstro);

    expect(battle.log.some((l) => l.text.includes('está congelado e pula o turno'))).toBe(true);
    expect(heroi.hp).toBe(hpAntes);
    const gelo = monstro.statuses.find((s) => s.id === 'congelamento');
    expect(gelo?.turnos).toBe(1);
  });

  it('congelamento de IA expira e libera o monstro após a duração', () => {
    const manager = audMakeManager();
    const battle = manager.createBattle({
      name: 'IA', mode: 'mestre', host: 'p1', hostName: 'M',
      character: audMakeCharacter(), aiEnabled: true,
    });
    manager.addMonster({ battleId: battle.id, hostId: 'p1', monsterDef: audMakeMonsterDef() });
    manager.startBattle({ battleId: battle.id, playerId: 'p1' });
    const monstro = battle.participants.find((q) => q.isMonster);
    const heroi = battle.participants.find((q) => !q.isMonster);

    manager._applyStatus(battle, monstro, { tipo: 'congelamento', turnos: 1 }, heroi);
    battle.currentTurnIndex = battle.turnOrder.indexOf(monstro.uid);
    manager._aiAction(battle, monstro);

    expect(monstro.statuses.some((s) => s.id === 'congelamento')).toBe(false);
    expect(battle.log.some((l) => l.text.includes('se libertou do gelo'))).toBe(true);
  });
});

describe('Auditoria — duração independente de buffs físico/mágico', () => {
  function audMakeAlvo() {
    return {
      charName: 'Alvo', alive: true, hp: 100, hpMax: 100, mp: 0, mpMax: 100,
      statuses: [], inventory: [], buffPhysical: 1, buffMagic: 1,
      buffPhysicalTurns: 0, buffMagicTurns: 0, buffTurns: 0,
      drunk: false, drunkTurns: 0, races: [], classes: [], equipment: {},
      voando: false, ultimateMode: false, cooldowns: {},
    };
  }

  it('buff físico curto expira antes do mágico longo', () => {
    const manager = audMakeManager();
    const battle = { log: [] };
    const p = audMakeAlvo();
    manager._aplicarBuff([p], { poder: 20, buffTipo: 'fisico', duracao: 2 });
    manager._aplicarBuff([p], { poder: 10, buffTipo: 'magico', duracao: 3 });
    expect(p.buffPhysical).toBeCloseTo(1.2);
    expect(p.buffMagic).toBeCloseTo(1.1);

    manager._resolveTurnGains(battle, p);
    manager._resolveTurnGains(battle, p);
    expect(p.buffPhysical).toBe(1);
    expect(p.buffMagic).toBeCloseTo(1.1);

    manager._resolveTurnGains(battle, p);
    expect(p.buffMagic).toBe(1);
  });

  it('buffs do mesmo eixo aplicados em turnos distintos não expiram juntos', () => {
    const manager = audMakeManager();
    const battle = { log: [] };
    const p = audMakeAlvo();
    manager._aplicarBuff([p], { poder: 15, buffTipo: 'fisico', duracao: 3 });
    manager._resolveTurnGains(battle, p);
    manager._aplicarBuff([p], { poder: 10, buffTipo: 'fisico', duracao: 3 });
    manager._resolveTurnGains(battle, p);
    manager._resolveTurnGains(battle, p);
    expect(p.buffPhysical).toBeGreaterThan(1);
    manager._resolveTurnGains(battle, p);
    expect(p.buffPhysical).toBe(1);
  });
});
