import { describe, it, expect } from 'vitest';
import {
  ECLIPSE_PERIODO,
  FASES_ECLIPSE,
  TIPOS_ECLIPSE,
  diaNoCiclo,
  estadoEclipse,
  buffsEclipseRaca,
  sortearVarianteEclipse,
  aplicarEclipseEmMonstro,
  aplicarEclipseEmChefe,
} from '../src/game/eclipse.js';
import { MONSTERS } from '../src/game/monsters.js';

describe('Eclipse — ciclo de 30 dias (CONFIRMADO)', () => {
  it('o período é 30 dias', () => {
    expect(ECLIPSE_PERIODO).toBe(30);
  });

  it('diaNoCiclo reinta a cada 30 dias', () => {
    expect(diaNoCiclo(1)).toBe(1);
    expect(diaNoCiclo(30)).toBe(30);
    expect(diaNoCiclo(31)).toBe(1);
    expect(diaNoCiclo(60)).toBe(30);
    expect(diaNoCiclo(61)).toBe(1);
  });

  it('fases: normal, sinais, inquietação, eclipse e residual', () => {
    expect(estadoEclipse(10).fase).toBe('normal');
    expect(estadoEclipse(25).fase).toBe('sinais');
    expect(estadoEclipse(28).fase).toBe('inquietacao');
    expect(estadoEclipse(30).fase).toBe('eclipse');
    expect(estadoEclipse(31).fase).toBe('residual');
  });

  it('o Eclipse acontece a cada 30 dias', () => {
    for (const dia of [30, 60, 90, 300]) {
      expect(estadoEclipse(dia).eclipseAtivo).toBe(true);
    }
    for (const dia of [29, 31, 59, 61]) {
      expect(estadoEclipse(dia).eclipseAtivo).toBe(false);
    }
  });

  it('conta os dias que faltam para o Eclipse', () => {
    expect(estadoEclipse(30).diasParaEclipse).toBe(0);
    expect(estadoEclipse(28).diasParaEclipse).toBe(2);
    expect(estadoEclipse(1).diasParaEclipse).toBe(29);
  });

  it('durante o Eclipse monstros, chefes e XP sobem', () => {
    const normal = estadoEclipse(10);
    const eclipse = estadoEclipse(30);
    expect(eclipse.xpMult).toBeGreaterThan(normal.xpMult);
    expect(eclipse.monstroMult).toBeGreaterThan(normal.monstroMult);
    expect(eclipse.chefeMult).toBeGreaterThan(normal.chefeMult);
    expect(eclipse.chefeAcoesExtra).toBeGreaterThan(0);
    expect(eclipse.agressividade).toBeGreaterThan(normal.agressividade);
    expect(eclipse.varianteChance).toBeGreaterThan(0);
  });

  it('os tipos de Eclipse escalam os multiplicadores', () => {
    const comum = estadoEclipse(30, 'comum');
    const maior = estadoEclipse(30, 'maior');
    const raro = estadoEclipse(30, 'raro');
    expect(maior.xpMult).toBeGreaterThan(comum.xpMult);
    expect(raro.xpMult).toBeGreaterThan(maior.xpMult);
    expect(Object.keys(TIPOS_ECLIPSE)).toContain('comum');
    expect(TIPOS_ECLIPSE[comum.tipo].nome).toBe('Eclipse Comum');
  });

  it('informa o ciclo e o período em que estamos', () => {
    const e = estadoEclipse(65);
    expect(e.ciclo).toBe(3);
    expect(e.diaNoCiclo).toBe(5);
    expect(e.periodo).toBe(30);
    expect(FASES_ECLIPSE[e.fase]).toBeTruthy();
  });
});

describe('Eclipse — efeitos em monstros e chefes', () => {
  it('aplicarEclipseEmMonstro escala os atributos', () => {
    const base = MONSTERS.goblin;
    const fora = aplicarEclipseEmMonstro(base, estadoEclipse(10));
    expect(fora.attributes.destreza).toBe(base.attributes.destreza);
    const dentro = aplicarEclipseEmMonstro(base, estadoEclipse(30));
    expect(dentro.attributes.destreza).toBeGreaterThan(base.attributes.destreza);
  });

  it('variante só aparece durante o Eclipse ativo', () => {
    expect(sortearVarianteEclipse(estadoEclipse(10), () => 0)).toBeNull();
    const sorteado = sortearVarianteEclipse(estadoEclipse(30), () => 0);
    expect(sorteado).toBeTruthy();
    expect(sorteado.efeitos).toBeTruthy();
  });

  it('chefe ganha HP e ação extra durante o Eclipse', () => {
    const chefe = { hpMax: 1000, hp: 1000, acoesPorTurno: 2, passiva: 'Teste.' };
    const fora = aplicarEclipseEmChefe(chefe, { estado: estadoEclipse(10), hpBase: 1000 });
    expect(fora.hpMax).toBe(1000);
    expect(fora.acoesPorTurno).toBe(2);
    const dentro = aplicarEclipseEmChefe(chefe, { estado: estadoEclipse(30), hpBase: 1000 });
    expect(dentro.hpMax).toBeGreaterThan(1000);
    expect(dentro.acoesPorTurno).toBeGreaterThan(2);
    expect(dentro.passiva).toContain('Eclipse');
  });
});

describe('Eclipse — buffs de raça', () => {
  it('raças listadas ganham bônus durante o Eclipse', () => {
    const { efeitos, notas } = buffsEclipseRaca([{ id: 'draconiano' }, { id: 'orc' }], estadoEclipse(30));
    expect(efeitos.danoMagicoMult).toBeGreaterThan(0);
    expect(efeitos.danoFisicoMult).toBeGreaterThan(0);
    expect(notas.length).toBe(2);
  });

  it('fora do Eclipse não há buff de raça', () => {
    const { efeitos, notas } = buffsEclipseRaca([{ id: 'draconiano' }, { id: 'orc' }], estadoEclipse(10));
    expect(Object.keys(efeitos).length).toBe(0);
    expect(notas.length).toBe(0);
  });

  it('raça sem buff no Eclipse não gera efeito', () => {
    const { efeitos, notas } = buffsEclipseRaca([{ id: 'humano' }], estadoEclipse(30));
    expect(Object.keys(efeitos).length).toBe(0);
    expect(notas.length).toBe(0);
  });
});
