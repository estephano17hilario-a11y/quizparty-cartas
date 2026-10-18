'use strict';
/**
 * QuizParty + Cartas QR
 * - Una sola sala de juego (estilo Kahoot) con Socket.IO
 * - El usuario ADMIN_USER entra como anfitrión; cualquier otro nombre entra como jugador
 * - Preguntas, cartas, QR y resultados se guardan en SQLite (data/app.db) en tu propio servidor
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_USER = (process.env.ADMIN_USER || 'gianelletecprata18').trim().toLowerCase();
const ADMIN_PIN = process.env.ADMIN_PIN || ''; // opcional pero MUY recomendado
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'app.db');

/* ───────────── Base de datos ───────────── */
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS quizzes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS questions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  options TEXT NOT NULL,
  correct INTEGER NOT NULL,
  time_limit INTEGER NOT NULL DEFAULT 20,
  points INTEGER NOT NULL DEFAULT 1000
);
CREATE TABLE IF NOT EXISTS cards(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  qr TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS games(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER,
  title TEXT,
  started_at INTEGER,
  finished_at INTEGER
);
CREATE TABLE IF NOT EXISTS game_results(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct INTEGER NOT NULL
);
`);

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/* ───────────── Autenticación del anfitrión ───────────── */
const tokens = new Set();
const attempts = new Map(); // ip -> {n, reset}
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
function tooManyAttempts(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now > a.reset) { attempts.set(ip, { n: 0, reset: now + 10 * 60 * 1000 }); return false; }
  return a.n >= 8;
}
function requireAdmin(req, res, next) {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tokens.has(t)) return res.status(401).json({ error: 'No autorizado' });
  next();
}
const wrap = (fn) => (req, res) => {
  try { fn(req, res); } catch (e) { res.status(400).json({ error: e.message || 'Error' }); }
};

/* ───────────── Express ───────────── */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Enable CORS for Vercel and cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ status: 'ok', time: Date.now() }));
app.get('/vendor/qrcode.js', (req, res) => res.sendFile(require.resolve('qrcode-generator')));
app.get('/c/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'card.html')));
app.get('/api/config', (req, res) => res.json({ publicUrl: PUBLIC_URL, adminUser: ADMIN_USER }));

app.post('/api/login', (req, res) => {
  const name = String((req.body && req.body.name) || '').trim().slice(0, 24);
  if (!name) return res.status(400).json({ error: 'Escribe un nombre de usuario' });
  if (name.toLowerCase() === ADMIN_USER) {
    if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
    if (ADMIN_PIN) {
      const pin = String((req.body && req.body.pin) || '');
      if (!pin) return res.status(401).json({ error: 'Escribe el PIN de anfitrión', needPin: true });
      if (!safeEqual(pin, ADMIN_PIN)) {
        attempts.get(req.ip).n++;
        return res.status(401).json({ error: 'PIN incorrecto', needPin: true });
      }
    }
    const token = crypto.randomBytes(24).toString('hex');
    tokens.add(token);
    return res.json({ role: 'admin', name, token });
  }
  res.json({ role: 'player', name });
});

/* ── Quizzes ── */
function cleanQuestions(arr) {
  if (!Array.isArray(arr) || !arr.length) throw new Error('Agrega al menos una pregunta');
  if (arr.length > 100) throw new Error('Máximo 100 preguntas por quiz');
  return arr.map((q, i) => {
    const text = String((q && q.text) || '').trim().slice(0, 300);
    const options = (Array.isArray(q && q.options) ? q.options : []).map((o) => String(o || '').trim().slice(0, 120));
    const correct = Number(q && q.correct);
    if (!text) throw new Error(`Pregunta ${i + 1}: falta el texto`);
    if (options.length < 2 || options.length > 4 || options.some((o) => !o)) throw new Error(`Pregunta ${i + 1}: usa entre 2 y 4 opciones`);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw new Error(`Pregunta ${i + 1}: respuesta correcta inválida`);
    return {
      text, options, correct,
      time: clamp(Math.round(Number(q.time) || 20), 5, 120),
      points: clamp(Math.round(Number(q.points) || 1000), 100, 5000),
    };
  });
}
const insQuiz = db.prepare('INSERT INTO quizzes(title,created_at) VALUES(?,?)');
const insQ = db.prepare('INSERT INTO questions(quiz_id,position,text,options,correct,time_limit,points) VALUES(?,?,?,?,?,?,?)');
const saveQuiz = db.transaction((id, title, qs) => {
  if (!id) id = Number(insQuiz.run(title, Date.now()).lastInsertRowid);
  else {
    db.prepare('UPDATE quizzes SET title=? WHERE id=?').run(title, id);
    db.prepare('DELETE FROM questions WHERE quiz_id=?').run(id);
  }
  qs.forEach((q, i) => insQ.run(id, i, q.text, JSON.stringify(q.options), q.correct, q.time, q.points));
  return id;
});
function getQuiz(id) {
  const quiz = db.prepare('SELECT id,title FROM quizzes WHERE id=?').get(id);
  if (!quiz) return null;
  quiz.questions = db.prepare('SELECT text,options,correct,time_limit,points FROM questions WHERE quiz_id=? ORDER BY position').all(id)
    .map((r) => ({ text: r.text, options: JSON.parse(r.options), correct: r.correct, time: r.time_limit, points: r.points }));
  return quiz;
}
app.get('/api/quizzes', requireAdmin, wrap((req, res) => {
  res.json(db.prepare('SELECT q.id,q.title,q.created_at,(SELECT COUNT(*) FROM questions WHERE quiz_id=q.id) AS count FROM quizzes q ORDER BY q.id DESC').all());
}));
app.get('/api/quizzes/:id', requireAdmin, wrap((req, res) => {
  const q = getQuiz(Number(req.params.id));
  if (!q) return res.status(404).json({ error: 'Quiz no encontrado' });
  res.json(q);
}));
app.post('/api/quizzes', requireAdmin, wrap((req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 80);
  if (!title) throw new Error('Ponle un título al quiz');
  res.json({ id: saveQuiz(null, title, cleanQuestions(req.body.questions)) });
}));
app.put('/api/quizzes/:id', requireAdmin, wrap((req, res) => {
  const id = Number(req.params.id);
  if (!getQuiz(id)) return res.status(404).json({ error: 'Quiz no encontrado' });
  const title = String(req.body.title || '').trim().slice(0, 80);
  if (!title) throw new Error('Ponle un título al quiz');
  saveQuiz(id, title, cleanQuestions(req.body.questions));
  res.json({ id });
}));
app.delete('/api/quizzes/:id', requireAdmin, wrap((req, res) => {
  db.prepare('DELETE FROM quizzes WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
}));

/* ── Cartas ── */
const newCardId = () => crypto.randomBytes(6).toString('base64url');
function imgOnly(v) { return typeof v === 'string' && /^data:image\//.test(v) ? v : ''; }
function cleanCard(b) {
  const name = String((b && b.name) || '').trim().slice(0, 60);
  if (!name) throw new Error('La carta necesita un nombre');
  const data = b.data && typeof b.data === 'object' ? b.data : {};
  const qr = b.qr && typeof b.qr === 'object' ? b.qr : {};
  data.image = imgOnly(data.image);
  qr.logo = imgOnly(qr.logo);
  const d = JSON.stringify(data), q = JSON.stringify(qr);
  if (d.length > 3_000_000 || q.length > 1_500_000) throw new Error('Alguna imagen es demasiado grande');
  return { name, d, q };
}
app.get('/api/cards', requireAdmin, wrap((req, res) => {
  res.json(db.prepare('SELECT id,name,data,qr,updated_at FROM cards ORDER BY updated_at DESC').all()
    .map((r) => ({ id: r.id, name: r.name, data: JSON.parse(r.data), qr: JSON.parse(r.qr), updated_at: r.updated_at })));
}));
app.get('/api/cards/:id', wrap((req, res) => { // público: lo abre el QR
  const r = db.prepare('SELECT id,name,data FROM cards WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Carta no encontrada' });
  res.json({ id: r.id, name: r.name, data: JSON.parse(r.data) });
}));
app.post('/api/cards', requireAdmin, wrap((req, res) => {
  const { name, d, q } = cleanCard(req.body);
  let id = String(req.body.id || '');
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(id)) id = newCardId();
  if (db.prepare('SELECT 1 FROM cards WHERE id=?').get(id)) id = newCardId();
  const now = Date.now();
  db.prepare('INSERT INTO cards(id,name,data,qr,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id, name, d, q, now, now);
  res.json({ id });
}));
app.put('/api/cards/:id', requireAdmin, wrap((req, res) => {
  const { name, d, q } = cleanCard(req.body);
  const r = db.prepare('UPDATE cards SET name=?,data=?,qr=?,updated_at=? WHERE id=?').run(name, d, q, Date.now(), req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Carta no encontrada' });
  res.json({ id: req.params.id });
}));
app.post('/api/cards/bulk-delete', requireAdmin, wrap((req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 1000) : [];
  const del = db.prepare('DELETE FROM cards WHERE id=?');
  db.transaction(() => ids.forEach((i) => del.run(String(i))))();
  res.json({ ok: true, deleted: ids.length });
}));

/* ── Historial ── */
app.get('/api/games', requireAdmin, wrap((req, res) => {
  res.json(db.prepare('SELECT g.id,g.title,g.started_at,g.finished_at,(SELECT COUNT(*) FROM game_results r WHERE r.game_id=g.id) AS players FROM games g ORDER BY g.id DESC LIMIT 50').all());
}));
app.get('/api/games/:id', requireAdmin, wrap((req, res) => {
  const g = db.prepare('SELECT id,title,started_at,finished_at FROM games WHERE id=?').get(Number(req.params.id));
  if (!g) return res.status(404).json({ error: 'Partida no encontrada' });
  g.results = db.prepare('SELECT player,score,correct FROM game_results WHERE game_id=? ORDER BY score DESC').all(g.id);
  res.json(g);
}));

/* ───────────── Juego en vivo (sala única) ───────────── */
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e6,
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const players = new Map(); // clave(minúsculas) -> {name,pid,score,correct,socketId,cur}
const freshGame = () => ({
  phase: 'idle', // idle | lobby | question | reveal | finished
  quizId: null, quizTitle: '', items: [], index: -1,
  scheduledAt: null, startedAt: 0, qStart: 0, endsAt: 0, revealEndsAt: 0,
});
let game = freshGame();

const online = () => [...players.values()].filter((p) => p.socketId);
const ranking = () => [...players.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
const board = (n) => ranking().slice(0, n).map((p) => ({ name: p.name, score: p.score, online: !!p.socketId }));

function stateFor(socket) {
  const g = game, now = Date.now();
  const s = { phase: g.phase, now, scheduledAt: g.scheduledAt, quizTitle: g.quizTitle, total: g.items.length, index: g.index, online: online().length };
  const q = g.items[g.index];
  if (q && (g.phase === 'question' || g.phase === 'reveal')) {
    s.question = { text: q.text, options: q.options, time: q.time, points: q.points };
    s.endsAt = g.endsAt;
    s.answered = online().filter((p) => p.cur && p.cur.q === g.index).length;
    if (g.phase === 'reveal') {
      s.question.correct = q.correct;
      s.counts = q.options.map((_, i) => [...players.values()].filter((p) => p.cur && p.cur.q === g.index && p.cur.choice === i).length);
    }
  }
  if (g.phase === 'reveal') s.board = board(5);
  if (g.phase === 'finished') s.board = board(10);
  if (socket.data.role === 'admin') {
    s.board = board(10);
    s.players = [...players.values()].map((p) => ({ name: p.name, score: p.score, online: !!p.socketId }));
  } else {
    const p = players.get(socket.data.key);
    if (p) {
      const cur = p.cur && p.cur.q === g.index ? p.cur : null;
      s.me = { name: p.name, score: p.score, rank: ranking().indexOf(p) + 1, choice: cur ? cur.choice : null };
      if (g.phase === 'reveal') { s.me.ok = !!(cur && cur.ok); s.me.pts = cur && cur.ok ? cur.pts : 0; }
    }
  }
  return s;
}
function broadcast() {
  for (const sock of io.sockets.sockets.values()) sock.emit('state', stateFor(sock));
}

function startGame() {
  if (!game.items.length) return;
  game.startedAt = Date.now();
  game.index = 0;
  for (const p of players.values()) { p.score = 0; p.correct = 0; p.cur = null; }
  startQuestion();
}
function startQuestion() {
  const q = game.items[game.index];
  for (const p of players.values()) p.cur = null;
  game.phase = 'question';
  game.qStart = Date.now();
  game.endsAt = game.qStart + q.time * 1000;
  broadcast();
}
function toReveal() {
  for (const p of players.values()) {
    if (p.cur && p.cur.q === game.index && p.cur.ok) { p.score += p.cur.pts; p.correct++; }
  }
  game.phase = 'reveal';
  game.revealEndsAt = Date.now() + 6000;
  broadcast();
}
function nextStep() {
  if (game.index + 1 < game.items.length) { game.index++; startQuestion(); } else finish();
}
function saveResults() {
  if (!game.startedAt) return;
  try {
    db.transaction(() => {
      const id = db.prepare('INSERT INTO games(quiz_id,title,started_at,finished_at) VALUES(?,?,?,?)')
        .run(game.quizId, game.quizTitle, game.startedAt, Date.now()).lastInsertRowid;
      const ins = db.prepare('INSERT INTO game_results(game_id,player,score,correct) VALUES(?,?,?,?)');
      for (const p of ranking()) ins.run(id, p.name, p.score, p.correct);
    })();
  } catch (e) { console.error('No se pudieron guardar los resultados:', e.message); }
}
function finish() {
  if (game.phase === 'finished' || game.phase === 'idle') return;
  game.phase = 'finished';
  saveResults();
  broadcast();
}
function resetGame() {
  game = freshGame();
  for (const [k, p] of players) { if (!p.socketId) players.delete(k); else { p.score = 0; p.correct = 0; p.cur = null; } }
  broadcast();
}

setInterval(() => {
  const now = Date.now();
  if (game.phase === 'lobby' && game.scheduledAt && now >= game.scheduledAt) startGame();
  else if (game.phase === 'question') {
    const on = online();
    if (now >= game.endsAt || (on.length && on.every((p) => p.cur && p.cur.q === game.index))) toReveal();
  } else if (game.phase === 'reveal' && now >= game.revealEndsAt) nextStep();
}, 250);

io.use((socket, next) => {
  const a = socket.handshake.auth || {};
  const name = String(a.name || '').trim().slice(0, 24);
  if (!name) return next(new Error('Escribe un nombre de usuario'));
  if (a.token && tokens.has(a.token)) {
    socket.data.role = 'admin';
    socket.data.name = name;
    return next();
  }
  if (name.toLowerCase() === ADMIN_USER) return next(new Error('Ese nombre está reservado para el anfitrión'));
  const key = name.toLowerCase();
  const pid = String(a.pid || '').slice(0, 40);
  const ex = players.get(key);
  if (ex && ex.socketId && ex.pid !== pid) return next(new Error('Ese nombre ya está en uso en la sala'));
  socket.data.role = 'player';
  socket.data.name = name;
  socket.data.key = key;
  socket.data.pid = pid;
  next();
});

io.on('connection', (socket) => {
  const isAdmin = socket.data.role === 'admin';
  if (!isAdmin) {
    const key = socket.data.key;
    const p = players.get(key);
    if (p) {
      const oldId = p.socketId;
      p.socketId = socket.id; // primero asignamos, luego cerramos el anterior
      p.pid = socket.data.pid;
      if (oldId && oldId !== socket.id) { const old = io.sockets.sockets.get(oldId); if (old) old.disconnect(true); }
    } else {
      players.set(key, { name: socket.data.name, pid: socket.data.pid, score: 0, correct: 0, socketId: socket.id, cur: null });
    }
  }
  broadcast();

  socket.on('answer', (choice) => {
    if (isAdmin || game.phase !== 'question') return;
    const p = players.get(socket.data.key);
    const q = game.items[game.index];
    if (!p || !q || (p.cur && p.cur.q === game.index)) return;
    const now = Date.now();
    if (now > game.endsAt + 700) return;
    choice = Number(choice);
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return;
    const ok = choice === q.correct;
    const frac = clamp((now - game.qStart) / (q.time * 1000), 0, 1);
    p.cur = { q: game.index, choice, ok, pts: ok ? Math.round(q.points * (1 - frac / 2)) : 0 };
    broadcast();
  });

  if (isAdmin) {
    socket.on('admin:configure', (p, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const quiz = getQuiz(Number(p && p.quizId));
        if (!quiz) throw new Error('Quiz no encontrado');
        const sel = Array.isArray(p.selection) ? p.selection : [];
        const items = sel.map((s) => {
          const q = quiz.questions[Number(s.pos)];
          return q ? { ...q, time: clamp(Math.round(Number(s.time) || q.time), 5, 120) } : null;
        }).filter(Boolean);
        if (!items.length) throw new Error('Selecciona al menos una pregunta');
        let sch = null;
        if (p.scheduledAt) { sch = Number(p.scheduledAt); if (!Number.isFinite(sch)) throw new Error('Fecha inválida'); }
        for (const [k, pl] of players) { if (!pl.socketId) players.delete(k); else { pl.score = 0; pl.correct = 0; pl.cur = null; } }
        game = { ...freshGame(), phase: 'lobby', quizId: quiz.id, quizTitle: quiz.title, items, scheduledAt: sch };
        broadcast();
        reply({ ok: true });
      } catch (e) { reply({ ok: false, error: e.message }); }
    });
    socket.on('admin:start', () => { if (game.phase === 'lobby') startGame(); });
    socket.on('admin:skip', () => {
      if (game.phase === 'lobby') startGame();
      else if (game.phase === 'question') toReveal();
      else if (game.phase === 'reveal') nextStep();
    });
    socket.on('admin:end', () => { if (game.phase === 'lobby') resetGame(); else finish(); });
    socket.on('admin:reset', () => resetGame());
    socket.on('admin:kick', (name) => {
      const key = String(name || '').toLowerCase();
      const p = players.get(key);
      if (!p) return;
      const sock = p.socketId && io.sockets.sockets.get(p.socketId);
      players.delete(key);
      if (sock) { sock.emit('kicked'); sock.disconnect(true); }
      broadcast();
    });
  }

  socket.on('disconnect', () => {
    if (!isAdmin) {
      const p = players.get(socket.data.key);
      if (p && p.socketId === socket.id) {
        p.socketId = null;
        if (game.phase === 'idle' || game.phase === 'lobby') players.delete(socket.data.key);
      }
    }
    broadcast();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`QuizParty listo en el puerto ${PORT}`);
  console.log(`Anfitrión: "${ADMIN_USER}" ${ADMIN_PIN ? '(con PIN)' : '(SIN PIN: define ADMIN_PIN para protegerlo)'}`);
  console.log(`Base de datos: ${DB_FILE}`);
});
