// ═════════════════════════════════════════════════════════════════════════════════════
// REGRAS DO CATÁLOGO DE MATERIAIS
// Classificações, validação, filtros, ordenação, preços e composição.
// Módulo puro: não importa dados de materials.js para evitar dependência circular.
// ═════════════════════════════════════════════════════════════════════════════════════

import { MOEDA } from './tools.js';

// ── Categorias ───────────────────────────────────────────────────────────────────────
// Decisão D-01: `categoria` é a classificação oficial de exibição (5 entradas).
// `tipo` continua existindo como campo legado (minerio/metal/pedra) para não quebrar
// forja, mineração e dados já cadastrados.
// Decisão D-02: "Materiais utilizados em golens" não é uma categoria exclusiva — é um
// filtro por aplicação (`aplicacoes` inclui 'golem'), porque o mesmo metal pode ser
// usado em armadura e em golem.
export const MATERIAL_CATEGORIAS = {
  minerio: {
    nome: 'Minério',
    plural: 'Minérios',
    icone: '⛏️',
    tipoFiltro: 'categoria',
    descricao: 'Matéria-prima extraída de minas, cavernas, masmorras e outros biomas.',
  },
  metal: {
    nome: 'Metal',
    plural: 'Metais',
    icone: '🔧',
    tipoFiltro: 'categoria',
    descricao: 'Material obtido por processamento, refino ou fabricação a partir de minérios.',
  },
  especial: {
    nome: 'Material especial',
    plural: 'Materiais especiais',
    icone: '🧪',
    tipoFiltro: 'categoria',
    descricao: 'Materiais com propriedades próprias que não são minério bruto nem metal comum.',
  },
  magico: {
    nome: 'Material mágico',
    plural: 'Materiais mágicos',
    icone: '✨',
    tipoFiltro: 'categoria',
    descricao: 'Materiais cujo funcionamento depende de energia, gelo eterno, alma ou magia.',
  },
  golem: {
    nome: 'Material de golem',
    plural: 'Materiais utilizados em golens',
    icone: '🗿',
    tipoFiltro: 'aplicacao',
    descricao: 'Filtro por aplicação: materiais cuja ficha indica uso na construção de golens.',
  },
  pedra: {
    nome: 'Pedra',
    plural: 'Pedras',
    icone: '💎',
    tipoFiltro: 'categoria',
    oculto: true,
    legado: true,
    descricao: 'Categoria legada do projeto. Fichas novas usam "Material especial".',
  },
};

// Categorias que podem ser gravadas em uma ficha (as demais são filtros de interface).
export const CATEGORIAS_DADOS = ['minerio', 'metal', 'especial', 'magico'];

// Converte o campo legado `tipo` para a categoria oficial.
export const CATEGORIA_POR_TIPO = {
  minerio: 'minerio',
  metal: 'metal',
  pedra: 'especial',
};

// ── Raridade (classificações já usadas no projeto) ─────────────────────────────────
export const MATERIAL_RARIDADES = {
  comum:     { nome: 'Comum',     cor: '#9aa0c0', ordem: 1 },
  incomum:   { nome: 'Incomum',   cor: '#3ddc84', ordem: 2 },
  rara:      { nome: 'Rara',      cor: '#4a90e2', ordem: 3 },
  epica:     { nome: 'Épica',     cor: '#7c5cff', ordem: 4 },
  muitoRara: { nome: 'Muito rara', cor: '#b06bff', ordem: 5 },
  lendaria:  { nome: 'Lendária',  cor: '#ffd166', ordem: 6 },
  mitica:    { nome: 'Mítica',    cor: '#ff8a5c', ordem: 7 },
};

// ── Qualidade (independente da raridade) ────────────────────────────────────────────
// Decisão D-06: "Variável" é uma marca de qualidade usada pelo Satetsu no PDF; não é
// um degrau da escala e por isso fica fora da ordenação (ordem 0).
export const MATERIAL_QUALIDADES = {
  variavel:    { nome: 'Variável',    cor: '#9aa0c0', ordem: 0, especial: true },
  inferior:    { nome: 'Inferior',    cor: '#9aa0c0', ordem: 1 },
  comum:       { nome: 'Comum',       cor: '#c9c9c9', ordem: 2 },
  refinado:    { nome: 'Refinado',    cor: '#3ddc84', ordem: 3 },
  superior:    { nome: 'Superior',    cor: '#4a90e2', ordem: 4 },
  excepcional: { nome: 'Excepcional', cor: '#7c5cff', ordem: 5 },
  perfeito:    { nome: 'Perfeito',    cor: '#ffd166', ordem: 6 },
};

// ── Biomas já usados pelo projeto ───────────────────────────────────────────────────
export const BIOMAS = {
  montanhas:   { nome: 'Montanhas',   icone: '🏔️' },
  caverna:     { nome: 'Caverna',     icone: '🕳️' },
  subterraneo: { nome: 'Subterrâneo', icone: '🌑' },
  vulcao:      { nome: 'Vulcão',      icone: '🌋' },
};

// ── Categorias de equipamento usadas nas fichas ─────────────────────────────────────
// As chaves seguem os nomes já usados em materials.js/forge.js.
export const EQUIPAMENTO_CATEGORIAS = {
  armadura:    { nome: 'Armaduras',          icone: '🛡️' },
  armaLamina:  { nome: 'Armas de Lâmina',    icone: '🗡️' },
  armaImpacto: { nome: 'Armas de Impacto',   icone: '🔨' },
  armaFogo:    { nome: 'Armas de Fogo',      icone: '🔫' },
  acessorio:   { nome: 'Acessórios',         icone: '💍' },
  cajado:      { nome: 'Cajados',            icone: '🔮' },
  varinha:     { nome: 'Varinhas',           icone: '✨' },
  grimorio:    { nome: 'Grimórios',          icone: '📖' },
  orbe:        { nome: 'Orbes',              icone: '🔮' },
  catalisador: { nome: 'Catalisadores',      icone: '⚗️' },
  golem:       { nome: 'Golens',             icone: '🗿' },
};

export const CATEGORIAS_MAGICAS = ['cajado', 'varinha', 'grimorio', 'orbe', 'catalisador'];

