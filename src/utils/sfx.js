// Sons de batalha via Web Audio API — zero arquivos externos.
// Cada som é sintetizado por osciladores; leve e funciona offline.

const MUTED_KEY = 'cbr_sfx_muted';
let _ctx = null;

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

export function isMuted() {
  return localStorage.getItem(MUTED_KEY) === '1';
}

export function toggleMute() {
  const next = !isMuted();
  localStorage.setItem(MUTED_KEY, next ? '1' : '0');
  return next;
}

function tone(freq, dur, type = 'sine', vol = 0.25) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur + 0.01);
}

function dualTone(f1, f2, dur1, dur2, type = 'sine', vol = 0.2) {
  const ctx = getCtx();
  [f1, f2].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + (i === 0 ? 0 : dur1 * 0.8);
    const dur = i === 0 ? dur1 : dur2;
    osc.type = type;
    osc.frequency.setValueAtTime(f, start);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  });
}

const SOUNDS = {
  hit:     () => { tone(180, 0.14, 'square', 0.2); tone(120, 0.18, 'sawtooth', 0.12); },
  heal:    () => dualTone(523, 659, 0.22, 0.22, 'sine', 0.18),
  death:   () => { tone(260, 0.3, 'sawtooth', 0.15); setTimeout(() => tone(80, 0.45, 'sawtooth', 0.12), 80); },
  miss:    () => dualTone(380, 260, 0.1, 0.14, 'sine', 0.12),
  victory: () => {
    const ctx = getCtx();
    [440, 554, 659].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      const start = ctx.currentTime + i * 0.18;
      osc.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.16, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(g).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  },
  turn:    () => tone(660, 0.08, 'sine', 0.08),
};

const KIND_MAP = { info: 'hit', enemy: null, defense: 'miss' };

export function play(name) {
  if (isMuted()) return;
  try { getCtx(); SOUNDS[name]?.(); } catch (_) {}
}

export function playLogKind(kind) {
  const name = KIND_MAP[kind] ?? kind;
  if (name && SOUNDS[name]) play(name);
}
