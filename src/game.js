// Jeu de groupe « La Quête des 30 ans » — logique serveur.
// État MJ dans kv('game') ; écritures des joueurs dans la table gplay (pas de conflit avec le MJ).

export const CLANS = ['feu', 'foudre', 'vent'];

// Mode démo : même logique, mais sur une partie séparée (kv 'game_demo' + table gplay_demo).
export function demoDb(db) {
  const tr = (sql) => sql.replace(/\bgplay\b/g, 'gplay_demo').replace("k='game'", "k='game_demo'").replace("('game',", "('game_demo',");
  return { demo: true, prepare: (sql) => db.prepare(tr(sql)), batch: (a) => db.batch(a) };
}
const FAKE = ['Léa', 'Marc', 'Tom', 'Zoé', 'Paul', 'Inès', 'Hugo', 'Alessia'];
const STEPS = 7; // 0 ouverture, 1 rythme, 2 savoir, 3 ombre, 4 destin, 5 boss, 6 hokage
const MOVES = ['heart', 'bigheart', 'horse', 'tt', 'shimmy', 'wave', 'point', 'flip', 'mudra', 'run'];
const BOSS_HP = 2026;

export const MIMES = [
  'Faire du surf', 'Traire une vache', 'Marcher sur un Lego', 'Monter un meuble', 'Faire de la poterie',
  'Un pingouin', 'Une licorne', "Changer la couche d'un bébé", 'Rater une marche', 'Un singe',
  'Promener un chien qui tire trop fort', 'Prendre un selfie', 'Manger un citron', 'Faire un strike',
  'Faire tomber son plateau de service', 'Un super-héros qui décolle', 'Un mannequin qui défile', 'Faire du ski',
  'Un zombie', 'Ouvrir un pot de confiture impossible', "Un chef d'orchestre", 'Tondre la pelouse',
  'Un rodéo sur un taureau', 'Un bébé qui fait ses premiers pas', 'Se faire piquer par une guêpe',
  'Un videur de boîte de nuit', 'Une poule qui couve un œuf', 'Un dentiste', 'Faire une omelette', 'Un dinosaure',
];

export const DESTIN = [
  {
    title: 'Ichiraku Ramen',
    text: "Sanjûbi a volé la recette secrète des ramens. Le chef refuse de servir qui que ce soit tant qu'elle n'est pas retrouvée. Que fait votre clan ?",
    opts: ["Payer l'addition et partir", 'Défier le chef à un concours', "S'infiltrer en cuisine déguisés en bols"],
  },
  {
    title: 'La Forêt de la Mort',
    text: "Sanjûbi s'est réfugié au cœur de la Forêt de la Mort. Trois chemins s'offrent à vous. Lequel prenez-vous ?",
    opts: ['La route balisée', 'Le raccourci par le marais', "La tyrolienne au-dessus des serpents d'Orochimaru"],
  },
  {
    title: 'Le repaire de Sanjûbi',
    text: "Les 30 bougies d'Alessia sont gardées par les sbires de Sanjûbi. Comment les récupérer ?",
    opts: ['Négocier avec les sbires', 'Créer une diversion', 'Attaque frontale en clones d’ombre'],
  },
];
const RISK = ['Prudent · +1 point assuré', 'Audacieux · +3 si le dé fait 3 ou plus', 'Fou · +6 sur 5 ou 6, sinon −1 et un gage'];
const GAGES = [
  'Chanter le générique de Naruto',
  'Faire la course Naruto autour de la table',
  'Imiter Sanjûbi pendant 10 secondes',
  'Faire un cœur des doigts à chaque personne',
  'Danser 10 secondes de K-pop',
];

