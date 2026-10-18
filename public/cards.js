(() => {
  'use strict';
  const { $, $$, esc, api, toast, config } = QP;
  const CV = CardView;

  const PAPERS = { A4: [210, 297], A3: [297, 420], A5: [148, 210], Letter: [216, 279], Legal: [216, 356] };
  let cards = [], sel = new Set(), search = '';
  const cardUrl = (id) => (config.publicUrl || location.origin).replace(/\/+$/, '') + '/c/' + id;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const newId = () => {
    const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    return [...crypto.getRandomValues(new Uint8Array(8))].map((x) => a[x % 64]).join('');
  };
  const qrOpts = (c, extra) => Object.assign(CV.qrOptions(c), extra || {});

  /* ───────── galería ───────── */
  const lazy = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    lazy.unobserve(en.target);
    const c = cards.find((x) => x.id === en.target.dataset.id);
    if (!c) return;
    en.target.innerHTML = CV.html(c.name, c.data, { qr: c.qr });
    CV.hydrate(en.target, c, cardUrl(c.id));
  }), { rootMargin: '300px' });

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
        <button class="btn" id="cprint">🖨 Imprimir</button><button class="btn danger" id="cdel">🗑 Eliminar</button></div>
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
      <div class="gthumb" data-id="${esc(c.id)}" style="aspect-ratio:1/${(1 / Math.max(CV.ratioOf(c.data), 0.7)).toFixed(3)}"></div>
      <div class="gc-n" title="${esc(c.name)}">${esc(c.name)}</div>
      <div class="gc-b"><button class="btn ghost sm" data-act="edit" title="Editar">✏️</button><button class="btn ghost sm" data-act="dup" title="Duplicar">⎘</button><button class="btn ghost sm" data-act="png" title="Descargar QR">⬇️</button><a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(cardUrl(c.id))}" title="Ver la carta">👁</a></div></div>`).join('')
      || `<p class="mut">${cards.length ? 'Ninguna carta coincide con la búsqueda.' : 'Todavía no hay cartas. Crea la primera con “Nueva carta”.'}</p>`;
    $$('.gthumb', g).forEach((cv) => lazy.observe(cv));
    g.onclick = (e) => {
      const card = e.target.closest('.gc');
      if (!card || e.target.closest('a') || e.target.closest('.gc-ck')) return;
      const id = card.dataset.id, c = cards.find((x) => x.id === id);
      const b = e.target.closest('[data-act]');
      if (b) {
        if (b.dataset.act === 'edit') openEd(c);
        else if (b.dataset.act === 'dup') dup(c);
        else if (b.dataset.act === 'png') downloadQR(c);
      } else if (e.target.closest('.gthumb,.gc-n')) { if (sel.has(id)) sel.delete(id); else sel.add(id); updSel(); }
    };
    g.ondblclick = (e) => { const t = e.target.closest('.gthumb'); if (t) openEd(cards.find((x) => x.id === t.dataset.id)); };
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

  function openEd(c) {
    CardEdit.open(c, { cardUrl, newId, downloadQR, onSaved: viewCards });
  }

  /* ───────── impresión por lotes ───────── */
  function layout(items, o) {
    const [bw, bh] = PAPERS[o.paper];
    const pw = o.land ? bh : bw, ph = o.land ? bw : bh;
    const cw = pw - 2 * o.margin, ch = ph - 2 * o.margin;
    const cols = Math.floor((cw + o.gap) / (o.w + o.gap)), rows = Math.floor((ch + o.gap) / (o.h + o.gap));
    if (cols < 1 || rows < 1) return { err: 'Ese tamaño no cabe en la hoja. Elige un tamaño más pequeño o un papel más grande.' };
    const per = cols * rows, pages = [];
    const cell = (h, back) => `<div class="pi${o.guides ? ' guide' : ''}" style="--cw:${o.w.toFixed(2)}mm">${h}</div>`;
    const all = items.slice();
    for (let i = 0; i < all.length; i += per) {
      let chunk = all.slice(i, i + per);
      pages.push(`<section class="pg" style="width:${cw}mm;height:${(ch - 0.6).toFixed(2)}mm"><div class="pgrid" style="grid-template-columns:repeat(${cols},${o.w.toFixed(2)}mm);grid-auto-rows:${o.h.toFixed(2)}mm;gap:${o.gap}mm;justify-content:center;align-content:start">${chunk.map((u) => cell(u)).join('')}</div></section>`);
    }
    return { pw, ph, cols, rows, per, pages, margin: o.margin };
  }
  // reverso de una hoja doble cara: cada fila se invierte para que quede detrás de su frente
  function mirror(items, cols, per) {
    const out = [];
    for (let i = 0; i < items.length; i += per) {
      const chunk = items.slice(i, i + per);
      for (let r = 0; r < chunk.length; r += cols) {
        const row = chunk.slice(r, r + cols);
        while (row.length < cols) row.push('');
        out.push(...row.reverse());
      }
    }
    return out;
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
    setTimeout(() => window.print(), 350);
  }
  async function openPrint(ids) {
    const list = ids.map((id) => cards.find((c) => c.id === id)).filter(Boolean);
    if (!list.length) return;
    const reserve = list.some((c) => qrOpts(c).caption); // misma proporción para todos
    const anyBack = list.some((c) => CV.hasBack(c.data));
    const m = document.createElement('div');
    m.className = 'modal';
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    const sizesQR = [3, 4, 5, 6, 8, 10, 12, 15, 20];
    const sizesCard = [['5', '5 cm'], ['6.35', '6,35 cm (naipe)'], ['7', '7 cm'], ['8', '8 cm'], ['10.5', '10,5 cm (A6)'], ['12', '12 cm'], ['14.8', '14,8 cm (A5)'], ['20', '20 cm']];
    m.innerHTML = `<div class="mbox wide"><div class="mh"><h2>🖨 Imprimir ${list.length} ${list.length === 1 ? 'carta' : 'cartas'}</h2><button class="x" id="px" aria-label="Cerrar">✕</button></div>
      <div class="mb"><div class="pmode" role="group" aria-label="Qué imprimir">
          <button type="button" class="pm on" data-mode="card"><b>🃏 Las cartas completas</b><span>Con su diseño, fotos y el QR en el lugar donde lo pusiste. Frente, reverso o doble cara.</span></button>
          <button type="button" class="pm" data-mode="qr"><b>🔳 Solo el QR de cada carta</b><span>Cada QR sale con el mismo estilo que le diste (colores, forma, imagen del centro y nombre).</span></button>
        </div>
        <p class="mut small" id="pnote" style="margin:.2em 0 .8em"></p>
        <div class="pgrid-opts"><select id="pmo" hidden><option value="card">card</option><option value="qr">qr</option></select>
        <label id="pside">Lados<select id="psd"><option value="front">Solo el frente</option>${anyBack ? '<option value="back">Solo el reverso</option><option value="both">Frente y reverso (doble cara)</option>' : ''}</select></label>
        <label>Ancho<select id="psz"></select></label>
        <label id="pcw" class="hide">Ancho exacto (cm)<input type="number" id="pcwv" min="1.5" max="40" step="0.1" value="6"></label>
        <label>Papel<select id="ppa">${Object.keys(PAPERS).map((k) => `<option ${k === 'A4' ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Orientación<select id="por"><option value="p">Vertical</option><option value="l">Horizontal</option></select></label>
        <label>Margen (mm)<input type="number" id="pmg" value="10" min="0" max="40"></label>
        <label>Separación (mm)<input type="number" id="pgp" value="4" min="0" max="30"></label>
        <label>Copias de cada carta<input type="number" id="pcp" value="1" min="1" max="50"></label>
        <label class="chk" style="align-self:end"><input type="checkbox" id="pgd" checked> Guías de corte</label>
      </div>
      <p class="mut" id="pinfo" style="margin:.9em 0">Preparando…</p><div class="pvbox" id="pv"></div></div>
      <div class="mf"><span class="sp"></span><button type="button" class="btn ghost" id="pcan">Cerrar</button><button type="button" class="btn primary" id="pgo" disabled>🖨 Imprimir o guardar como PDF</button></div></div>`;
    document.body.appendChild(m);

    const urls = [];
    let ready = false, sheet = null, closed = false, ratioQR = 1;
    const imgsQR = [], imgsCard = [];
    const close = () => { closed = true; urls.forEach((u) => URL.revokeObjectURL(u)); m.remove(); };
    $('#px', m).onclick = $('#pcan', m).onclick = close;
    const noQR = list.filter((c) => !CV.findQR(c.data)).length;
    const setMode = (v) => {
      $('#pmo', m).value = v;
      $$('.pm', m).forEach((b) => b.classList.toggle('on', b.dataset.mode === v));
      $('#pnote', m).textContent = v === 'card'
        ? (noQR ? `⚠ ${noQR === 1 ? 'Una carta no tiene' : noQR + ' cartas no tienen'} el QR puesto en su diseño: ${noQR === 1 ? 'saldrá' : 'saldrán'} sin QR. Puedes añadirlo en el editor (pestaña “Añadir”) o imprimir “Solo el QR”.` : '')
        : 'Los QR se imprimen exactamente como los diseñaste en la pestaña “QR” de cada carta.';
      refresh();
    };
    $$('.pm', m).forEach((b) => b.onclick = () => setMode(b.dataset.mode));

    const num = (id, d) => { const v = parseFloat($(id, m).value); return Number.isFinite(v) ? v : d; };
    const fillSizes = () => {
      const mode = $('#pmo', m).value, cur = $('#psz', m).value;
      $('#psz', m).innerHTML = (mode === 'qr' ? sizesQR.map((v) => [String(v), v + ' cm']) : sizesCard).map(([v, t]) => `<option value="${v}">${t}</option>`).join('') + '<option value="custom">Otro tamaño…</option>';
      $('#psz', m).value = [...$('#psz', m).options].some((o) => o.value === cur) ? cur : (mode === 'qr' ? '6' : '8');
      $('#pside', m).classList.toggle('hide', mode === 'qr');
    };
    function refresh() {
      if (!ready) return;
      const mode = $('#pmo', m).value;
      fillSizesIfNeeded();
      const sz = $('#psz', m).value;
      $('#pcw', m).classList.toggle('hide', sz !== 'custom');
      const w = clamp(sz === 'custom' ? num('#pcwv', 6) : +sz, 1.5, 40) * 10;
      const ratio = mode === 'qr' ? ratioQR : 1 / Math.min(...list.map((c) => CV.ratioOf(c.data)));
      const o = { w, h: w * ratio, paper: $('#ppa', m).value, land: $('#por', m).value === 'l', margin: clamp(num('#pmg', 10), 0, 40), gap: clamp(num('#pgp', 4), 0, 30), guides: $('#pgd', m).checked };
      const copies = clamp(Math.round(num('#pcp', 1)), 1, 50);
      const rep = (arr) => arr.flatMap((u) => Array(copies).fill(u));
      let items, total;
      if (mode === 'qr') { items = rep(imgsQR.map((u) => `<img src="${u}" alt="">`)); total = list.length * copies; }
      else {
        const side = $('#psd', m).value;
        const mk = (c, i, s) => (s === 'back' && !CV.hasBack(c.data) ? '' : `<div class="pcard">${CV.html(c.name, c.data, { side: s, qrSrc: imgsCard[i], qr: c.qr })}</div>`);
        const fronts = rep(list.map((c, i) => mk(c, i, 'front'))), backs = rep(list.map((c, i) => mk(c, i, 'back')));
        const [bw, bh] = PAPERS[o.paper], pw = o.land ? bh : bw, ph = o.land ? bw : bh;
        const cols = Math.max(1, Math.floor((pw - 2 * o.margin + o.gap) / (o.w + o.gap))), rows = Math.max(1, Math.floor((ph - 2 * o.margin + o.gap) / (o.h + o.gap)));
        const per = cols * rows;
        if (side === 'front') items = fronts;
        else if (side === 'back') items = backs;
        else {
          items = [];
          for (let i = 0; i < fronts.length; i += per) { items.push(...fronts.slice(i, i + per)); while (items.length % per) items.push(''); items.push(...mirror(backs.slice(i, i + per), cols, per)); while (items.length % per) items.push(''); }
        }
        total = fronts.length * (side === 'both' ? 2 : 1);
      }
      sheet = layout(items, o);
      const info = $('#pinfo', m), pv = $('#pv', m), go = $('#pgo', m);
      if (sheet.err) { info.textContent = sheet.err; pv.innerHTML = ''; go.disabled = true; return; }
      const n = sheet.pages.length;
      info.textContent = `${total} ${mode === 'qr' ? 'QR' : total === 1 ? 'cara' : 'caras'} de ${(o.w / 10).toFixed(1)} × ${(o.h / 10).toFixed(1)} cm · ${sheet.cols} × ${sheet.rows} por hoja · ${n} ${n === 1 ? 'hoja' : 'hojas'}` + (n > 6 ? ' (vista previa de las primeras 6)' : '') + (mode === 'card' && $('#psd', m).value === 'both' ? ' · Imprime a doble cara girando por el borde largo' : '');
      const z = Math.min(1, Math.max(260, (pv.clientWidth || 640) - 30) / (sheet.pw * 3.7795));
      pv.innerHTML = sheet.pages.slice(0, 6).map((p) => `<div class="sheet" style="width:${sheet.pw}mm;height:${sheet.ph}mm;padding:${o.margin}mm;zoom:${z}">${p}</div>`).join('');
      go.disabled = false;
    }
    let lastMode = 'card';
    function fillSizesIfNeeded() { const mo = $('#pmo', m).value; if (mo !== lastMode) { lastMode = mo; fillSizes(); } }
    m.addEventListener('input', refresh);
    m.addEventListener('change', refresh);
    $('#pgo', m).onclick = () => { if (sheet && !sheet.err) printSheet(sheet); };
    fillSizes();

    for (let i = 0; i < list.length; i++) {
      if (closed) return;
      $('#pinfo', m).textContent = `Preparando los QR… ${i + 1} de ${list.length}`;
      const url = cardUrl(list[i].id), cv = document.createElement('canvas');
      await QRStyle.render(cv, url, qrOpts(list[i], { size: 1400, reserve }));
      if (!i) ratioQR = cv.height / cv.width;
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
      const u = URL.createObjectURL(blob); urls.push(u); imgsQR.push(u);
      if (CV.findQR(list[i].data)) {
        const cv2 = document.createElement('canvas');
        await QRStyle.render(cv2, url, qrOpts(list[i], { size: 1200 }));
        const b2 = await new Promise((r) => cv2.toBlob(r, 'image/png'));
        const u2 = URL.createObjectURL(b2); urls.push(u2); imgsCard.push(u2);
      } else imgsCard.push(undefined);
    }
    if (closed) { urls.forEach((u) => URL.revokeObjectURL(u)); return; }
    ready = true;
    setMode($('#pmo', m).value);
  }

  QP.tabs.cards = viewCards;
})();
