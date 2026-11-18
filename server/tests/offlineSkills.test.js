import { describe, it, expect } from 'vitest';
import {
  validateOfflineSkill,
  normalizarMetadadosGolpe,
  golpesDisponiveis,
} from '../../src/game/skillValidation.js';

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

  it('espelha os metadados da árvore e o filtro de golpes do servidor', () => {
    const golpe = validateOfflineSkill({
      nome: 'Raio', elemento: 'ar', nivel: 8, desbloqueado: false, custo: 6,
    });
    expect(golpe).toMatchObject({ elemento: 'ar', nivel: 8, desbloqueado: false, custo: 6 });
    expect(normalizarMetadadosGolpe({ elemento: 'gelo', nivel: 99 })).toMatchObject({
      elemento: 'fisico', nivel: 30, desbloqueado: true,
    });
    const golpes = [{ nome: 'Livre', nivel: 1 }, { nome: 'Futuro', nivel: 9 }, { nome: 'Travado', desbloqueado: false }];
    expect(golpesDisponiveis(golpes, 1).map((s) => s.nome)).toEqual(['Livre']);
  });
});
