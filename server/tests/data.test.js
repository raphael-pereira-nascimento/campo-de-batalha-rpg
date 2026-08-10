import { describe, it, expect } from 'vitest';
import {
  raceBonusTotal,
  classBonusTotal,
  effectiveAttributes,
  deriveStats,
} from '../src/game/data.js';

const anao = { id: 'anao', bonus: { forca: 1, resistencia: 1 } };
const rockman = { id: 'rockman', bonus: { forca: 1, resistencia: 1 } };
const gigante = { id: 'gigante', bonus: { forca: 2, resistencia: 1, reflexos: -1 } };

describe('raceBonusTotal — penalidade de múltiplas raças', () => {
  it('1 raça mantém o bônus cheio (100%)', () => {
    expect(raceBonusTotal([anao])).toEqual({ forca: 1, resistencia: 1 });
  });

  it('2 raças aplicam 70% com arredondamento', () => {
    expect(raceBonusTotal([anao, rockman])).toEqual({ forca: 1, resistencia: 1 });
  });

  it('3 raças aplicam 55% com arredondamento (inclusive negativos)', () => {
    expect(raceBonusTotal([anao, rockman, gigante])).toEqual({
      forca: 2,
      resistencia: 2,
      reflexos: -1,
    });
  });

  it('1 raça não sofre penalidade', () => {
    expect(raceBonusTotal([gigante])).toEqual({ forca: 2, resistencia: 1, reflexos: -1 });
  });
});

describe('classBonusTotal — soma sem penalidade', () => {
  it('soma os bônus de todas as classes', () => {
    const guerreiro = { id: 'guerreiro', bonus: { forca: 3, resistencia: 2 } };
    const mago = { id: 'mago', bonus: { inteligencia: 3, resistencia: 1, reflexos: 2 } };
    expect(classBonusTotal([guerreiro, mago])).toEqual({
      forca: 3,
      resistencia: 3,
      inteligencia: 3,
      reflexos: 2,
    });
  });
});

describe('effectiveAttributes', () => {
  it('aplica raças múltiplas (penalizadas) + classes + equipamento', () => {
    const attrs = { forca: 5, inteligencia: 3, resistencia: 7, destreza: 3, reflexos: 3 };
    const races = [anao, rockman];
    const classes = [{ id: 'mago', bonus: { inteligencia: 3, resistencia: 1, reflexos: 2 } }];
    const equipment = {
      arma: { id: 'x', bonus: { forca: 2 }, penalidade: {} },
      armadura: null,
    };
    const eff = effectiveAttributes(attrs, equipment, races, classes);
    expect(eff.resistencia).toBe(9); // 7 + round(2*0.7) + 1
    expect(eff.forca).toBe(8); // 5 + round(2*0.7) + 2
    expect(eff.inteligencia).toBe(6); // 3 + 3
  });

  it('malefício sempre reduz o atributo (catálogo negativo e custom positivo)', () => {
    const attrs = { forca: 5, inteligencia: 3, resistencia: 7, destreza: 8, reflexos: 3 };
    expect(effectiveAttributes(attrs, { armadura: { penalidade: { destreza: -2 } } }).destreza).toBe(6);
    expect(effectiveAttributes(attrs, { armadura: { penalidade: { destreza: 2 } } }).destreza).toBe(6);
  });

  it('nunca deixa atributo abaixo de 1', () => {
    const attrs = { forca: 1, inteligencia: 1, resistencia: 1, destreza: 1, reflexos: 1 };
    const eff = effectiveAttributes(attrs, { armadura: { penalidade: { destreza: 5 } } });
    expect(eff.destreza).toBe(1);
  });
});

describe('deriveStats — vida/mana pela classe primária', () => {
  const classes = [
    { id: 'guerreiro', primary: true, hpPerLevel: 12, mpPerLevel: 3, bonus: { resistencia: 2, forca: 3 } },
    { id: 'mago', primary: false, hpPerLevel: 6, mpPerLevel: 10, bonus: { inteligencia: 3 } },
  ];
  const attrs = { forca: 5, inteligencia: 3, resistencia: 4, destreza: 3, reflexos: 3 };

  it('Vida = Resistência x10 + hpPerLevel(primária) x (nível-1)', () => {
    const lvl1 = deriveStats(classes, 1, attrs);
    expect(lvl1.hpMax).toBe(60); // (4 + 2) x 10
    const lvl5 = deriveStats(classes, 5, attrs);
    expect(lvl5.hpMax).toBe(60 + 12 * 4);
  });

  it('Mana = Inteligência x10 + mpPerLevel(primária) x (nível-1)', () => {
    const magoPrimary = classes.map((c) => ({ ...c, primary: c.id === 'mago' }));
    const lvl1 = deriveStats(magoPrimary, 1, attrs);
    expect(lvl1.mpMax).toBe(60); // (3 + 3) x 10
    const lvl5 = deriveStats(magoPrimary, 5, attrs);
    expect(lvl5.mpMax).toBe(60 + 10 * 4);
  });

  it('defesa soma o defesa dos equipamentos', () => {
    const equipment = { armadura: { defesa: 8 }, arma: null };
    expect(deriveStats([], 1, attrs, equipment).defesa).toBe(8);
  });
});
