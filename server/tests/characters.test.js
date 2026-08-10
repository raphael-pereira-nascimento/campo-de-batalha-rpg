import { describe, it, expect } from 'vitest';
import {
  normalizeRaceDef,
  normalizeClassDef,
  normalizeSkill,
  normalizeMegaSkill,
  buildCharacterData,
  validateAttributes,
} from '../src/services/characters.js';

const ATTRS = { forca: 8, inteligencia: 4, resistencia: 8, destreza: 5, reflexos: 5 }; // soma 30

describe('normalizeRaceDef', () => {
  it('usa o preset quando só o id é passado', () => {
    const r = normalizeRaceDef({ id: 'anao' });
    expect(r.id).toBe('anao');
    expect(r.nome).toBe('Anão');
    expect(r.bonus.resistencia).toBe(1);
    expect(r.passiva).toContain('Robustez');
  });

  it('normaliza raça customizada com bônus sanitizado (clamp -3..3)', () => {
    const r = normalizeRaceDef({
      id: 'elfo_sombrio',
      nome: 'Elfo Sombrio',
      bonus: { inteligencia: 9, destreza: 1 },
      passiva: 'vê no escuro',
    });
    expect(r.bonus.inteligencia).toBe(3);
    expect(r.bonus.destreza).toBe(1);
  });

  it('raça com "escolha" guarda a choice', () => {
    const r = normalizeRaceDef({ id: 'humano', choice: 'destreza' });
    expect(r.choice).toBe('destreza');
  });
});

describe('normalizeClassDef', () => {
  it('preset mantém os atributos mecânicos', () => {
    const c = normalizeClassDef({ id: 'mago' });
    expect(c.hpPerLevel).toBe(6);
    expect(c.mpPerLevel).toBe(10);
    expect(c.archetype).toBe('mago');
  });

  it('permite override de archetype e primary', () => {
    const c = normalizeClassDef({
      id: 'barbaro',
      nome: 'Bárbaro',
      archetype: 'guerreiro',
      primary: true,
      bonus: { forca: 2 },
    });
    expect(c.archetype).toBe('guerreiro');
    expect(c.primary).toBe(true);
  });
});

describe('normalizeSkill / normalizeMegaSkill', () => {
  it('normaliza golpe com clamps', () => {
    const s = normalizeSkill({ nome: 'Corte', tipo: 'fisico', poder: 5000, custo: 200 });
    expect(s.poder).toBe(1000);
    expect(s.custo).toBe(99);
    expect(s.tipo).toBe('fisico');
  });

  it('rejeita condição inválida na ultimate', () => {
    const s = normalizeMegaSkill({
      nome: 'Fúria',
      tipo: 'fisico',
      poder: 250,
      condicao: { tipo: 'inexistente', valor: 5 },
    });
    expect(s.condicao).toBeNull();
  });

  it('aceita condição e modo válidos', () => {
    const s = normalizeMegaSkill({
      nome: 'Fúria',
      tipo: 'fisico',
      poder: 250,
      condicao: { tipo: 'turnos', valor: 2 },
      modo: { turnos: 3, danoMultPct: 50 },
    });
    expect(s.condicao).toEqual({ tipo: 'turnos', valor: 2 });
    expect(s.modo).toEqual({ turnos: 3, danoMultPct: 50 });
  });
});

describe('validateAttributes', () => {
  it('aceita soma exata de 30 pontos', () => {
    expect(validateAttributes(ATTRS)).toEqual(ATTRS);
  });

  it('lança erro para atributo inválido', () => {
    expect(() => validateAttributes({ ...ATTRS, forca: 'x' })).toThrow('inválido');
  });

  it('lança erro se a soma não for 30', () => {
    expect(() => validateAttributes({ ...ATTRS, forca: 1 })).toThrow('soma dos atributos');
  });

  it('lança erro se um atributo sair do intervalo 1..10', () => {
    expect(() => validateAttributes({ ...ATTRS, forca: 12, reflexos: 1 })).toThrow('entre');
  });
});

