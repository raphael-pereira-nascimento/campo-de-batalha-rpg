import { describe, it, expect } from 'vitest';
import {
  gemas,
  receitasFusao,
  getGemaById,
  verificarFusao,
  gemaIsBruta,
} from '../../src/game/gems.js';

const obsidiana = getGemaById('obsidiana');
const agataDeFogo = getGemaById('agataDeFogo');
const rubi = getGemaById('rubi');
const pedraDeSangue = getGemaById('pedraDeSangue');

describe('GemForge — dados de fusão', () => {
  it('catálogo contém 4 pedras e 2 receitas', () => {
    expect(gemas).toHaveLength(4);
    expect(receitasFusao).toHaveLength(2);
  });

  it('gemaIsBruta detecta apenas pedras brutas', () => {
    expect(gemaIsBruta('rubi')).toBe(true);
    expect(gemaIsBruta('obsidiana')).toBe(false);
    expect(gemaIsBruta('pedraDeSangue')).toBe(false);
    expect(gemaIsBruta('nao_existe')).toBe(false);
  });
});

describe('verificarFusao — Regra de Ouro', () => {
  it('bloqueia fusão se Gema A for bruta', () => {
    const res = verificarFusao(rubi, obsidiana); // rubi é bruta
    expect(res.ok).toBe(false);
    expect(res.bruta).toBe(true);
    expect(res.motivo).toContain('Pedras brutas precisam ser polidas');
  });

  it('bloqueia fusão se Gema B for bruta', () => {
    const res = verificarFusao(obsidiana, rubi);
    expect(res.ok).toBe(false);
    expect(res.bruta).toBe(true);
  });

  it('não permite fundir uma gema consigo mesma', () => {
    const res = verificarFusao(obsidiana, obsidiana);
    expect(res.ok).toBe(false);
    expect(res.bruta).toBeUndefined();
    expect(res.motivo).toContain('ela mesma');
  });
});

describe('verificarFusao — Compatibilidade e Receitas', () => {
  it('fusão estável Obsidiana + Ágata de Fogo → Obsidiana Ardente', () => {
    const res = verificarFusao(obsidiana, agataDeFogo);
    expect(res.ok).toBe(true);
    expect(res.resultado.nome).toBe('Obsidiana Ardente');
    expect(res.resultado.raridade).toBe('Épica');
    expect(res.resultado.custoManaTotal).toBe(50);
  });

  it('ordem dos ingredientes é indiferente', () => {
    const a = verificarFusao(obsidiana, agataDeFogo);
    const b = verificarFusao(agataDeFogo, obsidiana);
    expect(a.resultado.id).toBe(b.resultado.id);
  });

  it('Rubi + Pedra de Sangue: bloco bruta prevalece (rubi está bruta no catálogo)', () => {
    // No catálogo fornecido o rubi está 'bruta', logo a Regra de Ouro bloqueia
    // antes de alcançar a receita rubiAbissal.
    const res = verificarFusao(rubi, pedraDeSangue);
    expect(res.ok).toBe(false);
    expect(res.bruta).toBe(true);
  });

  it('combinação incompatível → Fusão Instável', () => {
    const res = verificarFusao(obsidiana, pedraDeSangue);
    expect(res.ok).toBe(false);
    expect(res.instavel).toBe(true);
    expect(res.motivo).toContain('Fusão Instável');
    expect(res.motivo).toContain('50% de chance de destruir');
  });
});
