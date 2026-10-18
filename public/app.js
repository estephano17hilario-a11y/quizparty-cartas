(() => {
  'use strict';
  const { esc } = CardView;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SHAPES = ['▲', '◆', '●', '■'];
  const app = $('#app');

  let session = null; // {name, role, token}
  let socket = null, S = null, offset = 0;
  const config = { publicUrl: '' };
  const PID = localStorage.pid || (localStorage.pid = Math.random().toString(36).slice(2) + Date.now().toString(36));

  /* ───────── utilidades compartidas (también las usa cards.js) ───────── */
  function toast(msg, type) {
    const d = document.createElement('div');
    d.className = 't ' + (type || '');
    d.textContent = msg;
    $('#toast').appendChild(d);
    setTimeout(() => d.remove(), 3600);
  }
  const VPS_SERVER = 'https://quizparty.89.117.73.97.sslip.io';
  const SERVER_BASE = location.hostname.includes('vercel.app') ? VPS_SERVER : '';
  async function api(path, opts = {}) {
    const h = { 'Content-Type': 'application/json' };
    if (session && session.token) h.Authorization = 'Bearer ' + session.token;
    const url = (SERVER_BASE ? SERVER_BASE : '') + path;
    const r = await fetch(url, { method: opts.method || 'GET', headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401 && session && session.role === 'admin' && path !== '/api/login') logout('Tu sesión de anfitrión expiró. Vuelve a entrar.');
      throw Object.assign(new Error(j.error || 'Error de servidor'), { data: j, status: r.status });
    }
    return j;
  }
  const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  window.QP = { $, $$, esc, api, toast, config, tabs: {}, getSession: () => session };

  /* ───────── sesión ───────── */
  function logout(msg) {
    sessionStorage.removeItem('session');
    if (socket) { socket.disconnect(); socket = null; }
    session = null; S = null;
    viewLogin(msg);
  }

  function viewLogin(msg) {
    app.innerHTML = `<div class="center"><div class="login glass">
      <div class="logo">🎯</div><h1>QuizParty</h1>
      <p class="mut">Escribe tu nombre de usuario para entrar a la sala</p>
      <input id="nm" placeholder="Tu nombre de usuario" maxlength="24" autocomplete="off" value="${esc(localStorage.lastName || '')}">
      <input id="pin" class="hide" type="password" placeholder="PIN de anfitrión" autocomplete="current-password">
      <button class="btn primary big" id="go">Entrar</button>
      <div class="err" id="err">${esc(msg || '')}</div></div></div>`;
    const go = async () => {
      const name = $('#nm').value.trim();
      if (!name) return $('#nm').focus();
      try {
        const r = await api('/api/login', { method: 'POST', body: { name, pin: $('#pin').value } });
        session = { name: r.name || name, role: r.role, token: r.token };
        sessionStorage.session = JSON.stringify(session);
        localStorage.lastName = name;
        connect();
      } catch (e) {
        if (e.data && e.data.needPin) { $('#pin').classList.remove('hide'); $('#pin').focus(); }
        $('#err').textContent = e.message;
      }
    };
    $('#go').onclick = go;
    $$('#nm,#pin').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }));
    $('#nm').focus();
  }

  function connect() {
    if (socket) socket.disconnect();
    S = null; lastSig = '';
    const socketTarget = SERVER_BASE || undefined;
    socket = io(socketTarget, { auth: { name: session.name, token: session.token, pid: PID } });
    socket.on('connect_error', (err) => {
      if (!session) return;
      if (/xhr poll|websocket|timeout/i.test(err.message)) return; // reintenta solo
      logout(err.message);
    });
    socket.on('state', (s) => { offset = s.now - Date.now(); S = s; onState(); });
    socket.on('kicked', () => logout('El anfitrión te sacó de la sala.'));
    socket.on('disconnect', (reason) => { if (session && reason === 'io server disconnect') logout('Abriste la sala en otra pestaña.'); });
    if (session.role === 'admin') shellAdmin(); else shellPlayer();
  }

  function onState() {
    if (!session) return;
    if (session.role === 'admin') { if (adminTab === 'game') renderGame(); } else renderPlayer();
  }

  /* ───────── cuenta regresiva y barras ───────── */
  function fmtLong(ms) {
    if (ms <= 0) return '¡Ya!';
    let t = Math.ceil(ms / 1000);
    const d = Math.floor(t / 86400); t %= 86400;
    const h = Math.floor(t / 3600); t %= 3600;
    const m = Math.floor(t / 60), s = t % 60;
    const p = (n) => String(n).padStart(2, '0');
    return (d ? d + 'd ' : '') + (h || d ? p(h) + ':' : '') + p(m) + ':' + p(s);
  }
  setInterval(() => {
    const now = Date.now() + offset;
    $$('[data-until]').forEach((el) => {
      const t = +el.dataset.until - now;
      el.textContent = el.dataset.fmt === 'long' ? fmtLong(t) : Math.max(0, Math.ceil(t / 1000));
    });
    $$('[data-bar-until]').forEach((el) => {
      const t = +el.dataset.barUntil - now;
      el.style.width = Math.max(0, Math.min(100, (t / +el.dataset.barTotal) * 100)) + '%';
    });
  }, 200);

  function boardHtml(board, me) {
    if (!board || !board.length) return '';
    return '<div class="board">' + board.map((b, i) =>
      `<div class="brow ${b.name === me ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="nm">${esc(b.name)}</span><span class="sc">${b.score}</span></div>`).join('') + '</div>';
  }
  function podiumHtml(board) {
    const [a, b, c] = board;
    const pod = (x, cls, m) => x ? `<div class="pod ${cls}"><div class="m">${m}</div><div class="n">${esc(x.name)}</div><div class="sc">${x.score}</div></div>` : '';
    return `<div class="podium">${pod(b, 'p2', '🥈')}${pod(a, 'p1', '🥇')}${pod(c, 'p3', '🥉')}</div>`;
  }

  /* ───────── JUGADOR ───────── */
  let lastSig = '';
  function shellPlayer() {
    app.innerHTML = `<div class="pwrap"><header class="ptop"><div class="chip">👤 ${esc(session.name)}</div><div class="chip" id="pscore">0 pts</div><button class="btn ghost sm" id="out">Salir</button></header><main id="stage"></main></div>`;
    $('#out').onclick = () => logout();
  }
  function renderPlayer() {
    const s = S;
    if (!s || !$('#stage')) return;
    const me = s.me || { score: 0, name: session.name };
    $('#pscore').textContent = `${me.score} pts` + (me.rank ? ` · puesto ${me.rank}` : '');
    const sig = [s.phase, s.index, s.scheduledAt, me.choice, me.ok,
      (s.phase === 'lobby' || s.phase === 'idle') ? s.online : '', (s.phase === 'reveal' || s.phase === 'finished') ? me.score : ''].join('|');
    if (sig === lastSig) return;
    lastSig = sig;
    let h = '';
    if (s.phase === 'idle') {
      h = `<div class="panel center-txt"><div class="big-emoji">⏳</div><h2>Esperando al anfitrión</h2><p class="mut">Cuando empiece la partida aparecerá aquí. No cierres esta pantalla.</p></div>`;
    } else if (s.phase === 'lobby') {
      h = `<div class="panel center-txt"><h2>${esc(s.quizTitle)}</h2>
        <p class="mut">${s.scheduledAt ? 'La partida empieza en' : 'Esperando a que el anfitrión la inicie…'}</p>
        ${s.scheduledAt ? `<div class="count" data-until="${s.scheduledAt}" data-fmt="long"></div>` : '<div class="big-emoji">🎮</div>'}
        <p class="mut">${s.online} ${s.online === 1 ? 'jugador' : 'jugadores'} en la sala · ${s.total} preguntas</p></div>`;
    } else if (s.phase === 'question') {
      const q = s.question;
      h = `<div class="qhead"><div class="qn">Pregunta ${s.index + 1} de ${s.total}</div><div class="qt" data-until="${s.endsAt}"></div></div>
        <div class="bar"><i data-bar-until="${s.endsAt}" data-bar-total="${q.time * 1000}"></i></div>
        <h2 class="qtext">${esc(q.text)}</h2>`;
      if (me.choice != null) h += `<div class="panel center-txt"><div class="big-emoji">✅</div><h3>Respuesta enviada</h3><p class="mut">Los resultados salen cuando termine el tiempo.</p></div>`;
      else h += `<div class="answers">${q.options.map((o, i) => `<button class="ans a${i}" data-i="${i}"><span class="shp">${SHAPES[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
    } else if (s.phase === 'reveal') {
      const q = s.question, none = me.choice == null, ok = !none && me.ok;
      h = `<div class="panel center-txt ${none ? '' : ok ? 'good' : 'bad'}"><div class="big-emoji">${none ? '😴' : ok ? '🎉' : '😢'}</div>
        <h2>${none ? 'Sin respuesta' : ok ? '¡Correcto!' : 'Incorrecto'}</h2>${ok ? `<div class="pts">+${me.pts}</div>` : ''}
        <p class="mut">Respuesta correcta: <b style="color:#fff">${esc(q.options[q.correct])}</b></p></div>
        <h3>Ranking</h3>${boardHtml(s.board, me.name)}`;
    } else {
      h = `<div class="panel center-txt"><h2>¡Partida terminada!</h2>${podiumHtml(s.board || [])}
        <p>Terminaste en el puesto <b>${me.rank || '-'}</b> con <b>${me.score}</b> puntos</p></div>${boardHtml(s.board, me.name)}`;
    }
    const st = $('#stage');
    st.innerHTML = h;
    $$('.ans', st).forEach((b) => b.onclick = () => {
      $$('.ans', st).forEach((x) => x.disabled = true);
      socket.emit('answer', +b.dataset.i);
    });
  }

  /* ───────── ANFITRIÓN ───────── */
  let adminTab = 'game', gameMode = '';
  function shellAdmin() {
    app.innerHTML = `<div class="awrap"><header class="atop">
      <div class="brand">🎯 QuizParty<small>Anfitrión: ${esc(session.name)}</small></div>
      <nav class="tabs"><button data-tab="game" class="on">🎮 Juego</button><button data-tab="quiz">❓ Preguntas</button><button data-tab="cards">🃏 Cartas</button><button data-tab="hist">📊 Historial</button></nav>
      <button class="btn ghost sm" id="out">Salir</button></header><main id="tab"></main></div>`;
    $('#out').onclick = () => logout();
    $$('.tabs button').forEach((b) => b.onclick = () => {
      adminTab = b.dataset.tab;
      $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
      renderTab();
    });
    adminTab = 'game';
    renderTab();
  }
  function renderTab() {
    gameMode = '';
    $('#tab').onclick = $('#tab').oninput = $('#tab').onchange = null;
    if (adminTab === 'game') { if (S) renderGame(); else $('#tab').innerHTML = '<div class="panel">Conectando…</div>'; }
    else if (adminTab === 'quiz') viewQuizzes();
    else if (adminTab === 'cards') (QP.tabs.cards || (() => {}))();
    else viewHistory();
  }

  /* ── Juego: configuración ── */
  function renderGame() {
    const t = $('#tab');
    if (!t || !S) return;
    const mode = S.phase === 'idle' ? 'cfg' : 'live';
    if (mode !== gameMode) {
      gameMode = mode;
      if (mode === 'cfg') buildConfig(t);
      else {
        t.innerHTML = '<div id="live"></div>';
        $('#live').onclick = (e) => {
          const a = e.target.closest('[data-a]'), k = e.target.closest('[data-kick]');
          if (k) return socket.emit('admin:kick', k.dataset.kick);
          if (!a) return;
          const act = a.dataset.a;
          if (act === 'end' && !confirm('¿Terminar la partida ahora?')) return;
          if (act === 'reset' && !confirm('¿Cerrar esta sala y configurar una nueva?')) return;
          socket.emit('admin:' + act);
        };
      }
    }
    if (mode === 'live') $('#live').innerHTML = liveHtml();
    else if ($('#cnow')) $('#cnow').textContent = S.online;
  }

  async function buildConfig(t) {
    t.innerHTML = `<div class="grid2">
      <section class="panel"><h2>⚙️ Configurar la partida</h2>
        <label>Quiz<select id="cq"></select></label>
        <div id="cqs" class="qsel"></div>
        <div class="when">
          <label class="radio"><input type="radio" name="when" value="manual" checked> Empezar yo manualmente</label>
          <label class="radio"><input type="radio" name="when" value="sched"> Programar fecha y hora</label>
          <div id="schedBox" class="hide"><input type="datetime-local" id="cdt">
            <div class="quick"><button class="btn ghost sm" data-add="5">En 5 min</button><button class="btn ghost sm" data-add="15">En 15 min</button><button class="btn ghost sm" data-add="60">En 1 hora</button></div></div>
        </div>
        <button class="btn primary big" id="cgo">🚀 Abrir la sala</button>
      </section>
      <section class="panel center-txt"><h2>👥 Sala única</h2>
        <p class="mut">Quien entre con cualquier otro nombre de usuario será jugador de esta sala.</p>
        <div class="big-num" id="cnow">${S.online}</div><p class="mut">conectados ahora</p>
        <p class="mut small">Comparte este enlace:<br><code>${esc(config.publicUrl || location.origin)}</code></p></section></div>`;
    let quizzes = [];
    try { quizzes = await api('/api/quizzes'); } catch (e) { toast(e.message, 'err'); }
    if (!$('#cq')) return;
    $('#cq').innerHTML = quizzes.length ? quizzes.map((q) => `<option value="${q.id}">${esc(q.title)} (${q.count})</option>`).join('')
      : '<option value="">Primero crea un quiz en la pestaña Preguntas</option>';
    const loadQs = async () => {
      const id = $('#cq').value;
      if (!id) { $('#cqs').innerHTML = ''; return; }
      let qz;
      try { qz = await api('/api/quizzes/' + id); } catch (e) { return toast(e.message, 'err'); }
      $('#cqs').innerHTML = `<div class="qsel-h"><label class="chk" style="margin:0"><input type="checkbox" id="call" checked> Todas las preguntas</label><span class="mut">Segundos</span></div>` +
        qz.questions.map((q, i) => `<div class="qs"><label class="qs-l"><input type="checkbox" class="qk" data-pos="${i}" checked><span><b>${i + 1}.</b> ${esc(q.text)}</span></label><input type="number" class="qtm" min="5" max="120" value="${q.time}" aria-label="Segundos de la pregunta ${i + 1}"></div>`).join('');
      $('#call').onchange = (e) => $$('.qk').forEach((c) => c.checked = e.target.checked);
    };
    $('#cq').onchange = loadQs;
    loadQs();
    $('#cdt').value = localISO(new Date(Date.now() + 10 * 60000));
    $$('input[name=when]').forEach((r) => r.onchange = () => $('#schedBox').classList.toggle('hide', $('input[name=when]:checked').value !== 'sched'));
    $$('[data-add]').forEach((b) => b.onclick = () => { $('#cdt').value = localISO(new Date(Date.now() + +b.dataset.add * 60000)); });
    $('#cgo').onclick = () => {
      const quizId = $('#cq').value;
      if (!quizId) return toast('Elige un quiz', 'err');
      const selection = $$('.qs').filter((r) => $('.qk', r).checked).map((r) => ({ pos: +$('.qk', r).dataset.pos, time: +$('.qtm', r).value }));
      if (!selection.length) return toast('Selecciona al menos una pregunta', 'err');
      let scheduledAt = null;
      if ($('input[name=when]:checked').value === 'sched') {
        scheduledAt = new Date($('#cdt').value).getTime();
        if (!scheduledAt) return toast('Elige fecha y hora', 'err');
      }
      socket.emit('admin:configure', { quizId, selection, scheduledAt }, (r) => { if (!r || !r.ok) toast((r && r.error) || 'No se pudo abrir la sala', 'err'); });
    };
  }

  /* ── Juego: control en vivo ── */
  function liveHtml() {
    const s = S, q = s.question;
    let main = '';
    if (s.phase === 'lobby') {
      main = `<div class="center-txt"><h3>${s.scheduledAt ? 'Empieza en' : 'Esperando que la inicies'}</h3>
        ${s.scheduledAt ? `<div class="count" data-until="${s.scheduledAt}" data-fmt="long"></div><p class="mut">${esc(new Date(s.scheduledAt).toLocaleString())}</p>` : '<div class="big-emoji">🎮</div>'}
        <p>${s.total} preguntas · ${s.online} conectados</p></div>`;
    } else if (s.phase === 'question' || s.phase === 'reveal') {
      const rev = s.phase === 'reveal';
      main = `<div class="qhead"><div class="qn">Pregunta ${s.index + 1} de ${s.total}</div><div class="qt" ${rev ? '' : `data-until="${s.endsAt}"`}>${rev ? '✔' : ''}</div></div>
        ${rev ? '' : `<div class="bar"><i data-bar-until="${s.endsAt}" data-bar-total="${q.time * 1000}"></i></div>`}
        <h2 class="qtext">${esc(q.text)}</h2>
        <div class="aview">${q.options.map((o, i) => `<div class="av a${i} ${rev && i === q.correct ? 'ok' : ''} ${rev && i !== q.correct ? 'dim' : ''}"><span>${SHAPES[i]}</span><span>${esc(o)}</span>${rev ? `<b>${s.counts[i]}</b>` : ''}</div>`).join('')}</div>
        <p class="mut center-txt">${rev ? 'La siguiente pregunta empieza en unos segundos…' : `Respondieron ${s.answered} de ${s.online}`}</p>`;
    } else {
      main = `<div class="center-txt"><h2>🏁 Partida terminada</h2>${podiumHtml(s.board || [])}</div>`;
    }
    const ctrl = `<div class="ctrl">
      ${s.phase === 'lobby' ? '<button class="btn primary" data-a="start">▶ Empezar ahora</button>' : ''}
      ${s.phase === 'question' || s.phase === 'reveal' ? '<button class="btn" data-a="skip">⏭ Saltar</button>' : ''}
      ${['lobby', 'question', 'reveal'].includes(s.phase) ? '<button class="btn danger" data-a="end">⏹ Terminar</button>' : ''}
      <button class="btn ghost" data-a="reset">🔄 Nueva configuración</button></div>`;
    const chips = (s.players || []).map((p) => `<span class="pc ${p.online ? '' : 'off'}">${esc(p.name)}<button data-kick="${esc(p.name)}" title="Sacar de la sala" aria-label="Sacar a ${esc(p.name)}">✕</button></span>`).join('') || '<span class="mut">Nadie ha entrado todavía.</span>';
    return `<div class="grid2"><section class="panel"><h2>${esc(s.quizTitle)}</h2>${main}${ctrl}</section>
      <section class="panel"><h3>🏆 Ranking</h3>${boardHtml(s.board) || '<p class="mut">Aún sin puntos.</p>'}
      <h3 style="margin-top:1rem">👥 Jugadores (${(s.players || []).length})</h3><div class="pchips">${chips}</div></section></div>`;
  }

  /* ── Preguntas ── */
  let quizEd = null;
  async function viewQuizzes() {
    const t = $('#tab');
    quizEd = null;
    t.onclick = t.oninput = t.onchange = null;
    t.innerHTML = '<div class="panel">Cargando…</div>';
    let list = [];
    try { list = await api('/api/quizzes'); } catch (e) { toast(e.message, 'err'); }
    t.innerHTML = `<div class="bar-top"><h2>❓ Mis quizzes</h2><button class="btn primary" id="qnew">＋ Nuevo quiz</button></div>
      <div class="cards-grid">${list.map((q) => `<div class="panel"><h3>${esc(q.title)}</h3><p class="mut">${q.count} ${q.count === 1 ? 'pregunta' : 'preguntas'}</p>
        <div class="row"><button class="btn sm" data-edit="${q.id}">✏️ Editar</button><button class="btn danger sm" data-del="${q.id}">🗑 Eliminar</button></div></div>`).join('') || '<p class="mut">Todavía no tienes quizzes. Crea el primero.</p>'}</div>`;
    $('#qnew').onclick = () => openQuiz(null);
    t.onclick = async (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openQuiz(+ed.dataset.edit);
      if (dl && confirm('¿Eliminar este quiz y todas sus preguntas?')) {
        try { await api('/api/quizzes/' + dl.dataset.del, { method: 'DELETE' }); viewQuizzes(); } catch (er) { toast(er.message, 'err'); }
      }
    };
  }
  const blankQ = () => ({ text: '', options: ['', '', '', ''], correct: 0, time: 20, points: 1000 });
  async function openQuiz(id) {
    if (id) {
      try {
        const q = await api('/api/quizzes/' + id);
        quizEd = { id, title: q.title, questions: q.questions.map((x) => ({ ...x, options: [...x.options, '', '', '', ''].slice(0, 4) })) };
      } catch (e) { return toast(e.message, 'err'); }
    } else quizEd = { id: null, title: '', questions: [blankQ()] };
    renderQuizEd();
  }
  const TIMES = [5, 10, 15, 20, 30, 45, 60, 90, 120], PTS = [500, 1000, 2000];
  function qBlock(q, i) {
    const n = quizEd.questions.length;
    return `<div class="qb" data-qi="${i}"><div class="qb-head"><b>Pregunta ${i + 1}</b><span class="sp"></span>
      <button class="btn ghost sm" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
      <button class="btn ghost sm" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>
      <button class="btn danger sm" data-act="del" aria-label="Eliminar pregunta">🗑</button></div>
      <textarea data-f="text" rows="2" maxlength="300" placeholder="Escribe la pregunta">${esc(q.text)}</textarea>
      <div class="opts">${[0, 1, 2, 3].map((o) => `<label class="opt a${o}"><input type="radio" name="c${i}" data-f="correct" value="${o}" ${q.correct === o ? 'checked' : ''} title="Respuesta correcta"><input data-f="opt" data-oi="${o}" maxlength="120" value="${esc(q.options[o])}" placeholder="${o < 2 ? 'Opción ' + (o + 1) : 'Opción ' + (o + 1) + ' (opcional)'}"></label>`).join('')}</div>
      <div class="g2"><label>⏱ Tiempo para responder<select data-f="time">${TIMES.map((x) => `<option value="${x}" ${q.time === x ? 'selected' : ''}>${x} segundos</option>`).join('')}</select></label>
      <label>⭐ Puntos máximos<select data-f="points">${PTS.map((x) => `<option value="${x}" ${q.points === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div></div>`;
  }
  function renderQuizEd() {
    const e = quizEd, t = $('#tab');
    t.innerHTML = `<div class="bar-top"><button class="btn ghost" id="qback">← Volver</button><h2>${e.id ? 'Editar quiz' : 'Nuevo quiz'}</h2><button class="btn primary" id="qsave">💾 Guardar quiz</button></div>
      <div class="panel"><label style="margin:0">Título del quiz<input data-f="title" maxlength="80" value="${esc(e.title)}" placeholder="Ej: Trivia de la fiesta"></label></div>
      <div id="qlist">${e.questions.map(qBlock).join('')}</div>
      <button class="btn" id="qadd">＋ Añadir pregunta</button>
      <p class="mut small">Marca con el círculo la respuesta correcta. Las opciones 3 y 4 son opcionales.</p>`;
    $('#qback').onclick = viewQuizzes;
    $('#qadd').onclick = () => { quizEd.questions.push(blankQ()); renderQuizEd(); const l = $$('.qb').pop(); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    $('#qsave').onclick = saveQuiz;
    const onIn = (ev) => {
      const el = ev.target, f = el.dataset.f;
      if (!f || !quizEd) return;
      const blk = el.closest('[data-qi]');
      if (!blk) { if (f === 'title') quizEd.title = el.value; return; }
      const q = quizEd.questions[+blk.dataset.qi];
      if (f === 'text') q.text = el.value;
      else if (f === 'opt') q.options[+el.dataset.oi] = el.value;
      else if (f === 'correct') q.correct = +el.value;
      else if (f === 'time') q.time = +el.value;
      else if (f === 'points') q.points = +el.value;
    };
    t.oninput = onIn; t.onchange = onIn;
    t.onclick = (ev) => {
      const b = ev.target.closest('[data-act]');
      if (!b) return;
      const i = +b.closest('[data-qi]').dataset.qi, qs = quizEd.questions;
      if (b.dataset.act === 'del') { if (qs.length === 1) return toast('El quiz necesita al menos una pregunta', 'err'); qs.splice(i, 1); }
      else if (b.dataset.act === 'up' && i > 0) [qs[i - 1], qs[i]] = [qs[i], qs[i - 1]];
      else if (b.dataset.act === 'down' && i < qs.length - 1) [qs[i + 1], qs[i]] = [qs[i], qs[i + 1]];
      renderQuizEd();
    };
  }
  async function saveQuiz() {
    const e = quizEd, title = e.title.trim();
    if (!title) return toast('Ponle un título al quiz', 'err');
    const qs = [];
    for (let i = 0; i < e.questions.length; i++) {
      const q = e.questions[i], text = q.text.trim(), o = q.options.map((x) => x.trim());
      if (!text) return toast(`Pregunta ${i + 1}: falta el texto`, 'err');
      if (!o[0] || !o[1]) return toast(`Pregunta ${i + 1}: escribe al menos 2 opciones`, 'err');
      let n = 2; while (n < 4 && o[n]) n++;
      if (o.slice(n).some(Boolean)) return toast(`Pregunta ${i + 1}: no dejes opciones vacías entre medio`, 'err');
      if (q.correct >= n) return toast(`Pregunta ${i + 1}: marca una respuesta correcta que tenga texto`, 'err');
      qs.push({ text, options: o.slice(0, n), correct: q.correct, time: q.time, points: q.points });
    }
    try {
      await api(e.id ? '/api/quizzes/' + e.id : '/api/quizzes', { method: e.id ? 'PUT' : 'POST', body: { title, questions: qs } });
      toast('Quiz guardado', 'ok');
      viewQuizzes();
    } catch (er) { toast(er.message, 'err'); }
  }

  /* ── Historial ── */
  async function viewHistory() {
    const t = $('#tab');
    t.onclick = t.oninput = t.onchange = null;
    let g = [];
    try { g = await api('/api/games'); } catch (e) { toast(e.message, 'err'); }
    t.innerHTML = `<h2>📊 Historial de partidas</h2><div class="panel">${g.length ? `<table class="tbl"><tr><th>Fecha</th><th>Quiz</th><th>Jugadores</th><th></th></tr>${g.map((x) => `<tr><td>${esc(new Date(x.started_at).toLocaleString())}</td><td>${esc(x.title)}</td><td>${x.players}</td><td><button class="btn sm" data-g="${x.id}">Ver resultados</button></td></tr>`).join('')}</table>` : '<p class="mut">Cuando termine tu primera partida, sus resultados aparecerán aquí.</p>'}</div><div id="hres" style="margin-top:14px"></div>`;
    t.onclick = async (e) => {
      const b = e.target.closest('[data-g]');
      if (!b) return;
      try {
        const r = await api('/api/games/' + b.dataset.g);
        $('#hres').innerHTML = `<div class="panel"><h3>${esc(r.title)}</h3><table class="tbl"><tr><th>#</th><th>Jugador</th><th>Puntos</th><th>Aciertos</th></tr>${r.results.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.player)}</td><td>${x.score}</td><td>${x.correct}</td></tr>`).join('')}</table></div>`;
      } catch (er) { toast(er.message, 'err'); }
    };
  }

  /* ───────── arranque ───────── */
  (async () => {
    try {
      const cfgUrl = (SERVER_BASE ? SERVER_BASE : '') + '/api/config';
      let r = await fetch(cfgUrl).catch(() => null);
      if (!r || !r.ok) r = await fetch(VPS_SERVER + '/api/config');
      Object.assign(config, await r.json());
    } catch (e) { /* usa location.origin */ }
    try { session = JSON.parse(sessionStorage.session || 'null'); } catch (e) { session = null; }
    if (session && session.name) connect(); else viewLogin();
  })();
})();
