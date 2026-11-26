// API des 30 ans d'Alessia — Cloudflare Worker + D1
import { playerView, fullView, playerAct, mjAct, demoDb } from './game.js';
const ACTS = ['escape', 'resto', 'kpop'];
const VOTES = ['yes', 'maybe', 'no'];
const MAX_GUESTS = 200;
const SALT = 'a30|doudou|';
const SALT_ADMIN = 'a30|admin|';

const EMPTY_CFG = () => ({
  deadline: '', date: '', city: '',
  acts: { escape: { time: '', addr: '' }, resto: { time: '', addr: '' }, kpop: { time: '', addr: '' } },
  invites: [],
});

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const fail = (error, status = 400) => json({ error }, status);

const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const keyOf = (n) => n.trim().toLowerCase();
const parisToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getConfig(db) {
  const row = await db.prepare("SELECT v FROM kv WHERE k='config'").first();
  const base = EMPTY_CFG();
  if (!row) return base;
  try {
    const c = JSON.parse(row.v);
    for (const a of ACTS) base.acts[a] = { ...base.acts[a], ...((c.acts || {})[a] || {}) };
    base.deadline = c.deadline || ''; base.date = c.date || ''; base.city = c.city || '';
    base.invites = Array.isArray(c.invites) ? c.invites : [];
  } catch (_) {}
  return base;
}

// Compteur global des codes ratés (affiché sur la page « parchemin scellé » d'Alessia). Seul le nombre est gardé, jamais les codes.
async function bumpTroll(env) {
  await env.DB.prepare("INSERT INTO kv (k,v) VALUES ('troll_n','1') ON CONFLICT(k) DO UPDATE SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT)").run();
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k='troll_n'").first();
  return row ? parseInt(row.v, 10) || 0 : 0;
}

// Vérifie le code organisateur (6 chiffres) avec limitation des essais par IP.
async function checkOrga(request, env, adminOnly) {
  const code = request.headers.get('x-code') || '';
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const now = Date.now();
  await env.DB.prepare('DELETE FROM attempts WHERE ts < ?').bind(now - 3600e3).run();
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM attempts WHERE ip=?').bind(ip).first();
  if (n && n.n >= 10) return 'locked';
  let ok = false;
  if (/^[0-9]{4}$/.test(code)) {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k='admin_hash'").first();
    ok = !!row && (await sha256(SALT_ADMIN + code)) === row.v;
  } else if (!adminOnly && /^[0-9]{6}$/.test(code)) {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k='code_hash'").first();
    ok = !!row && (await sha256(SALT + code)) === row.v;
  }
  if (!ok) {
    await env.DB.prepare('INSERT INTO attempts (ip, ts) VALUES (?, ?)').bind(ip, now).run();
    return 'bad';
  }
  return 'ok';
}

