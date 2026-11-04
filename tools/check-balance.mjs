import { readFileSync } from 'node:fs';

const file = process.argv[2];
const s = readFileSync(file, 'utf8');
let i = 0;
let line = 1;
let state = 'code';
const stack = [];

function push(ch) {
  stack.push({ ch, line });
}
function pop(ch) {
  const t = stack.pop();
  const ok = t && ((ch === ')' && t.ch === '(') || (ch === '}' && t.ch === '{') || (ch === ']' && t.ch === '['));
  if (!ok) console.log('mismatch', ch, 'line', line, 'top', t);
}

while (i < s.length) {
  const c = s[i];
  const n = s[i + 1];
  if (c === '\n') line++;

  if (state === 'code') {
    if (c === '/' && n === '/') { state = 'line'; i += 2; continue; }
    if (c === '/' && n === '*') { state = 'block'; i += 2; continue; }
    if (c === "'" || c === '"') { state = c; i++; continue; }
    if (c === '`') { state = 'template'; i++; continue; }
    if ('({['.includes(c)) { push(c); i++; continue; }
    if (')}]'.includes(c)) { pop(c); i++; continue; }
    i++;
    continue;
  }

  if (state === 'line') {
    if (c === '\n') state = 'code';
    i++;
    continue;
  }

  if (state === 'block') {
    if (c === '*' && n === '/') { state = 'code'; i += 2; continue; }
    i++;
    continue;
  }

  if (state === 'template') {
    if (c === '\\') { i += 2; continue; }
    if (c === '`') { state = 'code'; i++; continue; }
    if (c === '$' && n === '{') { push('{'); state = 'code'; i += 2; continue; }
    i++;
    continue;
  }

  if (state === "'" || state === '"') {
    if (c === '\\') { i += 2; continue; }
    if (c === state) { state = 'code'; i++; continue; }
    i++;
    continue;
  }
}

console.log('end state', state, 'stack', stack.slice(-20));
