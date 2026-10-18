/* Editor visual de cartas: lienzo libre con capas (fotos, textos, stickers, sello, QR…) */
(() => {
  'use strict';
  const { $, $$, esc, toast, api } = QP;
  const CV = CardView;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const r2 = (n) => Math.round(n * 100) / 100;

  const EMOJIS = [
    ['Amor', '❤️ 💕 💖 💘 💝 💌 🌹 🥰 😍 😘 💋 💍 💞 💗 🫶 💑 🧸 🍫 🥂 🕯️'],
    ['Fiesta', '🎉 🎊 🎈 🎂 🎁 🍾 🥳 ✨ 🎆 🎇 🪩 🎶 🧁 🍭 🪅 🎀'],
    ['Naturaleza', '🌸 🌺 🌻 🌷 🌿 🍀 🌈 ☀️ 🌙 ⭐ 🔥 🌊 🦋 🐝 🍃 🌴 🍂 ❄️ 🌼 🪻'],
    ['Animales', '🐶 🐱 🐼 🦄 🐻 🐰 🦊 🐢 🐧 🦁 🐬 🦉 🐸 🐥'],
    ['Detalles', '👑 💎 🔮 🕊️ 🪄 ⚜️ 🧿 🗝️ 📜 🪶 ✉️ 📷 🎵 🏆 🎭 🪐'],
    ['Viajes', '✈️ 🏖️ 🗺️ ⛵ 🏔️ 🚀 🌍 🎡 🚲 ⛺ 🏝️ 🧳'],
  ].map(([n, s]) => [n, s.split(' ')]);

  function readImage(file, max, png) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
          const k = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          const x = c.getContext('2d');
          if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
          x.drawImage(im, 0, 0, c.width, c.height);
          res({ url: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.84), ar: im.width / im.height });
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  const keepAlpha = (f) => /png|webp|gif|svg/.test(f.type);

  const TABS = [['tpl', '✨', 'Diseños'], ['bg', '🎨', 'Papel'], ['add', '➕', 'Añadir'], ['el', '🎛', 'Elemento'], ['lay', '📑', 'Capas'], ['frm', '🖼', 'Marco'], ['qr', '🔳', 'QR'], ['ext', '📬', 'Extras']];
  const QR_PRESETS = [
    { n: 'Violeta', v: { fg: '#1e1b4b', fg2: '#7c3aed', useGrad: true, bg: '#ffffff', frameColor: '#1e1b4b', captionColor: '#ffffff', eyeColor: '' } },
    { n: 'Neón', v: { fg: '#0f172a', fg2: '#0891b2', useGrad: true, bg: '#ffffff', frameColor: '#0f172a', captionColor: '#67e8f9', eyeColor: '#0f172a' } },
    { n: 'Fuego', v: { fg: '#7f1d1d', fg2: '#f97316', useGrad: true, bg: '#fff7ed', frameColor: '#7f1d1d', captionColor: '#fde68a', eyeColor: '' } },
    { n: 'Bosque', v: { fg: '#14532d', fg2: '#22c55e', useGrad: true, bg: '#f0fdf4', frameColor: '#14532d', captionColor: '#bbf7d0', eyeColor: '' } },
    { n: 'Rosa', v: { fg: '#831843', fg2: '#ec4899', useGrad: true, bg: '#fff1f2', frameColor: '#831843', captionColor: '#ffffff', eyeColor: '' } },
    { n: 'Vino', v: { fg: '#5b1220', fg2: '#9b1c2e', useGrad: true, bg: '#fbf3e0', frameColor: '#7a1f2b', captionColor: '#fbf3e0', eyeColor: '' } },
    { n: 'Oro', v: { fg: '#3b2a0c', fg2: '#a9822c', useGrad: true, bg: '#fff8e1', frameColor: '#3b2a0c', captionColor: '#f4d77a', eyeColor: '' } },
    { n: 'Clásico', v: { fg: '#000000', fg2: '#000000', useGrad: false, bg: '#ffffff', frameColor: '#000000', captionColor: '#ffffff', eyeColor: '' } },
  ];

  function open(c, ctx) {
    const tplList = window.CardTpl || [];
    const ed = c
      ? { id: c.id, isNew: false, name: c.name, data: CV.norm(clone(c.data || {})), qr: Object.assign({}, QRStyle.DEF, c.qr || {}) }
      : { id: ctx.newId(), isNew: true, name: '', data: tplList.length ? tplList[0].make() : CV.newData(), qr: Object.assign({}, QRStyle.DEF, tplList.length ? tplList[0].qr || {} : {}) };
    if (!ed.data.env) ed.data.env = { on: 0, color: '#e8d9b5', seal: '#9b1c2e', glyph: '❤' };
    if (!ed.data.fx) ed.data.fx = { particles: '', mode: 'fall' };
    let side = 'front', selId = null, tab = c ? 'el' : 'tpl', dirty = false, qrNow = '', qrKey = '', fileMode = null, raf = 0;
    const hist = [], pool = new Map(), rev = new Map();
    let hi = -1, poolN = 0;

    const face = () => { const s = ed.data[side] || (ed.data[side] = CV.emptyFace()); if (!s.fx) s.fx = { vig: 0, vc: '#3a2410', gloss: 0 }; if (!s.frame) s.frame = { style: 'none', color: '#c9a24b', w: 1, inset: 3 }; if (!s.layers) s.layers = []; if (!s.bg) s.bg = Object.assign({}, CV.BG_PRESETS[0].bg); return s; };
    const layers = () => face().layers;
    const selL = () => layers().find((l) => l.id === selId) || null;

    const m = document.createElement('div');
    m.className = 'modal';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="mbox xl"><div class="mh ceh">
        <h2>${ed.isNew ? 'Nueva carta' : 'Editar carta'}</h2>
        <input class="cname" data-b="E.name" maxlength="60" placeholder="Nombre de la carta" aria-label="Nombre de la carta">
        <div class="sidesw" role="group" aria-label="Lado de la carta"><button type="button" data-side="front" class="on">Frente</button><button type="button" data-side="back">Reverso</button></div>
        <span class="sp"></span>
        <button type="button" class="btn ghost sm" id="eundo" title="Deshacer (Ctrl+Z)">↶</button><button type="button" class="btn ghost sm" id="eredo" title="Rehacer (Ctrl+Y)">↷</button>
        <button class="x" id="ex" aria-label="Cerrar">✕</button></div>
      <div class="cedit"><div class="cstage"><div class="cs-view" id="sview"><div class="stage" id="stg"></div></div>
          <div class="cs-hint mut small">Arrastra para mover · esquinas para agrandar · punto de arriba para girar · <b>Supr</b> borra · doble clic para editar texto · arrastra fotos aquí para añadirlas</div></div>
        <div class="cpanel"><div class="ctabs" id="ctabs" role="tablist">${TABS.map((t) => `<button type="button" role="tab" data-tab="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('')}</div><div class="cpbody" id="pbody"></div></div></div>
      <div class="mf"><button type="button" class="btn ghost" id="cdl">⬇️<span class="hsm"> Descargar QR</span></button><span class="sp"></span><span class="mut small" id="esave"></span><button type="button" class="btn ghost" id="ccan">Cancelar</button><button type="button" class="btn primary" id="csave">💾 Guardar<span class="hsm"> carta</span></button></div></div>
      <input type="file" id="ef" accept="image/*" hidden><input type="file" id="efm" accept="image/*" multiple hidden>`;
    document.body.appendChild(m);
    const stg = $('#stg', m), view = $('#sview', m), pbody = $('#pbody', m);

    /* ── acceso a datos por ruta "X.campo" ── */
    const ROOTS = { L: selL, F: face, B: () => face().bg, FR: () => face().frame, FX: () => face().fx, D: () => ed.data, Q: () => ed.qr, V: () => ed.data.env, P: () => ed.data.fx, E: () => ed };
    const getB = (p) => { const i = p.indexOf('.'), o = ROOTS[p.slice(0, i)](); return o == null ? undefined : o[p.slice(i + 1)]; };
    const setB = (p, v) => { const i = p.indexOf('.'), o = ROOTS[p.slice(0, i)](); if (o) o[p.slice(i + 1)] = v; };

    /* ── historial (deshacer / rehacer) ── */
    const snap = () => JSON.stringify({ d: ed.data, q: ed.qr, n: ed.name }, (k, v) => {
      if (typeof v === 'string' && v.length > 1500 && v.startsWith('data:')) {
        let id = pool.get(v);
        if (!id) { id = '@img' + (++poolN); pool.set(v, id); rev.set(id, v); }
        return id;
      }
      return v;
    });
    const unsnap = (s) => JSON.parse(s, (k, v) => (typeof v === 'string' && v.startsWith('@img') ? rev.get(v) : v));
    function pushHist() {
      const s = snap();
      if (s === hist[hi]) return;
      hist.length = hi + 1; hist.push(s);
      if (hist.length > 60) hist.shift();
      hi = hist.length - 1;
      if (hist.length > 1) dirty = true;
      updUndo();
    }
    function goHist(i) {
      if (i < 0 || i >= hist.length) return;
      hi = i;
      const o = unsnap(hist[hi]);
      ed.data = o.d; ed.qr = o.q; ed.name = o.n;
      if (side === 'back' && !ed.data.back) side = 'front';
      dirty = true;
      afterRestore();
    }
    function afterRestore() {
      if (!selL()) selId = null;
      $('.cname', m).value = ed.name;
      $$('[data-side]', m).forEach((b) => b.classList.toggle('on', b.dataset.side === side));
      refreshQR(); renderStage(); renderPanel(); updUndo();
    }
    const updUndo = () => { $('#eundo', m).disabled = hi <= 0; $('#eredo', m).disabled = hi >= hist.length - 1; };

    /* ── QR de la vista previa ── */
    function refreshQR() {
      const url = ctx.cardUrl(ed.id), opts = CV.qrOptions({ name: ed.name, qr: ed.qr }), key = url + JSON.stringify(opts);
      if (key === qrKey) return;
      qrKey = key;
      CV.qrSrc(url, opts).then((src) => {
        if (key !== qrKey || !m.isConnected) return;
        qrNow = src; renderStage();
        const pv = $('#qrprev', m); if (pv) pv.src = src;
      }).catch(() => {});
    }

    /* ── lienzo ── */
    function fit() {
      const rt = CV.ratioOf(ed.data), w = view.clientWidth - 40, h = view.clientHeight - 40;
      if (w < 50 || h < 50) return;
      stg.style.setProperty('--cw', Math.floor(clamp(Math.min(w, h * rt), 160, 620)) + 'px');
      updateSelBox();
    }
    function renderStage() {
      clearTimeout(raf);
      raf = setTimeout(() => {
        if (!m.isConnected) return;
        stg.innerHTML = CV.html(ed.name, ed.data, { side, edit: true, qrSrc: qrNow || undefined, qr: ed.qr })
          + '<div class="selbox" hidden><i class="hd" data-h="nw"></i><i class="hd" data-h="ne"></i><i class="hd" data-h="se"></i><i class="hd" data-h="sw"></i><i class="hd rot" data-h="rot"></i></div><i class="gd gdx" hidden></i><i class="gd gdy" hidden></i>';
        fit();
      }, 12);
    }
    function renderNow() { clearTimeout(raf); stg.innerHTML = CV.html(ed.name, ed.data, { side, edit: true, qrSrc: qrNow || undefined, qr: ed.qr }) + '<div class="selbox" hidden><i class="hd" data-h="nw"></i><i class="hd" data-h="ne"></i><i class="hd" data-h="se"></i><i class="hd" data-h="sw"></i><i class="hd rot" data-h="rot"></i></div><i class="gd gdx" hidden></i><i class="gd gdy" hidden></i>'; fit(); }
    const tcard = () => $('.tcard', stg);
    const lyEl = (id) => stg.querySelector(`.ly[data-id="${id}"]`);
    function updateSelBox() {
      const sb = $('.selbox', stg), l = selL(), el = l && lyEl(l.id);
      if (!sb) return;
      if (!el) { sb.hidden = true; return; }
      sb.hidden = false;
      sb.style.cssText = `left:${l.x}%;top:${l.y}%;width:${el.offsetWidth}px;height:${el.offsetHeight}px;transform:translate(-50%,-50%) rotate(${l.r || 0}deg)`;
      sb.classList.toggle('lk', !!l.lock);
    }
    function select(id, auto) {
      selId = id;
      updateSelBox();
      if (auto && id && tab !== 'el' && tab !== 'lay') setTab('el'); else renderPanel();
    }

    /* ── mover / escalar / girar con el puntero ── */
    const guide = (k, on) => { const g = $('.gd' + k, stg); if (g) g.hidden = !on; };
    function startMove(e, l) {
      const rect = tcard().getBoundingClientRect(), sx = e.clientX, sy = e.clientY, x0 = l.x, y0 = l.y, el = lyEl(l.id);
      let moved = false;
      const mv = (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
        moved = true;
        let nx = x0 + (ev.clientX - sx) / rect.width * 100, ny = y0 + (ev.clientY - sy) / rect.height * 100;
        const snapX = Math.abs(nx - 50) < 1.3, snapY = Math.abs(ny - 50) < 1.3;
        if (snapX && !ev.altKey) nx = 50; if (snapY && !ev.altKey) ny = 50;
        guide('x', snapX && !ev.altKey); guide('y', snapY && !ev.altKey);
        l.x = r2(clamp(nx, -10, 110)); l.y = r2(clamp(ny, -10, 110));
        if (el) { el.style.left = l.x + '%'; el.style.top = l.y + '%'; }
        updateSelBox(); syncInputs();
      };
      const up = () => {
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
        guide('x', false); guide('y', false);
        if (moved) { renderStage(); pushHist(); }
        else if (l.t === 'image' && !l.src) pickFile('layer');
      };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    }
    function startXform(kind, e) {
      const l = selL(); if (!l || l.lock) return;
      e.preventDefault(); e.stopPropagation();
      const rect = tcard().getBoundingClientRect(), el = lyEl(l.id);
      const cx = rect.left + l.x / 100 * rect.width, cy = rect.top + l.y / 100 * rect.height;
      const a0 = Math.atan2(e.clientY - cy, e.clientX - cx), r0 = l.r || 0, d0 = Math.max(10, Math.hypot(e.clientX - cx, e.clientY - cy)), w0 = l.w, s0 = l.size;
      const mv = (ev) => {
        if (kind === 'rot') {
          let r = r0 + (Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) * 180 / Math.PI;
          r = ((r + 540) % 360) - 180;
          if (!ev.shiftKey) { const q = Math.round(r / 45) * 45; if (Math.abs(r - q) < 4) r = q; }
          l.r = Math.round(r);
          if (el) el.style.transform = `translate(-50%,-50%) rotate(${l.r}deg)`;
        } else {
          const k = Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0;
          l.w = r2(clamp(w0 * k, 3, 190));
          if (el) el.style.width = CV.em(l.w);
          if (l.t === 'text') {
            l.size = r2(clamp(s0 * k, 1, 80));
            const tx = el && el.querySelector('.tx'); if (tx) tx.style.fontSize = CV.em(l.size);
            if (l.curve && el) el.outerHTML = CV.layerHtml(l, ed.data, ed.name, { edit: true, side, qr: ed.qr });
          }
        }
        updateSelBox(); syncInputs();
      };
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); renderStage(); pushHist(); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    }
    stg.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      const h = e.target.closest('.hd');
      if (h) return startXform(h.dataset.h, e);
      const el = e.target.closest('.ly');
      if (el) {
        select(el.dataset.id, true);
        const l = selL();
        if (l && !l.lock) startMove(e, l);
        e.preventDefault();
      } else select(null);
    });
    stg.addEventListener('dblclick', (e) => {
      const el = e.target.closest('.ly'); if (!el) return;
      const l = selL(); if (l && l.t === 'text') { setTab('el'); const t = $('[data-b="L.text"]', m); if (t) t.focus(); }
    });
    ['dragover', 'drop'].forEach((ev) => view.addEventListener(ev, (e) => {
      if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
      e.preventDefault();
      if (ev === 'drop') addImages([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
    }));
    const onPaste = (e) => {
      const fs = [...((e.clipboardData && e.clipboardData.files) || [])].filter((f) => f.type.startsWith('image/'));
      if (fs.length) { e.preventDefault(); addImages(fs); }
    };
    document.addEventListener('paste', onPaste);

    /* ── añadir elementos ── */
    function place(l) {
      const n = layers().length;
      l.x = l.x === 50 ? clamp(50 + (n % 4) * 3, 0, 100) : l.x;
      l.y = l.y === 50 ? clamp(50 + (n % 4) * 3, 0, 100) : l.y;
      layers().push(l);
      selId = l.id; renderNow(); setTab('el'); pushHist();
    }
    async function addImages(files) {
      for (const f of files.slice(0, 6)) {
        try {
          const im = await readImage(f, 1100, keepAlpha(f));
          const wide = im.ar >= 1;
          place(CV.newLayer('image', { src: im.url, ar: r2(im.ar), nar: r2(im.ar), w: wide ? 62 : 46, shape: keepAlpha(f) && /png|webp|gif/.test(f.type) ? 'rect' : 'rrect', border: 'none', shd: keepAlpha(f) ? 1 : 1 }));
        } catch (x) { toast('No se pudo leer esa imagen', 'err'); }
      }
    }
    function pickFile(mode) { fileMode = mode; const f = mode === 'multi' ? $('#efm', m) : $('#ef', m); f.value = ''; f.click(); }
    $('#efm', m).onchange = (e) => addImages([...e.target.files]);
    $('#ef', m).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        if (fileMode === 'layer') {
          const l = selL(); if (!l) return;
          const im = await readImage(f, 1100, keepAlpha(f));
          l.src = im.url; l.nar = r2(im.ar); l.ar = r2(im.ar); l.zoom = 1; l.px = 50; l.py = 50;
        } else if (fileMode === 'bg') {
          const im = await readImage(f, 1400, false); face().bg.img = im.url; face().bg.kind = 'image';
        } else if (fileMode === 'logo') {
          ed.qr.logo = (await readImage(f, 320, true)).url; refreshQR();
        } else if (fileMode === 'qbg') {
          ed.qr.bgImage = (await readImage(f, 700, false)).url; refreshQR();
        }
        renderNow(); renderPanel(); pushHist();
      } catch (x) { toast('No se pudo leer esa imagen', 'err'); }
    };

    /* ── ayudantes de controles ── */
    const rng = (lab, b, min, max, step, u) => `<label class="rg"><span>${lab}</span><output data-v="${b}" data-u="${u || ''}"></output><input type="range" data-b="${b}" min="${min}" max="${max}" step="${step}"></label>`;
    const clr = (lab, b) => `<label>${lab}<input type="color" data-b="${b}"></label>`;
    const sel = (lab, b, opts, rp) => `<label>${lab}<select data-b="${b}"${rp ? ' data-rp' : ''}>${opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`;
    const chk = (lab, b, rp) => `<label class="chk"><input type="checkbox" data-b="${b}"${rp ? ' data-rp' : ''}> ${lab}</label>`;
    const txt = (lab, b, ph, max) => `<label>${lab}<input data-b="${b}" maxlength="${max || 60}" placeholder="${esc(ph || '')}"></label>`;
    const sec = (t, inner, open) => `<details class="sec"${open === false ? '' : ' open'}><summary>${t}</summary>${inner}</details>`;
    const btn = (act, label, extra, cls) => `<button type="button" class="btn ${cls || 'ghost'} sm" data-act="${act}" ${extra || ''}>${label}</button>`;
    const chips = (act, items, cur, fn) => `<div class="chips">${items.map(([v, t, st]) => `<button type="button" class="chip2${v === cur ? ' on' : ''}" data-act="${act}" data-v="${esc(v)}"${st ? ` style="${st}"` : ''}>${t}</button>`).join('')}</div>`;

    function syncInputs(skip) {
      $$('[data-b]', m).forEach((el) => {
        if (el === skip || el === document.activeElement && el.type !== 'range') return;
        const v = getB(el.dataset.b);
        if (el.type === 'checkbox') el.checked = !!v; else if (document.activeElement !== el) el.value = v == null ? '' : v;
      });
      $$('output[data-v]', m).forEach((o) => { const v = getB(o.dataset.v); o.textContent = v == null ? '' : (Math.round(v * 100) / 100) + (o.dataset.u || ''); });
    }

    /* ── paneles ── */
    function setTab(t) {
      tab = t;
      $$('[data-tab]', m).forEach((b) => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
      renderPanel();
      const on = $('[data-tab].on', m); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function renderPanel() {
      const f = { tpl: pTpl, bg: pBg, add: pAdd, el: pEl, lay: pLay, frm: pFrm, qr: pQr, ext: pExt }[tab];
      pbody.innerHTML = f();
      $$('[data-tab]', m).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
      syncInputs();
    }

    const shIcon = (k) => {
      const e = CV.SHAPES[k], vb = e[2] || [100, 100], stroke = CV.STROKE_KINDS.includes(k);
      const x = -4, y = e[2] ? -(vb[0] - vb[1]) / 2 - 4 : -4, w = vb[0] + 8;
      return `<svg viewBox="${x} ${y} ${w} ${w}"><path d="${e[1]}" ${stroke ? `stroke="currentColor" stroke-width="${e[2] ? 2.2 : 9}" fill="none" stroke-linecap="round"` : 'fill="currentColor"'}/></svg>`;
    };

    let tplCat = 'Todos';
    function pTpl() {
      const q = qrNow || CV.PX, cats = tplList.cats || ['Todos'];
      return `<p class="mut small">Elige un punto de partida y cámbialo todo: textos, fotos, colores, papel, marco… Todo es editable.</p>
        ${chips('tplcat', cats.map((c) => [c, c]), tplCat)}
        <div class="tpls">${tplList.map((t, i) => (tplCat === 'Todos' || t.cat === tplCat) ? `<button type="button" class="tplb" data-act="tpl" data-v="${i}"><div style="--cw:104px">${CV.html('Nombre', t.make(), { qrSrc: q, qr: Object.assign({}, ed.qr, t.qr), cls: 'mini' })}</div><span>${esc(t.n)}</span><small>${esc(t.cat)}</small></button>` : '').join('')}</div>`;
    }
    function pBg() {
      const b = face().bg, k = b.kind || 'color';
      return `<p class="mut small">Estás editando el <b>${side === 'front' ? 'frente' : 'reverso'}</b>.</p>`
        + sec('Papeles y fondos listos', `<div class="swgrid">${CV.BG_PRESETS.map((p, i) => `<button type="button" class="swb" data-act="bgp" data-v="${i}" title="${esc(p.n)}" aria-label="${esc(p.n)}">${CV.bgHtml(p.bg)}${CV.texHtml(p.bg)}</button>`).join('')}</div>`)
        + sec('Color y degradado', sel('Tipo', 'B.kind', [['color', 'Color liso'], ['gradient', 'Degradado'], ['radial', 'Degradado circular'], ['image', 'Foto de fondo']], true)
          + `<div class="g2">${clr('Color 1', 'B.c1')}${k === 'gradient' || k === 'radial' ? clr('Color 2', 'B.c2') : ''}</div>`
          + (k === 'gradient' ? rng('Ángulo', 'B.angle', 0, 360, 5, '°') : '')
          + (k === 'image' ? `${btn('bgimg', '🖼 Elegir foto de fondo')}${rng('Oscurecer / aclarar', 'B.shade', -80, 80, 5)}` : ''))
        + sec('Textura de papel', sel('Textura', 'B.tex', [['', 'Lisa'], ...Object.entries(CV.TEXTURES).map(([v, t]) => [v, t[0]])])
          + rng('Intensidad', 'B.texAmt', 0, 100, 5, '%'))
        + sec('Patrón decorativo', sel('Patrón', 'B.pattern', [['', 'Ninguno'], ...Object.entries(CV.PATTERNS).map(([v, t]) => [v, t[0]])])
          + `<div class="g2">${clr('Color', 'B.pc')}</div>${rng('Visibilidad', 'B.pa', 3, 100, 1, '%')}${rng('Tamaño', 'B.ps', 0.4, 3, 0.1, '×')}`, false)
        + sec('Luz y bordes', rng('Viñeta (bordes oscuros)', 'FX.vig', 0, 100, 5, '%') + clr('Color de la viñeta', 'FX.vc')
          + chk('✨ Brillo satinado', 'FX.gloss') + rng('Esquinas redondeadas', 'D.radius', 0, 14, 0.5), false);
    }
    function pFrm() {
      const fr = face().frame;
      return `<p class="mut small">Un marco le da a la carta ese aire de impreso de verdad.</p>`
        + chips('frame', Object.entries(CV.FRAMES), fr.style || 'none')
        + `<div class="g2">${clr('Color del marco', 'FR.color')}</div>`
        + `<div class="presets">${['#c9a24b', '#e9c46a', '#ffffff', '#111111', '#9b1c2e', '#d4a5a5', '#2d6a4f', '#1d4e89'].map((c) => `<button type="button" class="pre" data-act="frc" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>`
        + rng('Grosor', 'FR.w', 0.3, 4, 0.1) + rng('Distancia al borde', 'FR.inset', 0, 10, 0.5);
    }
    function pAdd() {
      const q = CV.findQR(ed.data);
      return sec('Texto', `<div class="addg">${[['title', 'Título'], ['sub', 'Subtítulo'], ['para', 'Párrafo'], ['sign', 'Firma'], ['name', 'Nombre de la carta'], ['curve', 'Texto curvo']].map(([k, t]) => btn('addtext', t, `data-v="${k}"`)).join('')}</div>`)
        + sec('Fotos', `${btn('addphoto', '📷 Subir fotos', '', 'primary')}<p class="mut small">También puedes arrastrarlas al lienzo o pegarlas con Ctrl+V. Luego elige una forma (corazón, círculo, arco…), marco polaroid y filtros.</p>`)
        + sec('Stickers y emojis', EMOJIS.map(([n, list]) => `<h5>${n}</h5><div class="emg">${list.map((e) => `<button type="button" data-act="addemoji" data-v="${e}">${e}</button>`).join('')}</div>`).join('') + `<label>Otro emoji o símbolo<input id="emo" maxlength="6" placeholder="Pégalo o escríbelo y pulsa Enter"></label>`)
        + sec('Formas y adornos', `<div class="shg">${Object.entries(CV.SHAPES).map(([k, e]) => `<button type="button" data-act="addshape" data-v="${k}" title="${e[0]}">${shIcon(k)}</button>`).join('')}</div>`)
        + sec('Detalles realistas', `<div class="addg">${btn('addseal', '🔴 Sello de lacre')}${btn('addtape', '🎀 Cinta washi')}</div>`)
        + sec('Código QR', q ? `<p class="mut small">El QR ya está en el ${q.side === 'front' ? 'frente' : 'reverso'}.</p>${btn('selqr', 'Seleccionar el QR')}` : `${btn('addqr', '🔳 Poner el QR en esta carta', '', 'primary')}<p class="mut small">Es el QR que abre esta carta. Se estiliza en la pestaña “QR”.</p>`);
    }
    function pLay() {
      const ls = layers();
      if (!ls.length) return '<p class="mut">Este lado está vacío. Añade elementos desde “Añadir” o elige un diseño.</p>';
      const name = (l) => ({ text: l.bind === 'name' ? '🏷 ' + (ed.name || 'Nombre') : '🔤 ' + (l.text || '').split('\n')[0].slice(0, 22), image: '📷 Foto', shape: '◆ ' + (CV.SHAPES[l.kind] || ['Forma'])[0], emoji: '😀 ' + (l.e || ''), seal: '🔴 Sello', tape: '🎀 Cinta', qr: '🔳 Código QR' }[l.t] || l.t);
      return `<p class="mut small">De arriba hacia abajo (lo de arriba tapa a lo de abajo).</p><div class="laylist">${[...ls].reverse().map((l) => `<div class="lrow${l.id === selId ? ' on' : ''}${l.hide ? ' off' : ''}" data-lid="${l.id}"><button type="button" class="lname" data-act="lsel" data-v="${l.id}">${esc(name(l))}</button>
        <button type="button" class="ib" data-act="lhide" data-v="${l.id}" title="Mostrar/ocultar">${l.hide ? '🚫' : '👁'}</button><button type="button" class="ib" data-act="llock" data-v="${l.id}" title="Bloquear">${l.lock ? '🔒' : '🔓'}</button>
        <button type="button" class="ib" data-act="lup" data-v="${l.id}" title="Subir">▲</button><button type="button" class="ib" data-act="ldown" data-v="${l.id}" title="Bajar">▼</button></div>`).join('')}</div>`;
    }
    function pEl() {
      const l = selL();
      if (!l) return '<div class="empty-sel"><div style="font-size:2.2rem">👆</div><p>Toca cualquier elemento de la carta para editarlo.</p><p class="mut small">O añade uno nuevo desde “Añadir”.</p></div>';
      let h = '';
      if (l.t === 'text') {
        h += sec('Texto', (l.bind === 'name' ? '<p class="mut small">Muestra el nombre de la carta (se cambia arriba).</p>' : `<label>Contenido<textarea data-b="L.text" rows="3" maxlength="400"></textarea></label>`)
          + `<label class="chk"><input type="checkbox" data-bind${l.bind === 'name' ? ' checked' : ''}> Usar el nombre de la carta</label>`)
          + sec('Letra', `<div class="fontg">${CV.FONTS.map((f) => `<button type="button" class="fbtn${l.font === f.id ? ' on' : ''}" data-act="font" data-v="${f.id}" style="font-family:${CV.fontCss(f.id)}">${f.n}</button>`).join('')}</div>`
            + rng('Tamaño', 'L.size', 1.5, 40, 0.5) + `<div class="g2">${sel('Relleno', 'L.fill', [['solid', 'Color liso'], ...Object.entries(CV.FOIL_NAMES).map(([v, t]) => [v, '✨ ' + t])], true)}${l.fill === 'solid' || !l.fill ? clr('Color', 'L.color') : '<span></span>'}</div>`
            + `<div class="tgl">${['b|<b>N</b>|Negrita', 'i|<i>K</i>|Cursiva', 'up|Aa|Mayúsculas'].map((s) => { const [k, t, ti] = s.split('|'); return `<button type="button" class="tg${l[k] ? ' on' : ''}" data-act="tgl" data-v="${k}" title="${ti}">${t}</button>`; }).join('')}${['left|⯇', 'center|≡', 'right|⯈'].map((s) => { const [k, t] = s.split('|'); return `<button type="button" class="tg${l.al === k ? ' on' : ''}" data-act="align" data-v="${k}">${t}</button>`; }).join('')}</div>`
            + rng('Espaciado entre letras', 'L.ls', -0.05, 0.6, 0.01) + rng('Interlineado', 'L.lh', 0.8, 2.2, 0.05))
          + sec('Efectos', sel('Sombra / efecto', 'L.sh', Object.entries(CV.SHADOWS)) + clr('Color del efecto', 'L.sc') + rng('Curvar el texto', 'L.curve', -100, 100, 2), false);
      } else if (l.t === 'image') {
        h += sec('Foto', `${btn('swapimg', '🔄 Cambiar foto')} ${l.nar ? btn('origar', 'Proporción original') : ''}`
          + `<h5>Forma</h5><div class="shg sm">${CV.IMG_SHAPES.map((k) => `<button type="button" class="${l.shape === k ? 'on' : ''}" data-act="ishape" data-v="${k}" title="${k}"><svg viewBox="-4 -4 108 108"><path d="${k === 'rect' ? 'M5 15H95V85H5Z' : CV.SHAPES[k][1]}" fill="currentColor"/></svg></button>`).join('')}</div>`
          + rng('Más alta ⟷ más ancha', 'L.ar', 0.3, 3, 0.01) + rng('Zoom', 'L.zoom', 1, 4, 0.05, '×') + rng('Mover foto ↔', 'L.px', 0, 100, 1) + rng('Mover foto ↕', 'L.py', 0, 100, 1))
          + sec('Marco y filtro', sel('Marco de la foto', 'L.border', [['none', 'Sin marco'], ['white', 'Borde blanco'], ['polaroid', 'Polaroid'], ['gold', 'Dorado'], ['tape', 'Con cinta'], ['shadow', 'Solo sombra']], true)
            + (l.border === 'polaroid' ? txt('Texto del polaroid', 'L.cap', 'Ej: Verano 2024', 30) : '') + (l.border && l.border !== 'none' && l.border !== 'gold' ? clr('Color del marco', 'L.bc') : '')
            + chips('filter', Object.entries(CV.FILTERS).map(([k, v]) => [k, v[0]]), l.filter || 'none') + chk('Sombra', 'L.shd')
            + txt('Emoji si no hay foto', 'L.ph', '📷', 4));
      } else if (l.t === 'shape') {
        const vbk = !!CV.SHAPES[l.kind][2];
        h += sec('Forma', `<div class="shg sm">${Object.entries(CV.SHAPES).map(([k, e]) => `<button type="button" class="${l.kind === k ? 'on' : ''}" data-act="skind" data-v="${k}" title="${e[0]}">${shIcon(k)}</button>`).join('')}</div>`
          + sel('Relleno', 'L.fm', [['solid', 'Color liso'], ['grad', 'Degradado'], ...Object.entries(CV.FOIL_NAMES).map(([v, t]) => [v, '✨ ' + t])], true)
          + `<div class="g2">${(l.fm || 'solid') === 'solid' || l.fm === 'grad' ? clr('Color', 'L.fill') : ''}${l.fm === 'grad' ? clr('Color 2', 'L.fill2') : ''}</div>`
          + (l.kind === 'line' ? rng('Grosor de la línea', 'L.sw', 0.4, 12, 0.1)
            : (vbk ? '' : rng('Más alta ⟷ más ancha', 'L.ar', 0.1, 10, 0.05)) + (vbk || l.kind === 'ring' ? rng('Grosor del trazo', 'L.sw', 0, 8, 0.1)
              : chk('Solo el contorno (hueco)', 'L.hollow') + `<div class="g2">${clr('Color del borde', 'L.stroke')}</div>` + rng('Grosor del borde', 'L.sw', 0, 8, 0.1))
            + rng('Difuminado (acuarela)', 'L.blur', 0, 12, 0.2))
          + chk('Sombra', 'L.shd'));
      } else if (l.t === 'emoji') {
        h += sec('Sticker', txt('Emoji', 'L.e', '❤️', 6) + chk('Borde blanco de sticker', 'L.stick') + chk('Sombra', 'L.shd') + `<div class="emg">${EMOJIS.flatMap(([, a]) => a).slice(0, 40).map((e) => `<button type="button" data-act="swapemoji" data-v="${e}">${e}</button>`).join('')}</div>`);
      } else if (l.t === 'seal') {
        h += sec('Sello de lacre', clr('Color de la cera', 'L.color') + txt('Símbolo o inicial', 'L.glyph', '❤', 3) + chk('Anillo grabado', 'L.ring')
          + `<div class="presets">${['#9b1c2e', '#7a1f2b', '#1f3a5f', '#2d6a4f', '#c9a24b', '#3b2a20', '#6b2d7a'].map((c) => `<button type="button" class="pre" data-act="sealc" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>`);
      } else if (l.t === 'tape') {
        h += sec('Cinta', clr('Color', 'L.color') + sel('Estampado', 'L.pat', [['plain', 'Lisa'], ['stripes', 'Rayas'], ['dots', 'Lunares'], ['check', 'Cuadros']]) + rng('Más gruesa ⟷ más fina', 'L.ar', 1, 8, 0.1));
      } else if (l.t === 'qr') {
        h += sec('Código QR', `<p class="mut small">Estilo, foto en el centro, nombre y colores del QR están en la pestaña “QR”. Aquí lo colocas en la carta.</p>${btn('goqr', '🔳 Ir a estilo del QR')}${chk('Sombra', 'L.shd')}`);
      }
      h += sec('Posición y tamaño', rng('Horizontal', 'L.x', 0, 100, 0.5, '%') + rng('Vertical', 'L.y', 0, 100, 0.5, '%') + rng('Tamaño (ancho)', 'L.w', 3, 190, 0.5) + rng('Giro', 'L.r', -180, 180, 1, '°') + rng('Opacidad', 'L.op', 5, 100, 1, '%')
        + `<div class="addg">${btn('cenx', '↔ Centrar')}${btn('ceny', '↕ Centrar')}${btn('flip', '⇋ Voltear')}</div>`);
      h += `<div class="addg sticky">${btn('dup', '⎘ Duplicar')}${btn('front', '⤒ Al frente')}${btn('back', '⤓ Al fondo')}${btn('lock', l.lock ? '🔒 Bloqueado' : '🔓 Bloquear')}${btn('del', '🗑 Borrar', '', 'danger')}</div>`;
      return h;
    }
    function pQr() {
      const q = ed.qr, hasLogo = !!q.logo, hasBg = !!q.bgImage;
      return `<div class="qrpv"><img id="qrprev" alt="Vista previa del QR" src="${qrNow || CV.PX}"></div>`
        + `<div class="presets">${QR_PRESETS.map((p, i) => `<button type="button" class="pre" data-act="qrp" data-v="${i}" title="${p.n}" aria-label="Estilo ${p.n}" style="background:linear-gradient(135deg,${p.v.fg},${p.v.fg2})"></button>`).join('')}</div>`
        + sec('Forma', `<div class="g2">${sel('Puntos', 'Q.dots', [['square', 'Cuadrados'], ['rounded', 'Redondeados'], ['dots', 'Círculos'], ['heart', 'Corazones ❤'], ['diamond', 'Rombos']])}${sel('Esquinas (ojos)', 'Q.eye', [['square', 'Cuadradas'], ['rounded', 'Redondeadas'], ['circle', 'Circulares']])}</div>`)
        + sec('Colores', `<div class="g3">${clr('Color 1', 'Q.fg')}${clr('Color 2', 'Q.fg2')}${clr('Fondo', 'Q.bg')}</div>${chk('Degradado entre color 1 y 2', 'Q.useGrad')}<div class="g2">${clr('Color de las esquinas', 'Q.eyeColor')}${btn('eyeclr', 'Igual que los puntos')}</div>`)
        + sec('Marco', chk('Marco de color', 'Q.frame') + clr('Color del marco', 'Q.frameColor'))
        + sec('Imagen en el centro', `${btn('qlogo', '🖼 Poner imagen / logo')} ${hasLogo ? btn('qlogox', 'Quitar') : ''}<div class="g3">${txt('O emoji / texto', 'Q.centerText', '🔥', 6)}${clr('Fondo', 'Q.centerBg')}${clr('Texto', 'Q.centerColor')}</div>`)
        + sec('Foto detrás del QR', `${btn('qbg', '🌄 Poner foto de fondo')} ${hasBg ? btn('qbgx', 'Quitar') : ''}${rng('Difuminado (más = se lee mejor)', 'Q.bgFade', 0.5, 0.97, 0.01)}`, false)
        + sec('Nombre debajo del QR', sel('Mostrar', 'Q.captionMode', [['name', 'El nombre de la carta'], ['custom', 'Un texto propio'], ['none', 'Nada']]) + txt('Texto propio', 'Q.captionText', 'Ej: Escanéame', 40) + clr('Color del texto', 'Q.captionColor')
          + `<h5>Letra del nombre</h5><div class="fontg">${[['', 'Redonda', 'Fredoka'], ...CV.FONTS.map((f) => [f.id, f.n, f.id])].map(([v, n, f]) => `<button type="button" class="fbtn${(q.captionFont || '') === v ? ' on' : ''}" data-act="qfont" data-v="${v}" style="font-family:${CV.fontCss(f)}">${n}</button>`).join('')}</div>`, false)
        + `<p class="mut small">Prueba el QR con tu celular antes de imprimir. Con imagen en el centro o foto detrás el QR necesita buen contraste.</p>`;
    }
    function pExt() {
      const e = ed.data.env, p = ed.data.fx;
      return sec('Formato de la carta', chips('ratio', Object.entries(CV.RATIOS).map(([k, v]) => [k, v[2]]), ed.data.ratio || 'portrait'), true)
        + sec('Reverso', ed.data.back ? `<p class="mut small">Esta carta tiene reverso (se voltea al tocarla).</p>${btn('rmback', '🗑 Quitar el reverso', '', 'danger')}` : `<p class="mut small">Como una carta de verdad: texto, dedicatoria o el QR por detrás.</p>${btn('mkback', '＋ Crear el reverso', '', 'primary')}`)
        + sec('Sobre sellado 💌', `<p class="mut small">Al abrir el enlace la carta aparece dentro de un sobre con sello que se abre.</p>${chk('La carta llega en un sobre', 'V.on')}<div class="g3">${clr('Sobre', 'V.color')}${clr('Sello', 'V.seal')}${txt('Símbolo', 'V.glyph', '❤', 3)}</div>`)
        + sec('Lluvia de detalles ✨', `<p class="mut small">Emojis que flotan sobre la carta al verla (solo en pantalla).</p>${txt('Emojis (hasta 4)', 'P.particles', '❤️ ✨', 12)}${sel('Movimiento', 'P.mode', [['fall', 'Caen suave'], ['rise', 'Suben flotando']])}`);
    }

    /* ── acciones (botones) ── */
    const TXT = {
      title: { text: 'Un título especial', font: 'Playfair Display', size: 11, w: 84, b: 1, y: 22 },
      sub: { text: 'Subtítulo', font: 'Cormorant Garamond', size: 6, i: 1, w: 80, y: 36 },
      para: { text: 'Escribe aquí tu mensaje. Puede tener varias líneas y se acomoda solo.', font: 'DM Sans', size: 3.8, lh: 1.5, w: 70, y: 55 },
      sign: { text: 'Con cariño', font: 'Great Vibes', size: 11, w: 70, y: 80, color: '#8f1d2c' },
      name: { text: '', bind: 'name', font: 'Cinzel', size: 8, w: 84, b: 1, y: 16, up: 1 },
      curve: { text: 'Texto en arco', font: 'Playfair Display', size: 8, w: 80, curve: 55, y: 25 },
    };
    function act(a, v, el) {
      const l = selL();
      const upd = (rp) => { renderNow(); if (rp !== false) renderPanel(); pushHist(); };
      switch (a) {
        case 'tplcat': tplCat = v; renderPanel(); break;
        case 'tpl': {
          if (layers().length > 2 && !confirm('Esto reemplaza el diseño actual de la carta. ¿Continuar?')) return;
          const t = tplList[+v]; ed.data = t.make(); if (t.qr) Object.assign(ed.qr, t.qr); side = 'front'; selId = null;
          $$('[data-side]', m).forEach((b) => b.classList.toggle('on', b.dataset.side === 'front'));
          refreshQR(); upd(); break;
        }
        case 'bgp': { Object.assign(face().bg, clone(CV.BG_PRESETS[+v].bg)); upd(); break; }
        case 'bgimg': pickFile('bg'); break;
        case 'frame': face().frame.style = v; upd(); break;
        case 'frc': face().frame.color = v; if (face().frame.style === 'none') face().frame.style = 'line'; upd(); break;
        case 'addtext': { const o = clone(TXT[v]); place(CV.newLayer('text', o)); break; }
        case 'addphoto': pickFile('multi'); break;
        case 'addemoji': place(CV.newLayer('emoji', { e: v, w: 20 })); break;
        case 'addshape': { const vb = CV.SHAPES[v][2]; place(CV.newLayer('shape', { kind: v, w: v === 'line' ? 50 : vb ? 50 : v === 'banner' || v === 'tag' ? 60 : v === 'ticket' ? 60 : 28, ar: vb ? vb[0] / vb[1] : v === 'banner' ? 3 : v === 'ticket' ? 1.9 : v === 'tag' ? 2 : 1, sw: v === 'line' ? 1.5 : 0, fill: '#c9a24b' })); break; }
        case 'addseal': place(CV.newLayer('seal', { y: 60 })); break;
        case 'addtape': place(CV.newLayer('tape', { y: 20 })); break;
        case 'addqr': { place(CV.newLayer('qr', { w: 26, y: side === 'back' ? 50 : 82 })); refreshQR(); break; }
        case 'selqr': { const f = CV.findQR(ed.data); if (f) { side = f.side; $$('[data-side]', m).forEach((b) => b.classList.toggle('on', b.dataset.side === side)); selId = f.layer.id; renderNow(); setTab('el'); } break; }
        case 'goqr': setTab('qr'); break;
        case 'lsel': select(v); break;
        case 'lhide': { const x = layers().find((q) => q.id === v); x.hide = x.hide ? 0 : 1; upd(); break; }
        case 'llock': { const x = layers().find((q) => q.id === v); x.lock = x.lock ? 0 : 1; upd(); break; }
        case 'lup': case 'ldown': { const ls = layers(), i = ls.findIndex((q) => q.id === v), j = a === 'lup' ? i + 1 : i - 1; if (j >= 0 && j < ls.length) { [ls[i], ls[j]] = [ls[j], ls[i]]; upd(); } break; }
        case 'font': l.font = v; upd(); break;
        case 'tgl': l[v] = l[v] ? 0 : 1; upd(); break;
        case 'align': l.al = v; upd(); break;
        case 'ishape': l.shape = v; upd(); break;
        case 'filter': l.filter = v; upd(); break;
        case 'skind': { l.kind = v; const vb = CV.SHAPES[v][2]; if (v === 'line' && !l.sw) l.sw = 1.5; if (vb) l.ar = vb[0] / vb[1]; upd(); break; }
        case 'swapimg': pickFile('layer'); break;
        case 'origar': l.ar = l.nar; upd(); break;
        case 'swapemoji': l.e = v; upd(); break;
        case 'sealc': l.color = v; upd(); break;
        case 'cenx': l.x = 50; upd(); break;
        case 'ceny': l.y = 50; upd(); break;
        case 'flip': l.fl = l.fl ? 0 : 1; upd(); break;
        case 'dup': { const n = clone(l); n.id = CV.uid(); n.x = clamp(n.x + 4, 0, 100); n.y = clamp(n.y + 3, 0, 100); if (n.t === 'qr') { toast('Solo puede haber un QR por carta', 'err'); break; } layers().push(n); selId = n.id; upd(); break; }
        case 'front': { const ls = layers(); ls.splice(ls.indexOf(l), 1); ls.push(l); upd(); break; }
        case 'back': { const ls = layers(); ls.splice(ls.indexOf(l), 1); ls.unshift(l); upd(); break; }
        case 'lock': l.lock = l.lock ? 0 : 1; upd(); break;
        case 'del': { const ls = layers(); ls.splice(ls.indexOf(l), 1); selId = null; upd(); break; }
        case 'qrp': Object.assign(ed.qr, QR_PRESETS[+v].v); refreshQR(); renderPanel(); pushHist(); break;
        case 'eyeclr': ed.qr.eyeColor = ''; refreshQR(); renderPanel(); pushHist(); break;
        case 'qlogo': pickFile('logo'); break;
        case 'qlogox': ed.qr.logo = ''; refreshQR(); renderPanel(); pushHist(); break;
        case 'qbg': pickFile('qbg'); break;
        case 'qbgx': ed.qr.bgImage = ''; refreshQR(); renderPanel(); pushHist(); break;
        case 'qfont': ed.qr.captionFont = v; refreshQR(); renderPanel(); pushHist(); break;
        case 'ratio': ed.data.ratio = v; upd(); break;
        case 'mkback': { const b = CV.emptyFace(clone(ed.data.front.bg)); b.frame = clone(ed.data.front.frame); b.fx = clone(ed.data.front.fx || b.fx); ed.data.back = b; side = 'back'; selId = null; $$('[data-side]', m).forEach((x) => x.classList.toggle('on', x.dataset.side === 'back')); upd(); break; }
        case 'rmback': { if (!confirm('¿Quitar el reverso y todo lo que tiene?')) return; ed.data.back = null; side = 'front'; selId = null; $$('[data-side]', m).forEach((x) => x.classList.toggle('on', x.dataset.side === 'front')); upd(); break; }
        default: break;
      }
    }
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b && m.contains(b)) { e.preventDefault(); act(b.dataset.act, b.dataset.v, b); return; }
      const t = e.target.closest('[data-tab]'); if (t) setTab(t.dataset.tab);
      const s = e.target.closest('[data-side]');
      if (s && s.dataset.side !== side) {
        if (s.dataset.side === 'back' && !ed.data.back) { act('mkback'); return; }
        side = s.dataset.side; selId = null;
        $$('[data-side]', m).forEach((x) => x.classList.toggle('on', x === s));
        renderNow(); renderPanel();
      }
    });

    /* ── entradas ── */
    m.addEventListener('input', (e) => {
      const el = e.target, b = el.dataset && el.dataset.b;
      if (el.id === 'emo') return;
      if (!b) return;
      let v;
      if (el.type === 'checkbox') v = el.checked ? 1 : 0;
      else if (el.type === 'range') v = parseFloat(el.value);
      else v = el.value;
      setB(b, v);
      if (b === 'E.name' || b.startsWith('Q.')) refreshQR();
      if (b === 'L.border' && v === 'polaroid' && selL() && selL().ar > 1) { selL().ar = 0.88; selL().w = Math.min(selL().w, 58); }
      if (b === 'B.tex' && !v) face().bg.texAmt = face().bg.texAmt || 0;
      if (b === 'B.tex' && v && !face().bg.texAmt) face().bg.texAmt = 55;
      if (b === 'B.pattern' && v && !face().bg.pa) face().bg.pa = 18;
      renderStage(); updateSelBox();
      $$('output[data-v]', m).forEach((o) => { const x = getB(o.dataset.v); o.textContent = x == null ? '' : (Math.round(x * 100) / 100) + (o.dataset.u || ''); });
      dirty = true;
    });
    m.addEventListener('change', (e) => {
      const el = e.target;
      if (el.matches && el.matches('[data-bind]')) { const l = selL(); if (l) { l.bind = el.checked ? 'name' : ''; renderNow(); renderPanel(); pushHist(); } return; }
      if (!el.dataset || !el.dataset.b) return;
      pushHist();
      if (el.hasAttribute('data-rp')) { renderPanel(); }
    });
    m.addEventListener('keydown', (e) => {
      if (e.target.id === 'emo' && e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { place(CV.newLayer('emoji', { e: Array.from(v).slice(0, 4).join(''), w: 20 })); } }
    });
    $('#eundo', m).onclick = () => goHist(hi - 1);
    $('#eredo', m).onclick = () => goHist(hi + 1);

    const onKey = (e) => {
      if (!m.isConnected) return;
      const ae = document.activeElement, typing = ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || (ae.tagName === 'INPUT' && !['range', 'checkbox', 'color', 'file'].includes(ae.type)));
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Escape') { tryClose(); return; }
      if (mod && !typing && e.key.toLowerCase() === 'z') { e.preventDefault(); goHist(e.shiftKey ? hi + 1 : hi - 1); return; }
      if (mod && !typing && e.key.toLowerCase() === 'y') { e.preventDefault(); goHist(hi + 1); return; }
      if (typing) return;
      const l = selL(); if (!l) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); act('del'); }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); act('dup'); }
      else if (e.key.startsWith('Arrow') && !(ae && ae.type === 'range') && !l.lock) {
        e.preventDefault();
        const s = e.shiftKey ? 2 : 0.25;
        if (e.key === 'ArrowLeft') l.x = r2(l.x - s); if (e.key === 'ArrowRight') l.x = r2(l.x + s); if (e.key === 'ArrowUp') l.y = r2(l.y - s); if (e.key === 'ArrowDown') l.y = r2(l.y + s);
        renderNow(); syncInputs(); clearTimeout(onKey.t); onKey.t = setTimeout(pushHist, 400);
      }
    };
    document.addEventListener('keydown', onKey);

    const ro = new ResizeObserver(fit); ro.observe(view);
    function close() { clearTimeout(raf); ro.disconnect(); document.removeEventListener('keydown', onKey); document.removeEventListener('paste', onPaste); m.remove(); }
    function tryClose() { if (dirty && !confirm('Hay cambios sin guardar. ¿Salir de todos modos?')) return; close(); }
    $('#ex', m).onclick = $('#ccan', m).onclick = tryClose;
    $('#cdl', m).onclick = () => ctx.downloadQR({ id: ed.id, name: ed.name || 'carta', qr: ed.qr });
    $('#csave', m).onclick = async () => {
      const name = (ed.name || '').trim();
      if (!name) { toast('La carta necesita un nombre', 'err'); return $('.cname', m).focus(); }
      const b = $('#csave', m); b.disabled = true; $('#esave', m).textContent = 'Guardando…';
      try {
        await api(ed.isNew ? '/api/cards' : '/api/cards/' + ed.id, { method: ed.isNew ? 'POST' : 'PUT', body: { id: ed.id, name, data: ed.data, qr: ed.qr } });
        toast('Carta guardada', 'ok');
        dirty = false; close(); ctx.onSaved();
      } catch (e) { toast(e.message, 'err'); b.disabled = false; $('#esave', m).textContent = ''; }
    };

    $('.cname', m).value = ed.name;
    pushHist();
    dirty = false;
    refreshQR();
    setTab(tab);
    setTimeout(() => { renderNow(); if (ed.isNew) $('.cname', m).focus(); }, 0);
  }

  window.CardEdit = { open, readImage };
})();
