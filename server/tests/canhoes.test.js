import { describe, it, expect, vi, afterEach } from 'vitest';
import { BattleManager } from '../src/game/battleManager.js';
import { EQUIPMENT } from '../src/game/data.js';
import { fumacaDoDisparo, rajadaDaArma } from '../src/game/sistema.js';

const canhao = (id) => ({ ...EQUIPMENT.canoes[id], id });
const CANHAO_LEVE = canhao('canhao_leve');
const CANHAO_CERCO = canhao('canhao_cerco');
const CANHAO_FERRO = canhao('canhao_ferro');
const CANHAO_DRAGOES = canhao('canhao_dragoes');

function ctx({ ajudante = true, inimigos = 1 } = {}) {
  const manager = new BattleManager({
    emit: () => {},
    saveBattle: () => {},
    onBattleEnd: () => {},
  });
  const atirador = {
    characterId: 'atirador',
    uid: 'p-atirador',
    charName: 'Atirador',
    alive: true,
    isMonster: false,
    team: 'A',
    hp: 500,
    hpMax: 500,
    mp: 0,
    mpMax: 0,
    kills: 0,
    statuses: [],
    attributes: { forca: 5, inteligencia: 3, resistencia: 5, destreza: 5, reflexos: 5 },
    equipment: {},
    races: [],
    classes: [],
    wpnRecarga: {},
    wpnCalor: {},
    wpnDisparou: {},
    wpnSuperaquecido: {},
    fumaca: 0,
  };
  const participantes = [atirador];
  if (ajudante) {
    participantes.push({
      characterId: 'ajudante',
      uid: 'p-ajudante',
      charName: 'Ajudante',
      alive: true,
      isMonster: false,
      team: 'A',
    });
  }
  const alvos = Array.from({ length: inimigos }, (_, i) => ({
    characterId: `alvo-${i}`,
    uid: `alvo-${i}`,
    charName: `Alvo ${i}`,
    alive: true,
    isMonster: true,
    team: 'B',
    hp: 5000,
    hpMax: 5000,
    defesa: 100,
    statuses: [],
  }));
  const battle = {
    id: 'b-canoes',
    mode: 'mestre',
    turno: 1,
    participants: [...participantes, ...alvos],
    log: [],
    turnOrder: [],
    currentTurnIndex: 0,
  };
  return { manager, battle, atirador, alvos };
}

function capturarRolagens(manager) {
  const rolls = [];
  const danos = [];
  vi.spyOn(manager, '_rollToHit').mockImplementation((...args) => {
    rolls.push(args);
    return { hit: true, crit: false, roll: 10, chance: 10, nivel: { nome: 'Médio' } };
  });
  vi.spyOn(manager, '_applyDamage').mockImplementation((...args) => {
    danos.push(args);
    return 1;
  });
  return { rolls, danos };
}

describe('canhões — tripulação mínima (D-64)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('considera qualquer aliado vivo do mesmo lado como ajudante', () => {
    const { manager, battle, atirador } = ctx({ ajudante: true });
    const ajudante = battle.participants[1];
    expect(manager._tripulacaoIncompleta(battle, atirador, CANHAO_LEVE)).toBe(false);

    ajudante.alive = false;
    expect(manager._tripulacaoIncompleta(battle, atirador, CANHAO_LEVE)).toBe(true);

    ajudante.alive = true;
    ajudante.team = 'B';
    expect(manager._tripulacaoIncompleta(battle, atirador, CANHAO_LEVE)).toBe(true);
  });

  it('sem ajudante: −20% de acerto e +1 turno de recarga', () => {
    const { manager, battle, atirador, alvos } = ctx({ ajudante: false });
    const { rolls } = capturarRolagens(manager);
    manager._resolveAttack(battle, atirador, alvos[0], CANHAO_LEVE);

    expect(rolls[0][3].acertoPenalidade).toBe(0.2);
    expect(battle.log.map((l) => l.text).join('\n')).toContain('sem tripulação mínima');
    expect(atirador.wpnRecarga.canhao_leve).toBe(CANHAO_LEVE.recarga + 2);
  });

  it('com ajudante: acerto normal e recarga sem o turno extra', () => {
    const { manager, battle, atirador, alvos } = ctx({ ajudante: true });
    const { rolls } = capturarRolagens(manager);
    manager._resolveAttack(battle, atirador, alvos[0], CANHAO_LEVE);

    expect(rolls[0][3].acertoPenalidade).toBe(0);
    expect(battle.log.map((l) => l.text).join('\n')).not.toContain('sem tripulação mínima');
    expect(atirador.wpnRecarga.canhao_leve).toBe(CANHAO_LEVE.recarga + 1);
  });

  it('a penalidade de acerto vale também para os alvos extras da explosão', () => {
    const { manager, battle, atirador, alvos } = ctx({ ajudante: false, inimigos: 3 });
    const { rolls } = capturarRolagens(manager);
    manager._resolveAttack(battle, atirador, alvos[0], CANHAO_DRAGOES, alvos.slice(1));

    expect(rolls).toHaveLength(3);
    expect(rolls.every((args) => args[3].acertoPenalidade === 0.2)).toBe(true);
  });
});

describe('canhões — descrições mecânicas (D-65 a D-67)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('o dano final desconta apenas 75% da defesa quando ignora 25%', () => {
    const { manager } = ctx();
    const battle = { log: [], turno: 1, participants: [] };
    const atirador = { charName: 'Atirador', isMonster: false };
    const alvoSemIgnorar = { charName: 'Alvo', hp: 1000, hpMax: 1000, defesa: 100, alive: true };
    const alvoComIgnorar = { ...alvoSemIgnorar };

    expect(manager._applyDamage(alvoSemIgnorar, 200, battle, atirador, 'physical', 'fogo')).toBe(100);
    expect(manager._applyDamage(alvoComIgnorar, 200, battle, atirador, 'physical', 'fogo', {
      ignoraDefesaPct: 25,
    })).toBe(125);
  });

  it('ignora 25% da defesa em todos os alvos atingidos', () => {
    const { manager, battle, atirador, alvos } = ctx({ ajudante: true, inimigos: 3 });
    const { danos } = capturarRolagens(manager);
    manager._resolveAttack(battle, atirador, alvos[0], CANHAO_DRAGOES, alvos.slice(1));

    expect(danos).toHaveLength(3);
    expect(danos.every((args) => args[6]?.ignoraDefesaPct === 25)).toBe(true);
  });

  it('o canhão de cerco leva 1 turno extra de recarga pelo tripé', () => {
    const { manager, battle, atirador, alvos } = ctx({ ajudante: true });
    capturarRolagens(manager);
    manager._resolveAttack(battle, atirador, alvos[0], CANHAO_CERCO);

    expect(CANHAO_CERCO.recarga).toBe(5);
    expect(atirador.wpnRecarga.canhao_cerco).toBe(6);
  });

  it('a pólvora negra acrescenta 1 de fumaça ao disparo', () => {
    const { manager, battle, atirador } = ctx({ ajudante: true });
    const semExtra = { ...atirador, charName: 'Sem Extra', fumaca: 0 };
    manager._emitirFumaca(battle, atirador, CANHAO_FERRO);
    manager._emitirFumaca(battle, semExtra, { ...CANHAO_FERRO, fumacaExtra: 0 });

    expect(atirador.fumaca).toBe(semExtra.fumaca + 1);
    expect(atirador.fumaca).toBe(fumacaDoDisparo(CANHAO_FERRO, rajadaDaArma(CANHAO_FERRO)) + 1);
  });
});