// ── Tipos de efeito configuráveis ───────────────────────────────────────────────────
// O tipo descreve a natureza do efeito; o sinal fica implícito no próprio tipo.
// Ex.: `reducao` com valor 40 significa "reduz 40%", não "-40%".
export const TIPOS_EFEITO = {
  bonus:        { nome: 'Bônus',        sinal: 1 },
  reducao:      { nome: 'Redução',      sinal: -1 },
  resistencia:  { nome: 'Resistência',  sinal: 1 },
  chance:       { nome: 'Chance',       sinal: 1 },
  custo:        { nome: 'Custo',        sinal: -1 },
  penalidade:   { nome: 'Penalidade',   sinal: -1 },
  dano:         { nome: 'Dano',         sinal: -1 },
  cura:         { nome: 'Cura',         sinal: 1 },
  imunidade:    { nome: 'Imunidade',    sinal: 0 },
  especial:     { nome: 'Especial',     sinal: 0 },
  adaptacao:    { nome: 'Adaptação',    sinal: 0 },
  armazenamento:{ nome: 'Armazenamento', sinal: 0 },
};

export const UNIDADES_EFEITO = [
  'percentual',
  'percentualVidaMaxima',
  'pontos',
  'nivel',
  'dado',
  'kg',
  'multiplicador',
  'texto',
];

export const SISTEMAS_EFEITO = {
  podridao:              { nome: 'Podridão do Tenebrium' },
  corrupcaoRuidium:      { nome: 'Corrupção do Ruidium' },
  contaminacaoPandemica: { nome: 'Contaminação Pandemônica' },
};

// Efeitos sem valor numérico escalável. O material secundário não os concede:
// a regra de 25% só se aplica a valores; imunidade/adaptação são binárias.
export const TIPOS_EFEITO_BINARIOS = ['imunidade', 'especial', 'adaptacao'];

// Aplicações de ficha: mesmas chaves dos efeitos por equipamento.
export const MATERIAL_APLICACOES = EQUIPAMENTO_CATEGORIAS;

// Converte tipo de equipamento em categoria de efeito do material.
// Corrige o mapeamento antigo (`equip.subcategoria`) usado pela forja.
export function getCategoriaEfeitoEquipamento(equipamento) {
  if (!equipamento) return null;
  if (typeof equipamento === 'string') return equipamento;

  if (equipamento.tipo === 'golem') return 'golem';
  if (equipamento.tipo === 'armadura') return 'armadura';
  if (equipamento.tipo === 'acessorio') return 'acessorio';
  if (CATEGORIAS_MAGICAS.includes(equipamento.tipo)) return equipamento.tipo;

  if (equipamento.tipo === 'arma') {
    const sub = equipamento.subcategoria || equipamento.categoriaArma || null;
    if (sub === 'impacto') return 'armaImpacto';
    if (sub === 'fogo') return 'armaFogo';
    if (sub === 'lâmina' || sub === 'lamina') return 'armaLamina';
    // Armas sem subcategoria conhecida mantêm o comportamento anterior.
    return 'armaLamina';
  }

  return equipamento.categoriaEfeito || equipamento.categoria || equipamento.tipo || null;
}

// ── Campos físicos ───────────────────────────────────────────────────────────────────
export const FISICA_CAMPOS = {
  caracteristicas:     'Características físicas',
  dureza:              'Dureza',
  resistencia:         'Resistência',
  peso:                'Peso',
  densidade:           'Densidade',
  flexibilidade:       'Flexibilidade',
  condutividadeMagica: 'Condutividade mágica',
};

const NOMES_MOEDA = {
  platina: 'Platina',
  ouropla: 'Ouropla',
  ouro: 'Ouro',
  prata: 'Prata',
  bronze: 'Bronze',
};

// ═════════════════════════════════════════════════════════════════════════════════════
// LEITURA E NORMALIZAÇÃO
// ═════════════════════════════════════════════════════════════════════════════════════

export function getCategoria(material) {
  if (!material) return null;
  const bruta = material.categoria || material.tipo || null;
  if (!bruta) return null;
  return CATEGORIA_POR_TIPO[bruta] || bruta;
}

export function getCategoriaInfo(materialOuCategoria) {
  const chave = typeof materialOuCategoria === 'string'
    ? materialOuCategoria
    : getCategoria(materialOuCategoria);
  return MATERIAL_CATEGORIAS[chave] || null;
}

export function getRaridadeInfo(materialOuRaridade) {
  const chave = typeof materialOuRaridade === 'string'
    ? materialOuRaridade
    : materialOuRaridade?.raridade;
  return MATERIAL_RARIDADES[chave] || null;
}

export function getQualidadeInfo(materialOuQualidade) {
  const chave = typeof materialOuQualidade === 'string'
    ? materialOuQualidade
    : materialOuQualidade?.qualidade;
  return MATERIAL_QUALIDADES[chave] || null;
}

export function getBiomas(material) {
  if (!material) return [];
  const lista = Array.isArray(material.biomas)
    ? material.biomas
    : Array.isArray(material.bioma)
      ? material.bioma
      : material.bioma
        ? [material.bioma]
        : [];
  return [...new Set(lista.filter(Boolean))];
}

