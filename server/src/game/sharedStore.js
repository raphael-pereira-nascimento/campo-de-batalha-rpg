import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const FILE = path.join(DATA_DIR, 'shared_characters.json');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  try {
    ensureDir();
    if (!existsSync(FILE)) return [];
    const raw = readFileSync(FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    ensureDir();
    writeFileSync(FILE, JSON.stringify(list, null, 2));
  } catch {}
}

export function createSharedCharacter(data) {
  const list = load();
  const id = randomUUID().slice(0, 8);
  const rec = { id, data, createdAt: Date.now() };
  list.push(rec);
  const cleaned = list.filter((r) => Date.now() - r.createdAt < 30 * 24 * 60 * 60 * 1000);
  save(cleaned);
  return rec;
}

export function getSharedCharacter(id) {
  const list = load();
  return list.find((r) => r.id === id) || null;
}