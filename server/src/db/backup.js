import 'dotenv/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/campo_de_batalha';
const backupDir = path.join(__dirname, '..', '..', 'backups');
fs.mkdirSync(backupDir, { recursive: true });

async function findPgDump() {
  const roots = [
    path.join('C:\\', 'Program Files', 'PostgreSQL'),
    path.join('C:\\', 'Program Files (x86)', 'PostgreSQL'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'PostgreSQL'),
  ];
  const installed = roots.flatMap((dir) => {
    try {
      return fs
        .readdirSync(dir)
        .map((v) => path.join(dir, v, 'bin', 'pg_dump.exe'))
        .filter((p) => fs.existsSync(p))
        .sort()
        .reverse();
    } catch {
      return [];
    }
  });
  const candidates = [...installed, 'pg_dump'];
  for (const candidate of candidates) {
    try {
      await execFileP(candidate, ['--version']);
      return candidate;
    } catch {
      // tenta o próximo
    }
  }
  return null;
}

const stamp = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
const file = path.join(backupDir, `campo-${stamp}.sql`);

try {
  const pgDump = await findPgDump();
  if (!pgDump) throw new Error('pg_dump não encontrado.');
  await execFileP(pgDump, ['--no-owner', '--no-privileges', '--file', file, databaseUrl]);
  console.log(`[backup] OK -> ${file}`);
} catch (err) {
  console.error('[backup] Falha ao gerar backup.');
  console.error('Verifique se o pg_dump está instalado e no PATH (acompanha o PostgreSQL).');
  console.error(err.message);
  process.exit(1);
}
