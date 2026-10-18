/* Diseños de partida para las cartas (todo se puede cambiar después).
   Medidas en % del ancho; "y" va en % del alto. */
(function () {
  'use strict';
  const NL = (t, o) => CardView.newLayer(t, o);
  const tx = (text, o) => NL('text', Object.assign({ text }, o));
  const nm = (o) => NL('text', Object.assign({ text: '', bind: 'name' }, o));
  const sh = (kind, o) => NL('shape', Object.assign({ kind }, o));
  const em = (e, o) => NL('emoji', Object.assign({ e }, o));
  const img = (o) => NL('image', o);
  const seal = (o) => NL('seal', o);
  const tape = (o) => NL('tape', o);
  const qr = (y, w, x, o) => NL('qr', Object.assign({ x: x == null ? 50 : x, y, w: w || 20 }, o || {}));
  const bg = (c1, c2, o) => Object.assign({ kind: 'gradient', c1, c2, angle: 160, tex: 'paper', texAmt: 55, pattern: '', pc: '#ffffff', pa: 18, ps: 1 }, o || {});
  const face = (b, frame, fx, layers) => ({ bg: b, frame: Object.assign({ style: 'none', color: '#c9a24b', w: 1, inset: 3 }, frame || {}), fx: Object.assign({ vig: 0, vc: '#3a2410', gloss: 0 }, fx || {}), layers });
  const card = (o) => Object.assign(CardView.newData(), o);
  const Q = (fg, fg2, bgc, frame, cap, font, o) => Object.assign({ fg, fg2, useGrad: fg !== fg2, bg: bgc, frameColor: frame, captionColor: cap, captionFont: font || '', dots: 'rounded', eye: 'rounded', eyeColor: '' }, o || {});
  const T = [];
  const add = (cat, n, qrs, make) => T.push({ cat, n, qr: qrs, make });

  /* ───────────── AMOR ───────────── */
  add('Amor', 'Carta de amor', Q('#5b1220', '#9b1c2e', '#fbf3e0', '#7a1f2b', '#fbf3e0', 'Great Vibes'), () => card({
    radius: 3, env: { on: 1, color: '#e8d9b5', seal: '#9b1c2e', glyph: '❤' },
    front: face(bg('#f8eed6', '#e7d1a1', { angle: 155, texAmt: 85 }), { style: 'ornate', color: '#9a7a3a', w: 1, inset: 3.4 }, { vig: 38, vc: '#8a5a1e' }, [
      tx('Para ti', { font: 'Great Vibes', size: 21, color: '#8f1d2c', y: 13, w: 86, sh: 'emboss' }),
      tx('❦', { font: 'Playfair Display', size: 8, color: '#b08d57', y: 22, w: 20 }),
      tx('Cada día a tu lado\nes mi capítulo favorito.\nGracias por existir.', { font: 'Cormorant Garamond', i: 1, size: 5.8, color: '#4a2b1f', y: 36, w: 74, lh: 1.5 }),
      tx('Siempre tuyo', { font: 'Great Vibes', size: 11, color: '#8f1d2c', y: 52, w: 70 }),
      em('🌹', { x: 20, y: 74, w: 15, r: -20 }), em('🌹', { x: 80, y: 74, w: 15, r: 20, fl: 1 }),
      seal({ x: 50, y: 66, w: 17, color: '#9b1c2e', glyph: '❤' }), qr(83, 21),
    ]),
    back: face(bg('#f8eed6', '#e7d1a1', { angle: 155, texAmt: 85, pattern: 'hearts', pc: '#9b1c2e', pa: 8, ps: 1.1 }), { style: 'ornate', color: '#9a7a3a', w: 1, inset: 3.4 }, { vig: 38, vc: '#8a5a1e' }, [
      seal({ x: 50, y: 30, w: 15, color: '#9b1c2e', glyph: '❤' }),
      nm({ font: 'Great Vibes', size: 14, color: '#8f1d2c', y: 46, w: 80, sh: 'emboss' }),
      tx('hecho con amor', { font: 'Cormorant Garamond', i: 1, size: 5, color: '#6a4a2a', y: 58, w: 70, ls: 0.12 }),
    ]),
  }));

  add('Amor', 'Rosas y vino', Q('#4a0d1d', '#9b1c2e', '#fff3dc', '#c9a24b', '#f4d77a', 'Cinzel'), () => card({
    radius: 4, env: { on: 1, color: '#6b1226', seal: '#c9a24b', glyph: '❤' }, fx: { particles: '🌹', mode: 'fall' },
    front: face(bg('#5c1024', '#2a0511', { angle: 165, tex: 'linen', texAmt: 55, pattern: 'floral', pc: '#c9a24b', pa: 9, ps: 1.3 }), { style: 'gold', color: '#c9a24b', w: 0.9, inset: 3 }, { vig: 40, vc: '#000000', gloss: 1 }, [
      sh('bevel', { fm: 'gold', hollow: 1, sw: 0.5, x: 50, y: 50, w: 88, ar: 88 / 126 }),
      sh('sparkle', { fm: 'gold', x: 50, y: 9, w: 7 }),
      tx('Te amo', { font: 'Great Vibes', size: 27, fill: 'gold', y: 19, w: 90, sh: 'soft', sc: '#000000' }),
      sh('flourish', { fm: 'gold', x: 50, y: 29, w: 48, ar: 6.25 }),
      sh('heart', { fm: 'gold', hollow: 1, sw: 1.4, x: 50, y: 49, w: 60 }),
      img({ shape: 'heart', x: 50, y: 49, w: 53.5, ar: 1, ph: '💖', shd: 0 }),
      em('🌹', { x: 13, y: 58, w: 15, r: -25 }), em('🌹', { x: 87, y: 58, w: 15, r: 25, fl: 1 }),
      tx('para siempre', { font: 'Cormorant Garamond', i: 1, size: 7, color: '#f2d6a2', y: 70, w: 80, ls: 0.1 }),
      nm({ font: 'Cinzel', size: 5.4, fill: 'gold', y: 76, w: 80, up: 1, ls: 0.2 }), qr(88, 18),
    ]),
    back: face(bg('#5c1024', '#2a0511', { angle: 165, tex: 'linen', texAmt: 55, pattern: 'floral', pc: '#c9a24b', pa: 12, ps: 1.3 }), { style: 'gold', color: '#c9a24b', w: 0.9, inset: 3 }, { vig: 40, vc: '#000000' }, [
      sh('laurel', { fm: 'gold', x: 50, y: 40, w: 74 }),
      em('🌹', { x: 50, y: 40, w: 26 }),
      tx('con todo mi corazón', { font: 'Great Vibes', size: 12, fill: 'gold', y: 64, w: 86 }),
    ]),
  }));

  add('Amor', 'Corazones pop', Q('#a3124f', '#ec4899', '#fff1f6', '#a3124f', '#ffffff', 'Pacifico', { dots: 'heart' }), () => card({
    radius: 6, fx: { particles: '💖', mode: 'rise' },
    front: face(bg('#ffd1e1', '#ff7eb3', { angle: 160, tex: '', pattern: 'hearts', pc: '#ffffff', pa: 34, ps: 1.2 }), { style: 'dots', color: '#ffffff', w: 0.9, inset: 3 }, { gloss: 1 }, [
      sh('heart', { fm: 'grad', fill: '#ff5c9a', fill2: '#c2185b', x: 50, y: 37, w: 74, shd: 1 }),
      img({ shape: 'heart', x: 50, y: 36.5, w: 60, ar: 1, ph: '💖', shd: 0 }),
      sh('sparkle', { fill: '#ffffff', x: 14, y: 14, w: 9 }), sh('sparkle', { fill: '#ffffff', x: 87, y: 10, w: 6 }), sh('sparkle', { fill: '#ffffff', x: 90, y: 56, w: 7 }), sh('sparkle', { fill: '#ffffff', x: 10, y: 52, w: 5 }),
      tx('Te quiero', { font: 'Pacifico', size: 15, color: '#ffffff', sh: 'retro', sc: '#a3124f', y: 67, w: 90 }),
      nm({ font: 'Caveat', b: 1, size: 10, color: '#ffffff', sh: 'soft', sc: '#7a0a3a', y: 76, w: 80 }), qr(89, 17),
    ]),
    back: face(bg('#ff9ec4', '#ff5c9a', { angle: 160, tex: '', pattern: 'hearts', pc: '#ffffff', pa: 34, ps: 1.2 }), { style: 'dots', color: '#ffffff', w: 0.9, inset: 3 }, {}, [
      em('💌', { x: 50, y: 40, w: 38, stick: 1 }),
      tx('Eres mi\npersona favorita', { font: 'Pacifico', size: 9, color: '#ffffff', sh: 'retro', sc: '#a3124f', y: 66, w: 86, lh: 1.25 }),
    ]),
  }));

  add('Amor', 'Aniversario', Q('#3b2a0c', '#a9822c', '#fff8e1', '#3b2a0c', '#f4d77a', 'Cinzel'), () => card({
    radius: 4, env: { on: 1, color: '#efe2bd', seal: '#b08d57', glyph: '∞' },
    front: face(bg('#fff8e8', '#ecd9a6', { kind: 'radial', tex: 'paper', texAmt: 75 }), { style: 'double', color: '#b08d57', w: 1.5, inset: 3.2 }, { vig: 30, vc: '#8a5a1e' }, [
      tx('feliz', { font: 'Cormorant Garamond', i: 1, size: 7, color: '#8a6516', y: 8, w: 60, ls: 0.25, up: 1 }),
      tx('Aniversario', { font: 'Great Vibes', size: 19, color: '#8a6516', y: 15, w: 92, sh: 'emboss' }),
      sh('laurel', { fm: 'gold', x: 50, y: 44, w: 80, shd: 1 }),
      img({ shape: 'circle', x: 50, y: 44, w: 42, ar: 1, ph: '💍', shd: 1 }),
      seal({ x: 18, y: 66, w: 12, color: '#b08d57', glyph: '∞' }),
      sh('flourish', { fm: 'gold', x: 50, y: 67, w: 46, ar: 6.25 }),
      tx('Nuestro amor sigue creciendo', { font: 'Cormorant Garamond', i: 1, size: 5.6, color: '#4a3a1a', y: 73, w: 76 }),
      nm({ font: 'Cinzel', size: 5, color: '#8a6516', b: 1, up: 1, ls: 0.2, y: 79, w: 80 }), qr(90, 17),
    ]),
    back: null,
  }));

  /* ───────────── BODA ───────────── */
  add('Boda', 'Invitación de boda', Q('#3b3a36', '#8a7a5a', '#fffdf7', '#b08d57', '#fffdf7', 'Cormorant Garamond'), () => card({
    radius: 3, env: { on: 1, color: '#f4ecd8', seal: '#b08d57', glyph: '&' },
    front: face(bg('#fffdf7', '#f1e6cd', { angle: 170, tex: 'paper', texAmt: 70 }), { style: 'ornate', color: '#b08d57', w: 1, inset: 3.5 }, { vig: 18, vc: '#a98650' }, [
      tx('nos casamos', { font: 'Cormorant Garamond', size: 5.4, color: '#8a7a5a', up: 1, ls: 0.38, y: 9, w: 80 }),
      tx('Ana\n&\nLuis', { font: 'Great Vibes', size: 17, color: '#3b3a36', y: 27, w: 70, lh: 0.92, sh: 'emboss' }),
      sh('flourish', { fm: 'gold', x: 50, y: 43, w: 50, ar: 6.25 }),
      tx('14 · SEPTIEMBRE · 2026', { font: 'Cinzel', size: 4.4, color: '#6a5a3a', ls: 0.2, y: 49, w: 90 }),
      tx('Jardín Las Rosas', { font: 'Cormorant Garamond', i: 1, size: 6, color: '#6a5a3a', y: 55, w: 80 }),
      tx('Lima, Perú', { font: 'Cormorant Garamond', size: 4.4, color: '#8a7a5a', y: 60, w: 80, ls: 0.1 }),
      em('🌿', { x: 20, y: 69, w: 14, r: 30 }), em('🌿', { x: 80, y: 69, w: 14, r: -30, fl: 1 }),
      seal({ x: 50, y: 69, w: 13, color: '#b08d57', glyph: '&' }),
      tx('escanea para confirmar tu asistencia', { font: 'DM Sans', size: 2.9, color: '#7a6a4a', up: 1, ls: 0.1, y: 77, w: 84 }), qr(88.5, 16),
    ]),
    back: face(bg('#fffdf7', '#f1e6cd', { angle: 170, tex: 'paper', texAmt: 70 }), { style: 'ornate', color: '#b08d57', w: 1, inset: 3.5 }, { vig: 18, vc: '#a98650' }, [
      sh('laurel', { fm: 'gold', x: 50, y: 40, w: 78 }),
      tx('A\n&\nL', { font: 'Great Vibes', size: 15, color: '#3b3a36', y: 40, w: 40, lh: 0.9 }),
      tx('gracias por ser parte\nde nuestra historia', { font: 'Cormorant Garamond', i: 1, size: 5.6, color: '#6a5a3a', y: 64, w: 80, lh: 1.4 }),
    ]),
  }));

  add('Boda', 'Boho acuarela', Q('#7a5240', '#c08a6a', '#fff8f0', '#7a5240', '#fff8f0', 'Dancing Script'), () => card({
    radius: 5,
    front: face(bg('#fdf3e7', '#f7e0cf', { angle: 165, tex: 'paper', texAmt: 85 }), { style: 'none' }, { vig: 15, vc: '#c9a07a' }, [
      sh('blob', { fill: '#f4b09a', op: 55, blur: 2.6, x: 18, y: 10, w: 62, ar: 1.1 }),
      sh('blob', { fill: '#9dbf94', op: 50, blur: 2.6, x: 90, y: 28, w: 50, ar: 1 }),
      sh('blob', { fill: '#f2cf85', op: 50, blur: 2.6, x: 10, y: 62, w: 48, ar: 1 }),
      sh('blob', { fill: '#d9a0b8', op: 40, blur: 2.6, x: 85, y: 82, w: 55, ar: 1 }),
      sh('arch', { fill: '#b4846a', hollow: 1, sw: 0.9, x: 50, y: 38, w: 60, ar: 60 / 84 }),
      img({ shape: 'arch', x: 50, y: 38.5, w: 55.5, ar: 55.5 / 80, ph: '🌾', shd: 0 }),
      sh('leaf', { fill: '#7fa377', x: 17, y: 30, w: 8, ar: 0.5, r: -30 }), sh('leaf', { fill: '#9dbf94', x: 14, y: 40, w: 7, ar: 0.5, r: -55 }), sh('leaf', { fill: '#7fa377', x: 16, y: 50, w: 8, ar: 0.5, r: -80 }),
      sh('leaf', { fill: '#7fa377', x: 83, y: 30, w: 8, ar: 0.5, r: 30 }), sh('leaf', { fill: '#9dbf94', x: 86, y: 40, w: 7, ar: 0.5, r: 55 }), sh('leaf', { fill: '#7fa377', x: 84, y: 50, w: 8, ar: 0.5, r: 80 }),
      sh('flower', { fill: '#f7c6b5', x: 30, y: 66, w: 13, r: 15 }), sh('circle', { fill: '#e9b44c', x: 30, y: 66, w: 4 }),
      sh('flower', { fill: '#f7c6b5', x: 70, y: 66, w: 13, r: -10 }), sh('circle', { fill: '#e9b44c', x: 70, y: 66, w: 4 }),
      tx('bienvenidos', { font: 'Dancing Script', size: 13, color: '#7a5240', y: 74, w: 90, b: 1 }),
      nm({ font: 'Cormorant Garamond', size: 5.4, color: '#7a5240', up: 1, ls: 0.3, y: 81, w: 80 }), qr(91, 15),
    ]),
    back: null,
  }));

  /* ───────────── FIESTA ───────────── */
  add('Fiesta', 'Fiesta', Q('#7f1235', '#e11d48', '#fff5f7', '#7f1235', '#ffffff', 'Pacifico'), () => card({
    radius: 5, fx: { particles: '🎉', mode: 'fall' },
    front: face(bg('#ff9a5a', '#ff3d81', { angle: 165, tex: '', pattern: 'confetti', pc: '#ffffff', pa: 32, ps: 1.3 }), { style: 'dots', color: '#ffffff', w: 0.9, inset: 3 }, { gloss: 1 }, [
      tx('¡Feliz\ncumple!', { font: 'Lobster', size: 19, color: '#ffffff', y: 17, w: 90, lh: 0.95, sh: 'retro', sc: '#b0125a' }),
      em('🎈', { x: 13, y: 8, w: 16, r: -12 }), em('🎈', { x: 87, y: 9, w: 14, r: 14 }), em('🎉', { x: 86, y: 47, w: 15, r: 10, stick: 1 }),
      img({ x: 48, y: 54, w: 52, ar: 0.86, border: 'polaroid', cap: 'Mi mejor día', r: -3, shape: 'rect', ph: '🎂' }),
      nm({ font: 'Pacifico', size: 8, color: '#ffffff', y: 81, w: 88, sh: 'soft', sc: '#7a0a3a' }), qr(92, 14),
    ]),
    back: face(bg('#ff9a5a', '#ff3d81', { angle: 165, tex: '', pattern: 'confetti', pc: '#ffffff', pa: 32, ps: 1.3 }), { style: 'dots', color: '#ffffff', w: 0.9, inset: 3 }, {}, [
      em('🎂', { x: 50, y: 38, w: 40, stick: 1 }),
      tx('Que todos tus\ndeseos se cumplan', { font: 'Pacifico', size: 7.5, color: '#ffffff', y: 63, w: 86, sh: 'soft', sc: '#7a0a3a', lh: 1.25 }),
    ]),
  }));

  add('Fiesta', 'Confeti neón', Q('#1a0536', '#a21caf', '#fdf4ff', '#a21caf', '#22d3ee', 'Bangers'), () => card({
    radius: 5, fx: { particles: '✨', mode: 'rise' },
    front: face(bg('#2b0a58', '#04000d', { kind: 'radial', tex: '', pattern: 'confetti', pc: '#ff2fb9', pa: 30, ps: 1.2 }), { style: 'line', color: '#22d3ee', w: 0.5, inset: 3.5 }, { gloss: 1 }, [
      sh('burst', { fill: '#ff2fb9', hollow: 1, sw: 1.2, x: 50, y: 23, w: 78, ar: 1.15, blur: 0.25 }),
      tx('PARTY', { font: 'Bangers', size: 30, color: '#ff2fb9', sh: 'glow', y: 21, w: 92, ls: 0.04 }),
      tx('time!', { font: 'Bangers', size: 18, color: '#22d3ee', sh: 'glow', y: 32, w: 60, r: -4 }),
      em('🪩', { x: 13, y: 9, w: 14 }), em('🎶', { x: 88, y: 46, w: 11, r: 10 }), em('🎶', { x: 12, y: 66, w: 11, r: -10 }),
      sh('ring', { fill: '#22d3ee', sw: 2, x: 50, y: 56, w: 48, ar: 1, blur: 0.3 }),
      img({ shape: 'circle', x: 50, y: 56, w: 45, ar: 1, ph: '🥳', shd: 0 }),
      nm({ font: 'Bangers', size: 9, color: '#ffffff', sh: 'glow', sc: '#22d3ee', y: 79, w: 86, ls: 0.06 }), qr(90, 17),
    ]),
    back: null,
  }));

  add('Fiesta', 'Cumple infantil', Q('#1d4e89', '#2a9df4', '#f0faff', '#1d4e89', '#ffffff', 'Lobster'), () => card({
    radius: 6, fx: { particles: '🎈', mode: 'rise' },
    front: face(bg('#6cc7ff', '#e3f6ff', { angle: 180, tex: '' }), { style: 'none' }, { gloss: 1 }, [
      sh('sun', { fm: 'grad', fill: '#fff3a0', fill2: '#ffb703', x: 87, y: 9, w: 20, ar: 1 }),
      sh('cloud', { fill: '#ffffff', op: 95, x: 20, y: 12, w: 30, ar: 1.35 }), sh('cloud', { fill: '#ffffff', op: 90, x: 76, y: 22, w: 34, ar: 1.35 }),
      sh('cloud', { fill: '#ffffff', op: 90, x: 14, y: 52, w: 26, ar: 1.35 }), sh('cloud', { fill: '#ffffff', op: 85, x: 90, y: 58, w: 28, ar: 1.35 }),
      tx('5', { font: 'Bangers', size: 56, color: '#ffd23f', sh: 'retro', sc: '#e4572e', y: 33, w: 50 }),
      tx('añitos', { font: 'Lobster', size: 11, color: '#ffffff', sh: 'retro', sc: '#2a7fba', y: 52, w: 60, r: -5 }),
      sh('banner', { fill: '#e63946', x: 50, y: 63, w: 84, ar: 4.4, shd: 1 }),
      tx('¡a celebrar!', { font: 'Bangers', size: 8, color: '#ffffff', y: 63, w: 70, ls: 0.06 }),
      em('🎈', { x: 11, y: 31, w: 13, r: -10 }), em('🎈', { x: 90, y: 40, w: 12, r: 12 }), em('🎁', { x: 12, y: 72, w: 12, r: -8 }), em('🧸', { x: 88, y: 74, w: 13, r: 8 }),
      nm({ font: 'Lobster', size: 10, color: '#ffffff', sh: 'retro', sc: '#2a7fba', y: 75, w: 90 }), qr(90, 17),
    ]),
    back: null,
  }));

  add('Fiesta', 'Tropical', Q('#0b6b4a', '#1b9aaa', '#fffbe0', '#0b6b4a', '#ffe66d', 'Pacifico'), () => card({
    radius: 5,
    front: face(bg('#fff6a8', '#4ed08a', { angle: 170, tex: '' }), { style: 'none' }, { gloss: 1 }, [
      sh('sun', { fill: '#ffb703', x: 82, y: 12, w: 32, ar: 1, op: 90 }), sh('circle', { fm: 'grad', fill: '#ffe66d', fill2: '#ff9f1c', x: 82, y: 12, w: 19 }),
      em('🌴', { x: 15, y: 25, w: 30, r: -4 }), em('🌺', { x: 86, y: 46, w: 14, r: 10 }), em('🍍', { x: 14, y: 64, w: 17, r: -10 }), em('🥥', { x: 88, y: 66, w: 13, r: 8 }),
      tx('ALOHA', { font: 'Abril Fatface', size: 22, color: '#0b6b4a', sh: 'retro', sc: '#ffe66d', y: 40, w: 80, r: -3 }),
      img({ shape: 'scallop', x: 50, y: 60, w: 42, ar: 1, ph: '🏝️', shd: 1 }),
      nm({ font: 'Pacifico', size: 8, color: '#0b6b4a', y: 78, w: 88 }),
      sh('wave', { fill: '#1b9aaa', x: 50, y: 97, w: 100, ar: 7.1, sw: 2 }), qr(88, 15, 86),
    ]),
    back: null,
  }));

  /* ───────────── VINTAGE ───────────── */
  add('Vintage', 'Polaroid vintage', Q('#3b2a20', '#6b4a32', '#fbf3e0', '#3b2a20', '#fbf3e0', 'Special Elite', { dots: 'square', eye: 'square' }), () => card({
    radius: 2,
    front: face(bg('#c8a06a', '#b08650', { tex: 'kraft', texAmt: 85, angle: 150 }), { style: 'none' }, { vig: 30, vc: '#4a2f12' }, [
      tx('recuerdos', { font: 'Permanent Marker', size: 6, color: '#5a4630', y: 8, w: 70, ls: 0.15, up: 1 }),
      sh('rect', { fill: '#fbf6ea', x: 50, y: 41, w: 70, ar: 0.84, r: -3, shd: 1 }), em('🌅', { x: 50, y: 38, w: 28, r: -3 }),
      img({ x: 50, y: 41, w: 70, ar: 0.84, border: 'polaroid', cap: 'verano · siempre', r: -3, shape: 'rect', filter: 'vintage' }),
      tape({ x: 33, y: 13.5, w: 24, r: -28, color: '#f4e4b0', pat: 'plain' }), tape({ x: 67, y: 13.5, w: 24, r: 24, color: '#f4e4b0', pat: 'plain' }),
      nm({ font: 'Caveat', size: 12, color: '#3b2a20', y: 79, w: 70, b: 1, x: 40 }), qr(88, 18, 82, { r: 6 }),
    ]),
    back: face(bg('#d8b988', '#c19a62', { tex: 'kraft', texAmt: 85 }), { style: 'none' }, { vig: 30, vc: '#4a2f12' }, [
      tx('Querido…\n\nGracias por cada\nmomento juntos.\nGuardo este recuerdo\nen mi corazón.', { font: 'Caveat', size: 8, color: '#3b2a20', y: 42, w: 74, lh: 1.25 }),
      seal({ x: 50, y: 80, w: 15, color: '#7a1f2b', glyph: '✿' }),
    ]),
  }));

  add('Vintage', 'Postal de viaje', Q('#1d4e89', '#c0392b', '#fffaf0', '#1d4e89', '#fffaf0', 'Special Elite', { dots: 'square' }), () => card({
    ratio: 'landscape', radius: 2,
    front: face(bg('#f4ead5', '#e8d9b8', { angle: 150, tex: 'paper', texAmt: 80 }), { style: 'stitch', color: '#c0392b', w: 0.5, inset: 3 }, { vig: 25, vc: '#7a5a2a' }, [
      sh('line', { fill: '#b9ac90', x: 56, y: 50, w: 52, sw: 0.35, r: 90 }),
      img({ x: 27, y: 52, w: 40, ar: 0.88, border: 'polaroid', cap: 'saludos', r: -4, shape: 'rect', ph: '🏝️', filter: 'vintage' }),
      tape({ x: 20, y: 25, w: 12, r: -32, color: '#f4e4b0', pat: 'plain' }),
      tx('Saludos desde', { font: 'Dancing Script', size: 5.6, color: '#5a4630', x: 77, y: 22, w: 34, b: 1 }),
      nm({ font: 'Permanent Marker', size: 5, color: '#c0392b', x: 77, y: 38, w: 34, r: -3 }),
      sh('line', { fill: '#a39679', x: 76, y: 58, w: 32, sw: 0.35 }), sh('line', { fill: '#a39679', x: 76, y: 68, w: 32, sw: 0.35 }),
      sh('scallop', { fill: '#1d4e89', x: 88, y: 17, w: 13, ar: 0.82 }), em('🕊️', { x: 88, y: 17, w: 6 }),
      sh('ring', { fill: '#1d4e89', sw: 1, x: 80, y: 21, w: 14, ar: 1, op: 65 }),
      qr(79, 13, 87, { r: 3 }),
    ]),
    back: null,
  }));

  add('Vintage', 'Boleto vintage', Q('#3b1a10', '#7a1f2b', '#f3e2b3', '#3b1a10', '#f3e2b3', 'Special Elite', { dots: 'square', eye: 'square' }), () => card({
    radius: 3,
    front: face(bg('#7a1f2b', '#4a0f19', { tex: 'linen', texAmt: 55 }), { style: 'stitch', color: '#e8c97a', w: 0.5, inset: 3.5 }, { vig: 30, vc: '#000000' }, [
      sh('ticket', { fill: '#f3e2b3', x: 50, y: 25, w: 86, ar: 2.05, shd: 1, r: -2 }),
      tx('ADMIT ONE', { font: 'Special Elite', size: 4.2, color: '#7a1f2b', ls: 0.3, y: 17, w: 70, r: -2 }),
      nm({ font: 'Abril Fatface', size: 9, color: '#3b1a10', y: 25, w: 70, r: -2 }),
      tx('— entrada general —', { font: 'Special Elite', size: 3.6, color: '#7a5a3a', y: 33, w: 70, r: -2 }),
      em('🎟️', { x: 12, y: 49, w: 12, r: -20 }), em('🍿', { x: 88, y: 47, w: 12, r: 15 }),
      sh('ticket', { fill: '#f3e2b3', x: 50, y: 72, w: 60, ar: 1.28, shd: 1, r: 2 }),
      qr(71, 30, 50, { r: 2 }),
      tx('escanea al entrar', { font: 'Special Elite', size: 3.4, color: '#7a1f2b', ls: 0.15, y: 87, w: 54, r: 2 }),
    ]),
    back: null,
  }));

  add('Vintage', 'Mapa del tesoro', Q('#4a2f12', '#7a4a1a', '#f2e2bb', '#4a2f12', '#f2e2bb', 'Permanent Marker', { dots: 'square', eye: 'square' }), () => card({
    radius: 3,
    front: face(bg('#ecd7a3', '#c9a36a', { kind: 'radial', tex: 'paper', texAmt: 95 }), { style: 'stitch', color: '#7a4a1a', w: 0.5, inset: 4 }, { vig: 62, vc: '#4a2f12' }, [
      tx('El gran tesoro', { font: 'Lobster', size: 10, color: '#5a3414', y: 10, w: 78, curve: 26 }),
      sh('blob', { fill: '#b9a06a', op: 70, blur: 0.4, x: 46, y: 44, w: 66, ar: 1.25 }),
      sh('blob', { fill: '#9bb77a', op: 55, blur: 0.4, x: 42, y: 42, w: 40, ar: 1.2 }),
      em('🌴', { x: 30, y: 40, w: 16, r: -6 }), em('⛰️', { x: 55, y: 34, w: 16 }),
      tx('· · · · · · · · · ·', { font: 'Special Elite', size: 8, color: '#7a4a1a', y: 52, w: 62, curve: -45 }),
      tx('X', { font: 'Permanent Marker', size: 20, color: '#b3261e', x: 68, y: 52, w: 16, r: -8 }),
      em('🧭', { x: 14, y: 24, w: 13, r: -10 }), em('🗝️', { x: 87, y: 24, w: 12, r: 20 }), em('🦜', { x: 85, y: 72, w: 14, r: 6 }), em('⚓', { x: 15, y: 72, w: 14 }),
      nm({ font: 'Permanent Marker', size: 7, color: '#5a3414', y: 68, w: 84, r: -2 }),
      tx('escanea el mapa', { font: 'Special Elite', size: 3.4, color: '#7a4a1a', up: 1, ls: 0.2, y: 78, w: 70 }), qr(89, 17),
    ]),
    back: null,
  }));

  /* ───────────── ELEGANTE ───────────── */
  add('Elegante', 'Oro y noche', Q('#2a1f08', '#a9822c', '#fff8e1', '#2a1f08', '#f4d77a', 'Cinzel'), () => card({
    radius: 4, fx: { particles: '✨', mode: 'rise' },
    front: face(bg('#2b2540', '#0b0910', { kind: 'radial', tex: 'board', texAmt: 35 }), { style: 'gold', color: '#c9a24b', w: 1, inset: 3 }, { vig: 25, vc: '#000000', gloss: 1 }, [
      sh('sparkle', { fm: 'gold', x: 50, y: 11, w: 9 }),
      nm({ font: 'Cinzel', size: 9, fill: 'gold', y: 23, w: 82, b: 1, up: 1, ls: 0.08 }),
      sh('line', { fm: 'gold', x: 50, y: 31, w: 52, sw: 1.2 }),
      tx('edición especial', { font: 'Cormorant Garamond', i: 1, size: 6, color: '#d9c58a', y: 36.5, w: 70, ls: 0.1 }),
      em('👑', { x: 50, y: 59, w: 26 }),
      img({ x: 50, y: 59, w: 50, ar: 1, shape: 'circle', border: 'none', shd: 1 }),
      sh('ring', { fm: 'gold', x: 50, y: 59, w: 54, ar: 1, sw: 1.5 }), qr(87, 18),
    ]),
    back: face(bg('#2b2540', '#0b0910', { kind: 'radial', tex: 'board', texAmt: 35, pattern: 'diamonds', pc: '#c9a24b', pa: 14, ps: 0.9 }), { style: 'gold', color: '#c9a24b', w: 1, inset: 3 }, { vig: 25, vc: '#000000' }, [
      sh('moon', { fm: 'gold', x: 50, y: 40, w: 34 }),
      tx('ad astra', { font: 'Cinzel', size: 8, fill: 'gold', y: 64, w: 70, up: 1, ls: 0.3 }),
    ]),
  }));

  add('Elegante', 'Art déco', Q('#2a1f08', '#a9822c', '#fff8e1', '#c9a24b', '#f4d77a', 'Abril Fatface', { dots: 'square', eye: 'square' }), () => card({
    radius: 3,
    front: face(bg('#14141b', '#050507', { tex: 'board', texAmt: 30, pattern: 'deco', pc: '#c9a24b', pa: 15, ps: 1.2 }), { style: 'gold', color: '#c9a24b', w: 1.2, inset: 3.2 }, { vig: 30, vc: '#000000', gloss: 1 }, [
      sh('bevel', { fm: 'gold', hollow: 1, sw: 0.5, x: 50, y: 50, w: 87, ar: 87 / 125 }),
      sh('sparkle', { fm: 'gold', x: 50, y: 6.5, w: 6 }),
      tx('GRAN GALA', { font: 'Abril Fatface', size: 9, fill: 'gold', y: 11, w: 80, ls: 0.12 }),
      sh('arch', { fm: 'gold', hollow: 1, sw: 0.9, x: 50, y: 40, w: 58, ar: 58 / 72 }),
      img({ shape: 'arch', x: 50, y: 40.3, w: 54, ar: 54 / 68, ph: '🥂', shd: 0 }),
      sh('flourish', { fm: 'gold', x: 50, y: 68, w: 50, ar: 6.25 }),
      nm({ font: 'Abril Fatface', size: 8, fill: 'gold', y: 74, w: 80, up: 1, ls: 0.05 }),
      tx('EDICIÓN LIMITADA', { font: 'Cinzel', size: 3.4, color: '#d9c58a', ls: 0.35, y: 80, w: 70 }), qr(89, 14),
    ]),
    back: null,
  }));

  add('Elegante', 'Mármol minimal', Q('#1f1f1f', '#8a6516', '#ffffff', '#1f1f1f', '#ffffff', 'Playfair Display'), () => card({
    radius: 2,
    front: face(bg('#f8f8f6', '#e1e1dc', { angle: 150, tex: 'board', texAmt: 35 }), { style: 'line', color: '#b08d57', w: 0.3, inset: 5 }, { vig: 8, vc: '#8a8a80' }, [
      tx('COLECCIÓN Nº 01', { font: 'Cinzel', size: 3.6, color: '#8a6516', ls: 0.4, y: 9, w: 80 }),
      sh('ring', { fm: 'gold', x: 50, y: 33, w: 58, ar: 1, sw: 0.7 }),
      img({ shape: 'circle', x: 50, y: 33, w: 52, ar: 1, ph: '✦', shd: 0 }),
      nm({ font: 'Playfair Display', size: 8.5, color: '#1f1f1f', y: 61, w: 80, b: 1 }),
      sh('flourish', { fm: 'gold', x: 50, y: 68, w: 36, ar: 6.25 }),
      tx('una pieza única', { font: 'Cormorant Garamond', i: 1, size: 5, color: '#6a6a60', y: 73, w: 70 }), qr(87, 18),
    ]),
    back: null,
  }));

  add('Elegante', 'Oro rosa', Q('#4a2a26', '#b76e79', '#fff5f2', '#4a2a26', '#f6d3c7', 'Great Vibes'), () => card({
    radius: 5, fx: { particles: '✨', mode: 'fall' },
    front: face(bg('#35303b', '#15131a', { kind: 'radial', tex: 'linen', texAmt: 35, pattern: 'scales', pc: '#d9a79a', pa: 10, ps: 1.3 }), { style: 'line', color: '#d9a79a', w: 0.5, inset: 3.2 }, { vig: 30, vc: '#000000', gloss: 1 }, [
      sh('ring', { fm: 'rose', x: 42, y: 27, w: 44, ar: 1, sw: 0.8 }), sh('ring', { fm: 'rose', x: 58, y: 27, w: 44, ar: 1, sw: 0.8 }),
      tx('Rose', { font: 'Great Vibes', size: 30, fill: 'rose', y: 27, w: 80, sh: 'soft', sc: '#000000' }),
      sh('flourish', { fm: 'rose', x: 50, y: 43, w: 50, ar: 6.25 }),
      img({ shape: 'scallop', x: 50, y: 61, w: 40, ar: 1, ph: '🌸', shd: 1 }),
      nm({ font: 'Cormorant Garamond', size: 6.5, fill: 'rose', y: 79, w: 80, up: 1, ls: 0.3 }), qr(90, 14),
    ]),
    back: null,
  }));

  /* ───────────── NATURALEZA ───────────── */
  add('Naturaleza', 'Jardín botánico', Q('#2f5d34', '#6b9a5e', '#f3f8ec', '#2f5d34', '#e6f2d8', 'Playfair Display'), () => card({
    radius: 5, fx: { particles: '🌸', mode: 'fall' },
    front: face(bg('#eef4e6', '#c9ddb8', { angle: 165, tex: 'linen', texAmt: 60 }), { style: 'none' }, { vig: 14, vc: '#5f8f55' }, [
      sh('leaf', { fill: '#5f8f55', x: 8, y: 6, w: 24, ar: 0.5, r: -42 }), sh('leaf', { fill: '#86b377', x: 21, y: 4, w: 17, ar: 0.5, r: 12 }), sh('leaf', { fill: '#4a7a45', x: 4, y: 17, w: 18, ar: 0.5, r: -78 }),
      sh('leaf', { fill: '#4a7a45', x: 93, y: 7, w: 24, ar: 0.5, r: 42 }), sh('leaf', { fill: '#86b377', x: 80, y: 4, w: 17, ar: 0.5, r: -12 }), sh('leaf', { fill: '#5f8f55', x: 97, y: 19, w: 18, ar: 0.5, r: 78 }),
      sh('flower', { fill: '#f7a8c4', x: 14, y: 14, w: 15, r: 12 }), sh('circle', { fill: '#ffd166', x: 14, y: 14, w: 4.6 }),
      sh('flower5', { fill: '#ffffff', x: 87, y: 15, w: 14, r: -10 }), sh('circle', { fill: '#f4a261', x: 87, y: 15, w: 4.4 }),
      sh('oval', { fill: '#5f8f55', hollow: 1, sw: 0.9, x: 50, y: 37, w: 68, ar: 68 / 80 }),
      img({ shape: 'oval', x: 50, y: 37, w: 63.5, ar: 63.5 / 75, ph: '🌿', shd: 0 }),
      tx('Jardín', { font: 'Playfair Display', i: 1, size: 14, color: '#2f5d34', y: 64, w: 90 }),
      tx('botánico', { font: 'Cormorant Garamond', size: 5.4, up: 1, ls: 0.4, color: '#4a7a45', y: 74, w: 80 }),
      nm({ font: 'Caveat', size: 8, color: '#2f5d34', y: 80, w: 80, b: 1 }),
      sh('leaf', { fill: '#5f8f55', x: 8, y: 93, w: 22, ar: 0.5, r: -120 }), sh('leaf', { fill: '#86b377', x: 93, y: 94, w: 22, ar: 0.5, r: 120 }), qr(89, 16),
    ]),
    back: null,
  }));

  add('Naturaleza', 'Océano', Q('#04325a', '#0b7dc4', '#eef9ff', '#04325a', '#ffffff', 'Pacifico'), () => card({
    radius: 5, fx: { particles: '🫧', mode: 'rise' },
    front: face(bg('#d4f1ff', '#0b4f8a', { angle: 180, tex: '' }), { style: 'none' }, { gloss: 1 }, [
      sh('sun', { fill: '#ffffff', op: 40, blur: 1, x: 80, y: 11, w: 32 }),
      tx('Mar', { font: 'Pacifico', size: 26, color: '#ffffff', sh: 'soft', sc: '#04325a', y: 17, w: 80 }),
      sh('ring', { fill: '#ffffff', sw: 1.4, x: 50, y: 46, w: 52, ar: 1, op: 90 }),
      img({ shape: 'circle', x: 50, y: 46, w: 47, ar: 1, ph: '🌊', shd: 1 }),
      sh('circle', { fill: '#ffffff', hollow: 1, sw: 2, x: 16, y: 38, w: 6, op: 70 }), sh('circle', { fill: '#ffffff', hollow: 1, sw: 2, x: 84, y: 30, w: 8, op: 70 }), sh('circle', { fill: '#ffffff', hollow: 1, sw: 2, x: 88, y: 58, w: 5, op: 70 }),
      sh('wave', { fill: '#ffffff', op: 55, x: 50, y: 70, w: 100, ar: 7.1, sw: 1.8 }), sh('wave', { fill: '#ffffff', op: 35, x: 50, y: 74, w: 100, ar: 7.1, sw: 1.8 }),
      em('🐚', { x: 15, y: 62, w: 14, r: -20 }), em('🐠', { x: 87, y: 44, w: 13, fl: 1 }),
      nm({ font: 'Caveat', size: 10, color: '#ffffff', sh: 'soft', sc: '#04325a', y: 80, w: 80, b: 1 }), qr(91, 15),
    ]),
    back: null,
  }));

  add('Naturaleza', 'Otoño', Q('#7a2e0b', '#d9762b', '#fff3e0', '#7a2e0b', '#ffe3b8', 'Lobster'), () => card({
    radius: 5, fx: { particles: '🍂', mode: 'fall' },
    front: face(bg('#f9d9a8', '#d9762b', { angle: 170, tex: 'paper', texAmt: 60 }), { style: 'stitch', color: '#7a2e0b', w: 0.5, inset: 3.4 }, { vig: 25, vc: '#7a2e0b' }, [
      em('🍂', { x: 12, y: 10, w: 17, r: -20 }), em('🍁', { x: 88, y: 12, w: 17, r: 25 }), em('🍂', { x: 80, y: 36, w: 11, r: 70 }), em('🍁', { x: 14, y: 40, w: 11, r: -50 }),
      tx('Hola,', { font: 'Dancing Script', size: 11, color: '#7a2e0b', y: 15, w: 70, b: 1 }),
      tx('otoño', { font: 'Lobster', size: 22, color: '#8a2c0a', sh: 'retro', sc: '#ffe3b8', y: 24, w: 90 }),
      sh('leaf', { fill: '#c8501b', hollow: 1, sw: 1, x: 50, y: 52, w: 50, ar: 50 / 64, r: 0 }),
      img({ shape: 'leaf', x: 50, y: 52, w: 46, ar: 46 / 60, ph: '🍄', shd: 1 }),
      em('🌰', { x: 16, y: 66, w: 11, r: 15 }), em('🍄', { x: 85, y: 66, w: 12, r: -10 }),
      nm({ font: 'Lobster', size: 8, color: '#7a2e0b', y: 77, w: 86 }), qr(89, 16),
    ]),
    back: null,
  }));

  add('Naturaleza', 'Atardecer', Q('#4a1d6a', '#e11d48', '#fff4ea', '#4a1d6a', '#ffe8cc', 'Pacifico', { dots: 'dots', eye: 'circle' }), () => card({
    radius: 6,
    front: face(bg('#ffb36b', '#5b2a86', { angle: 180, tex: '', pattern: 'waves', pc: '#ffffff', pa: 14, ps: 1.2 }), { style: 'none' }, { gloss: 1 }, [
      sh('circle', { fm: 'grad', fill: '#fff3a0', fill2: '#ff8a3c', x: 50, y: 38, w: 58, shd: 0 }),
      tx('Verano', { font: 'Pacifico', size: 21, color: '#ffffff', y: 64, w: 92, sh: 'soft', sc: '#3a0d5a' }),
      em('🌴', { x: 14, y: 48, w: 24, r: -6 }), em('🌊', { x: 87, y: 78, w: 20 }),
      nm({ font: 'Caveat', size: 9, color: '#fff3d6', y: 76, w: 80, b: 1 }), qr(90, 17),
    ]),
    back: null,
  }));

  /* ───────────── MÁGICO ───────────── */
  add('Mágico', 'Mágica', Q('#1a1245', '#7c3aed', '#f4efff', '#1a1245', '#e9ddff', 'Cinzel', { dots: 'diamond' }), () => card({
    radius: 5, fx: { particles: '✨', mode: 'fall' },
    front: face(bg('#4a3a9a', '#0b0720', { kind: 'radial', tex: '', pattern: 'stars', pc: '#ffffff', pa: 16, ps: 0.8 }), { style: 'line', color: '#b9a4ef', w: 0.5, inset: 3 }, { gloss: 1 }, [
      sh('moon', { fm: 'silver', x: 74, y: 15, w: 24, r: 20 }), sh('sparkle', { fm: 'gold', x: 22, y: 12, w: 8 }), sh('sparkle', { fm: 'gold', x: 86, y: 40, w: 5 }),
      em('🔮', { x: 50, y: 33, w: 34 }),
      nm({ font: 'Cinzel', size: 10, fill: 'holo', y: 56, w: 86, b: 1, up: 1 }),
      tx('la magia empieza aquí', { font: 'Dancing Script', size: 7, color: '#d6c8ff', y: 65, w: 80 }), qr(85, 21),
    ]),
    back: face(bg('#4a3a9a', '#0b0720', { kind: 'radial', tex: '', pattern: 'stars', pc: '#ffffff', pa: 20, ps: 0.8 }), { style: 'line', color: '#b9a4ef', w: 0.5, inset: 3 }, {}, [
      sh('sparkle', { fm: 'holo', x: 50, y: 42, w: 40 }),
      tx('abracadabra', { font: 'Dancing Script', size: 10, fill: 'holo', y: 66, w: 80 }),
    ]),
  }));

  add('Mágico', 'Galaxia', Q('#1a1245', '#2563eb', '#eef4ff', '#1a1245', '#7dd3fc', 'Bangers'), () => card({
    radius: 5, fx: { particles: '⭐', mode: 'rise' },
    front: face(bg('#3a1d7a', '#04020d', { kind: 'radial', tex: '', pattern: 'stars', pc: '#ffffff', pa: 24, ps: 0.7 }), { style: 'line', color: '#7dd3fc', w: 0.4, inset: 3.2 }, { gloss: 1 }, [
      sh('circle', { fm: 'grad', fill: '#ffb86b', fill2: '#c2410c', x: 22, y: 21, w: 22 }), sh('ring', { fill: '#ffe0b0', sw: 1.4, x: 22, y: 21, w: 36, ar: 3.2, r: -22, op: 85 }),
      sh('circle', { fm: 'grad', fill: '#7dd3fc', fill2: '#1d4ed8', x: 84, y: 34, w: 13 }), sh('moon', { fm: 'silver', x: 80, y: 10, w: 12, r: 25 }),
      sh('sparkle', { fm: 'gold', x: 50, y: 12, w: 6 }), sh('sparkle', { fm: 'gold', x: 12, y: 46, w: 4 }),
      tx('EXPLORADOR', { font: 'Bangers', size: 13.5, color: '#7dd3fc', sh: 'glow', y: 34, w: 92, ls: 0.06 }),
      img({ shape: 'circle', x: 50, y: 56, w: 40, ar: 1, ph: '🧑‍🚀', shd: 0 }), sh('ring', { fill: '#7dd3fc', sw: 1.6, x: 50, y: 56, w: 44, ar: 1, blur: 0.2 }),
      em('🚀', { x: 18, y: 66, w: 20, r: 40 }), em('🪐', { x: 84, y: 70, w: 14, r: -10 }),
      nm({ font: 'Bangers', size: 8.5, color: '#ffffff', sh: 'glow', sc: '#7dd3fc', y: 79, w: 86 }), qr(90, 16),
    ]),
    back: null,
  }));

  add('Mágico', 'Hada encantada', Q('#5b2a86', '#c084fc', '#fdf4ff', '#5b2a86', '#ffffff', 'Dancing Script'), () => card({
    radius: 6, fx: { particles: '✨', mode: 'fall' },
    front: face(bg('#ffd9f4', '#9f8bff', { angle: 165, tex: '', pattern: 'stars', pc: '#ffffff', pa: 30, ps: 0.9 }), { style: 'dots', color: '#ffffff', w: 0.7, inset: 3 }, { gloss: 1 }, [
      tx('Había una vez…', { font: 'Dancing Script', size: 10, color: '#5b2a86', y: 9, w: 86, b: 1 }),
      sh('blob', { fill: '#ffffff', op: 55, blur: 2, x: 50, y: 36, w: 66, ar: 1 }),
      sh('scallop', { fill: '#ffffff', x: 50, y: 36, w: 52, ar: 1, shd: 1 }),
      img({ shape: 'scallop', x: 50, y: 36, w: 48, ar: 1, ph: '🧚', shd: 0 }),
      sh('sparkle', { fm: 'gold', x: 17, y: 20, w: 9 }), sh('sparkle', { fm: 'gold', x: 86, y: 52, w: 7 }), sh('sparkle', { fm: 'gold', x: 14, y: 56, w: 5 }),
      em('🦋', { x: 84, y: 20, w: 13, r: 20 }), em('🍄', { x: 15, y: 70, w: 13, r: -10 }), em('🌷', { x: 85, y: 70, w: 12, r: 8 }),
      tx('magia', { font: 'Great Vibes', size: 24, fill: 'holo', y: 66, w: 90, sh: 'soft', sc: '#5b2a86' }),
      nm({ font: 'Cormorant Garamond', size: 6, color: '#5b2a86', up: 1, ls: 0.3, y: 76, w: 80, b: 1 }), qr(89, 16),
    ]),
    back: null,
  }));

  /* ───────────── DIVERTIDO ───────────── */
  add('Divertido', 'Cómic pop', Q('#111111', '#e63946', '#fff4b8', '#111111', '#ffe14d', 'Bangers', { dots: 'square', eye: 'square' }), () => card({
    radius: 3,
    front: face(bg('#ffe14d', '#ffd000', { tex: '', pattern: 'dots', pc: '#ff6b3d', pa: 50, ps: 1.8 }), { style: 'line', color: '#111111', w: 1.4, inset: 3 }, {}, [
      sh('burst', { fill: '#e63946', stroke: '#111111', sw: 2, x: 50, y: 25, w: 74, ar: 1.1, shd: 1 }),
      tx('¡POW!', { font: 'Bangers', size: 23, color: '#ffffff', sh: 'outline', sc: '#111111', y: 25, w: 62, r: -6 }),
      sh('rect', { fill: '#111111', x: 52.5, y: 58.5, w: 56, ar: 0.95 }),
      img({ x: 50, y: 56, w: 56, ar: 0.95, shape: 'rect', border: 'white', bc: '#ffffff', ph: '😎', shd: 0 }),
      em('💥', { x: 86, y: 44, w: 14, r: 15 }),
      nm({ font: 'Bangers', size: 9, color: '#ffffff', sh: 'outline', sc: '#111111', y: 80, w: 86, ls: 0.04 }), qr(91.5, 13),
    ]),
    back: null,
  }));

  add('Divertido', 'Mi mascota', Q('#7a3b2e', '#ff8fab', '#fff6ec', '#7a3b2e', '#ffffff', 'Pacifico'), () => card({
    radius: 6, fx: { particles: '🐾', mode: 'fall' },
    front: face(bg('#fff2e0', '#ffd8b0', { tex: 'paper', texAmt: 40, pattern: 'dots', pc: '#ffb3a7', pa: 28, ps: 1.4 }), { style: 'dots', color: '#ff8fab', w: 0.9, inset: 3 }, {}, [
      em('🐾', { x: 12, y: 10, w: 11, r: -20, op: 60 }), em('🐾', { x: 88, y: 14, w: 11, r: 20, op: 60 }), em('🐾', { x: 10, y: 52, w: 9, r: -30, op: 55 }), em('🐾', { x: 90, y: 54, w: 9, r: 25, op: 55 }),
      sh('ring', { fill: '#ff8fab', sw: 2.5, x: 50, y: 35, w: 62, ar: 1, shd: 1 }),
      img({ shape: 'circle', x: 50, y: 35, w: 56, ar: 1, ph: '🐶', shd: 0 }),
      sh('tag', { fill: '#ff8fab', x: 50, y: 63, w: 68, ar: 3.4, shd: 1 }),
      tx('Mi mejor amigo', { font: 'Pacifico', size: 6.2, color: '#ffffff', y: 63, w: 56 }),
      nm({ font: 'Fredoka', size: 10, b: 1, color: '#7a3b2e', y: 75, w: 80 }),
      em('🦴', { x: 18, y: 86, w: 12, r: -25 }), em('🦴', { x: 82, y: 86, w: 12, r: 25, fl: 1 }), qr(89, 16),
    ]),
    back: null,
  }));

  /* ───────────── OCASIONES ───────────── */
  add('Ocasiones', 'Navidad', Q('#0f4c3a', '#c1121f', '#fff8ee', '#0f4c3a', '#ffe08a', 'Lobster'), () => card({
    radius: 5, fx: { particles: '❄️', mode: 'fall' }, env: { on: 1, color: '#c1121f', seal: '#c9a24b', glyph: '★' },
    front: face(bg('#14573f', '#06261b', { kind: 'radial', tex: 'linen', texAmt: 40, pattern: 'snow', pc: '#ffffff', pa: 22, ps: 1.1 }), { style: 'gold', color: '#c9a24b', w: 0.8, inset: 3 }, { vig: 30, vc: '#000000', gloss: 1 }, [
      sh('star', { fm: 'gold', x: 50, y: 8, w: 9 }),
      em('🎄', { x: 50, y: 31, w: 36 }),
      em('🎁', { x: 18, y: 38, w: 13, r: -10 }), em('⛄', { x: 83, y: 38, w: 14, r: 8 }), em('🍭', { x: 20, y: 18, w: 10, r: -30 }), em('🔔', { x: 82, y: 17, w: 10, r: 20 }),
      tx('Feliz', { font: 'Lobster', size: 11, color: '#ffffff', y: 52, w: 60 }),
      tx('Navidad', { font: 'Lobster', size: 21, fill: 'gold', sh: 'soft', sc: '#000000', y: 61, w: 92 }),
      sh('banner', { fill: '#c1121f', x: 50, y: 73, w: 70, ar: 5, shd: 1 }), nm({ font: 'Fredoka', size: 5.6, color: '#ffffff', y: 73, w: 58, b: 1 }),
      qr(88, 17),
    ]),
    back: null,
  }));

  add('Ocasiones', 'Graduación', Q('#0d1b3e', '#a9822c', '#fff8e1', '#0d1b3e', '#f4d77a', 'Cinzel'), () => card({
    radius: 4, fx: { particles: '🎓', mode: 'fall' },
    front: face(bg('#1c2f6b', '#070c24', { kind: 'radial', tex: 'board', texAmt: 30 }), { style: 'double', color: '#c9a24b', w: 1.4, inset: 3.2 }, { vig: 30, vc: '#000000', gloss: 1 }, [
      tx('¡Felicidades!', { font: 'Great Vibes', size: 19, fill: 'gold', y: 12, w: 92, sh: 'soft', sc: '#000000' }),
      sh('laurel', { fm: 'gold', x: 50, y: 40, w: 80, shd: 1 }),
      img({ shape: 'circle', x: 50, y: 40, w: 44, ar: 1, ph: '🎓', shd: 1 }),
      sh('flourish', { fm: 'gold', x: 50, y: 64, w: 46, ar: 6.25 }),
      tx('Lo lograste', { font: 'Cormorant Garamond', i: 1, size: 7.5, color: '#e8d9a8', y: 70, w: 80 }),
      nm({ font: 'Cinzel', size: 6, fill: 'gold', y: 77, w: 84, up: 1, ls: 0.2 }),
      tx('CLASE 2026', { font: 'Cinzel', size: 3.4, color: '#b9a468', ls: 0.4, y: 82, w: 70 }), qr(90, 14),
    ]),
    back: null,
  }));

  add('Ocasiones', 'Para mamá', Q('#b02a5b', '#f06292', '#fff5f8', '#b02a5b', '#ffffff', 'Great Vibes'), () => card({
    radius: 6, fx: { particles: '🌷', mode: 'fall' },
    front: face(bg('#ffe7ef', '#ffc2d6', { tex: 'paper', texAmt: 40, pattern: 'floral', pc: '#f48fb1', pa: 38, ps: 1.1 }), { style: 'dots', color: '#ffffff', w: 0.9, inset: 3 }, { gloss: 1 }, [
      sh('flower', { fill: '#f06292', x: 12, y: 9, w: 16, r: 10 }), sh('circle', { fill: '#ffd166', x: 12, y: 9, w: 5 }),
      sh('flower5', { fill: '#ffffff', x: 90, y: 8, w: 14, r: -15 }), sh('circle', { fill: '#f4a261', x: 90, y: 8, w: 4.4 }),
      sh('leaf', { fill: '#7fb685', x: 24, y: 6, w: 9, ar: 0.5, r: 40 }), sh('leaf', { fill: '#7fb685', x: 78, y: 5, w: 9, ar: 0.5, r: -40 }),
      tx('Para mamá', { font: 'Great Vibes', size: 20, color: '#b02a5b', sh: 'soft', sc: '#ffffff', y: 19, w: 90 }),
      sh('oval', { fill: '#f06292', hollow: 1, sw: 1, x: 50, y: 46, w: 58, ar: 58 / 68 }),
      img({ shape: 'oval', x: 50, y: 46, w: 54, ar: 54 / 64, ph: '👩‍👧', shd: 0 }),
      sh('heart', { fm: 'grad', fill: '#ff5c9a', fill2: '#c2185b', x: 76, y: 62, w: 15, r: 15, shd: 1 }),
      tx('Gracias por todo tu amor', { font: 'Caveat', size: 8.5, color: '#b02a5b', y: 72, w: 86, b: 1 }),
      nm({ font: 'Cormorant Garamond', size: 5.6, color: '#b02a5b', up: 1, ls: 0.3, y: 79, w: 80 }),
      sh('flower', { fill: '#f06292', x: 10, y: 93, w: 14, r: -10 }), sh('circle', { fill: '#ffd166', x: 10, y: 93, w: 4.4 }), qr(90, 16),
    ]),
    back: null,
  }));

  add('Ocasiones', 'Gracias', Q('#3b2a20', '#c0392b', '#fbf6ea', '#3b2a20', '#fbf6ea', 'Permanent Marker', { dots: 'square' }), () => card({
    radius: 2,
    front: face(bg('#c8a06a', '#b08650', { tex: 'kraft', texAmt: 85 }), { style: 'none' }, { vig: 30, vc: '#4a2f12' }, [
      sh('rect', { fill: '#fbf6ea', x: 50, y: 38, w: 80, ar: 80 / 62, r: -2, shd: 1 }),
      tape({ x: 28, y: 15, w: 24, r: -28, color: '#f7c6d9', pat: 'stripes' }), tape({ x: 72, y: 15, w: 24, r: 26, color: '#bfe3f5', pat: 'dots' }),
      tx('gracias', { font: 'Permanent Marker', size: 16, color: '#c0392b', y: 33, w: 74, r: -3 }),
      tx('de todo corazón', { font: 'Caveat', size: 9, color: '#3b2a20', y: 45, w: 70, b: 1, r: -3 }),
      em('❤️', { x: 76, y: 24, w: 10, r: 15 }),
      seal({ x: 78, y: 54, w: 14, color: '#b3261e', glyph: '♥' }),
      nm({ font: 'Caveat', size: 12, b: 1, color: '#3b2a20', y: 70, w: 84 }),
      sh('rect', { fill: '#fbf6ea', x: 50, y: 88, w: 24, ar: 1.15, shd: 1, r: 2 }), qr(88, 20, 50, { r: 2, shd: 0 }),
    ]),
    back: null,
  }));

  add('Ocasiones', 'Halloween', Q('#2a0f45', '#ff7a18', '#fff4e6', '#2a0f45', '#ff9a3c', 'Bangers'), () => card({
    radius: 5, fx: { particles: '🦇', mode: 'fall' },
    front: face(bg('#1a0b2e', '#ff7a18', { angle: 180, tex: '' }), { style: 'dots', color: '#ff9a3c', w: 0.9, inset: 3 }, { vig: 25, vc: '#000000' }, [
      sh('circle', { fm: 'grad', fill: '#fff8c4', fill2: '#ffd166', x: 72, y: 15, w: 26, blur: 0.15 }),
      em('🦇', { x: 22, y: 12, w: 14, r: -15 }), em('🦇', { x: 48, y: 22, w: 9, r: 10 }), em('🕸️', { x: 10, y: 6, w: 16 }),
      tx('TRUCO\no TRATO', { font: 'Bangers', size: 16, color: '#ff7a18', sh: 'retro', sc: '#000000', y: 36, w: 90, lh: 0.95, r: -3 }),
      em('🎃', { x: 50, y: 64, w: 40 }), em('👻', { x: 16, y: 66, w: 15, r: -10 }), em('🍬', { x: 85, y: 64, w: 13, r: 20 }),
      nm({ font: 'Bangers', size: 8, color: '#ffffff', sh: 'retro', sc: '#2a0f45', y: 83, w: 86 }), qr(92, 13, 85),
    ]),
    back: null,
  }));

  /* ───────────── MINIMAL ───────────── */
  add('Minimal', 'Blanco con QR', Q('#111111', '#111111', '#ffffff', '#111111', '#ffffff', 'DM Sans', { dots: 'square', eye: 'square' }), () => card({
    radius: 2,
    front: face(bg('#fbfaf6', '#f1ede4', { texAmt: 40 }), { style: 'line', color: '#111111', w: 0.35, inset: 5 }, {}, [
      nm({ font: 'Playfair Display', size: 9, color: '#111111', y: 14, w: 76, b: 1 }),
      sh('line', { fill: '#111111', x: 50, y: 22, w: 14, sw: 3 }),
      qr(56, 56),
      tx('escanea para abrir', { font: 'DM Sans', size: 3.6, color: '#555555', y: 85, w: 60, ls: 0.2, up: 1 }),
    ]),
    back: null,
  }));

  T.cats = ['Todos', ...Array.from(new Set(T.map((t) => t.cat)))];
  window.CardTpl = T;
})();
