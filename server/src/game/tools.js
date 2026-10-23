// Ferramentas vendidas na Loja (espelho de src/game/tools.js).
// Preços convertidos para centavos (R): 1 cobre = 1, 1 prata = 100,
// 1 ouro = 1.000, 1 ouropla = 10.000, 1 platina = 100.000.

export const TOOLS = {
  kit_lapidador: {
    id: 'kit_lapidador',
    nome: 'Kit de Lapidador',
    tipo: 'ferramenta',
    raridade: 'Comum',
    peso: 2,
    espacos: 1,
    usos: 100,
    precoCents: 5000,
  },
  bancada_joalheiro: {
    id: 'bancada_joalheiro',
    nome: 'Bancada de Joalheiro',
    tipo: 'ferramenta',
    raridade: 'Incomum',
    peso: 15,
    espacos: 4,
    usos: 50,
    precoCents: 3000,
  },
  altar_aprimoramento: {
    id: 'altar_aprimoramento',
    nome: 'Altar de Aprimoramento',
    tipo: 'ferramenta',
    raridade: 'Rara',
    peso: 30,
    espacos: 8,
    usos: 25,
    precoCents: 10000,
  },
};
