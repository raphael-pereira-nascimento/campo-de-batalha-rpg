// ═════════════════════════════════════════════════════════════════════════════════════
// EQUIPAMENTOS — Catálogo de armas, armaduras, acessórios e itens mágicos
// Sem importações externas problemáticas — dados puros
// ═════════════════════════════════════════════════════════════════════════════════════

export const EQUIP_TIPO = {
  arma:        { nome: 'Arma',        icone: '⚔️' },
  armadura:    { nome: 'Armadura',    icone: '🛡️' },
  acessorio:   { nome: 'Acessório',   icone: '💍' },
  cajado:      { nome: 'Cajado',      icone: '🔮' },
  varinha:     { nome: 'Varinha',     icone: '✨' },
  grimorio:    { nome: 'Grimório',    icone: '📖' },
  orbe:        { nome: 'Orbe',        icone: '🔮' },
  catalisador: { nome: 'Catalisador', icone: '⚗️' },
};

export const ARMA_SUBCATEGORIA = {
  lâmina:   { nome: 'Lâmina',   icone: '🗡️' },
  impacto:  { nome: 'Impacto',  icone: '🔨' },
  fogo:     { nome: 'Fogo',     icone: '🔫' },
};

export const EQUIP_RARITY = {
  comum:    { nome: 'Comum',    cor: '#9aa0c0', multiplicadorPreco: 1.0  },
  incomum:  { nome: 'Incomum',  cor: '#3ddc84', multiplicadorPreco: 1.5  },
  rara:     { nome: 'Rara',     cor: '#4a90e2', multiplicadorPreco: 2.5  },
  epica:    { nome: 'Épica',    cor: '#7c5cff', multiplicadorPreco: 5.0  },
  lendaria: { nome: 'Lendária', cor: '#ffd166', multiplicadorPreco: 10.0 },
};

