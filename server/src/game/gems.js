// Catálogo de gemas usado pelo servidor para validação e aplicação de efeitos.
// Copia reducida do catálogo do cliente (src/game/gems.js). Mantenha em sintonia
// apenas os campos relevantes ao combate/socket: estado, efeitos e golem.
//
// estado: 'bruta' → não pode ser socketada nem concede efeitos.
//         'polido' → pode ser socketada e concede efeitos.

export const GEMS = {
  diamante: {
    id: 'diamante',
    nome: 'Diamante',
    raridade: 'rara',
    estado: 'bruta',
    bioma: 'montanhas',
    fusao: [],
    efeitos: {
      arma:      { desc: '+20% dano perfurante', bonus: { forca: 2 } },
      armadura:  { desc: '+20% defesa geral', bonus: { resistencia: 2 } },
      acessorio: { desc: '+10% resistência mágica', bonus: { inteligencia: 1 } },
      golem:     { desc: 'Golem ganha +15% armadura e dano', bonus: { resistencia: 3, forca: 1 } },
    },
  },
  obsidiana: {
    id: 'obsidiana',
    nome: 'Obsidiana',
    raridade: 'epica',
    estado: 'bruta',
    bioma: 'vulcanico',
    fusao: [],
    efeitos: {
      arma:      { desc: '+30% dano cortante', bonus: { forca: 2, destreza: 1 } },
      armadura:  { desc: '+25% resistência a fogo', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Ignora parcialmente defesa leve', bonus: {} },
      golem:     { desc: 'Golem fica +25% resistente ao fogo', bonus: { resistencia: 2 } },
    },
  },
  lapis_lazuli: {
    id: 'lapis_lazuli',
    nome: 'Lápis-Lazúli',
    raridade: 'epica',
    estado: 'polido',
    bioma: 'masmorra',
    fusao: [],
    efeitos: {
      arma:      { desc: '+25% dano mágico e +15% mana', bonus: { inteligencia: 3 } },
      armadura:  { desc: '+30% resistência mágica', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Aumenta mana máxima em 25%', bonus: { inteligencia: 2 } },
      golem:     { desc: 'Golem mágico conjura +1 feitiço', bonus: { inteligencia: 3 } },
    },
  },
  ametista: {
    id: 'ametista',
    nome: 'Ametista',
    raridade: 'rara',
    estado: 'polido',
    bioma: 'masmorra',
    fusao: [],
    efeitos: {
      arma:      { desc: 'Magias psíquicas causam +20% dano', bonus: { inteligencia: 2 } },
      armadura:  { desc: '+25% resistência psíquica', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Melhora concentração mágica', bonus: { inteligencia: 1 } },
      golem:     { desc: 'Golem amplifica magia psíquica', bonus: { inteligencia: 2 } },
    },
  },
  pedra_de_sangue: {
    id: 'pedra_de_sangue',
    nome: 'Pedra de Sangue',
    raridade: 'rara',
    estado: 'polido',
    bioma: 'masmorra',
    fusao: [],
    efeitos: {
      arma:      { desc: 'Ataques drenam pequena quantidade de vida', bonus: { forca: 1 }, status: { tipo: 'sangramento', chance: 0.15 } },
      armadura:  { desc: 'Regenera vida lentamente após receber dano', bonus: {} },
      acessorio: { desc: 'Aumenta resistência a dor em 25%', bonus: { resistencia: 1 } },
      golem:     { desc: 'Golem drena vida dos inimigos', bonus: { forca: 2 } },
    },
  },
};

export const GEM_LIST = Object.values(GEMS);

export function getGemById(id) {
  return GEMS[id] || null;
}

export function gemIsRaw(id) {
  const g = GEMS[id];
  return !!g && g.estado === 'bruta';
}
