export function clamp(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function clampInt(v, min, max) {
  return Math.round(clamp(v, min, max));
}

export function clampFloat(v, min, max) {
  return clamp(v, min, max);
}
