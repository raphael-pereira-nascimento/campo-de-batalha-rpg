import { describe, it, expect } from 'vitest';
import {
  LIMITE_RESISTENCIA_PCT,
  normalizarChance,
  avaliarCondicao,
  condicaoAtendida,
  somarPercentuais,
  resistenciaDeDano,
  bonusDeDano,
  calcularDanoComPerfil,
  aplicarPenalidadesPercentuais,
  aplicarCorrupcaoEmAtributos,
  danoDeStatus,
  reducaoDeCuraPct,
  chaveStatusEfeito,
} from '../../src/game/combatEffects.js';

describe('combatEffects — normalização de chance', () => {
  it('aceita percentual (0–100) e fração (0–1)', () => {
    expect(normalizarChance(50)).toBe(0.5);
    expect(normalizarChance('25')).toBe(0.25);
    expect(normalizarChance(0.15)).toBe(0.15);
    expect(normalizarChance(1)).toBe(1);
    expect(normalizarChance(0)).toBe(0);
  });

  it('limita a fração ao intervalo 0–1', () => {
    expect(normalizarChance(150)).toBe(1);
    expect(normalizarChance(-10)).toBe(0);
  });

  it('usa o padrão quando o valor não é numérico', () => {
    expect(normalizarChance(undefined)).toBe(1);
    expect(normalizarChance(null, 0.5)).toBe(0.5);
    expect(normalizarChance('abc', 0.3)).toBe(0.3);
  });
});

describe('combatEffects — condições', () => {
  it('trata ausência de condição como sempre ativa', () => {
    expect(avaliarCondicao(null)).toEqual({ atende: true, descritiva: false });
    expect(avaliarCondicao(undefined)).toEqual({ atende: true, descritiva: false });
    expect(avaliarCondicao({ tipo: 'sempre' })).toEqual({ atende: true, descritiva: false });
  });

  it('mantém texto livre como descritivo (nunca aplicado por engano)', () => {
    const resultado = avaliarCondicao('Quando estiver com pouca vida');
    expect(resultado.atende).toBeNull();
    expect(resultado.descritiva).toBe(true);
    expect(resultado.motivo).toContain('descritiva');
    expect(condicaoAtendida('texto livre')).toBe(false);
  });

  it('avalia condições estruturadas por operador', () => {
    expect(avaliarCondicao(
      { tipo: 'hpPct', operador: '<=', valor: 30 },
      { hpPct: 20 },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'hpPct', operador: '<=', valor: 30 },
      { hpPct: 80 },
    ).atende).toBe(false);
    expect(avaliarCondicao(
      { tipo: 'turnos', operador: '>', valor: 3 },
      { turnos: 5 },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'danoRecebido', operador: '>=', valor: 100 },
      { danoRecebido: 120 },
    ).atende).toBe(true);
  });

  it('avalia status, elemento, classe, alvo, atributo e sistema', () => {
    expect(avaliarCondicao(
      { tipo: 'status', status: 'queimadura' },
      { statuses: ['queimadura'] },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'elemento', elemento: 'fogo' },
      { elemento: 'fogo' },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'classe', classe: 'mago' },
      { classes: ['mago'] },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'alvo', alvo: 'golem' },
      { tipoAlvo: 'golem' },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'atributo', atributo: 'força', operador: '>=', valor: 10 },
      { atributos: { forca: 12 } },
    ).atende).toBe(true);
    expect(avaliarCondicao(
      { tipo: 'sistema', sistema: 'podridao' },
      { sistemas: ['podridao'] },
    ).atende).toBe(true);
  });

  it('devolve descritivo para tipo desconhecido', () => {
    const resultado = avaliarCondicao({ tipo: 'condicao-inventada' });
    expect(resultado.atende).toBeNull();
    expect(resultado.descritiva).toBe(true);
    expect(resultado.motivo).toContain('não automatizado');
  });
});