describe('buildCharacterData — ficha livre', () => {
  it('aceita 2 raças com penalidade de 70%', () => {
    const data = buildCharacterData('p1', {
      name: 'DoisSangues',
      classes: [{ id: 'mago' }],
      races: [{ id: 'anao' }, { id: 'rockman' }],
      attributes: { forca: 5, inteligencia: 3, resistencia: 7, destreza: 7, reflexos: 8 },
    });
    expect(data.races.length).toBe(2);
    // res: 7 + round(2*0.7)=1 + mago(+1) = 9
    expect(data.hp_max).toBe(90);
  });

  it('aceita 3 raças com penalidade de 55%', () => {
    const data = buildCharacterData('p1', {
      name: 'TresSangues',
      classes: [{ id: 'mago' }],
      races: [{ id: 'anao' }, { id: 'rockman' }, { id: 'gigante' }],
      attributes: { forca: 5, inteligencia: 3, resistencia: 7, destreza: 7, reflexos: 8 },
    });
    expect(data.races.length).toBe(3);
    // res: 7 + round(3*0.55)=2 + mago(+1) = 10
    expect(data.hp_max).toBe(100);
  });

  it('rejeita 4 raças', () => {
    expect(() =>
      buildCharacterData('p1', {
        name: 'QuatroSangues',
        classes: [{ id: 'mago' }],
        races: [{ id: 'anao' }, { id: 'rockman' }, { id: 'gigante' }, { id: 'orc' }],
        attributes: ATTRS,
      }),
    ).toThrow('Máximo de 3 raças');
  });

  it('aceita 2 classes e marca a primeira como primária', () => {
    const data = buildCharacterData('p1', {
      name: 'Hibrido',
      classes: [{ id: 'guerreiro' }, { id: 'mago' }],
      attributes: ATTRS,
    });
    expect(data.classes.length).toBe(2);
    expect(data.classes[0].primary).toBe(true);
    expect(data.class).toBe('guerreiro');
    // res: 8 + guerreiro(2) + mago(1) = 11
    expect(data.hp_max).toBe(110);
    // int: 4 + mago(3) = 7
    expect(data.mp_max).toBe(70);
  });

  it('junta os golpes das duas classes', () => {
    const data = buildCharacterData('p1', {
      name: 'Hibrido',
      classes: [{ id: 'guerreiro' }, { id: 'mago' }],
      attributes: ATTRS,
    });
    const ids = data.skills.map((s) => s.id);
    expect(ids).toContain('Golpe Sangrento');
    expect(ids).toContain('Bola de Fogo');
  });

  it('rejeita 3 classes', () => {
    expect(() =>
      buildCharacterData('p1', {
        name: 'TriClasse',
        classes: [{ id: 'guerreiro' }, { id: 'mago' }, { id: 'clerigo' }],
        attributes: ATTRS,
      }),
    ).toThrow('Máximo de 2 classes');
  });

  it('guarda passiva própria e golpe customizado', () => {
    const data = buildCharacterData('p1', {
      name: 'MegaHeroi',
      classes: [{ id: 'guerreiro' }],
      passiva: 'Passiva propria de teste',
      skills: [{ nome: 'Corte Sombrio', tipo: 'fisico', poder: 140, custo: 10, cooldown: 1 }],
      attributes: ATTRS,
    });
    expect(data.passiva).toBe('Passiva propria de teste');
    expect(data.skills.some((s) => s.nome === 'Corte Sombrio')).toBe(true);
  });

  it('guarda ultimate e golpe especial', () => {
    const data = buildCharacterData('p1', {
      name: 'MegaHeroi',
      classes: [{ id: 'guerreiro' }],
      ultimate: {
        nome: 'Fúria Ancestral',
        tipo: 'fisico',
        poder: 250,
        condicao: { tipo: 'turnos', valor: 2 },
        modo: { turnos: 3, danoMultPct: 50 },
      },
      especial: { nome: 'Meteoro', tipo: 'magia', poder: 300, condicao: { tipo: 'turnos', valor: 3 } },
      attributes: ATTRS,
    });
    expect(data.ultimate.nome).toBe('Fúria Ancestral');
    expect(data.ultimate.modo.turnos).toBe(3);
    expect(data.especial.nome).toBe('Meteoro');
  });
});