// Ajoute des points ; un gain compte double si le joker du clan est posé sur l'épreuve en cours.
function addPts(g, clan, n) {
  const j = g.joker && g.joker[clan];
  g.scores[clan] += n > 0 && j && j.step === g.step ? n * 2 : n;
}
const die = () => 1 + Math.floor(Math.random() * 6);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function fresh() {
  const per = (v) => ({ feu: v(), foudre: v(), vent: v() });
  return {
    on: false, step: 0, rev: 0,
    roster: {}, // id -> { name, clan }
    scores: per(() => 0),
    joker: per(() => ({ step: null, at: 0 })), // joker x2 : une épreuve par clan (Rythme à Destin)
    timer: null, // { end, dur }
    ouv: { view: 'intro', drawAt: 0, order: [], spot: null, spotAt: 0 },
    savoir: { list: [], idx: 0 },
    ombre: { used: [], turn: 0, cur: null, idx: { feu: 0, foudre: 0, vent: 0 }, count: { feu: 0, foudre: 0, vent: 0 }, startAt: 0 },
    destin: { c: 0, stage: 'vote', mjVotes: {}, results: null, at: 0 },
    rythme: { lockAt: 0, cur: null, stage: null, results: {}, songs: { feu: '', foudre: '', vent: '' }, music: null },
    boss: { hp: BOSS_HP, p1: null, p2: null, dead: false, deadAt: 0 },
    hokage: { slide: false, at: 0 },
  };
}

