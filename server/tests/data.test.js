import { describe, it, expect } from 'vitest';
import {
  raceBonusTotal,
  classBonusTotal,
  effectiveAttributes,
  deriveStats,
  gemsAttrs,
} from '../src/game/data.js';
import { gemIsRaw } from '../src/game/gems.js';

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

  it('Vida = 500 + Resistência x10', () => {
    const lvl1 = deriveStats(classes, 1, attrs);
    expect(lvl1.hpMax).toBe(500 + 60); // (4 + 2) x 10 = 60
    const lvl5 = deriveStats(classes, 5, attrs);
    expect(lvl5.hpMax).toBe(500 + 60);
  });

  // Regra confirmada pelo criador: Mana = INT x 2 + BR + BC + outros.
  // Não existe termo de nível: o crescimento vem da própria INT (a cada
  // nível o atributo `levelUp` da classe primária sobe +1).
  it('Mana = INT x 2 + bônus de Resistência e Destreza (sem termo de nível)', () => {
    const magoPrimary = classes.map((c) => ({ ...c, primary: c.id === 'mago' }));
    const lvl1 = deriveStats(magoPrimary, 1, attrs);
    expect(lvl1.mpMax).toBe(9); // (3 x 2) + 2 (BR) + 1 (BC) = 9
    const lvl5 = deriveStats(magoPrimary, 5, attrs);
    expect(lvl5.mpMax).toBe(9); // nível não entra na conta
  });

  it('Mana dobra a INT base e soma os bônus uma vez só', () => {
    // ATTRS aqui: forca 5, inteligencia 10, resistencia 4, destreza 3, reflexos 3.
    //classes = [guerreiro (sem INT), mago (+3 de INT)]
    const comInteligencia = deriveStats(classes, 1, { ...attrs, inteligencia: 10 });
    expect(comInteligencia.mpMax).toBe(23); // (10 x 2) + 3 de bônus de classe
    const semBônus = deriveStats([], 1, { ...attrs, inteligencia: 10 });
    expect(semBônus.mpMax).toBe(20); // 10 x 2
  });

  it('defesa soma o defesa dos equipamentos', () => {
    const equipment = { armadura: { defesa: 8 }, arma: null };
    expect(deriveStats([], 1, attrs, equipment).defesa).toBe(8);
  });
});

describe('gemas — estado bruto/polido e efeitos por slot', () => {
  it('gemIsRaw retorna true apenas para gemas brutas', () => {
    expect(gemIsRaw('diamante')).toBe(true); // bruta no catálogo
    expect(gemIsRaw('obsidiana')).toBe(true); // bruta no catálogo
    expect(gemIsRaw('lapis_lazuli')).toBe(false);
    expect(gemIsRaw('ametista')).toBe(false);
    expect(gemIsRaw('pedra_de_sangue')).toBe(false);
    expect(gemIsRaw('gem_inexistente')).toBe(false);
  });

  it('gemsAttrs soma bônus das gemas polidas por slot e ignora gemas brutas', () => {
    const equipment = {
      arma: { socketedGems: ['ametista', 'diamante'] }, // ametista polida (int 2), diamante bruta (ignora)
      armadura: { socketedGems: ['lapis_lazuli'] },      // polida (int 2)
    };
    expect(gemsAttrs(equipment)).toEqual({ inteligencia: 4 });
  });

  it('effectiveAttributes aplica efeitos de gemas socketadas', () => {
    const attrs = { forca: 5, inteligencia: 3, resistencia: 4, destreza: 3, reflexos: 3 };
    const equipment = {
      arma: { socketedGems: ['ametista'] },      // +2 inteligencia
      armadura: { socketedGems: ['lapis_lazuli'] }, // +2 inteligencia
    };
    const eff = effectiveAttributes(attrs, equipment);
    expect(eff.inteligencia).toBe(7); // 3 + 2 + 2
  });
});
