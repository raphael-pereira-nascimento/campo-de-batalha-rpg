// Regressões da árvore de habilidades (estrutura técnica provisória D-53):
// nenhuma regra oficial nova — só filtro de combate e cache `spells`.
import { describe, it, expect } from 'vitest';
import { golpesDisponiveis as golpesServidor } from '../src/services/skillValidation.js';
import {
  buildCharacterData,
  aplicarLevelUpManual,
  definirNivelManual,
} from '../src/services/characters.js';
import { golpesDisponiveis as golpesOffline } from '../../src/game/skillValidation.js';

const ATTRS = { forca: 8, inteligencia: 4, resistencia: 8, destreza: 5, reflexos: 5 };

describe('golpesDisponiveis — semântica de desbloqueio', () => {
  const golpes = [
    { id: 'legado', nome: 'Legado', nivel: 1 },              // sem campo = legado disponível
    { id: 'futuro', nome: 'Futuro', nivel: 9, desbloqueado: true },
    { id: 'travado', nome: 'Travado', nivel: 1, desbloqueado: false },
    { id: 'nulo', nome: 'Nulo', nivel: 1, desbloqueado: null },
  ];

  it('trata desbloqueado null como bloqueado no servidor e no espelho offline', () => {
    const esperado = ['legado', 'futuro']; // nível 10 já libera "futuro"
    expect(golpesServidor(golpes, 10).map((s) => s.id)).toEqual(esperado);
    expect(golpesOffline(golpes, 10).map((s) => s.id)).toEqual(esperado);
  });

  it('mantém golpes legados (undefined) disponíveis', () => {
    expect(golpesServidor([{ nome: 'Antigo' }], 1)).toHaveLength(1);
    expect(golpesOffline([{ nome: 'Antigo' }], 1)).toHaveLength(1);
  });

  it('respeita o nível da ficha sem inventar pré-requisitos', () => {
    expect(golpesServidor(golpes, 8).map((s) => s.id)).toEqual(['legado']);
    expect(golpesServidor(golpes, 9).map((s) => s.id)).toEqual(['legado', 'futuro']);
  });
});

describe('cache `spells` acompanha a árvore', () => {
  const ficha = () => ({
    id: 'c1',
    level: 2,
    xp: 250,
    attributes: { ...ATTRS },
    classes: [{ id: 'guerreiro', primary: true, levelUp: 'forca' }],
    equipment: {},
    races: [],
    habilidades: [],
    skills: [
      { id: 'livre', nome: 'Livre', nivel: 1, desbloqueado: true },
      { id: 'nivel9', nome: 'Nível 9', nivel: 9, desbloqueado: true },
      { id: 'travado', nome: 'Travado', nivel: 1, desbloqueado: false },
    ],
    spells: ['livre'],
    hp_current: 600,
    mp_current: 40,
  });

  it('cria ficha com spells derivadas dos golpes disponíveis no nível 1', () => {
    const data = buildCharacterData('p1', {
      name: 'Teste',
      classes: [{ id: 'guerreiro' }],
      attributes: ATTRS,
      skills: [
        { nome: 'Base', nivel: 1, desbloqueado: true },
        { nome: 'Alto', nivel: 20, desbloqueado: true },
        { nome: 'Guardado', nivel: 1, desbloqueado: false },
      ],
    });
    expect(data.spells).toContain('Base');
    expect(data.spells).not.toContain('Alto');
    expect(data.spells).not.toContain('Guardado');
  });

  it('golpes de classe já nascem com metadados da árvore', () => {
    const data = buildCharacterData('p1', {
      name: 'Classe',
      classes: [{ id: 'guerreiro' }, { id: 'mago' }],
      attributes: ATTRS,
    });
    const golpe = data.skills.find((s) => s.id === 'Bola de Fogo');
    expect(golpe).toMatchObject({ nivel: 1, desbloqueado: true, elemento: 'fisico' });
    expect(data.spells).toContain('Bola de Fogo');
  });

  it('level up e ajuste manual recalculam spells ao subir e ao descer', () => {
    const subiu = aplicarLevelUpManual({ ...ficha(), level: 8, xp: 900 });
    expect(subiu.character.level).toBe(9);
    expect(subiu.character.spells).toContain('nivel9');
    expect(subiu.character.spells).not.toContain('travado');

    const desceu = definirNivelManual({ ...ficha(), level: 10 }, 2);
    expect(desceu.character.spells).toEqual(['livre']);
  });
});
