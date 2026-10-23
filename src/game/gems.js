// Pedras preciosas — dados completos do sistema de gemas.
// Cada gema pode ser socketada em armas, armaduras ou acessórios.

export const GEM_RARITY = {
  comum:    { nome: 'Comum',    cor: '#9aa0c0', dropWeight: 60 },
  incomum:  { nome: 'Incomum',  cor: '#3ddc84', dropWeight: 40 },
  rara:     { nome: 'Rara',     cor: '#4a90e2', dropWeight: 25 },
  epica:    { nome: 'Épica',    cor: '#7c5cff', dropWeight: 12 },
  lendaria: { nome: 'Lendária', cor: '#ffd166', dropWeight: 3  },
};

export const GEMS = {

  // ── COMUNS ────────────────────────────────────────────

  jaspe: {
    id: 'jaspe',
    nome: 'Jaspe',
    descricao: 'Pedra defensiva terrestre, comum nas montanhas.',
    tipo: 'defensiva',
    raridade: 'comum',
    preco: 200,
    bioma: 'montanhas',
    drops: ['Golens terrestres', 'Touros gigantes'],
    fusao: ['hematita'],
    efeitos: {
      arma:      { desc: 'Ataques causam tremores leves', bonus: { forca: 1 } },
      armadura:  { desc: '+20% resistência física e elétrica', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Melhora equilíbrio corporal', bonus: { reflexos: 1 } },
    },
  },

  agata_listrada: {
    id: 'agata_listrada',
    nome: 'Ágata Listrada',
    descricao: 'Pedra defensiva de estabilidade, resistente a impactos.',
    tipo: 'defensiva',
    raridade: 'comum',
    preco: 750,
    bioma: 'montanhas',
    drops: ['Golens de pedra', 'Javalis blindados'],
    fusao: ['hematita', 'jaspe'],
    efeitos: {
      arma:      { desc: 'Armas pesadas ganham +15% dano de impacto', bonus: { forca: 1 } },
      armadura:  { desc: 'Aumenta resistência física em 20%', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Reduz tontura e desequilíbrio em 40%', bonus: { reflexos: 1 } },
    },
  },

  // ── INCOMUNS ──────────────────────────────────────────

  agata_fogo: {
    id: 'agata_fogo',
    nome: 'Ágata de Fogo',
    descricao: 'Pedra elemental que canaliza chamas.',
    tipo: 'elemental',
    raridade: 'incomum',
    preco: 400,
    bioma: 'vulcanico',
    drops: ['Salamandras', 'Golens flamejantes'],
    fusao: ['rubi', 'obsidiana'],
    efeitos: {
      arma:      { desc: 'Ataques têm chance de incendiar inimigos', bonus: { forca: 1 }, status: { tipo: 'queimadura', chance: 0.15 } },
      armadura:  { desc: '30% resistência ao fogo', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Aumenta resistência ao calor extremo', bonus: {} },
    },
  },

  agata_gelo: {
    id: 'agata_gelo',
    nome: 'Ágata de Gelo',
    descricao: 'Pedra elemental congelante das terras nevadas.',
    tipo: 'elemental',
    raridade: 'incomum',
    preco: 400,
    bioma: 'neve',
    drops: ['Lobos glaciais', 'Golens congelados'],
    fusao: ['safira_azul'],
    efeitos: {
      arma:      { desc: 'Ataques podem reduzir velocidade inimiga em 20%', bonus: {}, status: { tipo: 'congelamento', chance: 0.10 } },
      armadura:  { desc: '35% resistência ao gelo', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Reduz efeitos de congelamento', bonus: {} },
    },
  },

  agata_musgosa: {
    id: 'agata_musgosa',
    nome: 'Ágata Musgosa',
    descricao: 'Pedra natural de planta e suporte, brotada da floresta.',
    tipo: 'suporte',
    raridade: 'incomum',
    preco: 300,
    bioma: 'floresta',
    drops: ['Ents jovens', 'Criaturas vegetais'],
    fusao: ['esmeralda', 'malaquita'],
    efeitos: {
      arma:      { desc: 'Ataques têm chance de prender inimigos com raízes', bonus: {}, status: { tipo: 'lentidao', chance: 0.12 } },
      armadura:  { desc: 'Aumenta regeneração natural em 8%', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Melhora efeitos de cura em 10%', bonus: { inteligencia: 1 } },
    },
  },

  citrino: {
    id: 'citrino',
    nome: 'Citrino',
    descricao: 'Pedra solar e energética, brilha sob a luz do deserto.',
    tipo: 'elemental',
    raridade: 'incomum',
    preco: 400,
    bioma: 'deserto',
    drops: ['Leões solares', 'Sacerdotes corrompidos'],
    fusao: ['pedra_do_sol'],
    efeitos: {
      arma:      { desc: '+20% dano de luz', bonus: { inteligencia: 1 } },
      armadura:  { desc: 'Resistência à luz em 30%', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Recupera energia durante o dia', bonus: {} },
    },
  },

  cornalina: {
    id: 'cornalina',
    nome: 'Cornalina',
    descricao: 'Pedra agressiva de combate, alimenta a fúria do guerreiro.',
    tipo: 'ofensiva',
    raridade: 'incomum',
    preco: 300,
    bioma: 'deserto',
    drops: ['Escorpiões gigantes', 'Guerreiros mortos-vivos'],
    fusao: ['granada', 'rubi'],
    efeitos: {
      arma:      { desc: '+20% dano crítico', bonus: { forca: 2 } },
      armadura:  { desc: 'Aumenta resistência a sangramento em 20%', bonus: {} },
      acessorio: { desc: 'Aumenta coragem e reduz medo', bonus: {} },
    },
  },

  hematita: {
    id: 'hematita',
    nome: 'Hematita',
    descricao: 'Pedra metálica gravitacional, extremamente resistente.',
    tipo: 'defensiva',
    raridade: 'incomum',
    preco: 300,
    bioma: 'montanhas',
    drops: ['Golens metálicos', 'Vermes subterrâneos'],
    fusao: ['diamante', 'jaspe'],
    efeitos: {
      arma:      { desc: 'Armas pesadas recebem +20% dano', bonus: { forca: 1 } },
      armadura:  { desc: 'Aumenta defesa em 25%, reduz velocidade em 10%', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Reduz chance de ser empurrado', bonus: {} },
    },
  },

  malaquita: {
    id: 'malaquita',
    nome: 'Malaquita',
    descricao: 'Pedra venenosa natural, exala toxinas perigosas.',
    tipo: 'elemental',
    raridade: 'incomum',
    preco: 400,
    bioma: 'pantano',
    drops: ['Serpentes gigantes', 'Sapos venenosos'],
    fusao: ['esmeralda', 'agata_musgosa'],
    efeitos: {
      arma:      { desc: 'Ataques aplicam veneno contínuo', bonus: {}, status: { tipo: 'veneno', chance: 0.15 } },
      armadura:  { desc: '30% resistência a veneno', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Permite detectar toxinas', bonus: {} },
    },
  },

  coral: {
    id: 'coral',
    nome: 'Coral',
    descricao: 'Pedra marítima viva, pulsando com energia oceânica.',
    tipo: 'elemental',
    raridade: 'incomum',
    preco: 300,
    bioma: 'maritimo',
    drops: ['Criaturas oceânicas', 'Crustáceos gigantes'],
    fusao: ['perola', 'opala_agua'],
    efeitos: {
      arma:      { desc: 'Ataques possuem dano aquático adicional', bonus: { inteligencia: 1 } },
      armadura:  { desc: '+30% resistência aquática', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Permite respiração subaquática temporária', bonus: {} },
    },
  },

  calcedonia: {
    id: 'calcedonia',
    nome: 'Calcedônia',
    descricao: 'Pedra de equilíbrio mágico, estabiliza o fluxo arcano.',
    tipo: 'suporte',
    raridade: 'incomum',
    preco: 400,
    bioma: 'montanhas',
    drops: ['Magos petrificados', 'Golens mágicos'],
    fusao: ['berilo', 'fluorita'],
    efeitos: {
      arma:      { desc: 'Magias ganham estabilidade e precisão', bonus: { inteligencia: 1 } },
      armadura:  { desc: '+15% resistência elemental geral', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Reduz falhas mágicas', bonus: {} },
    },
  },

  gota_de_chuva: {
    id: 'gota_de_chuva',
    nome: 'Gota de Chuva',
    descricao: 'Pedra aquática refinada, resfria e desacelera.',
    tipo: 'elemental',
    raridade: 'incomum',
    preco: 500,
    bioma: 'maritimo',
    drops: ['Criaturas aquáticas', 'Elementais de água'],
    fusao: ['safira_azul', 'coral'],
    efeitos: {
      arma:      { desc: 'Ataques possuem efeito de desaceleração', bonus: {}, status: { tipo: 'lentidao', chance: 0.12 } },
      armadura:  { desc: '+25% resistência aquática', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Reduz fadiga física', bonus: {} },
    },
  },

  // ── RARAS ─────────────────────────────────────────────

  diamante: {
    id: 'diamante',
    nome: 'Diamante',
    descricao: 'A mais resistente das pedras preciosas, brilha com luz pura.',
    tipo: 'ofensiva',
    raridade: 'rara',
    estado: 'bruta', // requer polimento antes de socketar
    preco: 800,
    bioma: 'montanhas',
    drops: ['Golens de diamante', 'Dragões jovens'],
    fusao: [],
    efeitos: {
      arma:      { desc: '+20% dano perfurante', bonus: { forca: 2 } },
      armadura:  { desc: '+20% defesa geral', bonus: { resistencia: 2 } },
      acessorio: { desc: '+10% resistência mágica', bonus: { inteligencia: 1 } },
      golem:     { desc: 'Golem ganha +15% armadura e dano', bonus: { resistencia: 3, forca: 1 } },
    },
  },

  safira_azul: {
    id: 'safira_azul',
    nome: 'Safira Azul',
    descricao: 'Gema glacial que congela o ar ao redor.',
    tipo: 'elemental',
    raridade: 'rara',
    preco: 600,
    bioma: 'neve',
    drops: ['Elementais de gelo', 'Lobos glaciais'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Ataques podem congelar inimigos', bonus: { inteligencia: 1 }, status: { tipo: 'congelamento', chance: 0.15 } },
      armadura:  { desc: '+35% resistência ao gelo', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Reduz dano de gelo recebido', bonus: {} },
    },
  },

  ametista: {
    id: 'ametista',
    nome: 'Ametista',
    descricao: 'Cristal psíquico que amplifica o poder mental.',
    tipo: 'psiquica',
    raridade: 'rara',
    estado: 'polido',
    preco: 600,
    bioma: 'masmorra',
    drops: ['Espectros', 'Cultistas'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Magias psíquicas causam +20% dano', bonus: { inteligencia: 2 } },
      armadura:  { desc: '+25% resistência psíquica', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Melhora concentração mágica', bonus: { inteligencia: 1 } },
      golem:     { desc: 'Golem amplifica magia psíquica', bonus: { inteligencia: 2 } },
    },
  },

  esmeralda: {
    id: 'esmeralda',
    nome: 'Esmeralda',
    descricao: 'Pedra da natureza, pulsa com vida e equilíbrio.',
    tipo: 'suporte',
    raridade: 'rara',
    preco: 600,
    bioma: 'floresta',
    drops: ['Espíritos naturais', 'Monges corrompidos'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Melhora magias de suporte e cura em 15%', bonus: { inteligencia: 1 } },
      armadura:  { desc: 'Aumenta resistência a veneno e maldição em 20%', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Reduz estresse mental e medo', bonus: {} },
    },
  },

  pedra_de_sangue: {
    id: 'pedra_de_sangue',
    nome: 'Pedra de Sangue',
    descricao: 'Pedra sombria que drena a vida dos inimigos.',
    tipo: 'ofensiva',
    raridade: 'rara',
    estado: 'polido',
    preco: 600,
    bioma: 'masmorra',
    drops: ['Vampiros', 'Criaturas sanguinárias'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Ataques drenam pequena quantidade de vida', bonus: { forca: 1 }, status: { tipo: 'sangramento', chance: 0.15 } },
      armadura:  { desc: 'Regenera vida lentamente após receber dano', bonus: {} },
      acessorio: { desc: 'Aumenta resistência a dor em 25%', bonus: { resistencia: 1 } },
      golem:     { desc: 'Golem drena vida dos inimigos', bonus: { forca: 2 } },
    },
  },

  pedra_da_lua: {
    id: 'pedra_da_lua',
    nome: 'Pedra da Lua',
    descricao: 'Pedra misteriosa que brilha com luz lunar prateada.',
    tipo: 'psiquica',
    raridade: 'rara',
    preco: 600,
    bioma: 'floresta',
    drops: ['Lobos lunares', 'Espíritos noturnos'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Ataques recebem bônus durante a noite', bonus: { inteligencia: 1 } },
      armadura:  { desc: '+20% resistência mágica noturna', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Regeneração de mana dobrada à noite', bonus: {} },
    },
  },

  berilo: {
    id: 'berilo',
    nome: 'Berilo',
    descricao: 'Pedra mágica refinada, amplifica o poder arcano.',
    tipo: 'ofensiva',
    raridade: 'rara',
    preco: 500,
    bioma: 'montanhas',
    drops: ['Magos cristalizados', 'Golens mágicos'],
    fusao: ['safira_azul', 'ametista'],
    efeitos: {
      arma:      { desc: '+15% dano mágico', bonus: { inteligencia: 2 } },
      armadura:  { desc: '15% resistência mágica geral', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Aumenta mana máxima em 20%', bonus: { inteligencia: 2 } },
    },
  },

  crisolito: {
    id: 'crisolito',
    nome: 'Crisólito',
    descricao: 'Pedra elemental de vento, carrega rajadas cortantes.',
    tipo: 'elemental',
    raridade: 'rara',
    preco: 600,
    bioma: 'deserto',
    drops: ['Elementais de vento', 'Aves gigantes'],
    fusao: ['safira_azul', 'quartzo'],
    efeitos: {
      arma:      { desc: 'Ataques cortantes ganham rajadas de vento', bonus: { destreza: 1 } },
      armadura:  { desc: 'Aumenta velocidade em 15%', bonus: { reflexos: 1 } },
      acessorio: { desc: 'Reduz dano de queda', bonus: {} },
    },
  },

  fluorita: {
    id: 'fluorita',
    nome: 'Fluorita',
    descricao: 'Pedra arcana instável, libera能量 caótica.',
    tipo: 'psiquica',
    raridade: 'rara',
    preco: 700,
    bioma: 'masmorra',
    drops: ['Espectros mágicos', 'Golens arcanos'],
    fusao: ['ametista', 'pedra_da_lua'],
    efeitos: {
      arma:      { desc: 'Magias possuem 10% chance de dano extra aleatório', bonus: { inteligencia: 1 } },
      armadura:  { desc: 'Aumenta resistência psíquica em 20%', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Melhora concentração mágica', bonus: {} },
    },
  },

  granada: {
    id: 'granada',
    nome: 'Granada',
    descricao: 'Pedra ofensiva de sangue e fogo, alimenta a brutalidade.',
    tipo: 'ofensiva',
    raridade: 'rara',
    preco: 500,
    bioma: 'montanhas',
    drops: ['Golens guerreiros', 'Ogros'],
    fusao: ['rubi', 'cornalina'],
    efeitos: {
      arma:      { desc: '+25% dano físico', bonus: { forca: 2 } },
      armadura:  { desc: 'Aumenta resistência física em 15%', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Aumenta força em 10%', bonus: { forca: 1 } },
    },
  },

  jade: {
    id: 'jade',
    nome: 'Jade',
    descricao: 'Pedra espiritual de equilíbrio, mantém a paz interior.',
    tipo: 'suporte',
    raridade: 'rara',
    preco: 800,
    bioma: 'floresta',
    drops: ['Espíritos naturais', 'Monges corrompidos'],
    fusao: ['esmeralda', 'ambar'],
    efeitos: {
      arma:      { desc: 'Melhora magias de suporte e cura em 15%', bonus: { inteligencia: 1 } },
      armadura:  { desc: 'Aumenta resistência a veneno e maldição em 20%', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Reduz estresse mental e medo', bonus: {} },
    },
  },

  ambar: {
    id: 'ambar',
    nome: 'Âmbar',
    descricao: 'Pedra natural ancestral, preservou segredos por eras.',
    tipo: 'defensiva',
    raridade: 'rara',
    preco: 250,
    bioma: 'floresta',
    drops: ['Insetos gigantes', 'Aranhas venenosas'],
    fusao: ['citrino', 'jade'],
    efeitos: {
      arma:      { desc: 'Ataques possuem chance de lentidão', bonus: {}, status: { tipo: 'lentidao', chance: 0.12 } },
      armadura:  { desc: 'Resistência contra veneno em 30%', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Permite detectar venenos próximos', bonus: {} },
    },
  },

  almandina: {
    id: 'almandina',
    nome: 'Almandina',
    descricao: 'Granada sombria de combate, intensifica a fúria.',
    tipo: 'ofensiva',
    raridade: 'rara',
    preco: 600,
    bioma: 'montanhas',
    drops: ['Golens guerreiros', 'Lobos sanguinários'],
    fusao: ['granada', 'pedra_de_sangue'],
    efeitos: {
      arma:      { desc: 'Ataques críticos causam sangramento intenso', bonus: { forca: 1 }, status: { tipo: 'sangramento', chance: 0.20 } },
      armadura:  { desc: '+25% resistência física e +15% resistência a sangue', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Aumenta força em 12%', bonus: { forca: 1 } },
    },
  },

  aventurina: {
    id: 'aventurina',
    nome: 'Aventurina',
    descricao: 'Pedra de sorte e vento, traz fortuna ao aventureiro.',
    tipo: 'suporte',
    raridade: 'rara',
    preco: 500,
    bioma: 'floresta',
    drops: ['Fadas', 'Espíritos do vento'],
    fusao: ['crisolito', 'quartzo'],
    efeitos: {
      arma:      { desc: 'Aumenta chance crítica em 10%', bonus: { destreza: 1 } },
      armadura:  { desc: '+15% evasão', bonus: { reflexos: 1 } },
      acessorio: { desc: 'Melhora sorte em drops raros', bonus: {} },
    },
  },

  azurita: {
    id: 'azurita',
    nome: 'Azurita',
    descricao: 'Pedra arcana aquática, canaliza o poder dos oceanos.',
    tipo: 'elemental',
    raridade: 'rara',
    preco: 700,
    bioma: 'maritimo',
    drops: ['Golens marítimos', 'Serpentes aquáticas'],
    fusao: ['safira_azul', 'opala_agua'],
    efeitos: {
      arma:      { desc: '+25% dano de água', bonus: { inteligencia: 1 } },
      armadura:  { desc: '+30% resistência mágica aquática', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Reduz consumo de mana aquática', bonus: {} },
    },
  },

  boakhar: {
    id: 'boakhar',
    nome: 'Boakhar',
    descricao: 'Pedra brutal de impacto, esmaga tudo em seu caminho.',
    tipo: 'ofensiva',
    raridade: 'rara',
    preco: 800,
    bioma: 'montanhas',
    drops: ['Golens colossais', 'Gigantes de pedra'],
    fusao: ['hematita', 'diamante'],
    efeitos: {
      arma:      { desc: 'Martelos e maças recebem +30% dano', bonus: { forca: 2 } },
      armadura:  { desc: '+35% resistência a impacto', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Reduz atordoamento em 40%', bonus: {} },
    },
  },

  crisocola: {
    id: 'crisocola',
    nome: 'Crisocola',
    descricao: 'Pedra de suporte aquático, acalma e protege.',
    tipo: 'suporte',
    raridade: 'rara',
    preco: 500,
    bioma: 'maritimo',
    drops: ['Sereias', 'Espíritos aquáticos'],
    fusao: ['perola', 'safira_azul'],
    efeitos: {
      arma:      { desc: 'Ataques podem reduzir agressividade inimiga', bonus: {}, status: { tipo: 'lentidao', chance: 0.10 } },
      armadura:  { desc: '+20% resistência a água e veneno', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Melhora magias de suporte em 15%', bonus: { inteligencia: 1 } },
    },
  },

  crisoprasio: {
    id: 'crisoprasio',
    nome: 'Crisoprásio',
    descricao: 'Pedra natural energética, renova o vigor do portador.',
    tipo: 'suporte',
    raridade: 'rara',
    preco: 600,
    bioma: 'floresta',
    drops: ['Ents antigos', 'Javalis mágicos'],
    fusao: ['jade', 'esmeralda'],
    efeitos: {
      arma:      { desc: 'Ataques naturais recebem dano extra', bonus: { forca: 1 } },
      armadura:  { desc: 'Aumenta regeneração de energia em 15%', bonus: {} },
      acessorio: { desc: 'Reduz fadiga física', bonus: {} },
    },
  },

  diopsidio: {
    id: 'diopsidio',
    nome: 'Diopsídio',
    descricao: 'Pedra elemental terrestre, racha o solo sob os pés.',
    tipo: 'elemental',
    raridade: 'rara',
    preco: 500,
    bioma: 'montanhas',
    drops: ['Golens terrestres', 'Gigantes rochosos'],
    fusao: ['jaspe', 'hematita'],
    efeitos: {
      arma:      { desc: 'Ataques causam rachaduras no solo', bonus: { forca: 1 } },
      armadura:  { desc: '+20% resistência física e elétrica', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Melhora estabilidade corporal', bonus: { reflexos: 1 } },
    },
  },

  euclasio: {
    id: 'euclasio',
    nome: 'Euclásio',
    descricao: 'Pedra de precisão, nunca erra o alvo.',
    tipo: 'ofensiva',
    raridade: 'rara',
    preco: 800,
    bioma: 'neve',
    drops: ['Águias glaciais', 'Arqueiros fantasmas'],
    fusao: ['quartzo_azul', 'safira_azul'],
    efeitos: {
      arma:      { desc: 'Aumenta precisão crítica em 20%', bonus: { destreza: 2 } },
      armadura:  { desc: '+15% evasão e precisão defensiva', bonus: { reflexos: 1 } },
      acessorio: { desc: 'Reduz dificuldade de ataques à distância', bonus: {} },
    },
  },

  essonita: {
    id: 'essonita',
    nome: 'Essonita',
    descricao: 'Granada espiritual que perturba a mente dos inimigos.',
    tipo: 'psiquica',
    raridade: 'rara',
    preco: 700,
    bioma: 'masmorra',
    drops: ['Espectros mentais', 'Cultistas'],
    fusao: ['ametista', 'fluorita'],
    efeitos: {
      arma:      { desc: 'Ataques causam confusão mental', bonus: {}, status: { tipo: 'cegueira', chance: 0.10 } },
      armadura:  { desc: '+20% resistência psíquica', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Melhora foco e concentração', bonus: {} },
    },
  },

  hialino: {
    id: 'hialino',
    nome: 'Hialino',
    descricao: 'Cristal puro de mana, amplifica todo o poder arcano.',
    tipo: 'psiquica',
    raridade: 'rara',
    preco: 600,
    bioma: 'montanhas',
    drops: ['Golens cristalinos', 'Espíritos mágicos'],
    fusao: ['quartzo', 'berilo'],
    efeitos: {
      arma:      { desc: 'Magias ganham maior estabilidade', bonus: { inteligencia: 1 } },
      armadura:  { desc: '+20% resistência mágica geral', bonus: { inteligencia: 1 } },
      acessorio: { desc: 'Aumenta regeneração de mana em 12%', bonus: {} },
    },
  },

  jacinto: {
    id: 'jacinto',
    nome: 'Jacinto',
    descricao: 'Pedra flamejante espiritual, arde com fogo puro.',
    tipo: 'elemental',
    raridade: 'rara',
    preco: 700,
    bioma: 'vulcanico',
    drops: ['Fênix menores', 'Espíritos flamejantes'],
    fusao: ['rubi', 'citrino'],
    efeitos: {
      arma:      { desc: 'Ataques causam queimaduras espirituais', bonus: { inteligencia: 1 }, status: { tipo: 'queimadura', chance: 0.15 } },
      armadura:  { desc: '+25% resistência a fogo e luz', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Reduz medo e maldição em 20%', bonus: {} },
    },
  },

  olho_de_lince: {
    id: 'olho_de_lince',
    nome: 'Olho de Lince',
    descricao: 'Pedra de percepção extrema, nada escapa ao olhar.',
    tipo: 'ofensiva',
    raridade: 'rara',
    preco: 800,
    bioma: 'floresta',
    drops: ['Lince gigantes', 'Arqueiros fantasmas'],
    fusao: ['euclasio'],
    efeitos: {
      arma:      { desc: 'Armas de longa distância recebem +25% precisão', bonus: { destreza: 1 } },
      armadura:  { desc: '+15% evasão e percepção', bonus: { reflexos: 1 } },
      acessorio: { desc: 'Permite detectar armadilhas ocultas', bonus: {} },
    },
  },

  // ── ÉPICAS ────────────────────────────────────────────

  obsidiana: {
    id: 'obsidiana',
    nome: 'Obsidiana',
    descricao: 'Vidro vulcânico cortante, afiado como a morte.',
    tipo: 'ofensiva',
    raridade: 'epica',
    estado: 'bruta', // requer polimento antes de socketar
    preco: 1000,
    bioma: 'vulcanico',
    drops: ['Elementais de magma', 'Dragões jovens'],
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
    descricao: 'Pedra arcana sagrada, guardiã do conhecimento antigo.',
    tipo: 'psiquica',
    raridade: 'epica',
    estado: 'polido',
    preco: 1200,
    bioma: 'masmorra',
    drops: ['Arcanistas mortos-vivos', 'Golens mágicos'],
    fusao: [],
    efeitos: {
      arma:      { desc: '+25% dano mágico e +15% mana', bonus: { inteligencia: 3 } },
      armadura:  { desc: '+30% resistência mágica', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Aumenta mana máxima em 25%', bonus: { inteligencia: 2 } },
      golem:     { desc: 'Golem mágico conjura +1 feitiço', bonus: { inteligencia: 3 } },
    },
  },

  alexandrite: {
    id: 'alexandrite',
    nome: 'Alexandrite',
    descricao: 'Pedra rara de adaptação elemental, muda de cor conforme o ambiente.',
    tipo: 'adaptativa',
    raridade: 'epica',
    preco: 1000,
    bioma: 'masmorra',
    drops: ['Golens arcanos', 'Quimeras mágicas'],
    fusao: ['safira_azul', 'rubi', 'opala'],
    efeitos: {
      arma:      { desc: 'Arma muda elemento conforme o ambiente', bonus: { inteligencia: 2 } },
      armadura:  { desc: 'Adapta resistência ao último elemento recebido em 25%', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Aumenta resistência mágica geral em 15%', bonus: { inteligencia: 1 } },
    },
  },

  perola_negra: {
    id: 'perola_negra',
    nome: 'Pérola Negra',
    descricao: 'Pérola abissal, absorve luz e esperança.',
    tipo: 'ofensiva',
    raridade: 'epica',
    preco: 1000,
    bioma: 'maritimo',
    drops: ['Leviatãs', 'Espíritos oceânicos'],
    fusao: [],
    efeitos: {
      arma:      { desc: '+30% dano sombrio', bonus: { forca: 2 } },
      armadura:  { desc: '+25% resistência a escuridão', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Reduz dano de trevas recebido', bonus: {} },
    },
  },

  opala_negra: {
    id: 'opala_negra',
    nome: 'Opala Negra',
    descricao: 'Pedra sombria que devora a luz, fonte de poder proibido.',
    tipo: 'ofensiva',
    raridade: 'epica',
    preco: 1200,
    bioma: 'pantano',
    drops: ['Vampiros', 'Espectros reais'],
    fusao: [],
    efeitos: {
      arma:      { desc: '+35% dano de trevas e drenagem de vida', bonus: { forca: 2 }, status: { tipo: 'sangramento', chance: 0.15 } },
      armadura:  { desc: '+30% resistência a escuridão', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Regeneração de vida à noite', bonus: {} },
    },
  },

  quartzo_azul: {
    id: 'quartzo_azul',
    nome: 'Quartzo Azul',
    descricao: 'Quartzo cristalino com veios de energia elétrica.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 900,
    bioma: 'montanhas',
    drops: ['Elementais elétricos', 'Aves tempestuosas'],
    fusao: [],
    efeitos: {
      arma:      { desc: '+25% dano elétrico', bonus: { destreza: 2 } },
      armadura:  { desc: '+30% resistência elétrica', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Aumenta velocidade de conjuração', bonus: { reflexos: 1 } },
    },
  },

  belijuri: {
    id: 'belijuri',
    nome: 'Belijuri',
    descricao: 'Pedra espiritual rara, anula magias e protege a mente.',
    tipo: 'psiquica',
    raridade: 'epica',
    preco: 900,
    bioma: 'masmorra',
    drops: ['Espectros antigos', 'Sacerdotes amaldiçoados'],
    fusao: ['ametista', 'jade'],
    efeitos: {
      arma:      { desc: 'Ataques possuem chance de silenciar magia', bonus: {}, status: { tipo: 'cegueira', chance: 0.12 } },
      armadura:  { desc: '+20% resistência espiritual', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Protege contra possessão', bonus: {} },
    },
  },

  crisoberilo: {
    id: 'crisoberilo',
    nome: 'Crisoberilo',
    descricao: 'Pedra de luz concentrada, cega os inimigos com seu brilho.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1200,
    bioma: 'deserto',
    drops: ['Leões solares', 'Espíritos dourados'],
    fusao: ['citrino', 'pedra_do_sol'],
    efeitos: {
      arma:      { desc: '+35% dano de luz', bonus: { inteligencia: 2 } },
      armadura:  { desc: '+25% resistência à luz', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Melhora visão noturna e percepção', bonus: { reflexos: 1 } },
    },
  },

  demontoide: {
    id: 'demontoide',
    nome: 'Demontóide',
    descricao: 'Pedra venenosa rara, exala névoa tóxica mortal.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1000,
    bioma: 'pantano',
    drops: ['Hidras venenosas', 'Criaturas tóxicas'],
    fusao: ['malaquita', 'ambar'],
    efeitos: {
      arma:      { desc: 'Venenos aplicados duram mais 50%', bonus: {}, status: { tipo: 'veneno', chance: 0.20, turnos_extra: 1 } },
      armadura:  { desc: '+35% resistência a veneno', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Permite detectar criaturas ocultas', bonus: {} },
    },
  },

  dioptase: {
    id: 'dioptase',
    nome: 'Dioptase',
    descricao: 'Pedra de mana pura, o auge do poder arcano.',
    tipo: 'psiquica',
    raridade: 'epica',
    preco: 1400,
    bioma: 'masmorra',
    drops: ['Arcanistas mortos-vivos', 'Golens mágicos'],
    fusao: ['lapis_lazuli', 'fluorita'],
    efeitos: {
      arma:      { desc: 'Magias recebem +20% dano', bonus: { inteligencia: 3 } },
      armadura:  { desc: '+35% mana máxima', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Recupera mana lentamente fora de combate', bonus: {} },
    },
  },

  hidrofano: {
    id: 'hidrofano',
    nome: 'Hidrofano',
    descricao: 'Opala aquática rara, controla as correntes oceânicas.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1200,
    bioma: 'maritimo',
    drops: ['Leviatãs', 'Espíritos oceânicos'],
    fusao: ['opala_agua', 'coral'],
    efeitos: {
      arma:      { desc: 'Ataques aquáticos drenam stamina', bonus: { inteligencia: 2 } },
      armadura:  { desc: '+40% resistência à água', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Permite respirar debaixo d\'água', bonus: {} },
    },
  },

  iolita: {
    id: 'iolita',
    nome: 'Iolita',
    descricao: 'Pedra temporal e psíquica, distorce o fluxo do tempo.',
    tipo: 'psiquica',
    raridade: 'epica',
    preco: 1500,
    bioma: 'masmorra',
    drops: ['Magos temporais', 'Espectros antigos'],
    fusao: ['pedra_da_lua', 'fluorita'],
    efeitos: {
      arma:      { desc: 'Pequena chance de retardar inimigos', bonus: {}, status: { tipo: 'lentidao', chance: 0.15 } },
      armadura:  { desc: '+15% resistência temporal', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Melhora percepção temporal', bonus: {} },
    },
  },

  idicolita: {
    id: 'idicolita',
    nome: 'Idicolita',
    descricao: 'Turmalina elemental, canaliza raios devastadores.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1000,
    bioma: 'montanhas',
    drops: ['Elementais elétricos', 'Aves tempestuosas'],
    fusao: ['quartzo_azul', 'safira_azul'],
    efeitos: {
      arma:      { desc: 'Ataques elétricos recebem +25% dano', bonus: { destreza: 2 } },
      armadura:  { desc: '+30% resistência elétrica', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Aumenta velocidade de conjuração elétrica', bonus: {} },
    },
  },

  moonbar: {
    id: 'moonbar',
    nome: 'Moonbar',
    descricao: 'Pedra lunar misteriosa, multiplica o poder sob a lua cheia.',
    tipo: 'psiquica',
    raridade: 'epica',
    preco: 1400,
    bioma: 'neve',
    drops: ['Lobos lunares', 'Espíritos noturnos'],
    fusao: ['pedra_da_lua', 'perola_negra'],
    efeitos: {
      arma:      { desc: 'Ataques recebem bônus durante a noite', bonus: { inteligencia: 2 } },
      armadura:  { desc: '+20% resistência mágica noturna', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Regeneração de mana dobrada à noite', bonus: {} },
    },
  },

  pedra_do_sol: {
    id: 'pedra_do_sol',
    nome: 'Pedra do Sol',
    descricao: 'Pedra elemental solar, brilha com o fogo das estrelas.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1500,
    bioma: 'deserto',
    drops: ['Leões solares', 'Sacerdotes solares'],
    fusao: ['citrino', 'rubi_estrela'],
    efeitos: {
      arma:      { desc: '+40% dano de luz', bonus: { inteligencia: 3 } },
      armadura:  { desc: '+35% resistência à luz e fogo', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Regenera energia durante o dia', bonus: {} },
    },
  },

  opala_agua: {
    id: 'opala_agua',
    nome: 'Opala de Água',
    descricao: 'Opala elemental aquática, controla os mares.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1200,
    bioma: 'maritimo',
    drops: ['Leviatãs', 'Sereias mágicas'],
    fusao: ['safira_azul', 'hidrofano'],
    efeitos: {
      arma:      { desc: 'Ataques causam pressão aquática adicional', bonus: { inteligencia: 2 } },
      armadura:  { desc: '+40% resistência aquática', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Permite respiração submersa contínua', bonus: {} },
    },
  },

  estrela_dagua: {
    id: 'estrela_dagua',
    nome: 'Estrela d\'Água',
    descricao: 'Pedra oceânica celestial, cega com luz aquática.',
    tipo: 'elemental',
    raridade: 'epica',
    preco: 1000,
    bioma: 'maritimo',
    drops: ['Espíritos oceânicos antigos'],
    fusao: ['opala_agua', 'perola'],
    efeitos: {
      arma:      { desc: 'Ataques aquáticos brilham e cegam inimigos', bonus: { inteligencia: 2 }, status: { tipo: 'cegueira', chance: 0.12 } },
      armadura:  { desc: '+30% resistência a água e luz', bonus: { resistencia: 2 } },
      acessorio: { desc: 'Melhora magias de suporte aquático', bonus: {} },
    },
  },

  lagrimas_vermelhas: {
    id: 'lagrimas_vermelhas',
    nome: 'Lágrimas Vermelhas',
    descricao: 'Pedra de sangue amaldiçoada, absorve energia vital.',
    tipo: 'ofensiva',
    raridade: 'epica',
    preco: 1500,
    bioma: 'pantano',
    drops: ['Vampiros', 'Criaturas sanguinárias'],
    fusao: ['pedra_de_sangue', 'rubi'],
    efeitos: {
      arma:      { desc: 'Ataques absorvem pequena quantidade de vida', bonus: { forca: 2 }, status: { tipo: 'sangramento', chance: 0.20 } },
      armadura:  { desc: 'Recupera vida lentamente após receber dano', bonus: {} },
      acessorio: { desc: 'Aumenta resistência a dor em 25%', bonus: {} },
    },
  },

  // ── LENDÁRIAS ─────────────────────────────────────────

  rubi_estrela: {
    id: 'rubi_estrela',
    nome: 'Rubi Estrela',
    descricao: 'Rubi celestial que arde com chamas estelares.',
    tipo: 'elemental',
    raridade: 'lendaria',
    preco: 2000,
    bioma: 'vulcanico',
    drops: ['Dragões antigos', 'Fênix'],
    fusao: ['pedra_do_sol', 'diamante'],
    efeitos: {
      arma:      { desc: 'Ataques flamejantes podem explodir', bonus: { forca: 3 }, status: { tipo: 'queimadura', chance: 0.25 } },
      armadura:  { desc: '+45% resistência a fogo e luz', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Aumenta ataque mágico em 20%', bonus: { inteligencia: 3 } },
    },
  },

  safira_estrela: {
    id: 'safira_estrela',
    nome: 'Safira Estrela',
    descricao: 'Safira celestial congelante, cria tempestades de gelo.',
    tipo: 'elemental',
    raridade: 'lendaria',
    preco: 2000,
    bioma: 'neve',
    drops: ['Dragões glaciais', 'Espíritos da neve'],
    fusao: ['safira_azul', 'opala_agua'],
    efeitos: {
      arma:      { desc: 'Ataques podem congelar áreas inteiras', bonus: { inteligencia: 3 }, status: { tipo: 'congelamento', chance: 0.25 } },
      armadura:  { desc: '+45% resistência a gelo e água', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Aumenta mana máxima em 25%', bonus: { inteligencia: 2 } },
    },
  },

  corindon: {
    id: 'corindon',
    nome: 'Coríndon',
    descricao: 'Pedra lendária de reforço, a mais resistente que existe.',
    tipo: 'defensiva',
    raridade: 'lendaria',
    preco: 1800,
    bioma: 'montanhas',
    drops: ['Dragões minerais', 'Golens anciões'],
    fusao: ['diamante', 'safira_azul'],
    efeitos: {
      arma:      { desc: '+25% dano físico e mágico', bonus: { forca: 2, inteligencia: 2 } },
      armadura:  { desc: '+40% resistência física', bonus: { resistencia: 4 } },
      acessorio: { desc: 'Reduz dano crítico recebido', bonus: {} },
    },
  },

  irtios: {
    id: 'irtios',
    nome: 'Irtios',
    descricao: 'Pedra sombria proibida, canaliza dor pura.',
    tipo: 'ofensiva',
    raridade: 'lendaria',
    preco: 2000,
    bioma: 'masmorra',
    drops: ['Assassinos amaldiçoados', 'Espectros reais'],
    fusao: ['pedra_de_sangue', 'opala_negra'],
    efeitos: {
      arma:      { desc: 'Magias de dor causam +30% dano', bonus: { forca: 2, inteligencia: 2 } },
      armadura:  { desc: '+35% resistência a escuridão e dor', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Reduz dano de magia de dor em 15%', bonus: {} },
    },
  },

  lagrima_do_rei: {
    id: 'lagrima_do_rei',
    nome: 'Lágrima do Rei',
    descricao: 'Pedra sagrada real, anula ilusões e protege a mente.',
    tipo: 'suporte',
    raridade: 'lendaria',
    preco: 3000,
    bioma: 'masmorra',
    drops: ['Guardiões reais', 'Cavaleiros antigos'],
    fusao: ['citrino', 'pedra_da_lua'],
    efeitos: {
      arma:      { desc: 'Ataques possuem aura sagrada', bonus: { inteligencia: 3 } },
      armadura:  { desc: '+40% resistência a maldição e escuridão', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Aumenta influência e resistência mental', bonus: {} },
    },
  },

  lagrima_de_laeral: {
    id: 'lagrima_de_laeral',
    nome: 'Lágrima de Laeral',
    descricao: 'Pedra espiritual ancestral, detecta magia invisível.',
    tipo: 'psiquica',
    raridade: 'lendaria',
    preco: 2500,
    bioma: 'neve',
    drops: ['Espíritos antigos', 'Magos lendários'],
    fusao: ['iolita', 'ametista'],
    efeitos: {
      arma:      { desc: 'Ataques podem atravessar ilusões', bonus: { inteligencia: 3 } },
      armadura:  { desc: '+25% resistência espiritual e temporal', bonus: { inteligencia: 2 } },
      acessorio: { desc: 'Melhora percepção mágica', bonus: { reflexos: 2 } },
    },
  },

  pedra_maravilha: {
    id: 'pedra_maravilha',
    nome: 'Pedra Maravilha',
    descricao: 'Pedra lendária caótica, seus efeitos são imprevisíveis.',
    tipo: 'caotica',
    raridade: 'lendaria',
    preco: 4000,
    bioma: 'masmorra',
    drops: ['Chefes lendários', 'Entidades desconhecidas'],
    fusao: ['qualquer'],
    efeitos: {
      arma:      { desc: 'Ataques possuem efeitos aleatórios elementais', bonus: { forca: 1, inteligencia: 1, destreza: 1 } },
      armadura:  { desc: 'Adapta resistências aleatoriamente durante combate', bonus: { resistencia: 1 } },
      acessorio: { desc: 'Aumenta sorte e mana em 20%', bonus: { inteligencia: 1, reflexos: 1 } },
    },
  },

  // ── FUSÕES LENDÁRIAS ──────────────────────────────────

  obsidiana_ardente: {
    id: 'obsidiana_ardente',
    nome: 'Obsidiana Ardente',
    descricao: 'Fusão de Obsidiana e Ágata de Fogo. Arde sem cessar.',
    tipo: 'elemental',
    raridade: 'lendaria',
    preco: 3000,
    bioma: 'vulcanico',
    drops: [],
    fusao_requisito: ['obsidiana', 'agata_fogo'],
    fusao: [],
    efeitos: {
      arma:      { desc: '+55% dano de fogo', bonus: { forca: 3 }, status: { tipo: 'queimadura', chance: 0.30 } },
      armadura:  { desc: '+40% resistência ao fogo', bonus: { resistencia: 3 } },
      acessorio: { desc: 'Usuário sofre dano leve em ambientes frios', bonus: {} },
    },
  },

  cristal_lunar: {
    id: 'cristal_lunar',
    nome: 'Cristal Lunar',
    descricao: 'Fusão de Pedra da Lua e Ametista. Amplifica magia psíquica.',
    tipo: 'psiquica',
    raridade: 'lendaria',
    preco: 3500,
    bioma: 'masmorra',
    drops: [],
    fusao_requisito: ['pedra_da_lua', 'ametista'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Amplifica magia psíquica e suporte em 45%', bonus: { inteligencia: 4 } },
      armadura:  { desc: '+40% resistência psíquica', bonus: { inteligencia: 3 } },
      acessorio: { desc: 'Dobra eficiência de magias de suporte', bonus: { inteligencia: 2 } },
    },
  },

  rubi_abissal: {
    id: 'rubi_abissal',
    nome: 'Rubi Abissal',
    descricao: 'Fusão de Rubi e Pedra de Sangue. Drena a vida dos inimigos.',
    tipo: 'ofensiva',
    raridade: 'lendaria',
    preco: 3500,
    bioma: 'masmorra',
    drops: [],
    fusao_requisito: ['rubi', 'pedra_de_sangue'],
    fusao: [],
    efeitos: {
      arma:      { desc: 'Ataques drenam vida inimiga', bonus: { forca: 3 }, status: { tipo: 'sangramento', chance: 0.25 } },
      armadura:  { desc: 'Regeneração de vida constante', bonus: {} },
      acessorio: { desc: 'Usuário sofre dor contínua após batalhas longas', bonus: {} },
    },
  },
};

export const GEM_LIST = Object.values(GEMS);
export const GEM_IDS = Object.keys(GEMS);

// Preço de loja (em moedas) por raridade, quando a gema não define `preco`.
export const RARITY_PRICE = {
  comum: 250,
  incomum: 600,
  rara: 1200,
  epica: 2500,
  lendaria: 5000,
};

export function gemPrice(gem) {
  if (!gem) return 0;
  return gem.preco || RARITY_PRICE[gem.raridade] || 250;
}

// Veios de mineração — espelho do servidor para o modo offline funcionar.
export const MINERA_VEIOS = [
  {
    id: 'veio_comum',
    nome: 'Veio Comum',
    descricao: 'Pedras soltas na superfície. Grátis, mas com espera curta.',
    custoCents: 0,
    cooldownMin: 10,
    chanceBonus: 0,
    biomas: ['montanhas', 'floresta', 'plains'],
  },
  {
    id: 'veio_montanha',
    nome: 'Veio da Montanha',
    descricao: 'Veio de rocha dura: boas chances de gemas raras.',
    custoCents: 50,
    cooldownMin: 15,
    chanceBonus: 10,
    biomas: ['montanhas', 'neve'],
  },
  {
    id: 'veio_vulcanico',
    nome: 'Veio Vulcânico',
    descricao: 'Magma cristalizado. Gemas épicas aparecem com mais frequência.',
    custoCents: 150,
    cooldownMin: 25,
    chanceBonus: 18,
    biomas: ['vulcanico', 'deserto'],
  },
  {
    id: 'veio_masmorra',
    nome: 'Veio Profundo',
    descricao: 'Fissura nas profundezas das masmorras. A melhor chance de lendárias.',
    custoCents: 300,
    cooldownMin: 40,
    chanceBonus: 28,
    biomas: ['masmorra', 'pantano', 'maritimo'],
  },
];

export function getGemsByRarity(rarity) {
  return GEM_LIST.filter((g) => g.raridade === rarity);
}

export function getGemById(id) {
  return GEMS[id] || null;
}

// Retorna true se a gema está em estado bruto (requer polimento p/ socketar).
export function gemIsRaw(id) {
  const g = GEMS[id];
  return !!g && g.estado === 'bruta';
}

// Retorna os slots de equipamento em que a gema tem efeito definido.
export function gemEffectSlots(id) {
  const g = GEMS[id];
  if (!g?.efeitos) return [];
  return Object.keys(g.efeitos);
}

// ────────────────────────────────────────────────────────────────
// SISTEMA DE FUSÃO DE PEDRAS (GemForge)
// Estrutura do Mestre: gemas com estado 'bruta'/'polido', custo da
// fusão EXCLUSIVAMENTE em Mana (custoFusaoMana) e tabela de receitas.
// ────────────────────────────────────────────────────────────────

export const gemas = [
  {
    id: 'obsidiana',
    nome: 'Obsidiana',
    tipo: 'Elemental (Fogo/Escuridão)',
    raridade: 'Rara',
    preco: { ouro: 5 },
    estado: 'polido',
    bioma: ['Terrenos Vulcânicos'],
    custoFusaoMana: 30,
    efeitos: {
      armadura: {
        desc: '+25% resistência a fogo e escuridão',
        bonus: { resistencia: 2 },
        resistenciaFogo: 35,
        resistenciaEscuridao: 35,
        debuff: { danoImpacto: 15 },
      },
      arma: {
        desc: '+30% dano cortante e de fogo',
        bonus: { forca: 2, destreza: 1 },
        danoLamina: 15,
        danoMagiaFogo: 20,
      },
      acessorio: {
        desc: 'Resistência a fogo e maldição',
        bonus: { resistencia: 1 },
        resistenciaFogo: 25,
        resistenciaMaldicao: 25,
      },
      golem: {
        desc: 'Golem +25% resistente ao fogo',
        bonus: { resistencia: 2 },
        imunidadeFogo: true,
        imunidadeEscuridao: true,
        fraquezaImpacto: 25,
      },
    },
    fusoesCompativeis: ['agataDeFogo', 'rubi', 'granada'],
    descricao: 'Pedra vulcânica elemental. Precisa ser encantada antes da forja.'
  },
  {
    id: 'agataDeFogo',
    nome: 'Ágata de Fogo',
    tipo: 'Elemental (Fogo)',
    raridade: 'Incomum',
    preco: { ouro: 3 },
    estado: 'polido',
    bioma: ['Terrenos Vulcânicos'],
    custoFusaoMana: 20,
    efeitos: {
      armadura: {
        desc: '+30% resistência ao fogo',
        bonus: { resistencia: 2 },
        resistenciaFogo: 30,
      },
      arma: {
        desc: '+20% dano de fogo (chance de incendiar)',
        bonus: { forca: 1 },
        chanceIncendiar: true,
        status: { tipo: 'queimadura', chance: 0.15 },
      },
      acessorio: {
        desc: 'Resistência ao calor',
        bonus: { resistencia: 1 },
        resistenciaCalor: true,
      },
      golem: {
        desc: 'Golem com golpe de explosão de fogo',
        bonus: { forca: 1 },
        golpeExplosaoFogo: true,
      },
    },
    fusoesCompativeis: ['rubi', 'obsidiana', 'granada'],
    descricao: 'Pedra elemental de fogo. Aquece o ambiente ao redor.'
  },
  {
    id: 'rubi',
    nome: 'Rubi',
    tipo: 'Elemental (Fogo/Sangue)',
    raridade: 'Épica',
    preco: { ouro: 7 },
    estado: 'bruta',
    bioma: ['Terrenos Vulcânicos', 'Masmorra'],
    custoFusaoMana: 50,
    efeitos: {
      armadura: {
        desc: '+35% resistência ao fogo (fraqueza a gelo)',
        bonus: { resistencia: 2 },
        resistenciaFogo: 35,
        debuff: { danoGelo: 20 },
      },
      arma: {
        desc: '+30% dano de fogo (chance de queimadura)',
        bonus: { forca: 2 },
        danoFogo: 30,
        efeitoQueimadura: true,
        status: { tipo: 'queimadura', chance: 0.2 },
      },
      acessorio: {
        desc: '+15 vida máxima',
        bonus: { resistencia: 1 },
        vidaMaxima: 15,
      },
      golem: {
        desc: 'Golem com ataque de explosão de fogo',
        bonus: { forca: 1 },
        ataqueExplosaoFogo: true,
        debuff: { perdaEnergiaFrio: true },
      },
    },
    fusoesCompativeis: ['diamante', 'obsidiana', 'pedraDeSangue', 'agataDeFogo'],
    descricao: 'Pedra elemental de fogo e sangue. Bruta, necessita de polimento.'
  },
  {
    id: 'pedraDeSangue',
    nome: 'Pedra de Sangue',
    tipo: 'Proibida (Sangue/Dor)',
    raridade: 'Mítica',
    preco: { ouropla: 2 },
    estado: 'polido',
    bioma: ['Masmorra', 'Pântano'],
    custoFusaoMana: 100,
    efeitos: {
      armadura: {
        desc: 'Cura 5 ao matar (perde vida com o tempo)',
        bonus: { resistencia: 1 },
        curaAoMatar: 5,
        debuff: { perdaVidaPorMinuto: 2 },
      },
      arma: {
        desc: '+35% dano de sangramento (chance de sangrar)',
        bonus: { forca: 2 },
        danoSangramento: 35,
        danoMagiaDor: 25,
        status: { tipo: 'sangramento', chance: 0.25 },
      },
      acessorio: {
        desc: 'Detecta inimigos feridos',
        bonus: { inteligencia: 1 },
        detectarFeridos: true,
      },
      golem: {
        desc: 'Golem absorve sangue dos feridos',
        bonus: { forca: 1 },
        absorverSangue: true,
      },
    },
    fusoesCompativeis: ['rubi', 'onix', 'lagrimasVermelhas'],
    descricao: 'Pedra proibida. Causa dano ao usuário, mas amplifica a magia de dor.'
  }
];

// Tabela de Receitas de Fusão Conhecidas
export const receitasFusao = [
  {
    ingredientes: ['obsidiana', 'agataDeFogo'],
    // O id aponta para a gema real do catálogo (persistida no inventário).
    resultado: {
      id: 'obsidiana_ardente',
      nome: 'Obsidiana Ardente',
      raridade: 'Épica',
      raridadeId: 'lendaria',
      custoManaTotal: 50,
      efeitos: {
        arma: { desc: '+55% dano de fogo', bonus: { forca: 3 }, status: { tipo: 'queimadura', chance: 0.30 } },
        armadura: { desc: '+40% resistência ao fogo', bonus: { resistencia: 3 } },
      },
      descricao: 'Fusão estável. Aumenta drasticamente o dano de fogo, mas o usuário sofre em ambientes frios.'
    }
  },
  {
    ingredientes: ['rubi', 'pedraDeSangue'],
    resultado: {
      id: 'rubi_abissal',
      nome: 'Rubi Abissal',
      raridade: 'Lendário',
      raridadeId: 'lendaria',
      custoManaTotal: 150,
      efeitos: {
        arma: { desc: 'Ataques drenam vida inimiga', bonus: { forca: 3 }, status: { tipo: 'sangramento', chance: 0.25 } },
        acessorio: { desc: 'Usuário sofre dor contínua após batalhas longas', bonus: {} },
      },
      descricao: 'Fusão estável, mas perigosa. Drena vida inimiga, mas causa dor contínua ao usuário após batalhas longas.'
    }
  }
];

// ── CATÁLOGO UNIFICADO ─────────────────────────────────────────
// A forja usa o MESMO catálogo do jogo (GEMS), para que qualquer gema
// obtida em batalha, mineração ou loja possa ser polida e fundida.
// As 4 pedras históricas da forja (gemas) têm prioridade por terem
// receitas e estados próprios.

const RARITY_ORDER = { comum: 0, incomum: 1, rara: 2, epica: 3, lendaria: 4 };
const RARITY_LABEL = {
  comum: 'Comum',
  incomum: 'Incomum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
};
const RARITY_ALIAS = {
  Comum: 'comum',
  Incomum: 'incomum',
  Rara: 'rara',
  'Épica': 'epica',
  Epica: 'epica',
  Mítica: 'lendaria',
  Mitica: 'lendaria',
  Lendária: 'lendaria',
  Lendário: 'lendaria',
  Lendario: 'lendaria',
};
const RARITY_MANA = { comum: 10, incomum: 20, rara: 30, epica: 50, lendaria: 80 };
const SLOT_LABEL = { arma: 'Arma', armadura: 'Armadura', acessorio: 'Acessório', golem: 'Golem' };

const tipoBase = (tipo) => String(tipo || '').toLowerCase().split(/[\s(/]/)[0];
const parKey = (a, b) => [a, b].sort().join('|');

// Pares que o catálogo declara como fundíveis (campo gem.fusao).
const PARES_COMPATIVEIS = (() => {
  const set = new Set();
  for (const g of GEM_LIST) {
    for (const f of g.fusao || []) set.add(parKey(g.id, f));
  }
  return set;
})();

// Normaliza uma gema do catálogo principal para o formato da forja.
function gemadoCatalogo(g) {
  const rid = g.raridade || 'comum';
  return {
    id: g.id,
    nome: g.nome,
    tipo: g.tipo || 'natural',
    descricao: g.descricao || '',
    raridade: RARITY_LABEL[rid] || rid,
    raridadeId: rid,
    estado: g.estado || 'polido',
    bioma: g.bioma ? [g.bioma] : [],
    preco: { ouro: g.preco || 0 },
    custoFusaoMana: RARITY_MANA[rid] || 20,
    efeitos: g.efeitos || {},
    fusoesCompativeis: (g.fusao || []).slice(),
    origem: 'catalogo',
  };
}

function gemadaForja(g) {
  return {
    ...g,
    raridadeId: RARITY_ALIAS[g.raridade] || String(g.raridade || '').toLowerCase(),
    origem: 'forja',
  };
}

export function getGemaById(id) {
  const daForja = gemas.find((g) => g.id === id);
  if (daForja) return gemadaForja(daForja);
  const doCatalogo = GEMS[id];
  if (doCatalogo) return gemadoCatalogo(doCatalogo);
  return null;
}

// Lista completa (forja + catálogo) para a forja exibir tudo que existe.
export const gemasDisponiveis = (() => {
  const mapa = new Map();
  for (const g of GEM_LIST) mapa.set(g.id, gemadoCatalogo(g));
  for (const g of gemas) mapa.set(g.id, gemadaForja(g));
  return [...mapa.values()];
})();

// Retorna true se a gema do sistema de fusão está em estado bruta.
export function gemaIsBruta(id) {
  const g = getGemaById(id);
  return !!g && g.estado === 'bruta';
}

// Converte um objeto de efeitos em pares legíveis p/ exibição.
// Aceita o formato plano da forja ({ danoFogo: 55 }) e o formato do
// catálogo por slot ({ arma: { desc, bonus }, acessorio: {...} }).
export function efeitosParaLista(efeitos) {
  const list = [];
  for (const [k, v] of Object.entries(efeitos || {})) {
    if (k === 'debuff') {
      const label = v === true ? 'Efeito negativo' : typeof v === 'object' ? Object.keys(v).join(', ') : `${k} ${v}`;
      list.push({ tipo: 'debuff', label: `❌ ${label}` });
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const slot = SLOT_LABEL[k] || k;
      if (v.desc) {
        list.push({ tipo: 'buff', label: `✨ ${slot}: ${v.desc}` });
        continue;
      }
      for (const [k2, v2] of Object.entries(v)) {
        if (v2 && typeof v2 === 'object') continue;
        if (typeof v2 === 'boolean') {
          list.push({ tipo: k2 === 'debuff' ? 'debuff' : 'buff', label: `${k2 === 'debuff' ? '❌' : '✨'} ${slot} — ${k2}` });
        } else {
          list.push({ tipo: 'buff', label: `✨ ${slot} — ${k2}: +${v2}` });
        }
      }
      continue;
    }
    if (typeof v === 'boolean') list.push({ tipo: 'buff', label: `✨ ${k}` });
    else list.push({ tipo: 'buff', label: `✨ ${k}: +${v}` });
  }
  return list;
}

// Resultado determinístico para fusões sem receita explícita: sobe uma
// raridade e escolhe uma gema real do catálogo (mesmo tipo quando possível).
function resultadoGenerico(gemaA, gemaB) {
  const ordemA = RARITY_ORDER[gemaA.raridadeId] ?? 1;
  const ordemB = RARITY_ORDER[gemaB.raridadeId] ?? 1;
  const alvo = Math.min(4, Math.max(ordemA, ordemB) + 1);
  const tipo = tipoBase(gemaA.tipo);
  const usados = new Set([gemaA.id, gemaB.id]);

  let candidatos = GEM_LIST.filter(
    (g) => RARITY_ORDER[g.raridade] === alvo && tipoBase(g.tipo) === tipo && !usados.has(g.id),
  );
  if (!candidatos.length) {
    candidatos = GEM_LIST.filter((g) => RARITY_ORDER[g.raridade] === alvo && !usados.has(g.id));
  }
  if (!candidatos.length) candidatos = GEM_LIST.filter((g) => !usados.has(g.id));

  const escolhida = candidatos.length ? candidatos[0] : null;
  if (!escolhida) {
    return null;
  }
  return {
    id: escolhida.id,
    nome: escolhida.nome,
    raridade: RARITY_LABEL[escolhida.raridade],
    raridadeId: escolhida.raridade,
    custoManaTotal: (gemaA.custoFusaoMana || 20) + (gemaB.custoFusaoMana || 20),
    efeitos: escolhida.efeitos || {},
    descricao: `Fusão de ${gemaA.nome} + ${gemaB.nome}. ${escolhida.descricao || ''}`.trim(),
  };
}

// ── LÓGICA DE FUSÃO ────────────────────────────────────────────
// Retorna { ok, resultado?|motivo? } descrevendo a compatibilidade.
export function verificarFusao(gemaA, gemaB) {
  if (!gemaA || !gemaB) {
    return { ok: false, motivo: 'Selecione duas gemas para verificar a fusão.' };
  }
  if (gemaA.id === gemaB.id) {
    return { ok: false, motivo: 'Não é possível fundir uma gema com ela mesma.' };
  }

  // REGRA DE OURO: pedras brutas bloqueiam a fusão.
  if (gemaA.estado === 'bruta' || gemaB.estado === 'bruta') {
    return {
      ok: false,
      bruta: true,
      motivo: '⚠️ Pedras brutas precisam ser polidas antes de serem fundidas!',
    };
  }

  // 1) Receita explícita da forja (Obsidiana Ardente, Rubi Abissal...).
  const receita = receitasFusao.find((r) => {
    const [x, y] = r.ingredientes;
    return (
      (x === gemaA.id && y === gemaB.id) ||
      (x === gemaB.id && y === gemaA.id)
    );
  });
  if (receita) return { ok: true, resultado: receita.resultado };

  // 2) Receita declarada no catálogo (campo fusao_requisito).
  const par = parKey(gemaA.id, gemaB.id);
  const doCatalogo = GEM_LIST.find(
    (g) => Array.isArray(g.fusao_requisito)
      && g.fusao_requisito.length === 2
      && parKey(g.fusao_requisito[0], g.fusao_requisito[1]) === par,
  );
  if (doCatalogo) {
    return {
      ok: true,
      resultado: {
        id: doCatalogo.id,
        nome: doCatalogo.nome,
        raridade: RARITY_LABEL[doCatalogo.raridade],
        raridadeId: doCatalogo.raridade,
        custoManaTotal: (gemaA.custoFusaoMana || 20) + (gemaB.custoFusaoMana || 20),
        efeitos: doCatalogo.efeitos || {},
        descricao: doCatalogo.descricao || '',
      },
    };
  }

  // 3) Compatibilidade: par declarado no catálogo, listas mútuas ou mesmo tipo.
  const listado = PARES_COMPATIVEIS.has(par)
    || (gemaA.fusoesCompativeis || []).includes(gemaB.id)
    || (gemaB.fusoesCompativeis || []).includes(gemaA.id)
    || tipoBase(gemaA.tipo) === tipoBase(gemaB.tipo);

  if (!listado) {
    return {
      ok: false,
      instavel: true,
      motivo: 'Fusão Instável: Custo de Mana triplicado e 50% de chance de destruir as gemas',
    };
  }

  const resultado = resultadoGenerico(gemaA, gemaB);
  if (!resultado) {
    return { ok: false, instavel: true, motivo: 'Nenhuma gema compatível para resultar desta fusão.' };
  }
  return { ok: true, resultado };
}

// ────────────────────────────────────────────────────────────────
// SISTEMA DE POLIMENTO DE PEDRAS (GemPolisher)
// Cadeia de níveis: destruída ← bruta → lapidada → polido → perfeita
// Cada nível tem custo em ouro, tempo (h), chance de sucesso (%) e um
// multiplicador de efeito aplicado aos status do equipamento.
// ────────────────────────────────────────────────────────────────

export const NIVEIS_POLIMENTO = {
  destruida: { ordem: 0, nome: 'Destruída', corVisual: '#4b4f58', proximoNivel: null, custoOuro: 0, custoMana: 0, tempoHoras: 0, chanceSucesso: 0, multiplicadorEfeito: 0 },
  bruta:     { ordem: 1, nome: 'Bruta',     corVisual: '#9aa0c0', proximoNivel: 'lapidada', custoOuro: 100, custoMana: 20, tempoHoras: 4,  chanceSucesso: 70, multiplicadorEfeito: 0.8 },
  lapidada:  { ordem: 2, nome: 'Lapidada',  corVisual: '#4a90e2', proximoNivel: 'polido',   custoOuro: 250, custoMana: 40, tempoHoras: 8,  chanceSucesso: 60, multiplicadorEfeito: 0.9 },
  polido:    { ordem: 3, nome: 'Polido',    corVisual: '#7c5cff', proximoNivel: 'perfeita', custoOuro: 500, custoMana: 80, tempoHoras: 16, chanceSucesso: 50, multiplicadorEfeito: 1.0 },
  perfeita:  { ordem: 4, nome: 'Perfeita',  corVisual: '#ffd166', proximoNivel: null,       custoOuro: 0,   custoMana: 0,  tempoHoras: 0,  chanceSucesso: 0,  multiplicadorEfeito: 1.2 },
};

// Aplica os bônus da profissão 'Lapidador' sobre o custo/chance base de um
// nível de polimento. Retorna os valores já modificados.
export function calcularCustoPolimento(nivel, jogador = {}) {
  const eLapidador = jogador.profissao === 'Lapidador';
  const chanceSucesso = eLapidador
    ? Math.min(100, nivel.chanceSucesso + 15)
    : nivel.chanceSucesso;
  const custoMana = eLapidador
    ? Math.floor(nivel.custoMana * 0.8)
    : nivel.custoMana;
  return {
    custoOuro: nivel.custoOuro,
    custoMana,
    custoManaOriginal: nivel.custoMana,
    chanceSucesso,
    chanceSucessoOriginal: nivel.chanceSucesso,
    falhaSegura: eLapidador,
    bonusLapidador: eLapidador,
  };
}

// Retorna as informações do nível atual da gema (ou null se inválido).
export function nivelInfo(estado) {
  return NIVEIS_POLIMENTO[estado] || null;
}

// Verifica se o estado pode ser polido (não é terminal/destruída nem máximo).
export function gemaPolivel(estado) {
  const n = NIVEIS_POLIMENTO[estado];
  return !!n && !!n.proximoNivel;
}

// Realiza a tentativa de polimento.
// Entrada: gema (objeto com .estado), ouroDisponivel, jogador (opcional) e
//          manaDisponivel (opcional — se omitido, considera mana suficiente).
// Retorno: { ok, sucesso, protegido, estadoAnterior, estadoNovo, custoOuro,
//           custoMana, multiplicadorAnterior, multiplicadorNovo, ouroRestante,
//           bonusLapidador, motivo? }
export function polirPedra(gema, ouroDisponivel, jogador = {}, manaDisponivel) {
  if (!gema) return { ok: false, motivo: 'Gema não encontrada.' };
  const atual = NIVEIS_POLIMENTO[gema.estado];
  if (!atual) return { ok: false, motivo: 'Estado inválido.' };
  if (!atual.proximoNivel) {
    return { ok: false, motivo: 'A pedra já está no nível máximo de polimento.' };
  }

  const custo = calcularCustoPolimento(atual, jogador);

  if (ouroDisponivel < custo.custoOuro) {
    return {
      ok: false,
      precisaOuro: true,
      custoOuro: custo.custoOuro,
      ouroDisponivel,
      motivo: `Ouro insuficiente: precisa de ${custo.custoOuro}, você tem ${ouroDisponivel}.`,
    };
  }
  if (manaDisponivel !== undefined && manaDisponivel < custo.custoMana) {
    return {
      ok: false,
      precisaMana: true,
      custoMana: custo.custoMana,
      manaDisponivel,
      motivo: `Mana insuficiente: precisa de ${custo.custoMana}, você tem ${manaDisponivel}.`,
    };
  }

  const ouroRestante = ouroDisponivel - custo.custoOuro;
  const manaConsumida = custo.custoMana;

  // Rola o dado virtual contra a chance de sucesso (já com bônus).
  const sucesso = Math.random() < custo.chanceSucesso / 100;

  let estadoNovo;
  let protegido = false;
  if (sucesso) {
    // Sobe um nível (atual.proximoNivel já é o id do próximo nível).
    estadoNovo = atual.proximoNivel;
  } else if (custo.falhaSegura && gema.estado !== 'bruta') {
    // Falha segura do Lapidador: a pedra não degrada (exceto bruta).
    protegido = true;
    estadoNovo = gema.estado;
  } else {
    // Degrada: perfeita → polido, polido → lapidada, lapidada → bruta, bruta → destruída.
    const anteriorKv = Object.entries(NIVEIS_POLIMENTO).find(
      ([, n]) => n.proximoNivel === gema.estado
    );
    estadoNovo = anteriorKv ? anteriorKv[0] : 'destruida';
  }

  const infoFinal = NIVEIS_POLIMENTO[estadoNovo] || NIVEIS_POLIMENTO.destruida;

  return {
    ok: true,
    sucesso,
    protegido,
    estadoAnterior: gema.estado,
    estadoNovo,
    custoOuro: custo.custoOuro,
    custoMana: manaConsumida,
    multiplicadorAnterior: atual.multiplicadorEfeito,
    multiplicadorNovo: infoFinal.multiplicadorEfeito,
    ouroRestante,
    manaRestante: manaDisponivel !== undefined ? manaDisponivel - manaConsumida : undefined,
    bonusLapidador: custo.bonusLapidador,
  };
}
