import { describe, it, expect } from 'vitest';
import {
  TOOLS,
  TOOL_RARITY,
  getToolById,
  getToolsPorLocal,
  precoEmCents,
  formatCoins,
  formatPreco,
} from '../../src/game/tools.js';

describe('tools.js — catálogo de ferramentas', () => {
  it('catálogo contém as 3 ferramentas de polimento', () => {
    expect(TOOLS).toHaveLength(3);
  });

  it('Kit de Lapidador: 50 prata, 2kg, 1 espaço, 100 usos, Comum', () => {
    const kit = getToolById('kit_lapidador');
    expect(kit.nome).toBe('Kit de Lapidador');
    expect(kit.preco).toEqual({ prata: 50 });
    expect(kit.peso).toBe(2);
    expect(kit.espacos).toBe(1);
    expect(kit.usos).toBe(100);
    expect(kit.raridade).toBe('Comum');
  });

  it('Bancada de Joalheiro: 3 ouro, 15kg, 4 espaços, 50 usos, Incomum', () => {
    const bancada = getToolById('bancada_joalheiro');
    expect(bancada.preco).toEqual({ ouro: 3 });
    expect(bancada.peso).toBe(15);
    expect(bancada.espacos).toBe(4);
    expect(bancada.usos).toBe(50);
    expect(bancada.raridade).toBe('Incomum');
  });

  it('Altar de Aprimoramento: 1 ouropla, 30kg, 8 espaços, 25 usos, Rara', () => {
    const altar = getToolById('altar_aprimoramento');
    expect(altar.preco).toEqual({ ouropla: 1 });
    expect(altar.peso).toBe(30);
    expect(altar.espacos).toBe(8);
    expect(altar.usos).toBe(25);
    expect(altar.raridade).toBe('Rara');
  });

  it('todas as ferramentas têm locais de venda', () => {
    for (const t of TOOLS) {
      expect(Array.isArray(t.locais)).toBe(true);
      expect(t.locais.length).toBeGreaterThan(0);
    }
  });
});

describe('tools.js — conversão de moedas', () => {
  it('precoEmCents converte prata/ouro/ouropla para centavos', () => {
    expect(precoEmCents({ prata: 50 })).toBe(5000); // 50 * 100
    expect(precoEmCents({ ouro: 3 })).toBe(3000); // 3 * 1000
    expect(precoEmCents({ ouropla: 1 })).toBe(10000); // 1 * 10000
  });

  it('formatPreco retorna o texto legível do preço', () => {
    expect(formatPreco({ prata: 50 })).toBe('50 prata');
    expect(formatPreco({ ouro: 3 })).toBe('3 ouro');
    expect(formatPreco({ ouropla: 1 })).toBe('1 ouropla');
  });

  it('formatCoins formata centavos em moedas', () => {
    expect(formatCoins(100)).toContain('1 ⚪');
    expect(formatCoins(3000)).toContain('3 🟡');
    expect(formatCoins(10000)).toContain('1 🟪');
  });
});

describe('tools.js — filtro por local', () => {
  it('getToolsPorLocal filtra pelo local atual', () => {
    const porto = getToolsPorLocal('Porto Ferro');
    expect(porto.map((t) => t.id)).toContain('kit_lapidador');
    expect(porto.map((t) => t.id)).toContain('bancada_joalheiro');
    // Altar existe apenas em Lapidaria Central e Capital Áurea
    expect(porto.map((t) => t.id)).not.toContain('altar_aprimoramento');
  });

  it('cidade sem ferramentas retorna lista vazia', () => {
    expect(getToolsPorLocal('Cidade Fantasma')).toEqual([]);
  });
});
