import { describe, it, expect } from 'vitest';
import {
  ABSORCAO_PCT,
  PE_POR_KG,
  MULT_QUALIDADE_PE,
  LIMITE_GASTO_TURNO,
  CHANCE_DESCARGA_PCT,
  CHANCE_DESCARGA_PERFEITO_PCT,
  TRINCAS_PENALIDADE_PCT,
  CAPACIDADE_GOLEM_PE,
  FRACAO_SECUNDARIO,
  MASSAS_REFERENCIA,
  capacidadePE,
  massaReferencia,
  multiplicadorQualidade,
  chanceDescargaPct,
  estadoInicialPE,
  absorverDanoCinetico,
  danoDeDescarga,
  danoDeLiberacao,
  gastarPE,
  registrarTrinca,
  configVibraniumDoParticipante,
} from '../../src/game/vibranium.js';

describe('Vibranium — constantes aprovadas', () => {
  it('mantém a taxa de absorção e a base de capacidade aprovadas', () => {
    expect(ABSORCAO_PCT).toBe(25);
    expect(PE_POR_KG).toBe(40);
    expect(MULT_QUALIDADE_PE.perfeito).toBe(1.5);
    expect(60).toBe(40 * 1.5); // Perfeito = 60 PE/kg
    expect(LIMITE_GASTO_TURNO).toBe(20);
    expect(CHANCE_DESCARGA_PCT).toBe(25);
    expect(CHANCE_DESCARGA_PERFEITO_PCT).toBe(15);
    expect(TRINCAS_PENALIDADE_PCT).toBe(10);
    expect(CAPACIDADE_GOLEM_PE).toBe(600);
    expect(FRACAO_SECUNDARIO).toBe(0.25);
  });

  it('usa as massas de referência aprovadas', () => {
    expect(massaReferencia('armadura')).toBe(12);
    expect(massaReferencia('armaLamina')).toBe(2);
    expect(massaReferencia('armaImpacto')).toBe(4);
    expect(massaReferencia('armaFogo')).toBe(5);
    expect(massaReferencia('acessorio')).toBe(0.5);
    expect(massaReferencia('equipamentoMagico')).toBe(1.5);
    expect(massaReferencia('golem')).toBeNull();
    // Categorias mágicas usam a massa de equipamento mágico.
    expect(massaReferencia('cajado')).toBe(MASSAS_REFERENCIA.equipamentoMagico);
  });
});

describe('Vibranium — capacidade de PE', () => {
  it('calcula 60 PE/kg em Perfeito por categoria', () => {
    expect(capacidadePE({ categoria: 'armadura' })).toBe(720);
    expect(capacidadePE({ categoria: 'armaLamina' })).toBe(120);
    expect(capacidadePE({ categoria: 'armaImpacto' })).toBe(240);
    expect(capacidadePE({ categoria: 'armaFogo' })).toBe(300);
    expect(capacidadePE({ categoria: 'acessorio' })).toBe(30);
    expect(capacidadePE({ categoria: 'equipamentoMagico' })).toBe(90);
    expect(capacidadePE({ categoria: 'cajado' })).toBe(90);
  });

  it('aplica 25% da capacidade quando o Vibranium é secundário', () => {
    expect(capacidadePE({ categoria: 'armadura', fracaoMaterial: FRACAO_SECUNDARIO })).toBe(180);
    expect(capacidadePE({ categoria: 'armaLamina', fracaoMaterial: FRACAO_SECUNDARIO })).toBe(30);
    expect(capacidadePE({ categoria: 'acessorio', fracaoMaterial: FRACAO_SECUNDARIO })).toBe(7);
  });

  it('usa capacidade fixa no núcleo do golem', () => {
    expect(capacidadePE({ categoria: 'golem' })).toBe(600);
    expect(capacidadePE({ categoria: 'golem', fracaoMaterial: FRACAO_SECUNDARIO })).toBe(150);
  });

  it('só Perfeito tem multiplicador definido; as demais qualidades usam 1', () => {
    expect(multiplicadorQualidade('perfeito')).toBe(1.5);
    expect(multiplicadorQualidade('excepcional')).toBe(1);
    expect(capacidadePE({ categoria: 'armadura', qualidade: 'excepcional' })).toBe(480);
    expect(capacidadePE({ categoria: 'categoriaInexistente' })).toBe(0);
  });
});

