/* Dibuja códigos QR decorados en un <canvas> usando la librería qrcode-generator */
(function () {
  const DEF = {
    fg: '#1e1b4b', fg2: '#7c3aed', useGrad: true, bg: '#ffffff',
    dots: 'rounded', eye: 'rounded', eyeColor: '',
    frame: true, frameColor: '#1e1b4b',
    logo: '', centerText: '', centerBg: '#ffffff', centerColor: '#1e1b4b',
    captionMode: 'name', captionText: '', captionColor: '#ffffff',
    caption: '', reserve: false, size: 900,
  };
  const FONT = "Fredoka, 'Trebuchet MS', system-ui, sans-serif";

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function shape(ctx, x, y, s, type) {
    if (type === 'circle') { ctx.moveTo(x + s, y + s / 2); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); ctx.closePath(); }
    else if (type === 'rounded') rr(ctx, x, y, s, s, s * 0.3);
    else ctx.rect(x, y, s, s);
  }
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  async function render(canvas, text, opts) {
    const o = Object.assign({}, DEF, opts || {});
    const tk = (canvas._tk = (canvas._tk || 0) + 1);
    let img = null;
    if (o.logo) { try { img = await loadImg(o.logo); } catch (e) { img = null; } }
    try { if (document.fonts && document.fonts.load) await document.fonts.load('600 40px Fredoka'); } catch (e) { /* sin fuente */ }
    if (canvas._tk !== tk) return; // llegó un render más nuevo

    const S = o.size;
    const capH = (o.caption || o.reserve) ? Math.round(S * 0.15) : 0;
    const W = S, H = S + capH;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const R = S * 0.07;

    ctx.fillStyle = o.frame ? o.frameColor : o.bg;
    ctx.beginPath(); rr(ctx, 0, 0, W, H, R); ctx.fill();

    const pad = o.frame ? S * 0.055 : 0;
    const inner = S - 2 * pad;
    if (o.frame) { ctx.fillStyle = o.bg; ctx.beginPath(); rr(ctx, pad, pad, inner, inner, R * 0.6); ctx.fill(); }

    const hasCenter = !!(img || o.centerText);
    const qr = qrcode(0, hasCenter ? 'H' : 'Q');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const ip = inner * 0.085;
    const m = (inner - 2 * ip) / n;
    const ox = pad + ip, oy = pad + ip;

    let fill = o.fg;
    if (o.useGrad && o.fg2) {
      const g = ctx.createLinearGradient(ox, oy, ox + n * m, oy + n * m);
      g.addColorStop(0, o.fg); g.addColorStop(1, o.fg2);
      fill = g;
    }

    // módulos
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c)) continue;
        if ((r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)) continue; // ojos aparte
        const x = ox + c * m, y = oy + r * m;
        if (o.dots === 'dots') { ctx.moveTo(x + m * 0.92, y + m / 2); ctx.arc(x + m / 2, y + m / 2, m * 0.43, 0, Math.PI * 2); ctx.closePath(); }
        else if (o.dots === 'rounded') rr(ctx, x + m * 0.04, y + m * 0.04, m * 0.92, m * 0.92, m * 0.34);
        else ctx.rect(x - 0.3, y - 0.3, m + 0.6, m + 0.6);
      }
    }
    ctx.fill();

    // ojos
    ctx.fillStyle = o.eyeColor || fill;
    for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      const x = ox + c * m, y = oy + r * m;
      ctx.beginPath(); shape(ctx, x, y, 7 * m, o.eye); shape(ctx, x + m, y + m, 5 * m, o.eye); ctx.fill('evenodd');
      ctx.beginPath(); shape(ctx, x + 2 * m, y + 2 * m, 3 * m, o.eye); ctx.fill();
    }

    // centro: logo o texto/emoji
    const cx = ox + (n * m) / 2, cy = oy + (n * m) / 2, L = n * m * 0.24;
    if (img) {
      ctx.fillStyle = o.bg; ctx.beginPath(); rr(ctx, cx - L * 0.62, cy - L * 0.62, L * 1.24, L * 1.24, L * 0.3); ctx.fill();
      ctx.save(); ctx.beginPath(); rr(ctx, cx - L / 2, cy - L / 2, L, L, L * 0.25); ctx.clip();
      const k = Math.max(L / img.width, L / img.height), w = img.width * k, h = img.height * k;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
    } else if (o.centerText) {
      ctx.fillStyle = o.centerBg; ctx.beginPath(); ctx.arc(cx, cy, L * 0.68, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.centerColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${L * 0.7}px ${FONT}`;
      ctx.fillText(Array.from(o.centerText).slice(0, 3).join(''), cx, cy + L * 0.04);
    }

    // nombre debajo
    if (o.caption) {
      ctx.fillStyle = o.captionColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let fs = capH * 0.52;
      ctx.font = `600 ${fs}px ${FONT}`;
      while (ctx.measureText(o.caption).width > W * 0.86 && fs > 12) { fs -= 2; ctx.font = `600 ${fs}px ${FONT}`; }
      ctx.fillText(o.caption, W / 2, (S - pad + H) / 2);
    }
  }

  window.QRStyle = {
    DEF,
    render,
    async toBlob(text, opts) {
      const c = document.createElement('canvas');
      await render(c, text, opts);
      return new Promise((res) => c.toBlob(res, 'image/png'));
    },
  };
})();
