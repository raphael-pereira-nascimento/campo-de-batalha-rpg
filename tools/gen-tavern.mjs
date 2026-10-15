// Gerador do catálogo da taverna "O Último Copo".
//
// Acrescenta 100 bebidas e 100 alimentos (nomes temáticos + efeitos variados) ao
// data.js já existente, preservando as bebidas curadas e TODAS as funções do módulo.
// PROVISÓRIO — ajuste os números/listas à vontade e rode de novo.
//
// Uso: node tools/gen-tavern.mjs
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src', 'game', 'data.js');
let out = fs.readFileSync(dataPath, 'utf8');

const EOL = out.includes('\r\n') ? '\r\n' : '\n';

// ── Garante estado-base (idempotência) ───────────────────────────────
// Remove um TAVERN_FOODS anterior, se houver, para não duplicar.
out = out.replace(/\r?\nexport const TAVERN_FOODS = \{[\s\S]*?\r?\n\};\r?\n/, '\n');
// Remove bebidas geradas anteriores (ids bebida_NNN).
out = out.replace(/^\s*bebida_\d{3}: \{[^\r\n]*\},[\r\n]*/gm, '');
// Remove categorias de comida anteriores.
out = out.replace(/^\s*\{ id: '(petiscos|assados|sopas|paes|doces|frutas)',[^\r\n]*\},[\r\n]*/gm, '');

const r2 = (n) => Math.round(n * 100) / 100;
const pick = (arr, i) => arr[i % arr.length];
const used = new Set();
function unico(nome) {
  let n = nome;
  let k = 0;
  while (used.has(n)) {
    k++;
    n = `${nome} (${k + 1})`;
  }
  used.add(n);
  return n;
}

const CATS = [
  { id: 'petiscos', nome: 'Petiscos', icon: '🥟', blurb: 'Beliscos para abrir o apetite antes da briga.' },
  { id: 'assados', nome: 'Assados & Grelhados', icon: '🍖', blurb: 'Carne na brasa — sustentação de verdade.' },
  { id: 'sopas', nome: 'Sopas & Ensopados', icon: '🍲', blurb: 'Prato fundo e colher, comida de aventureiro.' },
  { id: 'paes', nome: 'Pães & Massas', icon: '🥖', blurb: 'Assados no forno a lenha dos fundos.' },
  { id: 'doces', nome: 'Doces & Sobremesas', icon: '🍰', blurb: 'Para fechar a conta com açúcar.' },
  { id: 'frutas', nome: 'Frutas & Frescos', icon: '🍎', blurb: 'Colhidas no pomar atrás da taverna.' },
];

const STATUS_POOL = ['veneno', 'sangramento', 'queimadura', 'lentidao', 'cegueira', 'fraqueza', 'congelamento'];
function removeSet(i) {
  const n = 1 + (i % 3);
  const out2 = [];
  for (let k = 0; k < n; k++) out2.push(STATUS_POOL[(i + k * 3) % STATUS_POOL.length]);
  return [...new Set(out2)];
}

// ── Bebidas (100 novas) ───────────────────────────────────────────────
const DRINK_BASES = {
  barril: ['Cerveja', 'Chope', 'Cidra', 'Kvas', 'Hidromel', 'Malte', 'Cerveja Negra', 'Cerveja Clara'],
  adega: ['Vinho', 'Espumante', 'Sangria', 'Colheita', 'Reserva', 'Vinho Licoroso', 'Branco', 'Tinto'],
  destilados: ['Aguardente', 'Uísque', 'Rum', 'Gim', 'Vodka', 'Conhaque', 'Bagaceira', 'Cachaça'],
  quentes: ['Chá', 'Café', 'Infusão', 'Caldo', 'Cordial', 'Ponche'],
  barman: ['Poção', 'Elixir', 'Dose', 'Coquetel', 'Amaro', 'Filtro', 'Mistura'],
  sobrio: ['Suco', 'Água', 'Refresco', 'Néctar', 'Limonada', 'Chá Gelado'],
};
const DRINK_VAR = [
  'Escura', 'Dourada', 'Rubra', 'Âmbar', 'Defumada', 'Turva', 'Cristalina', 'Antiga', 'Selvagem',
  'do Bosque', 'da Montanha', 'do Porto', 'de Mel', 'de Especiarias', 'Gelada', 'Fumegante',
  'de Carvalho', 'das Fadas', 'do Abismo', 'Real', 'Rústica', 'Brilhante', 'Amarga', 'Suave',
  'Festiva', 'do Dragão', 'da Lua', 'de Inverno', 'de Verão', 'do Marujo', 'do Taverneiro', 'Ancestral',
];
const DRINK_EMOJI = {
  barril: ['🍺', '🍻', '🍏', '🍯', '🫗'],
  adega: ['🍷', '🥂', '🍇'],
  destilados: ['🥃', '🍸', '🍶', '🧪'],
  quentes: ['🍵', '☕', '🍲'],
  barman: ['🍹', '⚗️', '🌙', '🩸', '🌿'],
  sobrio: ['🧃', '💧', '🥤', '🥛'],
};
const DRINK_CATS = ['barril', 'adega', 'destilados', 'quentes', 'barman', 'sobrio'];
const ALC = new Set(['barril', 'adega', 'destilados', 'barman']);

