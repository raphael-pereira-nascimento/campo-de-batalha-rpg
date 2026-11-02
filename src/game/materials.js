// ═════════════════════════════════════════════════════════════════════════════════════
// MATERIAIS — Catálogo de minérios, metais e pedras preciosas
// Sem importações externas problemáticas — dados puros
// ═════════════════════════════════════════════════════════════════════════════════════

export const MATERIAIS = {
  // ── Minérios ──────────────────────────────────────────────────────────────
  ferro: {
    id: 'ferro', nome: 'Ferro', tipo: 'minerio',
    raridade: 'comum', precoPorKg: 5, bioma: 'montanhas',
    descricao: 'O metal mais comum, usado em equipamentos básicos.',
    imagem: 'assets/materiais/ferro.png',
    efeitos: {
      armaLamina:   { desc: 'Dano físico padrão', bonus: { forca: 0 } },
      armaImpacto:  { desc: 'Dano físico padrão', bonus: { forca: 0 } },
      armaFogo:     { desc: 'Sem efeito especial', bonus: {} },
      armadura:     { desc: 'Proteção básica', bonus: { resistencia: 1 } },
      acessorio:    { desc: 'Sem efeito', bonus: {} },
      equipamentoMagico: { desc: 'Sem efeito', bonus: {} },
      golem:        { desc: 'Golem comum', bonus: { resistencia: 1 } },
    },
  },
  cobre: {
    id: 'cobre', nome: 'Cobre', tipo: 'minerio',
    raridade: 'comum', precoPorKg: 8, bioma: 'caverna',
    descricao: 'Metal maleável, conduz eletricidade e magia levemente.',
    imagem: 'assets/materiais/cobre.png',
    efeitos: {
      armaLamina:   { desc: 'Leve condução mágica', bonus: { inteligencia: 0 } },
      armaImpacto:  { desc: 'Sem efeito', bonus: {} },
      armaFogo:     { desc: '+5% dano de fogo', bonus: { inteligencia: 1 } },
      armadura:     { desc: 'Proteção básica', bonus: { resistencia: 0 } },
      acessorio:    { desc: 'Condução sutil', bonus: { inteligencia: 0 } },
      equipamentoMagico: { desc: 'Condução mana +5%', bonus: { inteligencia: 1 } },
      golem:        { desc: 'Condutor elétrico fraco', bonus: { inteligencia: 0 } },
    },
  },
  estanho: {
    id: 'estanho', nome: 'Estanho', tipo: 'minerio',
    raridade: 'comum', precoPorKg: 6, bioma: 'caverna',
    descricao: 'Metal macio, usado principalmente em ligas.',
    imagem: 'assets/materiais/estanho.png',
    efeitos: {
      armaLamina:   { desc: 'Sem efeito', bonus: {} },
      armaImpacto:  { desc: 'Sem efeito', bonus: {} },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção mínima', bonus: { resistencia: 0 } },
      acessorio:    { desc: 'Sem efeito', bonus: {} },
      equipamentoMagico: { desc: 'Sem efeito', bonus: {} },
      golem:        { desc: 'Material de enchimento', bonus: {} },
    },
  },
  chumbo: {
    id: 'chumbo', nome: 'Chumbo', tipo: 'minerio',
    raridade: 'comum', precoPorKg: 10, bioma: 'subterraneo',
    descricao: 'Metal pesado, bloqueia magia e radiação.',
    imagem: 'assets/materiais/chumbo.png',
    efeitos: {
      armaLamina:   { desc: 'Pesado, reduz precisão', bonus: { destreza: -1 } },
      armaImpacto:  { desc: 'Dano contundente pesado', bonus: { forca: 1 } },
      armaFogo:     { desc: 'Bloqueia fogo mágico', bonus: { inteligencia: -1 } },
      armadura:     { desc: 'Proteção pesada', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Bloqueia leituras mentais', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Inibe magia', bonus: { inteligencia: -1 } },
      golem:        { desc: 'Pesado e lento', bonus: { resistencia: 2, destreza: -1 } },
    },
  },

  // ── Metais ─────────────────────────────────────────────────────────────────
  bronze: {
    id: 'bronze', nome: 'Bronze', tipo: 'metal',
    raridade: 'comum', precoPorKg: 15, bioma: 'montanhas',
    descricao: 'Liga de cobre e estanho, durável e acessível.',
    imagem: 'assets/materiais/bronze.png',
    efeitos: {
      armaLamina:   { desc: 'Bom equilíbrio', bonus: { forca: 1 } },
      armaImpacto:  { desc: 'Contundente efetivo', bonus: { forca: 1 } },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção sólida', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Resistente', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de bronze resistente', bonus: { resistencia: 2 } },
    },
  },
  ferroForjado: {
    id: 'ferroForjado', nome: 'Ferro Forjado', tipo: 'metal',
    raridade: 'incomum', precoPorKg: 25, bioma: 'montanhas',
    descricao: 'Ferro trabalhado em forja, mais forte que o ferro bruto.',
    imagem: 'assets/materiais/ferro_forjado.png',
    efeitos: {
      armaLamina:   { desc: 'Lâmina afiada', bonus: { forca: 1, destreza: 1 } },
      armaImpacto:  { desc: 'Impacto pesado', bonus: { forca: 2 } },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção sólida', bonus: { resistencia: 3 } },
      acessorio:    { desc: 'Durável', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de ferro robusto', bonus: { resistencia: 3, forca: 1 } },
    },
  },
  aco: {
    id: 'aco', nome: 'Aço', tipo: 'metal',
    raridade: 'incomum', precoPorKg: 40, bioma: 'montanhas',
    descricao: 'Liga de ferro e carbono, superior para armas e armaduras.',
    imagem: 'assets/materiais/aco.png',
    efeitos: {
      armaLamina:   { desc: 'Lâmina superior', bonus: { forca: 2 } },
      armaImpacto:  { desc: 'Golpes pesados', bonus: { forca: 3 } },
      armaFogo:     { desc: 'Sem efeito', bonus: {} },
      armadura:     { desc: 'Proteção excelente', bonus: { resistencia: 4 } },
      acessorio:    { desc: 'Resistente', bonus: { resistencia: 2 } },
      equipamentoMagico: { desc: 'Condução neutra', bonus: {} },
      golem:        { desc: 'Golem de aço formidável', bonus: { resistencia: 4, forca: 2 } },
    },
  },
  prata: {
    id: 'prata', nome: 'Prata', tipo: 'metal',
    raridade: 'rara', precoPorKg: 100, bioma: 'subterraneo',
    descricao: 'Metal precioso, eficaz contra criaturas sobrenaturais.',
    imagem: 'assets/materiais/prata.png',
    efeitos: {
      armaLamina:   { desc: 'Eficaz contra mortos-vivos', bonus: { forca: 1, inteligencia: 1 } },
      armaImpacto:  { desc: 'Contundente sagrado', bonus: { forca: 1, inteligencia: 1 } },
      armaFogo:     { desc: 'Canaliza magia sagrada', bonus: { inteligencia: 2 } },
      armadura:     { desc: 'Resistência a maldições', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Proteção espiritual', bonus: { inteligencia: 1 } },
      equipamentoMagico: { desc: 'Amplifica magia sagrada', bonus: { inteligencia: 2 } },
      golem:        { desc: 'Golem de prata sagrado', bonus: { inteligencia: 2 } },
    },
  },
  ouro: {
    id: 'ouro', nome: 'Ouro', tipo: 'metal',
    raridade: 'rara', precoPorKg: 200, bioma: 'subterraneo',
    descricao: 'Metal precioso, valorizado e maleável.',
    imagem: 'assets/materiais/ouro.png',
    efeitos: {
      armaLamina:   { desc: 'Decorativo, fraco', bonus: { forca: 0 } },
      armaImpacto:  { desc: 'Macio, pouco efetivo', bonus: { forca: 0 } },
      armaFogo:     { desc: 'Conduz magia solar', bonus: { inteligencia: 1 } },
      armadura:     { desc: 'Estética, pouca proteção', bonus: { resistencia: 1 } },
      acessorio:    { desc: 'Símbolo de riqueza', bonus: {} },
      equipamentoMagico: { desc: 'Condução solar', bonus: { inteligencia: 2 } },
      golem:        { desc: 'Golem dourado ornamental', bonus: { inteligencia: 1 } },
    },
  },

  // ── Pedras preciosas ──────────────────────────────────────────────────────
  obsidiana: {
    id: 'obsidiana', nome: 'Obsidiana', tipo: 'pedra',
    raridade: 'epica', precoPorKg: 200, bioma: 'vulcao',
    descricao: 'Vidro vulcânico cortante, usado em lâminas e pontas.',
    imagem: 'assets/materiais/obsidiana.png',
    efeitos: {
      armaLamina:   { desc: 'Corte extremamente afiado', bonus: { forca: 2, destreza: 1 } },
      armaImpacto:  { desc: 'Estilhaça ao impacto', bonus: { forca: 1 } },
      armaFogo:     { desc: 'Resistente ao calor', bonus: { inteligencia: 1 } },
      armadura:     { desc: 'Resistência ao fogo', bonus: { resistencia: 2 } },
      acessorio:    { desc: 'Obsidiana protetora', bonus: { resistencia: 1 } },
      equipamentoMagico: { desc: 'Canaliza fogo', bonus: { inteligencia: 2 } },
      golem:        { desc: 'Golem de obsidiana cortante', bonus: { forca: 2, resistencia: 2 } },
    },
  },
  diamante: {
    id: 'diamante', nome: 'Diamante', tipo: 'pedra',
    raridade: 'lendaria', precoPorKg: 500, bioma: 'subterraneo',
    descricao: 'A pedra mais dura, usada em lâminas e pontas de elite.',
    imagem: 'assets/materiais/diamante.png',
    efeitos: {
      armaLamina:   { desc: 'Corte extremamente afiado', bonus: { forca: 3, destreza: 2 } },
      armaImpacto:  { desc: 'Quebra qualquer coisa', bonus: { forca: 3 } },
      armaFogo:     { desc: 'Refrata luz solar', bonus: { inteligencia: 2 } },
      armadura:     { desc: 'Proteção absoluta', bonus: { resistencia: 5 } },
      acessorio:    { desc: 'Brilho protetor', bonus: { resistencia: 2 } },
      equipamentoMagico: { desc: 'Amplifica toda magia', bonus: { inteligencia: 3 } },
      golem:        { desc: 'Golem de diamante lendário', bonus: { resistencia: 5, forca: 3 } },
    },
  },
};

export const MATERIAL_LIST = Object.values(MATERIAIS);
export const MATERIAL_IDS = Object.keys(MATERIAIS);

export function getMaterialById(id) {
  return MATERIAIS[id] || null;
}

export function getMateriaisPorTipo(tipo) {
  return MATERIAL_LIST.filter(m => m.tipo === tipo);
}

export function getMateriaisPorRaridade(raridade) {
  return MATERIAL_LIST.filter(m => m.raridade === raridade);
}

export function getMateriaisPorBioma(bioma) {
  return MATERIAL_LIST.filter(m => m.bioma === bioma);
}

export function calcularPrecoMaterial(id, quantidadeKg) {
  const material = getMaterialById(id);
  if (!material) return 0;
  return Math.round(material.precoPorKg * quantidadeKg);
}
