import { describe, it, expect } from 'vitest';
import {
  raceBonusTotal,
  classBonusTotal,
  effectiveAttributes,
  deriveStats,
  gemsAttrs,
  POTIONS,
  EQUIPMENT,
  armasDeEquipamento,
  melhorArma,
} from '../src/game/data.js';
import { gemIsRaw } from '../src/game/gems.js';
import { DANO_MULT } from '../src/game/sistema.js';

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

  // Regra confirmada pelo criador: Mana = (Inteligência Final) × 10
  // Não existe termo de nível.
  it('Mana = (Inteligência Final) × 10', () => {
    const magoPrimary = classes.map((c) => ({ ...c, primary: c.id === 'mago' }));
    const lvl1 = deriveStats(magoPrimary, 1, attrs);
    const intFinal = 3 + 3; // base 3 + mago 3
    expect(lvl1.mpMax).toBe(intFinal * 10);
  });

  it('defesa soma os equipamentos na escala do dano (× 10)', () => {
    const equipment = { armadura: { defesa: 8 }, arma: null };
    expect(deriveStats([], 1, attrs, equipment).defesa).toBe(8 * DANO_MULT);
  });

  // Reforma do dano (provisório — ver sistema.js): igual vida/mana, sem dados.
  it('Dano = (FOR Final + danoBase da arma) × 10', () => {
    const equipment = { arma: { danoBase: 7 } };
    const stats = deriveStats(classes, 1, attrs, equipment);
    const forcaFinal = 5 + 3; // base 5 + guerreiro 3
    expect(stats.dano).toBe((forcaFinal + 7) * 10);
  });

  it('Dano sem arma usa o valor das mãos nuas (2)', () => {
    expect(deriveStats(classes, 1, attrs, {}).dano).toBe((5 + 3 + 2) * 10);
  });

  // Poções de HP acompanharam a escala da vida (25/60 → 250/600).
  it('poções de HP na mesma escala da vida (× 10)', () => {
    expect(POTIONS.pocao_cura.cura).toBe(250);
    expect(POTIONS.pocao_cura_grande.cura).toBe(600);
    // Elixires de mana ficam como estão: custos de magia continuam 4–12 MP.
    expect(POTIONS.elixir_mana.mana).toBe(25);
    expect(POTIONS.elixir_mana_grande.mana).toBe(60);
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

describe('arsenal — até 3 armas (perto/distancia/utilitaria)', () => {
  it('todo item do catálogo tem categoria válida', () => {
    for (const it of Object.values(EQUIPMENT.armas)) {
      expect(['perto', 'distancia', 'utilitaria']).toContain(it.categoria);
    }
  });

  it('armas utilitárias têm limite de usos por batalha', () => {
    const utilitarias = Object.values(EQUIPMENT.armas).filter((a) => a.categoria === 'utilitaria');
    expect(utilitarias.length).toBeGreaterThan(0);
    for (const a of utilitarias) expect(a.usosMax).toBeGreaterThan(0);
  });

  it('armasDeEquipamento lê as 3 categorias', () => {
    const equipment = {
      armas: {
        perto: { id: 'espada_longa', danoBase: 7, bonus: { forca: 2 } },
        distancia: { id: 'arco_longo', danoBase: 8, bonus: { destreza: 3 } },
        utilitaria: { id: 'rede_encantada', danoBase: 2, usosMax: 3 },
      },
    };
    const lista = armasDeEquipamento(equipment);
    expect(lista.map((e) => e.slot)).toEqual(['perto', 'distancia', 'utilitaria']);
  });

  it('armasDeEquipamento inclui a arma legada (equipment.arma) sem duplicar', () => {
    const legado = { id: 'espada_curta', danoBase: 4, bonus: { forca: 1 } };
    // Só arma legada:
    expect(armasDeEquipamento({ arma: legado }).map((e) => e.slot)).toEqual(['perto']);
    // Legada duplicada dentro de armas.perto não conta duas vezes:
    const lista = armasDeEquipamento({ arma: legado, armas: { perto: legado } });
    expect(lista).toHaveLength(1);
  });

  it('melhorArma escolhe a de maior dano base', () => {
    const equipment = {
      armas: {
        perto: { id: 'espada_curta', danoBase: 4 },
        distancia: { id: 'rifle_de_caca', danoBase: 9 },
        utilitaria: { id: 'rede_encantada', danoBase: 2 },
      },
    };
    expect(melhorArma(equipment).id).toBe('rifle_de_caca');
    expect(melhorArma({})).toBeNull();
  });

  it('os bônus das 3 armas somam nos atributos efetivos (sem duplicar a legada)', () => {
    const attrs = { forca: 5, inteligencia: 3, resistencia: 4, destreza: 3, reflexos: 3 };
    const perto = { id: 'espada_longa', danoBase: 7, bonus: { forca: 2 } };
    const equipment = {
      arma: perto,
      armas: {
        perto,
        distancia: { id: 'arco_longo', danoBase: 8, bonus: { destreza: 3 } },
        utilitaria: { id: 'rede_encantada', danoBase: 2 },
      },
    };
    const eff = effectiveAttributes(attrs, equipment);
    expect(eff.forca).toBe(7); // 5 + 2 (arma legada contada 1x)
    expect(eff.destreza).toBe(6); // 3 + 3
  });

  it('deriveStats usa a melhor arma para o dano', () => {
    const attrs = { forca: 5, inteligencia: 3, resistencia: 4, destreza: 3, reflexos: 3 };
    const classes = [{ id: 'guerreiro', primary: true, bonus: { forca: 3 } }];
    const equipment = {
      armas: {
        perto: { id: 'espada_curta', danoBase: 4 },
        distancia: { id: 'rifle_de_caca', danoBase: 9 },
      },
    };
    const stats = deriveStats(classes, 1, attrs, equipment);
    expect(stats.dano).toBe((5 + 3 + 9) * 10);
  });
});