async function load(db) {
  const row = await db.prepare("SELECT v FROM kv WHERE k='game'").first();
  const g = fresh();
  if (!row) return g;
  try { const v = JSON.parse(row.v); return { ...g, ...v, ouv: { ...g.ouv, ...(v.ouv || {}) }, rythme: { ...g.rythme, ...(v.rythme || {}) }, ombre: { ...g.ombre, ...(v.ombre || {}) }, joker: { ...g.joker, ...(v.joker || {}) } }; } catch (_) { return g; }
}
async function save(db, g) {
  g.rev = (g.rev || 0) + 1;
  await db.prepare("INSERT INTO kv (k,v) VALUES ('game', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(JSON.stringify(g)).run();
}
async function playRows(db, prefix) {
  const { results } = await db.prepare('SELECT k, v FROM gplay WHERE k LIKE ?').bind(prefix + '%').all();
  return results;
}
// Fusionne les joueurs inscrits depuis leur téléphone dans le roster.
async function roster(db, g) {
  const r = { ...g.roster };
  for (const row of await playRows(db, 'p:')) {
    const id = row.k.slice(2);
    if (!r[id]) { try { r[id] = { name: JSON.parse(row.v).name, clan: null, phone: true }; } catch (_) {} }
    else r[id] = { ...r[id], phone: true };
  }
  return r;
}
function members(r) {
  const m = { feu: [], foudre: [], vent: [], none: [] };
  for (const id of Object.keys(r)) m[r[id].clan || 'none'].push(r[id].name);
  for (const k in m) m[k].sort((a, b) => a.localeCompare(b, 'fr'));
  return m;
}
async function seqs(db) {
  const out = {};
  for (const row of await playRows(db, 'seq:')) { try { out[row.k.slice(4)] = JSON.parse(row.v); } catch (_) {} }
  return out;
}
async function rateVotes(db, clan) {
  const { results } = await db.prepare('SELECT v FROM gplay WHERE k LIKE ?').bind('rv:' + clan + ':%').all();
  return results.map((r) => +r.v).filter((n) => n >= 1 && n <= 5);
}
function rLocked(g, now) { return !!(g.rythme.cur || (g.rythme.lockAt && now > g.rythme.lockAt)); }
async function cris(db) {
  const out = {};
  for (const row of await playRows(db, 'cri:')) out[row.k.slice(4)] = row.v;
  return out;
}
// Ordre de révélation : clans en alternance, Alessia en dernier.
function revealOrder(r) {
  const by = { feu: [], foudre: [], vent: [] };
  for (const id of shuffle(Object.keys(r))) if (r[id].clan && id !== 'alessia') by[r[id].clan].push(id);
  const order = [];
  const cl = shuffle(CLANS);
  for (let i = 0; order.length < by.feu.length + by.foudre.length + by.vent.length; i++) for (const c of cl) if (by[c][i]) order.push(by[c][i]);
  if (r.alessia && r.alessia.clan) order.push('alessia');
  return order;
}
async function votes(db, g) {
  const out = {};
  for (const row of await playRows(db, 'vote:' + g.destin.c + ':')) out[row.k.split(':')[2]] = row.v;
  return { ...out, ...g.destin.mjVotes };
}
async function tapsTotal(db) {
  const r = await db.prepare("SELECT COALESCE(SUM(CAST(v AS INTEGER)),0) AS n FROM gplay WHERE k LIKE 'tap:%'").first();
  return r ? r.n : 0;
}
function ombreState(g, clan, now) {
  const c = g.ombre.cur;
  if (!c || c.done || c.mime === null || now > c.end) return 'wait';
  return c.red[clan] ? 'red' : 'green';
}

// ---- Vue publique (joueur) ----
export async function playerView(db, name, now) {
  const g = await load(db);
  if (!g.on && !db.demo) return { on: false };
  const id = (name || '').trim().toLowerCase();
  const r = await roster(db, g);
  const clan = id && r[id] ? r[id].clan : null;
  const out = {
    on: true, now, step: g.step, rev: g.rev, clan, members: members(r), scores: g.scores, joker: g.joker, timer: g.timer,
  };
  if (g.step === 0) out.ouv = { view: g.ouv.view, cri: clan ? (await cris(db))[clan] || '' : '' };
  if (g.step === 1) {
    out.seq = clan ? (await seqs(db))[clan] || [] : [];
    const ry = g.rythme;
    let myRate = 0;
    if (ry.cur && id) { const v = await db.prepare('SELECT v FROM gplay WHERE k=?').bind('rv:' + ry.cur + ':' + id).first(); myRate = v ? +v.v : 0; }
    out.rythme = { locked: rLocked(g, now), lockAt: ry.lockAt, cur: ry.cur, stage: ry.stage, results: ry.results, myRate };
  }
  if (g.step === 2) { const q = g.savoir.list[g.savoir.idx]; out.savoir = { idx: g.savoir.idx, total: g.savoir.list.length, q: q ? q.q : '' }; }
  if (g.step === 3) {
    const c = g.ombre.cur;
    out.ombre = { state: clan ? ombreState(g, clan, now) : 'wait', end: c ? c.end : 0 };
    // Choix du mime : sur le téléphone du mimeur s'il en a un, sinon sur un téléphone de son clan.
    if (c && !c.done && c.mime === null && clan === c.clan) {
      const mHasPhone = c.mimeur && r[c.mimeur] && r[c.mimeur].phone;
      out.ombre.choose = { mname: c.mname || '', me: id === c.mimeur, mHasPhone: !!mHasPhone, options: (!mHasPhone || id === c.mimeur) ? c.options.map((i) => ({ i, t: MIMES[i] })) : [] };
    }
    if (c && !c.done && c.mime !== null && c.pickedBy === id) out.ombre.mine = MIMES[c.mime];
  }
  if (g.step === 4) {
    const d = DESTIN[g.destin.c];
    const v = await votes(db, g);
    out.destin = { c: g.destin.c, title: d.title, text: d.text, opts: d.opts.map((t, i) => ({ k: 'ABC'[i], t, r: RISK[i] })), stage: g.destin.stage, myVote: clan ? v[clan] || null : null, results: g.destin.results, at: g.destin.at };
  }
  if (g.step === 5) {
    const b = g.boss;
    let mine = 0;
    if (id) { const t = await db.prepare('SELECT v FROM gplay WHERE k=?').bind('tap:' + id).first(); mine = t ? +t.v : 0; }
    out.boss = { hp: b.hp, dead: b.dead, p1: !!b.p1, p2: b.p2 ? { start: b.p2.start, end: b.p2.end, done: !!b.p2.done } : null, mine };
  }
  return out;
}

// ---- Vue complète (MJ / projection) ----
export async function fullView(db, now) {
  const g = await load(db);
  const r = await roster(db, g);
  const out = { ...g, now, roster: r, members: members(r), mimes: MIMES, destinScenes: DESTIN.map((d) => ({ ...d, risk: RISK })) };
  out.seqs = await seqs(db);
  if (g.step === 1 && g.rythme.cur) { const v = await rateVotes(db, g.rythme.cur); out.rateCount = v.length; }
  out.rLocked = rLocked(g, now);
  out.cris = await cris(db);
  if (g.step === 4) out.destinVotes = await votes(db, g);
  if (g.step === 5 && g.boss.p2 && !g.boss.p2.done) out.tapsLive = await tapsTotal(db);
  const ph = await db.prepare('SELECT id FROM photos ORDER BY id').all();
  out.photos = ph.results.map((x) => x.id);
  out.demo = !!db.demo;
  return out;
}

// ---- Actions des joueurs ----
export async function playerAct(db, path, b, now) {
  const g = await load(db);
  if (!g.on && !db.demo) return { error: 'off' };
  const name = String(b.name || '').trim().slice(0, 40);
  const id = name.toLowerCase();
  if (!id) return { error: 'name' };
  if (path === 'join') {
    await db.prepare('INSERT INTO gplay (k,v) VALUES (?,?) ON CONFLICT(k) DO NOTHING').bind('p:' + id, JSON.stringify({ name })).run();
    return { ok: true };
  }
  const r = await roster(db, g);
  const clan = r[id] && r[id].clan;
  if (path === 'tap') {
    const p2 = g.boss.p2;
    if (g.step !== 5 || !p2 || p2.done || now < p2.start - 500 || now > p2.end + 1500) return { error: 'closed' };
    const n = Math.max(0, Math.min(400, parseInt(b.n, 10) || 0));
    await db.prepare('INSERT INTO gplay (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=CASE WHEN CAST(excluded.v AS INTEGER) > CAST(gplay.v AS INTEGER) THEN excluded.v ELSE gplay.v END').bind('tap:' + id, String(n)).run();
    return { ok: true };
  }
  if (!clan) return { error: 'noclan' };
  if (path === 'cri') {
    if (g.step !== 0) return { error: 'closed' };
    const txt = String(b.text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 60);
    if (txt) await db.prepare('INSERT INTO gplay (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('cri:' + clan, txt).run();
    else await db.prepare('DELETE FROM gplay WHERE k=?').bind('cri:' + clan).run();
    return { ok: true };
  }
  if (path === 'opick') {
    const c = g.ombre.cur;
    const i = parseInt(b.i, 10);
    if (g.step !== 3 || !c || c.done || c.mime !== null || clan !== c.clan || !c.options.includes(i)) return { error: 'closed' };
    c.mime = i; g.ombre.used.push(i); c.end = now + 45000; c.red = {}; c.pickedBy = id;
    g.ombre.count[c.clan] = (g.ombre.count[c.clan] || 0) + 1;
    await save(db, g);
    return { ok: true };
  }
  if (path === 'rate') {
    const ry = g.rythme;
    if (g.step !== 1 || !ry.cur || ry.stage !== 'vote' || clan === ry.cur) return { error: 'closed' };
    const n = parseInt(b.n, 10);
    if (!(n >= 1 && n <= 5)) return { error: 'n' };
    await db.prepare('INSERT INTO gplay (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('rv:' + ry.cur + ':' + id, String(n)).run();
    return { ok: true };
  }
  if (path === 'seq') {
    if (g.step !== 1 || rLocked(g, now)) return { error: 'closed' };
    const s = (Array.isArray(b.seq) ? b.seq : []).filter((k) => MOVES.includes(k)).slice(0, 4);
    await db.prepare('INSERT INTO gplay (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('seq:' + clan, JSON.stringify(s)).run();
    return { ok: true };
  }
  if (path === 'vote') {
    if (g.step !== 4 || g.destin.stage !== 'vote' || !['A', 'B', 'C'].includes(b.opt)) return { error: 'closed' };
    await db.prepare('INSERT INTO gplay (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind('vote:' + g.destin.c + ':' + clan, b.opt).run();
    return { ok: true };
  }
  return { error: 'not_found' };
}

// ---- Actions du MJ ----
export async function mjAct(db, b, now) {
  let g = await load(db);
  const t = b.type;
  const okClan = (c) => CLANS.includes(c);
  const fold = async () => { g.roster = await roster(db, g); };

  switch (t) {
    case 'on': g.on = !!b.v; break;
    case 'demoFake': {
      if (!db.demo) break;
      await fold();
      const me = String(b.me || '').trim().slice(0, 40);
      for (const n of me ? FAKE.concat(me) : FAKE) if (!g.roster[n.toLowerCase()]) g.roster[n.toLowerCase()] = { name: n, clan: null };
      break;
    }
    case 'reset': {
      const keep = g.savoir.list;
      g = fresh(); g.savoir.list = keep;
      await db.prepare('DELETE FROM gplay').run();
      break;
    }
    case 'step': g.step = Math.max(0, Math.min(STEPS - 1, b.i | 0)); g.timer = null; break;
    case 'pts': if (okClan(b.clan)) addPts(g, b.clan, Math.max(-20, Math.min(20, b.d | 0))); break;
    case 'joker': {
      if (!okClan(b.clan) || g.step < 1 || g.step > 4) break;
      const j = g.joker[b.clan];
      if (j.step === null) { j.step = g.step; j.at = now; }
      else if (j.step === g.step) { j.step = null; j.at = 0; }
      break;
    }
    case 'timer': {
      const s = Math.max(5, Math.min(900, b.sec | 0));
      g.timer = { end: now + s * 1000, dur: s };
      if (g.step === 1 && !g.rythme.cur && !Object.keys(g.rythme.results).length) g.rythme.lockAt = g.timer.end; // fin de répétition = verrouillage
      break;
    }
    case 'rUnlock': g.rythme.lockAt = 0; break;
    case 'rSongs': for (const c of CLANS) g.rythme.songs[c] = String((b.songs || {})[c] || '').trim().slice(0, 200); break;
    case 'rStage': { // un clan entre en piste
      if (!okClan(b.clan)) break;
      g.rythme.cur = b.clan; g.rythme.stage = 'dance';
      await db.prepare('DELETE FROM gplay WHERE k LIKE ?').bind('rv:' + b.clan + ':%').run();
      if (g.rythme.songs[b.clan]) g.rythme.music = { clan: b.clan, at: now };
      break;
    }
    case 'music': g.rythme.music = b.on && okClan(b.clan) && g.rythme.songs[b.clan] ? { clan: b.clan, at: now } : null; break;
    case 'rVote': if (g.rythme.cur) { g.rythme.stage = 'vote'; g.rythme.music = null; } break;
    case 'rReveal': {
      const c = g.rythme.cur;
      if (!c || g.rythme.stage !== 'vote') break;
      let v = await rateVotes(db, c);
      if (db.demo && !v.length) v = [3, 4, 4, 5, 5].map((x) => Math.max(1, Math.min(5, x - Math.floor(Math.random() * 2))));
      const avg = v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0;
      const base = Math.round(avg);
      const prev = g.rythme.results[c];
      if (prev) g.scores[c] -= prev.pts; // nouveau passage : on remplace l'ancienne note
      const jk = g.joker[c].step === g.step && base > 0;
      addPts(g, c, base);
      g.rythme.results[c] = { avg: Math.round(avg * 10) / 10, n: v.length, pts: jk ? base * 2 : base, joker: jk, at: now };
      g.rythme.cur = null; g.rythme.stage = null; g.rythme.music = null;
      break;
    }
    case 'timerStop': g.timer = null; break;

    case 'addp': {
      await fold();
      const name = String(b.name || '').trim().slice(0, 40);
      if (name && !g.roster[name.toLowerCase()]) g.roster[name.toLowerCase()] = { name, clan: null };
      break;
    }
    case 'delp': await fold(); delete g.roster[String(b.id)]; await db.prepare('DELETE FROM gplay WHERE k=?').bind('p:' + b.id).run(); break;
    case 'move': await fold(); if (g.roster[b.id]) g.roster[b.id].clan = okClan(b.clan) ? b.clan : null; break;
    case 'draw': {
      await fold();
      const ids = shuffle(Object.keys(g.roster));
      const start = Math.floor(Math.random() * 3);
      ids.forEach((id, i) => { g.roster[id].clan = CLANS[(start + i) % 3]; });
      g.ouv.order = revealOrder(g.roster); g.ouv.drawAt = now; g.ouv.view = 'clans';
      break;
    }
    case 'drawRest': {
      await fold();
      const count = { feu: 0, foudre: 0, vent: 0 };
      for (const id in g.roster) if (g.roster[id].clan) count[g.roster[id].clan]++;
      for (const id of shuffle(Object.keys(g.roster))) {
        if (g.roster[id].clan) continue;
        const c = shuffle(CLANS).sort((a, z) => count[a] - count[z])[0];
        g.roster[id].clan = c; count[c]++;
      }
      break;
    }

    case 'ouvView': if (['intro', 'clans', 'cris'].includes(b.v)) { g.ouv.view = b.v; if (b.v === 'clans' && b.replay) g.ouv.drawAt = now; } break;
    case 'criSpot': g.ouv.spot = okClan(b.clan) ? b.clan : null; g.ouv.spotAt = now; break;
    case 'savoirSet': {
      const lines = String(b.text || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 30);
      g.savoir.list = lines.map((l) => { const i = l.indexOf('|'); return i < 0 ? { q: l, a: '' } : { q: l.slice(0, i).trim(), a: l.slice(i + 1).trim() }; });
      g.savoir.idx = 0;
      break;
    }
    case 'savoirIdx': g.savoir.idx = Math.max(0, Math.min(Math.max(0, g.savoir.list.length - 1), b.i | 0)); break;

    case 'ombreNext': {
      const left = MIMES.map((_, i) => i).filter((i) => !g.ombre.used.includes(i));
      if (left.length === 0) g.ombre.used = [];
      const pool = left.length ? left : MIMES.map((_, i) => i);
      const clan = CLANS[g.ombre.turn % 3];
      g.ombre.turn += 1;
      await fold();
      const mem = Object.keys(g.roster).filter((id) => g.roster[id].clan === clan).sort((a, z) => g.roster[a].name.localeCompare(g.roster[z].name, 'fr'));
      const k = g.ombre.idx[clan] || 0;
      const mimeur = mem.length ? mem[k % mem.length] : null;
      g.ombre.idx[clan] = k + 1;
      if (!g.ombre.startAt) g.ombre.startAt = now;
      g.ombre.cur = { clan, mimeur, mname: mimeur ? g.roster[mimeur].name : '', options: shuffle(pool).slice(0, 3), mime: null, end: 0, red: {}, done: false, pickedBy: null };
      break;
    }
    case 'ombrePick': {
      const c = g.ombre.cur;
      if (!c || c.mime !== null || !c.options.includes(b.i)) break;
      c.mime = b.i; g.ombre.used.push(b.i); c.end = now + 45000; c.red = {}; c.pickedBy = null;
      g.ombre.count[c.clan] = (g.ombre.count[c.clan] || 0) + 1;
      break;
    }
    case 'ombreJudge': {
      const c = g.ombre.cur;
      if (!c || c.done || c.mime === null || !okClan(b.clan) || c.red[b.clan]) break;
      if (b.ok) {
        if (b.clan === c.clan) addPts(g, c.clan, 2);
        else { addPts(g, c.clan, 1); addPts(g, b.clan, 1); }
        c.done = true; c.winner = b.clan; c.doneAt = now;
      } else {
        c.red[b.clan] = true; c.wrongAt = now; c.wrongClan = b.clan;
        if (CLANS.every((k) => c.red[k])) c.red = {};
      }
      break;
    }
    case 'ombreSkip': if (g.ombre.cur) { g.ombre.cur.done = true; g.ombre.cur.winner = null; g.ombre.cur.doneAt = now; } break;

    case 'destinVote': if (okClan(b.clan) && ['A', 'B', 'C'].includes(b.opt)) g.destin.mjVotes[b.clan] = b.opt; break;
    case 'destinReveal': {
      if (g.destin.stage !== 'vote') break;
      const v = await votes(db, g);
      const res = {};
      for (const clan of CLANS) {
        const opt = v[clan] || 'A';
        const d = die();
        let pts, text, gage = null;
        if (opt === 'A') { pts = 1; text = 'Prudence récompensée'; }
        else if (opt === 'B') { pts = d >= 3 ? 3 : 0; text = d >= 3 ? 'Audace payante !' : 'Raté de peu'; }
        else if (d >= 5) { pts = 6; text = 'Coup de génie !'; }
        else { pts = -1; text = 'Catastrophe…'; gage = pick(GAGES); }
        const jk = g.joker[clan].step === g.step && pts > 0;
        addPts(g, clan, pts);
        if (jk) pts *= 2;
        res[clan] = { opt, die: d, pts, joker: jk, text, gage, voted: !!v[clan] };
      }
      g.destin.results = res; g.destin.stage = 'reveal'; g.destin.at = now;
      break;
    }
    case 'destinNext':
      if (g.destin.c < DESTIN.length - 1) { g.destin = { c: g.destin.c + 1, stage: 'vote', mjVotes: {}, results: null, at: 0 }; }
      break;

    case 'bossP1': {
      if (g.boss.p1) break;
      const dice = {};
      let dmg = 0;
      for (const clan of CLANS) {
        const n = Math.max(1, Math.floor(Math.max(0, g.scores[clan]) / 5));
        dice[clan] = Array.from({ length: Math.min(n, 12) }, die);
        dmg += dice[clan].reduce((a, x) => a + x, 0);
      }
      g.boss.p1 = { dice, dmg, at: now };
      g.boss.hp = Math.max(1, g.boss.hp - dmg);
      break;
    }
    case 'bossP2Start':
      if (!g.boss.p1 || (g.boss.p2 && g.boss.p2.done)) break;
      await db.prepare("DELETE FROM gplay WHERE k LIKE 'tap:%'").run();
      g.boss.p2 = { start: now + 3000, end: now + 13000, done: false, dmg: 0 };
      break;
    case 'bossP2Close': {
      const p2 = g.boss.p2;
      if (!p2 || p2.done) break;
      p2.dmg = await tapsTotal(db) + (db.demo ? 40 * Object.keys(await roster(db, g)).length + Math.floor(Math.random() * 60) : 0); p2.done = true; p2.at = now;
      g.boss.hp = Math.max(1, g.boss.hp - p2.dmg);
      break;
    }
    case 'bossFinal': if (!g.boss.dead) { g.boss.hp = 0; g.boss.dead = true; g.boss.deadAt = now; } break;
    case 'slide': g.hokage.slide = !!b.on; g.hokage.at = now; break;
    default: return { error: 'unknown' };
  }
  await save(db, g);
  return { ok: true };
}