export function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// ── Normalização dos efeitos configuráveis ─────────────────────────────────────────
export function normalizarModificador(modificador) {
  if (!modificador || typeof modificador !== 'object' || Array.isArray(modificador)) {
    return null;
  }

  const numeroOuNulo = (valor) => {
    if (valor == null || valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  };

  const efeitoAplicado = modificador.efeitoAplicado
    && typeof modificador.efeitoAplicado === 'object'
    && !Array.isArray(modificador.efeitoAplicado)
    ? { ...modificador.efeitoAplicado }
    : null;

  return {
    ...modificador,
    tipo: modificador.tipo || 'especial',
    valor: numeroOuNulo(modificador.valor),
    unidade: modificador.unidade || null,
    alvo: modificador.alvo || modificador.descricao || '',
    condicao: modificador.condicao || null,
    duracao: modificador.duracao || null,
    chance: numeroOuNulo(modificador.chance),
    sistema: modificador.sistema || null,
    status: modificador.status === 'pendente' ? 'pendente' : 'definido',
    fonte: modificador.fonte || 'documento',
    observacao: modificador.observacao || null,
    duplicavel: modificador.duplicavel !== false,
    efeitoAplicado,
  };
}

export function normalizarEfeito(efeito) {
  if (!efeito || typeof efeito !== 'object' || Array.isArray(efeito)) return null;

  const objeto = (valor) => (
    valor && typeof valor === 'object' && !Array.isArray(valor) ? { ...valor } : {}
  );

  return {
    ...efeito,
    desc: efeito.desc ?? efeito.descricao ?? '',
    bonus: objeto(efeito.bonus),
    percentuais: objeto(efeito.percentuais),
    penalidades: objeto(efeito.penalidades),
    condicoes: Array.isArray(efeito.condicoes) ? efeito.condicoes : [],
    modificadores: Array.isArray(efeito.modificadores)
      ? efeito.modificadores.map(normalizarModificador).filter(Boolean)
      : [],
  };
}

// Assinatura usada para "efeitos idênticos não se acumulam".
export function chaveModificador(modificador) {
  if (!modificador) return '';
  return [
    modificador.tipo,
    normalizarTexto(modificador.alvo),
    normalizarTexto(modificador.condicao),
    normalizarTexto(modificador.sistema),
    normalizarTexto(modificador.unidade),
  ].join('|');
}

// Efeitos gerais entram primeiro; o efeito específico da categoria substitui o
// geral quando a assinatura é idêntica.
export function combinarModificadores(gerais = [], especificos = []) {
  const mapa = new Map();
  for (const modificador of gerais) {
    if (modificador) mapa.set(chaveModificador(modificador), modificador);
  }
  for (const modificador of especificos) {
    if (modificador) mapa.set(chaveModificador(modificador), modificador);
  }
  return [...mapa.values()];
}

export function normalizarPrecoPorKg(preco) {
  if (preco == null || preco === '') return null;

  if (typeof preco === 'number') {
    return Number.isFinite(preco) && preco >= 0 ? { bronze: preco } : null;
  }

  if (typeof preco !== 'object' || Array.isArray(preco)) return null;

  const normalizado = {};
  for (const [moeda, valor] of Object.entries(preco)) {
    const chave = moeda === 'cobre' ? 'bronze' : moeda;
    const numero = Number(valor);
    if (MOEDA[chave] == null || !Number.isFinite(numero) || numero < 0) return null;
    normalizado[chave] = (normalizado[chave] || 0) + numero;
  }

  return Object.keys(normalizado).length ? normalizado : null;
}

export function precoKgEmCents(preco) {
  if (preco == null || preco === '') return null;

  if (typeof preco === 'number') {
    return Number.isFinite(preco) && preco >= 0 ? Math.round(preco) : null;
  }

  if (typeof preco !== 'object' || Array.isArray(preco)) return null;

  let total = 0;
  let encontrouMoeda = false;
  for (const [moeda, valor] of Object.entries(preco)) {
    const chave = moeda === 'cobre' ? 'bronze' : moeda;
    const unidade = MOEDA[chave];
    const numero = Number(valor);
    if (unidade == null || !Number.isFinite(numero) || numero < 0) return null;
    total += numero * unidade;
    encontrouMoeda = true;
  }

  return encontrouMoeda ? Math.round(total) : null;
}

export function formatarPrecoPorKg(materialOuPreco) {
  const preco = materialOuPreco && typeof materialOuPreco === 'object'
    && !Array.isArray(materialOuPreco)
    && Object.prototype.hasOwnProperty.call(materialOuPreco, 'precoPorKg')
    ? materialOuPreco.precoPorKg
    : materialOuPreco;

  const cents = precoKgEmCents(preco);
  if (cents == null) return 'Preço não definido';

  let resto = Math.max(0, Math.round(cents));
  const platina = Math.floor(resto / 100000);
  resto %= 100000;
  const ouropla = Math.floor(resto / 10000);
  resto %= 10000;
  const ouro = Math.floor(resto / 1000);
  resto %= 1000;
  const prata = Math.floor(resto / 100);
  resto %= 100;
  const bronze = resto;

  const partes = [];
  if (platina) partes.push(`${platina} ${NOMES_MOEDA.platina}`);
  if (ouropla) partes.push(`${ouropla} ${NOMES_MOEDA.ouropla}`);
  if (ouro) partes.push(`${ouro} ${NOMES_MOEDA.ouro}`);
  if (prata) partes.push(`${prata} ${NOMES_MOEDA.prata}`);
  if (bronze || partes.length === 0) partes.push(`${bronze} ${NOMES_MOEDA.bronze}`);

  return `${partes.join(' + ')} / kg`;
}

// Formata um valor em "cents" (menor unidade = bronze) na moeda oficial.
export function formatarCents(cents) {
  if (cents == null || !Number.isFinite(Number(cents))) return 'Valor não definido';

  let resto = Math.max(0, Math.round(Number(cents)));
  const platina = Math.floor(resto / 100000);
  resto %= 100000;
  const ouropla = Math.floor(resto / 10000);
  resto %= 10000;
  const ouro = Math.floor(resto / 1000);
  resto %= 1000;
  const prata = Math.floor(resto / 100);
  resto %= 100;
  const bronze = resto;

  const partes = [];
  if (platina) partes.push(`${platina} ${NOMES_MOEDA.platina}`);
  if (ouropla) partes.push(`${ouropla} ${NOMES_MOEDA.ouropla}`);
  if (ouro) partes.push(`${ouro} ${NOMES_MOEDA.ouro}`);
  if (prata) partes.push(`${prata} ${NOMES_MOEDA.prata}`);
  if (bronze || partes.length === 0) partes.push(`${bronze} ${NOMES_MOEDA.bronze}`);

  return partes.join(' + ');
}

// Preço por quantidade: usa o preço/kg oficial e multiplica pelo peso pedido.
// Não altera o preço/kg cadastrado.
export function calcularPrecoPorQuantidade(materialOuPreco, quantidadeKg) {
  const preco = materialOuPreco && typeof materialOuPreco === 'object'
    && !Array.isArray(materialOuPreco)
    && Object.prototype.hasOwnProperty.call(materialOuPreco, 'precoPorKg')
    ? materialOuPreco.precoPorKg
    : materialOuPreco;

  const cents = precoKgEmCents(preco);
  const kg = Number(quantidadeKg);
  if (cents == null || !Number.isFinite(kg) || kg < 0) return null;
  return Math.round(cents * kg);
}

export function formatarPrecoQuantidade(materialOuPreco, quantidadeKg) {
  return formatarCents(calcularPrecoPorQuantidade(materialOuPreco, quantidadeKg));
}

export function normalizarMaterial(material) {
  if (!material || typeof material !== 'object') return null;

  const tipo = material.tipo || material.categoria || null;
  const efeitosBase = material.efeitos && typeof material.efeitos === 'object'
    ? material.efeitos
    : {};
  const efeitos = {};

  for (const chave of Object.keys(EQUIPAMENTO_CATEGORIAS)) {
    efeitos[chave] = efeitosBase[chave] || null;
  }
  if (efeitosBase.equipamentoMagico) {
    efeitos.equipamentoMagico = efeitosBase.equipamentoMagico;
  }
  for (const [chave, valor] of Object.entries(efeitosBase)) {
    if (!(chave in efeitos)) efeitos[chave] = valor;
  }
  for (const chave of Object.keys(efeitos)) {
    if (efeitos[chave]) efeitos[chave] = normalizarEfeito(efeitos[chave]);
  }

  const fisicaBase = material.fisica && typeof material.fisica === 'object'
    ? material.fisica
    : {};
  const fisica = {};
  for (const chave of Object.keys(FISICA_CAMPOS)) {
    fisica[chave] = fisicaBase[chave] ?? null;
  }

  const bioma = Array.isArray(material.bioma)
    ? (material.bioma[0] ?? null)
    : (material.bioma ?? null);

  // Aplicações: usadas pela ficha e pelo filtro "Materiais utilizados em golens".
  const aplicacoesBase = Array.isArray(material.aplicacoes) ? material.aplicacoes : null;
  const aplicacoesDerivadas = Object.entries(efeitos)
    .filter(([chave, valor]) => valor && MATERIAL_APLICACOES[chave])
    .map(([chave]) => chave);

  // Propriedades gerais valem para todas as categorias de equipamento, mas não
  // transformam automaticamente um material em material de golem: golem continua
  // sendo um filtro por aplicação declarada na ficha (D-02).
  if (!aplicacoesBase && efeitos.geral) {
    for (const chave of Object.keys(MATERIAL_APLICACOES)) {
      if (chave !== 'golem' && !aplicacoesDerivadas.includes(chave)) {
        aplicacoesDerivadas.push(chave);
      }
    }
  }

  const aplicacoes = aplicacoesBase
    ? [...new Set(aplicacoesBase.filter(Boolean))]
    : aplicacoesDerivadas;

  const normalizado = {
    ...material,
    tipo,
    categoria: getCategoria(material),
    forma: material.forma || null,
    raridade: material.raridade || null,
    qualidade: material.qualidade || null,
    precoPorKg: normalizarPrecoPorKg(material.precoPorKg),
    bioma,
    biomas: getBiomas(material),
    descricao: material.descricao || null,
    imagem: material.imagem || null,
    fisica,
    compatibilidade: material.compatibilidade ?? null,
    aplicacoes,
    caracteristicasEspeciais: Array.isArray(material.caracteristicasEspeciais)
      ? material.caracteristicasEspeciais
      : [],
    efeitosNegativos: Array.isArray(material.efeitosNegativos) ? material.efeitosNegativos : [],
    restricoes: Array.isArray(material.restricoes) ? material.restricoes : [],
    observacoes: material.observacoes || null,
    efeitos,
    efeitosGerais: Array.isArray(material.efeitosGerais)
      ? material.efeitosGerais.map(normalizarModificador).filter(Boolean)
      : [],
    sistemas: Array.isArray(material.sistemas)
      ? [...new Set(material.sistemas.filter(Boolean))]
      : [],
    relacoes: Array.isArray(material.relacoes) ? material.relacoes : [],
    aliases: Array.isArray(material.aliases) ? material.aliases : [],
  };

  normalizado.dadosPendentes = camposPendentes(normalizado);
  normalizado.status = normalizado.dadosPendentes.length ? 'pendente' : 'completo';

  return normalizado;
}

export function camposPendentes(material) {
  if (!material) return ['material'];
  const pendentes = [];

  if (!material.id) pendentes.push('id');
  if (!material.nome) pendentes.push('nome');
  if (!getCategoria(material)) pendentes.push('categoria');
  if (!material.descricao) pendentes.push('descricao');
  if (!material.raridade) pendentes.push('raridade');
  if (!material.qualidade) pendentes.push('qualidade');
  if (material.precoPorKg == null) pendentes.push('precoPorKg');
  if (!getBiomas(material).length) pendentes.push('bioma');

  const fisica = material.fisica || {};
  for (const chave of Object.keys(FISICA_CAMPOS)) {
    if (fisica[chave] == null || fisica[chave] === '') {
      pendentes.push(`fisica.${chave}`);
    }
  }

  if (material.compatibilidade == null) pendentes.push('compatibilidade');
  if (!Array.isArray(material.aplicacoes) || material.aplicacoes.length === 0) {
    pendentes.push('aplicacoes');
  }

  const efeitos = material.efeitos || {};
  const temEfeitoDeCategoria = Object.values(efeitos).some(Boolean);
  const temEfeitosGerais = Array.isArray(material.efeitosGerais) && material.efeitosGerais.length > 0;
  if (!temEfeitoDeCategoria && !temEfeitosGerais) pendentes.push('efeitos');

  return pendentes;
}

// ═════════════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO
// ═════════════════════════════════════════════════════════════════════════════════════

export function validarModificador(modificador, contexto, erros) {
  if (modificador == null) return;
  if (typeof modificador !== 'object' || Array.isArray(modificador)) {
    erros.push(`modificador inválido em ${contexto}.`);
    return;
  }
  if (!TIPOS_EFEITO[modificador.tipo]) {
    erros.push(`tipo de modificador inválido em ${contexto}: ${modificador.tipo ?? 'ausente'}.`);
  }
  if (modificador.unidade != null && !UNIDADES_EFEITO.includes(modificador.unidade)) {
    erros.push(`unidade inválida em ${contexto}: ${modificador.unidade}.`);
  }
  if (modificador.valor != null && !Number.isFinite(Number(modificador.valor))) {
    erros.push(`valor do modificador em ${contexto} deve ser numérico.`);
  }
  if (modificador.chance != null && !Number.isFinite(Number(modificador.chance))) {
    erros.push(`chance do modificador em ${contexto} deve ser numérica.`);
  }
  if (modificador.status != null && !['definido', 'pendente'].includes(modificador.status)) {
    erros.push(`status do modificador em ${contexto} inválido: ${modificador.status}.`);
  }
  if (modificador.sistema != null && !SISTEMAS_EFEITO[modificador.sistema]) {
    erros.push(`sistema do modificador em ${contexto} inválido: ${modificador.sistema}.`);
  }
  for (const campo of ['alvo', 'condicao', 'duracao', 'observacao', 'fonte']) {
    if (modificador[campo] != null && typeof modificador[campo] !== 'string') {
      erros.push(`${campo} do modificador em ${contexto} deve ser texto.`);
    }
  }
  if (modificador.duplicavel != null && typeof modificador.duplicavel !== 'boolean') {
    erros.push(`duplicavel do modificador em ${contexto} deve ser booleano.`);
  }
  if (
    modificador.efeitoAplicado != null
    && (typeof modificador.efeitoAplicado !== 'object' || Array.isArray(modificador.efeitoAplicado))
  ) {
    erros.push(`efeitoAplicado do modificador em ${contexto} deve ser um objeto.`);
  }
}

export function validarMaterial(material) {
  const pendentes = camposPendentes(material);

  if (!material || typeof material !== 'object' || Array.isArray(material)) {
    return {
      ok: false,
      erros: ['Material inválido.'],
      pendentes,
      status: 'pendente',
    };
  }

  const erros = [];

  if (!material.id || typeof material.id !== 'string') erros.push('id obrigatório e deve ser texto.');
  if (!material.nome || typeof material.nome !== 'string') erros.push('nome obrigatório e deve ser texto.');

  const categoria = getCategoria(material);
  if (!MATERIAL_CATEGORIAS[categoria] || MATERIAL_CATEGORIAS[categoria].legado) {
    erros.push(`categoria inválida: ${categoria ?? 'ausente'}.`);
  }

  if (material.raridade != null && !MATERIAL_RARIDADES[material.raridade]) {
    erros.push(`raridade inválida: ${material.raridade}.`);
  }
  if (material.qualidade != null && !MATERIAL_QUALIDADES[material.qualidade]) {
    erros.push(`qualidade inválida: ${material.qualidade}.`);
  }
  if (material.precoPorKg != null && normalizarPrecoPorKg(material.precoPorKg) == null) {
    erros.push('precoPorKg inválido. Use número ou objeto com bronze/prata/ouro/ouropla/platina.');
  }

  if (material.aliases != null && !Array.isArray(material.aliases)) {
    erros.push('aliases deve ser uma lista.');
  }
  if (material.aplicacoes != null) {
    if (!Array.isArray(material.aplicacoes)) {
      erros.push('aplicacoes deve ser uma lista.');
    } else {
      for (const aplicacao of material.aplicacoes) {
        if (!MATERIAL_APLICACOES[aplicacao]) erros.push(`aplicação inválida: ${aplicacao}.`);
      }
    }
  }
  for (const campo of ['caracteristicasEspeciais', 'efeitosNegativos', 'restricoes']) {
    if (material[campo] != null && !Array.isArray(material[campo])) {
      erros.push(`${campo} deve ser uma lista.`);
    }
  }
  if (material.observacoes != null && typeof material.observacoes !== 'string') {
    erros.push('observacoes deve ser texto.');
  }
  if (material.relacoes != null && !Array.isArray(material.relacoes)) {
    erros.push('relacoes deve ser uma lista.');
  }
  if (material.compatibilidade != null && !Array.isArray(material.compatibilidade)) {
    erros.push('compatibilidade deve ser uma lista de categorias de equipamento.');
  }
  if (material.fisica != null && (typeof material.fisica !== 'object' || Array.isArray(material.fisica))) {
    erros.push('fisica deve ser um objeto.');
  }
  if (material.efeitosGerais != null && !Array.isArray(material.efeitosGerais)) {
    erros.push('efeitosGerais deve ser uma lista.');
  } else if (Array.isArray(material.efeitosGerais)) {
    material.efeitosGerais.forEach((modificador, indice) => {
      validarModificador(modificador, `efeitosGerais[${indice}]`, erros);
    });
  }
  if (material.sistemas != null) {
    if (!Array.isArray(material.sistemas)) {
      erros.push('sistemas deve ser uma lista.');
    } else {
      for (const sistema of material.sistemas) {
        if (!SISTEMAS_EFEITO[sistema]) erros.push(`sistema inválido: ${sistema}.`);
      }
    }
  }

  if (material.efeitos != null) {
    if (typeof material.efeitos !== 'object' || Array.isArray(material.efeitos)) {
      erros.push('efeitos deve ser um objeto.');
    } else {
      for (const [chave, efeito] of Object.entries(material.efeitos)) {
        if (efeito == null) continue;
        if (typeof efeito !== 'object' || Array.isArray(efeito)) {
          erros.push(`efeito "${chave}" inválido.`);
          continue;
        }
        if (efeito.desc != null && typeof efeito.desc !== 'string') {
          erros.push(`descrição do efeito "${chave}" deve ser texto.`);
        }
        if (efeito.bonus != null) {
          if (typeof efeito.bonus !== 'object' || Array.isArray(efeito.bonus)) {
            erros.push(`bônus do efeito "${chave}" deve ser um objeto.`);
          } else {
            for (const [atributo, valor] of Object.entries(efeito.bonus)) {
              if (!Number.isFinite(Number(valor))) {
                erros.push(`bônus "${chave}.${atributo}" deve ser numérico.`);
              }
            }
          }
        }
        for (const campo of ['percentuais', 'penalidades', 'ajustes']) {
          if (efeito[campo] == null) continue;
          if (typeof efeito[campo] !== 'object' || Array.isArray(efeito[campo])) {
            erros.push(`${campo} do efeito "${chave}" deve ser um objeto.`);
            continue;
          }
          for (const [atributo, valor] of Object.entries(efeito[campo])) {
            if (!Number.isFinite(Number(valor))) {
              erros.push(`${campo} "${chave}.${atributo}" deve ser numérico.`);
            }
          }
        }
        if (efeito.condicoes != null && !Array.isArray(efeito.condicoes)) {
          erros.push(`condições do efeito "${chave}" devem ser uma lista.`);
        }
<<<<<<< HEAD
        if (efeito.chance != null) {
          const chance = Number(efeito.chance);
          if (!Number.isFinite(chance) || chance < 0 || chance > 100) {
            erros.push(`chance do efeito "${chave}" deve ser um número entre 0 e 100.`);
          }
        }
        if (efeito.duracao != null && typeof efeito.duracao !== 'string') {
          erros.push(`duração do efeito "${chave}" deve ser texto.`);
        }
        if (
          efeito.alvo != null
          && typeof efeito.alvo !== 'string'
          && !Array.isArray(efeito.alvo)
        ) {
          erros.push(`alvo do efeito "${chave}" deve ser texto ou lista.`);
        }
        if (efeito.status != null && typeof efeito.status !== 'string') {
          erros.push(`status do efeito "${chave}" deve ser texto.`);
=======
        if (efeito.modificadores != null && !Array.isArray(efeito.modificadores)) {
          erros.push(`modificadores do efeito "${chave}" devem ser uma lista.`);
        } else if (Array.isArray(efeito.modificadores)) {
          efeito.modificadores.forEach((modificador, indice) => {
            validarModificador(modificador, `efeitos.${chave}.modificadores[${indice}]`, erros);
          });
>>>>>>> adf007ca5d374578a87f221640ae286e6b0cbf9c
        }
        if (
          efeito.especial != null
          && typeof efeito.especial !== 'string'
          && (typeof efeito.especial !== 'object' || Array.isArray(efeito.especial))
        ) {
          erros.push(`efeito especial "${chave}" deve ser texto ou objeto.`);
        }
      }
    }
  }

  return {
    ok: erros.length === 0,
    erros,
    pendentes,
    status: pendentes.length ? 'pendente' : 'completo',
  };
}

// ═════════════════════════════════════════════════════════════════════════════════════
// FILTROS E ORDENAÇÃO
// ═════════════════════════════════════════════════════════════════════════════════════

export function filtrarMateriais(materiais, filtros = {}) {
  const busca = normalizarTexto(filtros.busca);
  const categoria = filtros.categoria || 'todas';
  const raridade = filtros.raridade || 'todas';
  const qualidade = filtros.qualidade || 'todas';
  const bioma = filtros.bioma || 'todos';
  const aplicacao = filtros.aplicacao || 'todas';
  const precoMin = Number.isFinite(Number(filtros.precoMin)) ? Number(filtros.precoMin) : null;
  const precoMax = Number.isFinite(Number(filtros.precoMax)) ? Number(filtros.precoMax) : null;

  return (materiais || []).filter((material) => {
    if (busca) {
      const alvo = normalizarTexto([
        material.nome,
        material.id,
        ...(material.aliases || []),
      ].join(' '));
      if (!alvo.includes(busca)) return false;
    }

    if (categoria !== 'todas') {
      // "Materiais utilizados em golens" é um filtro por aplicação.
      if (categoria === 'golem') {
        if (!(material.aplicacoes || []).includes('golem')) return false;
      } else if (getCategoria(material) !== categoria) {
        return false;
      }
    }

    if (aplicacao !== 'todas' && !(material.aplicacoes || []).includes(aplicacao)) return false;

    if (raridade !== 'todas') {
      if (raridade === 'pendente') {
        if (material.raridade != null) return false;
      } else if (material.raridade !== raridade) {
        return false;
      }
    }

    if (qualidade !== 'todas') {
      if (qualidade === 'pendente') {
        if (material.qualidade != null) return false;
      } else if (material.qualidade !== qualidade) {
        return false;
      }
    }

    if (bioma !== 'todos' && !getBiomas(material).includes(bioma)) return false;

    if (precoMin != null || precoMax != null) {
      const preco = precoKgEmCents(material.precoPorKg);
      // Materiais com preço pendente só entram quando não há filtro de preço.
      if (preco == null) return false;
      if (precoMin != null && preco < precoMin) return false;
      if (precoMax != null && preco > precoMax) return false;
    }

    if (filtros.comEfeitos && !materialTemEfeitos(material)) return false;
    if (filtros.apenasPendentes && material.status !== 'pendente') return false;

    return true;
  });
}

export function ordenarMateriais(materiais, ordenacao = 'nome') {
  const lista = [...(materiais || [])];
  const porNome = (a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');

  const ordemRaridade = (material) => material.raridade
    ? MATERIAL_RARIDADES[material.raridade].ordem
    : 999;
  const ordemQualidade = (material) => material.qualidade
    ? MATERIAL_QUALIDADES[material.qualidade].ordem
    : 999;
  const preco = (material) => precoKgEmCents(material.precoPorKg);

  switch (ordenacao) {
    case 'preco-asc':
      return lista.sort((a, b) => {
        const pa = preco(a);
        const pb = preco(b);
        if (pa == null && pb == null) return porNome(a, b);
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pa - pb || porNome(a, b);
      });
    case 'preco-desc':
      return lista.sort((a, b) => {
        const pa = preco(a);
        const pb = preco(b);
        if (pa == null && pb == null) return porNome(a, b);
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pb - pa || porNome(a, b);
      });
    case 'raridade':
      return lista.sort((a, b) => ordemRaridade(a) - ordemRaridade(b) || porNome(a, b));
    case 'qualidade':
      return lista.sort((a, b) => ordemQualidade(a) - ordemQualidade(b) || porNome(a, b));
    case 'nome':
    default:
      return lista.sort(porNome);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════
// EFEITOS POR CATEGORIA DE EQUIPAMENTO
// ═════════════════════════════════════════════════════════════════════════════════════

export function materialTemEfeitos(material) {
  if (!material) return false;
  return Object.values(material.efeitos || {}).some(Boolean)
    || (Array.isArray(material.efeitosGerais) && material.efeitosGerais.length > 0);
}

export function getEfeitoPorEquipamento(material, categoria, opcoes = {}) {
  if (!material || !categoria) return null;

  const incluirGerais = opcoes.incluirGerais !== false;
  const efeitos = material.efeitos || {};
  const direto = efeitos[categoria];
  const fallback = !direto && CATEGORIAS_MAGICAS.includes(categoria)
    ? efeitos.equipamentoMagico
    : null;
  const efeito = direto || fallback || null;

  const gerais = incluirGerais && Array.isArray(material.efeitosGerais)
    ? material.efeitosGerais
    : [];

  if (!efeito && gerais.length === 0) return null;

  const montar = (base, origem) => ({
    chave: categoria,
    origem,
<<<<<<< HEAD
    desc: efeito.desc || efeito.descricao || '',
    bonus: efeito.bonus || {},
    percentuais: efeito.percentuais || null,
    penalidades: efeito.penalidades || null,
    ajustes: efeito.ajustes || null,
    condicoes: Array.isArray(efeito.condicoes) ? efeito.condicoes : [],
    chance: efeito.chance ?? null,
    duracao: efeito.duracao ?? null,
    alvo: efeito.alvo ?? null,
    status: efeito.status ?? null,
    especial: efeito.especial || null,
=======
    desc: base.desc || base.descricao || '',
    bonus: base.bonus || {},
    percentuais: base.percentuais || null,
    penalidades: base.penalidades || null,
    condicoes: Array.isArray(base.condicoes) ? base.condicoes : [],
    especial: base.especial || null,
    modificadores: Array.isArray(base.modificadores) ? base.modificadores : [],
>>>>>>> adf007ca5d374578a87f221640ae286e6b0cbf9c
    fallback: origem !== categoria,
  });

  const base = efeito
    ? montar(efeito, direto ? categoria : 'equipamentoMagico')
    : montar({}, 'efeitosGerais');

<<<<<<< HEAD
  if (CATEGORIAS_MAGICAS.includes(categoria) && efeitos.equipamentoMagico) {
    return montar(efeitos.equipamentoMagico, 'equipamentoMagico');
  }

  // Efeitos gerais não exigem repetição em todas as categorias. Golens ficam de
  // fora do fallback porque dependem de aplicação declarada na ficha.
  if (categoria !== 'golem' && efeitos.geral) {
    return montar(efeitos.geral, 'geral');
  }

  return null;
=======
  return {
    ...base,
    modificadores: combinarModificadores(gerais, base.modificadores),
  };
>>>>>>> adf007ca5d374578a87f221640ae286e6b0cbf9c
}

export function getEfeitosPorCategoria(material) {
  return Object.entries(EQUIPAMENTO_CATEGORIAS).map(([chave, info]) => ({
    chave,
    ...info,
    efeito: getEfeitoPorEquipamento(material, chave),
  }));
}

export function getEfeitosDisponiveis(material) {
  return getEfeitosPorCategoria(material).filter((item) => item.efeito);
}

// ═════════════════════════════════════════════════════════════════════════════════════
// COMPOSIÇÃO: PRINCIPAL 100% / SECUNDÁRIO ATÉ 25% / MESMO ATRIBUTO NÃO ACUMULA
// ═════════════════════════════════════════════════════════════════════════════════════

export function calcularBonusComposicao(materialPrincipal, materialSecundario, categoria) {
  if (!categoria) {
    return { ok: false, motivo: 'Informe a categoria do equipamento.' };
  }

  const efeitoPrincipal = getEfeitoPorEquipamento(materialPrincipal, categoria);
  const efeitoSecundario = getEfeitoPorEquipamento(materialSecundario, categoria);

  const bonusPrincipal = { ...(efeitoPrincipal?.bonus || {}) };
  const bonusSecundarioOriginal = { ...(efeitoSecundario?.bonus || {}) };
  const bonusSecundarioAplicado = {};
  const ignorados = [];
  const avisos = [];

  if (!materialPrincipal) avisos.push('Nenhum material principal selecionado.');
  if (!materialSecundario) avisos.push('Nenhum material secundário selecionado.');
  if (materialPrincipal && materialSecundario && materialPrincipal.id === materialSecundario.id) {
    avisos.push('Principal e secundário são o mesmo material; o secundário não acrescenta bônus.');
  }
  if (!efeitoPrincipal && materialPrincipal) {
    avisos.push(`O material principal não possui efeito para ${EQUIPAMENTO_CATEGORIAS[categoria]?.nome || categoria}.`);
  }
  if (!efeitoSecundario && materialSecundario) {
    avisos.push(`O material secundário não possui efeito para ${EQUIPAMENTO_CATEGORIAS[categoria]?.nome || categoria}.`);
  }

  for (const [atributo, valor] of Object.entries(bonusSecundarioOriginal)) {
    if (Object.prototype.hasOwnProperty.call(bonusPrincipal, atributo)) {
      ignorados.push({
        atributo,
        motivo: 'O atributo já é concedido pelo material principal.',
        valorPrincipal: bonusPrincipal[atributo],
        valorSecundario: valor,
      });
      continue;
    }

    // Regra existente da Forja: até 25%, arredondado para baixo.
    // Decisão D-07: valores negativos são truncados em direção a zero, para que uma
    // penalidade do secundário também respeite o limite de 25%.
    const parcial = Math.trunc(Number(valor) * 0.25);
    if (parcial !== 0) {
      bonusSecundarioAplicado[atributo] = parcial;
    } else {
      ignorados.push({
        atributo,
        motivo: 'O valor de 25% foi arredondado para zero.',
        valorPrincipal: undefined,
        valorSecundario: valor,
      });
    }
  }

  const bonusFinal = { ...bonusPrincipal };
  for (const [atributo, valor] of Object.entries(bonusSecundarioAplicado)) {
    bonusFinal[atributo] = (bonusFinal[atributo] || 0) + valor;
  }

  // Mapa numérico do secundário: chave idêntica não acumula e o valor entra com 25%,
  // truncado em direção a zero (D-07).
  const aplicarParcial = (principalMap, secundarioMap, tipo, motivoDuplicado) => {
    const aplicado = {};
    for (const [chave, valor] of Object.entries(secundarioMap)) {
      if (Object.prototype.hasOwnProperty.call(principalMap, chave)) {
        ignorados.push({
          atributo: chave,
          tipo,
          motivo: motivoDuplicado,
          valorPrincipal: principalMap[chave],
          valorSecundario: valor,
        });
        continue;
      }
      const parcial = Math.trunc(Number(valor) * 0.25);
      if (parcial !== 0) {
        aplicado[chave] = parcial;
      } else {
        ignorados.push({
          atributo: chave,
          tipo,
          motivo: 'O valor de 25% foi arredondado para zero.',
          valorPrincipal: undefined,
          valorSecundario: valor,
        });
      }
    }
    return aplicado;
  };

  const percentuaisPrincipal = { ...(efeitoPrincipal?.percentuais || {}) };
  const percentuaisSecundarioOriginal = { ...(efeitoSecundario?.percentuais || {}) };
  const percentuaisSecundarioAplicado = aplicarParcial(
    percentuaisPrincipal,
    percentuaisSecundarioOriginal,
    'percentual',
    'O percentual já é concedido pelo material principal.',
  );
  const percentuaisFinal = { ...percentuaisPrincipal, ...percentuaisSecundarioAplicado };

  const ajustesPrincipal = { ...(efeitoPrincipal?.ajustes || {}) };
  const ajustesSecundarioOriginal = { ...(efeitoSecundario?.ajustes || {}) };
  const ajustesSecundarioAplicado = aplicarParcial(
    ajustesPrincipal,
    ajustesSecundarioOriginal,
    'ajuste',
    'O ajuste já é concedido pelo material principal.',
  );
  const ajustesFinal = { ...ajustesPrincipal, ...ajustesSecundarioAplicado };

  const penalidadesPrincipal = { ...(efeitoPrincipal?.penalidades || {}) };
  const penalidadesSecundarioOriginal = { ...(efeitoSecundario?.penalidades || {}) };
  const penalidadesSecundarioAplicado = aplicarParcial(
    penalidadesPrincipal,
    penalidadesSecundarioOriginal,
    'penalidade',
    'A penalidade já é concedida pelo material principal.',
  );
  const penalidadesFinal = { ...penalidadesPrincipal, ...penalidadesSecundarioAplicado };

  // Textos, condições e efeitos especiais do secundário não têm escala numérica
  // oficial; ficam registrados, mas não são aplicados automaticamente.
  if (efeitoSecundario) {
    if ((efeitoSecundario.condicoes || []).length) {
      ignorados.push({
        atributo: 'condicoes',
        tipo: 'condicao',
        motivo: 'Condições do material secundário não são escaladas automaticamente.',
      });
    }
    if (efeitoSecundario.especial != null) {
      ignorados.push({
        atributo: 'especial',
        tipo: 'especial',
        motivo: 'Efeito especial do material secundário não é escalado automaticamente.',
      });
    }
    for (const campo of ['chance', 'duracao', 'alvo', 'status']) {
      if (efeitoSecundario[campo] != null) {
        ignorados.push({
          atributo: campo,
          tipo: campo,
          motivo: 'Efeito condicional/temporário do secundário não é escalado automaticamente.',
        });
      }
    }
  }

  const nomeCategoria = EQUIPAMENTO_CATEGORIAS[categoria]?.nome || categoria;
  const incompatibilidades = [];
  for (const material of [materialPrincipal, materialSecundario]) {
    if (!material) continue;
    const lista = material.compatibilidade;
    if (Array.isArray(lista) && !lista.includes(categoria)) {
      incompatibilidades.push(`${material.nome} não é compatível com ${nomeCategoria}.`);
    }
  }

  return {
    ok: incompatibilidades.length === 0,
    motivo: incompatibilidades.join(' ') || null,
    categoria,
    nomeCategoria,
    principal: {
      materialId: materialPrincipal?.id || null,
      nome: materialPrincipal?.nome || null,
      efeito: efeitoPrincipal,
      bonus: bonusPrincipal,
      percentuais: percentuaisPrincipal,
      ajustes: ajustesPrincipal,
      penalidades: penalidadesPrincipal,
      condicoes: efeitoPrincipal?.condicoes || [],
      especial: efeitoPrincipal?.especial || null,
    },
    secundario: {
      materialId: materialSecundario?.id || null,
      nome: materialSecundario?.nome || null,
      efeito: efeitoSecundario,
      bonusOriginal: bonusSecundarioOriginal,
      bonusAplicado: bonusSecundarioAplicado,
      percentuaisOriginal: percentuaisSecundarioOriginal,
      percentuaisAplicado: percentuaisSecundarioAplicado,
      ajustesOriginal: ajustesSecundarioOriginal,
      ajustesAplicado: ajustesSecundarioAplicado,
      penalidadesOriginal: penalidadesSecundarioOriginal,
      penalidadesAplicado: penalidadesSecundarioAplicado,
      condicoes: efeitoSecundario?.condicoes || [],
      especial: efeitoSecundario?.especial || null,
      chance: efeitoSecundario?.chance ?? null,
      duracao: efeitoSecundario?.duracao ?? null,
      alvo: efeitoSecundario?.alvo ?? null,
      status: efeitoSecundario?.status ?? null,
      ignorados,
    },
    bonusFinal,
    percentuaisFinal,
    ajustesFinal,
    penalidadesFinal,
    condicoes: {
      principal: efeitoPrincipal?.condicoes || [],
      secundario: efeitoSecundario?.condicoes || [],
    },
    especiais: {
      principal: efeitoPrincipal?.especial || null,
      secundario: efeitoSecundario?.especial || null,
    },
    compatibilidade: { ok: incompatibilidades.length === 0, avisos: incompatibilidades },
    avisos,
  };
}
