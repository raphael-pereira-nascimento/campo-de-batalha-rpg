export const ATTRIBUTES = ['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos'];

export const ATTRIBUTE_NAMES = {
  forca: 'Força',
  inteligencia: 'Inteligência',
  resistencia: 'Resistência',
  destreza: 'Destreza',
  reflexos: 'Reflexos',
};

export const POINTS = 30;
export const MIN = 1;
export const MAX = 10;
export const MAX_WITH_BONUS = 12;

// Penalidade por múltiplas raças (bônus de atributo raciais)
export const RACE_PENALTY = { 1: 1, 2: 0.7, 3: 0.55 };
export const MAX_RACES = 3;
export const MAX_CLASSES = 2;

export const SKILL_TYPES = {
  fisico: 'Físico',
  magia: 'Magia',
  cura: 'Cura',
  buff: 'Buff',
  defesa: 'Defesa',
};

export const CONDITION_TYPES = {
  danoRecebido: 'Levar X de dano',
  hpPct: 'HP abaixo de X%',
  kills: 'Conseguir X abates',
  turnos: 'Após X turnos',
  aliadosCaidos: 'X aliados caídos',
};

export const BONUS_LABELS = {
  forca: 'Força',
  inteligencia: 'Inteligência',
  resistencia: 'Resistência',
  destreza: 'Destreza',
  reflexos: 'Reflexos',
};
