import { describe, it, expect } from 'vitest';
import {
  MANA_MULT_INT,
  MANA_RECOVERY_DIVISOR,
  MANA_RECOVERY_CAP_PCT,
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
  DANO_MULT,
  DANO_COEF_ATAQUE,
  DANO_COEF_MEGA,
  DANO_COEF_MAGICO,
  danoBaseDaArma,
  danoFisicoAtaque,
  danoFisicoGolpe,
  danoMagico,
  curaMagica,
  magnitudeDeStatus,
  dificuldadeDoGolpe,
  DIFICULDADE_MAX,
  MULTI_ALVO_PADRAO,
  MULTI_SPLASH_PADRAO,
  MULTI_AREA_MULT,
  MULTI_CONE_MULT,
  MULTI_DESVIO_LIMIAR,
  MULTI_DESVIO_CHANCE,
  ALVO_TIPOS,
  ALVO_LABEL,
  alvoNormalizado,
  desviouParaAliado,
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

describe('Mana — recuperação = gasto ÷ 2, teto de 10% do MP total', () => {
  it('cobre os exemplos do criador', () => {
    expect([5, 10, 15, 20, 30].map((g) => manaRecuperada(g))).toEqual([3, 5, 8, 10, 15]);
  });

  it('gasto zero ou negativo não recupera nada', () => {
    expect(manaRecuperada(0)).toBe(0);
    expect(manaRecuperada(-4)).toBe(0);
  });

  it('metade do gasto abaixo de 10% do MP total recupera normal', () => {
    // 10% de 100 = 10; metade de 8 = 4 → recupera 4.
    expect(manaRecuperada(8, 100)).toBe(4);
  });

  it('metade do gasto acima de 10% do MP total é limitada ao teto', () => {
    // 10% de 100 = 10; metade de 60 = 30 → limitado a 10.
    expect(manaRecuperada(60, 100)).toBe(10);
  });

  it('sem MP total informado mantém a regra base (gasto ÷ 2)', () => {
    expect(manaRecuperada(60)).toBe(30);
  });

  it('o teto é 10% do MP máximo', () => {
    expect(MANA_RECOVERY_CAP_PCT).toBe(0.1);
    // 10% de 50 = 5; metade de 40 = 20 → limitado a 5.
    expect(manaRecuperada(40, 50)).toBe(5);
  });
});

describe('Dano — fórmula provisória (Atributo Final × 10, sem dados)', () => {
  it('mantém a escala e os coeficientes em um único lugar', () => {
    expect(DANO_MULT).toBe(10); // a mesma escala da vida/mana
    expect(DANO_COEF_ATAQUE).toBe(1.5);
    expect(DANO_COEF_MEGA).toBe(2.2);
    expect(DANO_COEF_MAGICO).toBe(1.4);
  });

  it('ataque básico = (FOR Final + danoBase da arma) × 10', () => {
    expect(danoFisicoAtaque(12, 7)).toBe(190);
    expect(danoFisicoAtaque(11, 2)).toBe(130); // mãos nuas
    expect(danoFisicoAtaque(0, 0)).toBe(0);
  });

  it('golpe de habilidade = FOR Final × poder% × coef × 10', () => {
    expect(danoFisicoGolpe(10, 200)).toBe(300); // ×1,5 padrão
    expect(danoFisicoGolpe(10, 250, 1, DANO_COEF_MEGA)).toBe(550); // mega ×2,2
    expect(danoFisicoGolpe(10, 200, 0.5)).toBe(150); // buffs multiplicam a base
  });

  it('mágica = INT Final × poder% × 1,4 × 10', () => {
    expect(danoMagico(10, 240)).toBe(336);
    expect(danoMagico(10, 100)).toBe(140);
    expect(danoMagico(4, 200, 1.5)).toBe(168); // com buff de 50%
  });

  it('danoBaseDaArma cobre mãos nuas e arma sem danoBase', () => {
    expect(danoBaseDaArma(null)).toBe(2);
    expect(danoBaseDaArma(undefined)).toBe(2);
    expect(danoBaseDaArma({ nome: 'Faca Torta' })).toBe(4);
    expect(danoBaseDaArma({ danoBase: 9 })).toBe(9);
  });

  it('cura = INT Final × poder% × 1,4 × 10 (mesma escala da vida)', () => {
    expect(curaMagica(10, 200)).toBe(280); // feitiço "Cura" (200%)
    expect(curaMagica(10, 120)).toBe(168); // "Cura em Massa" (120%)
    expect(curaMagica(10, 200, 1, DANO_COEF_MEGA)).toBe(440); // cura mega × 2,2
    expect(curaMagica(4, 100)).toBe(56);
  });
});

describe('Dificuldade do golpe no d20 — provisória (rolar-menor)', () => {
  it('golpe comum (100%) não pesa', () => {
    expect(dificuldadeDoGolpe()).toBe(0);
    expect(dificuldadeDoGolpe({ poder: 100 })).toBe(0);
    expect(dificuldadeDoGolpe({ poder: 50 })).toBe(0);
  });

  it('cada +100% de poder soma +2', () => {
    expect(dificuldadeDoGolpe({ poder: 150 })).toBe(1);
    expect(dificuldadeDoGolpe({ poder: 200 })).toBe(2);
    expect(dificuldadeDoGolpe({ poder: 300 })).toBe(4);
  });

  it('status aplicado pesa por turnos + dano/100', () => {
    expect(magnitudeDeStatus(null)).toBe(0);
    expect(magnitudeDeStatus({ turnos: 3, dano: 40 })).toBeCloseTo(3.4);
    expect(dificuldadeDoGolpe({ status: { turnos: 2, dano: 60 } })).toBe(1); // 1,3 → 1
    expect(dificuldadeDoGolpe({ poder: 200, status: { turnos: 2, dano: 60 } })).toBe(3); // 2 + 1,3
  });

  it('respeita o teto de dificuldade', () => {
    expect(dificuldadeDoGolpe({ poder: 900 })).toBe(DIFICULDADE_MAX);
    expect(DIFICULDADE_MAX).toBe(8);
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

describe('Multi-alvo — normalização do alvo (área/cone/explosão)', () => {
  it('padrão é alvo único (dano cheio)', () => {
    const s = alvoNormalizado();
    expect(s.tipo).toBe('unico');
    expect(s.max).toBe(1);
    expect(s.splash).toBe(1);
    expect(s.danoMult).toBe(1);
  });

  it('área atinge todos (max alto) com dano reduzido por alvo', () => {
    const s = alvoNormalizado({ alvo: 'area' });
    expect(s.tipo).toBe('area');
    expect(s.max).toBeGreaterThan(10);
    expect(s.danoMult).toBe(MULTI_AREA_MULT);
    expect(s.splash).toBe(MULTI_AREA_MULT);
  });

  it('cone respeita o nº de alvos (padrão 3, faixa 2..10) e reduz o dano por alvo', () => {
    expect(alvoNormalizado({ alvo: 'cone' }).max).toBe(MULTI_ALVO_PADRAO);
    expect(alvoNormalizado({ alvo: 'cone', alvos: 5 }).max).toBe(5);
    expect(alvoNormalizado({ alvo: 'cone', alvos: 1 }).max).toBe(2);
    expect(alvoNormalizado({ alvo: 'cone', alvos: 99 }).max).toBe(10);
    const c = alvoNormalizado({ alvo: 'cone' });
    expect(c.danoMult).toBe(MULTI_CONE_MULT);
    expect(c.splash).toBe(MULTI_CONE_MULT);
  });

  it('explosão: principal cheio e vizinhos com o splash (padrão 50%)', () => {
    const s = alvoNormalizado({ alvo: 'explosao' });
    expect(s.danoMult).toBe(1);
    expect(s.splash).toBe(MULTI_SPLASH_PADRAO);
    expect(alvoNormalizado({ alvo: 'explosao', splash: 0.25 }).splash).toBe(0.25);
    // valores inválidos caem no padrão / teto
    expect(alvoNormalizado({ alvo: 'explosao', splash: 0 }).splash).toBe(MULTI_SPLASH_PADRAO);
    expect(alvoNormalizado({ alvo: 'explosao', splash: 3 }).splash).toBe(1);
  });

  it('permite ajustar o dano por alvo do golpe (danoMult)', () => {
    expect(alvoNormalizado({ alvo: 'area', danoMult: 0.8 }).danoMult).toBe(0.8);
    expect(alvoNormalizado({ alvo: 'cone', danoMult: 3 }).danoMult).toBe(1);
    expect(alvoNormalizado({ alvo: 'area', danoMult: 0 }).danoMult).toBe(MULTI_AREA_MULT);
  });

  it('compatibilidade: `todos` num golpe ofensivo passa a significar área', () => {
    expect(alvoNormalizado({ todos: true, tipo: 'magia' }).tipo).toBe('area');
    expect(alvoNormalizado({ todos: true, tipo: 'fisico' }).tipo).toBe('area');
    expect(alvoNormalizado({ todos: true, tipo: 'ataque' }).tipo).toBe('area');
  });

  it('`todos` na cura NÃO vira área de dano', () => {
    expect(alvoNormalizado({ todos: true, tipo: 'cura' }).tipo).toBe('unico');
  });

  it('alvo explícito tem prioridade sobre `todos`', () => {
    expect(alvoNormalizado({ alvo: 'cone', todos: true, tipo: 'magia' }).tipo).toBe('cone');
  });

  it('expõe rótulos para a interface', () => {
    for (const k of ['unico', 'area', 'cone', 'explosao']) {
      expect(ALVO_TIPOS[k]).toBeTruthy();
      expect(ALVO_LABEL[k]).toBeTruthy();
    }
  });
});

describe('Multi-alvo — desvio para aliados (fogo amigo)', () => {
  it('só dispara na falha crítica (d20 = 1), nunca em rolagens normais', () => {
    expect(MULTI_DESVIO_LIMIAR).toBe(1);
    expect(desviouParaAliado(2, 0.1)).toBe(false);
    expect(desviouParaAliado(5, 0.1)).toBe(false);
    expect(desviouParaAliado(20, 0.1)).toBe(false);
  });

  it('falha crítica + azar desvia para os aliados', () => {
    expect(desviouParaAliado(1, 0.1)).toBe(true);
    expect(desviouParaAliado(MULTI_DESVIO_LIMIAR, MULTI_DESVIO_CHANCE - 0.01)).toBe(true);
  });

  it('falha crítica mas sem "azar" não desvia', () => {
    expect(desviouParaAliado(1, 0.9)).toBe(false);
    // exatamente na chance: precisa ser estritamente menor
    expect(desviouParaAliado(1, MULTI_DESVIO_CHANCE)).toBe(false);
  });
});