describe('combatEffects — soma de percentuais', () => {
  it('soma cada tipo separadamente', () => {
    const soma = somarPercentuais([
      { tipo: 'bonus', valor: 10, alvo: 'dano de fogo' },
      { tipo: 'bonus', valor: 5, alvo: 'dano de gelo' },
      { tipo: 'resistencia', valor: 30, alvo: 'resistência a dano de fogo' },
      { tipo: 'chance', valor: 20, alvo: 'aplicar queimadura' },
      { tipo: 'custo', valor: -15, alvo: 'custo de mana' },
      { tipo: 'penalidade', valor: -5, alvo: 'reflexo' },
    ]);

    expect(soma.bonus).toBe(15);
    expect(soma.resistencia).toBe(30);
    expect(soma.chance).toBe(20);
    expect(soma.custo).toBe(-15);
    expect(soma.penalidade).toBe(5);
    expect(soma.aplicados).toHaveLength(6);
  });

  it('usa o valor absoluto em redução e penalidade', () => {
    const soma = somarPercentuais([
      { tipo: 'reducao', valor: -20, alvo: 'dano recebido' },
      { tipo: 'penalidade', valor: -5, alvo: 'reflexo' },
    ]);
    expect(soma.reducao).toBe(20);
    expect(soma.penalidade).toBe(5);
  });

  it('limita resistência ao teto e redução a 100%', () => {
    const soma = somarPercentuais([
      { tipo: 'resistencia', valor: 50, alvo: 'resistência a dano de fogo' },
      { tipo: 'resistencia', valor: 50, alvo: 'resistência a dano de gelo' },
      { tipo: 'reducao', valor: 60, alvo: 'dano recebido' },
      { tipo: 'reducao', valor: 60, alvo: 'dano sofrido' },
    ]);
    expect(soma.resistencia).toBe(LIMITE_RESISTENCIA_PCT);
    expect(soma.reducao).toBe(100);
  });

  it('não aplica condição falsa e guarda condição descritiva em ignorados', () => {
    const soma = somarPercentuais([
      {
        tipo: 'bonus',
        valor: 10,
        alvo: 'dano de fogo',
        condicao: { tipo: 'hpPct', operador: '<=', valor: 30 },
      },
      {
        tipo: 'bonus',
        valor: 40,
        alvo: 'dano de gelo',
        condicao: 'Contra inimigos congelados',
      },
    ], { hpPct: 80 });

    expect(soma.bonus).toBe(0);
    expect(soma.aplicados).toHaveLength(0);
    expect(soma.ignorados).toHaveLength(1);
    expect(soma.ignorados[0].alvo).toBe('dano de gelo');
    expect(soma.ignorados[0].motivo).toContain('descritiva');
  });

  it('filtra por alvo quando solicitado', () => {
    const modificadores = [
      { tipo: 'bonus', valor: 10, alvo: 'dano de fogo' },
      { tipo: 'bonus', valor: 5, alvo: 'cura recebida' },
    ];
    expect(somarPercentuais(modificadores, {}, { filtroAlvo: 'dano' }).bonus).toBe(10);
  });
});

describe('combatEffects — bônus e resistência de dano', () => {
  it('bônus de dano ignora dano recebido/sofrido', () => {
    const modificadores = [
      { tipo: 'bonus', valor: 10, alvo: 'dano de fogo' },
      { tipo: 'bonus', valor: 40, alvo: 'dano recebido' },
      { tipo: 'bonus', valor: 30, alvo: 'dano sofrido' },
    ];
    expect(bonusDeDano(modificadores)).toBe(10);
  });

  it('resistência de dano considera apenas alvos de dano/elemento', () => {
    const modificadores = [
      { tipo: 'resistencia', valor: 25, alvo: 'resistência a dano de fogo' },
      { tipo: 'resistencia', valor: 10, alvo: 'resistência a elemento gelo' },
      { tipo: 'resistencia', valor: 50, alvo: 'resistência a peso' },
    ];
    expect(resistenciaDeDano(modificadores)).toBe(35);
  });
});

describe('combatEffects — fórmula de dano', () => {
  it('aplica bônus, arredonda e depois a resistência', () => {
    const resultado = calcularDanoComPerfil({
      danoBase: 100,
      modificadoresAtaque: [
        { tipo: 'bonus', valor: 10, alvo: 'dano de fogo' },
      ],
      modificadoresDefesa: [
        { tipo: 'resistencia', valor: 20, alvo: 'resistência a dano de fogo' },
      ],
    });

    expect(resultado.bonusPct).toBe(10);
    expect(resultado.resistenciaPct).toBe(20);
    // 100 × 1,10 = 110; 110 × 0,80 = 88.
    expect(resultado.dano).toBe(88);
  });

  it('respeita o teto de resistência na fórmula', () => {
    const resultado = calcularDanoComPerfil({
      danoBase: 200,
      modificadoresDefesa: [
        { tipo: 'resistencia', valor: 60, alvo: 'resistência a dano de fogo' },
        { tipo: 'resistencia', valor: 60, alvo: 'resistência a dano de gelo' },
      ],
    });
    expect(resultado.resistenciaPct).toBe(LIMITE_RESISTENCIA_PCT);
    // 200 × 0,25 = 50.
    expect(resultado.dano).toBe(50);
  });

  it('devolve zero para base inválida ou negativa', () => {
    expect(calcularDanoComPerfil({ danoBase: -5 }).dano).toBe(0);
    expect(calcularDanoComPerfil({ danoBase: 'abc' }).dano).toBe(0);
    expect(calcularDanoComPerfil().dano).toBe(0);
  });

  it('nunca deixa o dano ficar negativo', () => {
    const resultado = calcularDanoComPerfil({
      danoBase: 10,
      modificadoresDefesa: [
        { tipo: 'resistencia', valor: 200, alvo: 'resistência a dano de fogo' },
      ],
    });
    expect(resultado.dano).toBeGreaterThanOrEqual(0);
  });
});

