// ─────────────────────────────────────────────────────────────────────────────
// CALENDÁRIO DO MUNDO — base do Eclipse.
// O RPG tem um calendário próprio: o dia avança dentro do RPG, não pelo relógio
// do navegador. O Eclipse acontece a cada 30 dias desse calendário.
// Persistência local (offline) + sincronização com o servidor quando online.
// ─────────────────────────────────────────────────────────────────────────────
import { estadoEclipse, ECLIPSE_PERIODO } from './eclipse.js';

const STORAGE_KEY = 'cbr_calendario';
const DIA_INICIAL = 1;

function lerLocal() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.dia) return null;
    return { dia: Number(parsed.dia), tipo: parsed.tipo || 'comum' };
  } catch {
    return null;
  }
}

function gravarLocal(dia, tipo) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ dia, tipo, salvoEm: Date.now() }));
  } catch {
    /* modo privado / sem storage: mantém em memória */
  }
}

let memoria = { dia: DIA_INICIAL, tipo: 'comum' };

/** Dia atual do calendário do RPG (mínimo 1). */
export function getDiaMundo() {
  const salvo = lerLocal();
  if (salvo) memoria = salvo;
  return memoria.dia;
}

/** Tipo de Eclipse configurado no mundo (comum | maior | raro). */
export function getTipoEclipse() {
  getDiaMundo();
  return memoria.tipo;
}

/** Avança o calendário em N dias e devolve o novo estado. */
export function avancarDia(n = 1) {
  const dia = getDiaMundo() + Math.max(1, Math.floor(Number(n) || 1));
  setDia(dia);
  return estadoMundo();
}

/** Define o dia atual (útil para o Mestre pular direto para o Eclipse). */
export function setDia(dia) {
  const d = Math.max(DIA_INICIAL, Math.floor(Number(dia) || DIA_INICIAL));
  memoria = { dia: d, tipo: memoria.tipo || 'comum' };
  gravarLocal(memoria.dia, memoria.tipo);
  return memoria.dia;
}

/** Define o tipo de Eclipse do ciclo atual. */
export function setTipoEclipse(tipo) {
  getDiaMundo();
  memoria.tipo = ['comum', 'maior', 'raro'].includes(tipo) ? tipo : 'comum';
  gravarLocal(memoria.dia, memoria.tipo);
  return memoria.tipo;
}

/** Estado completo: dia + fase do Eclipse + modificadores do momento. */
export function estadoMundo() {
  const dia = getDiaMundo();
  const eclipse = estadoEclipse(dia, getTipoEclipse());
  return {
    dia,
    diaNoCiclo: eclipse.diaNoCiclo,
    ciclo: eclipse.ciclo,
    periodo: ECLIPSE_PERIODO,
    tipoEclipse: getTipoEclipse(),
    eclipse,
  };
}

/** Inicia (ou reinicia) o calendário. */
export function resetCalendario(dia = DIA_INICIAL, tipo = 'comum') {
  memoria = { dia, tipo };
  gravarLocal(dia, tipo);
  return estadoMundo();
}

/**
 * Sincroniza o calendário com o servidor (que é a fonte da verdade online).
 * Se o servidor não responder, mantém o valor local.
 */
export async function sincronizarCalendario(api) {
  try {
    const res = await api.calendario();
    if (res?.dia) setDia(res.dia);
    if (res?.tipoEclipse) setTipoEclipse(res.tipoEclipse);
    return estadoMundo();
  } catch {
    return estadoMundo();
  }
}