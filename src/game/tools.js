// ────────────────────────────────────────────────────────────────
// FERRAMENTAS DE POLIMENTO (ToolShop)
// Cada ferramenta tem preço em moedas, peso, espaços ocupados no
// inventário, durabilidade (usos) e uma lista de cidades onde pode ser
// comprada.
// ────────────────────────────────────────────────────────────────

// Cores por raridade (tema escuro).
export const TOOL_RARITY = {
  Comum: '#9aa0c0',
  Incomum: '#4a90e2',
  Rara: '#7c5cff',
  Épica: '#ffd166',
  Mítica: '#ff5c8a',
  Lendária: '#ff5c8a',
};

export const TOOLS = [
  {
    id: 'kit_lapidador',
    nome: 'Kit de Lapidador',
    icone: '🔨',
    tipo: 'ferramenta',
    raridade: 'Comum',
    descricao: 'Conjunto básico para lapidar pedras brutas em campo.',
    peso: 2,
    espacos: 1,
    usos: 100,
    preco: { prata: 50 },
    locais: ['Vila do Mineiro', 'Porto Ferro', 'Lapidaria Central'],
  },
  {
    id: 'bancada_joalheiro',
    nome: 'Bancada de Joalheiro',
    icone: '⚒️',
    tipo: 'ferramenta',
    raridade: 'Incomum',
    descricao: 'Bancada profissional para corte e polimento de pedras.',
    peso: 15,
    espacos: 4,
    usos: 50,
    preco: { ouro: 3 },
    locais: ['Porto Ferro', 'Lapidaria Central', 'Capital Áurea'],
  },
  {
    id: 'altar_aprimoramento',
    nome: 'Altar de Aprimoramento',
    icone: '🏺',
    tipo: 'ferramenta',
    raridade: 'Rara',
    descricao: 'Altar encantado capaz de realçar a essência das pedras.',
    peso: 30,
    espacos: 8,
    usos: 25,
    preco: { ouropla: 1 },
    locais: ['Lapidaria Central', 'Capital Áurea'],
  },
];

// Cidades conhecidas do mundo (para o seletor de local da loja).
export const CIDADES = [
  'Vila do Mineiro',
  'Porto Ferro',
  'Lapidaria Central',
  'Capital Áurea',
];

// Valor em centavos (ℛ) de cada moeda.
export const MOEDA = {
  cobre: 1,
  prata: 100,
  ouro: 1000,
  ouropla: 10000,
  platina: 100000,
};

// Converte um preço { moeda: valor } para centavos (ℛ).
export function precoEmCents(preco = {}) {
  let total = 0;
  for (const [moeda, valor] of Object.entries(preco)) {
    total += (Number(valor) || 0) * (MOEDA[moeda] || 0);
  }
  return total;
}

// Formata o preço em moedas de forma legível (ex.: "50 prata").
export function formatPreco(preco = {}) {
  const ordem = ['platina', 'ouropla', 'ouro', 'prata', 'cobre'];
  const partes = [];
  for (const moeda of ordem) {
    if (preco[moeda]) partes.push(`${preco[moeda]} ${moeda}`);
  }
  return partes.join(' ') || '—';
}

// Formata centavos (ℛ) para as moedas do jogo (réplica da função do servidor).
// 1 Cobre = 1 ℛ | 1 Prata = 100 ℛ | 1 Ouro = 1.000 ℛ |
// 1 Ouropla = 10.000 ℛ | 1 Platina = 100.000 ℛ
export function formatCoins(cents) {
  const c = Math.max(0, Number(cents) || 0);
  const platina = Math.floor(c / 100000);
  const ouropla = Math.floor((c % 100000) / 10000);
  const ouro = Math.floor((c % 10000) / 1000);
  const prata = Math.floor((c % 1000) / 100);
  const cobre = c % 100;
  const parts = [];
  if (platina) parts.push(`${platina} 🪙`);
  if (ouropla) parts.push(`${ouropla} 🟪`);
  if (ouro) parts.push(`${ouro} 🟡`);
  if (prata) parts.push(`${prata} ⚪`);
  if (cobre || parts.length === 0) parts.push(`${cobre} ℛ`);
  return parts.join(' ');
}

// Retorna as ferramentas disponíveis em um local (cidade).
export function getToolsPorLocal(localAtual) {
  return TOOLS.filter((t) => (t.locais || []).includes(localAtual));
}

export function getToolById(id) {
  return TOOLS.find((t) => t.id === id) || null;
}
