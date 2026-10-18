(() => {
  'use strict';
  const { $, $$, esc, api, toast, config } = QP;

  const PAPERS = { A4: [210, 297], A3: [297, 420], A5: [148, 210], Letter: [216, 279], Legal: [216, 356] };
  const CARD_PRESETS = [
    { n: 'Fuego', bg1: '#7f1d1d', bg2: '#ea580c', accent: '#fde047' },
    { n: 'Océano', bg1: '#0c4a6e', bg2: '#0891b2', accent: '#a5f3fc' },
    { n: 'Bosque', bg1: '#14532d', bg2: '#16a34a', accent: '#bef264' },
    { n: 'Místico', bg1: '#4c1d95', bg2: '#be185d', accent: '#fbbf24' },
    { n: 'Noche', bg1: '#0f172a', bg2: '#334155', accent: '#38bdf8' },
    { n: 'Oro', bg1: '#78350f', bg2: '#d97706', accent: '#fff7ed' },
    { n: 'Rosa', bg1: '#831843', bg2: '#f472b6', accent: '#ffffff' },
  ];
  const QR_PRESETS = [
    { n: 'Violeta', v: { fg: '#1e1b4b', fg2: '#7c3aed', useGrad: true, bg: '#ffffff', frameColor: '#1e1b4b', captionColor: '#ffffff', eyeColor: '' } },
    { n: 'Neón', v: { fg: '#0f172a', fg2: '#0891b2', useGrad: true, bg: '#ffffff', frameColor: '#0f172a', captionColor: '#67e8f9', eyeColor: '#0f172a' } },
    { n: 'Fuego', v: { fg: '#7f1d1d', fg2: '#f97316', useGrad: true, bg: '#fff7ed', frameColor: '#7f1d1d', captionColor: '#fde68a', eyeColor: '' } },
    { n: 'Bosque', v: { fg: '#14532d', fg2: '#22c55e', useGrad: true, bg: '#f0fdf4', frameColor: '#14532d', captionColor: '#bbf7d0', eyeColor: '' } },
    { n: 'Rosa', v: { fg: '#831843', fg2: '#ec4899', useGrad: true, bg: '#fff1f2', frameColor: '#831843', captionColor: '#ffffff', eyeColor: '' } },
    { n: 'Clásico', v: { fg: '#000000', fg2: '#000000', useGrad: false, bg: '#ffffff', frameColor: '#000000', captionColor: '#ffffff', eyeColor: '' } },
  ];

  let cards = [], sel = new Set(), search = '', ed = null;
  const cardUrl = (id) => (config.publicUrl || location.origin).replace(/\/+$/, '') + '/c/' + id;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const newId = () => {
    const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    return [...crypto.getRandomValues(new Uint8Array(8))].map((x) => a[x % 64]).join('');
  };
  const qrOpts = (c, extra) => {
    const o = Object.assign({}, QRStyle.DEF, c.qr || {});
    o.caption = o.captionMode === 'name' ? c.name : o.captionMode === 'custom' ? (o.captionText || '') : '';
    return Object.assign(o, extra || {});
  };
  const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setP = (o, p, v) => {
    const ks = p.split('.'), last = ks.pop();
    const t = ks.reduce((a, k) => (a[k] == null ? (a[k] = {}) : a[k]), o);
    t[last] = v;
  };
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
          res(c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.86));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ───────── galería ───────── */
  const lazy = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    lazy.unobserve(en.target);
    const c = cards.find((x) => x.id === en.target.dataset.id);
    if (c) QRStyle.render(en.target, cardUrl(c.id), qrOpts(c, { size: 420 }));
  }), { rootMargin: '250px' });

  const visible = () => cards.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  async function viewCards() {
    const t = $('#tab');
    t.onclick = t.oninput = t.onchange = null;
    t.innerHTML = '<div class="panel">Cargando cartas…</div>';
    try { cards = await api('/api/cards'); } catch (e) { toast(e.message, 'err'); cards = []; }
    sel = new Set();
    drawCards();
  }
  function drawCards() {
    const t = $('#tab');
    t.innerHTML = `<div class="bar-top"><h2>🃏 Cartas <small>${cards.length} en total</small></h2>
      <div class="row"><input id="csr" class="srch" type="search" placeholder="Buscar por nombre" value="${esc(search)}" aria-label="Buscar cartas"><button class="btn primary" id="cnew">＋ Nueva carta</button></div></div>
      <div class="tool panel"><label class="chk" style="margin:0"><input type="checkbox" id="csall"> Seleccionar todas</label><span class="mut" id="csn"></span><span class="sp"></span>
        <button class="btn" id="cprint">🖨 Imprimir lote</button><button class="btn danger" id="cdel">🗑 Eliminar</button></div>
      <div class="gal" id="gal"></div>`;
    $('#cnew').onclick = () => openEd(null);
    $('#csr').oninput = (e) => { search = e.target.value; drawGal(); };
    $('#csall').onchange = (e) => { visible().forEach((c) => (e.target.checked ? sel.add(c.id) : sel.delete(c.id))); updSel(); };
    $('#cprint').onclick = () => openPrint([...sel]);
    $('#cdel').onclick = delSel;
    drawGal();
  }
  function drawGal() {
    const g = $('#gal');
    g.innerHTML = visible().map((c) => `<div class="gc ${sel.has(c.id) ? 'on' : ''}" data-id="${esc(c.id)}">
      <label class="gc-ck"><input type="checkbox" class="ck" aria-label="Seleccionar ${esc(c.name)}"></label>
      <canvas class="gq" data-id="${esc(c.id)}"></canvas>
      <div class="gc-n" title="${esc(c.name)}">${esc(c.name)}</div>
      <div class="gc-b"><button class="btn ghost sm" data-act="edit" title="Editar">✏️</button><button class="btn ghost sm" data-act="dup" title="Duplicar">⎘</button><button class="btn ghost sm" data-act="png" title="Descargar QR">⬇️</button><a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(cardUrl(c.id))}" title="Ver la carta">👁</a></div></div>`).join('')
      || `<p class="mut">${cards.length ? 'Ninguna carta coincide con la búsqueda.' : 'Todavía no hay cartas. Crea la primera con “Nueva carta”.'}</p>`;
    $$('canvas.gq', g).forEach((cv) => lazy.observe(cv));
    g.onclick = (e) => {
      const card = e.target.closest('.gc');
      if (!card || e.target.closest('a') || e.target.closest('.gc-ck')) return;
      const id = card.dataset.id, c = cards.find((x) => x.id === id);
      const b = e.target.closest('[data-act]');
      if (b) {
        if (b.dataset.act === 'edit') openEd(c);
        else if (b.dataset.act === 'dup') dup(c);
        else if (b.dataset.act === 'png') downloadQR(c);
      } else if (e.target.closest('canvas,.gc-n')) { if (sel.has(id)) sel.delete(id); else sel.add(id); updSel(); }
    };
    g.onchange = (e) => {
      const card = e.target.closest('.gc');
      if (!card || !e.target.classList.contains('ck')) return;
      if (e.target.checked) sel.add(card.dataset.id); else sel.delete(card.dataset.id);
      updSel();
    };
    updSel();
  }
  function updSel() {
    $('#csn').textContent = `${sel.size} ${sel.size === 1 ? 'seleccionada' : 'seleccionadas'}`;
    $('#cprint').disabled = !sel.size;
    $('#cdel').disabled = !sel.size;
    $$('.gc').forEach((g) => { const on = sel.has(g.dataset.id); g.classList.toggle('on', on); $('.ck', g).checked = on; });
    const vis = visible();
    $('#csall').checked = vis.length > 0 && vis.every((c) => sel.has(c.id));
  }
  async function dup(c) {
    try {
      await api('/api/cards', { method: 'POST', body: { id: newId(), name: c.name + ' (copia)', data: c.data, qr: c.qr } });
      toast('Carta duplicada', 'ok');
      await viewCards();
    } catch (e) { toast(e.message, 'err'); }
  }
  async function delSel() {
    if (!sel.size || !confirm(`¿Eliminar ${sel.size} carta(s)? Los QR ya impresos dejarán de abrir su carta.`)) return;
    try {
      await api('/api/cards/bulk-delete', { method: 'POST', body: { ids: [...sel] } });
      toast('Cartas eliminadas', 'ok');
      await viewCards();
    } catch (e) { toast(e.message, 'err'); }
  }
  async function downloadQR(c) {
    const blob = await QRStyle.toBlob(cardUrl(c.id), qrOpts(c, { size: 1400 }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (c.name || 'carta').replace(/[^\w-]+/g, '_') + '_QR.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }

  /* ───────── editor de carta + QR ───────── */
  function openEd(c) {
    ed = c
      ? { id: c.id, isNew: false, name: c.name, data: JSON.parse(JSON.stringify(c.data || {})), qr: Object.assign({}, QRStyle.DEF, c.qr || {}) }
      : { id: newId(), isNew: true, name: '', data: { type: '', desc: '', emoji: '🔥', image: '', bg1: '#4c1d95', bg2: '#be185d', accent: '#fbbf24' }, qr: Object.assign({}, QRStyle.DEF) };
    const st = ed.data.stats || [];
    ed.data.stats = [0, 1, 2].map((i) => Object.assign({ label: '', value: '' }, st[i] || {}));

    const m = document.createElement('div');
    m.className = 'modal';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="mbox wide"><div class="mh"><h2>${ed.isNew ? 'Nueva carta' : 'Editar carta'}</h2><button class="x" id="cx" aria-label="Cerrar">✕</button></div>
    <div class="mb"><div class="ed"><div class="edform">
      <div class="stabs"><button type="button" class="on" data-s="s1">🃏 Carta</button><button type="button" data-s="s2">🔳 Código QR</button></div>
      <div id="s1">
        <label>Nombre de la carta<input data-k="name" maxlength="60" placeholder="Ej: Dragón de fuego"></label>
        <div class="g2"><label>Tipo o subtítulo<input data-k="data.type" maxlength="30" placeholder="Ej: Legendaria"></label>
          <label>Emoji o icono<input data-k="data.emoji" maxlength="4" placeholder="🔥"></label></div>
        <label>Descripción<textarea data-k="data.desc" rows="3" maxlength="220" placeholder="Cuenta de qué trata esta carta"></textarea></label>
        <label>Imagen de la carta<input type="file" id="fimg" accept="image/*"></label>
        <button type="button" class="btn ghost sm" id="fimgx" style="margin-top:6px">Quitar imagen</button>
        <h4>Colores</h4>
        <div class="g3"><label>Fondo 1<input type="color" data-k="data.bg1"></label><label>Fondo 2<input type="color" data-k="data.bg2"></label><label>Detalles<input type="color" data-k="data.accent"></label></div>
        <div class="presets">${CARD_PRESETS.map((p, i) => `<button type="button" class="pre" data-cp="${i}" title="${p.n}" aria-label="Paleta ${p.n}" style="background:linear-gradient(135deg,${p.bg1},${p.bg2})"></button>`).join('')}</div>
        <h4>Estadísticas (opcional)</h4>
        ${[0, 1, 2].map((i) => `<div class="stat-r"><input data-k="data.stats.${i}.label" maxlength="10" placeholder="Etiqueta (ATQ)"><input data-k="data.stats.${i}.value" maxlength="6" placeholder="Valor (90)"></div>`).join('')}
      </div>
      <div id="s2" class="hide">
        <h4>Forma</h4>
        <div class="g2"><label>Puntos<select data-k="qr.dots"><option value="square">Cuadrados</option><option value="rounded">Redondeados</option><option value="dots">Círculos</option></select></label>
          <label>Esquinas (ojos)<select data-k="qr.eye"><option value="square">Cuadradas</option><option value="rounded">Redondeadas</option><option value="circle">Circulares</option></select></label></div>
        <h4>Colores</h4>
        <div class="g3"><label>Color 1<input type="color" data-k="qr.fg"></label><label>Color 2<input type="color" data-k="qr.fg2"></label><label>Fondo<input type="color" data-k="qr.bg"></label></div>
        <label class="chk"><input type="checkbox" data-k="qr.useGrad"> Degradado entre color 1 y color 2</label>
        <label class="chk"><input type="checkbox" data-k="qr.frame"> Marco de color</label>
        <div class="g2"><label>Color del marco<input type="color" data-k="qr.frameColor"></label>
          <label>Color de las esquinas<input type="color" data-k="qr.eyeColor"></label></div>
        <button type="button" class="btn ghost sm" id="eyeclr" style="margin-top:6px">Esquinas del mismo color que los puntos</button>
        <div class="presets">${QR_PRESETS.map((p, i) => `<button type="button" class="pre" data-qp="${i}" title="${p.n}" aria-label="Estilo ${p.n}" style="background:linear-gradient(135deg,${p.v.fg},${p.v.fg2})"></button>`).join('')}</div>
        <h4>Texto debajo del QR</h4>
        <div class="g2"><label>Mostrar<select data-k="qr.captionMode"><option value="name">El nombre de la carta</option><option value="custom">Un texto propio</option><option value="none">Nada</option></select></label>
          <label>Texto propio<input data-k="qr.captionText" maxlength="40" placeholder="Ej: Escanéame"></label></div>
        <label>Color del texto<input type="color" data-k="qr.captionColor"></label>
        <h4>Centro del QR</h4>
        <label>Logo o imagen<input type="file" id="flogo" accept="image/*"></label>
        <button type="button" class="btn ghost sm" id="flogox" style="margin-top:6px">Quitar logo</button>
        <div class="g3"><label>O un texto/emoji<input data-k="qr.centerText" maxlength="6" placeholder="🔥"></label><label>Fondo<input type="color" data-k="qr.centerBg"></label><label>Texto<input type="color" data-k="qr.centerColor"></label></div>
        <p class="mut small">Con logo o texto en el centro el QR usa más corrección de errores. Pruébalo con tu celular antes de imprimir.</p>
      </div>
    </div>
    <div class="edprev"><div id="pvcard"></div><div class="qrbox"><canvas id="pvqr"></canvas><div class="mut small" id="pvurl" style="margin-top:.6em"></div></div></div></div></div>
    <div class="mf"><button type="button" class="btn ghost" id="cdl">⬇️ Descargar QR</button><span class="sp"></span><button type="button" class="btn ghost" id="ccan">Cancelar</button><button type="button" class="btn primary" id="csave">💾 Guardar carta</button></div></div>`;
    document.body.appendChild(m);

    const sync = () => $$('[data-k]', m).forEach((el) => {
      const v = getP(ed, el.dataset.k);
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v;
    });
    let timer;
    const draw = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!ed || !document.body.contains(m)) return;
        $('#pvcard', m).innerHTML = CardView.html(ed.name, ed.data);
        $('#pvurl', m).textContent = cardUrl(ed.id);
        try { await QRStyle.render($('#pvqr', m), cardUrl(ed.id), qrOpts(ed, { size: 700 })); } catch (e) { /* ignorar */ }
      }, 60);
    };
    const close = () => { clearTimeout(timer); m.remove(); ed = null; document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);

    const onIn = (e) => {
      const el = e.target, k = el.dataset && el.dataset.k;
      if (!k) return;
      setP(ed, k, el.type === 'checkbox' ? el.checked : el.value);
      draw();
    };
    m.addEventListener('input', onIn);
    m.addEventListener('change', onIn);
    $$('.stabs button', m).forEach((b) => b.onclick = () => {
      $$('.stabs button', m).forEach((x) => x.classList.toggle('on', x === b));
      ['s1', 's2'].forEach((id) => $('#' + id, m).classList.toggle('hide', id !== b.dataset.s));
    });
    $('#fimg', m).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { ed.data.image = await readImage(f, 900, false); draw(); } catch (x) { toast('No se pudo leer esa imagen', 'err'); }
      e.target.value = '';
    };
    $('#fimgx', m).onclick = () => { ed.data.image = ''; draw(); };
    $('#flogo', m).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { ed.qr.logo = await readImage(f, 320, true); draw(); } catch (x) { toast('No se pudo leer esa imagen', 'err'); }
      e.target.value = '';
    };
    $('#flogox', m).onclick = () => { ed.qr.logo = ''; draw(); };
    $('#eyeclr', m).onclick = () => { ed.qr.eyeColor = ''; sync(); draw(); };
    $$('[data-cp]', m).forEach((b) => b.onclick = () => { const p = CARD_PRESETS[+b.dataset.cp]; Object.assign(ed.data, { bg1: p.bg1, bg2: p.bg2, accent: p.accent }); sync(); draw(); });
    $$('[data-qp]', m).forEach((b) => b.onclick = () => { Object.assign(ed.qr, QR_PRESETS[+b.dataset.qp].v); sync(); draw(); });
    $('#cx', m).onclick = $('#ccan', m).onclick = close;
    $('#cdl', m).onclick = () => downloadQR({ id: ed.id, name: ed.name || 'carta', qr: ed.qr });
    $('#csave', m).onclick = async () => {
      const name = (ed.name || '').trim();
      if (!name) { toast('La carta necesita un nombre', 'err'); return $('[data-k=name]', m).focus(); }
      try {
        await api(ed.isNew ? '/api/cards' : '/api/cards/' + ed.id, { method: ed.isNew ? 'POST' : 'PUT', body: { id: ed.id, name, data: ed.data, qr: ed.qr } });
        toast('Carta guardada', 'ok');
        close();
        await viewCards();
      } catch (e) { toast(e.message, 'err'); }
    };
    sync();
    draw();
    $('[data-k=name]', m).focus();
  }

  /* ───────── impresión por lotes ───────── */
  function layout(items, o) {
    const [bw, bh] = PAPERS[o.paper];
    const pw = o.land ? bh : bw, ph = o.land ? bw : bh;
    const cw = pw - 2 * o.margin, ch = ph - 2 * o.margin;
    const cols = Math.floor((cw + o.gap) / (o.w + o.gap)), rows = Math.floor((ch + o.gap) / (o.h + o.gap));
    if (cols < 1 || rows < 1) return { err: 'Ese tamaño no cabe en la hoja. Elige un QR más pequeño o un papel más grande.' };
    const per = cols * rows, pages = [];
    for (let i = 0; i < items.length; i += per) {
      pages.push(`<section class="pg" style="width:${cw}mm;height:${(ch - 0.6).toFixed(2)}mm"><div class="pgrid" style="grid-template-columns:repeat(${cols},${o.w.toFixed(2)}mm);grid-auto-rows:${o.h.toFixed(2)}mm;gap:${o.gap}mm;justify-content:center;align-content:start">${items.slice(i, i + per).map((u) => `<div class="pi${o.guides ? ' guide' : ''}"><img src="${u}" alt=""></div>`).join('')}</div></section>`);
    }
    return { pw, ph, cols, rows, per, pages, margin: o.margin };
  }
  function printSheet(sh) {
    const old = $('#printRoot'); if (old) old.remove();
    const root = document.createElement('div');
    root.id = 'printRoot';
    root.innerHTML = `<style>@page{size:${sh.pw}mm ${sh.ph}mm;margin:${sh.margin}mm}</style>` + sh.pages.join('');
    document.body.appendChild(root);
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); root.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 250);
  }
  async function openPrint(ids) {
    const list = ids.map((id) => cards.find((c) => c.id === id)).filter(Boolean);
    if (!list.length) return;
    const reserve = list.some((c) => qrOpts(c).caption); // misma proporción para todos
    const m = document.createElement('div');
    m.className = 'modal';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="mbox wide"><div class="mh"><h2>🖨 Imprimir ${list.length} ${list.length === 1 ? 'carta' : 'cartas'}</h2><button class="x" id="px" aria-label="Cerrar">✕</button></div>
      <div class="mb"><div class="pgrid-opts">
        <label>Ancho del QR<select id="psz">${[3, 4, 5, 6, 8, 10, 12, 15, 20].map((v) => `<option value="${v}" ${v === 6 ? 'selected' : ''}>${v} cm</option>`).join('')}<option value="custom">Otro tamaño…</option></select></label>
        <label id="pcw" class="hide">Ancho exacto (cm)<input type="number" id="pcwv" min="1.5" max="40" step="0.1" value="6"></label>
        <label>Papel<select id="ppa">${Object.keys(PAPERS).map((k) => `<option ${k === 'A4' ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Orientación<select id="por"><option value="p">Vertical</option><option value="l">Horizontal</option></select></label>
        <label>Margen (mm)<input type="number" id="pmg" value="10" min="0" max="40"></label>
        <label>Separación (mm)<input type="number" id="pgp" value="4" min="0" max="30"></label>
        <label>Copias de cada carta<input type="number" id="pcp" value="1" min="1" max="50"></label>
        <label class="chk" style="align-self:end"><input type="checkbox" id="pgd" checked> Guías de corte</label>
      </div>
      <p class="mut" id="pinfo" style="margin:.9em 0">Preparando los QR…</p><div class="pvbox" id="pv"></div></div>
      <div class="mf"><span class="sp"></span><button type="button" class="btn ghost" id="pcan">Cerrar</button><button type="button" class="btn primary" id="pgo" disabled>🖨 Imprimir o guardar como PDF</button></div></div>`;
    document.body.appendChild(m);

    const urls = [];
    let ratio = 1, ready = false, sheet = null, closed = false;
    const close = () => { closed = true; urls.forEach((u) => URL.revokeObjectURL(u)); m.remove(); };
    $('#px', m).onclick = $('#pcan', m).onclick = close;

    const num = (id, d) => { const v = parseFloat($(id, m).value); return Number.isFinite(v) ? v : d; };
    function refresh() {
      if (!ready) return;
      const sz = $('#psz', m).value;
      $('#pcw', m).classList.toggle('hide', sz !== 'custom');
      const w = clamp(sz === 'custom' ? num('#pcwv', 6) : +sz, 1.5, 40) * 10;
      const o = { w, h: w * ratio, paper: $('#ppa', m).value, land: $('#por', m).value === 'l', margin: clamp(num('#pmg', 10), 0, 40), gap: clamp(num('#pgp', 4), 0, 30), guides: $('#pgd', m).checked };
      const copies = clamp(Math.round(num('#pcp', 1)), 1, 50);
      sheet = layout(urls.flatMap((u) => Array(copies).fill(u)), o);
      const info = $('#pinfo', m), pv = $('#pv', m), go = $('#pgo', m);
      if (sheet.err) { info.textContent = sheet.err; pv.innerHTML = ''; go.disabled = true; return; }
      const total = urls.length * copies, n = sheet.pages.length;
      info.textContent = `${total} ${total === 1 ? 'QR' : 'QR'} de ${(o.w / 10).toFixed(1)} × ${(o.h / 10).toFixed(1)} cm · ${sheet.cols} × ${sheet.rows} por hoja · ${n} ${n === 1 ? 'hoja' : 'hojas'}` + (n > 6 ? ' (vista previa de las primeras 6)' : '');
      const z = Math.min(1, Math.max(260, (pv.clientWidth || 640) - 30) / (sheet.pw * 3.7795));
      pv.innerHTML = sheet.pages.slice(0, 6).map((p) => `<div class="sheet" style="width:${sheet.pw}mm;height:${sheet.ph}mm;padding:${o.margin}mm;zoom:${z}">${p}</div>`).join('');
      go.disabled = false;
    }
    m.addEventListener('input', refresh);
    m.addEventListener('change', refresh);
    $('#pgo', m).onclick = () => { if (sheet && !sheet.err) printSheet(sheet); };

    for (let i = 0; i < list.length; i++) {
      if (closed) return;
      $('#pinfo', m).textContent = `Preparando los QR… ${i + 1} de ${list.length}`;
      const cv = document.createElement('canvas');
      await QRStyle.render(cv, cardUrl(list[i].id), qrOpts(list[i], { size: 1400, reserve }));
      if (!i) ratio = cv.height / cv.width;
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
      urls.push(URL.createObjectURL(blob));
    }
    if (closed) { urls.forEach((u) => URL.revokeObjectURL(u)); return; }
    ready = true;
    refresh();
  }

  QP.tabs.cards = viewCards;
})();
