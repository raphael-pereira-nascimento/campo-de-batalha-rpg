// Copia o bloco `canoes` do catálogo do cliente para o catálogo do servidor.
// Idempotente: se o servidor já tiver o bloco, não faz nada.
import { readFileSync, writeFileSync } from 'node:fs';

const CLIENT = 'src/game/data.js';
const SERVER = 'server/src/game/data.js';

const client = readFileSync(CLIENT, 'utf8');
const start = client.indexOf('  canoes: {');
if (start === -1) {
  console.error('bloco canoes não encontrado no cliente');
  process.exit(1);
}
const endMarker = '\n  acessorios: {';
const end = client.indexOf(endMarker, start);
if (end === -1) {
  console.error('fim do bloco canoes não encontrado');
  process.exit(1);
}
const block = client.slice(start, end + 1);

let server = readFileSync(SERVER, 'utf8');
if (server.includes('canoes: {')) {
  console.log('servidor já tem o bloco canoes — nada a fazer');
  process.exit(0);
}

const anchor = '  acessorios: {';
const idx = server.indexOf(anchor);
if (idx === -1) {
  console.error('âncora não encontrada no servidor');
  process.exit(1);
}
server = server.slice(0, idx) + block + server.slice(idx);
writeFileSync(SERVER, server);
console.log('bloco canoes sincronizado no servidor');
