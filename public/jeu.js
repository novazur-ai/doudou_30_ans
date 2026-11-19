/* Jeu de groupe « La Quête des 30 ans » — écrans joueur (#jeu), maître du jeu (#mj) et projection (#ecran). */
(function () {
  'use strict';
  var A = window.A30;
  if (!A) return;
  var esc = A.esc;

  var CL = [
    { k: 'feu', n: 'Feu', bg: '#F9C3AE', ink: '#8E3A1F', p: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3 0-5 0-7z', j: ['Katon : Renaissance', 'Katon : Brasier', 'Katon : Lueur'] },
    { k: 'foudre', n: 'Foudre', bg: '#F7E3A0', ink: '#6E5300', p: 'M13 2L4 14h7l-1 8 9-12h-7z', j: ['Raiton : Second éclair', 'Raiton : Chidori', 'Raiton : Flash'] },
    { k: 'vent', n: 'Vent', bg: '#BFE3D4', ink: '#2F6F5E', p: 'M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h7', j: ['Fûton : Contre-vent', 'Fûton : Tornade', 'Fûton : Murmure'] },
  ];
  var CK = {}; CL.forEach(function (c) { CK[c.k] = c; });
  var JOKER_TXT = 'Une seule fois dans la partie, vos points comptent double sur l’épreuve de votre choix (Rythme, Savoir, Ombre ou Destin). Annoncez-le au maître du jeu avant le début de l’épreuve.';
  function jk(c) { var j = st.joker && st.joker[c]; return !j || j.step === null ? 'free' : j.step === st.step ? 'on' : 'used'; }
  var STEPN = ['Ouverture', 'Rythme', 'Savoir', 'Ombre', 'Destin', 'Sanjûbi', 'Hokage'];
  var MOVES = [
    { k: 'heart', t: 'Cœur des doigts', d: 'Pouce et index croisés, bras tendu' },
    { k: 'bigheart', t: 'Grand cœur', d: 'Bras en cœur au-dessus de la tête' },
    { k: 'horse', t: 'Le cheval', d: 'Sautille, poignets croisés' },
    { k: 'tt', t: 'Les larmes « TT »', d: 'Index sous les yeux, petite moue' },
    { k: 'shimmy', t: 'Shimmy', d: 'Épaules qui tremblent, très vite' },
    { k: 'wave', t: 'La vague', d: 'Ondule du haut vers le bas' },
    { k: 'point', t: 'Le point', d: 'Pointe le public, gauche puis droite' },
    { k: 'flip', t: 'Hair flip', d: 'Grand coup de tête sur le côté' },
    { k: 'mudra', t: 'Signes ninja', d: '3 signes de mains enchaînés' },
    { k: 'run', t: 'Course Naruto', d: 'Penché, bras tendus en arrière' },
  ];
  var MK = {}; MOVES.forEach(function (m) { MK[m.k] = m; });
  var INTRO = [
    'Il y a 30 ans, au village caché de la Feuille, naissait une kunoichi hors du commun : Alessia, l’élève de Kakashi.',
    'Aujourd’hui, pour devenir Hokage, il lui reste une dernière épreuve.',
    'Sanjûbi, le démon à 30 queues, s’est réveillé. Il a volé ses 30 bougies et veut lui voler sa jeunesse.',
    'Seuls les trois grands clans du village peuvent l’arrêter : le Feu, la Foudre et le Vent.',
    'Rythme, savoir, ombre et destin : chaque épreuve renforcera votre chakra pour le combat final.',
    'Ninjas, formez vos clans !',
  ];

  /* ---------- effets Sakuga VFX (MIT, finktheartist/sakuga-vfx) ---------- */
  function loadFx() {
    if (window.SakugaFX || document.getElementById('sk-core')) return;
    var s = document.createElement('script'); s.id = 'sk-core'; s.src = '/vendor/sakuga-core.js'; document.head.appendChild(s);
  }
  function fx(el, kind, o) {
    var F = window.SakugaFX; if (!F || !el || !el.isConnected) return;
    o = o || {};
    try {
      var c = F.at(el), big = (o.big ? 1.6 : 1) * (mode === 'ecran' ? Math.max(1, Math.min(2.2, innerWidth / 640)) : 1);
      if (kind === 'pop') { F.puff(c.x, c.y, { n: 5, size: 11 * big, vy: -16, life: 0.8 }); F.puff(c.x - c.w / 2, c.y, { n: 3, size: 8 * big, vx: -24, vy: -8, life: 0.6 }); F.puff(c.x + c.w / 2, c.y, { n: 3, size: 8 * big, vx: 24, vy: -8, life: 0.6 }); }
      if (kind === 'pon') F.sfx('pon', c.x + c.w / 2 + 20, c.y - 30 * big, { size: 70 * big, rot: 0.06, life: 0.8, col: '#ffffff', edge: '#1d1a4a' });
      if (kind === 'burst') F.burst(c.x, c.y, { r: (o.r || 90) * big, spikes: 17, life: 0.5 });
      if (kind === 'zuza' || kind === 'kachi') F.sfx(kind, c.x + c.w / 3, c.y - 40 * big, { size: 130 * big, rot: -0.1, life: 1 });
      if (kind === 'don') F.sfx('don', c.x + (o.dx || 0), c.y - (o.dy || 80) * big, { size: (o.size || 170) * big, rot: -0.12, life: 1.05 });
    } catch (_) {}
  }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '#g{position:fixed;inset:0;overflow-y:auto;z-index:30;font-family:Nunito,sans-serif;color:#3A3350;-webkit-tap-highlight-color:transparent}',
    '#g.peach{background-color:#F8D3BE;background-image:radial-gradient(#EFC3A9 1.5px,transparent 1.6px);background-size:18px 18px}',
    '#g.dark{background:#3A3350;color:#fff}',
    '#g .w{max-width:460px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));box-sizing:border-box;display:flex;flex-direction:column;gap:14px;min-height:100%}',
    '#g h1{margin:0;font-family:Caveat,"Bradley Hand",cursive;font-size:40px;font-weight:700;line-height:1}',
    '#g .hd{display:flex;align-items:center;justify-content:space-between;gap:10px}',
    '#g .card{background:#fff;border:1.5px solid #E2D9EE;border-radius:20px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;color:#3A3350}',
    '#g .lab{font-size:12px;font-weight:800;letter-spacing:.06em;color:#6A6280;text-transform:uppercase}',
    '#g .ser{font-family:Fraunces,Georgia,serif;font-weight:700}',
    '#g button{font-family:Nunito,sans-serif;cursor:pointer;color:inherit}',
    '#g .btn{height:54px;border-radius:16px;border:0;background:#6B5B9A;color:#fff;font-family:Fraunces,Georgia,serif;font-weight:700;font-size:18px;box-shadow:0 5px 0 #4E4178;padding:0 16px}',
    '#g .btn:disabled{opacity:.45}',
    '#g .btn2{height:46px;border-radius:14px;border:1.5px solid #E2D9EE;background:#fff;font-weight:800;font-size:15px;color:#3A3350;padding:0 14px}',
    '#g .chip{height:34px;padding:0 12px;border-radius:999px;border:1.5px solid #E2D9EE;background:#fff;font-weight:800;font-size:13px;color:#3A3350;white-space:nowrap}',
    '#g .chip.on{background:#6B5B9A;color:#fff;border-color:#6B5B9A}',
    '#g .muted{color:#6A6280;font-weight:700;font-size:14px}',
    '#g .row{display:flex;align-items:center;gap:8px}',
    '#g .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    '#g .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '#g input,#g textarea{font-family:Nunito,sans-serif;font-size:16px;border:1.5px solid #E2D9EE;border-radius:12px;padding:10px 12px;background:#fff;color:#3A3350;box-sizing:border-box;width:100%}',
    '#g textarea{min-height:150px;resize:vertical}',
    '#g .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-weight:800;font-size:13px}',
    '#g .row>.gbar{flex:1}#g .gbar{height:12px;flex-shrink:0;border-radius:999px;background:#EEE7F5;overflow:hidden;min-width:40px}#g .gbar>i{display:block;height:100%;background:#6B5B9A;border-radius:999px}',
    '#g.dark .gbar{background:rgba(255,255,255,.14)}#g .hp>i{background:#C0506A}',
    '#g .full{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px;color:#fff;transition:background .3s}',
    '#g .scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}#g .scroll::-webkit-scrollbar{display:none}',
    /* animations */
    '@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes spin{to{transform:rotate(360deg)}}',
    '@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(244,198,211,.9),0 8px 0 #4E4178}50%{box-shadow:0 0 0 22px rgba(244,198,211,0),0 8px 0 #4E4178}}',
    '@keyframes roll{0%{transform:rotate(0) translateY(0)}25%{transform:rotate(90deg) translateY(-14px)}50%{transform:rotate(180deg)}75%{transform:rotate(270deg) translateY(-8px)}100%{transform:rotate(360deg)}}',
    '@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes hit{0%,100%{transform:translateX(0)}20%{transform:translateX(-12px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}',
    '@keyframes boom{0%{transform:scale(1);opacity:1;filter:none}30%{transform:scale(1.15) rotate(-6deg);filter:brightness(2)}100%{transform:scale(2.4) rotate(14deg);opacity:0;filter:brightness(3) blur(6px)}}',
    '@keyframes flash{0%{opacity:0}10%{opacity:1}100%{opacity:0}}@keyframes pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}',
    '@keyframes drop{0%{transform:translateY(-40vh) rotate(-12deg);opacity:0}70%{transform:translateY(8px) rotate(3deg);opacity:1}100%{transform:translateY(0) rotate(-4deg)}}',
    '@keyframes rise{0%{transform:translateY(30px);opacity:0}100%{transform:none;opacity:1}}@keyframes fadein{from{opacity:0}to{opacity:1}}',
    '@keyframes upulse{from{transform:scale(1)}to{transform:scale(1.12)}}.urg{animation:upulse .5s ease-in-out infinite alternate;display:inline-block}#g.proj .urg{color:#fff;background:#C0506A!important}',
    '.rolling{animation:roll .45s linear infinite}.boss{animation:sway 3s ease-in-out infinite;transform-origin:50% 80%}.boss.hit{animation:hit .5s ease-in-out}.boss.boom{animation:boom 1.6s ease-in forwards}',
    '@media (prefers-reduced-motion:reduce){#g *,.fig *{animation:none!important}}',
    /* projection */
    '#g.proj{overflow:hidden}#g .pw{position:absolute;inset:0;padding:3.2vw 4vw;box-sizing:border-box;display:flex;flex-direction:column;gap:2.4vw}',
    '#g .pt{font-family:Caveat,cursive;font-weight:700;font-size:7vw;line-height:.95;margin:0}#g .pk{font-size:1.3vw;font-weight:800;letter-spacing:.1em;color:#6A6280;text-transform:uppercase}',
    '#g .pclock{background:#3A3350;color:#fff;border-radius:2vw;padding:.6vw 2.4vw;font-family:Fraunces,serif;font-weight:700;font-size:5vw;line-height:1}',
    '#g .slide{position:absolute;inset:0;background:#111;display:flex;align-items:center;justify-content:center}#g .slide img{position:absolute;max-width:100%;max-height:100%;object-fit:contain;animation:fadein 1s ease-out}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- helpers ---------- */
  var st = null, mode = null, root = null, pollT = null, tickT = null, off = 0, busy = false, lastHtml = '';
  var pl = { rate: 0, rateAt: 0, seq: null, seqAt: 0, vote: null, voteAt: 0, taps: 0, tapSent: 0, p2: null, joined: '' };
  var mj = { sel: null, resetArm: false, upl: 0 };
  var photoUrls = {}, slideIdx = 0, slideAt = 0;

  function now() { return Date.now() + off; }
  function demo() { return A.sess.get(A.KX) === '1'; }
  function myName() { return A.me() || (demo() ? 'Théo' : ''); }
  function ico(c, size, stroke) { return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (stroke || c.ink) + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + c.p + '"/></svg>'; }
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function cdu(end, cls, style) { return '<span data-cd="' + end + '" data-urg="1" class="' + (cls || '') + (end - now() <= 10000 && end > now() ? ' urg' : '') + '" style="' + (style || '') + '">' + mmss(end - now()) + '</span>'; }
  function cd(end, cls, style) { return '<span data-cd="' + end + '" class="' + (cls || '') + '" style="' + (style || '') + '">' + mmss(end - now()) + '</span>'; }
  function cdBar(end, dur, cls) { return '<div class="gbar ' + (cls || '') + '"><i data-cdbar="' + end + '" data-dur="' + dur + '" style="width:' + Math.max(0, Math.min(100, (end - now()) / dur * 100)) + '%"></i></div>'; }
  /* ---------- pictogrammes de danse ----------
     Bonhomme plein (style pictogramme) : tête ronde, membres épais à 2 segments.
     Angles en degrés : 0 = vers le bas, 90 = vers la gauche de l'écran, -90 = vers la droite, 180 = vers le haut.
     [corps y, buste, bras G haut, bras G bas, bras D haut, bras D bas, jambe G haut, jambe G bas, jambe D haut, jambe D bas] */
  // Angles ABSOLUS à l'écran (convertis plus bas en angles relatifs pour les articulations).
  var N = [0, 0, 20, 10, -20, -10, 14, 6, -14, -6];
  var POSES = {
    heart: { d: 1.1, p: [[0, 0, 40, -40, -105, -105, 14, 6, -14, -6], [-2, -3, 40, -40, -122, -140, 14, 6, -14, -6]] },
    bigheart: { d: 1.3, back: 1, p: [[0, -5, 150, 205, 210, 155, 14, 6, -14, -6], [-2, 5, 150, 205, 210, 155, 16, 4, -12, -8]] },
    horse: { d: 0.5, p: [[0, 0, 15, -95, -15, 95, 55, -5, -8, -4], [-5, 0, 15, -95, -15, 95, 8, 4, -55, 5]] },
    tt: { d: 0.9, p: [[0, -4, 75, 195, -75, 165, 14, 6, -14, -6], [-2, 4, 72, 190, -72, 170, 14, 6, -14, -6]] },
    shimmy: { d: 0.28, p: [[0, -10, 75, 25, -65, -15, 16, 6, -16, -6], [-2, 10, 65, 15, -75, -25, 16, 6, -16, -6]] },
    wave: { d: 1.2, p: [[0, -12, 125, 165, -50, -20, 10, 4, -18, -8], [-3, 12, 50, 20, -125, -165, 18, 8, -10, -4]] },
    point: { d: 1.4, p: [[0, 4, 92, 92, -40, 40, 10, 4, -20, -8], [0, -4, 40, -40, -92, -92, 20, 8, -10, -4]] },
    flip: { d: 1.3, p: [[0, 0, 40, -40, -160, 110, 14, 6, -14, -6], [-2, -22, 40, -40, -175, 95, 18, 8, -10, -4]] },
    mudra: { d: 0.45, p: [[3, 0, 95, -78, -95, 78, 28, -8, -28, 8], [1, 0, 112, -60, -112, 60, 20, -4, -20, 4]] },
    run: { d: 0.42, p: [[0, 25, 58, 58, 46, 46, -45, 15, 40, 85], [-4, 25, 54, 54, 50, 50, 40, 85, -45, 15]] },
  };
  // absolus -> relatifs : bras = absolu - buste, avant-bras = absolu - bras, tibia = absolu - cuisse
  function rel(a) { return [a[0], a[1], a[2] - a[1], a[3] - a[2], a[4] - a[1], a[5] - a[4], a[6], a[7] - a[6], a[8], a[9] - a[8]]; }
  N = rel(N);
  Object.keys(POSES).forEach(function (k) { POSES[k].p = POSES[k].p.map(rel); });
  // Version chibi : grosse tête, membres courts, mains et pieds ronds.
  var J = [['bd', 0, 0], ['to', 30, 58], ['a1', 0, -17], ['a1f', 0, 11], ['a2', 0, -17], ['a2f', 0, 11], ['l1', 30, 58], ['l1f', 0, 11], ['l2', 30, 58], ['l2f', 0, 11]];
  function jt(i, v) { return J[i][0] === 'bd' ? 'translate(0px,' + v + 'px)' : 'translate(' + J[i][1] + 'px,' + J[i][2] + 'px) rotate(' + v + 'deg)'; }
  (function () {
    var s = '.fig g{transform-box:view-box;transform-origin:0 0}';
    Object.keys(POSES).forEach(function (k) {
      var m = POSES[k], A0 = m.p[0], B0 = m.p[1];
      J.forEach(function (j, i) {
        s += '@keyframes p-' + k + '-' + j[0] + '{0%,100%{transform:' + jt(i, A0[i]) + '}50%{transform:' + jt(i, B0[i]) + '}}';
        s += '.mv-' + k + ' .j-' + j[0] + '{animation:p-' + k + '-' + j[0] + ' ' + m.d + 's ease-in-out infinite}';
      });
    });
    var st2 = document.createElement('style'); st2.textContent = s; document.head.appendChild(st2);
  })();
  function fig(k, size, clan, noBubble) {
    size = size || 40;
    var c = clan ? CK[clan] : null, ink = c ? c.ink : '#3A3350', band = c ? c.bg : '#F4C6D3', skin = '#FDE7DA', P = (POSES[k] || { p: [N] }).p[0];
    var g = function (i, inner) { return '<g class="j-' + J[i][0] + '" style="transform:' + jt(i, P[i]) + '">' + inner + '</g>'; };
    var seg = function (L, w) { return '<line x1="0" y1="0" x2="0" y2="' + L + '" stroke-width="' + w + '"/>'; };
    var hand = '<circle cx="0" cy="11" r="4.6" fill="' + skin + '" stroke="' + ink + '" stroke-width="2"/>';
    var arm = function (a, f) { return g(a, seg(11, 6) + g(f, seg(10, 6) + hand)); };
    var leg = function (a, f) { return g(a, seg(11, 7) + g(f, seg(11, 7) + '<circle cx="0" cy="11" r="4" fill="' + ink + '" stroke="none"/>')); };
    var head = '<g transform="translate(0,-31)"><circle r="13" fill="' + skin + '" stroke="' + ink + '" stroke-width="2.5"/><path d="M-12.6 -4 H12.6" stroke="' + band + '" stroke-width="6"/>' +
      '<rect x="-5" y="-7" width="10" height="6" rx="1.5" fill="#B9BDC8" stroke="' + ink + '" stroke-width="1"/><path d="M12 -5 l6 -3 M12 -3 l6 2" stroke="' + band + '" stroke-width="2.4"/>' +
      '<circle cx="-4.5" cy="3" r="1.6" fill="' + ink + '" stroke="none"/><circle cx="4.5" cy="3" r="1.6" fill="' + ink + '" stroke="none"/><path d="M-3 7.5 q3 2.5 6 0" stroke-width="1.4"/></g>';
    var bubble = noBubble ? '' : '<g><circle cx="51" cy="13" r="15" fill="#fff" stroke="#D9CEF0" stroke-width="1.4"/><image href="/vendor/em/' + k + '.png" x="39.5" y="1.5" width="23" height="23"/></g>';
    return '<svg class="fig mv-' + k + '" width="' + size + '" height="' + Math.round(size * 1.4) + '" viewBox="0 0 60 84" fill="none" stroke="' + ink + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;overflow:visible">' +
      g(0, leg(6, 7) + leg(8, 9) + g(1, seg(-17, 9) + ((POSES[k] || {}).back ? arm(2, 3) + arm(4, 5) + head : head + arm(2, 3) + arm(4, 5)))) + bubble + '</svg>';
  }
  function star(on, size) { return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="' + (on ? '#F2B53A' : 'none') + '" stroke="' + (on ? '#C98A12' : '#B7AECB') + '" stroke-width="1.6" stroke-linejoin="round"/></svg>'; }
  function stars(avg, size) { var h = ''; for (var i = 1; i <= 5; i++) h += star(avg >= i - 0.5, size); return h; }
  function yt(u) {
    u = String(u || ''); var m = u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/); if (!m) return null;
    var tt = u.match(/[?&](?:t|start)=([0-9hms]+)/), s = 0;
    if (tt) { var v = tt[1]; if (/^\d+$/.test(v)) s = +v; else { var hh = v.match(/(\d+)h/), mm = v.match(/(\d+)m/), ss = v.match(/(\d+)s/); s = (hh ? +hh[1] * 3600 : 0) + (mm ? +mm[1] * 60 : 0) + (ss ? +ss[1] : 0); } }
    return { id: m[1], start: s };
  }
  function code() { return A.sess.get(A.KC) || ''; }
  function req(path, o) { o = o || {}; return A.api(path, { method: o.method, body: o.body, auth: !!o.auth }); }
  function act(type, extra) {
    var b = extra || {}; b.type = type;
    return req('/api/game/act', { method: 'POST', body: b, auth: true }).then(function (s) { setState(s); }).catch(function (er) { A.toast(A.errMsg(er)); });
  }
  function bossSvg(cls, w) {
    return '<svg class="' + cls + '" width="' + w + '" viewBox="0 0 380 330" fill="none" aria-hidden="true" style="max-width:100%;height:auto">' +
      '<g stroke="#C0506A" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M190 210 C 120 160, 60 150, 20 90"/><path d="M190 210 C 130 140, 90 100, 70 30"/><path d="M190 210 C 160 130, 150 70, 140 10"/><path d="M190 210 C 200 130, 215 70, 230 10"/><path d="M190 210 C 240 140, 290 100, 310 30"/><path d="M190 210 C 260 160, 320 150, 360 90"/></g>' +
      '<g stroke="#F4C6D3" stroke-width="3" stroke-linecap="round" opacity=".55"><path d="M190 210 C 100 180, 50 190, 8 150"/><path d="M190 210 C 110 120, 110 60, 100 18"/><path d="M190 210 C 270 120, 270 60, 280 18"/><path d="M190 210 C 280 180, 330 190, 372 150"/></g>' +
      '<ellipse cx="190" cy="235" rx="110" ry="88" fill="#251F36" stroke="#C0506A" stroke-width="5"/><path d="M118 178 L 98 128 L 150 160 Z M262 178 L 282 128 L 230 160 Z" fill="#251F36" stroke="#C0506A" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M145 225 q 18 -16 36 0" stroke="#F7E6A8" stroke-width="7" stroke-linecap="round"/><path d="M199 225 q 18 -16 36 0" stroke="#F7E6A8" stroke-width="7" stroke-linecap="round"/><path d="M160 270 q 30 18 60 0" stroke="#F4C6D3" stroke-width="5" stroke-linecap="round"/></svg>';
  }
  function hpBar(hp, h) { return '<div class="gbar hp" style="height:' + (h || 16) + 'px"><i style="width:' + (hp / 2026 * 100) + '%;transition:width 1s ease-out"></i></div>'; }
  function fmt(n) { return Number(n).toLocaleString('fr-FR'); }

  /* ---------- cycle de vie ---------- */
  function show(r) {
    mode = r;
    if (!root) {
      root = document.createElement('div'); root.id = 'g'; document.body.appendChild(root);
      root.addEventListener('click', onClick); root.addEventListener('pointerdown', onDown);
      root.addEventListener('change', onChange);
    }
    loadFx(); lastHtml = ''; draw(); poll();
    clearInterval(pollT); pollT = setInterval(function () { if (!document.hidden) poll(); }, r === 'ecran' ? 1000 : 1500);
    clearInterval(tickT); tickT = setInterval(tick, 250);
  }
  function hide() {
    mode = null; clearInterval(pollT); clearInterval(tickT); musicKey = ''; var mb = document.getElementById('gmusic'); if (mb) mb.remove();
    if (root) { root.remove(); root = null; }
  }
  function poll() {
    if (busy || !mode) return;
    busy = true;
    var p = mode === 'jeu' ? req('/api/game?me=' + encodeURIComponent(myName())) : req('/api/game/full', { auth: true });
    p.then(function (s) { busy = false; setState(s); })
      .catch(function (er) { busy = false; if (er && er.status === 401) { A.go('orga-acces'); } });
  }
  function setState(s) {
    if (!s || !mode) return;
    if (s.now) off = s.now - Date.now();
    st = s;
    if (mode === 'jeu' && s.on && myName() && pl.joined !== myName()) {
      pl.joined = myName();
      req('/api/game/join', { method: 'POST', body: { name: myName() } }).then(poll).catch(function () { pl.joined = ''; });
    }
    draw();
  }
  function draw() {
    if (!root || !mode) return;
    if (mode === 'ecran' && revealing() && root.getAttribute('data-reveal') === String(st.ouv.drawAt)) return;
    var r = mode === 'jeu' ? vPlayer() : mode === 'mj' ? vMJ() : vProj();
    if (demo()) r.html += '<div class="gdemo" style="position:fixed;top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:10px;background:#3A3350;color:#fff;border-radius:999px;padding:6px 8px 6px 14px;font:800 12px Nunito,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);white-space:nowrap">' +
      '<span style="color:#F7E6A8;letter-spacing:.08em">DÉMO</span>' + [['mj', 'Console'], ['jeu', 'Joueur'], ['ecran', 'Écran']].map(function (x) { return '<a href="#' + x[0] + '" style="color:' + (mode === x[0] ? '#F7E6A8' : '#fff') + ';text-decoration:none">' + x[1] + '</a>'; }).join('') +
      '<button data-g="demoquit" style="border:0;background:#fff;color:#3A3350;border-radius:999px;height:26px;padding:0 10px;font:800 12px Nunito,sans-serif">Quitter</button></div>';
    root.className = r.cls || 'peach';
    if (r.html === lastHtml) return;
    // conserve la saisie en cours
    var keep = {}, active = document.activeElement && document.activeElement.id;
    root.querySelectorAll('input[id],textarea[id]').forEach(function (e) { if (e.type !== 'file') keep[e.id] = e.value; });
    var y = root.scrollTop;
    root.innerHTML = r.html; lastHtml = r.html;
    Object.keys(keep).forEach(function (id) { var e = document.getElementById(id); if (e && e.type !== 'file') e.value = keep[id]; });
    if (active) { var e = document.getElementById(active); if (e) e.focus(); }
    root.scrollTop = y;
    if (mode === 'ecran') fxHook();
  }
  function tick() {
    if (!root) return;
    var t = now();
    root.querySelectorAll('[data-cd]').forEach(function (e) { var rem = +e.getAttribute('data-cd') - t; e.textContent = mmss(rem); if (e.hasAttribute('data-urg')) e.classList.toggle('urg', rem <= 10000 && rem > 0); });
    root.querySelectorAll('[data-cdbar]').forEach(function (e) { e.style.width = Math.max(0, Math.min(100, (+e.getAttribute('data-cdbar') - t) / +e.getAttribute('data-dur') * 100)) + '%'; });
    // ré-affichages liés au temps (dés, fin de chrono, rasengan, diaporama)
    if (st && (needsTimeRedraw(t))) { lastHtml = ''; draw(); }
    if (mode === 'jeu') flushTaps();
  }
  var lastPhase = '';
  function needsTimeRedraw(t) {
    var ph = '';
    if (st.step === 3 && st.ombre) { var end = st.ombre.cur ? st.ombre.cur.end : st.ombre.end; ph += 'o' + (end && t > end ? 1 : 0) + (st.ombre.startAt && t > st.ombre.startAt + 600000 ? 'f' : ''); }
    if (st.step === 4 && st.destin) ph += 'd' + (st.destin.at && t - st.destin.at < 1600 ? 1 : 0);
    if (st.step === 5 && st.boss) {
      var b = st.boss, p2 = b.p2;
      ph += 'b' + (b.p1 && b.p1.at && t - b.p1.at < 1600 ? 1 : 0) + (p2 ? (t < p2.start ? 'w' : t < p2.end ? 'r' : 'e') : '') + (b.dead && b.deadAt && t - b.deadAt < 2600 ? 'x' : '');
    }
    if (st.timer) ph += 't' + (t > st.timer.end ? 1 : 0);
    if (mode === 'ecran' && st.hokage && st.hokage.slide && st.photos && st.photos.length) {
      if (t - slideAt > 5000) { slideAt = t; slideIdx = (slideIdx + 1) % st.photos.length; }
      ph += 's' + slideIdx;
    }
    if (ph !== lastPhase) { lastPhase = ph; return true; }
    return false;
  }

  /* ---------- JOUEUR ---------- */
  function myClan() { return st && st.clan ? CK[st.clan] : null; }
  function wrap(inner, cls) { return { html: '<div class="w"' + (demo() ? ' style="padding-top:calc(52px + env(safe-area-inset-top))"' : '') + '>' + inner + '</div>', cls: cls || 'peach' }; }
  function vPlayer() {
    if (!myName()) return wrap('<h1>La Quête des 30 ans</h1><section class="card"><label class="lab" for="g-name">Ton prénom</label><input id="g-name" maxlength="40" autocomplete="given-name"><button class="btn" data-g="pname">Entrer</button></section>');
    if (!st) return wrap('<h1>…</h1>');
    if (!st.on) return wrap('<h1>La Quête des 30 ans</h1><section class="card"><div class="ser" style="font-size:20px">Le jeu n’a pas encore commencé</div><div class="muted">Garde cette page ouverte, elle se mettra à jour toute seule.</div></section><button class="btn2" data-g="home">Retour à l’accueil</button>');
    var c = myClan();
    if (!c) return wrap('<h1>Salut ' + esc(myName()) + ' !</h1><section class="card" style="align-items:center;text-align:center;padding:26px 16px"><div class="ser" style="font-size:22px">Le maître du jeu forme les clans</div><div class="muted">Ton clan apparaîtra ici dans un instant.</div></section>');
    var s = st.step;
    if (s === 3) return pOmbre(c);
    if (s === 5) { var p2 = st.boss && st.boss.p2; if (p2 && !p2.done && now() < p2.end + 800) return pRasengan(c, p2); return pBoss(c); }
    var head = '<div class="hd"><h1>' + esc(STEPN[s]) + '</h1><span class="pill" style="background:' + c.bg + ';color:' + c.ink + '">' + ico(c, 16) + esc(c.n) + ' · ' + st.scores[c.k] + ' pts</span></div>';
    if (jk(c.k) === 'on' && s >= 1 && s <= 4) head += '<div class="card" style="flex-direction:row;align-items:center;gap:10px;background:#3A3350;color:#fff;border-color:#3A3350;padding:10px 14px"><span class="ser" style="background:#F7E6A8;color:#3A3350;border-radius:10px;padding:4px 10px">x2</span><span style="font-weight:800">Joker activé : vos points comptent double</span></div>';
    else if (jk(c.k) === 'free' && s >= 1 && s <= 4) head += '<div class="muted" style="font-size:13px">Joker x2 encore disponible : annoncez-le avant l’épreuve.</div>';
    if (st.timer && now() < st.timer.end + 1000) head += '<div class="row" style="gap:10px">' + cdBar(st.timer.end, st.timer.dur * 1000) + cd(st.timer.end, 'ser', 'font-size:20px;min-width:52px;text-align:right') + '</div>';
    var body = s === 0 ? pClan(c) : s === 1 ? pRythme(c) : s === 2 ? pSavoir() : s === 4 ? pDestin(c) : pHokage();
    return wrap(head + body);
  }
  function pClan(c) {
    return '<section style="background:' + c.bg + ';border-radius:24px;padding:22px 18px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;border:2px solid #fff;box-shadow:0 8px 20px rgba(58,51,80,.12)">' +
      '<div style="animation:breathe 1.6s ease-in-out infinite">' + ico(c, 60) + '</div><div class="lab" style="color:' + c.ink + '">Tu es dans le</div><div class="ser" style="font-size:32px">Clan du ' + esc(c.n) + '</div>' +
      '<div style="font-weight:700;color:' + c.ink + '">' + st.members[c.k].map(esc).join(' · ') + '</div></section>' +
      jokerCard(c) + pCri(c);
  }
  function jokerCard(c) {
    var s = jk(c.k), j = st.joker[c.k];
    return '<section class="card" style="flex-direction:row;align-items:center;gap:14px;' + (s === 'on' ? 'background:#3A3350;color:#fff;border-color:#3A3350' : s === 'used' ? 'opacity:.55' : '') + '">' +
      '<div class="ser" style="width:56px;height:56px;border-radius:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;' + (s === 'on' ? 'background:#F7E6A8;color:#3A3350;animation:breathe 1.2s ease-in-out infinite' : 'background:' + c.bg + ';color:' + c.ink) + '">x2</div>' +
      '<div style="display:flex;flex-direction:column;gap:3px"><div class="ser" style="font-size:18px">' + (s === 'on' ? 'Joker x2 activé !' : s === 'used' ? 'Joker utilisé · ' + esc(STEPN[j.step]) : 'Votre joker x2') + '</div>' +
      '<div style="font-size:13px;font-weight:700;' + (s === 'on' ? 'color:#D9CEF0' : 'color:#6A6280') + '">' + (s === 'on' ? 'Vos points comptent double sur cette épreuve' : s === 'used' ? 'Il a déjà servi' : JOKER_TXT) + '</div></div></section>';
  }
  function pCri(c) {
    var cur = st.ouv ? st.ouv.cri : '';
    return '<section class="card"><label class="lab" for="g-cri">Cri de guerre du clan</label>' + (cur ? '<div style="font-family:Caveat,cursive;font-weight:700;font-size:30px;line-height:1.1;color:' + c.ink + '">« ' + esc(cur) + ' »</div>' : '<div class="muted">Inventez votre cri, un seul par clan : il s’affichera en grand sur l’écran.</div>') +
      '<div class="row"><input id="g-cri" maxlength="60" placeholder="' + (cur ? 'Modifier le cri' : 'Votre cri') + '" aria-label="Cri de guerre"><button class="chip on" style="height:44px" data-g="cri">Valider</button></div></section>';
  }
  function curSeq() { return pl.seq && Date.now() - pl.seqAt < 5000 ? pl.seq : (st.seq || []); }
  function pRythme(c) {
    var ry = st.rythme || {}, seq = curSeq(), full = seq.length >= 4, lock = ry.locked;
    var res = ry.results || {}, h = '';
    if (ry.cur) {
      var dc = CK[ry.cur];
      if (ry.cur === c.k) h += '<section class="card" style="align-items:center;text-align:center;gap:8px;background:' + c.bg + ';border:2px solid #fff;padding:24px 16px"><div style="font-family:Caveat,cursive;font-size:54px;font-weight:700;line-height:1">C’est à vous !</div><div class="ser" style="font-size:19px">' + (ry.stage === 'vote' ? 'Le public vous note…' : 'Montrez votre chorégraphie') + '</div></section>';
      else if (ry.stage === 'vote') {
        var mine = pl.rate && Date.now() - pl.rateAt < 4000 ? pl.rate : ry.myRate;
        h += '<section class="card" style="align-items:center;text-align:center;gap:12px;padding:22px 14px"><div class="lab">Note la danse du clan</div><div class="ser" style="font-size:26px;color:' + dc.ink + '">' + esc(dc.n) + '</div><div class="row" style="gap:4px;justify-content:center">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<button data-g="rate" data-n="' + n + '" aria-label="' + n + ' sur 5" style="border:0;background:none;padding:2px">' + star(mine >= n, 52) + '</button>'; }).join('') + '</div><div class="muted">' + (mine ? 'Ta note : ' + mine + ' / 5 · tu peux encore changer' : 'Touche une étoile') + '</div></section>';
      } else h += '<section class="card" style="align-items:center;text-align:center;gap:6px;padding:22px 14px"><div class="lab">En piste</div><div class="ser" style="font-size:26px;color:' + dc.ink + '">Le clan du ' + esc(dc.n) + ' danse !</div><div class="muted">Prépare-toi à le noter.</div></section>';
    }
    var done = CL.filter(function (k) { return res[k.k]; });
    if (done.length) h += '<section class="card"><div class="lab">Notes du public</div>' + done.map(function (k) { var r = res[k.k]; return '<div class="row" style="justify-content:space-between"><span class="ser" style="color:' + k.ink + '">' + esc(k.n) + '</span><span class="row" style="gap:2px">' + stars(r.avg, 18) + '</span><b>' + String(r.avg).replace('.', ',') + ' · +' + r.pts + '</b></div>'; }).join('') + '</section>';
    if (ry.cur) return h;
    var slots = [0, 1, 2, 3].map(function (i) {
      var m = MK[seq[i]];
      return '<button data-g="unseq" data-i="' + i + '"' + (lock ? ' disabled' : '') + ' style="height:64px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;' + (m ? 'background:#fff;border:2px solid #6B5B9A' : 'background:rgba(255,255,255,.5);border:2px dashed #D9CEF0') + '"><span style="font-size:11px;font-weight:800;color:#6A6280">' + (i + 1) + '</span><span class="ser" style="font-size:13px;line-height:1.1">' + (m ? esc(m.t) : '—') + '</span></button>';
    }).join('');
    var grid = MOVES.map(function (m) {
      var used = seq.indexOf(m.k) >= 0;
      if (lock && !used) return '';
      return '<button data-g="seq" data-k="' + m.k + '"' + (lock ? ' disabled' : '') + ' style="display:flex;align-items:center;gap:8px;padding:8px 10px;min-height:76px;border-radius:14px;text-align:left;' + (used ? 'background:#E9E3F6;border:2px solid #6B5B9A' : 'background:#fff;border:1.5px solid #E2D9EE') + (full && !used ? ';opacity:.5' : '') + '">' + fig(m.k, 60, c.k) +
        '<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="ser" style="font-size:15px;line-height:1.1">' + esc(m.t) + '</span><span style="font-size:11.5px;font-weight:700;color:#6A6280;line-height:1.2">' + esc(m.d) + '</span></span></button>';
    }).join('');
    return h + (lock ? '<div class="card" style="flex-direction:row;align-items:center;gap:10px;background:#3A3350;color:#fff;border-color:#3A3350;font-weight:800">Chorégraphie verrouillée, place au spectacle !</div>' : '<div class="muted">Choisissez 4 mouvements dans l’ordre, 2 temps chacun. Le clan partage la même chorégraphie.' + (ry.lockAt ? ' Elle se verrouille à la fin du chrono.' : '') + '</div>') +
      '<div class="grid3" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + slots + '</div><div class="grid2">' + grid + '</div>' +
      (full && !lock ? '<div class="card" style="align-items:center;background:#E3F3EC;border-color:#BFE3D4;color:#2F6F5E;font-weight:800">Chorégraphie prête, répétez !</div>' : '');
  }
  function pSavoir() {
    var sv = st.savoir || {};
    if (!sv.total) return '<section class="card"><div class="ser" style="font-size:20px">Le Sensei Alessia va vous interroger</div><div class="muted">Les questions arrivent.</div></section>';
    return '<section class="card" style="gap:14px;padding:20px 18px"><div class="lab">Question ' + (sv.idx + 1) + ' / ' + sv.total + '</div><div class="ser" style="font-size:24px;line-height:1.25">' + esc(sv.q) + '</div></section><div class="muted">Mettez-vous d’accord et répondez au Sensei.</div>';
  }
  function pOmbre(c) {
    var o = st.ombre || {}, ch = o.choose;
    if (ch && ch.options.length) {
      var show = ch.me || pl.reveal === o.end + ':' + ch.mname;
      var h2 = '<div class="full" style="background:#6B5B9A;gap:18px">';
      if (!show) h2 += '<div class="ser" style="font-size:24px;max-width:300px">C’est ' + esc(ch.mname) + ' qui mime</div><div style="font-weight:800;opacity:.85">Passe ton téléphone à ' + esc(ch.mname) + '</div><button data-g="oreveal" data-k="' + esc(o.end + ':' + ch.mname) + '" style="margin-top:10px;height:56px;padding:0 22px;border-radius:16px;border:0;background:#fff;color:#3A3350;font-family:Fraunces,serif;font-weight:700;font-size:18px">Je suis ' + esc(ch.mname) + ' : voir les mimes</button>';
      else h2 += '<div class="ser" style="font-size:24px">Choisis ton mime</div>' + ch.options.map(function (x) { return '<button data-g="opickp" data-i="' + x.i + '" style="width:min(320px,86vw);min-height:58px;border-radius:16px;border:0;background:#fff;color:#3A3350;font-family:Fraunces,serif;font-weight:700;font-size:20px;padding:8px 14px">' + esc(x.t) + '</button>'; }).join('') + '<div style="font-weight:700;opacity:.8">45 secondes dès que tu choisis</div>';
      return { cls: 'dark', html: h2 + '</div>' };
    }
    var open = o.state === 'green', run = o.state !== 'wait' && o.end;
    return { cls: 'dark', html: '<div class="full" style="background:' + (open ? '#2F7D64' : '#B8445F') + ';gap:22px">' +
      (run ? '<div class="ser" style="font-size:64px;line-height:1">' + cdu(o.end, '', 'padding:4px 14px;border-radius:16px') + '</div>' : '') +
      '<div style="font-family:Fraunces,serif;font-weight:700;font-size:40px;line-height:1.1;letter-spacing:.02em">Buzzer<br>' + (open ? 'OUVERT' : 'FERMÉ') + '</div>' +
      (o.mine ? '<button data-g="ohold" style="position:absolute;bottom:calc(26px + env(safe-area-inset-bottom));height:44px;padding:0 18px;border-radius:999px;border:1.5px solid rgba(255,255,255,.6);background:transparent;color:#fff;font-weight:800;font-size:14px;user-select:none;-webkit-user-select:none">Maintenir pour revoir le mime</button><div id="g-hold" style="display:none;position:absolute;inset:0;background:#3A3350;align-items:center;justify-content:center;font-family:Fraunces,serif;font-weight:700;font-size:34px;padding:24px;text-align:center">' + esc(o.mine) + '</div>' : '') + '</div>' };
  }
  function pDestin(c) {
    var d = st.destin;
    if (!d) return '';
    var rolling = d.at && now() - d.at < 1600;
    var mine = pl.vote && Date.now() - pl.voteAt < 4000 ? pl.vote : d.myVote;
    var h = '<section class="card" style="padding:0;overflow:hidden;gap:0"><div style="background:' + c.bg + ';padding:14px 16px" class="row"><span class="lab" style="color:' + c.ink + '">Carrefour ' + (d.c + 1) + ' / 3</span></div>' +
      '<div style="padding:12px 16px 16px"><div class="ser" style="font-size:22px;margin-bottom:6px">' + esc(d.title) + '</div><div style="font-weight:700;line-height:1.45">' + esc(d.text) + '</div></div></section>';
    if (d.stage === 'vote') {
      h += d.opts.map(function (o) {
        var on = mine === o.k;
        return '<button data-g="vote" data-k="' + o.k + '" style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:18px;text-align:left;' + (on ? 'background:#E9E3F6;border:2.5px solid #6B5B9A' : 'background:#fff;border:1.5px solid #E2D9EE') + '"><span class="ser" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;' + (on ? 'background:#6B5B9A;color:#fff' : 'background:#F3EEF9') + '">' + o.k + '</span><span style="display:flex;flex-direction:column;gap:3px"><span class="ser" style="font-size:17px;line-height:1.2">' + esc(o.t) + '</span><span style="font-size:13px;font-weight:800;color:#6A6280">' + esc(o.r) + '</span></span></button>';
      }).join('');
      h += '<div class="card" style="align-items:center;font-weight:800;' + (mine ? 'background:#E3F3EC;color:#2F6F5E;border-color:#BFE3D4' : 'background:rgba(255,255,255,.6);color:#6A6280;border-style:dashed') + '">' + (mine ? 'Vote ' + mine + ' enregistré · le négociateur peut encore changer' : 'Vote secret : le négociateur choisit pour le clan') + '</div>';
    } else {
      h += CL.map(function (k) {
        var r = d.results[k.k];
        return '<section class="card" style="flex-direction:row;align-items:center;gap:12px;background:' + k.bg + ';border-color:' + (k.k === c.k ? '#3A3350' : 'transparent') + '">' +
          '<span class="ser ' + (rolling ? 'rolling' : '') + '" style="width:50px;height:50px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">' + (rolling ? '?' : r.die) + '</span>' +
          '<div style="flex:1"><div class="ser" style="font-size:17px">' + esc(k.n) + ' · choix ' + r.opt + '</div><div style="font-weight:800;font-size:14px">' + (rolling ? 'Les dés roulent…' : esc(r.text) + ' ' + (r.pts > 0 ? '+' : '') + r.pts + (r.joker ? ' (joker x2)' : '') + (r.gage ? ' · Gage : ' + esc(r.gage) : '')) + '</div></div></section>';
      }).join('');
    }
    return h;
  }
  function pBoss(c) {
    var b = st.boss || {};
    var dying = b.dead && b.deadAt && now() - b.deadAt < 2600;
    var txt = b.dead ? 'Alessia a terrassé Sanjûbi !' : b.p2 && b.p2.done ? 'Le coup final revient à Alessia…' : b.p1 ? 'Préparez-vous pour le Rasengan collectif' : 'Les clans attaquent Sanjûbi';
    return { cls: 'dark', html: '<div class="w" style="align-items:center;text-align:center"><div class="hd" style="width:100%"><h1>Sanjûbi</h1><span class="pill" style="background:' + c.bg + ';color:' + c.ink + '">' + esc(c.n) + ' · ' + st.scores[c.k] + ' pts</span></div>' +
      (b.dead && !dying ? '<div style="font-family:Caveat,cursive;font-size:64px;font-weight:700;color:#F7E6A8;animation:pop .6s ease-out both">Vaincu !</div>' : bossSvg('boss' + (dying ? ' boom' : ''), 280)) +
      '<div style="width:100%;display:flex;flex-direction:column;gap:8px"><div class="row" style="justify-content:space-between;font-weight:800;color:#D9CEF0"><span>POINTS DE VIE</span><span>' + fmt(b.hp) + ' / 2 026</span></div>' + hpBar(b.hp) + '</div>' +
      '<div class="ser" style="font-size:22px;line-height:1.3">' + txt + '</div></div>' };
  }
  function pRasengan(c, p2) {
    var t = now(), wait = t < p2.start, run = t >= p2.start && t < p2.end;
    var key = p2.start; if (pl.p2 !== key) { pl.p2 = key; pl.taps = 0; pl.tapSent = 0; }
    return { cls: 'dark', html: '<div class="w" style="align-items:center;text-align:center"><div class="hd" style="width:100%"><h1>Rasengan</h1><span class="pill" style="background:' + c.bg + ';color:' + c.ink + '">' + esc(c.n) + '</span></div>' +
      '<div class="ser" style="font-size:22px">' + (wait ? 'Prêts ? Ça commence dans…' : run ? 'Tape le plus vite possible !' : 'Terminé !') + '</div>' +
      '<div class="row" style="gap:12px"><div style="background:rgba(255,255,255,.1);border-radius:16px;padding:10px 18px"><div class="lab" style="color:#D9CEF0">Temps</div><div class="ser" style="font-size:30px">' + cd(wait ? p2.start : p2.end) + '</div></div>' +
      '<div style="background:rgba(255,255,255,.1);border-radius:16px;padding:10px 18px"><div class="lab" style="color:#D9CEF0">Tes tapes</div><div class="ser" style="font-size:30px" id="g-taps">' + pl.taps + '</div></div></div>' +
      '<button data-g="tap" aria-label="Taper" ' + (run ? '' : 'disabled') + ' style="margin-top:14px;width:270px;height:270px;border-radius:50%;border:0;padding:0;touch-action:manipulation;background:radial-gradient(circle at 40% 38%,#fff 0%,#CFE9FF 22%,#7FB6F0 52%,#5B4B8A 100%);box-shadow:0 0 60px rgba(127,182,240,.55);display:flex;align-items:center;justify-content:center;' + (run ? '' : 'opacity:.5') + '">' +
      '<svg width="210" height="210" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round" aria-hidden="true" style="animation:spin ' + (run ? '.6s' : '3s') + ' linear infinite"><path d="M50 14a36 36 0 0 1 36 36"/><path d="M86 50a36 36 0 0 1-36 36"/><path d="M50 86a36 36 0 0 1-36-36"/><path d="M14 50a36 36 0 0 1 36-36"/><path d="M50 28a22 22 0 0 1 22 22"/><path d="M50 72a22 22 0 0 1-22-22"/></svg></button>' +
      '<div class="muted" style="color:#D9CEF0">Pas de téléphone ? Tape sur celui de ton voisin, à deux</div></div>' };
  }
  function pHokage() {
    return '<section class="card" style="align-items:center;text-align:center;padding:26px 16px;gap:8px"><div style="font-family:Caveat,cursive;font-size:52px;font-weight:700;line-height:1">Alessia est Hokage !</div><div class="ser" style="font-size:18px">Regardez l’écran, place aux souvenirs</div></section>';
  }
  function flushTaps() {
    if (pl.taps > pl.tapSent && myName()) {
      var n = pl.taps; pl.tapSent = n;
      req('/api/game/tap', { method: 'POST', body: { name: myName(), n: n } }).catch(function () {});
    }
  }

  /* ---------- MAÎTRE DU JEU ---------- */
  function vMJ() {
    if (!st) return wrap('<h1>…</h1>');
    var s = st.step;
    var h = '<div class="hd"><h1>' + (st.demo ? 'Démo' : 'Maître du jeu') + '</h1><div class="row" style="gap:14px"><a href="#ecran" style="font-weight:800;color:#5B4B8A;text-decoration:none">Écran</a><a href="#admin" style="font-weight:800;color:#5B4B8A;text-decoration:none">Admin</a></div></div>';
    h += '<div class="scroll">' + STEPN.map(function (n, i) { return '<button class="chip' + (i === s ? ' on' : '') + '" data-g="step" data-i="' + i + '">' + (i + 1) + '. ' + esc(n) + '</button>'; }).join('') + '</div>';
    if (!st.on && !st.demo) h += '<div class="card" style="background:#FFF6D9;border-color:#F7E3A0;flex-direction:row;align-items:center;gap:10px"><span style="flex:1;font-weight:800">Le jeu est invisible pour les joueurs</span><button class="chip on" data-g="on" data-v="1">Ouvrir</button></div>';
    // scores
    h += '<section class="card"><div class="lab">Scores</div><div class="grid3">' + CL.map(function (c) {
      return '<div style="background:' + c.bg + ';border-radius:14px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px">' + ico(c, 18) + '<b class="ser" style="font-size:26px">' + st.scores[c.k] + '</b>' +
        '<div class="row" style="gap:4px"><button class="chip" style="height:32px;padding:0 10px" data-g="pts" data-c="' + c.k + '" data-d="-1" aria-label="Moins 1 ' + c.n + '">−1</button><button class="chip" style="height:32px;padding:0 10px" data-g="pts" data-c="' + c.k + '" data-d="1" aria-label="Plus 1 ' + c.n + '">+1</button></div>' +
        jokerBtn(c) + '</div>';
    }).join('') + '</div><div class="muted" style="font-size:12px">Joker x2 : touche pour l’activer sur l’épreuve en cours (Rythme à Destin), retouche pour annuler. Les gains comptent double automatiquement.</div></section>';
    // chrono
    h += '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Chrono</span>' + (st.timer && now() < st.timer.end ? cd(st.timer.end, 'ser', 'font-size:22px') : '<span class="muted">—</span>') + '</div><div class="row" style="flex-wrap:wrap">' +
      [[30, '0:30'], [45, '0:45'], [90, '1:30'], [600, '10 min']].map(function (x) { return '<button class="chip" data-g="timer" data-s="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '<button class="chip" data-g="timerStop">Stop</button></div></section>';
    h += [mOuverture, mRythme, mSavoir, mOmbre, mDestin, mBoss, mHokage][s]();
    return wrap(h);
  }
  function jokerBtn(c) {
    var s = jk(c.k), j = st.joker[c.k], ok = st.step >= 1 && st.step <= 4;
    if (s === 'used') return '<span style="font-size:11px;font-weight:800;color:' + c.ink + ';text-align:center">Joker : ' + esc(STEPN[j.step]) + '</span>';
    return '<button class="chip' + (s === 'on' ? ' on' : '') + '" data-g="joker" data-c="' + c.k + '"' + (ok ? '' : ' disabled') + ' style="height:30px;padding:0 10px;' + (s === 'on' ? '' : 'border-color:' + c.ink + ';color:' + c.ink) + (ok ? '' : ';opacity:.45') + '">' + (s === 'on' ? 'x2 actif' : 'Joker x2') + '</button>';
  }
  function mOuverture() {
    var r = st.roster || {}, ids = Object.keys(r).sort(function (a, b) { return r[a].name.localeCompare(r[b].name, 'fr'); });
    var cnt = { feu: 0, foudre: 0, vent: 0 }; ids.forEach(function (id) { if (r[id].clan) cnt[r[id].clan]++; });
    var ov = st.ouv || { view: 'intro' };
    var hp = '<section class="card"><div class="lab">Sur l’écran de projection</div><div class="row" style="flex-wrap:wrap">' +
      [['intro', '1. Intro'], ['clans', '2. Clans'], ['cris', '3. Cris de guerre']].map(function (x) { return '<button class="chip' + (ov.view === x[0] ? ' on' : '') + '" data-g="ouv" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      (ov.order && ov.order.length ? '<button class="chip" data-g="ouv" data-v="clans" data-r="1">Rejouer la révélation</button>' : '') + '</div>';
    if (ov.view === 'intro') hp += '<div style="background:#FBF7F2;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px"><div class="lab">À lire à voix haute</div>' + INTRO.map(function (s) { return '<div style="font-weight:700;line-height:1.4">' + esc(s) + '</div>'; }).join('') + '</div>';
    if (ov.view === 'cris') hp += CL.map(function (c) { var cr = (st.cris || {})[c.k]; return '<div class="row" style="background:' + c.bg + ';border-radius:12px;padding:8px 10px"><span style="flex:1;font-weight:800;color:' + c.ink + '">' + esc(c.n) + ' · ' + (cr ? '« ' + esc(cr) + ' »' : 'pas encore de cri') + '</span><button class="chip' + (ov.spot === c.k ? ' on' : '') + '" data-g="spot" data-c="' + c.k + '">Afficher</button></div>'; }).join('');
    hp += '<div class="muted" style="font-size:12px">« Tirer les clans » lance automatiquement la révélation animée sur l’écran.</div></section>';
    var h = hp + '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Joueurs · ' + ids.length + '</span><span class="muted" style="font-size:13px">Feu ' + cnt.feu + ' · Foudre ' + cnt.foudre + ' · Vent ' + cnt.vent + '</span></div>';
    h += ids.length ? ids.map(function (id) {
      var p = r[id], c = p.clan ? CK[p.clan] : null;
      return '<div class="row" style="gap:8px;border-top:1.5px dashed #EEE7F5;padding-top:8px"><span style="flex:1;font-weight:800">' + esc(p.name) + (p.phone ? ' <span class="muted" style="font-size:12px">· tél.</span>' : '') + '</span>' +
        '<button class="chip" data-g="move" data-id="' + esc(id) + '" style="' + (c ? 'background:' + c.bg + ';border-color:' + c.bg + ';color:' + c.ink : '') + '">' + (c ? esc(c.n) : 'Sans clan') + '</button>' +
        '<button class="chip" data-g="delp" data-id="' + esc(id) + '" aria-label="Retirer ' + esc(p.name) + '">×</button></div>';
    }).join('') : '<div class="muted">Les joueurs apparaissent quand ils ouvrent le jeu. Ajoute ceux sans téléphone ci-dessous.</div>';
    h += '<div class="row"><input id="g-add" maxlength="40" placeholder="Prénom" aria-label="Prénom à ajouter"><button class="chip on" style="height:44px" data-g="addp">Ajouter</button></div>' +
      (st.demo ? '<button class="btn2" data-g="demofake">Ajouter 8 joueurs fictifs + toi</button>' : '') + '<div class="grid2"><button class="btn2" data-g="draw">Tirer les clans</button><button class="btn2" data-g="drawRest">Placer les nouveaux</button></div><div class="muted" style="font-size:12px">Touche le clan d’un joueur pour le changer (par exemple pour placer Alessia).</div></section>';
    h += '<section class="card"><div class="lab">Partie</div><div class="grid2">' + (st.demo ? '' : '<button class="btn2" data-g="on" data-v="' + (st.on ? 0 : 1) + '">' + (st.on ? 'Masquer le jeu' : 'Ouvrir le jeu') + '</button>') + '<button class="btn2" data-g="reset" style="color:#A63A55">' + (mj.resetArm ? 'Confirmer ?' : 'Réinitialiser') + '</button></div><div class="muted" style="font-size:12px">Réinitialiser efface clans, scores et votes (les questions et les photos restent).</div></section>';
    return h + nextBtn();
  }
  function nextBtn() { return st.step < 6 ? '<button class="btn" data-g="step" data-i="' + (st.step + 1) + '">Épreuve suivante : ' + esc(STEPN[st.step + 1]) + '</button>' : ''; }
  function mRythme() {
    var ry = st.rythme || {}, res = ry.results || {}, songs = ry.songs || {};
    var h = '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Chorégraphies</span>' + (st.rLocked ? '<button class="chip" data-g="runlock">Déverrouiller</button>' : '<span class="muted" style="font-size:12px">' + (ry.lockAt ? 'Verrouillage à la fin du chrono' : 'Lance 1:30 : verrouillage à la fin') + '</span>') + '</div>';
    h += CL.map(function (c) {
      var s = (st.seqs || {})[c.k] || [], r = res[c.k], cur = ry.cur === c.k, other = ry.cur && !cur;
      var btn = cur ? (ry.stage === 'dance' ? '<button class="chip on" data-g="rvote">Ouvrir le vote</button>' : '<button class="chip on" data-g="rreveal">Révéler · ' + (st.rateCount || 0) + ' vote' + ((st.rateCount || 0) > 1 ? 's' : '') + '</button>') : '<button class="chip" data-g="rstage" data-c="' + c.k + '"' + (other ? ' disabled style="opacity:.45"' : '') + '>' + (r ? 'Redanser' : 'En piste') + '</button>';
      return '<div style="background:' + c.bg + ';border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;' + (cur ? 'box-shadow:0 0 0 3px #3A3350' : '') + '"><div class="row" style="justify-content:space-between"><span class="ser" style="font-size:16px;color:' + c.ink + '">' + esc(c.n) + (r ? ' · ' + String(r.avg).replace('.', ',') + '/5 · +' + r.pts : '') + '</span>' + btn + '</div>' +
        '<div style="font-weight:700;font-size:14px">' + (s.length ? s.map(function (k, i) { return (i + 1) + '. ' + esc(MK[k].t); }).join(' · ') : 'Pas encore choisie') + '</div>' +
        (songs[c.k] ? '<div class="row" style="gap:6px">' + (ry.music && ry.music.clan === c.k ? '<button class="chip" data-g="music" data-c="' + c.k + '" data-on="0">Couper la musique</button>' : '<button class="chip" data-g="music" data-c="' + c.k + '" data-on="1">Musique</button>') + '</div>' : '') + '</div>';
    }).join('') + '<div class="muted" style="font-size:12px">En piste : la musique du clan démarre sur l’écran. Après la danse, ouvre le vote : les 2 autres clans notent sur 5 depuis leurs téléphones, la moyenne arrondie devient leurs points.</div></section>';
    h += '<section class="card"><div class="lab">Musiques · lien YouTube avec le minutage (?t=)</div>' + CL.map(function (c) { return '<label class="muted" for="g-song-' + c.k + '" style="font-size:13px;color:' + c.ink + '">' + esc(c.n) + '</label><input id="g-song-' + c.k + '" inputmode="url" placeholder="https://youtu.be/…?t=60" value="' + esc(songs[c.k] || '') + '">'; }).join('') + '<button class="btn2" data-g="songs">Enregistrer les musiques</button></section>';
    return h + nextBtn();
  }
  function mSavoir() {
    var sv = st.savoir || { list: [], idx: 0 }, q = sv.list[sv.idx];
    var h = '<section class="card">' + (q ? '<div class="lab">Question ' + (sv.idx + 1) + ' / ' + sv.list.length + '</div><div class="ser" style="font-size:20px;line-height:1.25">' + esc(q.q) + '</div>' + (q.a ? '<div style="background:#E3F3EC;border-radius:12px;padding:10px 12px;font-weight:800;color:#2F6F5E">Réponse : ' + esc(q.a) + '</div>' : '') +
      '<div class="grid2"><button class="btn2" data-g="sidx" data-i="' + (sv.idx - 1) + '"' + (sv.idx <= 0 ? ' disabled' : '') + '>Précédente</button><button class="btn2" data-g="sidx" data-i="' + (sv.idx + 1) + '"' + (sv.idx >= sv.list.length - 1 ? ' disabled' : '') + '>Suivante</button></div>' : '<div class="muted">Aucune question pour l’instant.</div>') + '</section>';
    h += '<section class="card"><label class="lab" for="g-qs">Questions · une par ligne : question | réponse</label><textarea id="g-qs">' + esc(sv.list.map(function (x) { return x.q + (x.a ? ' | ' + x.a : ''); }).join('\n')) + '</textarea><button class="btn2" data-g="qsave">Enregistrer les questions</button></section>';
    return h + nextBtn();
  }
  function mOmbre() {
    var o = st.ombre || {}, c = o.cur, nextClan = CK[['feu', 'foudre', 'vent'][(o.turn || 0) % 3]], cnt = o.count || {};
    var endAll = o.startAt ? o.startAt + 600000 : 0;
    var finished = endAll && now() > endAll && cnt.feu === cnt.foudre && cnt.foudre === cnt.vent && (!c || c.done);
    var h = '<section class="card"><div style="background:#FFF6D9;border-radius:12px;padding:10px 12px;font-weight:800;font-size:14px">À dire aux joueurs : les mimes sont des actions mais aussi des personnages.</div>' +
      '<div class="row" style="justify-content:space-between"><span class="lab">Passages</span><span style="font-weight:800;font-size:14px">' + CL.map(function (k) { return esc(k.n) + ' ' + (cnt[k.k] || 0); }).join(' · ') + '</span></div>' +
      '<div class="row" style="justify-content:space-between"><span class="lab">Temps de l’épreuve</span>' + (endAll ? cd(endAll, 'ser', 'font-size:18px') : '<span class="muted">démarre au 1er mime</span>') + '</div>' +
      (finished ? '<div style="background:#E3F3EC;color:#2F6F5E;border-radius:12px;padding:10px 12px;font-weight:800">Fin de l’épreuve : 10 minutes passées et tous les clans sont passés autant de fois.</div>' : '');
    if (!c || c.done) {
      if (c && c.done) h += '<div style="font-weight:800;color:#2F6F5E">' + (c.winner ? 'Trouvé par ' + esc(CK[c.winner].n) + (c.winner === c.clan ? ' : +2' : ' : +1 et ' + esc(CK[c.clan].n) + ' +1') : 'Pas trouvé, pas de point') + ' · « ' + esc(st.mimes[c.mime]) + ' »</div>';
      h += '<button class="btn" data-g="onext">Mime suivant : clan du ' + esc(nextClan.n) + '</button></section>';
    } else if (c.mime === null) {
      h += '<div class="ser" style="font-size:18px">' + esc(c.mname || 'Le mimeur') + ' (' + esc(CK[c.clan].n) + ') choisit son mime sur un téléphone de son clan…</div>' +
        (mj.showOpts ? c.options.map(function (i) { return '<button class="btn2" style="height:56px;font-family:Fraunces,serif;font-size:18px" data-g="opick" data-i="' + i + '">' + esc(st.mimes[i]) + '</button>'; }).join('') : '<button class="btn2" data-g="oshow">Pas de téléphone ? Choisir sur ma console</button>') + '</section>';
    } else {
      var over = now() > c.end;
      h += '<div class="lab">Mimeur · ' + esc(c.mname || '') + ' · clan du ' + esc(CK[c.clan].n) + '</div><div class="ser" style="font-size:28px;text-align:center">' + esc(st.mimes[c.mime]) + '</div><div class="row" style="gap:10px">' + cdBar(c.end, 45000) + cdu(c.end, 'ser', 'font-size:22px;min-width:50px;text-align:right;border-radius:8px;padding:0 4px') + '</div></section>';
      h += '<div class="lab">Qui a levé la main ?</div>' + CL.map(function (k) {
        var red = c.red[k.k], sel = mj.sel === k.k;
        return '<button data-g="osel" data-c="' + k.k + '" ' + (red ? 'disabled' : '') + ' style="height:56px;display:flex;align-items:center;gap:10px;padding:0 18px;border-radius:16px;font-family:Fraunces,serif;font-weight:700;font-size:19px;' + (red ? 'background:#F3D5DC;color:#A63A55;border:2px solid #E7B3C0' : 'background:' + k.bg + ';color:' + k.ink + ';border:' + (sel ? '3px solid #3A3350' : '2px solid transparent')) + '"><span style="flex:1;text-align:left">' + esc(k.n) + '</span><span style="font-family:Nunito,sans-serif;font-size:13px;font-weight:800">' + (red ? 'Bloqué' : sel ? 'Interrogé' : 'Peut répondre') + '</span></button>';
      }).join('');
      h += '<div class="grid2"><button data-g="ojudge" data-ok="0" ' + (mj.sel ? '' : 'disabled') + ' style="height:60px;border-radius:18px;border:2px solid #C0506A;background:#fff;color:#A63A55;font-family:Fraunces,serif;font-weight:700;font-size:21px">Faux</button><button data-g="ojudge" data-ok="1" ' + (mj.sel ? '' : 'disabled') + ' style="height:60px;border-radius:18px;border:0;background:#3E8E74;color:#fff;font-family:Fraunces,serif;font-weight:700;font-size:21px;box-shadow:0 5px 0 #2C6B57">Vrai</button></div>';
      h += '<button class="btn2" data-g="oskip">' + (over ? 'Temps écoulé : mime suivant' : 'Passer ce mime') + '</button>';
    }
    return h + nextBtn();
  }
  function mDestin() {
    var d = st.destin, sc = st.destinScenes[d.c], v = st.destinVotes || {};
    var h = '<section class="card"><div class="lab">Carrefour ' + (d.c + 1) + ' / 3</div><div class="ser" style="font-size:20px">' + esc(sc.title) + '</div><div style="font-weight:700;line-height:1.4">' + esc(sc.text) + '</div>' +
      sc.opts.map(function (t, i) { return '<div style="font-weight:700;font-size:14px"><b>' + 'ABC'[i] + '</b> · ' + esc(t) + '</div>'; }).join('') + '</section>';
    if (d.stage === 'vote') {
      h += '<section class="card"><div class="lab">Votes (tu peux voter pour un clan sans téléphone)</div>' + CL.map(function (c) {
        return '<div class="row"><span class="ser" style="flex:1;color:' + c.ink + '">' + esc(c.n) + '</span>' + ['A', 'B', 'C'].map(function (k) { return '<button class="chip' + (v[c.k] === k ? ' on' : '') + '" data-g="dvote" data-c="' + c.k + '" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div>';
      }).join('') + '<div class="muted" style="font-size:12px">Sans vote, un clan joue A (prudent).</div></section><button class="btn" data-g="dreveal">Révéler et lancer les dés</button>';
    } else {
      h += '<section class="card"><div class="lab">Résultats</div>' + CL.map(function (c) { var r = d.results[c.k]; return '<div style="background:' + c.bg + ';border-radius:12px;padding:8px 12px;font-weight:800">' + esc(c.n) + ' · ' + r.opt + ' · dé ' + r.die + ' · ' + (r.pts > 0 ? '+' : '') + r.pts + (r.gage ? ' · Gage : ' + esc(r.gage) : '') + '</div>'; }).join('') + '</section>';
      h += d.c < 2 ? '<button class="btn" data-g="dnext">Carrefour suivant</button>' : nextBtn();
    }
    return h;
  }
  function mBoss() {
    var b = st.boss, p2 = b.p2, t = now();
    var h = '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Sanjûbi</span><b class="ser">' + fmt(b.hp) + ' / 2 026</b></div>' + hpBar(b.hp) + '</section>';
    h += '<section class="card"><div class="lab">Phase 1 · attaques</div>' + (b.p1 ? '<div style="font-weight:800">' + CL.map(function (c) { return esc(c.n) + ' : ' + b.p1.dice[c.k].join(' + '); }).join(' · ') + ' = ' + b.p1.dmg + ' dégâts</div>' : '<div class="muted">1 attaque par tranche de 5 points (au moins 1 par clan). Tous les dés roulent en même temps.</div><button class="btn" data-g="bp1">Lancer toutes les attaques</button>') + '</section>';
    if (b.p1) {
      h += '<section class="card"><div class="lab">Phase 2 · Rasengan</div>';
      if (!p2) h += '<div class="muted">Décompte de 3 s puis 10 s de tapes sur tous les téléphones.</div><button class="btn" data-g="bp2s">Lancer le Rasengan</button>';
      else if (!p2.done) h += '<div class="row" style="justify-content:space-between"><span style="font-weight:800">' + (t < p2.start ? 'Départ dans ' : t < p2.end ? 'En cours · ' : 'Terminé · ') + (t < p2.end ? cd(t < p2.start ? p2.start : p2.end) : '') + '</span><b class="ser" style="font-size:22px">' + fmt(st.tapsLive || 0) + ' tapes</b></div><button class="btn" data-g="bp2c"' + (t < p2.end + 1200 ? ' disabled' : '') + '>Encaisser les dégâts</button>';
      else h += '<div style="font-weight:800">' + fmt(p2.dmg) + ' tapes = ' + fmt(p2.dmg) + ' dégâts</div>';
      h += '</section>';
    }
    if (p2 && p2.done) {
      h += b.dead ? '<section class="card" style="align-items:center;background:#3A3350;color:#fff;border:0"><div style="font-family:Caveat,cursive;font-size:48px;color:#F7E6A8">Vaincu !</div></section>' + nextBtn()
        : '<section class="card" style="align-items:center;gap:14px;background:#3A3350;color:#fff;border:0;padding:22px 16px"><div class="ser" style="font-size:20px">Tends le téléphone à Alessia</div><button data-g="bfinal" aria-label="Coup final" style="width:200px;height:200px;border-radius:50%;border:6px solid #F4C6D3;background:#6B5B9A;color:#fff;font-family:Fraunces,serif;font-weight:700;font-size:24px;line-height:1.15;animation:pulse 1.6s ease-in-out infinite">Coup<br>final</button></section>';
    }
    return h;
  }
  function mHokage() {
    var ph = st.photos || [];
    var h = '<section class="card"><div class="lab">Diaporama · ' + ph.length + ' photo' + (ph.length > 1 ? 's' : '') + '</div>' +
      '<button class="btn" data-g="slide" data-on="' + (st.hokage.slide ? 0 : 1) + '"' + (ph.length ? '' : ' disabled') + '>' + (st.hokage.slide ? 'Arrêter le diaporama' : 'Lancer le diaporama') + '</button>' +
      '<label class="btn2" style="display:flex;align-items:center;justify-content:center;cursor:pointer">' + (mj.upl ? 'Envoi… ' + mj.upl + ' restante' + (mj.upl > 1 ? 's' : '') : 'Ajouter des photos') + '<input id="g-file" type="file" accept="image/*" multiple style="display:none"></label>' +
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">' + ph.map(function (id) { return '<div style="position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#EEE7F5"><img data-ph="' + id + '" alt="" style="width:100%;height:100%;object-fit:cover"><button data-g="pdel" data-id="' + id + '" aria-label="Supprimer la photo" style="position:absolute;top:4px;right:4px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(58,51,80,.8);color:#fff;font-weight:800;padding:0">×</button></div>'; }).join('') + '</div>' +
      '<div class="muted" style="font-size:12px">Les photos ne sont visibles qu’avec le code admin.</div></section>';
    setTimeout(loadThumbs, 0);
    return h;
  }
  function photoUrl(id) {
    if (photoUrls[id]) return Promise.resolve(photoUrls[id]);
    return fetch('/api/game/photo?id=' + id, { headers: { 'x-code': code() } }).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      .then(function (b) { photoUrls[id] = URL.createObjectURL(b); return photoUrls[id]; });
  }
  function loadThumbs() {
    if (!root) return;
    root.querySelectorAll('img[data-ph]').forEach(function (img) { photoUrl(img.getAttribute('data-ph')).then(function (u) { img.src = u; }).catch(function () {}); });
  }
  function resize(file) {
    return new Promise(function (ok, ko) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var m = 1600, w = img.naturalWidth, h = img.naturalHeight, r = Math.min(1, m / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * r); cv.height = Math.round(h * r);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
        cv.toBlob(function (b) { b ? ok(b) : ko(); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); ko(); };
      img.src = u;
    });
  }
  function upload(files) {
    files = Array.prototype.slice.call(files || []);
    mj.upl = files.length; lastHtml = ''; draw();
    var chain = Promise.resolve(), fails = 0;
    files.forEach(function (f) {
      chain = chain.then(function () { return resize(f); }).then(function (b) {
        return fetch('/api/game/photo', { method: 'POST', headers: { 'x-code': code(), 'content-type': 'image/jpeg' }, body: b }).then(function (r) { if (!r.ok) throw 0; });
      }).catch(function () { fails++; }).then(function () { mj.upl--; lastHtml = ''; draw(); });
    });
    chain.then(function () { mj.upl = 0; if (fails) A.toast(fails + ' photo' + (fails > 1 ? 's' : '') + ' non envoyée' + (fails > 1 ? 's' : '')); else A.toast('Photos ajoutées'); poll(); });
  }

  /* ---------- PROJECTION : Ouverture ---------- */
  var fired = { drawAt: 0, spotAt: 0 };
  function revealing() { return !!(st && st.step === 0 && st.ouv && st.ouv.view === 'clans' && st.ouv.drawAt && now() - st.ouv.drawAt < revealDur()); }
  function revealDur() { return ((st.ouv.order || []).length * 900) + 2500; }
  var firedJk = {};
  function fxJoker() {
    if (!st || !st.joker) return;
    CL.forEach(function (c) {
      var j = st.joker[c.k];
      if (j && j.at && j.step === st.step && firedJk[c.k] !== j.at && now() - j.at < 4000) {
        firedJk[c.k] = j.at;
        setTimeout(function () { var el = root && root.querySelector('[data-jk="' + c.k + '"]'); fx(el, 'burst', { r: 70 }); fx(el, 'don', { size: 120, dy: 60 }); }, 200);
      }
    });
  }
  var firedR = {}, musicKey = '';
  function fxRythme() {
    var ry = st && st.rythme; if (!ry) return;
    CL.forEach(function (c) {
      var r = ry.results && ry.results[c.k];
      if (r && r.at && firedR[c.k] !== r.at && now() - r.at < 4000) {
        firedR[c.k] = r.at;
        setTimeout(function () { var el = root && root.querySelector('[data-rr="' + c.k + '"]'); fx(el, 'burst', { r: 120 }); fx(el, 'don', { size: 170, dy: 90 }); }, 250);
      }
    });
  }
  function musicSync() {
    var ry = st && st.rythme, m = st && st.step === 1 && ry && ry.music, v = m ? yt(ry.songs[m.clan]) : null;
    var key = v ? m.clan + m.at : '', box = document.getElementById('gmusic');
    if (key === musicKey) return;
    musicKey = key;
    if (box) box.remove();
    if (!v || mode !== 'ecran') return;
    box = document.createElement('div'); box.id = 'gmusic';
    box.style.cssText = 'position:fixed;right:1.4vw;bottom:1.4vw;width:20vw;aspect-ratio:16/9;z-index:40;border-radius:1vw;overflow:hidden;box-shadow:0 1vw 2vw rgba(0,0,0,.25);background:#000';
    box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + v.id + '?autoplay=1&start=' + v.start + '&rel=0&playsinline=1" title="Musique" allow="autoplay; encrypted-media" style="width:100%;height:100%;border:0"></iframe>';
    document.body.appendChild(box);
  }
  var firedO = {};
  function fxOmbre() {
    var o = st && st.step === 3 && st.ombre, c = o && o.cur; if (!c) return;
    var t0 = now();
    if (c.done && c.doneAt && firedO.done !== c.doneAt && t0 - c.doneAt < 4000) {
      firedO.done = c.doneAt;
      setTimeout(function () { var el = root && root.querySelector('[data-oban]'); if (c.winner) { fx(el, 'burst', { r: 150 }); fx(el, 'don', { size: 200, dy: 110 }); } else fx(el, 'zuza'); }, 250);
    }
    if (c.wrongAt && firedO.wrong !== c.wrongAt && t0 - c.wrongAt < 3000) {
      firedO.wrong = c.wrongAt;
      setTimeout(function () { var el = root && root.querySelector('[data-ot="' + c.wrongClan + '"]'); fx(el, 'burst', { r: 60 }); fx(el, 'kachi'); }, 150);
    }
    if (!c.done && c.mime !== null && t0 > c.end && firedO.tout !== c.end && t0 - c.end < 4000) {
      firedO.tout = c.end;
      setTimeout(function () { fx(root && root.querySelector('[data-oban]'), 'zuza'); }, 300);
    }
  }
  function fxHook() {
    fxJoker(); fxRythme(); fxOmbre(); musicSync();
    if (!st || st.step !== 0 || !st.ouv) { root.removeAttribute('data-reveal'); return; }
    var o = st.ouv;
    if (o.view === 'clans' && revealing()) {
      root.setAttribute('data-reveal', String(o.drawAt));
      if (fired.drawAt !== o.drawAt) {
        fired.drawAt = o.drawAt;
        var el0 = now() - o.drawAt;
        (o.order || []).forEach(function (id, i) {
          var at = 1200 + i * 900 - el0; if (at < 0) return;
          var last = i === o.order.length - 1 && id === 'alessia';
          setTimeout(function () {
            var el = root && root.querySelector('[data-rid="' + CSS.escape(id) + '"]');
            fx(el, 'pop', { big: last }); fx(el, last ? 'don' : 'pon', last ? { size: 150, dy: 70 } : {}); if (last) fx(el, 'burst', { r: 110 });
          }, at);
        });
      }
    } else root.removeAttribute('data-reveal');
    if (o.view === 'cris' && o.spot && o.spotAt && fired.spotAt !== o.spotAt && now() - o.spotAt < 3000) {
      fired.spotAt = o.spotAt;
      setTimeout(function () { var el = root && root.querySelector('[data-spot="' + o.spot + '"]'); fx(el, 'burst', { r: 140 }); fx(el, 'don', { size: 190, dy: 120 }); }, 350);
    }
  }
  function projOuverture() {
    var o = st.ouv || { view: 'intro' };
    if (o.view === 'intro') {
      return '<div class="pw" style="justify-content:center;gap:2vw;padding:4vw 8vw"><div class="pk" style="animation:rise .8s ease-out both">La Quête des 30 ans</div>' +
        INTRO.map(function (s, i) { var last = i === INTRO.length - 1; return '<div class="ser" style="font-size:' + (last ? '4.4vw' : '2.5vw') + ';line-height:1.3;font-weight:' + (last ? 700 : 600) + ';' + (last ? 'font-family:Caveat,cursive;' : '') + 'animation:rise 1s ' + (0.6 + i * 2.2) + 's ease-out both">' + esc(s) + '</div>'; }).join('') + '</div>';
    }
    if (o.view === 'cris') {
      return '<div class="pw">' + pHeader('Cris de guerre', 'Ouverture', timerRight()) + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (c) {
        var cri = (st.cris || {})[c.k], spot = o.spot === c.k, dim = o.spot && !spot;
        return '<div data-spot="' + c.k + '" style="background:' + c.bg + ';border-radius:2.4vw;padding:2vw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4vw;text-align:center;transition:transform .4s,opacity .4s;' + (spot ? 'transform:scale(1.08);box-shadow:0 0 0 .4vw #3A3350' : '') + (dim ? ';opacity:.4' : '') + '">' + ico(c, '64') + '<div class="ser" style="font-size:2.6vw;color:' + c.ink + '">Clan du ' + esc(c.n) + '</div>' +
          '<div style="font-family:Caveat,cursive;font-weight:700;font-size:' + (spot ? '4.6vw' : '3.2vw') + ';line-height:1.05">' + (cri ? '« ' + esc(cri) + ' »' : '…') + '</div></div>';
      }).join('') + '</div></div>';
    }
    // clans + révélation
    var rev = revealing(), order = o.order || [], el0 = now() - (o.drawAt || 0), r = st.roster || {};
    var cols = { feu: [], foudre: [], vent: [] };
    var ids = rev ? order : Object.keys(r).filter(function (id) { return r[id].clan; }).sort(function (a, b) { return r[a].name.localeCompare(r[b].name, 'fr'); });
    ids.forEach(function (id) { if (r[id] && r[id].clan) cols[r[id].clan].push(id); });
    return '<div class="pw">' + pHeader('Les clans', 'Ouverture · La Quête des 30 ans', timerRight()) + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (c) {
      return '<div style="background:' + c.bg + ';border-radius:2.4vw;padding:2vw;display:flex;flex-direction:column;align-items:center;gap:1vw;text-align:center">' + ico(c, '72') + '<div class="ser" style="font-size:3vw">Clan du ' + esc(c.n) + '</div>' +
        cols[c.k].map(function (id) {
          var i = order.indexOf(id), d = rev ? (1200 + i * 900 - el0) / 1000 : 0, al = id === 'alessia';
          return '<div data-rid="' + esc(id) + '" style="font-weight:800;font-size:' + (al ? '3vw' : '2.2vw') + ';line-height:1.35;' + (al ? 'font-family:Caveat,cursive;color:#3A3350;' : '') + (rev ? 'animation:pop .55s ' + d.toFixed(2) + 's cubic-bezier(.3,1.6,.5,1) both' : '') + '">' + esc(r[id].name) + '</div>';
        }).join('') + '</div>';
    }).join('') + '</div></div>';
  }

  /* ---------- PROJECTION ---------- */
  function pScores(big) {
    return '<div class="grid3" style="gap:2vw;' + (big ? 'flex:1' : '') + '">' + CL.map(function (c) {
      var js = jk(c.k);
      return '<div style="background:' + c.bg + ';border:.25vw solid #fff;border-radius:2.4vw;display:flex;' + (big ? 'flex-direction:column;justify-content:center' : 'flex-direction:row;justify-content:space-between;padding:1vw 2vw') + ';align-items:center;gap:.6vw;box-shadow:0 1vw 2vw rgba(58,51,80,.12)">' +
        '<div class="row" style="gap:.8vw">' + ico(c, big ? '64' : '36') + '<span class="ser" style="font-size:' + (big ? '2.8vw' : '2vw') + ';color:' + c.ink + '">' + esc(c.n) + '</span></div>' +
        '<span class="ser" style="font-size:' + (big ? '8.5vw' : '3.6vw') + ';line-height:1">' + st.scores[c.k] + '</span>' +
        (js === 'on' ? '<span data-jk="' + c.k + '" class="ser" style="background:#3A3350;color:#F7E6A8;border-radius:1vw;padding:.3vw 1vw;font-size:' + (big ? '2.4vw' : '1.8vw') + '">x2</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function pHeader(title, kicker, right) {
    return '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:2vw"><div><div class="pk">' + kicker + '</div><h1 class="pt">' + title + '</h1></div>' + (right || '') + '</div>';
  }
  function timerRight() { return st.timer && now() < st.timer.end + 1000 ? cd(st.timer.end, 'pclock') : ''; }
  function vProj() {
    if (!st) return { html: '', cls: 'peach proj' };
    var s = st.step, h = '', cls = 'peach proj';
    if (s === 6) return projHokage();
    if (s === 5) return projBoss();
    if (s === 0) return { html: projOuverture(), cls: cls };
    if (s === 1) {
      var ry = st.rythme || {}, res = ry.results || {};
      h = pHeader('Rythme', 'Épreuve 1 / 5', timerRight()) + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (c) {
        var q = (st.seqs || {})[c.k] || [], cur = ry.cur === c.k, r = res[c.k], dim = ry.cur && !cur;
        return '<div data-rr="' + c.k + '" style="background:' + c.bg + ';border-radius:2.4vw;padding:1.6vw;display:flex;flex-direction:column;gap:1vw;transition:transform .4s,opacity .4s;' + (cur ? 'transform:scale(1.04);box-shadow:0 0 0 .4vw #3A3350' : '') + (dim ? ';opacity:.45' : '') + '"><div class="row" style="gap:.8vw">' + ico(c, '40') + '<span class="ser" style="font-size:2.4vw;color:' + c.ink + '">' + esc(c.n) + '</span><span class="ser" style="margin-left:auto;font-size:2.4vw">' + st.scores[c.k] + '</span></div>' +
          (cur ? '<div class="ser" style="text-align:center;background:#3A3350;color:#fff;border-radius:1vw;padding:.5vw;font-size:1.7vw">' + (ry.stage === 'vote' ? 'Vote du public · ' + (st.rateCount || 0) : 'En piste !') + '</div>' : '') +
          (r ? '<div style="display:flex;flex-direction:column;align-items:center;gap:.3vw;background:#fff;border-radius:1.2vw;padding:.8vw"><span class="row" style="gap:.2vw">' + stars(r.avg, 34) + '</span><span class="ser" style="font-size:2vw">' + String(r.avg).replace('.', ',') + ' / 5 · +' + r.pts + (r.joker ? ' (x2)' : '') + '</span></div>' : '') +
          (q.length ? q.map(function (k, i) { return '<div class="row" style="gap:1vw;background:#fff;border-radius:1.2vw;padding:.4vw 1vw;color:#3A3350">' + fig(k, 62, c.k) + '<span class="ser" style="font-size:1.7vw">' + (i + 1) + '. ' + esc(MK[k].t) + '</span></div>'; }).join('') : '<div style="font-weight:800;font-size:1.6vw;color:#6A6280">Chorégraphie en préparation…</div>') + '</div>';
      }).join('') + '</div>';
    } else if (s === 2) {
      var sv = st.savoir, q = sv.list[sv.idx];
      h = pHeader('Savoir', 'Épreuve 2 / 5 · Sensei Alessia', timerRight()) +
        '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.4vw"><div class="pk">' + (q ? 'Question ' + (sv.idx + 1) + ' / ' + sv.list.length : '') + '</div><div class="ser" style="font-size:4.2vw;line-height:1.2">' + (q ? esc(q.q) : 'Les questions arrivent…') + '</div></div>' + pScores(false);
    } else if (s === 3) {
      var o = st.ombre, c = o.cur, cnt = o.count || {}, tnow = now();
      var endAll = o.startAt ? o.startAt + 600000 : 0;
      var running = c && !c.done && c.mime !== null && tnow <= c.end, timeout = c && !c.done && c.mime !== null && tnow > c.end;
      var finished = endAll && tnow > endAll && cnt.feu === cnt.foudre && cnt.foudre === cnt.vent && (!c || c.done);
      var right = '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.6vw">' + (running ? cdu(c.end, 'pclock') : '') + (endAll && !finished ? '<span class="pk">Épreuve ' + cd(endAll) + '</span>' : '') + '</div>';
      var mid;
      if (finished) mid = '<div style="font-family:Caveat,cursive;font-weight:700;font-size:7vw">Fin de l’épreuve !</div>';
      else if (running) mid = '<div class="pk">Mimeur · ' + esc(c.mname || '') + ' · clan du ' + esc(CK[c.clan].n) + '</div><div class="row" style="gap:2vw">' + CL.map(function (k) { var red = c.red[k.k]; return '<div data-ot="' + k.k + '" style="width:18vw;height:9vw;border-radius:2vw;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-weight:700;font-size:2.6vw;color:#fff;transition:background .3s;background:' + (red ? '#B8445F' : '#2F7D64') + '">' + esc(k.n) + '</div>'; }).join('') + '</div>';
      else if (c && (c.done || timeout)) mid = '<div data-oban="1" style="display:flex;flex-direction:column;align-items:center;gap:1vw;animation:pop .6s ease-out both"><div class="pk" style="font-size:1.8vw">' + (c.winner ? 'Trouvé par le clan du ' + esc(CK[c.winner].n) + ' !' : timeout ? 'Temps écoulé !' : 'Personne n’a trouvé') + '</div>' +
          '<div class="ser" style="font-size:6vw;line-height:1.1">' + esc(st.mimes[c.mime]) + '</div>' + (c.winner ? '<div class="ser" style="font-size:2.2vw;color:#2F6F5E">' + (c.winner === c.clan ? esc(CK[c.clan].n) + ' +2' : esc(CK[c.clan].n) + ' +1 · ' + esc(CK[c.winner].n) + ' +1') + '</div>' : '') + '</div>';
      else if (c) mid = '<div class="ser" style="font-size:3.4vw">' + esc(c.mname || 'Le mimeur') + ' choisit son mime…</div>';
      else mid = '<div class="ser" style="font-size:3.4vw">Prochain mime…</div>';
      h = pHeader('L’Ombre', 'Épreuve 3 / 5 · Passages : ' + CL.map(function (k) { return esc(k.n) + ' ' + (cnt[k.k] || 0); }).join(' · '), right) +
        '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6vw;text-align:center">' + mid + '</div>' + pScores(false);
    } else if (s === 4) {
      var d = st.destin, sc = st.destinScenes[d.c], rolling = d.at && now() - d.at < 1600;
      h = pHeader(esc(sc.title), 'Épreuve 4 / 5 · Destin · Carrefour ' + (d.c + 1) + ' / 3', timerRight());
      if (d.stage === 'vote') {
        h += '<div class="ser" style="font-size:2.4vw;line-height:1.35;font-weight:600">' + esc(sc.text) + '</div><div style="display:flex;flex-direction:column;gap:1vw;flex:1">' + sc.opts.map(function (t, i) { return '<div class="row" style="gap:1.4vw;background:#fff;border-radius:1.6vw;padding:1vw 1.6vw"><span class="ser" style="width:4vw;height:4vw;border-radius:1vw;background:#F3EEF9;display:flex;align-items:center;justify-content:center;font-size:2.2vw">' + 'ABC'[i] + '</span><span class="ser" style="font-size:2.2vw;flex:1">' + esc(t) + '</span><span style="font-weight:800;font-size:1.4vw;color:#6A6280">' + esc(sc.risk[i]) + '</span></div>'; }).join('') + '</div>' +
          '<div class="row" style="gap:2vw;justify-content:center">' + CL.map(function (k) { var ok = !!(st.destinVotes || {})[k.k]; return '<span class="pill" style="font-size:1.6vw;padding:.6vw 1.4vw;background:' + (ok ? k.bg : 'rgba(255,255,255,.6)') + ';color:' + k.ink + '">' + esc(k.n) + (ok ? ' a voté' : ' réfléchit…') + '</span>'; }).join('') + '</div>';
      } else {
        h += '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (k) {
          var r = d.results[k.k];
          return '<div style="background:' + k.bg + ';border-radius:2.4vw;padding:2vw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2vw;text-align:center"><div class="ser" style="font-size:2.6vw;color:' + k.ink + '">' + esc(k.n) + ' · ' + r.opt + '</div>' +
            '<div class="ser ' + (rolling ? 'rolling' : '') + '" style="width:9vw;height:9vw;border-radius:2vw;background:#fff;display:flex;align-items:center;justify-content:center;font-size:5vw;box-shadow:0 .5vw 0 rgba(0,0,0,.15)">' + (rolling ? '?' : r.die) + '</div>' +
            (rolling ? '' : '<div class="ser" style="font-size:2.2vw">' + esc(r.text) + ' ' + (r.pts > 0 ? '+' : '') + r.pts + '</div>' + (r.gage ? '<div style="font-weight:800;font-size:1.5vw">Gage : ' + esc(r.gage) + '</div>' : '')) + '</div>';
        }).join('') + '</div>' + pScores(false);
      }
    }
    return { html: '<div class="pw">' + h + '</div>', cls: cls };
  }
  function projBoss() {
    var b = st.boss, t = now(), p2 = b.p2;
    var dying = b.dead && b.deadAt && t - b.deadAt < 2600;
    var rolling = b.p1 && b.p1.at && t - b.p1.at < 1600;
    var hit = b.p1 && b.p1.at && t - b.p1.at >= 1600 && t - b.p1.at < 2200;
    var right;
    if (b.dead && !dying) right = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vw;flex:1;text-align:center;animation:pop .8s ease-out both"><div style="font-family:Caveat,cursive;font-weight:700;font-size:11vw;color:#F7E6A8;line-height:1">Vaincu !</div><div class="ser" style="font-size:3vw">Alessia a terrassé Sanjûbi</div></div>';
    else {
      right = '<div style="display:flex;flex-direction:column;gap:.8vw"><div class="row" style="justify-content:space-between;align-items:baseline"><span class="pk" style="color:#D9CEF0">Points de vie</span><span class="ser" style="font-size:3.4vw">' + fmt(b.hp) + ' <span style="font-size:1.8vw;color:#D9CEF0">/ 2 026</span></span></div>' + hpBar(b.hp, 26) + '</div>';
      if (p2 && !p2.done) {
        var wait = t < p2.start, run = t < p2.end;
        right += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4vw;text-align:center"><div class="pk" style="color:#D9CEF0">Phase 2 · Rasengan collectif</div><div class="ser" style="font-size:3.4vw">' + (wait ? 'Préparez vos doigts…' : run ? 'Tapez tous !' : 'Terminé !') + '</div>' +
          (run ? '<div class="pclock" style="background:#fff;color:#3A3350">' + cd(wait ? p2.start : p2.end) + '</div>' : '') + '<div class="ser" style="font-size:6vw">' + fmt(st.tapsLive || 0) + ' <span style="font-size:2.4vw">tapes</span></div></div>';
      } else if (b.p1) {
        right += '<div class="pk" style="color:#D9CEF0">Phase 1 · toutes les attaques en même temps</div><div style="display:flex;flex-direction:column;gap:1vw">' + CL.map(function (c) {
          var dice = b.p1.dice[c.k], sum = dice.reduce(function (a, x) { return a + x; }, 0);
          return '<div class="row" style="gap:1.4vw;padding:1vw 1.6vw;border-radius:1.6vw;background:' + c.bg + ';color:#3A3350"><span class="ser" style="width:9vw;font-size:2.2vw">' + esc(c.n) + '</span><div class="row" style="gap:.8vw;flex:1;flex-wrap:wrap">' +
            dice.map(function (x) { return '<span class="ser ' + (rolling ? 'rolling' : '') + '" style="width:4.4vw;height:4.4vw;border-radius:1vw;background:#fff;display:flex;align-items:center;justify-content:center;font-size:2.4vw;box-shadow:0 .3vw 0 rgba(0,0,0,.2)">' + (rolling ? '?' : x) + '</span>'; }).join('') +
            '</div><span class="ser" style="font-size:2.4vw">' + (rolling ? '' : '−' + sum) + '</span></div>';
        }).join('') + '</div>' + (p2 && p2.done ? '<div class="ser" style="font-size:2.4vw;color:#F7E6A8">Rasengan : −' + fmt(p2.dmg) + ' · Le coup final revient à Alessia !</div>' : '');
      } else right += '<div style="flex:1;display:flex;align-items:center"><div class="ser" style="font-size:3.4vw;line-height:1.3">Sanjûbi menace le village.<br>Les clans se préparent à l’attaque…</div></div>';
    }
    var flash = dying && t - st.boss.deadAt < 900 ? '<div style="position:absolute;inset:0;background:#fff;animation:flash .9s ease-out forwards;pointer-events:none"></div>' : '';
    return { cls: 'dark proj', html: '<div class="pw" style="flex-direction:row;gap:4vw;align-items:stretch"><div style="' + (b.dead && !dying ? 'display:none;' : '') + 'width:34vw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4vw">' +
      (b.dead && !dying ? '' : bossSvg('boss' + (dying ? ' boom' : hit ? ' hit' : ''), '100%') + '<div style="font-family:Caveat,cursive;font-weight:700;font-size:5vw;line-height:1">Sanjûbi</div><div class="pk" style="color:#D9CEF0">Le démon à 30 queues</div>') + '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:2vw">' + right + '</div></div>' + flash };
  }
  function projHokage() {
    var ph = st.photos || [];
    if (st.hokage.slide && ph.length) {
      var id = ph[slideIdx % ph.length];
      var html = '<div class="slide"><img data-ph="' + id + '" alt=""></div>';
      setTimeout(function () { var img = root && root.querySelector('.slide img'); if (img) photoUrl(id).then(function (u) { img.src = u; }).catch(function () {}); var nx = ph[(slideIdx + 1) % ph.length]; photoUrl(nx).catch(function () {}); }, 0);
      return { cls: 'dark proj', html: html };
    }
    return { cls: 'peach proj', html: '<div class="pw" style="flex-direction:row;align-items:center;gap:5vw"><div style="position:relative;width:32vw;flex-shrink:0;padding-top:6vw">' +
      '<div style="background:#fff;padding:1.4vw 1.4vw 5vw;transform:rotate(-3deg);box-shadow:0 1.4vw 3vw rgba(58,51,80,.22);position:relative"><img src="/photo.jpg" alt="Alessia" style="width:100%;aspect-ratio:1;object-fit:cover;display:block"><div style="position:absolute;bottom:1vw;left:0;right:0;text-align:center;font-family:Caveat,cursive;font-weight:700;font-size:3vw">Hokage Alessia</div></div>' +
      '<svg width="80%" viewBox="0 0 300 150" aria-hidden="true" style="position:absolute;top:0;left:10%;animation:drop 1.1s .3s cubic-bezier(.3,1.4,.5,1) both"><path d="M150 10 L 290 120 Q 150 150 10 120 Z" fill="#fff" stroke="#3A3350" stroke-width="5" stroke-linejoin="round"/><path d="M150 10 L 222 66 Q 150 82 78 66 Z" fill="#C0506A"/><text x="150" y="112" text-anchor="middle" font-family="serif" font-size="40" font-weight="700" fill="#C0506A">火</text></svg></div>' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:1.6vw;animation:rise .8s 1.2s ease-out both"><div class="pk">Sanjûbi est vaincu</div><h1 class="pt" style="font-size:9vw">Alessia<br>est Hokage !</h1><div class="ser" style="font-size:2.2vw;font-weight:600;line-height:1.3">L’élève de Kakashi a 30 ans et veille désormais sur le village.</div>' + pScores(false) + '</div></div>' };
  }

  /* ---------- interactions ---------- */
  function onDown(e) {
    var hb = e.target.closest('[data-g="ohold"]');
    if (hb) { e.preventDefault(); var hv = document.getElementById('g-hold'); if (hv) { hv.style.display = 'flex'; var up = function () { hv.style.display = 'none'; window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); }; window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); } return; }
    var b = e.target.closest('[data-g="tap"]');
    if (!b || b.disabled) return;
    e.preventDefault();
    pl.taps++;
    var el = document.getElementById('g-taps'); if (el) el.textContent = pl.taps;
    b.style.transform = 'scale(.94)'; setTimeout(function () { b.style.transform = ''; }, 60);
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {}
  }
  function onChange(e) { if (e.target.id === 'g-file' && e.target.files.length) upload(e.target.files); }
  function onClick(e) {
    var b = e.target.closest('[data-g]'); if (!b || b.disabled) return;
    var g = b.getAttribute('data-g'), d = function (k) { return b.getAttribute('data-' + k); };
    if (g === 'tap') return;
    if (g === 'home') { A.go(''); return; }
    if (g === 'demoquit') { A.sess.del(A.KX); A.go('admin'); return; }
    if (g === 'demofake') { act('demoFake', { me: myName() }); return; }
    if (g === 'pname') { var v = (document.getElementById('g-name') || {}).value || ''; v = v.trim(); if (!v) { A.toast('Prénom manquant'); return; } A.store.set(A.KM, v); lastHtml = ''; poll(); draw(); return; }
    if (g === 'seq') {
      var s = curSeq().slice(); if (s.indexOf(d('k')) >= 0 || s.length >= 4) return; s.push(d('k'));
      pl.seq = s; pl.seqAt = Date.now(); lastHtml = ''; draw();
      req('/api/game/seq', { method: 'POST', body: { name: myName(), seq: s } }).catch(function (er) { A.toast(A.errMsg(er)); });
      return;
    }
    if (g === 'unseq') {
      var s2 = curSeq().slice(), i = +d('i'); if (i >= s2.length) return; s2.splice(i, 1);
      pl.seq = s2; pl.seqAt = Date.now(); lastHtml = ''; draw();
      req('/api/game/seq', { method: 'POST', body: { name: myName(), seq: s2 } }).catch(function (er) { A.toast(A.errMsg(er)); });
      return;
    }
    if (g === 'oreveal') { pl.reveal = d('k'); lastHtml = ''; draw(); return; }
    if (g === 'opickp') {
      req('/api/game/opick', { method: 'POST', body: { name: myName(), i: +d('i') } }).then(poll).catch(function (er) { A.toast(er && er.code === 'closed' ? 'Mime déjà choisi' : A.errMsg(er)); poll(); });
      return;
    }
    if (g === 'oshow') { mj.showOpts = true; lastHtml = ''; draw(); return; }
    if (g === 'rate') {
      pl.rate = +d('n'); pl.rateAt = Date.now(); lastHtml = ''; draw();
      req('/api/game/rate', { method: 'POST', body: { name: myName(), n: +d('n') } }).then(poll).catch(function (er) { A.toast(A.errMsg(er)); });
      return;
    }
    if (g === 'runlock') { act('rUnlock'); return; }
    if (g === 'rstage') { act('rStage', { clan: d('c') }); return; }
    if (g === 'rvote') { act('rVote'); return; }
    if (g === 'rreveal') { act('rReveal'); return; }
    if (g === 'music') { act('music', { clan: d('c'), on: d('on') === '1' }); return; }
    if (g === 'songs') {
      var so = {}; CL.forEach(function (c) { var e = document.getElementById('g-song-' + c.k); so[c.k] = e ? e.value.trim() : ''; });
      var bad = CL.filter(function (c) { return so[c.k] && !yt(so[c.k]); });
      if (bad.length) { A.toast('Lien YouTube invalide : ' + bad.map(function (c) { return c.n; }).join(', ')); return; }
      act('rSongs', { songs: so }).then(function () { A.toast('Musiques enregistrées'); });
      return;
    }
    if (g === 'cri') {
      var ci = document.getElementById('g-cri'), tx = ci ? ci.value.trim() : '';
      if (!tx) { A.toast('Cri vide'); return; }
      ci.value = '';
      req('/api/game/cri', { method: 'POST', body: { name: myName(), text: tx } }).then(function () { A.toast('Cri enregistré'); poll(); }).catch(function (er) { A.toast(A.errMsg(er)); });
      return;
    }
    if (g === 'ouv') { act('ouvView', { v: d('v'), replay: d('r') === '1' }); return; }
    if (g === 'spot') { act('criSpot', { clan: d('c') }); return; }
    if (g === 'vote') {
      pl.vote = d('k'); pl.voteAt = Date.now(); lastHtml = ''; draw();
      req('/api/game/vote', { method: 'POST', body: { name: myName(), opt: d('k') } }).then(poll).catch(function (er) { A.toast(A.errMsg(er)); });
      return;
    }
    // MJ
    if (g === 'step') { mj.sel = null; act('step', { i: +d('i') }); return; }
    if (g === 'on') { act('on', { v: d('v') === '1' }); return; }
    if (g === 'pts') { act('pts', { clan: d('c'), d: +d('d') }); return; }
    if (g === 'joker') { act('joker', { clan: d('c') }); return; }
    if (g === 'timer') { act('timer', { sec: +d('s') }); return; }
    if (g === 'timerStop') { act('timerStop'); return; }
    if (g === 'addp') { var inp = document.getElementById('g-add'); var n = inp ? inp.value.trim() : ''; if (!n) return; inp.value = ''; act('addp', { name: n }); return; }
    if (g === 'delp') { act('delp', { id: d('id') }); return; }
    if (g === 'move') { var p = st.roster[d('id')], order = [null, 'feu', 'foudre', 'vent'], nx = order[(order.indexOf(p.clan || null) + 1) % 4]; act('move', { id: d('id'), clan: nx }); return; }
    if (g === 'draw') { act('draw'); return; }
    if (g === 'drawRest') { act('drawRest'); return; }
    if (g === 'reset') { if (!mj.resetArm) { mj.resetArm = true; lastHtml = ''; draw(); setTimeout(function () { mj.resetArm = false; lastHtml = ''; draw(); }, 3000); return; } mj.resetArm = false; act('reset').then(function () { A.toast('Jeu réinitialisé'); }); return; }
    if (g === 'qsave') { act('savoirSet', { text: (document.getElementById('g-qs') || {}).value || '' }).then(function () { A.toast('Questions enregistrées'); }); return; }
    if (g === 'sidx') { act('savoirIdx', { i: +d('i') }); return; }
    if (g === 'onext') { mj.sel = null; mj.showOpts = false; act('ombreNext'); return; }
    if (g === 'opick') { act('ombrePick', { i: +d('i') }); return; }
    if (g === 'osel') { mj.sel = d('c'); lastHtml = ''; draw(); return; }
    if (g === 'ojudge') { var c = mj.sel; mj.sel = null; act('ombreJudge', { clan: c, ok: d('ok') === '1' }); return; }
    if (g === 'oskip') { mj.sel = null; act('ombreSkip'); return; }
    if (g === 'dvote') { act('destinVote', { clan: d('c'), opt: d('k') }); return; }
    if (g === 'dreveal') { act('destinReveal'); return; }
    if (g === 'dnext') { act('destinNext'); return; }
    if (g === 'bp1') { act('bossP1'); return; }
    if (g === 'bp2s') { act('bossP2Start'); return; }
    if (g === 'bp2c') { act('bossP2Close'); return; }
    if (g === 'bfinal') { act('bossFinal'); try { if (navigator.vibrate) navigator.vibrate([60, 40, 120]); } catch (_) {} return; }
    if (g === 'slide') { slideIdx = 0; slideAt = now(); act('slide', { on: d('on') === '1' }); return; }
    if (g === 'pdel') { fetch('/api/game/photo?id=' + d('id'), { method: 'DELETE', headers: { 'x-code': code() } }).then(poll); return; }
  }

  window.A30G = { routes: { jeu: 1, mj: 1, ecran: 1 }, show: show, hide: hide, fig: fig, moves: MOVES };
})();
