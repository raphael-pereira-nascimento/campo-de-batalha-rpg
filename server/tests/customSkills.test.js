import { describe, it, expect } from 'vitest';
import {
  validateCustomSkill,
  decorateCustomSkill,
  dedupeSkillIds,
  normalizarMetadadosGolpe,
  golpesDisponiveis,
} from '../src/services/skillValidation.js';

describe('Registro do Mundo — validação de golpes', () => {
  it('usa poder 100 e permite splash 0 quando omitidos/inválidos', () => {
    const golpe = validateCustomSkill({ nome: 'Golpe', poder: NaN, splash: 0, alvos: NaN });
    expect(golpe.poder).toBe(100);
    expect(golpe.splash).toBe(0);
    expect(golpe.alvos).toBe(3);
  });

  it('aceita os alvos oficiais e converte o vocabulário legado', () => {
    expect(validateCustomSkill({ nome: 'Área', alvo: 'area' }).alvo).toBe('area');
    expect(validateCustomSkill({ nome: 'Cone', alvo: 'cone' }).alvo).toBe('cone');
    expect(validateCustomSkill({ nome: 'Explosão', alvo: 'explosao' }).alvo).toBe('explosao');
    expect(validateCustomSkill({ nome: 'Perto', alvo: 'proximo' }).alvo).toBe('unico');
    expect(validateCustomSkill({ nome: 'Múltiplo', alvo: 'multi' }).alvo).toBe('cone');
    expect(validateCustomSkill({ nome: 'Todos', alvo: 'todos' }).alvo).toBe('area');
  });

  it('força alvo único em buff/defesa', () => {
    const golpe = validateCustomSkill({ nome: 'Grito', tipo: 'buff', alvo: 'area' });
    expect(golpe.alvo).toBe('unico');
  });

  it('normaliza status, duração e metadados de buff', () => {
    const golpe = validateCustomSkill({
      nome: 'Grito de Guerra',
      tipo: 'buff',
      afetaAliados: true,
      buffTipo: 'fisico',
      duracao: 3,
      status: { tipo: 'queimadura', turnos: 2, dano: 50 },
    });
    expect(golpe).toMatchObject({
      afeta_aliados: true,
      buff_tipo: 'fisico',
      duracao: 3,
      status: { tipo: 'queimadura', turnos: 2, dano: 50 },
    });

    const cura = validateCustomSkill({ nome: 'Cura', tipo: 'cura', todos: true, status: 'regeneracao' });
    expect(cura.todos).toBe(true);
    expect(cura.status).toMatchObject({ tipo: 'regeneracao', turnos: 2 });
    expect(cura.duracao).toBe(null);
  });

  it('descarta status desconhecido e limita valores', () => {
    const golpe = validateCustomSkill({
      nome: 'Teste',
      status: { tipo: 'inexistente', turnos: 99, dano: -5 },
      poder: 5000,
      custo: -1,
      cooldown: 99,
    });
    expect(golpe.status).toBe(null);
    expect(golpe).toMatchObject({ poder: 1000, custo: 0, cooldown: 20 });
  });

  it('decora a linha do banco com status, números e campos em camelCase', () => {
    const row = {
      id: 'abc',
      status: '{"tipo":"sangramento","turnos":2,"dano":30}',
      splash: '0.5',
      alvos: 3,
      afeta_aliados: true,
      buff_tipo: 'magico',
      duracao: 4,
    };
    expect(decorateCustomSkill(row)).toMatchObject({
      status: { tipo: 'sangramento', turnos: 2, dano: 30 },
      splash: 0.5,
      alvos: 3,
      afetaAliados: true,
      buffTipo: 'magico',
      duracao: 4,
      elemento: 'fisico',
      nivel: 1,
      desbloqueado: true,
    });
    expect(decorateCustomSkill(null)).toBe(null);
  });

  it('normaliza elemento, nível e desbloqueio da árvore (compatível com golpes antigos)', () => {
    expect(validateCustomSkill({
      nome: 'Bola de Fogo', elemento: 'fogo', nivel: 12, desbloqueado: false, custo: 8,
    })).toMatchObject({ elemento: 'fogo', nivel: 12, desbloqueado: false, custo: 8 });
    // Golpes salvos antes da árvore: físicos, nível 1 e já desbloqueados.
    expect(validateCustomSkill({ nome: 'Antigo' })).toMatchObject({
      elemento: 'fisico', nivel: 1, desbloqueado: true,
    });
    expect(normalizarMetadadosGolpe({ elemento: 'gelo', nivel: 99, desbloqueado: 0 })).toMatchObject({
      elemento: 'fisico', nivel: 30, desbloqueado: false,
    });
  });

  it('só disponibiliza golpes desbloqueados e do nível já alcançado', () => {
    const golpes = [
      { nome: 'Livre', nivel: 1 },
      { nome: 'Futuro', nivel: 10 },
      { nome: 'Bloqueado', nivel: 1, desbloqueado: false },
      { nome: 'Legado' },
    ];
    expect(golpesDisponiveis(golpes, 1).map((s) => s.nome)).toEqual(['Livre', 'Legado']);
    expect(golpesDisponiveis(golpes, 10).map((s) => s.nome)).toEqual(['Livre', 'Futuro', 'Legado']);
  });

  it('evita ids repetidos entre golpes de classe e golpes personalizados', () => {
    const lista = dedupeSkillIds([
      { id: 'Cura em Massa', nome: 'Cura em Massa' },
      { id: 'Cura em Massa', nome: 'Cura em Massa (custom)' },
      { id: 'Cura em Massa', nome: 'Cura em Massa (outro)' },
    ]);
    expect(lista.map((s) => s.id)).toEqual(['Cura em Massa', 'Cura em Massa_2', 'Cura em Massa_3']);
    expect(lista[1].nome).toBe('Cura em Massa (custom)');
  });
});