export const EQUIPAMENTOS = {

  // ── ARMAS DE LÂMINA ─────────────────────────────────────────────────────
  espada_curta: {
    id: 'espada_curta', nome: 'Espada Curta', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'comum', peso: 1.2, precoBase: 120,
    materiaisUsados: [{ id: 'ferro', quantidade: 1.5 }],
    slots: 2, bonus: { forca: 1 }, penalidade: {},
    descricao: 'Lâmina curta e ágil, ideal para combate apertado.',
    imagem: 'assets/equipamentos/espada_curta.png',
  },
  espada_longa: {
    id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'incomum', peso: 1.8, precoBase: 650,
    materiaisUsados: [{ id: 'aco', quantidade: 2.0 }],
    slots: 5, bonus: { forca: 2 }, penalidade: {},
    descricao: 'Versátil e equilibrada, a clássica espada medieval.',
    imagem: 'assets/equipamentos/espada_longa.png',
  },
  machado_de_guerra: {
    id: 'machado_de_guerra', nome: 'Machado de Guerra', tipo: 'arma', subcategoria: 'impacto',
    raridade: 'incomum', peso: 2.5, precoBase: 1400,
    materiaisUsados: [{ id: 'aco', quantidade: 3.0 }],
    slots: 7, bonus: { forca: 3 }, penalidade: {},
    descricao: 'Pesado e devastador, machados cortam armaduras com facilidade.',
    imagem: 'assets/equipamentos/machado_de_guerra.png',
  },
  adaga_dupla: {
    id: 'adaga_dupla', nome: 'Adaga Dupla', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'incomum', peso: 0.8, precoBase: 500,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 1.0 }],
    slots: 2, bonus: { destreza: 3 }, penalidade: {},
    descricao: 'Lâminas gêmeas para o assassino implacável.',
    imagem: 'assets/equipamentos/adaga_dupla.png',
  },
  martelo_sagrado: {
    id: 'martelo_sagrado', nome: 'Martelo Sagrado', tipo: 'arma', subcategoria: 'impacto',
    raridade: 'rara', peso: 2.2, precoBase: 1100,
    materiaisUsados: [{ id: 'prata', quantidade: 2.0 }],
    slots: 3, bonus: { inteligencia: 1, resistencia: 1 }, penalidade: {},
    descricao: 'Arma de clérigos, esmaga com fé inabalável.',
    imagem: 'assets/equipamentos/martelo_sagrado.png',
  },
  adaga_ritual: {
    id: 'adaga_ritual', nome: 'Adaga Ritual', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'rara', peso: 0.7, precoBase: 700,
    materiaisUsados: [{ id: 'prata', quantidade: 0.8 }],
    slots: 2, bonus: { reflexos: 2 }, penalidade: {},
    descricao: 'Usada em rituais, corta com precisão sobrenatural.',
    imagem: 'assets/equipamentos/adaga_ritual.png',
  },
  espada_baioneta: {
    id: 'espada_baioneta', nome: 'Espada Baioneta', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'rara', peso: 2.0, precoBase: 1600,
    materiaisUsados: [{ id: 'aco', quantidade: 2.5 }],
    slots: 7, bonus: { forca: 1, destreza: 1 }, penalidade: {},
    descricao: 'Mosquete com baioneta — funciona como lança em combate corpo a corpo.',
    imagem: 'assets/equipamentos/espada_baioneta.png',
  },

  // ── ARMAS À DISTÂNCIA ───────────────────────────────────────────────────
  arco_simples: {
    id: 'arco_simples', nome: 'Arco Simples', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'comum', peso: 1.0, precoBase: 140,
    materiaisUsados: [{ id: 'ferro', quantidade: 0.5 }],
    slots: 5, bonus: { destreza: 2 }, penalidade: {},
    descricao: 'Confiável e silencioso, perfeito para emboscadas.',
    imagem: 'assets/equipamentos/arco_simples.png',
  },
  arco_longo: {
    id: 'arco_longo', nome: 'Arco Longo', tipo: 'arma', subcategoria: 'lâmina',
    raridade: 'incomum', peso: 1.5, precoBase: 750,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 1.5 }],
    slots: 5, bonus: { destreza: 3 }, penalidade: {},
    descricao: 'Alcance superior, letal à distância.',
    imagem: 'assets/equipamentos/arco_longo.png',
  },
  pistola: {
    id: 'pistola', nome: 'Pistola', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'comum', peso: 0.9, precoBase: 300,
    materiaisUsados: [{ id: 'ferro', quantidade: 1.0 }],
    slots: 5, bonus: { destreza: 1 }, penalidade: {},
    descricao: 'Rápida e barata, mas a mais fraca das armas de fogo.',
    imagem: 'assets/equipamentos/pistola.png',
  },
  mosquete: {
    id: 'mosquete', nome: 'Mosquete', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'incomum', peso: 3.5, precoBase: 1000,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 3.0 }],
    slots: 5, bonus: { forca: 1 }, penalidade: {},
    descricao: 'O clássico — lento mas devastador.',
    imagem: 'assets/equipamentos/mosquete.png',
  },
  rifle_de_caca: {
    id: 'rifle_de_caca', nome: 'Rifle de Caça', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'rara', peso: 4.0, precoBase: 2500,
    materiaisUsados: [{ id: 'aco', quantidade: 4.0 }],
    slots: 7, bonus: { destreza: 2 }, penalidade: {},
    descricao: 'Precisão cirúrgica e o maior dano entre as armas de fogo.',
    imagem: 'assets/equipamentos/rifle_de_caca.png',
  },

  // ── CANHÕES E ARMAS DE FOGO PESADAS ───────────────────────────────────────
  canhao_de_mao: {
    id: 'canhao_de_mao', nome: 'Canhão de Mão', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'rara', peso: 5.0, precoBase: 3500,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 3, danoBase: 6,
    materiaisUsados: [{ id: 'aco', quantidade: 4.0 }, { id: 'latão', quantidade: 1.0 }],
    slots: 5, bonus: { forca: 1 }, penalidade: { destreza: -1 },
    descricao: 'Canhão portátil de fogo devastador. Precisa de recarga após cada tiro.',
    imagem: 'assets/equipamentos/canhao_de_mao.png',
  },
  bacamarte: {
    id: 'bacamarte', nome: 'Bacamarte', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'incomum', peso: 3.0, precoBase: 800,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 2, danoBase: 4,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 2.0 }],
    slots: 5, bonus: {}, penalidade: { destreza: -1 },
    descricao: 'Arma de fogo antiga de um só tiro, barulhenta e letal.',
    imagem: 'assets/equipamentos/bacamarte.png',
  },
  nock_gun: {
    id: 'nock_gun', nome: 'Nock Gun', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'rara', peso: 6.0, precoBase: 2200,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 4, danoBase: 8,
    materiaisUsados: [{ id: 'aco', quantidade: 5.0 }, { id: 'latão', quantidade: 2.0 }],
    slots: 7, bonus: { forca: 2 }, penalidade: { destreza: -2 },
    descricao: 'Canhão de sete canos — dispara múltiplas balas de uma vez. Alto dano, recarga lenta.',
    imagem: 'assets/equipamentos/nock_gun.png',
  },
  pistola_de_latao: {
    id: 'pistola_de_latao', nome: 'Pistola de Latão', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'incomum', peso: 1.0, precoBase: 450,
    categoria: 'utilitaria', usosMax: 3, recargaTurnos: 1, danoBase: 3,
    materiaisUsados: [{ id: 'latão', quantidade: 0.5 }],
    slots: 3, bonus: { destreza: 1 }, penalidade: {},
    descricao: 'Pistola ornamentada de latão, confiável e de recarga rápida.',
    imagem: 'assets/equipamentos/pistola_de_latao.png',
  },
  pistola_da_marinha: {
    id: 'pistola_da_marinha', nome: 'Pistola da Marinha', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'rara', peso: 1.2, precoBase: 850,
    categoria: 'utilitaria', usosMax: 2, recargaTurnos: 1, danoBase: 4,
    materiaisUsados: [{ id: 'prata', quantidade: 0.5 }, { id: 'ferro', quantidade: 0.3 }],
    slots: 4, bonus: { destreza: 2 }, penalidade: {},
    descricao: 'Pistola de serviço naval, precisa e resistente à corrosão.',
    imagem: 'assets/equipamentos/pistola_da_marinha.png',
  },
  canhao_de_explosao: {
    id: 'canhao_de_explosao', nome: 'Canhão de Explosão', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'epica', peso: 8.0, precoBase: 6500,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 4, danoBase: 10,
    materiaisUsados: [{ id: 'aco', quantidade: 6.0 }, { id: 'latão', quantidade: 2.0 }, { id: 'obsidiana', quantidade: 0.5 }],
    slots: 7, bonus: { forca: 3 }, penalidade: { destreza: -2, reflexos: -1 },
    descricao: 'Canhão de artilharia portátil — projétil explosivo causa dano em área.',
    imagem: 'assets/equipamentos/canhao_de_explosao.png',
  },
  canhao_de_gelo: {
    id: 'canhao_de_gelo', nome: 'Canhão de Gelo', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'rara', peso: 6.0, precoBase: 4200,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 3, danoBase: 7,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 4.0 }, { id: 'prata', quantidade: 1.0 }],
    slots: 6, bonus: { inteligencia: 1, resistencia: 1 }, penalidade: { destreza: -1 },
    descricao: 'Dispara projéteis congelados que podem deixar o alvo lento.',
    imagem: 'assets/equipamentos/canhao_de_gelo.png',
  },
  canhao_de_relampago: {
    id: 'canhao_de_relampago', nome: 'Canhão de Relâmpago', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'rara', peso: 5.5, precoBase: 4800,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 3, danoBase: 8,
    materiaisUsados: [{ id: 'cobre', quantidade: 3.0 }, { id: 'prata', quantidade: 1.0 }, { id: 'latão', quantidade: 1.0 }],
    slots: 6, bonus: { inteligencia: 2, destreza: 1 }, penalidade: {},
    descricao: 'Canaliza energia elétrica através de canos de cobre. Dano de raio em cadeia.',
    imagem: 'assets/equipamentos/canhao_de_relampago.png',
  },
  canhao_pesado: {
    id: 'canhao_pesado', nome: 'Canhão Pesado', tipo: 'arma', subcategoria: 'fogo',
    raridade: 'lendaria', peso: 12.0, precoBase: 12000,
    categoria: 'utilitaria', usosMax: 1, recargaTurnos: 5, danoBase: 14,
    materiaisUsados: [{ id: 'diamante', quantidade: 0.3 }, { id: 'aco', quantidade: 8.0 }, { id: 'latão', quantidade: 3.0 }],
    slots: 8, bonus: { forca: 4, resistencia: 2 }, penalidade: { destreza: -3, reflexos: -2 },
    descricao: 'A arma de fogo mais devastadora já forjada. Destrói quase tudo no caminho.',
    imagem: 'assets/equipamentos/canhao_pesado.png',
  },

  // ── ARMADURAS ─────────────────────────────────────────────────────────────
  roupa_de_aventureiro: {
    id: 'roupa_de_aventureiro', nome: 'Roupa de Aventureiro', tipo: 'armadura',
    raridade: 'comum', peso: 1.5, precoBase: 80,
    materiaisUsados: [{ id: 'ferro', quantidade: 0.5 }],
    slots: 4, bonus: {}, penalidade: {},
    descricao: 'Proteção básica, leve e flexível.',
    imagem: 'assets/equipamentos/roupa_de_aventureiro.png',
  },
  couro: {
    id: 'couro', nome: 'Armadura de Couro', tipo: 'armadura',
    raridade: 'comum', peso: 2.0, precoBase: 300,
    materiaisUsados: [{ id: 'ferro', quantidade: 0.3 }],
    slots: 4, bonus: {}, penalidade: {},
    descricao: 'Boa proteção sem sacrificar mobilidade.',
    imagem: 'assets/equipamentos/couro.png',
  },
  cota_de_malha: {
    id: 'cota_de_malha', nome: 'Cota de Malha', tipo: 'armadura',
    raridade: 'incomum', peso: 4.0, precoBase: 800,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 2.0 }],
    slots: 4, bonus: {}, penalidade: { reflexos: -1 },
    descricao: 'Malha de anéis entrelaços — robusta e confiável.',
    imagem: 'assets/equipamentos/cota_de_malha.png',
  },
  armadura_de_placas: {
    id: 'armadura_de_placas', nome: 'Armadura de Placas', tipo: 'armadura',
    raridade: 'rara', peso: 8.0, precoBase: 2400,
    materiaisUsados: [{ id: 'aco', quantidade: 5.0 }],
    slots: 4, bonus: {}, penalidade: { reflexos: -1, destreza: -1 },
    descricao: 'Fortaleza ambulante — pesada mas praticamente impenetrável.',
    imagem: 'assets/equipamentos/armadura_de_placas.png',
  },
  manto_arcano: {
    id: 'manto_arcano', nome: 'Manto Arcano', tipo: 'armadura',
    raridade: 'incomum', peso: 1.0, precoBase: 650,
    materiaisUsados: [{ id: 'prata', quantidade: 0.5 }],
    slots: 4, bonus: { inteligencia: 1 }, penalidade: {},
    descricao: 'Tecido encantado que canaliza mana e protege o conjurador.',
    imagem: 'assets/equipamentos/manto_arcano.png',
  },
  vestes_sagradas: {
    id: 'vestes_sagradas', nome: 'Vestes Sagradas', tipo: 'armadura',
    raridade: 'incomum', peso: 1.0, precoBase: 650,
    materiaisUsados: [{ id: 'prata', quantidade: 0.5 }],
    slots: 4, bonus: { inteligencia: 1 }, penalidade: {},
    descricao: 'Roupas rituais imbuídas de fé divina.',
    imagem: 'assets/equipamentos/vestes_sagradas.png',
  },
  armadura_leve: {
    id: 'armadura_leve', nome: 'Armadura Leve', tipo: 'armadura',
    raridade: 'incomum', peso: 2.5, precoBase: 550,
    materiaisUsados: [{ id: 'couro', quantidade: 1.5 }],
    slots: 4, bonus: { reflexos: 1 }, penalidade: {},
    descricao: 'Proteção reforçada com mobilidade.',
    imagem: 'assets/equipamentos/armadura_leve.png',
  },

  // ── ACESSÓRIOS ──────────────────────────────────────────────────────────
  anel_de_forca: {
    id: 'anel_de_forca', nome: 'Anel de Força', tipo: 'acessorio',
    raridade: 'comum', peso: 0.1, precoBase: 350,
    materiaisUsados: [{ id: 'ferro', quantidade: 0.1 }],
    slots: 3, bonus: { forca: 1 }, penalidade: {},
    descricao: 'Um anel simples que canaliza a força bruta de quem o usa.',
    imagem: 'assets/equipamentos/anel_de_forca.png',
  },
  anel_do_vento: {
    id: 'anel_do_vento', nome: 'Anel do Vento', tipo: 'acessorio',
    raridade: 'incomum', peso: 0.1, precoBase: 750,
    materiaisUsados: [{ id: 'prata', quantidade: 0.1 }],
    slots: 3, bonus: { reflexos: 2 }, penalidade: {},
    descricao: 'Pequeno redemoinho preso em metal; aguça os reflexos do portador.',
    imagem: 'assets/equipamentos/anel_do_vento.png',
  },
  amuleto_de_vitalidade: {
    id: 'amuleto_de_vitalidade', nome: 'Amuleto de Vitalidade', tipo: 'acessorio',
    raridade: 'rara', peso: 0.1, precoBase: 900,
    materiaisUsados: [{ id: 'prata', quantidade: 0.2 }],
    slots: 3, bonus: { resistencia: 2 }, penalidade: {},
    descricao: 'Pedra âmbar que fortalece o corpo e a resistência do usuário.',
    imagem: 'assets/equipamentos/amuleto_de_vitalidade.png',
  },
  luvas_de_precisao: {
    id: 'luvas_de_precisao', nome: 'Luvas de Precisão', tipo: 'acessorio',
    raridade: 'incomum', peso: 0.2, precoBase: 850,
    materiaisUsados: [{ id: 'couro', quantidade: 0.3 }],
    slots: 3, bonus: { destreza: 2 }, penalidade: {},
    descricao: 'Luvas de couro fino que estabilizam a mão na hora do golpe.',
    imagem: 'assets/equipamentos/luvas_de_precisao.png',
  },
  bracelete_arcano: {
    id: 'bracelete_arcano', nome: 'Bracelete Arcano', tipo: 'acessorio',
    raridade: 'incomum', peso: 0.1, precoBase: 700,
    materiaisUsados: [{ id: 'prata', quantidade: 0.1 }],
    slots: 3, bonus: { inteligencia: 1, resistencia: 1 }, penalidade: {},
    descricao: 'Runas gravadas em prata ajudam a canalizar e suportar magia.',
    imagem: 'assets/equipamentos/bracelete_arcano.png',
  },
  talisma_arcano: {
    id: 'talisma_arcano', nome: 'Talisma Arcano', tipo: 'acessorio',
    raridade: 'rara', peso: 0.1, precoBase: 1200,
    materiaisUsados: [{ id: 'prata', quantidade: 0.2 }],
    slots: 3, bonus: { inteligencia: 2 }, penalidade: {},
    descricao: 'Cristal suspenso que amplia o poder arcano do portador.',
    imagem: 'assets/equipamentos/talisma_arcano.png',
  },

  // ── CAJADOS ─────────────────────────────────────────────────────────────
  cajado_arcano: {
    id: 'cajado_arcano', nome: 'Cajado Arcano', tipo: 'cajado',
    raridade: 'incomum', peso: 1.5, precoBase: 800,
    materiaisUsados: [{ id: 'ferroForjado', quantidade: 1.0 }],
    slots: 5, bonus: { inteligencia: 2 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 15, conducaoMana: 10, estabilidade: 5 },
    descricao: 'Canaliza energia arcanosa através de um cristal precioso.',
    imagem: 'assets/equipamentos/cajado_arcano.png',
  },
  cajado_de_fogo: {
    id: 'cajado_de_fogo', nome: 'Cajado de Fogo', tipo: 'cajado',
    raridade: 'rara', peso: 1.8, precoBase: 1200,
    materiaisUsados: [{ id: 'obsidiana', quantidade: 1.0 }],
    slots: 7, bonus: { inteligencia: 2 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 25, conducaoMana: 20, estabilidade: 15 },
    descricao: 'Cajado arcano que dispara projéteis de fogo incandescentes.',
    imagem: 'assets/equipamentos/cajado_de_fogo.png',
  },
  cajado_de_madeira_refinada: {
    id: 'cajado_de_madeira_refinada', nome: 'Cajado de Madeira Refinada', tipo: 'cajado',
    raridade: 'comum', peso: 1.2, precoBase: 450,
    materiaisUsados: [{ id: 'ferro', quantidade: 0.5 }],
    slots: 3, bonus: { inteligencia: 2 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 12, conducaoMana: 8, estabilidade: 5 },
    descricao: 'Cajado de madeira envernizada, ideal para iniciantes nas artes arcanas.',
    imagem: 'assets/equipamentos/cajado_de_madeira_refinada.png',
  },

  // ── VARINHAS ─────────────────────────────────────────────────────────────
  orbe_magico: {
    id: 'orbe_magico', nome: 'Orbe Mágico', tipo: 'varinha',
    raridade: 'incomum', peso: 0.8, precoBase: 950,
    materiaisUsados: [{ id: 'prata', quantidade: 0.3 }],
    slots: 3, bonus: { inteligencia: 3 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 20, conducaoMana: 15, estabilidade: 10 },
    descricao: 'Esfera flutuante que amplifica magia pura.',
    imagem: 'assets/equipamentos/orbe_magico.png',
  },

  // ── GRIMÓRIOS ────────────────────────────────────────────────────────────
  grimorio_de_iniciado: {
    id: 'grimorio_de_iniciado', nome: 'Grimório do Iniciado', tipo: 'grimorio',
    raridade: 'comum', peso: 1.0, precoBase: 600,
    materiaisUsados: [{ id: 'ferro', quantidade: 0.2 }],
    slots: 2, bonus: { inteligencia: 3 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 18, conducaoMana: 12, estabilidade: 8 },
    descricao: 'Livro de feitiços básicos com páginas de pergaminho antigo.',
    imagem: 'assets/equipamentos/grimorio_de_iniciado.png',
  },

  // ── ORBES ────────────────────────────────────────────────────────────────
  orbe_de_cristal: {
    id: 'orbe_de_cristal', nome: 'Orbe de Cristal', tipo: 'orbe',
    raridade: 'rara', peso: 0.5, precoBase: 1500,
    materiaisUsados: [{ id: 'diamante', quantidade: 0.2 }],
    slots: 4, bonus: { inteligencia: 4 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 30, conducaoMana: 25, estabilidade: 20 },
    descricao: 'Orbe de cristal puro que amplifica toda magia.',
    imagem: 'assets/equipamentos/orbe_de_cristal.png',
  },

  // ── CATALISADORES ────────────────────────────────────────────────────────
  catalisador_de_mana: {
    id: 'catalisador_de_mana', nome: 'Catalisador de Mana', tipo: 'catalisador',
    raridade: 'incomum', peso: 0.3, precoBase: 700,
    materiaisUsados: [{ id: 'prata', quantidade: 0.2 }],
    slots: 2, bonus: { inteligencia: 1 }, penalidade: {},
    atributosMagicos: { potenciaMagica: 10, conducaoMana: 15, estabilidade: 5 },
    descricao: 'Dispositivo que canaliza e amplia o fluxo de mana.',
    imagem: 'assets/equipamentos/catalisador_de_mana.png',
  },
};

export const EQUIPAMENTO_LIST = Object.values(EQUIPAMENTOS);
export const EQUIPAMENTO_IDS = Object.keys(EQUIPAMENTOS);

export function getEquipamentoById(id) {
  return EQUIPAMENTOS[id] || null;
}

export function getEquipamentosPorTipo(tipo) {
  return EQUIPAMENTO_LIST.filter(e => e.tipo === tipo);
}

export function getEquipamentosPorRaridade(raridade) {
  return EQUIPAMENTO_LIST.filter(e => e.raridade === raridade);
}

export function calcularPrecoEquipamento(equipId) {
  const equip = getEquipamentoById(equipId);
  if (!equip) return 0;
  const mult = EQUIP_RARITY[equip.raridade]?.multiplicadorPreco || 1;
  return Math.round(equip.precoBase * mult);
}
