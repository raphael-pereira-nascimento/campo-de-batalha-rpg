import { describe, it, expect } from 'vitest';
import { validateOfflineSkill } from '../../src/game/skillValidation.js';

describe('Registro do Mundo offline — validação de golpes', () => {
  it('aplica os mesmos clamps do servidor', () => {
    const golpe = validateOfflineSkill({ nome: 'Teste', poder: NaN, splash: 0, alvos: 99 });
    expect(golpe).toMatchObject({ poder: 100, splash: 0, alvos: 10 });
  });

  it('aceita alvos oficiais e converte legados', () => {
    expect(validateOfflineSkill({ nome: 'Área', alvo: 'area' }).alvo).toBe('area');
    expect(validateOfflineSkill({ nome: 'Antigo', alvo: 'todos' }).alvo).toBe('area');
  });

  it('preserva e normaliza metadados de status/buff', () => {
    const golpe = validateOfflineSkill({
      nome: 'Grito', tipo: 'buff', afetaAliados: true, buffTipo: 'fisico', duracao: 3,
      status: { tipo: 'regeneracao', turnos: 2, dano: 30 },
    });
    expect(golpe).toMatchObject({
      afetaAliados: true, buffTipo: 'fisico', duracao: 3,
      status: { tipo: 'regeneracao', turnos: 2, dano: 30 },
    });
    expect(validateOfflineSkill({ nome: 'X', status: { tipo: 'nope' } }).status).toBe(null);
  });
});
