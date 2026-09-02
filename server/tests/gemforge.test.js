import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  gemas,
  receitasFusao,
  getGemaById,
  verificarFusao,
  gemaIsBruta,
  NIVEIS_POLIMENTO,
  gemaPolivel,
  polirPedra,
  calcularCustoPolimento,
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

describe('polirPedra — sistema de polimento', () => {
  let mockRandom;

  beforeEach(() => {
    mockRandom = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  it('níveis formam a cadeia bruta → lapidada → polido → perfeita', () => {
    expect(NIVEIS_POLIMENTO.bruta.proximoNivel).toBe('lapidada');
    expect(NIVEIS_POLIMENTO.lapidada.proximoNivel).toBe('polido');
    expect(NIVEIS_POLIMENTO.polido.proximoNivel).toBe('perfeita');
    expect(NIVEIS_POLIMENTO.perfeita.proximoNivel).toBeNull();
    // bônus: polido tem multiplicador 1.0 e perfeita 1.2 (80% → 100% etc.)
    expect(NIVEIS_POLIMENTO.bruta.multiplicadorEfeito).toBe(0.8);
    expect(NIVEIS_POLIMENTO.polido.multiplicadorEfeito).toBe(1.0);
  });

  it('gemaPolivel aceita bruta/lapidada/polido e recusa perfeita/destruida', () => {
    expect(gemaPolivel('bruta')).toBe(true);
    expect(gemaPolivel('lapidada')).toBe(true);
    expect(gemaPolivel('polido')).toBe(true);
    expect(gemaPolivel('perfeita')).toBe(false);
    expect(gemaPolivel('destruida')).toBe(false);
  });

  it('sucesso sobe de nível e debita o custo em ouro', () => {
    mockRandom.mockReturnValue(0); // garante sucesso
    const gema = { id: 'rubi', estado: 'bruta' };
    const res = polirPedra(gema, 500);
    expect(res.ok).toBe(true);
    expect(res.sucesso).toBe(true);
    expect(res.estadoNovo).toBe('lapidada');
    expect(res.custoOuro).toBe(100);
    expect(res.ouroRestante).toBe(400);
    expect(res.multiplicadorNovo).toBe(NIVEIS_POLIMENTO.lapidada.multiplicadorEfeito);
  });

  it('falha degrada: lapidada → bruta', () => {
    mockRandom.mockReturnValue(0.99); // garante falha
    const gema = { id: 'rubi', estado: 'lapidada' };
    const res = polirPedra(gema, 500);
    expect(res.ok).toBe(true);
    expect(res.sucesso).toBe(false);
    expect(res.estadoNovo).toBe('bruta');
  });

  it('falha a partir de bruta destrói a pedra', () => {
    mockRandom.mockReturnValue(0.99);
    const gema = { id: 'rubi', estado: 'bruta' };
    const res = polirPedra(gema, 500);
    expect(res.ok).toBe(true);
    expect(res.sucesso).toBe(false);
    expect(res.estadoNovo).toBe('destruida');
  });

  it('perfeita não pode ser polida', () => {
    const gema = { id: 'rubi', estado: 'perfeita' };
    const res = polirPedra(gema, 9999);
    expect(res.ok).toBe(false);
    expect(res.motivo).toContain('máximo');
  });

  it('ouro insuficiente bloqueia o polimento', () => {
    const gema = { id: 'rubi', estado: 'bruta' };
    const res = polirPedra(gema, 50);
    expect(res.ok).toBe(false);
    expect(res.precisaOuro).toBe(true);
    expect(res.custoOuro).toBe(100);
    // ouro insuficiente não deve sequer alterar o estado
    expect(gema.estado).toBe('bruta');
  });
});

describe('Bônus da profissão Lapidador', () => {
  const lapidador = { profissao: 'Lapidador' };
  let mockRandom;

  beforeEach(() => {
    mockRandom = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  it('calcularCustoPolimento soma +15% e corta 20% da mana para o Lapidador', () => {
    const lapidada = NIVEIS_POLIMENTO.lapidada; // chance 60, mana 40
    const custo = calcularCustoPolimento(lapidada, lapidador);
    expect(custo.chanceSucesso).toBe(75); // 60 + 15
    expect(custo.custoMana).toBe(32); // floor(40 * 0.8)
    expect(custo.custoManaOriginal).toBe(40);
    expect(custo.falhaSegura).toBe(true);
  });

  it('chance fica capada em 100% mesmo com o bônus', () => {
    // inventa um nível base alto para testar o cap
    const alto = { ...NIVEIS_POLIMENTO.lapidada, chanceSucesso: 90, custoMana: 30 };
    const custo = calcularCustoPolimento(alto, lapidador);
    expect(custo.chanceSucesso).toBe(100);
    expect(custo.custoMana).toBe(24); // floor(30 * 0.8)
  });

  it('jogador sem a profissão não recebe os bônus', () => {
    const custo = calcularCustoPolimento(NIVEIS_POLIMENTO.lapidada, { profissao: 'Alquimista' });
    expect(custo.chanceSucesso).toBe(60);
    expect(custo.custoMana).toBe(40);
    expect(custo.falhaSegura).toBe(false);
  });

  it('falha protegida: Lapidador mantém a pedra não-bruta no mesmo estado', () => {
    mockRandom.mockReturnValue(0.99); // falha garantida
    const gema = { id: 'agataDeFogo', estado: 'polido' };
    const res = polirPedra(gema, 1000, lapidador, 200);
    expect(res.ok).toBe(true);
    expect(res.sucesso).toBe(false);
    expect(res.protegido).toBe(true);
    expect(res.estadoNovo).toBe('polido'); // não degrada
    // mana é consumido mesmo na falha protegida
    expect(res.custoMana).toBe(64); // floor(80 * 0.8)
    expect(res.manaRestante).toBe(136);
  });

  it('pedra bruta continua destruída na falha (sem proteção)', () => {
    mockRandom.mockReturnValue(0.99);
    const gema = { id: 'rubi', estado: 'bruta' };
    const res = polirPedra(gema, 1000, lapidador, 200);
    expect(res.ok).toBe(true);
    expect(res.sucesso).toBe(false);
    expect(res.protegido).toBe(false);
    expect(res.estadoNovo).toBe('destruida');
  });

  it('mana insuficiente bloqueia o polimento', () => {
    // Lapidador: bruta custa ouro 100 e mana floor(20*0.8)=16
    const gema = { id: 'rubi', estado: 'bruta' };
    const res = polirPedra(gema, 1000, lapidador, 10);
    expect(res.ok).toBe(false);
    expect(res.precisaMana).toBe(true);
    expect(res.custoMana).toBe(16);
  });
});
