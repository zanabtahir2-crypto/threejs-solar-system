import * as THREE from 'three';

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { repeatX = 1, repeatY = 1, clampY = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = clampY ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}

function blob(ctx, x, y, rx, ry, rgb, alpha) {
  const R = Math.max(rx, ry, 0.001);
  const c = rgb.join(',');
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, `rgba(${c},${alpha})`);
  g.addColorStop(1, `rgba(${c},0)`);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx / R, ry / R);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------ rocky (cratered) surfaces */
export function rockyTexture({ base = [120, 110, 100], shades, craters = 70, seed = 1, blotches = 140, w = 512, h = 256 } = {}) {
  const s = shades || [
    [Math.max(0, base[0] - 40), Math.max(0, base[1] - 38), Math.max(0, base[2] - 36)],
    [Math.min(255, base[0] + 45), Math.min(255, base[1] + 42), Math.min(255, base[2] + 40)]
  ];
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);

  ctx.fillStyle = `rgb(${base.join(',')})`;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < blotches; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 6 + rnd() * 55;
    const col = rnd() > 0.5 ? s[1] : s[0];
    blob(ctx, x, y, r, r * (0.6 + rnd() * 0.7), col, 0.07 + rnd() * 0.13);
  }

  for (let i = 0; i < craters; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 1.5 + rnd() * 8;
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = `rgb(${s[0].join(',')})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = `rgb(${s[1].join(',')})`;
    ctx.lineWidth = Math.max(1, r * 0.28);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  return toTexture(c);
}

/* ------------------------------------------------------ banded gas / ice giants */
export function bandedTexture({ palette, seed = 1, turbulence = 1, storm = null, w = 512, h = 256 } = {}) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  const cols = palette.length - 1;

  for (let y = 0; y < h; y++) {
    const t = y / h;
    const wave =
      Math.sin(t * Math.PI * 6 + seed) * 0.07 * turbulence +
      Math.sin(t * Math.PI * 17 + seed * 2.3) * 0.035 * turbulence +
      Math.sin(t * Math.PI * 3 + seed * 0.7) * 0.05 * turbulence;
    const p = Math.min(0.999, Math.max(0, t + wave)) * cols;
    const i = Math.floor(p);
    const f = p - i;
    const a = palette[i];
    const b = palette[Math.min(cols, i + 1)];
    const col = a.map((v, k) => Math.round(v + (b[k] - v) * f));
    ctx.fillStyle = `rgb(${col.join(',')})`;
    ctx.fillRect(0, y, w, 1);
  }

  for (let i = 0; i < 320; i++) {
    const y = rnd() * h;
    const hh = 1 + rnd() * 5;
    const x = rnd() * w;
    const ww = 30 + rnd() * 240;
    const light = rnd() > 0.5;
    ctx.globalAlpha = 0.05 + rnd() * 0.11;
    ctx.fillStyle = light ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)';
    ctx.fillRect(x, y, ww, hh);
    ctx.globalAlpha = 1;
  }

  if (storm) {
    const sx = storm.x * w;
    const sy = storm.y * h;
    const rx = storm.rx * w;
    const ry = storm.ry * h;
    for (let i = 0; i < 40; i++) {
      const f = 1 - i / 40;
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = storm.color;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx * f, ry * f, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return toTexture(c);
}

/* --------------------------------------------------------------- Earth */
export function earthTexture() {
  const w = 1024;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(42);

  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, '#0a2a5e');
  ocean.addColorStop(0.5, '#1257a6');
  ocean.addColorStop(1, '#0a2a5e');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 90; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 25 + rnd() * 80;
    blob(ctx, x, y, r, r * 0.75, [40, 115, 185], 0.08 + rnd() * 0.1);
  }

  const clusters = [
    [0.17, 0.30, 0.10, 0.14],
    [0.23, 0.62, 0.07, 0.16],
    [0.30, 0.47, 0.05, 0.05],
    [0.48, 0.26, 0.09, 0.11],
    [0.55, 0.55, 0.09, 0.15],
    [0.68, 0.34, 0.16, 0.13],
    [0.79, 0.66, 0.07, 0.07],
    [0.90, 0.42, 0.05, 0.08]
  ];

  for (const [cx, cy, rx, ry] of clusters) {
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd());
      const x = (cx + Math.cos(a) * rx * d) * w;
      const y = (cy + Math.sin(a) * ry * d) * h;
      const r = 14 + rnd() * 44;
      const t = rnd();
      const col = t < 0.5 ? [46, 118, 58] : t < 0.8 ? [96, 134, 62] : [178, 152, 96];
      blob(ctx, x, y, r, r * (0.7 + rnd() * 0.5), col, 0.5 + rnd() * 0.4);
      blob(ctx, x, y, r * 0.55, r * 0.5, col.map((v) => Math.min(255, v + 28)), 0.45);
    }
  }

  const capTop = ctx.createLinearGradient(0, 0, 0, h * 0.13);
  capTop.addColorStop(0, 'rgba(255,255,255,0.95)');
  capTop.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = capTop;
  ctx.fillRect(0, 0, w, h * 0.13);

  const capBot = ctx.createLinearGradient(0, h, 0, h * 0.85);
  capBot.addColorStop(0, 'rgba(255,255,255,0.95)');
  capBot.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = capBot;
  ctx.fillRect(0, h * 0.85, w, h * 0.15);

  return toTexture(c);
}

export function cloudTexture() {
  const w = 1024;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(7);

  for (let i = 0; i < 300; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const rx = 18 + rnd() * 95;
    const ry = 6 + rnd() * 26;
    blob(ctx, x, y, rx, ry, [255, 255, 255], 0.1 + rnd() * 0.3);
  }
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    blob(ctx, x, y, 40 + rnd() * 120, 25 + rnd() * 45, [235, 243, 255], 0.12 + rnd() * 0.16);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ Sun */
export function sunTexture() {
  const w = 1024;
  const h = 512;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(3);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ff8a1f');
  grad.addColorStop(0.5, '#ffb43c');
  grad.addColorStop(1, '#ff7a14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 700; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 4 + rnd() * 34;
    const t = rnd();
    const col = t < 0.5 ? [255, 228, 140] : t < 0.82 ? [255, 160, 40] : [214, 74, 12];
    blob(ctx, x, y, r, r * (0.6 + rnd() * 0.6), col, 0.1 + rnd() * 0.25);
  }
  for (let i = 0; i < 60; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 3 + rnd() * 14;
    blob(ctx, x, y, r, r, [255, 250, 215], 0.3 + rnd() * 0.4);
  }

  return toTexture(c);
}

/* --------------------------------------------------------- Saturn rings */
export function ringTexture() {
  const w = 1024;
  const h = 4;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');

  for (let x = 0; x < w; x++) {
    const t = x / w;
    const n = (Math.sin(t * 57) + Math.sin(t * 143 + 1.7) + Math.sin(t * 311 + 4.2)) / 3;
    let a = 0.45 + 0.4 * n;
    if (t < 0.1) a *= t / 0.1;
    if (t > 0.94) a *= (1 - t) / 0.06;
    if (t > 0.56 && t < 0.64) a *= 0.07;
    if (t > 0.86 && t < 0.885) a *= 0.35;
    a = Math.max(0, Math.min(0.9, a));
    const r = Math.round(214 + 34 * n);
    const g = Math.round(197 + 30 * n);
    const b = Math.round(166 + 24 * n);
    ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
    ctx.fillRect(x, 0, 1, h);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------ sprite utilities */
export function starSprite() {
  const c = makeCanvas(64, 64);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

export function glowSprite() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,240,205,1)');
  g.addColorStop(0.15, 'rgba(255,200,110,0.72)');
  g.addColorStop(0.4, 'rgba(255,140,45,0.26)');
  g.addColorStop(0.7, 'rgba(255,90,20,0.08)');
  g.addColorStop(1, 'rgba(255,80,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
