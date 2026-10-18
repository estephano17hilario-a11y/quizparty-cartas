(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeImg = (u) => (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(u || '') ? u : '');
  const col = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : null);
  window.CardView = {
    esc,
    html(name, d) {
      d = d || {};
      const bg1 = col(d.bg1) || '#4c1d95', bg2 = col(d.bg2) || '#be185d', ac = col(d.accent) || '#fbbf24';
      const img = safeImg(d.image);
      const stats = (d.stats || []).filter((s) => s && (s.label || s.value)).slice(0, 3)
        .map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('');
      return `<div class="tcard" style="--bg1:${bg1};--bg2:${bg2};--ac:${ac}">
        <div class="tc-top"><span class="tc-name">${esc(name || 'Nombre de la carta')}</span><span class="tc-emoji">${esc(d.emoji || '')}</span></div>
        <div class="tc-art">${img ? `<img src="${esc(img)}" alt="">` : `<span class="tc-big">${esc(d.emoji || '✨')}</span>`}</div>
        ${d.type ? `<div class="tc-type">${esc(d.type)}</div>` : ''}
        ${d.desc ? `<div class="tc-desc">${esc(d.desc)}</div>` : ''}
        ${stats ? `<div class="tc-stats">${stats}</div>` : ''}
      </div>`;
    },
  };
})();