async function readGuests(db, withMsg) {
  const { results } = await db.prepare('SELECT * FROM guests ORDER BY updated_at').all();
  const guests = {};
  for (const r of results) {
    let votes = {};
    try { votes = JSON.parse(r.votes); } catch (_) {}
    const g = { name: r.name, votes, plus: { on: !!r.plus_on, name: r.plus_name } };
    if (withMsg) g.msg = r.msg;
    guests[r.id] = g;
  }
  return guests;
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const db = env.DB;

  if (path === '/api/state' && method === 'GET') {
    const hasCode = !!request.headers.get('x-code');
    let orga = false;
    if (hasCode) {
      const r = await checkOrga(request, env);
      if (r === 'locked') return fail('locked', 429);
      if (r === 'bad') return fail('code', 401);
      orga = true;
    }
    const config = await getConfig(db);
    if (!orga) delete config.invites;
    const gr = await db.prepare("SELECT v FROM kv WHERE k='game'").first();
    let gameOn = false;
    try { gameOn = !!(gr && JSON.parse(gr.v).on); } catch (_) {}
    return json({ guests: await readGuests(db, orga), config, game_on: gameOn });
  }

  if (path === '/api/guest' && method === 'PUT') {
    let b;
    try { b = await request.json(); } catch (_) { return fail('json'); }
    const name = clean(b.name, 40);
    if (!name) return fail('name');
    const config = await getConfig(db);
    if (config.deadline && parisToday() > config.deadline) return fail('closed', 403);
    const id = keyOf(name);
    const existing = await db.prepare('SELECT * FROM guests WHERE id=?').bind(id).first();
    if (!existing) {
      const c = await db.prepare('SELECT COUNT(*) AS n FROM guests').first();
      if (c.n >= MAX_GUESTS) return fail('full', 403);
    }
    let votes = {};
    if (b.votes !== undefined) {
      for (const a of ACTS) if (VOTES.includes((b.votes || {})[a])) votes[a] = b.votes[a];
    } else if (existing) { try { votes = JSON.parse(existing.votes); } catch (_) {} }
    const plusOn = b.plus !== undefined ? (b.plus && b.plus.on ? 1 : 0) : existing ? existing.plus_on : 0;
    const plusName = b.plus !== undefined ? (plusOn ? clean(b.plus.name, 40) : '') : existing ? existing.plus_name : '';
    if (plusOn && !plusName) return fail('plus');
    const msg = b.msg !== undefined ? clean(b.msg, 300) : existing ? existing.msg : '';
    await db
      .prepare(
        `INSERT INTO guests (id, name, votes, plus_on, plus_name, msg, updated_at) VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET votes=excluded.votes, plus_on=excluded.plus_on,
         plus_name=excluded.plus_name, msg=excluded.msg, updated_at=excluded.updated_at`
      )
      .bind(id, existing ? existing.name : name, JSON.stringify(votes), plusOn, plusName, msg, Date.now())
      .run();
    return json({ ok: true });
  }

  if (path === '/api/config' && method === 'PUT') {
    const r = await checkOrga(request, env);
    if (r === 'locked') return fail('locked', 429);
    if (r !== 'ok') return fail('code', 401);
    let b;
    try { b = await request.json(); } catch (_) { return fail('json'); }
    const c = EMPTY_CFG();
    const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
    const isTime = (s) => /^\d{2}:\d{2}$/.test(s) ? s : '';
    c.date = isDate(b.date || ''); c.deadline = isDate(b.deadline || ''); c.city = clean(b.city, 40);
    for (const a of ACTS) {
      const x = (b.acts || {})[a] || {};
      c.acts[a] = { time: isTime(x.time || ''), addr: clean(x.addr, 120) };
    }
    c.invites = (Array.isArray(b.invites) ? b.invites : []).map((n) => clean(n, 40)).filter(Boolean).slice(0, 300);
    await db.prepare("INSERT INTO kv (k,v) VALUES ('config', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(JSON.stringify(c)).run();
    return json({ ok: true, config: c });
  }

  if (path === '/api/reset' && method === 'POST') {
    const r = await checkOrga(request, env);
    if (r === 'locked') return fail('locked', 429);
    if (r !== 'ok') return fail('code', 401);
    await db.batch([db.prepare('DELETE FROM guests'), db.prepare("DELETE FROM kv WHERE k='config'")]);
    return json({ ok: true });
  }

  if (path === '/api/orga/check' && method === 'POST') {
    const r = await checkOrga(request, env);
    if (r !== 'ok') return json({ error: r === 'locked' ? 'locked' : 'code', n: await bumpTroll(env) }, r === 'locked' ? 429 : 401);
    return json({ ok: true });
  }

  // Modifier / supprimer un participant (espace organisateur)
  if (path === '/api/guests' && (method === 'PATCH' || method === 'DELETE')) {
    const r = await checkOrga(request, env);
    if (r === 'locked') return fail('locked', 429);
    if (r !== 'ok') return fail('code', 401);
    let b;
    try { b = await request.json(); } catch (_) { return fail('json'); }
    const id = clean(b.id, 40).toLowerCase();
    const old = await db.prepare('SELECT * FROM guests WHERE id=?').bind(id).first();
    if (!old) return fail('missing', 404);
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM guests WHERE id=?').bind(id).run();
      return json({ ok: true });
    }
    const name = clean(b.name, 40);
    if (!name) return fail('name');
    const nid = keyOf(name);
    if (nid !== id) {
      const clash = await db.prepare('SELECT id FROM guests WHERE id=?').bind(nid).first();
      if (clash) return fail('exists', 409);
    }
    const votes = {};
    for (const a of ACTS) if (VOTES.includes((b.votes || {})[a])) votes[a] = b.votes[a];
    const plusOn = b.plus && b.plus.on ? 1 : 0;
    const plusName = plusOn ? clean(b.plus.name, 40) : '';
    if (plusOn && !plusName) return fail('plus');
    await db.batch([
      db.prepare('DELETE FROM guests WHERE id=?').bind(id),
      db.prepare('INSERT INTO guests (id, name, votes, plus_on, plus_name, msg, updated_at) VALUES (?,?,?,?,?,?,?)')
        .bind(nid, name, JSON.stringify(votes), plusOn, plusName, old.msg, old.updated_at),
    ]);
    return json({ ok: true, id: nid });
  }

  // ---- Jeu de groupe ----
  let gdb = db;
  if (path.startsWith('/api/game') && request.headers.get('x-demo') === '1') {
    const r = await checkOrga(request, env, true); // la démo est réservée au code admin
    if (r === 'locked') return fail('locked', 429);
    if (r !== 'ok') return fail('code', 401);
    gdb = demoDb(db);
  }
  if (path === '/api/game' && method === 'GET') {
    return json(await playerView(gdb, url.searchParams.get('me') || '', Date.now()));
  }
  const pm = path.match(/^\/api\/game\/(join|seq|vote|tap|cri|rate|opick)$/);
  if (pm && method === 'POST') {
    let b;
    try { b = await request.json(); } catch (_) { return fail('json'); }
    const r = await playerAct(gdb, pm[1], b, Date.now());
    return r.error ? fail(r.error, r.error === 'off' || r.error === 'closed' ? 403 : 400) : json(r);
  }
  if (path.startsWith('/api/game/')) {
    const r = await checkOrga(request, env, true);
    if (r === 'locked') return fail('locked', 429);
    if (r !== 'ok') return fail('code', 401);
    if (path === '/api/game/full' && method === 'GET') return json(await fullView(gdb, Date.now()));
    if (path === '/api/game/act' && method === 'POST') {
      let b;
      try { b = await request.json(); } catch (_) { return fail('json'); }
      const res = await mjAct(gdb, b, Date.now());
      return res.error ? fail(res.error) : json(await fullView(gdb, Date.now()));
    }
    if (path === '/api/game/photo' && method === 'POST') {
      const type = request.headers.get('content-type') || '';
      if (!/^image\/(jpeg|png|webp)$/.test(type)) return fail('type');
      const buf = await request.arrayBuffer();
      if (buf.byteLength > 1900000) return fail('size', 413);
      const c = await db.prepare('SELECT COUNT(*) AS n FROM photos').first();
      if (c.n >= 150) return fail('full', 403);
      await db.prepare('INSERT INTO photos (mime, data, created) VALUES (?,?,?)').bind(type, buf, Date.now()).run();
      return json({ ok: true });
    }
    if (path === '/api/game/photo' && method === 'GET') {
      const row = await db.prepare('SELECT mime, data FROM photos WHERE id=?').bind(parseInt(url.searchParams.get('id'), 10) || 0).first();
      if (!row) return fail('missing', 404);
      const body = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
      return new Response(body, { headers: { 'content-type': row.mime, 'cache-control': 'private, max-age=3600' } });
    }
    if (path === '/api/game/photo' && method === 'DELETE') {
      await db.prepare('DELETE FROM photos WHERE id=?').bind(parseInt(url.searchParams.get('id'), 10) || 0).run();
      return json({ ok: true });
    }
    return fail('not_found', 404);
  }

  // Menu admin caché (code à 4 chiffres). Le code admin ouvre aussi l'espace organisateur.
  if (path === '/api/admin/check' && method === 'POST') {
    const r = await checkOrga(request, env, true);
    if (r !== 'ok') return json({ error: r === 'locked' ? 'locked' : 'code', n: await bumpTroll(env) }, r === 'locked' ? 429 : 401);
    return json({ ok: true });
  }

  return fail('not_found', 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (e) {
      return fail('server', 500);
    }
  },
};
