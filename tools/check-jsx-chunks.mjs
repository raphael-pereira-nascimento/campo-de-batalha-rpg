import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';

const file = process.argv[2];
const s = readFileSync(file, 'utf8');
const lines = s.split('\n');
const starts = [];
for (let i = 0; i < lines.length; i++) {
  if (/^(export\s+)?(default\s+)?function\s+/.test(lines[i])) starts.push(i);
}
starts.push(lines.length);
console.log('functions at lines', starts.map((i) => i + 1).join(', '));

for (let k = 0; k < starts.length - 1; k++) {
  const a = starts[k];
  const b = starts[k + 1];
  const chunk = lines.slice(a, b).join('\n');
  try {
    parse(chunk, { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    console.log(`FAIL chunk starting line ${a + 1}: ${e.message} (${e.loc?.line}:${e.loc?.column})`);
  }
}