function descDe(f, tipo) {
  const p = [];
  if (f.cura) p.push(`restaura ${f.cura} de HP`);
  if (f.mana) p.push(`${f.mana} de MP`);
  if (f.buffFisico) p.push(`+${Math.round(f.buffFisico * 100)}% de dano físico (${f.buffTurns}t)`);
  if (f.buffMagico) p.push(`+${Math.round(f.buffMagico * 100)}% de dano mágico (${f.buffTurns}t)`);
  if (f.status) p.push(`regenera ${f.status.dano} de HP/turno (${f.status.turnos}t)`);
  if (f.removeStatus) p.push(`limpa ${f.removeStatus.join(', ')}`);
  if (f.drunk) p.push(`embriaga (${f.drunkTurns}t)`);
  return `${tipo === 'comida' ? 'Prato' : 'Bebida'} da casa: ${p.join(', ')}.`;
}

const drinkLines = [];
for (let i = 0; i < 100; i++) {
  const cat = DRINK_CATS[i % DRINK_CATS.length];
  const nome = unico(`${pick(DRINK_BASES[cat], i + Math.floor(i / DRINK_CATS.length))} ${pick(DRINK_VAR, i * 7 + 3)}`);
  const f = { categoria: cat, nome, tipo: 'bebida', preco: 10 + ((i * 7) % 30) * 5, emoji: pick(DRINK_EMOJI[cat], i * 5 + 1) };
  f.cura = 20 + ((i * 13) % 360);
  if (i % 3 === 0) f.mana = 10 + ((i * 17) % 80);
  if (i % 4 === 0) { f.buffFisico = r2(0.05 + (i % 7) * 0.02); f.buffTurns = 2 + (i % 3); }
  if (i % 5 === 0) { f.buffMagico = r2(0.05 + (i % 6) * 0.02); f.buffTurns = 2 + (i % 3); }
  if (i % 7 === 0) f.status = { tipo: 'regeneracao', turnos: 3 + (i % 4), dano: 40 + ((i * 11) % 160) };
  if (i % 6 === 0) f.removeStatus = removeSet(i);
  if (ALC.has(cat) && i % 4 === 0) { f.drunk = true; f.drunkTurns = 2 + (i % 4); }
  f.desc = descDe(f, 'bebida');
  drinkLines.push(`  bebida_${String(i + 1).padStart(3, '0')}: ${JSON.stringify(f)},`);
}

// ── Comidas (100) ─────────────────────────────────────────────────────
const FOOD_BASES = {
  petiscos: ['Pastel', 'Bolinho', 'Croquete', 'Empada', 'Tábua de Frios', 'Pão de Alho', 'Brusqueta', 'Coxinha'],
  assados: ['Assado de', 'Grelhado de', 'Costela de', 'Espeto de', 'Coxa de', 'Lombo de', 'Bife de', 'Medalhão de'],
  sopas: ['Sopa de', 'Ensopado de', 'Caldo de', 'Guisado de', 'Creme de', 'Feijoada de', 'Cozido de', 'Mocotó de'],
  paes: ['Pão', 'Broa', 'Baguete', 'Torta', 'Empadão', 'Focaccia', 'Roscas', 'Cacetinho'],
  doces: ['Bolo de', 'Torta de', 'Pudim de', 'Sonho de', 'Compota de', 'Doce de', 'Bombom de'],
  frutas: ['Maçã', 'Pera', 'Uva', 'Melão', 'Morangos', 'Frutas Vermelhas', 'Coco', 'Manga'],
};
const FOOD_PROT = ['Javali', 'Cordeiro', 'Porco', 'Vaca', 'Veado', 'Coelho', 'Pato', 'Peixe', 'Salmão', 'Touro', 'Carneiro', 'Galo'];
const FOOD_SWEET = ['Mel', 'Chocolate', 'Morango', 'Cenoura', 'Coco', 'Limão', 'Amora', 'Nozes', 'Canela', 'Baunilha', 'Maçã', 'Pera'];
const FOOD_VAR = ['da Casa', 'do Taverneiro', 'Defumado', 'Apimentado', 'Rústico', 'Assado', 'Dourado', 'da Horta', 'Refogado', 'Gratinado'];
const FOOD_EMOJI = {
  petiscos: ['🥟', '🍤', '🧀', '🥨'],
  assados: ['🍖', '🥩', '🍗', '🍤'],
  sopas: ['🍲', '🥣', '🥘', '🍜'],
  paes: ['🥖', '🍞', '🥐', '🥯'],
  doces: ['🍰', '🧁', '🍮', '🍩', '🍪'],
  frutas: ['🍎', '🍐', '🍇', '🍉', '🍓', '🍍', '🥝', '🍊'],
};
const FOOD_CATS = ['petiscos', 'assados', 'sopas', 'paes', 'doces', 'frutas'];

