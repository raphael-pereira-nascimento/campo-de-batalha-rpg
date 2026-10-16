// Dados do jogo: classes, atributos, magias, equipamentos e formulas.

import { RACES } from './races.js';
import { GEMS } from './gems.js';
import {
  manaMaxFrom,
  manaRecuperada,
  iniciativaDe,
  pesoAtributo,
  cargaMaxima,
  alcanceVerticalDeArma,
  alcanceVerticalDeMagia,
  foraDoAlcanceVertical,
  ALCANCE_VERTICAL,
  ALTITUDES,
  DANO_MULT,
  danoBaseDaArma,
  danoFisicoAtaque,
  danoMagico,
  armasDeEquipamento,
  melhorArma,
  armaParaAtaque,
  categoriaDeArma,
  ARMAS_SLOTS,
  ARMA_CATEGORIA_INFO,
} from './sistema.js';

export {
  manaMaxFrom,
  manaRecuperada,
  pesoAtributo,
  cargaMaxima,
  alcanceVerticalDeArma,
  alcanceVerticalDeMagia,
  foraDoAlcanceVertical,
  ALCANCE_VERTICAL,
  ALTITUDES,
  armasDeEquipamento,
  melhorArma,
  armaParaAtaque,
  categoriaDeArma,
  ARMAS_SLOTS,
  ARMA_CATEGORIA_INFO,
};

export const CLASSES = {
  guerreiro: {
    id: 'guerreiro',
    nome: 'Guerreiro',
    descricao: 'Mestre do combate corpo a corpo. Muita força e resistência.',
    bonus: { forca: 3, resistencia: 2, destreza: 1, inteligencia: 0, reflexos: 0 },
    hpPerLevel: 12,
    mpPerLevel: 3,
    levelUp: 'forca',
    spellList: ['golpe_sangrento', 'giro_de_espada', 'grito_de_guerra', 'muralha'],
  },
  mago: {
    id: 'mago',
    nome: 'Mago',
    descricao: 'Canaliza arcanos devastadores. Muita inteligência e mana.',
    bonus: { forca: 0, resistencia: 1, destreza: 0, inteligencia: 3, reflexos: 2 },
    hpPerLevel: 6,
    mpPerLevel: 10,
    levelUp: 'inteligencia',
    spellList: ['bola_de_fogo', 'onda_de_choque', 'raio', 'gelo', 'escudo_arcano'],
  },
  arqueiro: {
    id: 'arqueiro',
    nome: 'Arqueiro',
    descricao: 'Atirador de elite. Destreza e reflexos acima da média.',
    bonus: { forca: 1, resistencia: 0, destreza: 3, inteligencia: 1, reflexos: 2 },
    hpPerLevel: 8,
    mpPerLevel: 5,
    levelUp: 'destreza',
    spellList: ['tiro_preciso', 'chuva_de_flechas', 'salva_de_projeteis', 'flecha_ardente'],
  },
  clerigo: {
    id: 'clerigo',
    nome: 'Clérigo',
    descricao: 'Curandeiro sagrado. Sustenta o time com a fé.',
    bonus: { forca: 1, resistencia: 2, destreza: 1, inteligencia: 2, reflexos: 0 },
    hpPerLevel: 9,
    mpPerLevel: 8,
    levelUp: 'inteligencia',
    spellList: ['cura', 'cura_massa', 'luz_sagrada', 'benção'],
  },
  assassino: {
    id: 'assassino',
    nome: 'Assassino',
    descricao: 'Letal nas sombras. Reflexos e destreza incomparáveis.',
    bonus: { forca: 1, resistencia: 0, destreza: 3, inteligencia: 1, reflexos: 3 },
    hpPerLevel: 7,
    mpPerLevel: 5,
    levelUp: 'reflexos',
    spellList: ['golpe_preciso', 'veneno', 'sombra'],
  },
  paladino: {
    id: 'paladino',
    nome: 'Paladino',
    descricao: 'Cavaleiro sagrado que protege os aliados com fé e aço.',
    bonus: { forca: 2, resistencia: 2, destreza: 1, inteligencia: 1, reflexos: 0 },
    hpPerLevel: 10,
    mpPerLevel: 6,
    levelUp: 'forca',
    spellList: ['golpe_sagrado', 'escudo_divino', 'cura', 'benção'],
  },
};

export const ELEMENTOS = ['fisico', 'fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'];

