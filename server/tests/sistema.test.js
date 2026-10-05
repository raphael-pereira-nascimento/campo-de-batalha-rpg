import { describe, it, expect } from 'vitest';
import {
  MANA_MULT_INT,
  MANA_RECOVERY_DIVISOR,
  manaMaxFrom,
  manaRecuperada,
  pesoAtributo,
  iniciativaDe,
  cargaMaxima,
  ALTITUDES,
  ALCANCE_VERTICAL,
  VOO,
  alcanceVerticalDeArma,
  alcanceVerticalDeMagia,
  foraDoAlcanceVertical,
  contribuicaoDe,
  distribuirXp,
  poolDeXp,
  XP_TETO_PARTICIPACAO,
  XP_MINIMO_PARTICIPACAO,
} from '../src/game/sistema.js';

describe('Mana — fórmula confirmada ((INT Final) × 10)', () => {
  it('mantém o multiplicador e o divisor em um único lugar', () => {
    expect(MANA_MULT_INT).toBe(10);
    expect(MANA_RECOVERY_DIVISOR).toBe(2);
  });

  it('sem bônus: INT x 2', () => {
    expect(manaMaxFrom(10, 10)).toBe(100);
    expect(manaMaxFrom(0, 0)).toBe(0);
    expect(manaMaxFrom(1, 1)).toBe(10);
  });

  it('soma os bônus (BR + BC) uma vez só', () => {
    // 90 INT final × 10 = 900 (exemplo)
    expect(manaMaxFrom(60, 90)).toBe(900);
  });

  it('aceita outros modificadores (gemas, habilidades, itens)', () => {
    expect(manaMaxFrom(10, 13, 5)).toBe((13+5)*10);
  });
});

describe('Mana — recuperação = gasto ÷ 2 (arredondando para cima)', () => {
  it('cobre os exemplos do criador', () => {
    expect([5, 10, 15, 20, 30].map(manaRecuperada)).toEqual([3, 5, 8, 10, 15]);
  });

  it('gasto zero ou negativo não recupera nada', () => {
    expect(manaRecuperada(0)).toBe(0);
    expect(manaRecuperada(-4)).toBe(0);
  });
});

describe('Atributos com pesos diferentes', () => {
  const alta = { forca: 10, inteligencia: 10, resistencia: 10, destreza: 10, reflexos: 10 };
  const baixa = { forca: 1, inteligencia: 1, resistencia: 1, destreza: 1, reflexos: 1 };

  it('REF pesa mais que DEX na esquiva', () => {
    const soRef = pesoAtributo('esquiva', { ...alta, destreza: 1, reflexos: 10 });
    const soDex = pesoAtributo('esquiva', { ...alta, destreza: 10, reflexos: 1 });
    expect(soRef).toBeGreaterThan(soDex);
  });

  it('INT é o atributo da magia', () => {
    // Mesmo nível total de atributos, mas profiles diferentes:
    const magico = { forca: 1, inteligencia: 10, resistencia: 4, destreza: 4, reflexos: 4 };
    const fisico = { forca: 5, inteligencia: 4, resistencia: 4, destreza: 10, reflexos: 8 };
    expect(pesoAtributo('ataqueMagico', magico)).toBeGreaterThan(pesoAtributo('ataqueFisico', magico));
    expect(pesoAtributo('ataqueFisico', fisico)).toBeGreaterThan(pesoAtributo('ataqueMagico', fisico));
  });

  it('iniciativa considera nível e prioriza Reflexos', () => {
    const veloz = iniciativaDe({ ...baixa, reflexos: 10 }, 1);
    const lento = iniciativaDe({ ...baixa, destreza: 10 }, 1);
    expect(veloz).toBeGreaterThan(lento);
    expect(iniciativaDe(alta, 5)).toBeGreaterThan(iniciativaDe(alta, 1));
  });

  it('carga máxima sobe com a Força (regra: FOR define carga e equipamento pesado)', () => {
    expect(cargaMaxima({ ...baixa, forca: 10 }, 1)).toBeGreaterThan(
      cargaMaxima({ ...baixa, forca: 1 }, 1),
    );
    expect(cargaMaxima(alta, 5)).toBeGreaterThan(cargaMaxima(alta, 1));
  });
});