describe('combatEffects — penalidades e Corrupção', () => {
  it('aplica penalidades percentuais e em pontos', () => {
    const resultado = aplicarPenalidadesPercentuais(
      { forca: 20, reflexos: 10, inteligencia: 12 },
      [
        { tipo: 'penalidade', valor: 10, unidade: 'percentual', alvo: 'força' },
        { tipo: 'penalidade', valor: 3, unidade: 'pontos', alvo: 'reflexo' },
      ],
    );

    expect(resultado.atributos.forca).toBe(18);
    expect(resultado.atributos.reflexos).toBe(7);
    expect(resultado.atributos.inteligencia).toBe(12);
    expect(resultado.aplicadas).toHaveLength(2);
  });

  it('ignora penalidade condicional não atendida e unidade desconhecida', () => {
    const resultado = aplicarPenalidadesPercentuais(
      { forca: 20 },
      [
        {
          tipo: 'penalidade',
          valor: 10,
          unidade: 'percentual',
          alvo: 'força',
          condicao: { tipo: 'hpPct', operador: '<=', valor: 30 },
        },
        { tipo: 'penalidade', valor: 10, unidade: 'texto', alvo: 'força' },
      ],
      { hpPct: 80 },
    );

    expect(resultado.atributos.forca).toBe(20);
    expect(resultado.aplicadas).toHaveLength(0);
  });

  it('aplica as penalidades oficiais de Corrupção por atributo', () => {
    const resultado = aplicarCorrupcaoEmAtributos(
      { reflexos: 20, inteligencia: 10, forca: 8 },
      { reflexo: 10, inteligencia: 5 },
    );

    expect(resultado.atributos.reflexos).toBe(18);
    expect(resultado.atributos.inteligencia).toBe(9.5);
    expect(resultado.atributos.forca).toBe(8);
    expect(resultado.aplicadas).toHaveLength(2);
  });

  it('não aplica Corrupção em atributo desconhecido', () => {
    const resultado = aplicarCorrupcaoEmAtributos(
      { reflexos: 20 },
      { atributoInexistente: 50 },
    );
    expect(resultado.atributos.reflexos).toBe(20);
    expect(resultado.aplicadas).toHaveLength(0);
  });
});

describe('combatEffects — dano de status', () => {
  it('usa o dano explícito do golpe quando existir', () => {
    expect(danoDeStatus({ dano: 50 })).toBe(50);
    expect(danoDeStatus({ dano: '40' })).toBe(40);
  });

  it('calcula percentual sobre a vida máxima ORIGINAL', () => {
    expect(danoDeStatus(
      { danoPctVidaMaxima: 20 },
      { hpMaxOriginal: 1000, hpMax: 400 },
    )).toBe(200);
    expect(danoDeStatus(
      { percentualDanoVidaMaxima: 10 },
      { hpMax: 500 },
    )).toBe(50);
  });

  it('cai para o percentual quando o dano explícito é zero', () => {
    expect(danoDeStatus(
      { dano: 0, danoPctVidaMaxima: 20 },
      { hpMaxOriginal: 800 },
    )).toBe(160);
  });

  it('devolve zero sem dano ou percentual válido', () => {
    expect(danoDeStatus(null)).toBe(0);
    expect(danoDeStatus({})).toBe(0);
    expect(danoDeStatus({ danoPctVidaMaxima: 'abc' })).toBe(0);
    expect(danoDeStatus({ danoPctVidaMaxima: 20 }, {})).toBe(0);
  });
});

describe('combatEffects — cura e identidade de status', () => {
  it('soma a redução de cura dos status ativos e limita a 100%', () => {
    expect(reducaoDeCuraPct([])).toBe(0);
    expect(reducaoDeCuraPct([{}])).toBe(0);
    expect(reducaoDeCuraPct([{ reducaoCuraPct: 25 }])).toBe(25);
    expect(reducaoDeCuraPct([
      { reducaoPotenciaCuraProtecao: 25 },
      { reducaoCuraPct: 10 },
    ])).toBe(35);
    expect(reducaoDeCuraPct([
      { reducaoCuraPct: 60 },
      { reducaoCuraPct: 60 },
    ])).toBe(100);
  });

  it('gera chave estável para "efeito idêntico não acumula"', () => {
    expect(chaveStatusEfeito({ id: 'podridao', origem: 'Tenebrium' }))
      .toBe('podridao|tenebrium');
    expect(chaveStatusEfeito({ tipo: 'veneno' })).toBe('veneno|');
    expect(chaveStatusEfeito()).toBe('|');
  });
});
