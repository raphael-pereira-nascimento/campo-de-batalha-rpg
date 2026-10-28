// Gera public/icon-192.png e public/icon-512.png.
//
// Os ícones antigos eram um "B" cortado no canto da imagem (bug de recorte).
// Este script desenha o brasão do jogo por código — escudo + espada — e mantém
// a arte dentro da zona segura de 80% exigida por `purpose: "maskable"`,
// para o Android/iOS não cortarem o desenho ao instalar o PWA.
//
// Uso: node tools/gen-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public');

// ── Paleta (a mesma do site) ────────────────────────────────────────────
const BG_TOP = [26, 16, 40]; // #1a1028
const BG_BOTTOM = [59, 42, 99]; // #3b2a63
const GOLD = [255, 209, 102]; // --accent-2
const GOLD_DARK = [196, 146, 44];
const STEEL = [232, 233, 245]; // --text
const STEEL_DARK = [154, 160, 192]; // --muted

// ── Desenho em coordenadas de 512×512 ───────────────────────────────────
// A zona segura maskable é o círculo central de 80%; mantemos a arte em
// ~72% da largura para sobrar respiro em qualquer recorte.
const SHIELD_CX = 256;
const SHIELD_TOP = 96;
const SHIELD_HALF = 138;
const SHIELD_STRAIGHT_END = 250;
const SHIELD_BOTTOM = 424;
const BORDER = 20;

function shieldHalfWidth(y) {
  if (y < SHIELD_TOP || y > SHIELD_BOTTOM) return -1;
  if (y <= SHIELD_STRAIGHT_END) return SHIELD_HALF;
  const t = (y - SHIELD_STRAIGHT_END) / (SHIELD_BOTTOM - SHIELD_STRAIGHT_END);
  return SHIELD_HALF * Math.sqrt(Math.max(0, 1 - t * t));
}

// Escudo heráldico: topo reto + laterais retas + ponta curva.
// `inset` encolhe a forma para dentro, produzindo a borda dourada.
function inShield(x, y, inset = 0) {
  if (y < SHIELD_TOP + inset) return false;
  const half = shieldHalfWidth(y);
  if (half < 0) return false;
  return Math.abs(x - SHIELD_CX) <= half - inset;
}

// Espada: lâmina vertical, guarda, cabo e pomo.
function inBlade(x, y) {
  if (y < 150 || y > 336) return false;
  const t = (y - 150) / 60; // ponta afiada nos primeiros 60px
  const halfW = t >= 1 ? 17 : 17 * (0.25 + 0.75 * t);
  return Math.abs(x - SHIELD_CX) <= halfW;
}
function inGuard(x, y) {
  const halfW = 74;
  const top = 336;
  const h = 20;
  if (y < top || y > top + h) return false;
  const dx = Math.abs(x - SHIELD_CX);
  if (dx > halfW) return false;
  const r = h / 2;
  if (dx > halfW - r) {
    const ox = dx - (halfW - r);
    const oy = y - (top + r);
    return ox * ox + oy * oy <= r * r;
  }
  return true;
}
function inGrip(x, y) {
  return y >= 356 && y <= 400 && Math.abs(x - SHIELD_CX) <= 12;
}
function inPommel(x, y) {
  const dx = x - SHIELD_CX;
  const dy = y - 412;
  return dx * dx + dy * dy <= 17 * 17;
}

function inSword(x, y) {
  return inBlade(x, y) || inGuard(x, y) || inGrip(x, y) || inPommel(x, y);
}

// Fundo: quadrado arredondado com gradiente vertical.
function roundedCoverage(x, y, size, radius) {
  const rx = Math.min(x, size - x);
  const ry = Math.min(y, size - y);
  if (rx >= radius || ry >= radius) return rx >= 0 && ry >= 0 ? 1 : 0;
  const dx = radius - rx;
  const dy = radius - ry;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, Math.min(1, radius - d + 0.5));
}

function renderIcon(size) {
  const SS = 3; // supersampling para suavizar as bordas
  const scale = size / 512;
  const px = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          // coordenada no espaço 512×512
          const ux = (x + (sx + 0.5) / SS) / scale;
          const uy = (y + (sy + 0.5) / SS) / scale;

          let cr = 0;
          let cg = 0;
          let cb = 0;
          let ca = 0;

          const cover = roundedCoverage(ux, uy, 512, 112);
          if (cover > 0) {
            const t = uy / 512;
            cr = BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t;
            cg = BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t;
            cb = BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t;
            ca = 1;
          }

          // Escudo: borda dourada + interior escuro translúcido
          if (inShield(ux, uy)) {
            if (!inShield(ux, uy, BORDER)) {
              const shade = 1 - (uy - SHIELD_TOP) / 900;
              cr = GOLD[0] * shade;
              cg = GOLD[1] * shade;
              cb = GOLD[2] * shade;
            } else {
              cr = cr * 0.35 + GOLD_DARK[0] * 0.06;
              cg = cg * 0.35 + GOLD_DARK[1] * 0.06;
              cb = cb * 0.35 + GOLD_DARK[2] * 0.06;
            }
          }

          // Espada
          if (inSword(ux, uy)) {
            const t = (uy - 150) / 280;
            cr = STEEL[0] - (STEEL[0] - STEEL_DARK[0]) * t * 0.5;
            cg = STEEL[1] - (STEEL[1] - STEEL_DARK[1]) * t * 0.5;
            cb = STEEL[2] - (STEEL[2] - STEEL_DARK[2]) * t * 0.5;
          }

          r += cr;
          g += cg;
          b += cb;
          a += ca;
        }
      }

      const n = SS * SS;
      const i = (y * size + x) * 4;
      const alpha = a / n;
      // cor média ponderada pelo alpha (evita halo escuro nas bordas)
      px[i] = alpha > 0 ? Math.round(r / a) : 0;
      px[i + 1] = alpha > 0 ? Math.round(g / a) : 0;
      px[i + 2] = alpha > 0 ? Math.round(b / a) : 0;
      px[i + 3] = Math.round(alpha * 255);
    }
  }

  return px;
}

// ── Encoder PNG mínimo (RGBA, sem dependências) ─────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "none"
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const png = encodePng(size, renderIcon(size));
  const file = resolve(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`✔ ${file} (${(png.length / 1024).toFixed(1)} KB)`);
}
