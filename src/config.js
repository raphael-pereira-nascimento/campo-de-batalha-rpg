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

// ── Gênero ────────────────────────────────────────────
export const GENDER_OPTIONS = [
  { id: 'masculino', nome: 'Masculino', icon: '♂' },
  { id: 'feminino', nome: 'Feminino', icon: '♀' },
];

// ── Habilidades compradas com pontos excedentes ───────
// Pontos de atributo que sobrarem podem ser gastos aqui.
export const HABILIDADE_CUSTOS = { idioma: 1, especializacao: 2, passiva_extra: 3 };

export const IDIOMAS = [
  { id: 'idioma_anao', nome: 'Língua dos Anões' },
  { id: 'idioma_elfo', nome: 'Língua dos Elfos' },
  { id: 'idioma_orc', nome: 'Língua dos Orcs' },
  { id: 'idioma_draconico', nome: 'Draconiano' },
  { id: 'idioma_antigo', nome: 'Língua Antiga' },
  { id: 'idioma_animais', nome: 'Falar com Animais' },
];

export const ESPECIALIZACOES_ARMAS = [
  { id: 'corpo', categoria: 'corpo', nome: 'Armas Brancas', desc: '+10% de dano corpo a corpo (espadas, machados, adagas...)' },
  { id: 'distancia', categoria: 'distancia', nome: 'Armas à Distância', desc: '+10% de dano com arcos e lanças de longo alcance' },
  { id: 'fogo', categoria: 'fogo', nome: 'Armas de Fogo', desc: '+10% de dano com pistolas, mosquetes, bestas...' },
  { id: 'magica', categoria: 'magica', nome: 'Armas Mágicas', desc: '+10% de dano com cajados e orbes arcanos' },
];

export const PASSIVAS_EXTRAS = [
  { id: 'vigor', nome: 'Vigor', desc: '+5% de HP máximo', custo: 3, efeito: { hpMaxMult: 1.05 } },
  { id: 'fluxo_arcano', nome: 'Fluxo Arcano', desc: '+5% de MP máximo', custo: 3, efeito: { manaMaxMult: 1.05 } },
  { id: 'precisao', nome: 'Precisão', desc: '+3% de chance de crítico', custo: 3, efeito: { critBonus: 0.03 } },
  { id: 'pes_leves', nome: 'Pés Leves', desc: '+5% de chance de esquiva', custo: 3, efeito: { esquivaBonus: 0.05 } },
  { id: 'pele_dura', nome: 'Pele Dura', desc: 'Recebe 5% menos dano físico', custo: 3, efeito: { reducaoDanoFisico: 0.05 } },
  { id: 'meditacao', nome: 'Meditação', desc: '+1 MP recuperado por turno', custo: 3, efeito: { regenMana: 1 } },
];