describe('Voo — altitude e alcance vertical', () => {
  it('voar dá altitude, nunca esquiva bônus', () => {
    expect(VOO.esquivaBonus).toBe(0);
  });

  it('altitudes vão de 0 (chão) a 3 (muito alto)', () => {
    expect(ALTITUDES.chao).toBe(0);
    expect(ALTITUDES.alto).toBe(3);
  });

  it('alcance vertical por tipo de arma', () => {
    expect(alcanceVerticalDeArma({ alcance: 'corpo' })).toBe(ALCANCE_VERTICAL.corpo);
    expect(alcanceVerticalDeArma({ alcance: 'medio' })).toBe(ALCANCE_VERTICAL.medio);
    expect(alcanceVerticalDeArma({ alcance: 'longo' })).toBe(ALCANCE_VERTICAL.longo);
    // sem alcances definido, a arma é tratada como longo alcance
    expect(alcanceVerticalDeArma({})).toBe(ALCANCE_VERTICAL.longo);
  });

  it('alcance vertical por magia', () => {
    expect(alcanceVerticalDeMagia({ alcanceVertical: 'terrestre' })).toBe(ALCANCE_VERTICAL.corpo);
    expect(alcanceVerticalDeMagia({ alcanceVertical: 'limitado' })).toBe(ALCANCE_VERTICAL.limitado);
    expect(alcanceVerticalDeMagia({ alcanceVertical: 'longo' })).toBe(ALCANCE_VERTICAL.longo);
    expect(alcanceVerticalDeMagia({})).toBe(ALCANCE_VERTICAL.magico);
    expect(alcanceVerticalDeMagia(null)).toBe(ALCANCE_VERTICAL.magico);
  });

  it('corpo a corpo não alcança voador alto; magia alcança qualquer altura', () => {
    const alto = { voando: true, altitude: ALTITUDES.alto };
    const baixo = { voando: true, altitude: 1 };
    const chao = { voando: false, altitude: 0 };
    expect(foraDoAlcanceVertical(ALCANCE_VERTICAL.corpo, alto)).toBe(true);
    expect(foraDoAlcanceVertical(ALCANCE_VERTICAL.medio, alto)).toBe(true);
    expect(foraDoAlcanceVertical(ALCANCE_VERTICAL.medio, baixo)).toBe(false);
    expect(foraDoAlcanceVertical(ALCANCE_VERTICAL.magico, alto)).toBe(false);
    // alvos no chão estão sempre ao alcance
    expect(foraDoAlcanceVertical(ALCANCE_VERTICAL.corpo, chao)).toBe(false);
  });
});

describe('XP — divisão por participação', () => {
  const heroi = (uid, contribution, alive = true) => ({
    uid,
    alive,
    kills: 0,
    contribuicao: contribution,
  });

  it('quem cause mais dano fica com a maior parte', () => {
    const res = distribuirXp(
      [
        heroi('a', { dano: 900, cura: 0, acertos: 30, acoes: 20, suporte: 0 }),
        heroi('b', { dano: 120, cura: 0, acertos: 6, acoes: 8, suporte: 0 }),
      ],
      1000,
    );
    expect(res[0].xpGained).toBeGreaterThan(res[1].xpGained);
    expect(res.reduce((s, r) => s + r.xpGained, 0)).toBe(1000);
  });

  it('respeita o teto de 60% por jogador', () => {
    const res = distribuirXp(
      [
        heroi('a', { dano: 5000, cura: 0, acertos: 200, acoes: 100, suporte: 0 }),
        heroi('b', { dano: 100, cura: 0, acertos: 5, acoes: 5, suporte: 0 }),
        heroi('c', { dano: 100, cura: 0, acertos: 5, acoes: 5, suporte: 0 }),
      ],
      1000,
    );
    for (const r of res) expect(r.share).toBeLessThanOrEqual(XP_TETO_PARTICIPACAO + 0.001);
  });

  it('piso de 5% para quem contribuiu', () => {
    const res = distribuirXp(
      [
        heroi('a', { dano: 10000, cura: 0, acertos: 400, acoes: 200, suporte: 0 }),
        heroi('b', { dano: 5000, cura: 0, acertos: 200, acoes: 100, suporte: 0 }),
        heroi('c', { dano: 1, cura: 0, acertos: 1, acoes: 1, suporte: 0 }),
      ],
      1000,
    );
    const c = res.find((r) => r.uid === 'c');
    expect(c.share).toBeGreaterThanOrEqual(XP_MINIMO_PARTICIPACAO - 0.001);
    expect(c.xpGained).toBeGreaterThan(0);
  });

  it('a soma do XP entregue é exatamente o pool', () => {
    const res = distribuirXp(
      [
        heroi('a', { dano: 333, cura: 0, acertos: 11, acoes: 9, suporte: 0 }),
        heroi('b', { dano: 97, cura: 55, acertos: 4, acoes: 7, suporte: 3 }),
        heroi('c', { dano: 12, cura: 0, acertos: 1, acoes: 3, suporte: 0 }),
      ],
      777,
    );
    expect(res.reduce((s, r) => s + r.xpGained, 0)).toBe(777);
  });

  it('quem não contribuiu não recebe XP', () => {
    const res = distribuirXp([heroi('a', null), heroi('b', null)], 500);
    expect(res.every((r) => r.xpGained === 0)).toBe(true);
  });

  it('curar e dar suporte também contam como participação', () => {
    const curandeiro = contribuicaoDe(heroi('b', { dano: 0, cura: 400, acertos: 0, acoes: 10, suporte: 8 }));
    const quemSoAtaca = contribuicaoDe(heroi('c', { dano: 200, cura: 0, acertos: 8, acoes: 10, suporte: 0 }));
    expect(curandeiro).toBeGreaterThan(quemSoAtaca);
  });

  it('o pool soma o XP dos monstros e o bônus de chefe', () => {
    expect(poolDeXp({ monstrosDerrotados: [30, 40, 50] })).toBe(150 + 120);
    expect(poolDeXp({ monstrosDerrotados: [30], chefeDerrotado: true })).toBeGreaterThan(150 + 30);
    // durante o Eclipse o XP sobe
    expect(poolDeXp({ monstrosDerrotados: [100], eclipseMult: 1.5 })).toBe(Math.round((150 + 100) * 1.5));
    expect(poolDeXp({ monstrosDerrotados: [], chefeDerrotado: true })).toBeGreaterThan(150);
    expect(poolDeXp({ monstrosDerrotados: [] })).toBe(150);
  });
});
