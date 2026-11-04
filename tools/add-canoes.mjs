// Insere o bloco de canhões de artilharia no catálogo EQUIPMENT (src/game/data.js).
// Idempotente: se já existir, não faz nada.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/game/data.js';
let src = readFileSync(FILE, 'utf8');

if (src.includes('canoes: {')) {
  console.log('já existe o bloco canoes — nada a fazer');
  process.exit(0);
}

const block = `  canoes: {
    // ── Canhões de artilharia (💣) ───────────────────────────────
    // Peças de cerco pesadas: tiro lento, dano em área ampla, elemento fogo.
    // Usam os campos que o motor de batalha já lê: alvo/alvos/splash.
    canhao_leve: { preco: 4200, nome: 'Canhão Leve', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 10, bonus: { forca: 1 }, socketSlots: 2, alcance: 'medio', recarga: 3, alvo: 'explosao', alvos: 3, splash: 0.5, descricao: 'Peça de artilharia portátil: alvo principal 100%, vizinhos 50%.' },
    canhao_cerco: { preco: 6100, nome: 'Canhão de Cerco', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 12, bonus: { forca: 2, resistencia: 1 }, socketSlots: 3, alcance: 'medio', recarga: 4, alvo: 'explosao', alvos: 4, splash: 0.6, descricao: 'Canhão pesado de sítio: vizinhos sofrem 60%. Precisa de tripé para recarregar.' },
    canhao_ferro: { preco: 8500, nome: 'Canhão de Ferro', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 14, bonus: { forca: 3, resistencia: 2 }, socketSlots: 3, alcance: 'medio', recarga: 4, alvo: 'explosao', alvos: 4, splash: 0.7, descricao: 'Ferro maciço e pólvora negra. Splash 70% — devastador contra grupos.' },
    canhao_de_salto: { preco: 9800, nome: 'Canhão de Salto', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 13, bonus: { destreza: 2, inteligencia: 1 }, socketSlots: 3, alcance: 'longo', recarga: 4, alvo: 'explosao', alvos: 5, splash: 0.6, descricao: 'Precisão com ajuste de elevação: alcance longo e splash 60%.' },
    canhao_morteiro: { preco: 11000, nome: 'Canhão Morteiro', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 15, bonus: { inteligencia: 2 }, socketSlots: 3, alcance: 'longo', recarga: 5, alvo: 'explosao', alvos: 5, splash: 0.7, descricao: 'Trajetória curva arcana: explode atrás das linhas inimigas, splash 70%.' },
    canhao_bombasta: { preco: 14500, nome: 'Canhão Bombasta', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 16, bonus: { forca: 3, resistencia: 3 }, socketSlots: 4, alcance: 'medio', recarga: 5, alvo: 'explosao', alvos: 5, splash: 0.75, descricao: 'A besta dos céus: vizinhos sofrem 75%. Peso quase proibitivo.' },
    canhao_dragoes: { preco: 18500, nome: 'Canhão de Dragões', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'fogo', danoBase: 18, bonus: { inteligencia: 3, resistencia: 2 }, socketSlots: 4, alcance: 'longo', recarga: 5, alvo: 'explosao', alvos: 5, splash: 0.8, descricao: 'Cuspe de dragão em cano de bronze: splash 80%, ignora parte da defesa.' },
    canhao_abismo: { preco: 24000, nome: 'Canhão do Abismo', tipo: 'arma_fogo', categoria: 'distancia', elemento: 'trevas', danoBase: 20, bonus: { inteligencia: 4, resistencia: 2 }, socketSlots: 4, alcance: 'longo', recarga: 6, alvo: 'explosao', alvos: 5, splash: 0.8, descricao: 'Feito dos engenheiros do Eclipse: splash 80%, elemento trevas.' },
  },
`;

const anchor = '  acessorios: {';
const idx = src.indexOf(anchor);
if (idx === -1) {
  console.error('âncora não encontrada');
  process.exit(1);
}
src = src.slice(0, idx) + block + src.slice(idx);
writeFileSync(FILE, src);
console.log('bloco canoes inserido');
