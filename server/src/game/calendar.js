// ─────────────────────────────────────────────────────────────────────────────
// CALENDÁRIO DO MUNDO (servidor) — base do Eclipse.
// O dia do calendário do RPG é persistido em JSON no servidor (funciona sem
// PostgreSQL). O Eclipse acontece a cada 30 dias desse calendário.
// O Mestre pode pular dias pelo endpoint /api/calendario (útil para testes).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { estadoEclipse, ECLIPSE_PERIODO } from './eclipse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'calendario.json');

const DIA_INICIAL = 1;
const TIPOS = ['comum', 'maior', 'raro'];

let state = { dia: DIA_INICIAL, tipoEclipse: 'comum', atualizadoEm: 0 };

function carregar() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Number(parsed.dia) >= 1) {
      state = {
        dia: Math.floor(Number(parsed.dia)),
        tipoEclipse: TIPOS.includes(parsed.tipoEclipse) ? parsed.tipoEclipse : 'comum',
        atualizadoEm: Number(parsed.atualizadoEm) || 0,
      };
    }
  } catch {
    // Sem arquivo ainda: começa no dia 1.
  }
}

function salvar() {
  state.atualizadoEm = Date.now();
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.warn('[calendario] não foi possível salvar:', err.message);
  }
}

carregar();

/** Dia atual do calendário do RPG. */
export function getDia() {
  return state.dia;
}

/** Tipo de Eclipse do ciclo atual. */
export function getTipo() {
  return state.tipoEclipse;
}

/** Define o dia (mínimo 1). */
export function setDia(dia) {
  state.dia = Math.max(DIA_INICIAL, Math.floor(Number(dia) || DIA_INICIAL));
  salvar();
  return estado();
}

/** Avança N dias (padrão 1). */
export function avancarDia(n = 1) {
  return setDia(state.dia + Math.max(1, Math.floor(Number(n) || 1)));
}

/** Define o tipo de Eclipse (comum | maior | raro). */
export function setTipo(tipo) {
  state.tipoEclipse = TIPOS.includes(tipo) ? tipo : 'comum';
  salvar();
  return estado();
}

/** Reinicia o calendário (usado em testes). */
export function reset(dia = DIA_INICIAL, tipo = 'comum') {
  state = { dia, tipoEclipse: tipo, atualizadoEm: 0 };
  salvar();
  return estado();
}

/** Estado completo (dia + fase do Eclipse + modificadores). */
export function estado() {
  const eclipse = estadoEclipse(state.dia, state.tipoEclipse);
  return {
    dia: state.dia,
    tipoEclipse: state.tipoEclipse,
    diaNoCiclo: eclipse.diaNoCiclo,
    ciclo: eclipse.ciclo,
    periodo: ECLIPSE_PERIODO,
    atualizadoEm: state.atualizadoEm,
    eclipse,
  };
}