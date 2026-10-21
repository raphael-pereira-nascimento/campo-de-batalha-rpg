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

// ── Sorteio por peso (dropWeight) ──────────────────────────────────────────

export function getGemsByWeight() {
  return GEM_LIST.map((g) => ({
    id: g.id,
    peso: g.dropWeight || (g.raridade === 'lendaria' ? 3 : g.raridade === 'epica' ? 12 : g.raridade === 'rara' ? 25 : g.raridade === 'incomum' ? 40 : 60),
  }));
}

export function pickGemByWeight(excludeRaw = false) {
  const pool = GEM_LIST.filter((g) => (excludeRaw ? g.estado !== 'bruta' : true));
  if (!pool.length) return null;
  const total = pool.reduce((acc, g) => {
    const w = g.dropWeight || (g.raridade === 'lendaria' ? 3 : g.raridade === 'epica' ? 12 : g.raridade === 'rara' ? 25 : g.raridade === 'incomum' ? 40 : 60);
    return acc + w;
  }, 0);
  let roll = Math.random() * total;
  for (const g of pool) {
    const w = g.dropWeight || (g.raridade === 'lendaria' ? 3 : g.raridade === 'epica' ? 12 : g.raridade === 'rara' ? 25 : g.raridade === 'incomum' ? 40 : 60);
    roll -= w;
    if (roll <= 0) return g.id;
  }
  return pool[pool.length - 1].id;
}

// Gema inicial para personagem novo (sempre bruta pra incentivar uso da Forja)
export function getInitialGem() {
  // Dá preferência a gemas comuns/incomuns
  const iniciais = ['diamante', 'obsidiana'].filter((id) => GEMS[id]);
  if (iniciais.length) return iniciais[Math.floor(Math.random() * iniciais.length)];
  return pickGemByWeight(true) || 'diamante';
}

// ── Mineração ──────────────────────────────────────────────────────────────
// As 3 formas: botão com cooldown, veios/biomas e integrado às masmorras.

export const MINERA_VEIOS = [
  { id: 'veio_comum', nome: 'Veio Comum', custoCents: 0, cooldownMin: 10, chanceBonus: 0, biomas: ['plains', 'floresta'] },
  { id: 'veio_montanha', nome: 'Veio da Montanha', custoCents: 50, cooldownMin: 15, chanceBonus: 10, biomas: ['montanhas'] },
  { id: 'veio_vulcanico', nome: 'Veio Vulcânico', custoCents: 150, cooldownMin: 25, chanceBonus: 18, biomas: ['vulcanico'] },
  { id: 'veio_masmorra', nome: 'Veio Profundo', custoCents: 300, cooldownMin: 40, chanceBonus: 28, biomas: ['masmorra'] },
];

export function mineGem(veioId = 'veio_comum') {
  const veio = MINERA_VEIOS.find((v) => v.id === veioId) || MINERA_VEIOS[0];
  // Aplica bônus de chance por veio
  let gemId = pickGemByWeight(true);
  if (!gemId) gemId = getInitialGem();
  // Pequena chance de "achado raro" nos veios mais profundos
  if (veio.chanceBonus > 0 && Math.random() < veio.chanceBonus / 100) {
    const raras = GEM_LIST.filter((g) => g.estado !== 'bruta' && (g.raridade === 'rara' || g.raridade === 'epica' || g.raridade === 'lendaria'));
    if (raras.length) gemId = raras[Math.floor(Math.random() * raras.length)].id;
  }
  return { gemId, veio: veio.nome };
}

// Drop em batalha/masmorra com base em dropWeight
export function rollGemDrop(dificuldade = 'normal') {
  const chanceBase = dificuldade === 'chefe' ? 0.25 : dificuldade === 'masmorra' ? 0.18 : 0.12;
  if (Math.random() > chanceBase) return null;
  const gemId = pickGemByWeight(true);
  return gemId ? { gemId, origem: dificuldade === 'chefe' ? 'chefe' : dificuldade === 'masmorra' ? 'masmorra' : 'batalha' } : null;
}