describe('Vibranium — absorção cinética', () => {
  it('converte 25% do dano efetivo em PE e abate o dano', () => {
    const r = absorverDanoCinetico({ danoEfetivo: 97, peAtual: 0, peMax: 720 });
    expect(r.peGanhos).toBe(24); // floor(97 × 25%)
    expect(r.danoFinal).toBe(73); // 97 - 24
    expect(r.peAtual).toBe(24);
    expect(r.excedente).toBe(0);
    expect(r.sobrecarga).toBeNull();
  });

  it('limita ao espaço restante e calcula o excedente', () => {
    const r = absorverDanoCinetico({
      danoEfetivo: 97, peAtual: 90, peMax: 100, qualidade: 'perfeito', rolador: () => 1,
    });
    expect(r.peGanhos).toBe(10);
    expect(r.danoFinal).toBe(87);
    expect(r.excedente).toBe(14);
    expect(r.peAtual).toBe(100);
    expect(r.sobrecarga).toMatchObject({ excedente: 14, chancePct: 15, disparou: false });
  });

  it('com a capacidade cheia não absorve: o dano entra integralmente', () => {
    const r = absorverDanoCinetico({
      danoEfetivo: 97, peAtual: 720, peMax: 720, qualidade: 'perfeito', rolador: () => 1,
    });
    expect(r.peGanhos).toBe(0);
    expect(r.danoFinal).toBe(97);
    expect(r.excedente).toBe(24);
    expect(r.sobrecarga).not.toBeNull();
  });

  it('a chance de descarga depende da qualidade', () => {
    expect(chanceDescargaPct('perfeito')).toBe(15);
    expect(chanceDescargaPct('excepcional')).toBe(25);

    const disparaPerfeito = absorverDanoCinetico({
      danoEfetivo: 100, peAtual: 10, peMax: 10, qualidade: 'perfeito', rolador: () => 0.1,
    });
    expect(disparaPerfeito.sobrecarga.disparou).toBe(true);

    const naoDisparaPerfeito = absorverDanoCinetico({
      danoEfetivo: 100, peAtual: 10, peMax: 10, qualidade: 'perfeito', rolador: () => 0.2,
    });
    expect(naoDisparaPerfeito.sobrecarga.disparou).toBe(false);

    const disparaComum = absorverDanoCinetico({
      danoEfetivo: 100, peAtual: 10, peMax: 10, qualidade: 'excepcional', rolador: () => 0.2,
    });
    expect(disparaComum.sobrecarga.disparou).toBe(true);
  });

  it('dano zero não gera PE nem sobrecarga', () => {
    const r = absorverDanoCinetico({ danoEfetivo: 0, peAtual: 0, peMax: 720 });
    expect(r.peGanhos).toBe(0);
    expect(r.danoFinal).toBe(0);
    expect(r.sobrecarga).toBeNull();
  });
});

describe('Vibranium — gasto, descarga e trincas', () => {
  it('respeita o teto de 20 PE por turno', () => {
    const r = gastarPE({ peAtual: 30, custo: 25, gastoNoTurno: 0 });
    expect(r.gasto).toBe(20);
    expect(r.peAtual).toBe(10);
    expect(r.gastoNoTurno).toBe(20);
    expect(r.bloqueado).toBe(true);
  });

  it('não gasta além do estoque nem do limite do turno', () => {
    expect(gastarPE({ peAtual: 5, custo: 10 }).gasto).toBe(5);
    expect(gastarPE({ peAtual: 30, custo: 10, gastoNoTurno: 20 }).gasto).toBe(0);
  });

  it('descarga converte todo o PE em dano; liberação usa 50%', () => {
    expect(danoDeDescarga(42)).toBe(42);
    expect(danoDeDescarga(0)).toBe(0);
    expect(danoDeLiberacao(40)).toBe(20);
    expect(danoDeLiberacao(41, 50)).toBe(20);
  });

  it('trincas: penalidade em 3, destruição em 5', () => {
    const segunda = registrarTrinca(1);
    expect(segunda).toMatchObject({ trincas: 2, destruido: false, penalidadeResistenciaPct: 0 });

    const terceira = registrarTrinca(2);
    expect(terceira).toMatchObject({ trincas: 3, destruido: false, penalidadeResistenciaPct: 10 });

    const quinta = registrarTrinca(4);
    expect(quinta).toMatchObject({ trincas: 5, destruido: true, penalidadeResistenciaPct: 10 });
  });

  it('estado inicial começa zerado com a capacidade da peça', () => {
    expect(estadoInicialPE({ peMax: 720 })).toEqual({ pe: 0, peMax: 720, trincas: 0 });
  });
});

describe('Vibranium — leitura do participante', () => {
  const participante = {
    alive: true,
    equipment: { armadura: { vibranium: { peMax: 720, qualidade: 'perfeito' } } },
  };

  it('lê a configuração apenas da armadura equipada', () => {
    expect(configVibraniumDoParticipante(participante)).toMatchObject({ peMax: 720 });
  });

  it('monstros, mortos e peças sem Vibranium não absorvem', () => {
    expect(configVibraniumDoParticipante({ ...participante, isMonster: true })).toBeNull();
    expect(configVibraniumDoParticipante({ ...participante, alive: false })).toBeNull();
    expect(configVibraniumDoParticipante({ alive: true, equipment: { armadura: {} } })).toBeNull();
    expect(configVibraniumDoParticipante(null)).toBeNull();
  });
});
