// Corrige tags JSX </main> / </div> trocadas por um replace anterior.
// Percorre as tags na ordem mantendo uma pilha; quando um fechamento
// </main> cai sobre um <div> aberto (ou vice-versa), corrige o fechamento.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'src/pages/Battle.jsx', 'src/pages/Registry.jsx', 'src/pages/Compendium.jsx',
  'src/pages/TableBattle.jsx', 'src/pages/GemForge.jsx', 'src/pages/Forge.jsx',
  'src/pages/Lobby.jsx', 'src/pages/Rules.jsx', 'src/pages/Dungeons.jsx',
  'src/pages/Mineracao.jsx', 'src/pages/Tavern.jsx', 'src/pages/ToolShop.jsx',
  'src/pages/Characters.jsx', 'src/pages/Home.jsx',
];

const TAG_RE = /<(\/?)([a-zA-Z][\w.]*)\b([^<>]*?)(\/?)>/g;

for (const rel of files) {
  const path = resolve(root, rel);
  const src = readFileSync(path, 'utf8');
  const stack = [];
  const edits = []; // {start, end, text, kind}
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(src)) !== null) {
    const [full, slash, name, attrs, selfClose] = m;
    if (selfClose === '/') continue;
    if (!slash) { stack.push(name); continue; }
    // closing tag
    const top = stack[stack.length - 1];
    if (top === name) { stack.pop(); continue; }
    // mismatch: only fix main/div swaps, keep stack consistent
    if ((name === 'main' && top === 'div') || (name === 'div' && top === 'main')) {
      edits.push({ start: m.index, end: m.index + full.length, text: `</${top}>` });
      stack.pop();
      continue;
    }
    // other mismatch: pop until match if present (best effort, no edit)
    const idx = stack.lastIndexOf(name);
    if (idx >= 0) stack.length = idx;
  }
  if (!edits.length) { console.log(`ok      ${rel} (pilha restante: ${stack.join(',')})`); continue; }
  let out = src;
  for (const e of edits.reverse()) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  writeFileSync(path, out);
  console.log(`fixed   ${rel}: ${edits.length} fechamento(s)`);
}