export const SPELLS = {
  golpe_sangrento: { nome: 'Golpe Sangrento', tipo: 'ataque', custo: 5, poder: 2.0, desc: 'Ataque físico brutal com força aumentada.', status: { tipo: 'sangramento', turnos: 2, dano: 60 }, alcanceVertical: 'terrestre' },
  giro_de_espada: { nome: 'Giro de Espada', tipo: 'ataque', custo: 6, poder: 1.5, desc: 'Gira a arma em arco, atingindo vários inimigos à volta.', elemento: 'fisico', alvo: 'cone', alvos: 3, alcanceVertical: 'terrestre' },
  grito_de_guerra: { nome: 'Grito de Guerra', tipo: 'buff', custo: 6, poder: 0.15, desc: 'Aumenta o dano físico de todos os aliados.' },
  muralha: { nome: 'Muralha', tipo: 'defesa', custo: 6, poder: 0.25, desc: 'Reduz o dano recebido nesta rodada.' },

  bola_de_fogo: { nome: 'Bola de Fogo', tipo: 'ataque', custo: 8, poder: 2.4, desc: 'Explosão de fogo devastadora: atinge o alvo e os vizinhos.', elemento: 'fogo', status: { tipo: 'queimadura', turnos: 3, dano: 50 }, alvo: 'explosao', alvos: 3, splash: 0.5 },
  onda_de_choque: { nome: 'Onda de Choque', tipo: 'ataque', custo: 8, poder: 1.7, desc: 'Leque de energia que atinge vários inimigos em cone.', elemento: 'ar', alvo: 'cone', alvos: 3 },
  raio: { nome: 'Raio', tipo: 'ataque', custo: 6, poder: 1.8, desc: 'Descarga elétrica precisa.', elemento: 'ar' },
  gelo: { nome: 'Gelo', tipo: 'ataque', custo: 7, poder: 1.6, desc: 'Congela o alvo e reduz a velocidade dele.', elemento: 'agua', status: { tipo: 'congelamento', turnos: 2 }, alcanceVertical: 'limitado' },
  escudo_arcano: { nome: 'Escudo Arcano', tipo: 'defesa', custo: 7, poder: 0.3, desc: 'Barreira mágica que absorve dano.' },

  tiro_preciso: { nome: 'Tiro Preciso', tipo: 'ataque', custo: 4, poder: 1.5, desc: 'Dano crítico elevado.', elemento: 'fisico', alcanceVertical: 'longo' },
  chuva_de_flechas: { nome: 'Chuva de Flechas', tipo: 'ataque', custo: 9, poder: 2.2, desc: 'Acerta todos os inimigos.', elemento: 'fisico', alvo: 'area' },
  salva_de_projeteis: { nome: 'Salva de Projéteis', tipo: 'ataque', custo: 7, poder: 1.4, desc: 'Dispara projéteis em leque contra vários inimigos.', elemento: 'fisico', alvo: 'cone', alvos: 3 },
  flecha_ardente: { nome: 'Flecha Ardente', tipo: 'ataque', custo: 6, poder: 1.9, desc: 'Flecha em chamas que causa queimadura.', elemento: 'fogo', status: { tipo: 'queimadura', turnos: 3, dano: 60 }, alcanceVertical: 'longo' },

  cura: { nome: 'Cura', tipo: 'cura', custo: 6, poder: 2.0, desc: 'Restaura HP com base na inteligência.', elemento: 'luz' },
  cura_massa: { nome: 'Cura em Massa', tipo: 'cura', custo: 12, poder: 1.2, desc: 'Cura todos os aliados vivos.', elemento: 'luz' },
  luz_sagrada: { nome: 'Luz Sagrada', tipo: 'ataque', custo: 7, poder: 1.9, desc: 'Dano divino contra um inimigo.', elemento: 'luz' },
  benção: { nome: 'Benção', tipo: 'buff', custo: 5, poder: 0.1, desc: 'Aumenta o dano mágico dos aliados.', elemento: 'luz' },

  golpe_preciso: { nome: 'Golpe Preciso', tipo: 'ataque', custo: 5, poder: 1.6, desc: 'Ataque certeiro que tem alta chance de crítico.', elemento: 'fisico', alcanceVertical: 'terrestre' },
  veneno: { nome: 'Veneno', tipo: 'ataque', custo: 6, poder: 1.4, desc: 'Envenena o alvo, causando dano contínuo.', elemento: 'trevas', status: { tipo: 'veneno', turnos: 3, dano: 40 } },
  sombra: { nome: 'Sombra', tipo: 'defesa', custo: 5, poder: 0.3, desc: 'Desaparece nas sombras, reduzindo muito o dano recebido.' },

  golpe_sagrado: { nome: 'Golpe Sagrado', tipo: 'ataque', custo: 7, poder: 2.0, desc: 'Espada envolta em luz sagrada.', elemento: 'luz', alcanceVertical: 'terrestre' },
  escudo_divino: { nome: 'Escudo Divino', tipo: 'defesa', custo: 7, poder: 0.3, desc: 'Barreira sagrada que absorve dano.', elemento: 'luz' },

  // ── Chefes de Biomas ───────────────────────────────────────────────
  // Kraken
  tentaculo_esmagador: { nome: 'Tentáculo Esmagador', tipo: 'ataque', custo: 12, poder: 2.4, desc: 'Tentáculo colossal esmagando o alvo com força titânica.', elemento: 'fisico', status: { tipo: 'lentidao', turnos: 2 }, alcanceVertical: 'limitado', alvo: 'area', alvos: 2 },
  redemoinho_aguas_profundas: { nome: 'Redemoinho das Águas Profundas', tipo: 'ataque', custo: 15, poder: 2.6, desc: 'Redemoinho de mar profundo atingindo todos ao redor.', elemento: 'agua', status: { tipo: 'cegueira', turnos: 2 }, alvo: 'area' },
  maremoto_colossal: { nome: 'Maremoto Colossal', tipo: 'ataque', custo: 25, poder: 3.2, desc: 'Maremoto devastador varrendo o campo inteiro.', elemento: 'agua', status: { tipo: 'lentidao', turnos: 3 }, alvo: 'area' },

  // Espírito da Floresta
  raiz_enraizante: { nome: 'Raiz Enraizante', tipo: 'ataque', custo: 10, poder: 2.0, desc: 'Raízes brotam do solo, prendendo e causando dano.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 3 }, alcanceVertical: 'terrestre', alvo: 'area' },
  floresta_vingativa: { nome: 'Floresta Vingativa', tipo: 'ataque', custo: 15, poder: 2.5, desc: 'Espinhos e galhos atacam todos os inimigos.', elemento: 'terra', status: { tipo: 'sangramento', turnos: 3 }, alvo: 'area' },
  fúria_natureza: { nome: 'Fúria da Natureza', tipo: 'ataque', custo: 25, poder: 3.2, desc: 'Natureza se revolta e devasta o campo inteiro.', elemento: 'terra', status: { tipo: 'sangramento', turnos: 4 }, alvo: 'area' },

  // Monstro do Pantano
  lama_acida: { nome: 'Lama Ácida', tipo: 'ataque', custo: 10, poder: 2.0, desc: 'Jato de lama ácida que corrói o alvo.', elemento: 'agua', status: { tipo: 'queimadura', turnos: 3 }, alcanceVertical: 'terrestre' },
  bolor_toxico: { nome: 'Bolor Tóxico', tipo: 'ataque', custo: 14, poder: 2.3, desc: 'Nuvem tóxica expande-se, envenenando todos.', elemento: 'trevas', status: { tipo: 'veneno', turnos: 3 }, alvo: 'area' },
  pestilencia_pantanal: { nome: 'Pestilência do Pantanal', tipo: 'ataque', custo: 24, poder: 3.1, desc: 'Mar de toxinas e podridão varre o campo.', elemento: 'trevas', status: { tipo: 'veneno', turnos: 4 }, alvo: 'area' },

  // Yeti
  golpe_gelo: { nome: 'Golpe de Gelo', tipo: 'ataque', custo: 11, poder: 2.2, desc: 'Punho gelado que congela o alvo.', elemento: 'agua', status: { tipo: 'congelamento', turnos: 2 }, alcanceVertical: 'terrestre' },
  avalancha: { nome: 'Avalancha', tipo: 'ataque', custo: 16, poder: 2.6, desc: 'Massa de neve e gelo despenca sobre todos.', elemento: 'agua', status: { tipo: 'congelamento', turnos: 2 }, alvo: 'area' },
  furia_glacial: { nome: 'Fúria Glacial', tipo: 'ataque', custo: 25, poder: 3.3, desc: 'Tempestade glacial de proporções titânicas.', elemento: 'agua', status: { tipo: 'congelamento', turnos: 3 }, alvo: 'area' },

  // Minhoca de Broca
  perfuracao_terrena: { nome: 'Perfuração Terrena', tipo: 'ataque', custo: 10, poder: 2.2, desc: 'Broca subterrânea que explode sob o alvo.', elemento: 'terra', status: { tipo: 'sangramento', turnos: 2 }, alcanceVertical: 'terrestre' },
  tremor_subterraneo: { nome: 'Tremor Subterrâneo', tipo: 'ataque', custo: 15, poder: 2.5, desc: 'Tremor de proporções maciças atinge todo o campo.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 3 }, alvo: 'area' },
  colapso_caverna: { nome: 'Colapso da Caverna', tipo: 'ataque', custo: 24, poder: 3.2, desc: 'Techo da caverna desaba sobre todos.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 4 }, alvo: 'area' },

  // Jabuti Casco de Montanha
  impacto_casco: { nome: 'Impacto do Casco', tipo: 'ataque', custo: 11, poder: 2.3, desc: 'Investida com casco de pedra maciço.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 2 }, alcanceVertical: 'terrestre' },
  onda_pedregulho: { nome: 'Onda de Pedregulho', tipo: 'ataque', custo: 15, poder: 2.6, desc: 'Chuva de pedras atinge todos os inimigos.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 3 }, alvo: 'area' },
  terremoto_montanha: { nome: 'Terremoto da Montanha', tipo: 'ataque', custo: 25, poder: 3.3, desc: 'Terremoto cataclísmico que abala o campo inteiro.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 4 }, alvo: 'area' },

  // Dragão de Obsidiana
  baforada_obsidiana: { nome: 'Baforada de Obsidiana', tipo: 'ataque', custo: 12, poder: 2.6, desc: 'Chama negra derretida incinera o alvo.', elemento: 'fogo', status: { tipo: 'queimadura', turnos: 3 }, alcanceVertical: 'limitado', alvo: 'cone', alvos: 2 },
  chuva_lava: { nome: 'Chuva de Lava', tipo: 'ataque', custo: 16, poder: 2.8, desc: 'Lava incandescente cai sobre todos os inimigos.', elemento: 'fogo', status: { tipo: 'queimadura', turnos: 3 }, alvo: 'area' },
  apocalipse_obsidiana: { nome: 'Apocalipse de Obsidiana', tipo: 'ataque', custo: 28, poder: 3.6, desc: 'Erupção vulcânica devastadora reduz tudo a cinzas.', elemento: 'fogo', status: { tipo: 'queimadura', turnos: 4 }, alvo: 'area' },

  // ── Ultimates do Eclipse (PROVISÓRIO: só usáveis na variante eclipsada) ──
  abismo_eclipsado: { nome: 'Abismo Eclipsado', tipo: 'ataque', custo: 30, poder: 3.6, desc: 'O oceano profundo engole o campo inteiro durante o Eclipse.', elemento: 'agua', status: { tipo: 'cegueira', turnos: 3 }, alvo: 'area' },
  fome_da_copa: { nome: 'Fome da Copa', tipo: 'ataque', custo: 28, poder: 3.5, desc: 'A copa eclipsada devora a luz e os invasores.', elemento: 'terra', status: { tipo: 'sangramento', turnos: 4 }, alvo: 'area' },
  pestilencia_eclipsada: { nome: 'Pestilência Eclipsada', tipo: 'ataque', custo: 28, poder: 3.5, desc: 'O ar apodrece: toxinas do Eclipse corroem todos.', elemento: 'trevas', status: { tipo: 'veneno', turnos: 4 }, alvo: 'area' },
  inverno_eclipsado: { nome: 'Inverno Eclipsado', tipo: 'ataque', custo: 30, poder: 3.6, desc: 'Nevasca eterna do Eclipse congela até a coragem.', elemento: 'agua', status: { tipo: 'congelamento', turnos: 3 }, alvo: 'area' },
  fenda_eclipsada: { nome: 'Fenda Eclipsada', tipo: 'ataque', custo: 28, poder: 3.5, desc: 'Fendas do Eclipse engolem o campo de batalha.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 4 }, alvo: 'area' },
  cataclismo_eclipsado: { nome: 'Cataclismo Eclipsado', tipo: 'ataque', custo: 30, poder: 3.6, desc: 'A montanha anda e racha o mundo em dois.', elemento: 'terra', status: { tipo: 'lentidao', turnos: 4 }, alvo: 'area' },
  sol_negro: { nome: 'Sol Negro', tipo: 'ataque', custo: 32, poder: 4.0, desc: 'O céu queima antes do fogo chegar: o ultimate do Eclipse.', elemento: 'fogo', status: { tipo: 'queimadura', turnos: 4 }, alvo: 'area' },
};

/**
 * Converte uma entrada do catálogo SPELLS num "golpe" usado em combate.
 * Fonte única usada pelo battleManager, pelos monstros e pela UI.
 */
export function skillFromSpell(s) {
  if (!s) return null;
  return {
    id: s.nome,
    nome: s.nome,
    tipo: s.tipo === 'ataque' ? 'magia' : s.tipo,
    poder: Math.round((s.poder || 1) * 100),
    custo: s.custo || 0,
    cooldown: 0,
    todos: s.nome === 'Cura em Massa',
    alvo: s.alvo || null,
    alvos: s.alvos || null,
    splash: s.splash || null,
    danoMult: s.danoMult || null,
    status: s.status ? { ...s.status } : null,
    elemento: s.elemento || null,
    alcanceVertical: s.alcanceVertical || null,
    desc: s.desc || '',
  };
}

export const WEAPON_STATES = {
  otima:       { nome: 'Ótima',       cor: '#3ddc84', multDano: 1.0, multDefesa: 1.0 },
  manutencao:  { nome: 'Manutenção',  cor: '#f5c542', multDano: 0.85, multDefesa: 0.9 },
  danificada:  { nome: 'Danificada',  cor: '#ff6b35', multDano: 0.65, multDefesa: 0.7 },
  quebrada:    { nome: 'Quebrada',    cor: '#dc3545', multDano: 0.0,  multDefesa: 0.0 },
};

export const ALCANCE_TYPES = {
  corpo:  { nome: 'Corpo a Corpo', ordem: 1 },
  medio:  { nome: 'Médio Alcance', ordem: 2 },
  longo:  { nome: 'Longo Alcance', ordem: 3 },
};

export const EQUIPMENT = {
  armas: {
    // ── Corpo a corpo (⚔️) ─────────────────────────
    espada_curta: { nome: 'Espada Curta', tipo: 'arma', categoria: 'perto', danoBase: 4, bonus: { forca: 1 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Lâmina curta e ágil, ideal para combate apertado.' },
    espada_longa: { nome: 'Espada Longa', tipo: 'arma', categoria: 'perto', danoBase: 7, bonus: { forca: 2 }, socketSlots: 2, alcance: 'corpo', recarga: 0, descricao: 'Versátil e equilibrada, a clássica espada medieval.' },
    machado_de_guerra: { nome: 'Machado de Guerra', tipo: 'arma', categoria: 'perto', danoBase: 9, bonus: { forca: 3 }, socketSlots: 3, alcance: 'corpo', recarga: 0, descricao: 'Pesado e devastador, machados cortam armaduras com facilidade.' },
    adaga_dupla: { nome: 'Adaga Dupla', tipo: 'arma', categoria: 'perto', danoBase: 4, bonus: { destreza: 3 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Lâminas gêmeas para o assassino implacável.' },
    martelo_sagrado: { nome: 'Martelo Sagrado', tipo: 'arma', categoria: 'perto', danoBase: 6, bonus: { inteligencia: 1, resistencia: 1 }, socketSlots: 3, alcance: 'corpo', recarga: 0, descricao: 'Arma de clérigos, esmaga com fé inabalável.' },
    adaga_ritual: { nome: 'Adaga Ritual', tipo: 'arma', categoria: 'perto', danoBase: 5, bonus: { reflexos: 2 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Usada em rituais, corta com precisão sobrenatural.' },
    espada_baioneta: { nome: 'Espada Baioneta', tipo: 'arma_fogo', categoria: 'perto', elemento: 'fogo', danoBase: 5, bonus: { forca: 1, destreza: 1 }, socketSlots: 1, alcance: 'corpo', recarga: 0, descricao: 'Mosquete com baioneta — funciona como lança em combate corpo a corpo.' },

    // ── À distância (🏹) ────────────────────────────
    arco_simples: { nome: 'Arco Simples', tipo: 'arma', categoria: 'distancia', danoBase: 5, bonus: { destreza: 2 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Confiável e silencioso, perfeito para emboscadas.' },
    arco_longo: { nome: 'Arco Longo', tipo: 'arma', categoria: 'distancia', danoBase: 8, bonus: { destreza: 3 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Alcance superior, letal à distância.' },
    lanca_sagrada: { nome: 'Lança Sagrada', tipo: 'arma', categoria: 'distancia', danoBase: 8, bonus: { forca: 2, resistencia: 1 }, socketSlots: 2, alcance: 'medio', recarga: 0, descricao: 'Alcance superior — perfura inimigos antes que cheguem perto.' },
    cajado_arcano: { nome: 'Cajado Arcano', tipo: 'arma', categoria: 'distancia', danoBase: 3, bonus: { inteligencia: 2 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Canaliza energia arcanosa através de um cristal precioso.' },
    orbe_magico: { nome: 'Orbe Mágico', tipo: 'arma', categoria: 'distancia', danoBase: 2, bonus: { inteligencia: 3 }, socketSlots: 1, alcance: 'longo', recarga: 0, descricao: 'Esfera flutuante que amplifica magia pura.' },
    pistola: { nome: 'Pistola', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 5, bonus: { destreza: 1 }, socketSlots: 1, alcance: 'longo', recarga: 1, descricao: 'Rápida e barata, mas a mais fraca das armas de fogo.' },
    mosquete: { nome: 'Mosquete', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 9, bonus: { forca: 1 }, socketSlots: 2, alcance: 'longo', recarga: 2, descricao: 'O clássico — lento mas devastador.' },
    bacamarte: { nome: 'Bacamarte', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 7, bonus: { forca: 1 }, socketSlots: 1, alcance: 'medio', recarga: 2, alvo: 'cone', alvos: 3, descricao: 'Dispara chumbos em cone, eficaz contra grupos.' },
    rifle_de_caca: { nome: 'Rifle de Caça', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 10, bonus: { destreza: 2 }, socketSlots: 2, alcance: 'longo', recarga: 2, descricao: 'Precisão cirúrgica e o maior dano entre as armas de fogo — cara e rara.' },
    besta_pesada: { nome: 'Besta Pesada', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 6, bonus: { forca: 1 }, socketSlots: 2, alcance: 'longo', recarga: 2, descricao: 'Mais lenta que arco mas ignora parcialmente defesa.' },
    cajado_de_fogo: { nome: 'Cajado de Fogo', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 4, bonus: { inteligencia: 2 }, socketSlots: 2, alcance: 'longo', recarga: 1, descricao: 'Cajado arcano que dispara projéteis de fogo incandescentes.' },
    arco_composto: { nome: 'Arco Composto', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 7, bonus: { destreza: 2 }, socketSlots: 2, alcance: 'longo', recarga: 0, descricao: 'Arco reforçado com lâmina — multiclasse de precisão.' },
    canhao_de_mao: { nome: 'Canhão de Mão', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 11, bonus: { forca: 1 }, socketSlots: 2, alcance: 'medio', recarga: 3, alvo: 'explosao', alvos: 3, splash: 0.5, descricao: 'Disparo explosivo: atinge o alvo principal e os vizinhos com estilhaços. Devastador, de recarga longuíssima.' },
    // Valores PROVISÓRIOS. `recarga` = turnos de espera do personagem após cada
    // disparo (armas de fogo); use 0 para armas que não recarregam.
    pistola_de_latao: { nome: 'Pistola de Latão', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 6, bonus: { destreza: 2 }, socketSlots: 1, alcance: 'longo', recarga: 1, descricao: 'Cano de latão polido — precisa e rápida de recarregar.' },
    pistola_da_marinha: { nome: 'Pistola da Marinha', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 7, bonus: { forca: 1, destreza: 1 }, socketSlots: 2, alcance: 'medio', recarga: 1, descricao: 'Feita para o sal e a pólvora: robusta e certeira de perto.' },
    nock_gun: { nome: 'Nock Gun', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 8, bonus: { forca: 2 }, socketSlots: 2, alcance: 'medio', recarga: 3, alvo: 'cone', alvos: 4, descricao: 'Sete canos disparados de uma vez: uma saraivada devastadora contra o grupo (recarga longa).' },

    // ── Utilitárias (🧰) — possuem limites de uso por batalha ──
    // Valores de dano/usos/efeito são PROVISÓRIOS: ajuste tudo neste bloco.
    rede_encantada: { nome: 'Rede Encantada', tipo: 'arma', categoria: 'utilitaria', danoBase: 2, usosMax: 3, efeito: { tipo: 'lentidao', turnos: 2 }, socketSlots: 0, alcance: 'medio', recarga: 0, descricao: 'Emaranha o alvo por 2 turnos, reduzindo precisão e esquiva.' },
    frasco_incendiario: { nome: 'Frasco Incendiário', tipo: 'arma', categoria: 'utilitaria', elemento: 'fogo', danoBase: 3, usosMax: 2, efeito: { tipo: 'queimadura', dano: 80, turnos: 3 }, socketSlots: 0, alcance: 'medio', recarga: 1, descricao: 'Incendeia o alvo, causando Queimadura por 3 turnos.' },
    veneno_de_caca: { nome: 'Veneno de Caça', tipo: 'arma', categoria: 'utilitaria', danoBase: 2, usosMax: 3, efeito: { tipo: 'veneno', dano: 60, turnos: 3 }, socketSlots: 0, alcance: 'medio', recarga: 1, descricao: 'Envenena o alvo, causando dano por 3 turnos.' },
    gaz_de_cegueira: { nome: 'Gás de Cegueira', tipo: 'arma', categoria: 'utilitaria', danoBase: 1, usosMax: 2, efeito: { tipo: 'cegueira', turnos: 2 }, socketSlots: 0, alcance: 'medio', recarga: 2, descricao: 'Cega o alvo por 2 turnos, reduzindo muito a chance de acerto.' },
  },
  armaduras: {
    roupa_de_aventureiro: { nome: 'Roupa de Aventureiro', tipo: 'armadura', defesa: 2, socketSlots: 1, descricao: 'Proteção básica, leve e flexível.' },
    couro: { nome: 'Armadura de Couro', tipo: 'armadura', defesa: 4, socketSlots: 2, descricao: 'Boa proteção sem sacrificar mobilidade.' },
    cota_de_malha: { nome: 'Cota de Malha', tipo: 'armadura', defesa: 6, socketSlots: 3, penalidade: { reflexos: -1 }, descricao: 'Malha de anéis entrelaços — robusta e confiável.' },
    armadura_de_placas: { nome: 'Armadura de Placas', tipo: 'armadura', defesa: 9, socketSlots: 4, penalidade: { reflexos: -1, destreza: -1 }, descricao: 'Fortaleza ambulante — pesada mas praticamente impenetrável.' },
    manto_arcano: { nome: 'Manto Arcano', tipo: 'armadura', defesa: 3, socketSlots: 2, bonus: { inteligencia: 1 }, descricao: 'Tecido encantado que canaliza mana e protege o conjurador.' },
    vestes_sagradas: { nome: 'Vestes Sagradas', tipo: 'armadura', defesa: 3, socketSlots: 2, bonus: { inteligencia: 1 }, descricao: 'Roupas rituais imbuídas de fé divina.' },
    armadura_leve: { nome: 'Armadura Leve', tipo: 'armadura', defesa: 5, socketSlots: 2, bonus: { reflexos: 1 }, descricao: 'Proteção reforçada com mobilidade.' },
  },
};

// Efeitos de status aplicados em batalha.
// tipo: dot = dano por turno | hot = cura por turno | debuff = penalidade passiva | cc = controle (pula turnos)
export const STATUS_DEFS = {
  queimadura: { id: 'queimadura', nome: 'Queimadura', icon: '🔥', tipo: 'dot', desc: 'Causa dano de fogo a cada turno.' },
  sangramento: { id: 'sangramento', nome: 'Sangramento', icon: '🩸', tipo: 'dot', desc: 'Perde HP a cada turno.' },
  veneno: { id: 'veneno', nome: 'Veneno', icon: '☠️', tipo: 'dot', desc: 'Causa dano de veneno a cada turno.' },
  regeneracao: { id: 'regeneracao', nome: 'Regeneração', icon: '🌿', tipo: 'hot', desc: 'Recupera HP a cada turno.' },
  lentidao: { id: 'lentidao', nome: 'Lentidão', icon: '🐢', tipo: 'debuff', desc: 'Reduz a precisão e a esquiva.' },
  cegueira: { id: 'cegueira', nome: 'Cegueira', icon: '🌫️', tipo: 'debuff', desc: 'Reduz muito a chance de acerto.' },
  fraqueza: { id: 'fraqueza', nome: 'Fraqueza', icon: '💢', tipo: 'debuff', desc: 'Reduz o dano físico e mágico causado.' },
  congelamento: { id: 'congelamento', nome: 'Congelamento', icon: '🧊', tipo: 'cc', desc: 'Pula os turnos até se libertar do gelo.' },
};

export const STATUS_KEYS = Object.keys(STATUS_DEFS);

export const POTIONS = {
  // Escala da vida (× 10): 250/600 na mesma proporção de 25/60 na vida antiga.
  pocao_cura: { nome: 'Poção de Cura', tipo: 'pocao', cura: 250, desc: 'Restaura 250 de HP.' },
  pocao_cura_grande: { nome: 'Poção de Cura Grande', tipo: 'pocao', cura: 600, desc: 'Restaura 600 de HP.' },
  elixir_mana: { nome: 'Elixir de Mana', tipo: 'pocao', mana: 25, desc: 'Restaura 25 de MP.' },
  elixir_mana_grande: { nome: 'Elixir de Mana Grande', tipo: 'pocao', mana: 60, desc: 'Restaura 60 de MP.' },
};

export const ATTRIBUTE_KEYS = ['forca', 'inteligencia', 'resistencia', 'destreza', 'reflexos'];
export const ATTRIBUTE_NAMES = {
  forca: 'Força',
  inteligencia: 'Inteligência',
  resistencia: 'Resistência',
  destreza: 'Destreza',
  reflexos: 'Reflexos',
};

// ── Taverna "O Último Copo": bebidas (consumíveis usáveis em combate) ──
// PROVISÓRIO. `preco` em cobre (ℛ). Efeitos lidos pelo _resolveItem do combate:
//   cura          → HP instantâneo
//   mana          → MP instantâneo
//   status        → { tipo, turnos, dano } aplicado em si (ex.: regeneracao)
//   buffFisico    → soma no multiplicador de dano físico (ex.: 0.20 = +20%) por buffTurns
//   buffMagico    → soma no multiplicador de dano mágico por buffTurns
//   removeStatus  → id (ou lista) de status removido de si
//   drunk/drunkTurns → embriaguez: +1 Força, −1 Destreza e Reflexos nas rolagens
// `categoria` agrupa o menu da taverna e `destaque` marca a sugestão do taverneiro.
export const TAVERN_CATEGORIES = [
  { id: 'barril', nome: 'Do Barril', icon: '🍺', blurb: 'Cervejas, cidras e fermentados — o pão líquido do aventureiro.' },
  { id: 'adega', nome: 'Da Adega', icon: '🍷', blurb: 'Vinhos e espumantes guardados em barris de carvalho élfico.' },
  { id: 'destilados', nome: 'Destilados', icon: '🥃', blurb: 'Para quem precisa de coragem — ou de esquecer o dragão.' },
  { id: 'quentes', nome: 'Quentes & Calmantes', icon: '🍵', blurb: 'Infusões e caldos servidos fumegando no balcão.' },
  { id: 'barman', nome: 'Poções do Taverneiro', icon: '⚗️', blurb: 'Misturas secretas que ninguém sabe bem o que levam.' },
  { id: 'sobrio', nome: 'Sem Álcool', icon: '🥤', blurb: 'Refrescos para quem ainda tem um dragão para enfrentar hoje.' },
  // Comidas
  { id: 'petiscos', nome: 'Petiscos', icon: '🥟', blurb: 'Beliscos para abrir o apetite antes da briga.' },
  { id: 'assados', nome: 'Assados & Grelhados', icon: '🍖', blurb: 'Carne na brasa — sustentação de verdade.' },
  { id: 'sopas', nome: 'Sopas & Ensopados', icon: '🍲', blurb: 'Prato fundo e colher, comida de aventureiro.' },
  { id: 'paes', nome: 'Pães & Massas', icon: '🥖', blurb: 'Assados no forno a lenha dos fundos.' },
  { id: 'doces', nome: 'Doces & Sobremesas', icon: '🍰', blurb: 'Para fechar a conta com açúcar.' },
  { id: 'frutas', nome: 'Frutas & Frescos', icon: '🍎', blurb: 'Colhidas no pomar atrás da taverna.' },
];

export const TAVERN_DRINKS = {
  // ── Do Barril ──────────────────────────────────────────────
  cerveja_rustica: {
    categoria: 'barril',
    nome: 'Cerveja Rústica', tipo: 'bebida', preco: 25, emoji: '🍺',
    cura: 60, drunk: true, drunkTurns: 4,
    desc: 'Caneca de barro, espuma grossa. Restaura 60 de HP, mas deixa bêbado (4 turnos): +1 Força, −1 Destreza e Reflexos.',
  },
  chope_do_ultimo_copo: {
    categoria: 'barril',
    nome: 'Chope do Último Copo', tipo: 'bebida', preco: 35, emoji: '🍺',
    cura: 90, drunk: true, drunkTurns: 3,
    desc: 'A casa serve na caneca lascada. Restaura 90 de HP e levanta o ânimo — e um pouco a voz (bêbado por 3 turnos).',
  },
  cidra_picante: {
    categoria: 'barril',
    nome: 'Cidra Picante', tipo: 'bebida', preco: 65, emoji: '🍏',
    cura: 70, buffFisico: 0.1, buffTurns: 3, drunk: true, drunkTurns: 3,
    desc: 'Maçã fermentada com pimenta-do-reino. Cura 70 de HP e esquenta o sangue: +10% de dano físico por 3 turnos (embriaga).',
  },
  cerveja_negra_anao: {
    categoria: 'barril',
    nome: 'Cerveja Negra Anã', tipo: 'bebida', preco: 70, emoji: '🍻',
    cura: 180, drunk: true, drunkTurns: 4,
    desc: 'Escura como a mina, encorpada como o martelo. Restaura 180 de HP — e derruba qualquer elfo de uma caneca só (bêbado 4 turnos).',
  },
  kvas_de_mel: {
    categoria: 'barril',
    nome: 'Kvas de Mel', tipo: 'bebida', preco: 110, emoji: '🍯',
    cura: 300,
    desc: 'Bebida anã espessa, adoçada com mel de caverna: restaura 300 de HP. Sem ressaca — os anões juram.',
  },
  hidromel_brutal: {
    categoria: 'barril',
    nome: 'Hidromel Brutal', tipo: 'bebida', preco: 80, emoji: '🫗',
    buffFisico: 0.2, buffTurns: 3,
    desc: 'Fúria líquida destilada de mel de abelha gigante: +20% de dano físico por 3 turnos.',
  },

  // ── Da Adega ───────────────────────────────────────────────
  vinho_elfico: {
    categoria: 'adega',
    nome: 'Vinho Élfico', tipo: 'bebida', preco: 60, emoji: '🍷',
    cura: 40, mana: 20,
    desc: 'Servido em taça fina, colhido sob a lua. Restaura 40 de HP e 20 de MP: leve e revigorante.',
  },
  vinho_das_virtudes: {
    categoria: 'adega',
    nome: 'Vinho das Virtudes', tipo: 'bebida', preco: 85, emoji: '🍷',
    cura: 30, mana: 45,
    desc: 'Engarrafado por monges vinicultores. Pouco para o corpo, muito para a mente: 30 de HP e 45 de MP.',
  },
  vinho_de_sangue: {
    categoria: 'adega',
    nome: 'Vinho de Sangue', tipo: 'bebida', preco: 130, emoji: '🍷',
    cura: 120, buffFisico: 0.15, buffTurns: 3, drunk: true, drunkTurns: 3,
    desc: 'Tinto, encorpado e um tanto inquietante. Cura 120 de HP e +15% de dano físico por 3 turnos (embriaga).',
  },
  espumante_elfico: {
    categoria: 'adega',
    nome: 'Espumante Élfico', tipo: 'bebida', preco: 120, emoji: '🥂',
    mana: 60, buffMagico: 0.1, buffTurns: 3,
    desc: 'As bolhas cantam de verdade. Restaura 60 de MP e +10% de dano mágico por 3 turnos.',
  },

  // ── Destilados ─────────────────────────────────────────────
  aguardente_anao: {
    categoria: 'destilados',
    nome: 'Aguardente Anã', tipo: 'bebida', preco: 100, emoji: '🥃',
    buffFisico: 0.15, buffTurns: 3, drunk: true, drunkTurns: 3,
    desc: 'Passada em barril de pedra e servida a fogo. +15% de dano físico por 3 turnos, mas embriaga (3 turnos).',
  },
  absinto_arcano: {
    categoria: 'destilados',
    nome: 'Absinto Arcano', tipo: 'bebida', preco: 90, emoji: '🧪',
    buffMagico: 0.2, buffTurns: 3,
    desc: 'Verde, fumegante e proibido em três reinos. +20% de dano mágico por 3 turnos.',
  },
  grogue_do_marujo: {
    categoria: 'destilados',
    nome: 'Grogue do Marujo', tipo: 'bebida', preco: 55, emoji: '🍶',
    cura: 150, drunk: true, drunkTurns: 5,
    desc: 'Servido em caneca de estanho com um torrão de açúcar. Cura 150 de HP e deixa o mundo balançando (bêbado 5 turnos).',
  },
  rum_do_corsario: {
    categoria: 'destilados',
    nome: 'Rum do Corsário', tipo: 'bebida', preco: 110, emoji: '🥃',
    buffFisico: 0.25, buffTurns: 3, drunk: true, drunkTurns: 4,
    desc: 'Contrabandeado das Ilhas Partidas. +25% de dano físico por 3 turnos; quem bebe vê dois inimigos — ótimo, se acertar os dois (embriaga).',
  },
  uisque_do_pistoleiro: {
    categoria: 'destilados',
    nome: 'Uísque do Pistoleiro', tipo: 'bebida', preco: 115, emoji: '🍸',
    cura: 60, buffFisico: 0.2, buffTurns: 2, drunk: true, drunkTurns: 3,
    desc: 'Servido com uma bala dentro em vez de gelo. Cura 60 de HP e afia a mira por poucos segundos: +20% de dano físico por 2 turnos (embriaga).',
  },

  // ── Quentes & Calmantes ────────────────────────────────────
  cha_restaurador: {
    categoria: 'quentes',
    nome: 'Chá Restaurador', tipo: 'bebida', preco: 70, emoji: '🍵',
    removeStatus: ['veneno', 'sangramento', 'queimadura'],
    desc: 'Antídoto quente com folhas amargas. Limpa Veneno, Sangramento e Queimadura.',
  },
  cafe_do_vigia: {
    categoria: 'quentes',
    nome: 'Café do Vigia', tipo: 'bebida', preco: 60, emoji: '☕',
    mana: 30, removeStatus: ['lentidao', 'cegueira'],
    desc: 'Grosso, preto e amargo como o turno da madrugada. Restaura 30 de MP e espanta o sono: limpa Lentidão e Cegueira.',
  },
  cha_de_erva_cinza: {
    categoria: 'quentes',
    nome: 'Chá de Erva-Cinza', tipo: 'bebida', preco: 75, emoji: '🍵',
    removeStatus: ['veneno', 'fraqueza'],
    desc: 'Colhida nos pântanos ao amanhecer. Purga Veneno e devolve as forças, limpando Fraqueza.',
  },
  caldo_revigorante: {
    categoria: 'quentes',
    nome: 'Caldo Revigorante', tipo: 'bebida', preco: 95, emoji: '🍲',
    status: { tipo: 'regeneracao', turnos: 5, dano: 80 },
    desc: 'Caldo servido na tigela de barro. Regenera 80 de HP por turno durante 5 turnos.',
  },
  leite_quente_com_mel: {
    categoria: 'quentes',
    nome: 'Leite Quente com Mel', tipo: 'bebida', preco: 45, emoji: '🥛',
    cura: 80, removeStatus: ['congelamento', 'lentidao'],
    desc: 'O que a taverneira serve a quem voltou tremendo do gelo. Cura 80 de HP e limpa Congelamento e Lentidão.',
  },

  // ── Poções do Taverneiro ───────────────────────────────────
  elixir_vigor: {
    categoria: 'barman',
    nome: 'Elixir do Vigor', tipo: 'bebida', preco: 120, emoji: '🌿',
    status: { tipo: 'regeneracao', turnos: 4, dano: 120 },
    desc: 'Infusão verde preparada atrás do balcão. Regenera 120 de HP por turno durante 4 turnos.',
  },
  agua_lunar: {
    categoria: 'barman',
    nome: 'Água Lunar', tipo: 'bebida', preco: 140, emoji: '🌙',
    mana: 80, status: { tipo: 'regeneracao', turnos: 3, dano: 60 },
    desc: 'Destilada de orvalho à luz da lua cheia. Restaura 80 de MP e regenera 60 de HP por turno durante 3 turnos.',
  },
  sangue_de_dragao: {
    categoria: 'barman',
    nome: 'Sangue de Dragão', tipo: 'bebida', preco: 220, emoji: '🩸',
    buffFisico: 0.4, buffTurns: 2, drunk: true, drunkTurns: 4,
    desc: 'Uma dose que custa o salário de um cavaleiro. +40% de dano físico por 2 turnos — depois você vai querer deitar (bêbado 4 turnos).',
  },
  dose_do_taverneiro: {
    categoria: 'barman', destaque: true,
    nome: 'Dose do Taverneiro', tipo: 'bebida', preco: 260, emoji: '🍹',
    cura: 200, mana: 40, buffFisico: 0.2, buffMagico: 0.2, buffTurns: 3, drunk: true, drunkTurns: 3,
    desc: 'A mistura secreta da casa, servida em copo que ninguém ousa lavar. Cura 200 de HP, 40 de MP e +20% de dano físico e mágico por 3 turnos (embriaga).',
  },

  // ── Sem Álcool ─────────────────────────────────────────────
  agua_da_fonte: {
    categoria: 'sobrio',
    nome: 'Água da Fonte', tipo: 'bebida', preco: 10, emoji: '💧',
    cura: 40,
    desc: 'Gelada, direto do poço dos fundos. Restaura 40 de HP e não atrapalha a mira.',
  },
  suco_do_bosque: {
    categoria: 'sobrio',
    nome: 'Suco do Bosque', tipo: 'bebida', preco: 30, emoji: '🧃',
    cura: 50, mana: 15,
    desc: 'Frutas esmagadas na hora. Restaura 50 de HP e 15 de MP — sóbrio e pronto para o próximo turno.',
  },

  // ── Novas bebidas (100 geradas) ──
  bebida_001: {"categoria":"barril","nome":"Cerveja Âmbar","tipo":"bebida","preco":10,"emoji":"🍻","cura":20,"mana":10,"buffFisico":0.05,"buffTurns":2,"buffMagico":0.05,"status":{"tipo":"regeneracao","turnos":3,"dano":40},"removeStatus":["veneno"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 20 de HP, 10 de MP, +5% de dano físico (2t), +5% de dano mágico (2t), regenera 40 de HP/turno (3t), limpa veneno, embriaga (2t)."},
  bebida_002: {"categoria":"adega","nome":"Espumante da Montanha","tipo":"bebida","preco":45,"emoji":"🍷","cura":33,"desc":"Bebida da casa: restaura 33 de HP."},
  bebida_003: {"categoria":"destilados","nome":"Rum das Fadas","tipo":"bebida","preco":80,"emoji":"🧪","cura":46,"desc":"Bebida da casa: restaura 46 de HP."},
  bebida_004: {"categoria":"quentes","nome":"Caldo Festiva","tipo":"bebida","preco":115,"emoji":"☕","cura":59,"mana":61,"desc":"Bebida da casa: restaura 59 de HP, 61 de MP."},
  bebida_005: {"categoria":"barman","nome":"Amaro Ancestral","tipo":"bebida","preco":150,"emoji":"⚗️","cura":72,"buffFisico":0.13,"buffTurns":3,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 72 de HP, +13% de dano físico (3t), embriaga (2t)."},
  bebida_006: {"categoria":"sobrio","nome":"Chá Gelado Cristalina","tipo":"bebida","preco":35,"emoji":"🥤","cura":85,"buffMagico":0.15,"buffTurns":4,"desc":"Bebida da casa: restaura 85 de HP, +15% de dano mágico (4t)."},
  bebida_007: {"categoria":"barril","nome":"Cerveja Clara de Especiarias","tipo":"bebida","preco":70,"emoji":"🍻","cura":98,"mana":32,"removeStatus":["congelamento"],"desc":"Bebida da casa: restaura 98 de HP, 32 de MP, limpa congelamento."},
  bebida_008: {"categoria":"adega","nome":"Vinho Rústica","tipo":"bebida","preco":105,"emoji":"🍷","cura":111,"status":{"tipo":"regeneracao","turnos":6,"dano":117},"desc":"Bebida da casa: restaura 111 de HP, regenera 117 de HP/turno (6t)."},
  bebida_009: {"categoria":"destilados","nome":"Uísque de Inverno","tipo":"bebida","preco":140,"emoji":"🍸","cura":124,"buffFisico":0.07,"buffTurns":4,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 124 de HP, +7% de dano físico (4t), embriaga (2t)."},
  bebida_010: {"categoria":"quentes","nome":"Cordial Rubra","tipo":"bebida","preco":25,"emoji":"☕","cura":137,"mana":83,"desc":"Bebida da casa: restaura 137 de HP, 83 de MP."},
  bebida_011: {"categoria":"barman","nome":"Amaro do Bosque","tipo":"bebida","preco":60,"emoji":"⚗️","cura":150,"buffMagico":0.13,"buffTurns":3,"desc":"Bebida da casa: restaura 150 de HP, +13% de dano mágico (3t)."},
  bebida_012: {"categoria":"sobrio","nome":"Suco de Carvalho","tipo":"bebida","preco":95,"emoji":"🧃","cura":163,"desc":"Bebida da casa: restaura 163 de HP."},
  bebida_013: {"categoria":"barril","nome":"Cerveja Negra Suave","tipo":"bebida","preco":130,"emoji":"🍻","cura":176,"mana":54,"buffFisico":0.15,"buffTurns":2,"removeStatus":["fraqueza"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 176 de HP, 54 de MP, +15% de dano físico (2t), limpa fraqueza, embriaga (2t)."},
  bebida_014: {"categoria":"adega","nome":"Tinto do Taverneiro","tipo":"bebida","preco":15,"emoji":"🍷","cura":189,"desc":"Bebida da casa: restaura 189 de HP."},
  bebida_015: {"categoria":"destilados","nome":"Aguardente Turva","tipo":"bebida","preco":50,"emoji":"🧪","cura":202,"status":{"tipo":"regeneracao","turnos":5,"dano":194},"desc":"Bebida da casa: restaura 202 de HP, regenera 194 de HP/turno (5t)."},
  bebida_016: {"categoria":"quentes","nome":"Ponche de Mel","tipo":"bebida","preco":85,"emoji":"☕","cura":215,"mana":25,"buffMagico":0.11,"buffTurns":2,"desc":"Bebida da casa: restaura 215 de HP, 25 de MP, +11% de dano mágico (2t)."},
  bebida_017: {"categoria":"barman","nome":"Amaro Real","tipo":"bebida","preco":120,"emoji":"⚗️","cura":228,"buffFisico":0.09,"buffTurns":3,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 228 de HP, +9% de dano físico (3t), embriaga (2t)."},
  bebida_018: {"categoria":"sobrio","nome":"Água da Lua","tipo":"bebida","preco":155,"emoji":"🥤","cura":241,"desc":"Bebida da casa: restaura 241 de HP."},
  bebida_019: {"categoria":"barril","nome":"Malte Dourada","tipo":"bebida","preco":40,"emoji":"🍻","cura":254,"mana":76,"removeStatus":["cegueira"],"desc":"Bebida da casa: restaura 254 de HP, 76 de MP, limpa cegueira."},
  bebida_020: {"categoria":"adega","nome":"Branco Selvagem","tipo":"bebida","preco":75,"emoji":"🍷","cura":267,"desc":"Bebida da casa: restaura 267 de HP."},
  bebida_021: {"categoria":"destilados","nome":"Cachaça Fumegante","tipo":"bebida","preco":110,"emoji":"🍸","cura":280,"buffFisico":0.17,"buffTurns":4,"buffMagico":0.09,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 280 de HP, +17% de dano físico (4t), +9% de dano mágico (4t), embriaga (2t)."},
  bebida_022: {"categoria":"quentes","nome":"Chá Amarga","tipo":"bebida","preco":145,"emoji":"☕","cura":293,"mana":47,"status":{"tipo":"regeneracao","turnos":4,"dano":111},"desc":"Bebida da casa: restaura 293 de HP, 47 de MP, regenera 111 de HP/turno (4t)."},
  bebida_023: {"categoria":"barman","nome":"Amaro do Marujo","tipo":"bebida","preco":30,"emoji":"⚗️","cura":306,"desc":"Bebida da casa: restaura 306 de HP."},
  bebida_024: {"categoria":"sobrio","nome":"Refresco Defumada","tipo":"bebida","preco":65,"emoji":"🧃","cura":319,"desc":"Bebida da casa: restaura 319 de HP."},
  bebida_025: {"categoria":"barril","nome":"Hidromel do Porto","tipo":"bebida","preco":100,"emoji":"🍻","cura":332,"mana":18,"buffFisico":0.11,"buffTurns":2,"removeStatus":["lentidao"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 332 de HP, 18 de MP, +11% de dano físico (2t), limpa lentidao, embriaga (2t)."},
  bebida_026: {"categoria":"adega","nome":"Vinho Licoroso do Abismo","tipo":"bebida","preco":135,"emoji":"🍷","cura":345,"buffMagico":0.07,"buffTurns":3,"desc":"Bebida da casa: restaura 345 de HP, +7% de dano mágico (3t)."},
  bebida_027: {"categoria":"destilados","nome":"Bagaceira do Dragão","tipo":"bebida","preco":20,"emoji":"🧪","cura":358,"desc":"Bebida da casa: restaura 358 de HP."},
  bebida_028: {"categoria":"quentes","nome":"Café Escura","tipo":"bebida","preco":55,"emoji":"☕","cura":371,"mana":69,"desc":"Bebida da casa: restaura 371 de HP, 69 de MP."},
  bebida_029: {"categoria":"barman","nome":"Amaro Antiga","tipo":"bebida","preco":90,"emoji":"⚗️","cura":24,"buffFisico":0.05,"buffTurns":3,"status":{"tipo":"regeneracao","turnos":3,"dano":188},"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 24 de HP, +5% de dano físico (3t), regenera 188 de HP/turno (3t), embriaga (2t)."},
  bebida_030: {"categoria":"sobrio","nome":"Néctar Gelada","tipo":"bebida","preco":125,"emoji":"🥤","cura":37,"desc":"Bebida da casa: restaura 37 de HP."},
  bebida_031: {"categoria":"barril","nome":"Kvas Brilhante","tipo":"bebida","preco":10,"emoji":"🍻","cura":50,"mana":40,"buffMagico":0.05,"buffTurns":2,"removeStatus":["queimadura"],"desc":"Bebida da casa: restaura 50 de HP, 40 de MP, +5% de dano mágico (2t), limpa queimadura."},
  bebida_032: {"categoria":"adega","nome":"Reserva de Verão","tipo":"bebida","preco":45,"emoji":"🍷","cura":63,"desc":"Bebida da casa: restaura 63 de HP."},
  bebida_033: {"categoria":"destilados","nome":"Conhaque Âmbar","tipo":"bebida","preco":80,"emoji":"🍸","cura":76,"buffFisico":0.13,"buffTurns":4,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 76 de HP, +13% de dano físico (4t), embriaga (2t)."},
  bebida_034: {"categoria":"quentes","nome":"Infusão da Montanha","tipo":"bebida","preco":115,"emoji":"☕","cura":89,"mana":11,"desc":"Bebida da casa: restaura 89 de HP, 11 de MP."},
  bebida_035: {"categoria":"barman","nome":"Amaro das Fadas","tipo":"bebida","preco":150,"emoji":"⚗️","cura":102,"desc":"Bebida da casa: restaura 102 de HP."},
  bebida_036: {"categoria":"sobrio","nome":"Limonada Festiva","tipo":"bebida","preco":35,"emoji":"🧃","cura":115,"buffMagico":0.15,"buffTurns":4,"status":{"tipo":"regeneracao","turnos":6,"dano":105},"desc":"Bebida da casa: restaura 115 de HP, +15% de dano mágico (4t), regenera 105 de HP/turno (6t)."},
  bebida_037: {"categoria":"barril","nome":"Cidra Ancestral","tipo":"bebida","preco":70,"emoji":"🍻","cura":128,"mana":62,"buffFisico":0.07,"buffTurns":2,"removeStatus":["sangramento"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 128 de HP, 62 de MP, +7% de dano físico (2t), limpa sangramento, embriaga (2t)."},
  bebida_038: {"categoria":"adega","nome":"Colheita Cristalina","tipo":"bebida","preco":105,"emoji":"🍷","cura":141,"desc":"Bebida da casa: restaura 141 de HP."},
  bebida_039: {"categoria":"destilados","nome":"Vodka de Especiarias","tipo":"bebida","preco":140,"emoji":"🧪","cura":154,"desc":"Bebida da casa: restaura 154 de HP."},
  bebida_040: {"categoria":"quentes","nome":"Caldo Rústica","tipo":"bebida","preco":25,"emoji":"☕","cura":167,"mana":33,"desc":"Bebida da casa: restaura 167 de HP, 33 de MP."},
  bebida_041: {"categoria":"barman","nome":"Amaro de Inverno","tipo":"bebida","preco":60,"emoji":"⚗️","cura":180,"buffFisico":0.15,"buffTurns":3,"buffMagico":0.13,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 180 de HP, +15% de dano físico (3t), +13% de dano mágico (3t), embriaga (2t)."},
  bebida_042: {"categoria":"sobrio","nome":"Chá Gelado Rubra","tipo":"bebida","preco":95,"emoji":"🥤","cura":193,"desc":"Bebida da casa: restaura 193 de HP."},
  bebida_043: {"categoria":"barril","nome":"Chope do Bosque","tipo":"bebida","preco":130,"emoji":"🍻","cura":206,"mana":84,"status":{"tipo":"regeneracao","turnos":5,"dano":182},"removeStatus":["veneno"],"desc":"Bebida da casa: restaura 206 de HP, 84 de MP, regenera 182 de HP/turno (5t), limpa veneno."},
  bebida_044: {"categoria":"adega","nome":"Sangria de Carvalho","tipo":"bebida","preco":15,"emoji":"🍷","cura":219,"desc":"Bebida da casa: restaura 219 de HP."},
  bebida_045: {"categoria":"destilados","nome":"Gim Suave","tipo":"bebida","preco":50,"emoji":"🍸","cura":232,"buffFisico":0.09,"buffTurns":4,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 232 de HP, +9% de dano físico (4t), embriaga (2t)."},
  bebida_046: {"categoria":"quentes","nome":"Cordial do Taverneiro","tipo":"bebida","preco":85,"emoji":"☕","cura":245,"mana":55,"buffMagico":0.11,"buffTurns":2,"desc":"Bebida da casa: restaura 245 de HP, 55 de MP, +11% de dano mágico (2t)."},
  bebida_047: {"categoria":"barman","nome":"Amaro Turva","tipo":"bebida","preco":120,"emoji":"⚗️","cura":258,"desc":"Bebida da casa: restaura 258 de HP."},
  bebida_048: {"categoria":"sobrio","nome":"Suco de Mel","tipo":"bebida","preco":155,"emoji":"🧃","cura":271,"desc":"Bebida da casa: restaura 271 de HP."},
  bebida_049: {"categoria":"barril","nome":"Cerveja Real","tipo":"bebida","preco":40,"emoji":"🍻","cura":284,"mana":26,"buffFisico":0.17,"buffTurns":2,"removeStatus":["congelamento"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 284 de HP, 26 de MP, +17% de dano físico (2t), limpa congelamento, embriaga (2t)."},
  bebida_050: {"categoria":"adega","nome":"Espumante da Lua","tipo":"bebida","preco":75,"emoji":"🍷","cura":297,"status":{"tipo":"regeneracao","turnos":4,"dano":99},"desc":"Bebida da casa: restaura 297 de HP, regenera 99 de HP/turno (4t)."},
  bebida_051: {"categoria":"destilados","nome":"Rum Dourada","tipo":"bebida","preco":110,"emoji":"🧪","cura":310,"buffMagico":0.09,"buffTurns":4,"desc":"Bebida da casa: restaura 310 de HP, +9% de dano mágico (4t)."},
  bebida_052: {"categoria":"quentes","nome":"Ponche Selvagem","tipo":"bebida","preco":145,"emoji":"☕","cura":323,"mana":77,"desc":"Bebida da casa: restaura 323 de HP, 77 de MP."},
  bebida_053: {"categoria":"barman","nome":"Amaro Fumegante","tipo":"bebida","preco":30,"emoji":"⚗️","cura":336,"buffFisico":0.11,"buffTurns":3,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 336 de HP, +11% de dano físico (3t), embriaga (2t)."},
  bebida_054: {"categoria":"sobrio","nome":"Água Amarga","tipo":"bebida","preco":65,"emoji":"🥤","cura":349,"desc":"Bebida da casa: restaura 349 de HP."},
  bebida_055: {"categoria":"barril","nome":"Cerveja Clara do Marujo","tipo":"bebida","preco":100,"emoji":"🍻","cura":362,"mana":48,"removeStatus":["fraqueza"],"desc":"Bebida da casa: restaura 362 de HP, 48 de MP, limpa fraqueza."},
  bebida_056: {"categoria":"adega","nome":"Vinho Defumada","tipo":"bebida","preco":135,"emoji":"🍷","cura":375,"buffMagico":0.07,"buffTurns":3,"desc":"Bebida da casa: restaura 375 de HP, +7% de dano mágico (3t)."},
  bebida_057: {"categoria":"destilados","nome":"Uísque do Porto","tipo":"bebida","preco":20,"emoji":"🍸","cura":28,"buffFisico":0.05,"buffTurns":4,"status":{"tipo":"regeneracao","turnos":3,"dano":176},"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 28 de HP, +5% de dano físico (4t), regenera 176 de HP/turno (3t), embriaga (2t)."},
  bebida_058: {"categoria":"quentes","nome":"Chá do Abismo","tipo":"bebida","preco":55,"emoji":"☕","cura":41,"mana":19,"desc":"Bebida da casa: restaura 41 de HP, 19 de MP."},
  bebida_059: {"categoria":"barman","nome":"Amaro do Dragão","tipo":"bebida","preco":90,"emoji":"⚗️","cura":54,"desc":"Bebida da casa: restaura 54 de HP."},
  bebida_060: {"categoria":"sobrio","nome":"Refresco Escura","tipo":"bebida","preco":125,"emoji":"🧃","cura":67,"desc":"Bebida da casa: restaura 67 de HP."},
  bebida_061: {"categoria":"barril","nome":"Cerveja Negra Antiga","tipo":"bebida","preco":10,"emoji":"🍻","cura":80,"mana":70,"buffFisico":0.13,"buffTurns":2,"buffMagico":0.05,"removeStatus":["cegueira"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 80 de HP, 70 de MP, +13% de dano físico (2t), +5% de dano mágico (2t), limpa cegueira, embriaga (2t)."},
  bebida_062: {"categoria":"adega","nome":"Tinto Gelada","tipo":"bebida","preco":45,"emoji":"🍷","cura":93,"desc":"Bebida da casa: restaura 93 de HP."},
  bebida_063: {"categoria":"destilados","nome":"Aguardente Brilhante","tipo":"bebida","preco":80,"emoji":"🧪","cura":106,"desc":"Bebida da casa: restaura 106 de HP."},
  bebida_064: {"categoria":"quentes","nome":"Café de Verão","tipo":"bebida","preco":115,"emoji":"☕","cura":119,"mana":41,"status":{"tipo":"regeneracao","turnos":6,"dano":93},"desc":"Bebida da casa: restaura 119 de HP, 41 de MP, regenera 93 de HP/turno (6t)."},
  bebida_065: {"categoria":"barman","nome":"Amaro Âmbar","tipo":"bebida","preco":150,"emoji":"⚗️","cura":132,"buffFisico":0.07,"buffTurns":3,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 132 de HP, +7% de dano físico (3t), embriaga (2t)."},
  bebida_066: {"categoria":"sobrio","nome":"Néctar da Montanha","tipo":"bebida","preco":35,"emoji":"🥤","cura":145,"buffMagico":0.15,"buffTurns":4,"desc":"Bebida da casa: restaura 145 de HP, +15% de dano mágico (4t)."},
  bebida_067: {"categoria":"barril","nome":"Malte das Fadas","tipo":"bebida","preco":70,"emoji":"🍻","cura":158,"mana":12,"removeStatus":["lentidao"],"desc":"Bebida da casa: restaura 158 de HP, 12 de MP, limpa lentidao."},
  bebida_068: {"categoria":"adega","nome":"Branco Festiva","tipo":"bebida","preco":105,"emoji":"🍷","cura":171,"desc":"Bebida da casa: restaura 171 de HP."},
  bebida_069: {"categoria":"destilados","nome":"Cachaça Ancestral","tipo":"bebida","preco":140,"emoji":"🍸","cura":184,"buffFisico":0.15,"buffTurns":4,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 184 de HP, +15% de dano físico (4t), embriaga (2t)."},
  bebida_070: {"categoria":"quentes","nome":"Infusão Cristalina","tipo":"bebida","preco":25,"emoji":"☕","cura":197,"mana":63,"desc":"Bebida da casa: restaura 197 de HP, 63 de MP."},
  bebida_071: {"categoria":"barman","nome":"Amaro de Especiarias","tipo":"bebida","preco":60,"emoji":"⚗️","cura":210,"buffMagico":0.13,"buffTurns":3,"status":{"tipo":"regeneracao","turnos":5,"dano":170},"desc":"Bebida da casa: restaura 210 de HP, +13% de dano mágico (3t), regenera 170 de HP/turno (5t)."},
  bebida_072: {"categoria":"sobrio","nome":"Limonada Rústica","tipo":"bebida","preco":95,"emoji":"🧃","cura":223,"desc":"Bebida da casa: restaura 223 de HP."},
  bebida_073: {"categoria":"barril","nome":"Hidromel de Inverno","tipo":"bebida","preco":130,"emoji":"🍻","cura":236,"mana":34,"buffFisico":0.09,"buffTurns":2,"removeStatus":["queimadura"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 236 de HP, 34 de MP, +9% de dano físico (2t), limpa queimadura, embriaga (2t)."},
  bebida_074: {"categoria":"adega","nome":"Vinho Licoroso Rubra","tipo":"bebida","preco":15,"emoji":"🍷","cura":249,"desc":"Bebida da casa: restaura 249 de HP."},
  bebida_075: {"categoria":"destilados","nome":"Bagaceira do Bosque","tipo":"bebida","preco":50,"emoji":"🧪","cura":262,"desc":"Bebida da casa: restaura 262 de HP."},
  bebida_076: {"categoria":"quentes","nome":"Caldo de Carvalho","tipo":"bebida","preco":85,"emoji":"☕","cura":275,"mana":85,"buffMagico":0.11,"buffTurns":2,"desc":"Bebida da casa: restaura 275 de HP, 85 de MP, +11% de dano mágico (2t)."},
  bebida_077: {"categoria":"barman","nome":"Amaro Suave","tipo":"bebida","preco":120,"emoji":"⚗️","cura":288,"buffFisico":0.17,"buffTurns":3,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 288 de HP, +17% de dano físico (3t), embriaga (2t)."},
  bebida_078: {"categoria":"sobrio","nome":"Chá Gelado do Taverneiro","tipo":"bebida","preco":155,"emoji":"🥤","cura":301,"status":{"tipo":"regeneracao","turnos":4,"dano":87},"desc":"Bebida da casa: restaura 301 de HP, regenera 87 de HP/turno (4t)."},
  bebida_079: {"categoria":"barril","nome":"Kvas Turva","tipo":"bebida","preco":40,"emoji":"🍻","cura":314,"mana":56,"removeStatus":["sangramento"],"desc":"Bebida da casa: restaura 314 de HP, 56 de MP, limpa sangramento."},
  bebida_080: {"categoria":"adega","nome":"Reserva de Mel","tipo":"bebida","preco":75,"emoji":"🍷","cura":327,"desc":"Bebida da casa: restaura 327 de HP."},
  bebida_081: {"categoria":"destilados","nome":"Conhaque Real","tipo":"bebida","preco":110,"emoji":"🍸","cura":340,"buffFisico":0.11,"buffTurns":4,"buffMagico":0.09,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 340 de HP, +11% de dano físico (4t), +9% de dano mágico (4t), embriaga (2t)."},
  bebida_082: {"categoria":"quentes","nome":"Cordial da Lua","tipo":"bebida","preco":145,"emoji":"☕","cura":353,"mana":27,"desc":"Bebida da casa: restaura 353 de HP, 27 de MP."},
  bebida_083: {"categoria":"barman","nome":"Amaro Dourada","tipo":"bebida","preco":30,"emoji":"⚗️","cura":366,"desc":"Bebida da casa: restaura 366 de HP."},
  bebida_084: {"categoria":"sobrio","nome":"Suco Selvagem","tipo":"bebida","preco":65,"emoji":"🧃","cura":379,"desc":"Bebida da casa: restaura 379 de HP."},
  bebida_085: {"categoria":"barril","nome":"Cidra Fumegante","tipo":"bebida","preco":100,"emoji":"🍻","cura":32,"mana":78,"buffFisico":0.05,"buffTurns":2,"status":{"tipo":"regeneracao","turnos":3,"dano":164},"removeStatus":["veneno"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 32 de HP, 78 de MP, +5% de dano físico (2t), regenera 164 de HP/turno (3t), limpa veneno, embriaga (2t)."},
  bebida_086: {"categoria":"adega","nome":"Colheita Amarga","tipo":"bebida","preco":135,"emoji":"🍷","cura":45,"buffMagico":0.07,"buffTurns":3,"desc":"Bebida da casa: restaura 45 de HP, +7% de dano mágico (3t)."},
  bebida_087: {"categoria":"destilados","nome":"Vodka do Marujo","tipo":"bebida","preco":20,"emoji":"🧪","cura":58,"desc":"Bebida da casa: restaura 58 de HP."},
  bebida_088: {"categoria":"quentes","nome":"Ponche Defumada","tipo":"bebida","preco":55,"emoji":"☕","cura":71,"mana":49,"desc":"Bebida da casa: restaura 71 de HP, 49 de MP."},
  bebida_089: {"categoria":"barman","nome":"Amaro do Porto","tipo":"bebida","preco":90,"emoji":"⚗️","cura":84,"buffFisico":0.13,"buffTurns":3,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 84 de HP, +13% de dano físico (3t), embriaga (2t)."},
  bebida_090: {"categoria":"sobrio","nome":"Água do Abismo","tipo":"bebida","preco":125,"emoji":"🥤","cura":97,"desc":"Bebida da casa: restaura 97 de HP."},
  bebida_091: {"categoria":"barril","nome":"Chope do Dragão","tipo":"bebida","preco":10,"emoji":"🍻","cura":110,"mana":20,"buffMagico":0.05,"buffTurns":2,"removeStatus":["congelamento"],"desc":"Bebida da casa: restaura 110 de HP, 20 de MP, +5% de dano mágico (2t), limpa congelamento."},
  bebida_092: {"categoria":"adega","nome":"Sangria Escura","tipo":"bebida","preco":45,"emoji":"🍷","cura":123,"status":{"tipo":"regeneracao","turnos":6,"dano":81},"desc":"Bebida da casa: restaura 123 de HP, regenera 81 de HP/turno (6t)."},
  bebida_093: {"categoria":"destilados","nome":"Gim Antiga","tipo":"bebida","preco":80,"emoji":"🍸","cura":136,"buffFisico":0.07,"buffTurns":4,"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 136 de HP, +7% de dano físico (4t), embriaga (2t)."},
  bebida_094: {"categoria":"quentes","nome":"Chá Gelada","tipo":"bebida","preco":115,"emoji":"☕","cura":149,"mana":71,"desc":"Bebida da casa: restaura 149 de HP, 71 de MP."},
  bebida_095: {"categoria":"barman","nome":"Amaro Brilhante","tipo":"bebida","preco":150,"emoji":"⚗️","cura":162,"desc":"Bebida da casa: restaura 162 de HP."},
  bebida_096: {"categoria":"sobrio","nome":"Refresco de Verão","tipo":"bebida","preco":35,"emoji":"🧃","cura":175,"buffMagico":0.15,"buffTurns":4,"desc":"Bebida da casa: restaura 175 de HP, +15% de dano mágico (4t)."},
  bebida_097: {"categoria":"barril","nome":"Cerveja Âmbar (2)","tipo":"bebida","preco":70,"emoji":"🍻","cura":188,"mana":42,"buffFisico":0.15,"buffTurns":2,"removeStatus":["fraqueza"],"drunk":true,"drunkTurns":2,"desc":"Bebida da casa: restaura 188 de HP, 42 de MP, +15% de dano físico (2t), limpa fraqueza, embriaga (2t)."},
  bebida_098: {"categoria":"adega","nome":"Espumante da Montanha (2)","tipo":"bebida","preco":105,"emoji":"🍷","cura":201,"desc":"Bebida da casa: restaura 201 de HP."},
  bebida_099: {"categoria":"destilados","nome":"Rum das Fadas (2)","tipo":"bebida","preco":140,"emoji":"🧪","cura":214,"status":{"tipo":"regeneracao","turnos":5,"dano":158},"desc":"Bebida da casa: restaura 214 de HP, regenera 158 de HP/turno (5t)."},
  bebida_100: {"categoria":"quentes","nome":"Café Festiva","tipo":"bebida","preco":25,"emoji":"☕","cura":227,"mana":13,"desc":"Bebida da casa: restaura 227 de HP, 13 de MP."},
};

export const TAVERN_FOODS = {
  // ── Comidas da taverna (100 geradas) ──
  comida_001: {"categoria":"petiscos","nome":"Pastel de Vaca","tipo":"comida","preco":8,"emoji":"🍤","cura":30,"mana":10,"buffFisico":0.05,"buffTurns":2,"buffMagico":0.05,"status":{"tipo":"regeneracao","turnos":3,"dano":50},"removeStatus":["queimadura","fraqueza","sangramento"],"desc":"Prato da casa: restaura 30 de HP, 10 de MP, +5% de dano físico (2t), +5% de dano mágico (2t), regenera 50 de HP/turno (3t), limpa queimadura, fraqueza, sangramento."},
  comida_002: {"categoria":"assados","nome":"Grelhado de Veado do Taverneiro","tipo":"comida","preco":33,"emoji":"🍖","cura":47,"desc":"Prato da casa: restaura 47 de HP."},
  comida_003: {"categoria":"sopas","nome":"Caldo de Peixe Refogado","tipo":"comida","preco":58,"emoji":"🍜","cura":64,"desc":"Prato da casa: restaura 64 de HP."},
  comida_004: {"categoria":"paes","nome":"Torta de Pera","tipo":"comida","preco":83,"emoji":"🥐","cura":81,"desc":"Prato da casa: restaura 81 de HP."},
  comida_005: {"categoria":"doces","nome":"Compota de Maçã","tipo":"comida","preco":108,"emoji":"🍩","cura":98,"desc":"Prato da casa: restaura 98 de HP."},
  comida_006: {"categoria":"frutas","nome":"Frutas Vermelhas Dourado","tipo":"comida","preco":13,"emoji":"🍎","cura":115,"mana":25,"desc":"Prato da casa: restaura 115 de HP, 25 de MP."},
  comida_007: {"categoria":"petiscos","nome":"Brusqueta de Touro","tipo":"comida","preco":38,"emoji":"🥨","cura":132,"buffFisico":0.05,"buffTurns":2,"desc":"Prato da casa: restaura 132 de HP, +5% de dano físico (2t)."},
  comida_008: {"categoria":"assados","nome":"Medalhão de Carneiro Apimentado","tipo":"comida","preco":63,"emoji":"🍗","cura":149,"removeStatus":["queimadura"],"desc":"Prato da casa: restaura 149 de HP, limpa queimadura."},
  comida_009: {"categoria":"sopas","nome":"Sopa de Cordeiro da Casa","tipo":"comida","preco":88,"emoji":"🥣","cura":166,"buffMagico":0.11,"buffTurns":4,"desc":"Prato da casa: restaura 166 de HP, +11% de dano mágico (4t)."},
  comida_010: {"categoria":"paes","nome":"Broa de Limão","tipo":"comida","preco":113,"emoji":"🥖","cura":183,"status":{"tipo":"regeneracao","turnos":4,"dano":167},"desc":"Prato da casa: restaura 183 de HP, regenera 167 de HP/turno (4t)."},
  comida_011: {"categoria":"doces","nome":"Sonho de Coco","tipo":"comida","preco":18,"emoji":"🧁","cura":200,"mana":40,"desc":"Prato da casa: restaura 200 de HP, 40 de MP."},
  comida_012: {"categoria":"frutas","nome":"Melão Rústico","tipo":"comida","preco":43,"emoji":"🍇","cura":217,"desc":"Prato da casa: restaura 217 de HP."},
  comida_013: {"categoria":"petiscos","nome":"Tábua de Frios de Vaca","tipo":"comida","preco":68,"emoji":"🍤","cura":234,"buffFisico":0.05,"buffTurns":2,"desc":"Prato da casa: restaura 234 de HP, +5% de dano físico (2t)."},
  comida_014: {"categoria":"assados","nome":"Lombo de Veado Assado","tipo":"comida","preco":93,"emoji":"🍖","cura":251,"desc":"Prato da casa: restaura 251 de HP."},
  comida_015: {"categoria":"sopas","nome":"Cozido de Peixe Defumado","tipo":"comida","preco":118,"emoji":"🍜","cura":268,"removeStatus":["queimadura","fraqueza"],"desc":"Prato da casa: restaura 268 de HP, limpa queimadura, fraqueza."},
  comida_016: {"categoria":"paes","nome":"Cacetinho de Pera","tipo":"comida","preco":23,"emoji":"🥐","cura":285,"mana":55,"desc":"Prato da casa: restaura 285 de HP, 55 de MP."},
  comida_017: {"categoria":"doces","nome":"Pudim de Maçã","tipo":"comida","preco":48,"emoji":"🍪","cura":302,"buffMagico":0.07,"buffTurns":3,"desc":"Prato da casa: restaura 302 de HP, +7% de dano mágico (3t)."},
  comida_018: {"categoria":"frutas","nome":"Pera Defumado","tipo":"comida","preco":73,"emoji":"🍓","cura":319,"desc":"Prato da casa: restaura 319 de HP."},
  comida_019: {"categoria":"petiscos","nome":"Croquete de Touro","tipo":"comida","preco":98,"emoji":"🥨","cura":336,"buffFisico":0.05,"buffTurns":2,"status":{"tipo":"regeneracao","turnos":5,"dano":104},"desc":"Prato da casa: restaura 336 de HP, +5% de dano físico (2t), regenera 104 de HP/turno (5t)."},
  comida_020: {"categoria":"assados","nome":"Espeto de Carneiro da Horta","tipo":"comida","preco":123,"emoji":"🍗","cura":33,"desc":"Prato da casa: restaura 33 de HP."},
  comida_021: {"categoria":"sopas","nome":"Creme de Cordeiro Rústico","tipo":"comida","preco":28,"emoji":"🥣","cura":50,"mana":20,"desc":"Prato da casa: restaura 50 de HP, 20 de MP."},
  comida_022: {"categoria":"paes","nome":"Focaccia de Limão","tipo":"comida","preco":53,"emoji":"🥖","cura":67,"removeStatus":["queimadura","fraqueza","sangramento"],"desc":"Prato da casa: restaura 67 de HP, limpa queimadura, fraqueza, sangramento."},
  comida_023: {"categoria":"doces","nome":"Torta de Coco","tipo":"comida","preco":78,"emoji":"🍮","cura":84,"desc":"Prato da casa: restaura 84 de HP."},
  comida_024: {"categoria":"frutas","nome":"Manga da Casa","tipo":"comida","preco":103,"emoji":"🥝","cura":101,"desc":"Prato da casa: restaura 101 de HP."},
  comida_025: {"categoria":"petiscos","nome":"Pastel de Vaca (2)","tipo":"comida","preco":8,"emoji":"🍤","cura":118,"buffFisico":0.05,"buffTurns":2,"buffMagico":0.13,"desc":"Prato da casa: restaura 118 de HP, +5% de dano físico (2t), +13% de dano mágico (2t)."},
  comida_026: {"categoria":"assados","nome":"Grelhado de Veado Gratinado","tipo":"comida","preco":33,"emoji":"🍖","cura":135,"mana":35,"desc":"Prato da casa: restaura 135 de HP, 35 de MP."},
  comida_027: {"categoria":"sopas","nome":"Caldo de Peixe Dourado","tipo":"comida","preco":58,"emoji":"🍜","cura":152,"desc":"Prato da casa: restaura 152 de HP."},
  comida_028: {"categoria":"paes","nome":"Torta de Pera (2)","tipo":"comida","preco":83,"emoji":"🥐","cura":169,"status":{"tipo":"regeneracao","turnos":6,"dano":221},"desc":"Prato da casa: restaura 169 de HP, regenera 221 de HP/turno (6t)."},
  comida_029: {"categoria":"doces","nome":"Bolo de Maçã","tipo":"comida","preco":108,"emoji":"🍰","cura":186,"removeStatus":["queimadura"],"desc":"Prato da casa: restaura 186 de HP, limpa queimadura."},
  comida_030: {"categoria":"frutas","nome":"Frutas Vermelhas Refogado","tipo":"comida","preco":13,"emoji":"🍎","cura":203,"desc":"Prato da casa: restaura 203 de HP."},
  comida_031: {"categoria":"petiscos","nome":"Brusqueta de Touro (2)","tipo":"comida","preco":38,"emoji":"🥨","cura":220,"mana":50,"buffFisico":0.05,"buffTurns":2,"desc":"Prato da casa: restaura 220 de HP, 50 de MP, +5% de dano físico (2t)."},
  comida_032: {"categoria":"assados","nome":"Medalhão de Carneiro do Taverneiro","tipo":"comida","preco":63,"emoji":"🍗","cura":237,"desc":"Prato da casa: restaura 237 de HP."},
  comida_033: {"categoria":"sopas","nome":"Sopa de Cordeiro Refogado","tipo":"comida","preco":88,"emoji":"🥣","cura":254,"buffMagico":0.09,"buffTurns":4,"desc":"Prato da casa: restaura 254 de HP, +9% de dano mágico (4t)."},
  comida_034: {"categoria":"paes","nome":"Broa de Limão (2)","tipo":"comida","preco":113,"emoji":"🥖","cura":271,"desc":"Prato da casa: restaura 271 de HP."},
  comida_035: {"categoria":"doces","nome":"Bombom de Coco","tipo":"comida","preco":18,"emoji":"🍩","cura":288,"desc":"Prato da casa: restaura 288 de HP."},
  comida_036: {"categoria":"frutas","nome":"Melão Dourado","tipo":"comida","preco":43,"emoji":"🍇","cura":305,"mana":15,"removeStatus":["queimadura","fraqueza"],"desc":"Prato da casa: restaura 305 de HP, 15 de MP, limpa queimadura, fraqueza."},
  comida_037: {"categoria":"petiscos","nome":"Tábua de Frios de Vaca (2)","tipo":"comida","preco":68,"emoji":"🍤","cura":322,"buffFisico":0.05,"buffTurns":2,"status":{"tipo":"regeneracao","turnos":3,"dano":158},"desc":"Prato da casa: restaura 322 de HP, +5% de dano físico (2t), regenera 158 de HP/turno (3t)."},
  comida_038: {"categoria":"assados","nome":"Lombo de Veado Apimentado","tipo":"comida","preco":93,"emoji":"🍖","cura":339,"desc":"Prato da casa: restaura 339 de HP."},
  comida_039: {"categoria":"sopas","nome":"Cozido de Peixe da Casa","tipo":"comida","preco":118,"emoji":"🍜","cura":36,"desc":"Prato da casa: restaura 36 de HP."},
  comida_040: {"categoria":"paes","nome":"Cacetinho de Pera (2)","tipo":"comida","preco":23,"emoji":"🥐","cura":53,"desc":"Prato da casa: restaura 53 de HP."},
  comida_041: {"categoria":"doces","nome":"Doce de Maçã","tipo":"comida","preco":48,"emoji":"🧁","cura":70,"mana":30,"buffMagico":0.05,"buffTurns":3,"desc":"Prato da casa: restaura 70 de HP, 30 de MP, +5% de dano mágico (3t)."},
  comida_042: {"categoria":"frutas","nome":"Pera Rústico","tipo":"comida","preco":73,"emoji":"🍓","cura":87,"desc":"Prato da casa: restaura 87 de HP."},
  comida_043: {"categoria":"petiscos","nome":"Croquete de Touro (2)","tipo":"comida","preco":98,"emoji":"🥨","cura":104,"buffFisico":0.05,"buffTurns":2,"removeStatus":["queimadura","fraqueza","sangramento"],"desc":"Prato da casa: restaura 104 de HP, +5% de dano físico (2t), limpa queimadura, fraqueza, sangramento."},
  comida_044: {"categoria":"assados","nome":"Espeto de Carneiro Assado","tipo":"comida","preco":123,"emoji":"🍗","cura":121,"desc":"Prato da casa: restaura 121 de HP."},
  comida_045: {"categoria":"sopas","nome":"Creme de Cordeiro Defumado","tipo":"comida","preco":28,"emoji":"🥣","cura":138,"desc":"Prato da casa: restaura 138 de HP."},
  comida_046: {"categoria":"paes","nome":"Focaccia de Limão (2)","tipo":"comida","preco":53,"emoji":"🥖","cura":155,"mana":45,"status":{"tipo":"regeneracao","turnos":4,"dano":95},"desc":"Prato da casa: restaura 155 de HP, 45 de MP, regenera 95 de HP/turno (4t)."},
  comida_047: {"categoria":"doces","nome":"Compota de Coco","tipo":"comida","preco":78,"emoji":"🍪","cura":172,"desc":"Prato da casa: restaura 172 de HP."},
  comida_048: {"categoria":"frutas","nome":"Manga Defumado","tipo":"comida","preco":103,"emoji":"🥝","cura":189,"desc":"Prato da casa: restaura 189 de HP."},
  comida_049: {"categoria":"petiscos","nome":"Pastel de Vaca (3)","tipo":"comida","preco":8,"emoji":"🍤","cura":206,"buffFisico":0.05,"buffTurns":2,"buffMagico":0.11,"desc":"Prato da casa: restaura 206 de HP, +5% de dano físico (2t), +11% de dano mágico (2t)."},
  comida_050: {"categoria":"assados","nome":"Grelhado de Veado da Horta","tipo":"comida","preco":33,"emoji":"🍖","cura":223,"removeStatus":["queimadura"],"desc":"Prato da casa: restaura 223 de HP, limpa queimadura."},
  comida_051: {"categoria":"sopas","nome":"Caldo de Peixe Rústico","tipo":"comida","preco":58,"emoji":"🍜","cura":240,"mana":10,"desc":"Prato da casa: restaura 240 de HP, 10 de MP."},
  comida_052: {"categoria":"paes","nome":"Torta de Pera (3)","tipo":"comida","preco":83,"emoji":"🥐","cura":257,"desc":"Prato da casa: restaura 257 de HP."},
  comida_053: {"categoria":"doces","nome":"Sonho de Maçã","tipo":"comida","preco":108,"emoji":"🍮","cura":274,"desc":"Prato da casa: restaura 274 de HP."},
  comida_054: {"categoria":"frutas","nome":"Frutas Vermelhas da Casa","tipo":"comida","preco":13,"emoji":"🍎","cura":291,"desc":"Prato da casa: restaura 291 de HP."},
  comida_055: {"categoria":"petiscos","nome":"Brusqueta de Touro (3)","tipo":"comida","preco":38,"emoji":"🥨","cura":308,"buffFisico":0.05,"buffTurns":2,"status":{"tipo":"regeneracao","turnos":5,"dano":212},"desc":"Prato da casa: restaura 308 de HP, +5% de dano físico (2t), regenera 212 de HP/turno (5t)."},
  comida_056: {"categoria":"assados","nome":"Medalhão de Carneiro Gratinado","tipo":"comida","preco":63,"emoji":"🍗","cura":325,"mana":25,"desc":"Prato da casa: restaura 325 de HP, 25 de MP."},
  comida_057: {"categoria":"sopas","nome":"Sopa de Cordeiro Dourado","tipo":"comida","preco":88,"emoji":"🥣","cura":342,"buffMagico":0.07,"buffTurns":4,"removeStatus":["queimadura","fraqueza"],"desc":"Prato da casa: restaura 342 de HP, +7% de dano mágico (4t), limpa queimadura, fraqueza."},
  comida_058: {"categoria":"paes","nome":"Broa de Limão (3)","tipo":"comida","preco":113,"emoji":"🥖","cura":39,"desc":"Prato da casa: restaura 39 de HP."},
  comida_059: {"categoria":"doces","nome":"Pudim de Coco","tipo":"comida","preco":18,"emoji":"🍰","cura":56,"desc":"Prato da casa: restaura 56 de HP."},
  comida_060: {"categoria":"frutas","nome":"Melão Refogado","tipo":"comida","preco":43,"emoji":"🍇","cura":73,"desc":"Prato da casa: restaura 73 de HP."},
  comida_061: {"categoria":"petiscos","nome":"Tábua de Frios de Vaca (3)","tipo":"comida","preco":68,"emoji":"🍤","cura":90,"mana":40,"buffFisico":0.05,"buffTurns":2,"desc":"Prato da casa: restaura 90 de HP, 40 de MP, +5% de dano físico (2t)."},
  comida_062: {"categoria":"assados","nome":"Lombo de Veado do Taverneiro","tipo":"comida","preco":93,"emoji":"🍖","cura":107,"desc":"Prato da casa: restaura 107 de HP."},
  comida_063: {"categoria":"sopas","nome":"Cozido de Peixe Refogado","tipo":"comida","preco":118,"emoji":"🍜","cura":124,"desc":"Prato da casa: restaura 124 de HP."},
  comida_064: {"categoria":"paes","nome":"Cacetinho de Pera (3)","tipo":"comida","preco":23,"emoji":"🥐","cura":141,"status":{"tipo":"regeneracao","turnos":6,"dano":149},"removeStatus":["queimadura","fraqueza","sangramento"],"desc":"Prato da casa: restaura 141 de HP, regenera 149 de HP/turno (6t), limpa queimadura, fraqueza, sangramento."},
  comida_065: {"categoria":"doces","nome":"Torta de Maçã","tipo":"comida","preco":48,"emoji":"🍩","cura":158,"buffMagico":0.13,"buffTurns":3,"desc":"Prato da casa: restaura 158 de HP, +13% de dano mágico (3t)."},
  comida_066: {"categoria":"frutas","nome":"Pera Dourado","tipo":"comida","preco":73,"emoji":"🍓","cura":175,"mana":55,"desc":"Prato da casa: restaura 175 de HP, 55 de MP."},
  comida_067: {"categoria":"petiscos","nome":"Croquete de Touro (3)","tipo":"comida","preco":98,"emoji":"🥨","cura":192,"buffFisico":0.05,"buffTurns":2,"desc":"Prato da casa: restaura 192 de HP, +5% de dano físico (2t)."},
  comida_068: {"categoria":"assados","nome":"Espeto de Carneiro Apimentado","tipo":"comida","preco":123,"emoji":"🍗","cura":209,"desc":"Prato da casa: restaura 209 de HP."},
  comida_069: {"categoria":"sopas","nome":"Creme de Cordeiro da Casa","tipo":"comida","preco":28,"emoji":"🥣","cura":226,"desc":"Prato da casa: restaura 226 de HP."},
  comida_070: {"categoria":"paes","nome":"Focaccia de Limão (3)","tipo":"comida","preco":53,"emoji":"🥖","cura":243,"desc":"Prato da casa: restaura 243 de HP."},
  comida_071: {"categoria":"doces","nome":"Bolo de Coco","tipo":"comida","preco":78,"emoji":"🧁","cura":260,"mana":20,"removeStatus":["queimadura"],"desc":"Prato da casa: restaura 260 de HP, 20 de MP, limpa queimadura."},
  comida_072: {"categoria":"frutas","nome":"Manga Rústico","tipo":"comida","preco":103,"emoji":"🥝","cura":277,"desc":"Prato da casa: restaura 277 de HP."},
  comida_073: {"categoria":"petiscos","nome":"Pastel de Vaca (4)","tipo":"comida","preco":8,"emoji":"🍤","cura":294,"buffFisico":0.05,"buffTurns":2,"buffMagico":0.09,"status":{"tipo":"regeneracao","turnos":3,"dano":86},"desc":"Prato da casa: restaura 294 de HP, +5% de dano físico (2t), +9% de dano mágico (2t), regenera 86 de HP/turno (3t)."},
  comida_074: {"categoria":"assados","nome":"Grelhado de Veado Assado","tipo":"comida","preco":33,"emoji":"🍖","cura":311,"desc":"Prato da casa: restaura 311 de HP."},
  comida_075: {"categoria":"sopas","nome":"Caldo de Peixe Defumado","tipo":"comida","preco":58,"emoji":"🍜","cura":328,"desc":"Prato da casa: restaura 328 de HP."},
  comida_076: {"categoria":"paes","nome":"Torta de Pera (4)","tipo":"comida","preco":83,"emoji":"🥐","cura":345,"mana":35,"desc":"Prato da casa: restaura 345 de HP, 35 de MP."},
  comida_077: {"categoria":"doces","nome":"Bombom de Maçã","tipo":"comida","preco":108,"emoji":"🍪","cura":42,"desc":"Prato da casa: restaura 42 de HP."},
  comida_078: {"categoria":"frutas","nome":"Frutas Vermelhas Defumado","tipo":"comida","preco":13,"emoji":"🍎","cura":59,"removeStatus":["queimadura","fraqueza"],"desc":"Prato da casa: restaura 59 de HP, limpa queimadura, fraqueza."},
  comida_079: {"categoria":"petiscos","nome":"Brusqueta de Touro (4)","tipo":"comida","preco":38,"emoji":"🥨","cura":76,"buffFisico":0.05,"buffTurns":2,"desc":"Prato da casa: restaura 76 de HP, +5% de dano físico (2t)."},
  comida_080: {"categoria":"assados","nome":"Medalhão de Carneiro da Horta","tipo":"comida","preco":63,"emoji":"🍗","cura":93,"desc":"Prato da casa: restaura 93 de HP."},
  comida_081: {"categoria":"sopas","nome":"Sopa de Cordeiro Rústico","tipo":"comida","preco":88,"emoji":"🥣","cura":110,"mana":50,"buffMagico":0.05,"buffTurns":4,"desc":"Prato da casa: restaura 110 de HP, 50 de MP, +5% de dano mágico (4t)."},
  comida_082: {"categoria":"paes","nome":"Broa de Limão (4)","tipo":"comida","preco":113,"emoji":"🥖","cura":127,"status":{"tipo":"regeneracao","turnos":4,"dano":203},"desc":"Prato da casa: restaura 127 de HP, regenera 203 de HP/turno (4t)."},
  comida_083: {"categoria":"doces","nome":"Doce de Coco","tipo":"comida","preco":18,"emoji":"🍮","cura":144,"desc":"Prato da casa: restaura 144 de HP."},
  comida_084: {"categoria":"frutas","nome":"Melão da Casa","tipo":"comida","preco":43,"emoji":"🍇","cura":161,"desc":"Prato da casa: restaura 161 de HP."},
  comida_085: {"categoria":"petiscos","nome":"Tábua de Frios de Vaca (4)","tipo":"comida","preco":68,"emoji":"🍤","cura":178,"buffFisico":0.05,"buffTurns":2,"removeStatus":["queimadura","fraqueza","sangramento"],"desc":"Prato da casa: restaura 178 de HP, +5% de dano físico (2t), limpa queimadura, fraqueza, sangramento."},
  comida_086: {"categoria":"assados","nome":"Lombo de Veado Gratinado","tipo":"comida","preco":93,"emoji":"🍖","cura":195,"mana":15,"desc":"Prato da casa: restaura 195 de HP, 15 de MP."},
  comida_087: {"categoria":"sopas","nome":"Cozido de Peixe Dourado","tipo":"comida","preco":118,"emoji":"🍜","cura":212,"desc":"Prato da casa: restaura 212 de HP."},
  comida_088: {"categoria":"paes","nome":"Cacetinho de Pera (4)","tipo":"comida","preco":23,"emoji":"🥐","cura":229,"desc":"Prato da casa: restaura 229 de HP."},
  comida_089: {"categoria":"doces","nome":"Compota de Maçã (2)","tipo":"comida","preco":48,"emoji":"🍰","cura":246,"buffMagico":0.11,"buffTurns":3,"desc":"Prato da casa: restaura 246 de HP, +11% de dano mágico (3t)."},
  comida_090: {"categoria":"frutas","nome":"Pera Refogado","tipo":"comida","preco":73,"emoji":"🍓","cura":263,"desc":"Prato da casa: restaura 263 de HP."},
  comida_091: {"categoria":"petiscos","nome":"Croquete de Touro (4)","tipo":"comida","preco":98,"emoji":"🥨","cura":280,"mana":30,"buffFisico":0.05,"buffTurns":2,"status":{"tipo":"regeneracao","turnos":5,"dano":140},"desc":"Prato da casa: restaura 280 de HP, 30 de MP, +5% de dano físico (2t), regenera 140 de HP/turno (5t)."},
  comida_092: {"categoria":"assados","nome":"Espeto de Carneiro do Taverneiro","tipo":"comida","preco":123,"emoji":"🍗","cura":297,"removeStatus":["queimadura"],"desc":"Prato da casa: restaura 297 de HP, limpa queimadura."},
  comida_093: {"categoria":"sopas","nome":"Creme de Cordeiro Refogado","tipo":"comida","preco":28,"emoji":"🥣","cura":314,"desc":"Prato da casa: restaura 314 de HP."},
  comida_094: {"categoria":"paes","nome":"Focaccia de Limão (4)","tipo":"comida","preco":53,"emoji":"🥖","cura":331,"desc":"Prato da casa: restaura 331 de HP."},
  comida_095: {"categoria":"doces","nome":"Sonho de Coco (2)","tipo":"comida","preco":78,"emoji":"🍩","cura":348,"desc":"Prato da casa: restaura 348 de HP."},
  comida_096: {"categoria":"frutas","nome":"Manga Dourado","tipo":"comida","preco":103,"emoji":"🥝","cura":45,"mana":45,"desc":"Prato da casa: restaura 45 de HP, 45 de MP."},
  comida_097: {"categoria":"petiscos","nome":"Pastel de Vaca (5)","tipo":"comida","preco":8,"emoji":"🍤","cura":62,"buffFisico":0.05,"buffTurns":2,"buffMagico":0.07,"desc":"Prato da casa: restaura 62 de HP, +5% de dano físico (2t), +7% de dano mágico (2t)."},
  comida_098: {"categoria":"assados","nome":"Grelhado de Veado Apimentado","tipo":"comida","preco":33,"emoji":"🍖","cura":79,"desc":"Prato da casa: restaura 79 de HP."},
  comida_099: {"categoria":"sopas","nome":"Caldo de Peixe da Casa","tipo":"comida","preco":58,"emoji":"🍜","cura":96,"removeStatus":["queimadura","fraqueza"],"desc":"Prato da casa: restaura 96 de HP, limpa queimadura, fraqueza."},
  comida_100: {"categoria":"paes","nome":"Torta de Pera (5)","tipo":"comida","preco":83,"emoji":"🥐","cura":113,"status":{"tipo":"regeneracao","turnos":6,"dano":77},"desc":"Prato da casa: restaura 113 de HP, regenera 77 de HP/turno (6t)."},
};


export const POINTS_TO_DISTRIBUTE = 30;
export const MIN_ATTRIBUTE = 1;
export const MAX_ATTRIBUTE = 10;
export const MAX_ATTRIBUTE_WITH_BONUS = 12;
export const MAX_PLAYERS_PER_BATTLE = 20;

// Atributos efetivos = base + bônus de raças (com penalidade) + bônus de classes + equipamento
//
// Penalidade por raças múltiplas:
//   1 raça  = bônus cheio (100%)
//   2 raças = soma dos bônus x 0.70
//   3 raças = soma dos bônus x 0.55
// Passivas e efeitos raciais NÃO são reduzidos; apenas os bônus de atributo.

export function raceBonusTotal(races) {
  const bonus = {};
  for (const race of races || []) {
    for (const [key, value] of Object.entries(race.bonus || {})) {
      if (key === 'escolha') {
        const chosen = race.choice || 'forca';
        bonus[chosen] = (bonus[chosen] || 0) + value;
      } else {
        bonus[key] = (bonus[key] || 0) + value;
      }
    }
  }
  const count = Array.isArray(races) ? races.length : 0;
  const factor = count >= 3 ? 0.55 : count === 2 ? 0.7 : 1;
  if (factor !== 1) {
    for (const key of Object.keys(bonus)) bonus[key] = Math.round(bonus[key] * factor);
  }
  return bonus;
}

export function classBonusTotal(classes) {
  const bonus = {};
  for (const cls of classes || []) {
    for (const [key, value] of Object.entries(cls.bonus || {})) {
      bonus[key] = (bonus[key] || 0) + value;
    }
  }
  return bonus;
}

export function applyRaceBonus(raceId, attributes) {
  const race = RACES[raceId] || RACES.humano;
  const res = { ...attributes };
  for (const [key, value] of Object.entries(race.bonus)) {
    if (key === 'escolha') {
      const chosen = res._raceChoice || 'forca';
      res[chosen] = (res[chosen] || 0) + value;
      continue;
    }
    res[key] = (res[key] || 0) + value;
  }
  return res;
}

// Soma dos bônus de atributos das gemas socketadas (ignora gemas brutas).
// Cada gema aplica efeitos conforme o slot do equipamento (arma/armadura/acessorio).
export function gemsAttrs(equipment = {}, gems = GEMS) {
  const acc = {};
  for (const [slot, item] of Object.entries(equipment)) {
    if (!item) continue;
    for (const gemId of item.socketedGems || []) {
      const gem = gems[gemId];
      if (!gem) continue;
      if (gem.estado === 'bruta') continue; // bruta não concede efeitos
      const fx = gem.efeitos?.[slot];
      if (!fx?.bonus) continue;
      for (const [k, v] of Object.entries(fx.bonus)) {
        if (k.startsWith('_')) continue;
        acc[k] = (acc[k] || 0) + v;
      }
    }
  }
  return acc;
}

export function effectiveAttributes(attributes, equipment = {}, races = null, classes = null) {
  const eff = { ...attributes };
  if (Array.isArray(races)) {
    for (const [k, v] of Object.entries(raceBonusTotal(races))) eff[k] = (eff[k] || 0) + v;
  } else if (races) {
    const rb = applyRaceBonus(races, {});
    for (const [k, v] of Object.entries(rb)) eff[k] = (eff[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(classBonusTotal(classes))) eff[k] = (eff[k] || 0) + v;
  // Equipamento: armas equipadas (até 3) + armadura somam bônus/malefícios.
  // A arma legada equipment.arma entra via armasDeEquipamento sem duplicar.
  for (const item of armasDeEquipamento(equipment).map((e) => e.arma).concat([equipment.armadura]).filter(Boolean)) {
    if (!item) continue;
    if (item.bonus) {
      for (const [k, v] of Object.entries(item.bonus)) eff[k] = (eff[k] || 0) + v;
    }
    if (item.penalidade) {
      // Malefícios sempre reduzem o atributo (armaduras do catálogo guardam
      // valores negativos; equipamentos customizados guardam valores positivos).
      for (const [k, v] of Object.entries(item.penalidade)) eff[k] = (eff[k] || 0) - Math.abs(v);
    }
  }
  // Bônus das gemas socketadas (buffs positivos / debuffs negativos)
  for (const [k, v] of Object.entries(gemsAttrs(equipment, GEMS))) eff[k] = (eff[k] || 0) + v;
  for (const key of Object.keys(eff)) {
    if (key.startsWith('_')) continue;
    eff[key] = Math.max(1, eff[key] || 1);
  }
  return eff;
}

// Fórmulas de vida, mana e dano (regras do criador — ver sistema.js):
//   Vida = 500 + (Resistência Final × 10)
//   Mana = (Inteligência Final × 10)
//   Dano = (Força Final + danoBase da arma) × 10   [PROVISÓRIO]
export function deriveStats(classes, level, attributes, equipment = {}, races = null) {
  const eff = effectiveAttributes(attributes, equipment, races, classes);
  const list = Array.isArray(classes) ? classes : classes ? [classes] : [];
  const primary = list.find((c) => c.primary) || list[0] || null;
  const hpPerLevel = primary?.hpPerLevel || 10;
  // Nova regra: Vida = 500 + (Resistência Final × 10)
  const hpMax = 500 + eff.resistencia * 10;
  // Nova regra: Mana = (Inteligência Final) × 10
  const mpMax = (Number(eff.inteligencia) || 0) * 10;

  let defesa = 0;
  for (const item of Object.values(equipment)) {
    // Defesa na MESMA escala do dano (× DANO_MULT) — ver sistema.js.
    if (item && item.defesa) defesa += item.defesa * DANO_MULT;
  }

  // Dano do ataque básico (exibição na ficha) — usa a MELHOR arma equipada
  // (maior dano base), igual ao combate.
  const dano = danoFisicoAtaque(eff.forca, danoBaseDaArma(melhorArma(equipment)));

  return { hpMax, mpMax, defesa, dano, effectiveAttributes: eff };
}

// Ordem de iniciativa: Reflexos pesa mais (reação), Destreza e Resistência
// também entram. Ver PESOS_ATRIBUTOS.iniciativa em sistema.js.
export function speedOf(attributes, level) {
  return iniciativaDe(attributes, level);
}

// Rolagem de d20 para acerto
export function rollDice(sides, qty = 1, bonus = 0) {
  let total = bonus;
  const rolls = [];
  for (let i = 0; i < qty; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    total += r;
  }
  return { rolls, total };
}

export function rollAttack() {
  const { rolls, total } = rollDice(20);
  const isCrit = rolls[0] === 20;
  const isFail = rolls[0] === 1;
  return { rolls, total, isCrit, isFail };
}

// Dano físico: (FOR Final + danoBase da arma) × 10 — determinístico, igual
// vida/mana. Atributo Final inclui raça/classe/equipamento/gemas.
// Fórmula e escala em sistema.js (PROVISÓRIAS); crítico/elementos/buffs
// continuam sendo aplicados por cima, pelo chamador (racialMult).
export function physicalDamage(attacker, weapon, racialMult = 1) {
  const eff = effectiveAttributes(
    attacker.attributes,
    attacker.equipment || {},
    attacker.races || null,
    attacker.classes || null,
  );
  return { rolls: [], total: danoFisicoAtaque(eff.forca, danoBaseDaArma(weapon), racialMult) };
}

// Dano mágico: (INT Final × 10) × poder% da magia — sem dados.
// `spell.poder` é percentual (240 = 240%); mult = buffs do chamador.
export function magicDamage(attacker, spell, mult = 1) {
  const eff = effectiveAttributes(
    attacker.attributes,
    attacker.equipment || {},
    attacker.races || null,
    attacker.classes || null,
  );
  return { rolls: [], total: danoMagico(eff.inteligencia, spell?.poder ?? 100, mult) };
}

export function rollDamage(diceSides, diceQty, bonus) {
  const { rolls, total } = rollDice(diceSides, diceQty, bonus);
  return { rolls, total };
}

// Multiplicadores de vida/mana vindos de passivas (raças + habilidades extras).
export function applyMaxMults(stats, efeitos = {}) {
  return {
    ...stats,
    hpMax: Math.max(1, Math.round(stats.hpMax * (efeitos.hpMaxMult || 1))),
    mpMax: Math.max(1, Math.round(stats.mpMax * (efeitos.manaMaxMult || 1))),
  };
}

// Soma os efeitos mecânicos das passivas extras compradas com pontos excedentes.
export function efeitosDeHabilidades(habilidades) {
  const out = {};
  for (const h of habilidades || []) {
    if (h.tipo === 'passiva_extra' && h.efeito) {
      for (const [k, v] of Object.entries(h.efeito)) out[k] = (out[k] || 0) + v;
    }
  }
  return out;
}

// ── Helpers para o Arsenal / Compendium ─────────────────

export const WEAPON_CATEGORIES = {
  branca: { nome: 'Armas Brancas', icon: '⚔️', filter: (w) => w.tipo === 'arma' && ['corpo', 'medio'].includes(w.alcance || 'corpo') },
  fogo:   { nome: 'Armas de Fogo', icon: '🔫', filter: (w) => w.tipo === 'arma_fogo' },
  magica: { nome: 'Armas Mágicas', icon: '✨', filter: (w) => w.tipo === 'arma' && w.alcance === 'longo' && (w.bonus?.inteligencia || 0) >= 2 },
};

export function getWeaponsByCategory(categoryKey) {
  const cat = WEAPON_CATEGORIES[categoryKey];
  if (!cat) return [];
  return Object.entries(EQUIPMENT.armas)
    .filter(([, w]) => cat.filter(w))
    .map(([id, w]) => ({ id, ...w }));
}

export function getAllWeapons() {
  return Object.entries(EQUIPMENT.armas).map(([id, w]) => ({ id, ...w }));
}

export function getAllArmors() {
  return Object.entries(EQUIPMENT.armaduras).map(([id, a]) => ({ id, ...a }));
}