function nomeComida(cat, i) {
  if (cat === 'frutas') return `${pick(FOOD_BASES.frutas, i)} ${pick(FOOD_VAR, i * 3 + 1)}`;
  if (cat === 'doces') return `${pick(FOOD_BASES.doces, i)} ${pick(FOOD_SWEET, i * 5 + 2)}`;
  if (cat === 'assados' || cat === 'sopas') return `${pick(FOOD_BASES[cat], i)} ${pick(FOOD_PROT, i * 3 + 1)} ${pick(FOOD_VAR, i * 7 + 4)}`;
  if (cat === 'paes') return `${pick(FOOD_BASES.paes, i)} de ${pick(FOOD_SWEET, i * 3 + 2)}`;
  return `${pick(FOOD_BASES.petiscos, i)} de ${pick(FOOD_PROT, i * 5 + 3)}`;
}

const foodLines = [];
for (let i = 0; i < 100; i++) {
  const cat = FOOD_CATS[i % FOOD_CATS.length];
  const nome = unico(nomeComida(cat, i));
  const f = { categoria: cat, nome, tipo: 'comida', preco: 8 + ((i * 5) % 24) * 5, emoji: pick(FOOD_EMOJI[cat], i * 3 + 1) };
  f.cura = 30 + ((i * 17) % 320);
  if (i % 5 === 0) f.mana = 10 + ((i * 13) % 50);
  if (i % 6 === 0) { f.buffFisico = r2(0.05 + (i % 6) * 0.02); f.buffTurns = 2 + (i % 3); }
  if (i % 8 === 0) { f.buffMagico = r2(0.05 + (i % 5) * 0.02); f.buffTurns = 2 + (i % 3); }
  if (i % 9 === 0) f.status = { tipo: 'regeneracao', turnos: 3 + (i % 4), dano: 50 + ((i * 13) % 180) };
  if (i % 7 === 0) f.removeStatus = removeSet(i + 2);
  f.desc = descDe(f, 'comida');
  foodLines.push(`  comida_${String(i + 1).padStart(3, '0')}: ${JSON.stringify(f)},`);
}

// ── Aplica as inserções ───────────────────────────────────────────────
// 1) Categorias de comida no fim do array TAVERN_CATEGORIES.
const catLines = CATS.map((c) => `  { id: '${c.id}', nome: '${c.nome}', icon: '${c.icon}', blurb: '${c.blurb}' },`).join(EOL);
if (!/export const TAVERN_CATEGORIES = \[[\s\S]*?\r?\n\];/.test(out)) throw new Error('TAVERN_CATEGORIES não encontrado');
out = out.replace(/(export const TAVERN_CATEGORIES = \[[\s\S]*?)(\r?\n\];)/, `$1${EOL}  // Comidas${EOL}${catLines}$2`);

// 2) Novas bebidas antes do fecho de TAVERN_DRINKS; TAVERN_FOODS logo após o fecho.
const anchor = new RegExp('\\r?\\n\\};\\r?\\n(\\s*)export const POINTS_TO_DISTRIBUTE');
if (!anchor.test(out)) throw new Error('fecho de TAVERN_DRINKS não encontrado');
out = out.replace(
  anchor,
  `${EOL}${EOL}  // ── Novas bebidas (100 geradas) ──${EOL}${drinkLines.join(EOL)}${EOL}};${EOL}${EOL}` +
    `export const TAVERN_FOODS = {${EOL}  // ── Comidas da taverna (100 geradas) ──${EOL}${foodLines.join(EOL)}${EOL}};${EOL}${EOL}` +
    `$1export const POINTS_TO_DISTRIBUTE`,
);

fs.writeFileSync(dataPath, out, 'utf8');
console.log(`OK — ${drinkLines.length} bebidas + ${foodLines.length} comidas + ${CATS.length} categorias.`);
