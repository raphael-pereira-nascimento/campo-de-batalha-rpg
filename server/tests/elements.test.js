import { describe, it, expect } from 'vitest';
import { ELEMENTOS } from '../src/game/data.js';
import { validateCustomSkill } from '../src/services/skillValidation.js';
import { validateOfflineSkill } from '../../src/game/skillValidation.js';
import { validateCustomMonster } from '../src/services/customContent.js';
import { BattleManager } from '../src/game/battleManager.js';

const elemMult = (elemento, target) => BattleManager.prototype._elemMult.call({}, elemento, target);

describe('elemento mágico sangue', () => {
  it('está no catálogo canônico de combate', () => {
    expect(ELEMENTOS).toEqual([
      'fisico', 'fogo', 'agua', 'terra', 'ar', 'luz', 'trevas', 'sangue',
    ]);
  });

  it('é aceito pelos validadores de golpe online e offline', () => {
    expect(validateCustomSkill({ nome: 'Golpe Sangrento', elemento: 'sangue' }).elemento).toBe('sangue');
    expect(validateOfflineSkill({ nome: 'Golpe Sangrento', elemento: 'sangue' }).elemento).toBe('sangue');
    expect(validateCustomSkill({ nome: 'Gelo' }).elemento).toBe('fisico');
  });

  it('é aceito como elemento, fraqueza e resistência de monstros customizados', () => {
    const monstro = validateCustomMonster({
      nome: 'Lobo Rubro',
      elemento: 'sangue',
      fraquezas: ['sangue', 'luz', 'raio'],
      resistencias: ['sangue', 'gelo'],
    });
    expect(monstro.elemento).toBe('sangue');
    expect(monstro.fraquezas).toEqual(['sangue', 'luz']);
    expect(monstro.resistencias).toEqual(['sangue']);
  });

  it('segue a regra genérica de fraqueza/resistência no combate', () => {
    expect(elemMult('sangue', { fraquezas: ['sangue'] })).toBe(1.5);
    expect(elemMult('sangue', { resistencias: ['sangue'] })).toBe(0.5);
    expect(elemMult('sangue', {})).toBe(1);
    expect(elemMult('fisico', { fraquezas: ['sangue'] })).toBe(1);
  });
});
