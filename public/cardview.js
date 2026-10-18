/* Motor de cartas personalizables.
   Una carta (v2) = { v:2, ratio, radius, env, fx, front:{bg,frame,fx,layers[]}, back:{...}|null }
   Todas las medidas están en "% del ancho de la carta" (x, y se miden en % del ancho/alto).
   Devuelve HTML en texto para poder usarlo en editor, galería, visor público e impresión. */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeImg = (u) => (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u || '') ? u : '');
  const hex = (c, d) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : d);
  const N = (v, d, a, b) => { v = parseFloat(v); if (!Number.isFinite(v)) v = d; return Math.min(b, Math.max(a, v)); };
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const em = (v) => (v / 10).toFixed(3) + 'em'; // 1em = 10% del ancho de la carta
  const uid = () => Math.random().toString(36).slice(2, 8);
  const PX = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  function shade(c, k) {
    let h = String(c || '#888888').replace('#', '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16) || 0;
    const t = k < 0 ? 0 : 255, p = Math.abs(k);
    const ch = (v) => Math.round((t - v) * p + v).toString(16).padStart(2, '0');
    return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255);
  }

  /* ───────── catálogos ───────── */
  const RATIOS = { portrait: [5, 7, 'Vertical 5×7'], landscape: [7, 5, 'Horizontal 7×5'], square: [1, 1, 'Cuadrada'], tarot: [4, 7, 'Alargada (tarot)'] };
  const FONTS = [
    { id: 'Playfair Display', n: 'Elegante', f: 'Georgia, serif' },
    { id: 'Great Vibes', n: 'Caligrafía', f: 'cursive' },
    { id: 'Dancing Script', n: 'Cursiva', f: 'cursive' },
    { id: 'Caveat', n: 'Manuscrita', f: 'cursive' },
    { id: 'Cinzel', n: 'Romana', f: 'Georgia, serif' },
    { id: 'Cormorant Garamond', n: 'Literaria', f: 'Georgia, serif' },
    { id: 'Lobster', n: 'Retro', f: 'cursive' },
    { id: 'Pacifico', n: 'Playera', f: 'cursive' },
    { id: 'Permanent Marker', n: 'Marcador', f: 'cursive' },
    { id: 'Abril Fatface', n: 'Titular', f: 'Georgia, serif' },
    { id: 'Special Elite', n: 'Máquina', f: 'monospace' },
    { id: 'Bangers', n: 'Cómic', f: 'Impact, sans-serif' },
    { id: 'Fredoka', n: 'Redonda', f: 'system-ui, sans-serif' },
    { id: 'DM Sans', n: 'Limpia', f: 'system-ui, sans-serif' },
  ];
  const fontCss = (id) => { const f = FONTS.find((x) => x.id === id) || FONTS[0]; return `'${f.id}',${f.f}`; };
  const FOILS = {
    gold: [[0, '#7a5a14'], [.22, '#e9c46a'], [.38, '#fff3b0'], [.55, '#c9962d'], [.72, '#f4d77a'], [1, '#8a6516']],
    silver: [[0, '#6b7280'], [.25, '#e5e7eb'], [.4, '#ffffff'], [.6, '#9ca3af'], [.78, '#f3f4f6'], [1, '#6b7280']],
    rose: [[0, '#9a5b4f'], [.25, '#f4c7b8'], [.4, '#fff0e8'], [.6, '#c98b7b'], [.78, '#f2bfae'], [1, '#8d5246']],
    holo: [[0, '#ff5fa2'], [.22, '#ffd166'], [.45, '#5eead4'], [.68, '#60a5fa'], [.85, '#c084fc'], [1, '#ff5fa2']],
  };
  const FOIL_NAMES = { gold: 'Oro', silver: 'Plata', rose: 'Oro rosa', holo: 'Holográfico' };
  const foilCss = (k, ang) => `linear-gradient(${ang || 135}deg,${FOILS[k].map((s) => `${s[1]} ${s[0] * 100}%`).join(',')})`;
  const FILTERS = {
    none: ['Original', ''], bw: ['Blanco y negro', 'grayscale(1) contrast(1.1)'], sepia: ['Sepia', 'sepia(.85) contrast(1.05)'],
    vintage: ['Vintage', 'sepia(.45) saturate(1.3) contrast(.9) brightness(1.05) hue-rotate(-10deg)'],
    warm: ['Cálido', 'saturate(1.2) sepia(.2) brightness(1.05)'], cool: ['Frío', 'saturate(1.1) hue-rotate(12deg) brightness(1.03)'],
    vivid: ['Vívido', 'saturate(1.5) contrast(1.1)'], fade: ['Desvanecido', 'contrast(.85) brightness(1.1) saturate(.8)'],
    dream: ['Ensueño', 'brightness(1.12) saturate(1.25) contrast(.92) blur(.4px)'],
  };
  const burst = (n, r1, r2) => { let p = ''; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? r2 : r1; p += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (50 + r * Math.sin(a)).toFixed(1); } return p + 'Z'; };
  const pol = (a, r) => [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
  const pt = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1);
  function flower(n, R, W) {
    let p = '';
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; p += `M50 50C${pt(pol(a - W, R * .9))} ${pt(pol(a - W * .55, R * 1.12))} ${pt(pol(a, R))}C${pt(pol(a + W * .55, R * 1.12))} ${pt(pol(a + W, R * .9))} 50 50Z`; }
    return p;
  }
  function scallop(n, r, b) {
    let p = 'M' + pt(pol(0, r));
    for (let i = 1; i <= n; i++) p += `Q${pt(pol(2 * Math.PI * (i - .5) / n, r + b))} ${pt(pol(2 * Math.PI * i / n, r))}`;
    return p + 'Z';
  }
  function laurel() {
    let p = '';
    for (const side of [-1, 1]) {
      for (let j = 0; j < 9; j++) {
        const a = Math.PI + side * (.28 + j * .29), P = pol(a, 36);
        const tx = side < 0 ? Math.cos(a) : -Math.cos(a), ty = side < 0 ? Math.sin(a) : -Math.sin(a);
        const ox = Math.sin(a), oy = -Math.cos(a), k = .55;
        let dx = tx + ox * k, dy = ty + oy * k; const m = Math.hypot(dx, dy); dx /= m; dy /= m;
        const L = 15 - j * .35, Wd = 4.6, mx = P[0] + dx * L / 2, my = P[1] + dy * L / 2, nx = -dy, ny = dx;
        p += `M${pt(P)}Q${pt([mx + nx * Wd, my + ny * Wd])} ${pt([P[0] + dx * L, P[1] + dy * L])}Q${pt([mx - nx * Wd, my - ny * Wd])} ${pt(P)}Z`;
      }
    }
    return p;
  }
  const zig = (n, w, y1, y2) => { let p = `M0 ${y2}`; for (let i = 1; i <= n; i++) p += `L${(w * i / n).toFixed(1)} ${i % 2 ? y1 : y2}`; return p; };
  const SHAPES = {
    heart: ['Corazón', 'M50 90 C50 90 6 62 6 33 C6 17 18 7 31 7 C40 7 47 12 50 19 C53 12 60 7 69 7 C82 7 94 17 94 33 C94 62 50 90 50 90Z'],
    star: ['Estrella', burst(5, 49, 20)],
    burst: ['Explosión', burst(14, 49, 40)],
    sparkle: ['Destello', 'M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2Z'],
    diamond: ['Diamante', 'M50 3 L95 50 L50 97 L5 50Z'],
    arch: ['Arco', 'M8 98 V50 A42 42 0 0 1 92 50 V98Z'],
    blob: ['Mancha', 'M50 4 C76 2 97 24 94 50 C91 78 72 97 46 94 C21 91 4 72 7 46 C9 23 28 6 50 4Z'],
    moon: ['Luna', 'M62 6 A44 44 0 1 0 94 68 A36 36 0 1 1 62 6Z'],
    banner: ['Cinta', 'M2 22 H98 L88 50 L98 78 H2 L12 50Z'],
    circle: ['Círculo', 'M50 3 A47 47 0 1 1 49.9 3Z'],
    rect: ['Rectángulo', 'M3 3 H97 V97 H3Z'],
    rrect: ['Redondeado', 'M20 3 H80 A17 17 0 0 1 97 20 V80 A17 17 0 0 1 80 97 H20 A17 17 0 0 1 3 80 V20 A17 17 0 0 1 20 3Z'],
    ring: ['Anillo', 'M50 5 A45 45 0 1 1 49.9 5Z'],
    flower: ['Flor', flower(6, 40, .62)],
    flower5: ['Flor 5 pétalos', flower(5, 41, .7)],
    scallop: ['Sello festoneado', scallop(16, 40, 9)],
    sun: ['Sol', burst(24, 49, 33)],
    cloud: ['Nube', 'M20 74a17 17 0 0 1 2-33 23 23 0 0 1 44-7 19 19 0 0 1 14 40Z'],
    leaf: ['Hoja', 'M50 3C84 28 88 70 50 97 12 70 16 28 50 3Z'],
    drop: ['Gota', 'M50 4C50 4 18 44 18 64a32 32 0 0 0 64 0C82 44 50 4 50 4Z'],
    laurel: ['Corona de laurel', laurel()],
    ticket: ['Boleto', 'M0 8H100V38A9 9 0 0 0 100 62V92H0V62A9 9 0 0 0 0 38Z'],
    tag: ['Etiqueta', 'M10 20H70L96 50 70 80H10Q2 80 2 72V28Q2 20 10 20Z'],
    bevel: ['Marco biselado', 'M14 2H86L98 14V86L86 98H14L2 86V14Z'],
    oval: ['Óvalo', 'M50 8A46 42 0 1 1 49.9 8Z'],
    flourish: ['Adorno', 'M0 8H20C26 8 28 3 33 3 38 3 40 8 43 8M100 8H80C74 8 72 3 67 3 62 3 60 8 57 8M50 3L55 8 50 13 45 8Z', [100, 16], 1.4],
    wave: ['Ola', 'M0 7Q6.25 -1 12.5 7T25 7 37.5 7 50 7 62.5 7 75 7 87.5 7 100 7', [100, 14], 1.8],
    zigzag: ['Zigzag', zig(12, 100, 2, 12), [100, 14], 1.8],
    line: ['Línea', 'M0 0H100V100H0Z'],
  };
  const IMG_SHAPES = ['rect', 'rrect', 'circle', 'arch', 'heart', 'star', 'burst', 'blob', 'diamond', 'sparkle', 'flower', 'scallop', 'cloud', 'leaf', 'drop', 'oval', 'bevel', 'moon'];
  const STROKE_KINDS = ['ring', 'flourish', 'wave', 'zigzag'];
  const PATTERNS = {
    dots: ['Lunares', (c) => `<circle cx='10' cy='10' r='3.4' fill='${c}'/><circle cx='30' cy='30' r='3.4' fill='${c}'/>`],
    stripes: ['Rayas', (c) => `<path d='M-4 4L4 -4M0 40L40 0M36 44L44 36' stroke='${c}' stroke-width='5' fill='none'/>`],
    grid: ['Cuadrícula', (c) => `<path d='M0 0H40V40' stroke='${c}' stroke-width='1.6' fill='none'/>`],
    hearts: ['Corazones', (c) => `<path transform='translate(4 4) scale(.7)' d='M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z' fill='${c}'/><path transform='translate(24 24) scale(.7)' d='M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z' fill='${c}'/>`],
    stars: ['Estrellas', (c) => `<path transform='translate(2 2) scale(.7)' d='M12 2l3 7 7 .3-5.5 4.7 1.7 7L12 17l-6.2 4 1.7-7L2 9.3 9 9z' fill='${c}'/><path transform='translate(24 24) scale(.55)' d='M12 2l3 7 7 .3-5.5 4.7 1.7 7L12 17l-6.2 4 1.7-7L2 9.3 9 9z' fill='${c}'/>`],
    diamonds: ['Rombos', (c) => `<path d='M20 5L35 20L20 35L5 20Z' fill='none' stroke='${c}' stroke-width='2'/>`],
    confetti: ['Confeti', (c) => `<rect x='6' y='8' width='9' height='3.5' rx='1' fill='${c}' transform='rotate(25 10 10)'/><circle cx='30' cy='9' r='2.4' fill='${c}'/><rect x='25' y='28' width='8' height='3.5' rx='1' fill='${c}' transform='rotate(-35 29 30)'/><circle cx='9' cy='31' r='2.4' fill='${c}'/>`],
    floral: ['Florecitas', (c) => `<g fill='${c}'><circle cx='10' cy='6.5' r='2.4'/><circle cx='13.5' cy='9' r='2.4'/><circle cx='12.2' cy='13' r='2.4'/><circle cx='7.8' cy='13' r='2.4'/><circle cx='6.5' cy='9' r='2.4'/></g><circle cx='10' cy='10' r='1.5' fill='#fff'/><g fill='${c}'><circle cx='30' cy='26.5' r='2.4'/><circle cx='33.5' cy='29' r='2.4'/><circle cx='32.2' cy='33' r='2.4'/><circle cx='27.8' cy='33' r='2.4'/><circle cx='26.5' cy='29' r='2.4'/></g><circle cx='30' cy='30' r='1.5' fill='#fff'/>`],
    scales: ['Escamas', (c) => `<path d='M0 20A20 20 0 0 1 40 20M-20 40A20 20 0 0 1 20 40M20 40A20 20 0 0 1 60 40' stroke='${c}' stroke-width='1.6' fill='none'/>`],
    deco: ['Art déco', (c) => `<g fill='none' stroke='${c}' stroke-width='1.4'><path d='M0 40A20 20 0 0 1 40 40M5 40A15 15 0 0 1 35 40M10 40A10 10 0 0 1 30 40'/><path d='M0 20A20 20 0 0 0 20 0M0 15A15 15 0 0 0 15 0M0 10A10 10 0 0 0 10 0'/><path d='M40 20A20 20 0 0 1 20 0M40 15A15 15 0 0 1 25 0M40 10A10 10 0 0 1 30 0'/></g>`],
    snow: ['Copos', (c) => `<g stroke='${c}' stroke-width='1.6' stroke-linecap='round'><path d='M10 4V16M4.8 7L15.2 13M4.8 13L15.2 7M30 24V36M24.8 27L35.2 33M24.8 33L35.2 27'/></g>`],
    plus: ['Cruces', (c) => `<path d='M10 6V14M6 10H14M30 26V34M26 30H34' stroke='${c}' stroke-width='2' stroke-linecap='round'/>`],
    ruled: ['Cuaderno', (c) => `<path d='M0 39H40' stroke='${c}' stroke-width='1.4'/>`],
    waves: ['Olas', (c) => `<path d='M0 20Q10 8 20 20T40 20' stroke='${c}' stroke-width='2.2' fill='none'/>`],
    checks: ['Ajedrez', (c) => `<rect width='20' height='20' fill='${c}'/><rect x='20' y='20' width='20' height='20' fill='${c}'/>`],
  };
  const svgUrl = (svg) => `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`; // comillas simples: va dentro de style="…"
  const patUrl = (id, c) => { const p = PATTERNS[id]; return p ? svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>${p[1](c)}</svg>`) : 'none'; };
  const lit = (freq, oct, ss, az) => `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='p' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' seed='7' stitchTiles='stitch' result='t'/><feDiffuseLighting in='t' lighting-color='#fff' surfaceScale='${ss}'><feDistantLight azimuth='${az}' elevation='62'/></feDiffuseLighting></filter><rect width='100%' height='100%' filter='url(#p)'/></svg>`;
  const TEXTURES = {
    paper: ['Papel', lit('.6', 5, 0.7, 45)],
    linen: ['Lino', lit('.9 .04', 3, 0.9, 40)],
    kraft: ['Kraft', lit('.05 .7', 4, 0.8, 60)],
    board: ['Cartulina', lit('.12', 5, 1.2, 50)],
    canvas: ['Lienzo', lit('.35 .35', 2, 0.9, 35)],
  };
  const texUrl = (id) => svgUrl(TEXTURES[id][1]);
  const FRAMES = { none: 'Sin marco', line: 'Línea', double: 'Doble', gold: 'Dorado brillante', stitch: 'Costura', dots: 'Puntos', ornate: 'Ornamental' };
  const SHADOWS = { none: 'Ninguna', soft: 'Suave', emboss: 'Relieve', glow: 'Resplandor', outline: 'Contorno', retro: 'Retro 3D' };

  /* ───────── fondos listos ───────── */
  const P = (c1, c2, o) => Object.assign({ kind: 'gradient', c1, c2, angle: 160, tex: 'paper', texAmt: 55, pattern: 'none', pc: '#ffffff', pa: 18, ps: 1 }, o || {});
  const BG_PRESETS = [
    ['Crema', P('#fbf3e0', '#ecdcb6')], ['Pergamino', P('#f3e2b3', '#d6b87a', { angle: 140, texAmt: 75 })], ['Kraft', P('#c8a06a', '#b08650', { tex: 'kraft', texAmt: 80 })],
    ['Blanco roto', P('#fbfaf6', '#f1ede4', { texAmt: 40 })], ['Negro mate', P('#17141c', '#0b0a0e', { tex: 'board', texAmt: 40 })], ['Rosa suave', P('#ffe3ea', '#fbc4d4')],
    ['Cielo', P('#d9ecff', '#a9d0f5', { tex: 'none' })], ['Salvia', P('#dfe9d6', '#b9cba8', { tex: 'linen', texAmt: 60 })], ['Burdeos', P('#7a1f2b', '#4a0f19', { tex: 'linen', texAmt: 50 })],
    ['Noche', P('#1b1a4a', '#0a0a24', { kind: 'radial', tex: 'none' })], ['Atardecer', P('#ff9a76', '#6a3093', { angle: 180, tex: 'none' })], ['Galaxia', P('#3a2c7a', '#0b0720', { kind: 'radial', tex: 'none' })],
    ['Menta', P('#d4f5e9', '#9fe0c9', { tex: 'none' })], ['Durazno', P('#ffe2c6', '#ffb88c', { tex: 'paper' })], ['Lavanda', P('#e6dcff', '#b9a4ef', { tex: 'none' })],
    ['Oro viejo', P('#e9cf8a', '#a9822c', { kind: 'radial', texAmt: 70 })],
  ].map((x) => ({ n: x[0], bg: x[1] }));

  /* ───────── capas: valores por defecto ───────── */
  function newLayer(t, o) {
    const base = { id: uid(), t, x: 50, y: 50, w: 40, r: 0, op: 100 };
    const D = {
      text: { w: 80, text: 'Escribe aquí', bind: '', font: 'Playfair Display', size: 8, color: '#3b2a20', fill: 'solid', b: 0, i: 0, up: 0, al: 'center', ls: 0, lh: 1.15, sh: 'none', sc: '#000000', curve: 0 },
      image: { w: 55, ar: 1, src: '', shape: 'rrect', border: 'none', bc: '#ffffff', filter: 'none', zoom: 1, px: 50, py: 50, cap: '', shd: 1, ph: '' },
      shape: { w: 30, ar: 1, kind: 'heart', fm: 'solid', fill: '#e11d48', fill2: '#fb7185', stroke: '#ffffff', sw: 0, shd: 0, hollow: 0, blur: 0 },
      emoji: { w: 18, e: '❤️', stick: 0, shd: 1 },
      seal: { w: 20, color: '#9b1c2e', glyph: '❤', gc: '', ring: 1 },
      tape: { w: 30, ar: 3.4, color: '#f7c6d9', pat: 'stripes', r: -8 },
      qr: { w: 26, shd: 1 },
    };
    return Object.assign(base, D[t] || {}, o || {});
  }
  function emptyFace(bg) {
    return { bg: Object.assign({}, bg || BG_PRESETS[0].bg), frame: { style: 'none', color: '#c9a24b', w: 1, inset: 3 }, fx: { vig: 0, vc: '#3a2410', gloss: 0 }, layers: [] };
  }
  const newData = () => ({ v: 2, ratio: 'portrait', radius: 4, env: { on: 0, color: '#e8d9b5', seal: '#9b1c2e', glyph: '❤' }, fx: { particles: '', mode: 'fall' }, front: emptyFace(), back: null });

  /* ───────── carta antigua (v1) → v2 ───────── */
  function migrate(d) {
    d = d || {};
    if (d.v === 2) return d;
    const out = newData();
    const bg1 = hex(d.bg1, '#4c1d95'), bg2 = hex(d.bg2, '#be185d'), ac = hex(d.accent, '#fbbf24');
    out.front.bg = { kind: 'gradient', c1: bg1, c2: bg2, angle: 160, tex: 'none', texAmt: 0, pattern: 'none', pc: '#fff', pa: 10, ps: 1 };
    out.front.frame = { style: 'line', color: ac, w: 1.1, inset: 1.5 };
    out.radius = 5;
    const L = out.front.layers;
    L.push(newLayer('text', { text: '', bind: 'name', font: 'Fredoka', size: 7, color: '#ffffff', x: d.emoji ? 42 : 50, y: 7.5, w: 74, al: 'left', b: 1 }));
    if (d.emoji) L.push(newLayer('emoji', { e: d.emoji, x: 89, y: 7.5, w: 10, shd: 0 }));
    const img = safeImg(d.image);
    L.push(img ? newLayer('image', { src: img, x: 50, y: 37, w: 86, ar: 86 / 50, shape: 'rrect', shd: 0 })
      : newLayer('shape', { kind: 'rrect', fill: '#000000', op: 25, x: 50, y: 37, w: 86, ar: 86 / 50 }));
    if (!img) L.push(newLayer('emoji', { e: d.emoji || '✨', x: 50, y: 37, w: 36, shd: 0 }));
    if (d.type) {
      L.push(newLayer('shape', { kind: 'rrect', fill: ac, x: 28, y: 65.5, w: 40, ar: 40 / 5.5 }));
      L.push(newLayer('text', { text: d.type, font: 'DM Sans', b: 1, size: 3.6, color: '#17102e', x: 28, y: 65.5, w: 38 }));
    }
    if (d.desc) {
      L.push(newLayer('shape', { kind: 'rrect', fill: '#000000', op: 30, x: 50, y: 77, w: 86, ar: 86 / 18 }));
      L.push(newLayer('text', { text: d.desc, font: 'DM Sans', size: 3.6, color: '#ffffff', x: 50, y: 77, w: 80, al: 'left', lh: 1.3 }));
    }
    (d.stats || []).filter((s) => s && (s.label || s.value)).slice(0, 3).forEach((s, i, a) => {
      const x = 50 + (i - (a.length - 1) / 2) * 29;
      L.push(newLayer('shape', { kind: 'rrect', fill: '#000000', op: 35, x, y: 91, w: 26, ar: 26 / 11 }));
      L.push(newLayer('text', { text: String(s.value || ''), font: 'Fredoka', b: 1, size: 5, color: ac, x, y: 89.5, w: 24 }));
      L.push(newLayer('text', { text: String(s.label || ''), font: 'DM Sans', size: 2.6, color: '#ffffff', x, y: 93.6, w: 24 }));
    });
    return out;
  }
  const norm = (d) => (d && d.v === 2 ? d : migrate(d));

  /* ───────── dibujo ───────── */
  let gid = 0;
  function bgHtml(b) {
    b = b || {};
    const kind = pick(b.kind, ['color', 'gradient', 'radial', 'image'], 'color');
    const c1 = hex(b.c1, '#f6ecd6'), c2 = hex(b.c2, c1), ang = N(b.angle, 160, 0, 360);
    let s = `background:${c1}`;
    if (kind === 'gradient') s = `background:linear-gradient(${ang}deg,${c1},${c2})`;
    else if (kind === 'radial') s = `background:radial-gradient(circle at 50% 38%,${c1},${c2} 85%)`;
    else if (kind === 'image' && safeImg(b.img)) s = `background:${c1} url('${safeImg(b.img)}') center/cover`;
    let h = `<div class="cv-bg" style="${s}"></div>`;
    const shadeV = N(b.shade, 0, -80, 80);
    if (kind === 'image' && shadeV) h += `<div class="cv-bg" style="background:${shadeV > 0 ? '#000' : '#fff'};opacity:${Math.abs(shadeV) / 100}"></div>`;
    if (b.pattern && PATTERNS[b.pattern]) {
      const ps = N(b.ps, 1, .3, 3);
      h += `<div class="cv-bg" style="background-image:${patUrl(b.pattern, hex(b.pc, '#ffffff'))};background-size:${em(10 * ps)};opacity:${N(b.pa, 18, 0, 100) / 100}"></div>`;
    }
    return h;
  }
  function texHtml(b) {
    b = b || {};
    if (!b.tex || !TEXTURES[b.tex]) return '';
    return `<div class="cv-tex" style="background-image:${texUrl(b.tex)};background-size:${em(60)};opacity:${(N(b.texAmt, 50, 0, 100) / 100 * 0.7).toFixed(3)}"></div>`;
  }
  const CORNER = `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="2.4" d="M3 44 V14 Q3 3 14 3 H44"/><path stroke-width="1.6" d="M10 34 V17 Q10 10 17 10 H34"/><path stroke-width="1.8" d="M17 30 Q17 17 30 17"/><circle cx="3" cy="3" r="3.2" fill="currentColor" stroke="none"/><circle cx="46" cy="3" r="1.6" fill="currentColor" stroke="none"/><circle cx="3" cy="46" r="1.6" fill="currentColor" stroke="none"/></svg>`;
  function frameHtml(fr) {
    fr = fr || {};
    const st = pick(fr.style, Object.keys(FRAMES), 'none');
    if (st === 'none') return '';
    const c = hex(fr.color, '#c9a24b'), w = N(fr.w, 1, .3, 6), ins = N(fr.inset, 3, 0, 12);
    const bs = { line: 'solid', double: 'double', stitch: 'dashed', dots: 'dotted', ornate: 'solid' }[st];
    const wv = st === 'double' ? Math.max(w, 1.2) : st === 'ornate' ? Math.min(w, 1.2) * .5 : w;
    const cls = st === 'gold' ? 'fr-gold' : 'fr-b';
    const corners = st === 'ornate' ? ['c1', 'c2', 'c3', 'c4'].map((k) => `<i class="co ${k}">${CORNER}</i>`).join('') : '';
    return `<div class="cv-frame ${cls}" style="--fc:${c};--fw:${em(wv)};--fi:${em(ins)};--fs:${bs || 'solid'};--fg:${foilCss('gold')}">${corners}</div>`;
  }

  function fillSvg(l, id) {
    const fm = pick(l.fm, ['solid', 'grad', 'gold', 'silver', 'rose', 'holo'], 'solid');
    const c1 = hex(l.fill, '#e11d48');
    if (fm === 'solid') return { defs: '', fill: c1 };
    const stops = fm === 'grad' ? [[0, c1], [1, hex(l.fill2, '#fb7185')]] : FOILS[fm];
    return { defs: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('')}</linearGradient>`, fill: `url(#${id})` };
  }
  function shapeInner(l) {
    const k = pick(l.kind, Object.keys(SHAPES), 'rect'), ent = SHAPES[k], vb = ent[2] || [100, 100];
    const id = 'g' + (++gid), f = fillSvg(l, id), sw = N(l.sw, 0, 0, 14);
    const stroke = hex(l.stroke, '#ffffff');
    const hol = STROKE_KINDS.includes(k) || !!l.hollow;
    const fill = hol ? 'none' : f.fill;
    const swv = hol ? (sw > 0 ? sw : (ent[3] || (k === 'ring' ? 6 : 3))) : k === 'line' ? 0 : sw;
    const strk = hol ? f.fill : stroke;
    return `<svg viewBox="0 0 ${vb[0]} ${vb[1]}" preserveAspectRatio="${ent[2] ? 'xMidYMid meet' : 'none'}" style="width:100%;height:100%;display:block;overflow:visible"><defs>${f.defs}</defs><path d="${ent[1]}" fill="${fill}" stroke="${swv ? strk : 'none'}" stroke-width="${swv}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  function textInner(l, name) {
    const raw = l.bind === 'name' ? (name || 'Nombre de la carta') : String(l.text == null ? '' : l.text);
    const size = N(l.size, 8, 1, 80), c = hex(l.color, '#3b2a20'), sc = hex(l.sc, '#000000');
    const fill = pick(l.fill, ['solid', 'gold', 'silver', 'rose', 'holo'], 'solid');
    const sh = pick(l.sh, Object.keys(SHADOWS), 'none');
    let st = `font-family:${fontCss(l.font)};font-size:${em(size)};font-weight:${l.b ? 700 : 400};font-style:${l.i ? 'italic' : 'normal'};text-transform:${l.up ? 'uppercase' : 'none'};text-align:${pick(l.al, ['left', 'center', 'right'], 'center')};letter-spacing:${N(l.ls, 0, -.1, 1).toFixed(3)}em;line-height:${N(l.lh, 1.15, .7, 2.5)};`;
    const filt = [];
    if (fill === 'solid') st += `color:${c};`;
    else st += `background-image:${foilCss(fill)};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;`;
    if (sh === 'soft') filt.push(`drop-shadow(0 .05em .1em ${sc}80)`);
    else if (sh === 'glow') filt.push(`drop-shadow(0 0 .12em ${fill === 'solid' ? c : sc})`, `drop-shadow(0 0 .3em ${fill === 'solid' ? c : sc})`);
    else if (sh === 'retro') filt.push(`drop-shadow(.04em .04em 0 ${sc})`, `drop-shadow(.08em .08em 0 ${sc})`);
    else if (sh === 'emboss') st += fill === 'solid' ? `text-shadow:0 .03em 0 rgba(255,255,255,.55),0 -.03em 0 rgba(0,0,0,.35);` : '';
    else if (sh === 'outline' && fill === 'solid') st += `-webkit-text-stroke:.04em ${sc};paint-order:stroke fill;`;
    if (filt.length) st += `filter:${filt.join(' ')};`;
    const curve = N(l.curve, 0, -100, 100), w = N(l.w, 80, 1, 200);
    if (curve) {
      const y0 = curve > 0 ? 165 : 40, d = `M 14 ${y0} Q 200 ${y0 - curve * 2.4} 386 ${y0}`, pid = 'p' + (++gid);
      const fs = size * 400 / w;
      const grad = fill === 'solid' ? `fill:${c};` : `fill:url(#f${pid});`;
      const defs = fill === 'solid' ? '' : `<linearGradient id="f${pid}" x1="0" y1="0" x2="1" y2="0">${FOILS[fill].map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('')}</linearGradient>`;
      return `<svg viewBox="0 0 400 200" style="width:100%;height:100%;display:block;overflow:visible;${filt.length ? `filter:${filt.join(' ')};` : ''}"><defs>${defs}<path id="${pid}" d="${d}"/></defs><text style="font-family:${fontCss(l.font)};font-size:${fs.toFixed(1)}px;font-weight:${l.b ? 700 : 400};font-style:${l.i ? 'italic' : 'normal'};letter-spacing:${N(l.ls, 0, -.1, 1)}em;${grad}${sh === 'outline' ? `stroke:${sc};stroke-width:${(fs * .04).toFixed(2)}px;paint-order:stroke fill;` : ''}" text-anchor="middle"><textPath href="#${pid}" startOffset="50%">${esc((l.up ? raw.toUpperCase() : raw).replace(/\n/g, ' '))}</textPath></text></svg>`;
    }
    return `<div class="tx" style="${st}">${esc(raw) || '&nbsp;'}</div>`;
  }
  function imageInner(l, o) {
    const src = safeImg(l.src), shape = pick(l.shape, IMG_SHAPES, 'rrect');
    const border = pick(l.border, ['none', 'white', 'polaroid', 'gold', 'tape', 'shadow'], 'none');
    const flt = FILTERS[pick(l.filter, Object.keys(FILTERS), 'none')][1];
    const zoom = N(l.zoom, 1, 1, 4), px = N(l.px, 50, 0, 100), py = N(l.py, 50, 0, 100);
    const inner = src
      ? `<img src="${src}" alt="" draggable="false" style="object-position:${px}% ${py}%;transform:scale(${zoom});transform-origin:${px}% ${py}%;${flt ? `filter:${flt};` : ''}">`
      : (o.edit ? `<div class="im-ph"><b>${l.ph ? esc(l.ph) : '📷'}</b><span>Toca para elegir una foto</span></div>` : (l.ph ? `<div class="im-fb"><span style="font-size:${em(N(l.w, 55, 1, 200) * .42)}">${esc(l.ph)}</span></div>` : ''));
    const clip = shape === 'rect' ? '' : shape === 'rrect' ? 'border-radius:8%;' : shape === 'circle' ? 'border-radius:50%;' : `clip-path:url(#cvc-${shape});`;
    const framed = border !== 'none' && border !== 'shadow' && (shape === 'rect' || shape === 'rrect');
    if (!framed) return `<div class="im-i" style="${clip}">${inner}</div>`;
    const w = N(l.w, 55, 1, 200), pd = Math.max(1.2, w * .045);
    const bc = border === 'gold' ? '' : `background:${hex(l.bc, '#ffffff')};`;
    const pad = border === 'polaroid' ? `padding:${em(pd)} ${em(pd)} ${em(pd * 3.2)};` : `padding:${em(pd)};`;
    const cap = border === 'polaroid' ? `<div class="im-cap" style="font-size:${em(Math.max(2.4, pd * 2.1))};bottom:${em(pd * .4)};height:${em(pd * 2.8)}">${esc(l.cap || '')}</div>` : '';
    const tapes = border === 'tape' ? `<i class="im-tp t1" style="background:${hex(l.bc, '#f7c6d9')}"></i><i class="im-tp t2" style="background:${hex(l.bc, '#f7c6d9')}"></i>` : '';
    return `<div class="im-f ${border === 'gold' ? 'gold' : ''}" style="${bc}${pad}${border === 'gold' ? `background-image:${foilCss('gold')};` : ''}${border === 'tape' ? `padding:${em(pd * .8)};background:#fff;` : ''}"><div class="im-i" style="${clip}">${inner}</div>${cap}${tapes}</div>`;
  }
  function sealInner(l) {
    const c = hex(l.color, '#9b1c2e'), gc = hex(l.gc, '') || shade(c, -.22);
    return `<div class="sl" style="--sl:${c};--sl2:${shade(c, .35)};--sl3:${shade(c, -.38)}"><span class="sl-in ${l.ring ? 'ring' : ''}"></span><span class="sl-g" style="color:${gc}">${esc(Array.from(String(l.glyph || '')).slice(0, 3).join(''))}</span></div>`;
  }
  function tapeInner(l) {
    const c = hex(l.color, '#f7c6d9'), p = pick(l.pat, ['plain', 'stripes', 'dots', 'check'], 'stripes');
    const w = 'rgba(255,255,255,.55)';
    const pat = p === 'stripes' ? `repeating-linear-gradient(45deg,${w} 0 .45em,transparent .45em .9em)` : p === 'dots' ? `radial-gradient(${w} 22%,transparent 24%) 0 0/.8em .8em` : p === 'check' ? `conic-gradient(${w} 25%,transparent 0 50%,${w} 0 75%,transparent 0) 0 0/1em 1em` : 'none';
    return `<div class="tp" style="background:${pat},linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0) 45%,rgba(0,0,0,.08)),${c}"></div>`;
  }

  function qrAspect(o) {
    const q = o.qr || {};
    const cap = q.captionMode === 'none' ? '' : q.captionMode === 'custom' ? (q.captionText || '') : (o.name || '');
    return cap ? 1 / 1.15 : 1;
  }
  function layerHtml(l, d, name, o) {
    const t = l.t, w = N(l.w, 30, 1, 200), x = N(l.x, 50, -60, 160), y = N(l.y, 50, -60, 160), r = N(l.r, 0, -360, 360), op = N(l.op, 100, 0, 100) / 100;
    let inner = '', extra = '', filt = '';
    if (t === 'text') inner = textInner(l, name);
    else if (t === 'image') {
      const ar = N(l.ar, 1, .1, 10); extra = `aspect-ratio:${ar};`;
      inner = imageInner(l, o);
      if (l.shd !== 0 && l.shd !== false) filt = 'drop-shadow(0 .1em .22em rgba(0,0,0,.4))';
      if (!safeImg(l.src) && !o.edit && !l.ph) return '';
    } else if (t === 'shape') {
      extra = `aspect-ratio:${l.kind === 'line' ? (100 / N(l.sw, 1.5, .4, 12)).toFixed(2) : N(l.ar, 1, .05, 20)};`; inner = shapeInner(l);
      if (l.shd) filt = 'drop-shadow(0 .1em .2em rgba(0,0,0,.4))';
      if (N(l.blur, 0, 0, 20)) filt = (filt ? filt + ' ' : '') + `blur(${em(N(l.blur, 0, 0, 20))})`;
    } else if (t === 'emoji') {
      extra = 'aspect-ratio:1;';
      const s = l.stick ? ['.035em 0', '-.035em 0', '0 .035em', '0 -.035em', '.03em .03em', '-.03em -.03em', '.03em -.03em', '-.03em .03em'].map((v) => `drop-shadow(${v} 0 #fff)`).join(' ') : '';
      inner = `<div class="em" style="font-size:${(w * .8 / 10).toFixed(3)}em;${s ? `filter:${s};` : ''}">${esc(l.e || '✨')}</div>`;
      if (l.shd) filt = 'drop-shadow(0 .08em .12em rgba(0,0,0,.35))';
    } else if (t === 'seal') {
      extra = 'aspect-ratio:1;'; inner = sealInner(l); filt = 'drop-shadow(0 .12em .18em rgba(0,0,0,.45))';
    } else if (t === 'tape') {
      extra = `aspect-ratio:${N(l.ar, 3.4, .5, 12)};`; inner = tapeInner(l); filt = 'drop-shadow(0 .05em .08em rgba(0,0,0,.25))';
    } else if (t === 'qr') {
      const src = o.qrSrc || PX;
      inner = `<img class="qi" data-qr="1" src="${src}" alt="Código QR" draggable="false" style="aspect-ratio:${qrAspect(o)}">`;
      if (l.shd !== 0 && l.shd !== false) filt = 'drop-shadow(0 .1em .22em rgba(0,0,0,.35))';
    } else return '';
    const flip = l.fl ? 'scaleX(-1)' : '';
    return `<div class="ly ly-${t}${l.lock ? ' lk' : ''}" data-id="${esc(l.id)}" style="left:${x}%;top:${y}%;width:${em(w)};transform:translate(-50%,-50%) rotate(${r}deg);${op < 1 ? `opacity:${op};` : ''}${extra}"><div class="ly-c" style="${flip ? `transform:${flip};` : ''}${filt ? `filter:${filt};` : ''}">${inner}</div></div>`;
  }

  function faceHtml(name, data, o) {
    o = o || {};
    const d = norm(data);
    const f = (o.side === 'back' && d.back ? d.back : d.front) || emptyFace();
    const fx = f.fx || {};
    const oo = Object.assign({}, o, { name });
    const layers = (f.layers || []).filter((l) => l && typeof l === 'object' && !l.hide).map((l) => layerHtml(l, d, name, oo)).join('');
    const vig = N(fx.vig, 0, 0, 100);
    return bgHtml(f.bg) + `<div class="cv-layers">${layers}</div>` + texHtml(f.bg) + frameHtml(f.frame)
      + (vig ? `<div class="cv-vig" style="opacity:${vig / 100};--vc:${hex(fx.vc, '#3a2410')}"></div>` : '')
      + (fx.gloss ? '<div class="cv-gloss"></div>' : '');
  }
  function html(name, data, o) {
    o = o || {};
    const d = norm(data);
    const rt = RATIOS[pick(d.ratio, Object.keys(RATIOS), 'portrait')];
    const side = o.side === 'back' && d.back ? 'back' : 'front';
    return `<div class="tcard${o.cls ? ' ' + o.cls : ''}" data-side="${side}" style="--rad:${N(d.radius, 4, 0, 14)};aspect-ratio:${rt[0]}/${rt[1]}">${faceHtml(name, d, Object.assign({}, o, { side }))}</div>`;
  }
  const ratioOf = (data) => { const d = norm(data), r = RATIOS[pick(d.ratio, Object.keys(RATIOS), 'portrait')]; return r[0] / r[1]; };
  const hasBack = (data) => !!norm(data).back;
  const findQR = (data) => { const d = norm(data); for (const s of ['front', 'back']) { const l = ((d[s] || {}).layers || []).find((x) => x && x.t === 'qr'); if (l) return { side: s, layer: l }; } return null; };

  /* ───────── QR dentro de la carta ───────── */
  const qrOptions = (c) => {
    const o = Object.assign({}, window.QRStyle ? QRStyle.DEF : {}, c.qr || {});
    o.caption = o.captionMode === 'name' ? c.name : o.captionMode === 'custom' ? (o.captionText || '') : '';
    return o;
  };
  const qrCache = new Map();
  function qrSrc(url, opts) {
    const key = url + '|' + JSON.stringify(opts);
    if (!qrCache.has(key)) {
      if (qrCache.size > 80) qrCache.delete(qrCache.keys().next().value);
      qrCache.set(key, (async () => { const cv = document.createElement('canvas'); await QRStyle.render(cv, url, Object.assign({}, opts, { size: 600 })); return cv.toDataURL('image/png'); })());
    }
    return qrCache.get(key);
  }
  const qrOpt = (c) => ({ name: c.name, qr: c.qr });
  async function hydrate(root, card, url) {
    const imgs = [...root.querySelectorAll('img[data-qr]')];
    if (!imgs.length || !window.QRStyle) return;
    try {
      const src = await qrSrc(url, qrOptions(card));
      imgs.forEach((i) => { if (i.isConnected) i.src = src; });
    } catch (e) { /* sin QR */ }
  }

  /* recortes (clipPath) para las fotos con forma */
  function injectDefs() {
    if (document.getElementById('cv-defs') || !document.body) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.id = 'cv-defs'; s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    s.innerHTML = '<defs>' + IMG_SHAPES.filter((k) => k !== 'rect' && k !== 'rrect' && k !== 'circle').map((k) => `<clipPath id="cvc-${k}" clipPathUnits="objectBoundingBox"><path transform="scale(.01)" d="${SHAPES[k][1]}"/></clipPath>`).join('') + '</defs>';
    document.body.appendChild(s);
  }
  if (document.body) injectDefs(); else document.addEventListener('DOMContentLoaded', injectDefs);


  /* ───────── exportar la carta como imagen (PNG) ─────────
     Se dibuja el mismo HTML dentro de un SVG (foreignObject), con las tipografías incrustadas,
     y se pasa a un canvas. Todo ocurre en el navegador de quien abre la carta. */
  let cssP = null, fontP = {};
  const b64 = (buf) => { let s = '', a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  function baseCss() {
    if (!cssP) cssP = fetch('/cards.css').then((r) => (r.ok ? r.text() : '')).catch(() => '');
    return cssP;
  }
  async function fontFaces(families) {
    const link = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
    if (!link) return '';
    const key = families.slice().sort().join('|');
    if (!fontP[key]) {
      fontP[key] = (async () => {
        let css = '';
        try { css = await (await fetch(link.href)).text(); } catch (e) { return ''; }
        const blocks = [];
        css.replace(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g, (m, sub, body) => {
          const fam = (/font-family:\s*'([^']+)'/.exec(body) || [])[1];
          if ((sub === 'latin' || sub === 'latin-ext') && families.includes(fam)) blocks.push(body);
          return m;
        });
        const out = await Promise.all(blocks.map(async (body) => {
          const u = /url\((https:[^)]+)\)/.exec(body);
          if (!u) return '';
          try {
            const buf = await (await fetch(u[1])).arrayBuffer();
            return '@font-face{' + body.replace(u[0], `url(data:font/woff2;base64,${b64(buf)})`) + '}';
          } catch (e) { return ''; }
        }));
        return out.join('\n');
      })();
    }
    return fontP[key];
  }
  const DEFS_SVG = () => { const d = document.getElementById('cv-defs'); return d ? new XMLSerializer().serializeToString(d) : ''; };
  async function toPNG(name, data, o) {
    o = o || {};
    const W = o.width || 1200, rt = ratioOf(data), H = Math.round(W / rt);
    const card = html(name, data, { side: o.side, qrSrc: o.qrSrc, qr: o.qr });
    const fams = FONTS.map((f) => f.id).filter((id) => card.includes(id));
    if (card.includes('im-cap') && !fams.includes('Caveat')) fams.push('Caveat');
    if (card.includes('sl-g') && !fams.includes('Playfair Display')) fams.push('Playfair Display');
    if (!fams.includes('DM Sans')) fams.push('DM Sans');
    const [css, faces] = await Promise.all([baseCss(), fontFaces(fams)]);
    // las tipografías pueden tardar en estar listas: se esperan antes de dibujar
    try { await Promise.all(fams.map((f) => document.fonts.load(`16px "${f}"`))); } catch (e) { /* sin red */ }
    const host = document.createElement('div');
    host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    host.style.cssText = `width:${W}px;height:${H}px;--cw:${W}px;--body:'DM Sans',system-ui,sans-serif;--display:'Fredoka','Trebuchet MS',sans-serif;`;
    host.innerHTML = '<style>' + faces + '\n' + css + '\n.tcard{box-shadow:none!important}</style>' + card;
    const xml = new XMLSerializer().serializeToString(host);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS_SVG()}<foreignObject x="0" y="0" width="${W}" height="${H}">${xml}</foreignObject></svg>`;
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = () => rej(new Error('No se pudo dibujar la carta')); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(im, 0, 0, W, H);
    return new Promise((res, rej) => {
      try { cv.toBlob((b) => (b ? res(b) : rej(new Error('El navegador no permite guardar la imagen'))), 'image/png'); } catch (e) { rej(e); }
    });
  }

  window.CardView = {
    esc, safeImg, hex, N, pick, uid, shade, em, PX,
    STROKE_KINDS, RATIOS, FONTS, FOILS, FOIL_NAMES, FILTERS, SHAPES, IMG_SHAPES, PATTERNS, TEXTURES, FRAMES, SHADOWS, BG_PRESETS,
    fontCss, foilCss, patUrl,
    newLayer, newData, emptyFace, migrate, norm, html, faceHtml, ratioOf, hasBack, findQR, bgHtml, texHtml, layerHtml,
    qrOptions, qrSrc, hydrate, qrOpt, toPNG,
  };
})();
