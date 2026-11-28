/* Jeu de groupe « La Quête des 30 ans » — écrans joueur (#jeu), maître du jeu (#mj) et projection (#ecran). */
(function () {
  'use strict';
  var A = window.A30;
  if (!A) return;
  var esc = A.esc;

  var CL = [
    { k: 'feu', n: 'Feu', bg: '#F9C3AE', ink: '#8E3A1F', p: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3 0-5 0-7z', j: ['Katon : Renaissance', 'Katon : Brasier', 'Katon : Lueur'] },
    { k: 'foudre', n: 'Foudre', bg: '#C9DAF5', ink: '#1F3F8A', p: 'M13 2L4 14h7l-1 8 9-12h-7z', j: ['Raiton : Second éclair', 'Raiton : Chidori', 'Raiton : Flash'] },
    { k: 'vent', n: 'Vent', bg: '#BFE3D4', ink: '#2F6F5E', p: 'M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h7', j: ['Fûton : Contre-vent', 'Fûton : Tornade', 'Fûton : Murmure'] },
  ];
  var CK = {}; CL.forEach(function (c) { CK[c.k] = c; });
  // Choix des clans : chefs (ordre de l'illustration : Foudre · Feu · Vent), sceaux et personnalités.
  var CS_ORDER = ['foudre', 'feu', 'vent'];
  var CHEF = {
    foudre: { s: '雷', c: '#2F5FD0', p: 'Rapide, stratégique et impitoyable. Il excelle dans la prise de décision et n’hésite pas à agir pour protéger son Clan.' },
    feu: { s: '火', c: '#C8372D', p: 'Déterminé, charismatique et protecteur. Il place toujours le bien de son Clan et de ses habitants au premier plan.' },
    vent: { s: '風', c: '#4E7A3A', p: 'Serein, bienveillant et visionnaire. Il privilégie l’harmonie et la paix, et croit en un avenir meilleur pour son Clan.' },
  };
  var CRI_IDEAS = {
    foudre: ['Plus rapides que l’éclair !', 'Un éclair, zéro pitié !', 'La Foudre frappe toujours en premier !', 'Raiton : on électrise le brunch !'],
    feu: ['La flamme de la jeunesse ne s’éteint jamais !', 'Allumez le feu !', 'Katon : on met le feu au brunch !', 'Brûlants comme 30 bougies !'],
    vent: ['Le vent tourne… en notre faveur !', 'Fûton : on décoiffe tout !', 'Plus libres que le vent !', 'Rien ne résiste au Vent !'],
  };
  function clanName(k) { return 'Clan ' + CLB[k].pre + ' ' + CK[k].n; }
  var JOKER_TXT = 'Une seule fois dans la partie, vos points comptent double sur l’épreuve de votre choix (K-pop no Jutsu, Hit-Jutsu, Examen Chûnin, Théâtre des ombres ou Voie du ninja). Annoncez-le au maître du jeu avant le début de l’épreuve.';
  function bri() { return st && st.brief !== null && st.brief !== undefined ? st.brief : null; } // épreuve annoncée (avant son lancement)
  function jkStep() { var b = bri(); return b !== null ? b : st.step; }
  function jk(c) { var j = st.joker && st.joker[c]; return !j || j.step === null ? 'free' : j.step === jkStep() ? 'on' : 'used'; }
  // Textes lus par le MJ pendant l'annonce de chaque épreuve.
  var BRIEF = {
    1: 'Première épreuve : le K-pop no Jutsu ! Sur vos téléphones, chaque clan choisit 4 mouvements parmi 10 et les met dans l’ordre : c’est votre chorégraphie. Vous avez 1 minute 30 pour vous mettre d’accord et répéter. Ensuite, chaque clan passe à son tour sur « Do It Like That » de TXT et des Jonas Brothers. Les deux autres clans notent la prestation de 1 à 5 étoiles sur leurs téléphones : la moyenne devient vos points. Pas besoin d’être des pros : on note surtout l’énergie et la bonne humeur !',
    7: 'Deuxième épreuve : le Hit-Jutsu ! On joue avec les cartes Hitster. À tour de rôle, un clan pioche une carte et la musique se lance. Le clan qui a pioché a 45 secondes pour trouver l’année de sortie de la chanson, comme dans le vrai Hitster : 2 points. Si vous séchez, les deux autres clans peuvent tenter leur chance : 1 point pour le clan qui trouve. Sur vos téléphones : vert, vous pouvez répondre ; rouge, vous attendez. Deux tours, six cartes en tout.',
    2: 'Troisième épreuve : l’Examen Chûnin ! Alessia quitte son clan le temps de l’épreuve : elle devient votre Sensei. Je vais poser 10 questions sur elle. Pour répondre, levez la main comme à l’école : je donne la parole au premier qui la lève, et c’est Alessia qui valide : 1 point par bonne réponse. Si c’est faux, un autre clan peut tenter sa chance. Prouvez que vous la connaissez vraiment !',
    3: 'Quatrième épreuve : le Théâtre des ombres ! À tour de rôle, chaque clan envoie un mimeur, désigné automatiquement pour que tout le monde passe. Le mimeur reçoit 3 propositions sur son téléphone, en choisit une et a 45 secondes pour la faire deviner, sans un mot. Chaque clan désigne un négociateur : c’est le seul qui peut répondre, en levant la main. Trouvé par son propre clan : 2 points. Trouvé par un autre clan : 1 point pour le clan du mimeur et 1 point pour celui qui a trouvé. Un clan qui se trompe passe au rouge jusqu’à ce que les autres aient tenté. L’épreuve dure 10 minutes.',
    4: 'Cinquième épreuve : la Voie du ninja ! Vous partez sur les traces de Sanjûbi, et trois carrefours vous attendent. À chacun, je vous lis l’histoire, puis chaque clan a 45 secondes pour voter en secret. Prudent : 1 point assuré. Audacieux : il faut 10 ou plus au dé à 20 faces pour gagner 3 points. Fou : il faut 15 ou plus pour gagner 6 points… mais si c’est raté, vous perdez 1 point et vous avez un gage ! Vos choix ont des conséquences sur la suite, et au dernier carrefour, tous les points comptent double.',
    5: 'Épreuve finale : la Bataille des 30 queues ! Tous les points gagnés depuis le début deviennent votre force d’attaque : chaque tranche de 5 points vous donne une attaque, un dé à 20 faces multiplié par votre chakra. Ensuite, les trois clans s’unissent pour le Rasengan : 10 secondes pour taper le plus vite possible sur vos téléphones. Et pour finir… c’est notre future Hokage qui portera le coup final. Préparez-vous : Sanjûbi se réveille !',
  };
  var STEPN = ['L’Appel des clans', 'K-pop no Jutsu', 'L’Examen Chûnin', 'Le Théâtre des ombres', 'La Voie du ninja', 'La Bataille des 30 queues', 'La Nuit de la Hokage', 'Hit-Jutsu'];
  var STEPS_S = ['Appel des clans', 'K-pop no Jutsu', 'Examen Chûnin', 'Théâtre des ombres', 'Voie du ninja', 'Bataille', 'Nuit de la Hokage', 'Hit-Jutsu']; // versions courtes (onglets, joker)
  var ORDER = [0, 1, 7, 2, 3, 4, 5, 6]; // ordre de jeu (Hit-Jutsu, ajoutée après coup, se joue après K-pop no Jutsu)
  function jokerOk(s) { return s === 1 || s === 7 || (s >= 2 && s <= 4); }
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
    'De l’examen des Chûnins au Théâtre des ombres, en passant par le fameux K-pop no Jutsu : chaque épreuve renforcera votre chakra pour la Bataille des 30 queues.',
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
    '@font-face{font-family:Mincho30;src:url(/fonts/mincho-800.woff2) format(\'woff2\');font-weight:800;font-display:swap}@font-face{font-family:Mincho30;src:url(/fonts/mincho-700.woff2) format(\'woff2\');font-weight:400 700;font-display:swap}@font-face{font-family:Gothic30;src:url(/fonts/gothic-500.woff2) format(\'woff2\');font-weight:400 600;font-display:swap}@font-face{font-family:Gothic30;src:url(/fonts/gothic-700.woff2) format(\'woff2\');font-weight:700 800;font-display:swap}@font-face{font-family:Gothic30;src:url(/fonts/gothic-900.woff2) format(\'woff2\');font-weight:900;font-display:swap}',
    '#g{position:fixed;inset:0;overflow-y:auto;z-index:30;font-family:Gothic30,Nunito,sans-serif;font-weight:500;color:#1E1A17;-webkit-tap-highlight-color:transparent}',
    '#g.peach{background-color:#F4ECDD;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27300%27 height=%27300%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .09 0%27/%3E%3C/filter%3E%3Crect width=%27300%27 height=%27300%27 filter=%27url(%23n)%27/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27600%27 height=%27600%27%3E%3Cfilter id=%27f%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.012 .09%27 numOctaves=%273%27/%3E%3CfeColorMatrix values=%270 0 0 0 .55 0 0 0 0 .45 0 0 0 0 .3 0 0 0 .10 0%27/%3E%3C/filter%3E%3Crect width=%27600%27 height=%27600%27 filter=%27url(%23f)%27/%3E%3C/svg%3E")}',
    '#g.dark{background:#1E1A17;color:#fff}',
    '#g .w{max-width:460px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));box-sizing:border-box;display:flex;flex-direction:column;gap:14px;min-height:100%}',
    '#g h1{margin:0;font-family:Mincho30,Georgia,serif;font-size:34px;font-weight:800;line-height:1.08;letter-spacing:.005em}',
    '#g.peach .hd h1:after{content:"";display:block;width:150px;height:10px;margin-top:6px;background:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 12%27 preserveAspectRatio=%27none%27%3E%3Cpath d=%27M2 7 C40 2 90 4 140 6 S190 8 198 4%27 stroke=%27%23C8372D%27 stroke-width=%275%27 fill=%27none%27 stroke-linecap=%27round%27/%3E%3C/svg%3E") no-repeat center/100% 100%}',
    '#g .kk{font:700 11px Gothic30,sans-serif;letter-spacing:.22em;color:#C8372D;margin-bottom:6px;text-transform:uppercase}#g .vk{writing-mode:vertical-rl;font-family:Mincho30,serif;font-weight:800;color:#C8372D;letter-spacing:.18em;font-size:20px;line-height:1}',
    '#g .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
    '#g .card{position:relative;background:rgba(255,253,248,.8);border:1.5px solid #2a2420;border-radius:4px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;color:#1E1A17}#g .card:before,#g .card:after{content:"";position:absolute;width:10px;height:10px;border:2px solid #C8372D;pointer-events:none}#g .card:before{left:-5px;top:-5px;border-right:0;border-bottom:0}#g .card:after{right:-5px;bottom:-5px;border-left:0;border-top:0}',
    '#g .lab{font-size:11px;font-weight:700;letter-spacing:.18em;color:#7a6a58;text-transform:uppercase}',
    '#g .ser{font-family:Mincho30,Georgia,serif;font-weight:800}',
    '#g button{font-family:Gothic30,Nunito,sans-serif;cursor:pointer;color:inherit}',
    '#g .btn{height:54px;border-radius:6px;border:0;background:#C8372D;color:#FBF3E6;font-family:Mincho30,Georgia,serif;font-weight:800;font-size:18px;box-shadow:0 4px 0 #8f241d;padding:0 16px;letter-spacing:.02em}',
    '#g .btn:disabled{opacity:.45}',
    '#g .btn2{height:46px;border-radius:6px;border:1.5px solid #2a2420;background:rgba(255,253,248,.9);font-weight:700;font-size:15px;color:#1E1A17;padding:0 14px}',
    '#g .chip{height:34px;padding:0 12px;border-radius:4px;border:1.5px solid #cbbba3;background:rgba(255,253,248,.9);font-weight:700;font-size:13px;color:#1E1A17;white-space:nowrap}',
    '#g .chip.on{background:#1E1A17;color:#F4ECDD;border-color:#1E1A17}',
    '#g .muted{color:#6b5e52;font-weight:700;font-size:14px}',
    '#g .row{display:flex;align-items:center;gap:8px}',
    '#g .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    '#g .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '#g input,#g textarea{font-family:Gothic30,Nunito,sans-serif;font-size:16px;border:1.5px solid #d9cbb4;border-radius:12px;padding:10px 12px;background:#fff;color:#1E1A17;box-sizing:border-box;width:100%}',
    '#g textarea{min-height:150px;resize:vertical}',
    '#g .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-weight:800;font-size:13px}',
    '#g .row>.gbar{flex:1}#g .gbar{height:12px;flex-shrink:0;border-radius:999px;background:#e6dccb;overflow:hidden;min-width:40px}#g .gbar>i{display:block;height:100%;background:#C8372D;border-radius:999px}',
    '#g.dark .gbar{background:rgba(255,255,255,.14)}#g .hp>i{background:#C8372D}',
    '#g .full{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px;color:#fff;transition:background .3s}',
    '#g .cban img{-webkit-mask-image:radial-gradient(ellipse 54% 64% at 50% 50%,#000 72%,transparent 100%);mask-image:radial-gradient(ellipse 54% 64% at 50% 50%,#000 72%,transparent 100%)}#g.peach .cban img{mix-blend-mode:multiply;filter:sepia(.18) saturate(.92) contrast(1.04)}#g.peach .cban:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.8%27 numOctaves=%272%27/%3E%3CfeColorMatrix values=%270 0 0 0 .5 0 0 0 0 .42 0 0 0 0 .3 0 0 0 .35 0%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27/%3E%3C/svg%3E");mix-blend-mode:multiply;-webkit-mask-image:radial-gradient(ellipse 54% 64% at 50% 50%,#000 72%,transparent 100%);mask-image:radial-gradient(ellipse 54% 64% at 50% 50%,#000 72%,transparent 100%)}',
    '#g .scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}#g .scroll::-webkit-scrollbar{display:none}',
    /* choix des clans (sélection façon Tekken / Mario Kart) */
    '#g .cs{position:fixed;inset:0;z-index:40;background:#0f0c0a;color:#F4ECDD;overflow:hidden}#g .cs .kk{color:#f0a090}',
    '#g .cs-cols{position:absolute;inset:0;display:flex;gap:3px;max-width:460px;margin:0 auto}',
    '#g .cs-col{position:relative;flex:1;overflow:hidden;border:0;padding:0;background:#222;transition:flex .5s cubic-bezier(.2,.9,.25,1.15),filter .4s;color:#F4ECDD}',
    '#g .cs-col img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 50%;transition:transform .6s cubic-bezier(.2,.9,.25,1.15)}',
    '#g .cs-cols.has .cs-col{flex:.62;filter:grayscale(.75) brightness(.5)}#g .cs-cols.has .cs-col.on{flex:2.9;filter:none}#g .cs-col.on img{transform:translateY(-9%)}',
    '#g .cs-col:after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 0 var(--c);transition:box-shadow .4s}#g .cs-col.on:after{box-shadow:inset 0 0 0 4px var(--c),inset 0 0 40px rgba(0,0,0,.25)}',
    '#g .cs-seal{position:absolute;left:50%;bottom:calc(30px + env(safe-area-inset-bottom));transform:translateX(-50%) rotate(-5deg);width:52px;height:52px;border-radius:6px;background:var(--c);color:#FBF3E6;display:flex;align-items:center;justify-content:center;font:800 28px Mincho30,serif;box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .45s cubic-bezier(.2,.9,.25,1.4),opacity .3s}#g .cs-col.on .cs-seal{transform:translateX(-50%) rotate(-5deg) scale(1.25)}',
    '#g .cs-cnt{position:absolute;top:calc(112px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);background:rgba(15,12,10,.72);border-radius:999px;padding:3px 10px;font-weight:900;font-size:13px;white-space:nowrap}',
    '#g .cs-full{position:absolute;top:30%;left:-10%;right:-10%;transform:rotate(-12deg);background:rgba(15,12,10,.85);color:#F7E6A8;text-align:center;font-weight:900;letter-spacing:.2em;font-size:13px;padding:6px 0}',
    '#g .cs-fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:2}#g .cs-col.fx .cs-fl{animation:csfl .5s ease-out}@keyframes csfl{0%{opacity:.7}100%{opacity:0}}',
    '#g .cs-top{position:absolute;left:0;right:0;top:0;z-index:3;padding:calc(46px + env(safe-area-inset-top)) 18px 26px;background:linear-gradient(rgba(15,12,10,.9),transparent);text-align:center;pointer-events:none}#g .cs-t{font:800 24px Mincho30,Georgia,serif}',
    '#g .cs-info{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:70px 14px calc(18px + env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(15,12,10,.82) 32%,rgba(15,12,10,.95));text-align:left;opacity:0;transform:translateY(24px);pointer-events:none;transition:opacity .25s,transform .25s;cursor:default}',
    '#g .cs-col.on .cs-info{opacity:1;transform:none;pointer-events:auto;transition:opacity .4s .3s,transform .5s .3s cubic-bezier(.2,.9,.25,1.1)}#g .cs-col.on .cs-seal{opacity:0}',
    '#g .cs-info h2{margin:3px 0 4px;font:800 25px/1.05 Mincho30,Georgia,serif;color:#F4ECDD}#g .cs-info h2:after{content:"";display:block;width:56px;height:4px;margin-top:6px;border-radius:2px;background:var(--c)}',
    '#g .cs-info p{margin:8px 0 6px;font:700 14.5px/1.45 Mincho30,Georgia,serif;color:#F4ECDD}#g .cs-ml{font-size:12.5px;color:#bdae95;font-weight:700;margin-bottom:10px}#g .cs-info .btn{height:46px;font-size:16px}',
    '#g .cs-splash,#g .cs-done{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;justify-content:flex-end;padding:0 22px calc(28px + env(safe-area-inset-bottom));background-size:cover;background-position:center 30%;transition:opacity .5s,transform .5s}',
    '#g .cs-splash>*,#g .cs-done>*{position:relative;max-width:420px;width:100%;margin-left:auto;margin-right:auto}#g .cs-splash:before,#g .cs-done:before{content:"";position:absolute;inset:0;max-width:none;background:linear-gradient(transparent 42%,rgba(15,12,10,.96) 80%)}',
    '#g .cs-splash{background-size:contain;background-position:50% 0;background-repeat:no-repeat;background-color:#0f0c0a}#g .cs-splash:before{background:linear-gradient(transparent 36%,rgba(15,12,10,.97) 66%)}#g .cs-splash.off{opacity:0;transform:scale(1.08);pointer-events:none}#g .cs-splash h1{margin:8px auto 6px;font-size:40px;line-height:1.05;color:#F4ECDD}#g .cs-splash p,#g .cs-done p{margin:0 auto 14px;color:#e6d9c2;font-weight:700}',
    '#g .cs-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#C8372D;margin-right:8px;vertical-align:middle;animation:breathe 1.2s ease-in-out infinite}',
    '#g .cs-done{align-items:center;text-align:center;background-position:50% 45%;padding-bottom:calc(30px + env(safe-area-inset-bottom))}#g .cs-done h2{margin:0 auto 6px;font:800 30px/1.1 Mincho30,Georgia,serif;color:#F4ECDD}',
    '#g .cs-stamp{width:110px!important;height:110px;border:5px solid #C8372D;color:#C8372D;background:rgba(244,236,221,.9);border-radius:10px;display:flex;align-items:center;justify-content:center;font:800 64px Mincho30,serif;transform:rotate(-8deg);margin-bottom:16px!important}',
    '#g .cs-stamp.anim{animation:csst .6s .15s cubic-bezier(.3,1.5,.5,1) both}@keyframes csst{0%{transform:scale(2.6) rotate(-25deg);opacity:0}100%{transform:scale(1) rotate(-8deg);opacity:1}}',
    '#g .cs-done .btn2{background:rgba(15,12,10,.55);color:#F4ECDD;border-color:#bdae95}',
    '#g .cs .btn{width:100%}#g .cs-col:focus-visible,#g .cs .btn:focus-visible{outline:3px solid #F7E6A8;outline-offset:-3px}',
    /* carte de ninja, moment « clans formés », joker compact, idées de cris */
    '#g .nj{position:relative;border:1.5px solid #2a2420;border-radius:6px;overflow:hidden;background:#fffdf8;box-shadow:0 6px 16px rgba(30,26,23,.12)}',
    '#g .nj-img{height:260px;background-size:cover;background-position:50% 58%;position:relative}#g .nj-img:after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 55%,rgba(15,12,10,.85))}',
    '#g .nj-sl{position:absolute;z-index:1;right:12px;top:12px;width:44px;height:44px;border-radius:6px;background:var(--c);color:#FBF3E6;display:flex;align-items:center;justify-content:center;font:800 24px Mincho30,serif;transform:rotate(-5deg);box-shadow:0 3px 10px rgba(0,0,0,.35)}',
    '#g .nj-t{position:absolute;z-index:1;left:14px;right:14px;bottom:10px;color:#F4ECDD}#g .nj-t .lab{color:#e6d9c2}#g .nj-t .ser{font-size:28px;line-height:1.05}',
    '#g .nj-m{display:flex;flex-wrap:wrap;gap:6px;padding:12px 14px;border-top:5px solid var(--c)}#g .nj-m span{border:1.5px solid #cbbba3;border-radius:4px;padding:2px 9px;font-weight:700;font-size:14px}#g .nj-m span.me{background:#1E1A17;color:#F4ECDD;border-color:#1E1A17}',
    '#g .lk{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:24px 24px calc(56px + env(safe-area-inset-bottom));background-color:#0f0c0a;background-size:cover;background-position:50% 100%;color:#F4ECDD}#g .lk:before{content:"";position:absolute;inset:0;background:linear-gradient(transparent 38%,rgba(15,12,10,.94) 72%)}#g .lk>*{position:relative}',
    '#g .lk-st{width:130px;height:130px;border:6px solid var(--c);color:var(--c);background:rgba(244,236,221,.94);border-radius:12px;display:flex;align-items:center;justify-content:center;font:800 78px Mincho30,serif;transform:rotate(-8deg);margin-bottom:22px;animation:csst .6s .2s cubic-bezier(.3,1.5,.5,1) both}',
    '#g .lk h1{color:#F4ECDD;font-size:36px;animation:rise .6s .7s ease-out both}#g .lk p{margin:10px 0 0;font-weight:700;font-size:18px;color:#e6d9c2;animation:rise .6s 1s ease-out both}',
    '#g .jk{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1.5px solid #2a2420;border-radius:6px;background:rgba(255,253,248,.85);padding:10px 12px}#g .jk b.x{flex-shrink:0;width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font:800 19px Mincho30,serif}',
    '#g .idea{display:flex;flex-wrap:wrap;gap:6px}#g .idea button{border:1.5px dashed #b9a88f;background:rgba(255,253,248,.7);border-radius:999px;padding:5px 11px;font-weight:700;font-size:13px;color:#1E1A17;text-align:left}',
    /* annonce d'épreuve */
    '#g .br{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:10px 0}',
    '#g .br-sl{width:96px;height:96px;border-radius:10px;background:#C8372D;color:#FBF3E6;display:flex;align-items:center;justify-content:center;font:800 56px Mincho30,serif;transform:rotate(-5deg);box-shadow:0 6px 0 #8f241d;animation:csst .6s .1s cubic-bezier(.3,1.5,.5,1) both}',
    '#g .br h1{font-size:40px;animation:rise .6s .4s ease-out both}#g .br .kk{animation:rise .6s .3s ease-out both}',
    '#g .br-li{display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;animation:rise .6s .8s ease-out both}',
    '#g .bp{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vw;text-align:center;padding:4vw}',
    '#g .bp-sl{width:11vw;height:11vw;border-radius:1vw;background:#C8372D;color:#FBF3E6;display:flex;align-items:center;justify-content:center;font:800 6.4vw Mincho30,serif;transform:rotate(-5deg);box-shadow:0 .6vw 0 #8f241d;animation:csst .7s .1s cubic-bezier(.3,1.5,.5,1) both}',
    '#g .bp h1{font-size:7.4vw;line-height:1.05;animation:rise .7s .5s ease-out both}#g .bp .pk{animation:rise .7s .35s ease-out both}',
    '#g .bp-li{font-weight:800;font-size:1.9vw;color:#6b5e52;animation:rise .7s .9s ease-out both}#g .bp-sc{margin-top:2vw;animation:rise .7s 1.2s ease-out both}',
    /* bataille des 30 queues : arène (projection), attaque du clan, coup final (téléphones) */
    '#g .arena{position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center}#g .arena-in{position:relative;width:min(100vw,177.78vh);height:min(56.25vw,100vh)}#g .arena-in canvas{position:absolute;inset:0;display:block;width:100%;height:100%}#g #arena-fx{pointer-events:none}',
    '#g .atk{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px;background:radial-gradient(circle at 50% 40%,var(--g),var(--c) 55%,#140c0c);animation:atkp 1s ease-in-out infinite alternate}',
    '#g .atk-j{font-size:30px;color:#fff;line-height:1.15;text-shadow:0 3px 12px rgba(0,0,0,.35)}@keyframes atkp{from{filter:brightness(.92)}to{filter:brightness(1.12)}}',
    '#g .fv{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:radial-gradient(circle at 50% 40%,#3a2414,#09070b 75%);color:#F4ECDD}',
    '#g .fv h1{color:#F4ECDD;font-size:40px;margin:14px 0 6px}#g .fv p{margin:0;color:#e6d9c2;font-weight:700}',
    '#g .fv-k{font:800 110px/1 Mincho30,serif;color:#F7C948;text-shadow:0 0 40px rgba(247,201,72,.6);animation:csst .7s .1s cubic-bezier(.3,1.5,.5,1) both}',
    '#g .fv-fl{position:fixed;inset:0;background:#fff;z-index:5;pointer-events:none;animation:fvfl 1.3s ease-out forwards}@keyframes fvfl{0%{opacity:1}100%{opacity:0}}',
    '#g .fq{position:fixed;inset:0;z-index:70;background:#09070b}#g .fq canvas{display:block;width:100%;height:100%;touch-action:none}',
    '#g .fq-ov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:0 22px calc(28px + env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 30%,#2a1c2e,#09070b 75%);color:#F4ECDD}',
    '#g .fq-ov h1{color:#F4ECDD;font-size:36px;margin:8px 0 10px}#g .fq-ov ul{margin:0 0 20px;padding-left:18px;color:#e6d9c2;font-weight:700;font-size:15px}#g .fq-ov li{margin-bottom:6px}',
    '#g .fq-sl{width:84px;height:84px;border-radius:10px;background:#C8372D;color:#FBF3E6;display:flex;align-items:center;justify-content:center;font:800 46px Mincho30,serif;transform:rotate(-5deg);box-shadow:0 5px 0 #8f241d;margin-bottom:18px}',
    '#g .fh{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:10px;background:radial-gradient(circle at 50% 35%,#1d2740,#09070b 75%);color:#F4ECDD}',
    '#g.dark h1,#g.dark h2{color:#F4ECDD}#g .fh h2{margin:0;font:800 28px/1.1 Mincho30,serif;color:#F4ECDD}#g .fh p{margin:0;color:#bdae95;font-weight:700}',
    '#g .fh-b{position:relative;width:220px;height:220px;margin:18px 0;border-radius:50%;border:0;background:radial-gradient(circle at 40% 35%,#fff,#9fd3ff 30%,#2f6fe0 70%,#14204a);box-shadow:0 0 40px rgba(127,212,255,.45);color:#fff;font:800 22px Mincho30,serif;touch-action:none;transition:transform .15s,box-shadow .15s;-webkit-user-select:none;user-select:none}',
    '#g .fh-b.on{transform:scale(1.08);box-shadow:0 0 90px rgba(127,212,255,.9)}#g .fh-b svg{position:absolute;inset:-14px;width:248px;height:248px;transform:rotate(-90deg);pointer-events:none}#g .fh-b span{pointer-events:none}',
    /* projection des cris de guerre */
    '#g .crp-veil{position:absolute;top:0;bottom:0;width:33.4%;background:rgba(15,12,10,.72);opacity:0;transition:opacity .5s}#g .crp-veil.on{opacity:1}',
    '#g .crp{position:absolute;bottom:3em;width:28%;transform:translateX(-50%);background:rgba(244,236,221,.95);color:#1E1A17;border-radius:.4em;padding:1.2em 1.5em 1.1em;border-top:.4em solid var(--c);transition:width .5s cubic-bezier(.2,.9,.25,1.1),opacity .5s,transform .5s;text-align:center}',
    '#g .crp .ck{font:800 1.3em Gothic30,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#6b5e52}#g .crp .ct{font:800 2.6em/1.15 Mincho30,Georgia,serif;margin:.35em 0 .3em}#g .crp .cb{font-weight:700;font-size:1.25em;color:#8a7b68}',
    '#g .crp.dim{opacity:.35;transform:translateX(-50%) scale(.92)}#g .crp.spot{width:46%;z-index:2;box-shadow:0 0 0 .35em #F7E6A8,0 1.5em 4em rgba(0,0,0,.6)}',
    '#g .crp .ct span{opacity:0;animation:crl .05s forwards}@keyframes crl{to{opacity:1}}',
    /* projection du choix des clans */
    '#g .csp{position:fixed;inset:0;background:#0f0c0a;display:flex;align-items:center;justify-content:center;color:#F4ECDD}',
    '#g .csp-st{position:relative;width:min(100vw,177.8vh);aspect-ratio:16/9;background:url(/clans/chefs-wide.webp?v=1) center/cover;overflow:hidden;font-size:min(1vw,1.78vh)}',
    '#g .csp-st:before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(15,12,10,.88),rgba(15,12,10,.35) 22%,transparent 34%,transparent 50%,rgba(15,12,10,.92) 82%)}',
    '#g .csp-top{position:absolute;left:4em;top:3em;right:4em;display:flex;align-items:flex-end;gap:1.6em}#g .csp-sl{width:5.4em;height:5.4em;flex-shrink:0;background:#C8372D;color:#FBF3E6;border-radius:.5em;display:flex;align-items:center;justify-content:center;font:800 2.8em Mincho30,serif;width:1.93em;height:1.93em;border-radius:.18em}',
    '#g .csp-top h1{margin:0;font:800 5em/1 Mincho30,Georgia,serif;color:#F4ECDD}#g .csp-kk{font:700 1.2em Gothic30,sans-serif;letter-spacing:.22em;color:#f0a090;text-transform:uppercase;margin-bottom:.5em}',
    '#g .csp-pl{position:absolute;bottom:3em;width:27%;transform:translateX(-50%);background:rgba(244,236,221,.94);color:#1E1A17;border-radius:.4em;padding:1.2em 1.4em;border-top:.4em solid var(--c);transition:box-shadow .4s}#g .csp-pl.al{box-shadow:0 0 0 .3em #F7E6A8,0 0 3em rgba(247,230,168,.5)}',
    '#g .csp-pl h3{margin:0 0 .5em;font:800 2.1em Mincho30,Georgia,serif;display:flex;justify-content:space-between;align-items:baseline;gap:.4em}#g .csp-pl h3 small{font:900 .55em Gothic30,sans-serif;color:#6b5e52;white-space:nowrap}#g .csp-pl h3 small.f{color:#C8372D}',
    '#g .csp-nm{display:flex;flex-wrap:wrap;gap:.4em}#g .csp-nm span{font-weight:700;font-size:1.4em;border:.1em solid #cbbba3;border-radius:.25em;padding:.05em .5em}#g .csp-nm span.a{font-family:Mincho30,serif;font-weight:800;background:#1E1A17;color:#F7E6A8;border-color:#1E1A17}',
    '#g .csp-nm span.new{animation:cspin .6s cubic-bezier(.3,1.5,.5,1)}@keyframes cspin{0%{transform:scale(2);opacity:0}100%{transform:none;opacity:1}}#g .csp-nm i{font-style:normal;color:#8a7b68;font-weight:700;font-size:1.3em}',
    '#g .csp-lock{animation:pop .7s cubic-bezier(.3,1.5,.5,1) both}',
    /* animations */
    '@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes spin{to{transform:rotate(360deg)}}',
    '@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(244,198,211,.9),0 8px 0 #8f241d}50%{box-shadow:0 0 0 22px rgba(244,198,211,0),0 8px 0 #8f241d}}',
    '@keyframes roll{0%{transform:rotate(0) translateY(0)}25%{transform:rotate(90deg) translateY(-14px)}50%{transform:rotate(180deg)}75%{transform:rotate(270deg) translateY(-8px)}100%{transform:rotate(360deg)}}',
    '@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes hit{0%,100%{transform:translateX(0)}20%{transform:translateX(-12px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}',
    '@keyframes boom{0%{transform:scale(1);opacity:1;filter:none}30%{transform:scale(1.15) rotate(-6deg);filter:brightness(2)}100%{transform:scale(2.4) rotate(14deg);opacity:0;filter:brightness(3) blur(6px)}}',
    '@keyframes flash{0%{opacity:0}10%{opacity:1}100%{opacity:0}}@keyframes pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}',
    '@keyframes drop{0%{transform:translateY(-40vh) rotate(-12deg);opacity:0}70%{transform:translateY(8px) rotate(3deg);opacity:1}100%{transform:translateY(0) rotate(-4deg)}}',
    '@keyframes ishot{0%{opacity:0}18%{opacity:1}82%{opacity:1}100%{opacity:0}}@keyframes ikbA{from{transform:scale(1.16) translate(-1.5%,1%);filter:blur(6px)}25%{filter:blur(0)}to{transform:scale(1.02) translate(1%,-1%);filter:blur(0)}}@keyframes ikbB{from{transform:scale(1.02) translate(1.5%,0);filter:blur(6px)}25%{filter:blur(0)}to{transform:scale(1.16) translate(-1%,-1.5%);filter:blur(0)}}@keyframes icap{0%,15%{opacity:0;transform:translateY(2vh)}30%,80%{opacity:1;transform:none}100%{opacity:0}}@keyframes ishake{0%,100%{transform:none}20%{transform:translate(-1.2vw,.6vw)}40%{transform:translate(1vw,-.8vw)}60%{transform:translate(-.6vw,.4vw)}80%{transform:translate(.4vw,-.2vw)}}',
    '@keyframes rise{0%{transform:translateY(30px);opacity:0}100%{transform:none;opacity:1}}@keyframes fadein{from{opacity:0}to{opacity:1}}',
    '@keyframes upulse{from{transform:scale(1)}to{transform:scale(1.12)}}.urg{animation:upulse .5s ease-in-out infinite alternate;display:inline-block}#g.proj .urg{color:#fff;background:#C8372D!important}',
    '#g .scr{min-height:100%;background:#2b211a;padding:calc(10px + env(safe-area-inset-top)) 0 calc(10px + env(safe-area-inset-bottom));box-sizing:border-box;display:flex;flex-direction:column}',
    '#g .rod{margin:0 14px;height:12px;border-radius:6px;background:linear-gradient(#7a4a24,#4a2c14);flex-shrink:0}',
    '#g .paper{flex:1;margin:0 22px;background:linear-gradient(90deg,#d9c39a,#efe0bf 12%,#f3e7cc 50%,#efe0bf 88%,#d9c39a);padding:20px 16px;color:#2b1d12;font-family:Georgia,Mincho30,Georgia,serif;position:relative;display:flex;flex-direction:column;gap:12px}',
    '#g .sk{font:700 11px Gothic30,Nunito,Arial,sans-serif;letter-spacing:.22em;color:#8a5a2b;text-transform:uppercase}',
    '#g .scroll3{display:flex;gap:8px;justify-content:center;align-items:flex-start}',
    '#g .scl{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;border:0;background:none;padding:0;color:#2b1d12;font-family:Georgia,serif}',
    '#g .scl i{display:block;width:108%;height:10px;border-radius:5px;background:#4a2c14;flex-shrink:0}',
    '#g .scl b{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:14px 6px;text-align:center;font-weight:400;background:linear-gradient(90deg,#e9d6ad,#fbf3e1 50%,#e9d6ad);box-shadow:0 6px 12px rgba(0,0,0,.25);transition:min-height .35s ease}',
    '#g .stamp{border:4px solid #b5302a;color:#b5302a;border-radius:8px;display:flex;align-items:center;justify-content:center;transform:rotate(-7deg);font-family:serif}',
    '@keyframes conf{0%{transform:translateY(-12vh) rotate(0)}100%{transform:translateY(112vh) rotate(720deg)}}@keyframes kb{from{transform:scale(1)}to{transform:scale(1.1)}}@keyframes crown{0%{transform:translateY(-40vh) rotate(-25deg);opacity:0}70%{transform:translateY(1vw) rotate(5deg);opacity:1}100%{transform:none;opacity:1}}@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}',
    '@keyframes stampin{0%{transform:scale(2.4) rotate(-20deg);opacity:0}60%{transform:scale(.9) rotate(-5deg);opacity:1}100%{transform:scale(1) rotate(-7deg)}}',
    '@keyframes spinw{from{transform:rotate(0)}to{transform:rotate(var(--end))}}@keyframes fadeup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '.rolling{animation:roll .45s linear infinite}.boss{animation:sway 3s ease-in-out infinite;transform-origin:50% 80%}.boss.hit{animation:hit .5s ease-in-out}.boss.boom{animation:boom 1.6s ease-in forwards}',
    '@media (prefers-reduced-motion:reduce){#g *,.fig *{animation:none!important}}',
    /* projection */
    '#g.proj{overflow:hidden}#g .pw{position:absolute;inset:0;padding:3.2vw 4vw;box-sizing:border-box;display:flex;flex-direction:column;gap:2.4vw}',
    '#g .pt{font-family:Mincho30,Georgia,serif;font-weight:800;font-size:5.4vw;line-height:1;margin:0}#g .pk{font-size:1.2vw;font-weight:700;letter-spacing:.22em;color:#C8372D;text-transform:uppercase}#g.dark .pk{color:#e6b8a0}#g .pseal{width:5.6vw;height:5.6vw;flex-shrink:0;background:#C8372D;color:#F4ECDD;font-family:Mincho30,serif;font-weight:800;font-size:2.8vw;display:flex;align-items:center;justify-content:center;border-radius:.5vw;transform:rotate(-4deg);box-shadow:0 .3vw .8vw rgba(120,30,20,.25)}#g .pvk{position:absolute;right:2vw;top:3vw;writing-mode:vertical-rl;font-family:Mincho30,serif;font-weight:800;color:#C8372D;letter-spacing:.2em;font-size:2vw;line-height:1;opacity:.9}#g .pbrush{height:.8vw;width:100%;background:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 12%27 preserveAspectRatio=%27none%27%3E%3Cpath d=%27M2 7 C40 2 90 4 140 6 S190 8 198 4%27 stroke=%27%231E1A17%27 stroke-width=%275%27 fill=%27none%27 stroke-linecap=%27round%27/%3E%3C/svg%3E") no-repeat center/100% 100%;opacity:.45;margin-top:.4vw}',
    '#g .pclock{background:#1E1A17;color:#F4ECDD;border-radius:.6vw;padding:.6vw 2.4vw;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:5vw;line-height:1}',
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- helpers ---------- */
  var st = null, mode = null, root = null, pollT = null, tickT = null, off = 0, busy = false, lastHtml = '';
  var pl = { jkOpen: false, csK: null, csGo: false, csChange: false, csAt: 0, csBusy: false, rate: 0, rateAt: 0, seq: null, seqAt: 0, vote: null, voteAt: 0, taps: 0, tapSent: 0, p2: null, joined: '' };
  var mj = { sel: null, resetArm: false, upl: 0 };
  var photoUrls = {};

  function now() { return Date.now() + off; }
  function demo() { return A.sess.get(A.KX) === '1'; }
  function myName() { return pl.forceName || A.me() || (demo() ? 'Théo' : ''); }
  function isPlayer() { return mode === 'jeu' || mode === 'final'; }
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
    var c = clan ? CK[clan] : null, ink = c ? c.ink : '#1E1A17', band = c ? c.bg : '#F4C6D3', skin = '#FDE7DA', P = (POSES[k] || { p: [N] }).p[0];
    var g = function (i, inner) { return '<g class="j-' + J[i][0] + '" style="transform:' + jt(i, P[i]) + '">' + inner + '</g>'; };
    var seg = function (L, w) { return '<line x1="0" y1="0" x2="0" y2="' + L + '" stroke-width="' + w + '"/>'; };
    var hand = '<circle cx="0" cy="11" r="4.6" fill="' + skin + '" stroke="' + ink + '" stroke-width="2"/>';
    var arm = function (a, f) { return g(a, seg(11, 6) + g(f, seg(10, 6) + hand)); };
    var leg = function (a, f) { return g(a, seg(11, 7) + g(f, seg(11, 7) + '<circle cx="0" cy="11" r="4" fill="' + ink + '" stroke="none"/>')); };
    var head = '<g transform="translate(0,-31)"><circle r="13" fill="' + skin + '" stroke="' + ink + '" stroke-width="2.5"/><path d="M-12.6 -4 H12.6" stroke="' + band + '" stroke-width="6"/>' +
      '<rect x="-5" y="-7" width="10" height="6" rx="1.5" fill="#B9BDC8" stroke="' + ink + '" stroke-width="1"/><path d="M12 -5 l6 -3 M12 -3 l6 2" stroke="' + band + '" stroke-width="2.4"/>' +
      '<circle cx="-4.5" cy="3" r="1.6" fill="' + ink + '" stroke="none"/><circle cx="4.5" cy="3" r="1.6" fill="' + ink + '" stroke="none"/><path d="M-3 7.5 q3 2.5 6 0" stroke-width="1.4"/></g>';
    var bubble = noBubble ? '' : '<g><circle cx="51" cy="13" r="15" fill="#fff" stroke="#e6d9c2" stroke-width="1.4"/><image href="/vendor/em/' + k + '.png" x="39.5" y="1.5" width="23" height="23"/></g>';
    return '<svg class="fig mv-' + k + '" width="' + size + '" height="' + Math.round(size * 1.4) + '" viewBox="0 0 60 84" fill="none" stroke="' + ink + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;overflow:visible">' +
      g(0, leg(6, 7) + leg(8, 9) + g(1, seg(-17, 9) + ((POSES[k] || {}).back ? arm(2, 3) + arm(4, 5) + head : head + arm(2, 3) + arm(4, 5)))) + bubble + '</svg>';
  }
  var GAGE_SHORT = ['Drama coréen', 'Dattebayo', 'Selfie grimace', 'Sur une jambe'];
  function emo(s) { return esc(s).replace(/🫰/g, '<img src="/vendor/em/heart.png" alt="" style="height:1.1em;vertical-align:-.2em">'); }
  function d20svg(n, size, roll) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" style="' + (roll ? 'animation:roll .4s linear ' + roll + ';' : '') + 'filter:drop-shadow(0 4px 8px rgba(43,29,18,.25))"><polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="#f8efdc" stroke="#2b1d12" stroke-width="3"/><polygon points="50,22 76,64 24,64" fill="none" stroke="#2b1d12" stroke-width="1.8" opacity=".8"/><path d="M50 4 50 22 M92 28 76 64 M92 72 76 64 M50 96 76 64 M50 96 24 64 M8 72 24 64 M8 28 24 64 M8 28 50 22 M92 28 50 22" stroke="#2b1d12" stroke-width="1.3" opacity=".5"/><text x="50" y="57" text-anchor="middle" font-family="Georgia,serif" font-size="21" font-weight="700" fill="#2b1d12">' + n + '</text></svg>';
  }
  // Étiquette d'un choix du Destin : profil, dé à 20 faces (barré pour le choix assuré), minimum à atteindre.
  function d20ico(col, size, crossed) {
    return '<svg viewBox="0 0 100 100" style="width:' + size + ';height:' + size + ';display:block"><polygon points="50,6 90,29 90,71 50,94 10,71 10,29" fill="rgba(255,255,255,.55)" stroke="' + col + '" stroke-width="6"/><polygon points="50,25 74,63 26,63" fill="none" stroke="' + col + '" stroke-width="4"/><path d="M50 6 50 25 M90 29 74 63 M50 94 74 63 M50 94 26 63 M10 29 26 63 M10 29 50 25 M90 29 50 25" stroke="' + col + '" stroke-width="3" opacity=".6"/>' + (crossed ? '<line x1="10" y1="90" x2="90" y2="10" stroke="#b5302a" stroke-width="9" stroke-linecap="round"/>' : '') + '</svg>';
  }
  function dTag(i, col, fs, ico) {
    return '<span style="display:flex;flex-direction:column;align-items:center;gap:.35em;font-size:' + fs + '"><span class="sk" style="font-size:1em;letter-spacing:.06em;color:' + col + '">' + ['Prudent', 'Audacieux', 'Fou'][i] + '</span>' + d20ico(col, ico, i === 0) + (i ? '<span class="sk" style="font-size:1em;letter-spacing:.04em;color:' + col + '">Minimum ' + [0, 10, 15][i] + '</span>' : '') + '</span>';
  }
  function sgn(m) { return (m > 0 ? '+' : '−') + Math.abs(m); }
  function calcTxt(r) { if (r.roll === null || !r.mods || !r.mods.length) return ''; return r.roll + r.mods.map(function (x) { return ' ' + (x.m > 0 ? '+' : '−') + ' ' + Math.abs(x.m) + ' (' + x.why + ')'; }).join('') + ' = ' + r.total; }
  function ctxLines(cx, fs) { if (!cx || !cx.lines.length) return ''; return '<div style="border-left:3px solid #8a5a2b;padding:2px 0 2px 10px;display:flex;flex-direction:column;gap:3px">' + cx.lines.map(function (l) { return '<div style="font-style:italic;font-size:' + fs + ';line-height:1.4">' + esc(l.t) + (l.m ? ' <b style="font:800 .85em Gothic30,Nunito,Arial,sans-serif;font-style:normal;white-space:nowrap;color:' + (l.m > 0 ? '#2f6b45' : '#b5302a') + '">' + sgn(l.m) + ' au dé</b>' : '') + '</div>'; }).join('') + '</div>'; }
  function rollSpec(at) { var el = (now() - at) / 1000; var left = 1.6 - el; return left > 0 ? Math.max(1, Math.round(left / 0.4)) + '' : ''; }
  function wheelSvg(idx, size, startIn) {
    var cols = ['#F4C6D3', '#F7E6A8', '#BFE3D4', '#e6d9c2'], seg = '';
    for (var i = 0; i < 4; i++) {
      var a0 = (i * 90 - 90) * Math.PI / 180, a1 = ((i + 1) * 90 - 90) * Math.PI / 180, am = ((i + 0.5) * 90 - 90) * Math.PI / 180;
      seg += '<path d="M50 50 L' + (50 + 46 * Math.cos(a0)).toFixed(2) + ' ' + (50 + 46 * Math.sin(a0)).toFixed(2) + ' A46 46 0 0 1 ' + (50 + 46 * Math.cos(a1)).toFixed(2) + ' ' + (50 + 46 * Math.sin(a1)).toFixed(2) + ' Z" fill="' + cols[i] + '" stroke="#2b1d12" stroke-width="1.2"/>' +
        '<text x="' + (50 + 28 * Math.cos(am)).toFixed(2) + '" y="' + (50 + 28 * Math.sin(am)).toFixed(2) + '" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif" font-size="6.2" font-weight="700" fill="#2b1d12" transform="rotate(' + ((i + 0.5) * 90) + ' ' + (50 + 28 * Math.cos(am)).toFixed(2) + ' ' + (50 + 28 * Math.sin(am)).toFixed(2) + ')">' + GAGE_SHORT[i] + '</text>';
    }
    var end = 360 * 6 - (idx * 90 + 45);
    return '<div style="position:relative;width:' + size + ';aspect-ratio:1"><svg viewBox="0 0 100 100" style="width:100%;height:100%;--end:' + end + 'deg;animation:spinw 4s cubic-bezier(.12,.75,.2,1) ' + startIn.toFixed(2) + 's both"><circle cx="50" cy="50" r="48" fill="#4a2c14"/>' + seg + '<circle cx="50" cy="50" r="6" fill="#b5302a" stroke="#2b1d12" stroke-width="1.5"/></svg><svg viewBox="0 0 20 20" style="position:absolute;top:-4%;left:50%;width:9%;transform:translateX(-50%)"><path d="M2 2 H18 L10 18 Z" fill="#b5302a" stroke="#2b1d12" stroke-width="1.5"/></svg></div>';
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
  // Illustration de Sanjûbi (fond transparent) pour l'écran de projection ; préchargée pour ne pas apparaître en retard.
  var SANJ = '/sanjubi.webp?v=1', sanjPre = null;
  function bossImg(cls) {
    if (!sanjPre) { sanjPre = new Image(); sanjPre.src = SANJ; }
    return '<img class="' + cls + '" src="' + SANJ + '" alt="Sanjûbi, le démon à 30 queues" style="width:100%;height:auto;max-height:56vh;object-fit:contain;filter:drop-shadow(0 0 2.2vw rgba(255,150,50,.35))">';
  }
  function bossSvg(cls, w) {
    return '<svg class="' + cls + '" width="' + w + '" viewBox="0 0 380 330" fill="none" aria-hidden="true" style="max-width:100%;height:auto">' +
      '<g stroke="#C8372D" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M190 210 C 120 160, 60 150, 20 90"/><path d="M190 210 C 130 140, 90 100, 70 30"/><path d="M190 210 C 160 130, 150 70, 140 10"/><path d="M190 210 C 200 130, 215 70, 230 10"/><path d="M190 210 C 240 140, 290 100, 310 30"/><path d="M190 210 C 260 160, 320 150, 360 90"/></g>' +
      '<g stroke="#F4C6D3" stroke-width="3" stroke-linecap="round" opacity=".55"><path d="M190 210 C 100 180, 50 190, 8 150"/><path d="M190 210 C 110 120, 110 60, 100 18"/><path d="M190 210 C 270 120, 270 60, 280 18"/><path d="M190 210 C 280 180, 330 190, 372 150"/></g>' +
      '<ellipse cx="190" cy="235" rx="110" ry="88" fill="#251F36" stroke="#C8372D" stroke-width="5"/><path d="M118 178 L 98 128 L 150 160 Z M262 178 L 282 128 L 230 160 Z" fill="#251F36" stroke="#C8372D" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M145 225 q 18 -16 36 0" stroke="#F7E6A8" stroke-width="7" stroke-linecap="round"/><path d="M199 225 q 18 -16 36 0" stroke="#F7E6A8" stroke-width="7" stroke-linecap="round"/><path d="M160 270 q 30 18 60 0" stroke="#F4C6D3" stroke-width="5" stroke-linecap="round"/></svg>';
  }
  // Dé 3D laqué (public/dice.js) : un canvas carré, animé d'après l'heure du serveur « at » (0 = déjà posé).
  function d3(v, size, at, key) { return '<canvas class="d3" data-v="' + v + '" data-at="' + (at || 0) + '" data-k="' + esc(key || '') + '" style="width:' + size + ';height:' + size + ';display:block;flex-shrink:0" role="img" aria-label="Dé : ' + v + '"></canvas>'; }
  var D3MS = 1500;
  function d3Frame() {
    if (window.Dice3D) document.querySelectorAll('canvas.d3').forEach(function (el) {
      if (el._still) return;
      var r = el.getBoundingClientRect(); if (!r.width) return;
      if (!el._roll) {
        var d = Math.min(window.devicePixelRatio || 1, 2.5), v = +el.getAttribute('data-v'), at = +el.getAttribute('data-at'), k = el.getAttribute('data-k');
        el.width = Math.round(r.width * d); el.height = Math.round(r.height * d); el._d = d; el._w = r.width;
        var R = Dice3D.seeded(v + ':' + at + ':' + k), s = r.width * 0.3;
        el._roll = new Dice3D.Roll({ val: v, t0: at ? at + 100 : -1e9, dur: D3MS, from: [r.width * (0.3 + R() * 0.4), -s * 1.4], to: [r.width / 2, r.height * 0.56], size: s, h: s * 1.7, rand: R });
      }
      var T = now(), c = el.getContext('2d'); c.setTransform(el._d, 0, 0, el._d, 0, 0); c.clearRect(0, 0, el._w, el._w);
      var st = Dice3D.render(c, el._roll, T, { rays: 1.9 });
      if (st.done && st.land > 900 && el._roll.val !== 20) el._still = true;
    });
    requestAnimationFrame(d3Frame);
  }
  requestAnimationFrame(d3Frame);
  function d20s(x, size, rolling) { // petit d20 lisible pour les listes de dés (Boss)
    return '<svg viewBox="0 0 100 100" style="width:' + size + ';height:' + size + ';' + (rolling ? 'animation:roll .4s linear 4;' : '') + 'filter:drop-shadow(0 2px 3px rgba(43,29,18,.25))"><polygon points="50,3 94,27 94,73 50,97 6,73 6,27" fill="#f8efdc" stroke="#2b1d12" stroke-width="5"/><path d="M50 3 50 16 M94 27 82 33 M94 73 82 67 M50 97 50 84 M6 73 18 67 M6 27 18 33" stroke="#2b1d12" stroke-width="3" opacity=".45"/><text x="50" y="66" text-anchor="middle" font-family="Georgia,serif" font-size="' + (String(x).length > 1 ? 44 : 50) + '" font-weight="700" fill="#2b1d12">' + (rolling ? '?' : x) + '</text></svg>';
  }
  function orb(size, speed) {
    return '<div style="width:' + size + ';height:' + size + ';border-radius:50%;background:radial-gradient(circle at 40% 38%,#fff 0%,#CFE9FF 22%,#7FB6F0 52%,#5B4B8A 100%);box-shadow:0 0 6vw rgba(127,182,240,.6);display:flex;align-items:center;justify-content:center;transition:width .9s ease-out,height .9s ease-out"><svg viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round" style="width:78%;height:78%;animation:spin ' + speed + ' linear infinite"><path d="M50 14a36 36 0 0 1 36 36"/><path d="M86 50a36 36 0 0 1-36 36"/><path d="M50 86a36 36 0 0 1-36-36"/><path d="M14 50a36 36 0 0 1 36-36"/><path d="M50 28a22 22 0 0 1 22 22"/><path d="M50 72a22 22 0 0 1-22-22"/></svg></div>';
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
    pl.forceName = r === 'final' ? 'Alessia' : '';
    loadFx(); lastHtml = ''; draw();
    if (r === 'final') req('/api/game/act', { method: 'POST', body: { type: 'finTest' }, auth: true }).then(poll).catch(function (er) { A.toast(A.errMsg(er)); }); else poll();
    clearInterval(pollT); pollT = setInterval(function () { if (!document.hidden) poll(); }, r === 'ecran' ? 1000 : 1500);
    clearInterval(tickT); tickT = setInterval(tick, 250);
  }
  function hide() {
    mode = null; pl.forceName = ''; if (pl.qte) { pl.qte.destroy(); pl.qte = null; } if (arena) { arena.destroy(); arena = null; } clearInterval(pollT); clearInterval(tickT); musicKey = ''; var mb = document.getElementById('gmusic'); if (mb) mb.remove();
    if (root) { root.remove(); root = null; }
  }
  function poll() {
    if (busy || !mode) return;
    busy = true;
    var p = isPlayer() ? req('/api/game?me=' + encodeURIComponent(myName())) : req('/api/game/full', { auth: true });
    p.then(function (s) { busy = false; setState(s); })
      .catch(function (er) { busy = false; if (er && er.status === 401) { A.go('orga-acces'); } });
  }
  function setState(s) {
    if (!s || !mode) return;
    if (s.now) off = s.now - Date.now();
    st = s;
    if (isPlayer() && s.on && myName() && pl.joined !== myName()) {
      pl.joined = myName();
      req('/api/game/join', { method: 'POST', body: { name: myName() } }).then(poll).catch(function () { pl.joined = ''; });
    }
    // flash blanc synchronisé sur tous les téléphones à l'impact du coup final
    var fb = isPlayer() && s.step === 5 && s.boss && s.boss.fin;
    if (fb && fb.launchAt && pl.flashKey !== fb.launchAt) { pl.flashKey = fb.launchAt; var wait = fb.launchAt + 900 - now(); if (wait > 0) setTimeout(function () { lastHtml = ''; draw(); }, wait + 15); }
    draw();
    syncArena();
  }
  function draw() {
    if (!root || !mode) return;
    if (mode === 'ecran' && revealing() && root.getAttribute('data-reveal') === String(st.ouv.drawAt)) return;
    if (mode === 'ecran' && st && st.step === 4 && st.destin && st.destin.stage === 'reveal' && st.destin.shownAt && now() - st.destin.shownAt < 7200 && root.getAttribute('data-dfreeze') === String(st.destin.shownAt + ':' + st.destin.shown)) return;
    if (mode === 'ecran' && introOn() && root.getAttribute('data-intro') === String(st.boss.intro)) return;
    var r = build();
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
    if (mode === 'ecran') { fxHook(); syncArena(); }
  }
  // Après une animation faite directement dans le DOM : mémorise le rendu équivalent pour ne pas tout redessiner.
  function syncHtml() { lastHtml = build().html; }
  function build() {
    var r = isPlayer() ? vPlayer() : mode === 'mj' ? vMJ() : vProj();
    if (demo()) r.html += '<div class="gdemo" style="position:fixed;top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:10px;background:#1E1A17;color:#fff;border-radius:999px;padding:6px 8px 6px 14px;font:800 12px Gothic30,Nunito,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);white-space:nowrap">' +
      '<span style="color:#F7E6A8;letter-spacing:.08em">DÉMO</span>' + [['mj', 'Console'], ['jeu', 'Joueur'], ['ecran', 'Écran']].map(function (x) { return '<a href="#' + x[0] + '" style="color:' + (mode === x[0] ? '#F7E6A8' : '#fff') + ';text-decoration:none">' + x[1] + '</a>'; }).join('') +
      '<button data-g="demoquit" style="border:0;background:#fff;color:#1E1A17;border-radius:999px;height:26px;padding:0 10px;font:800 12px Gothic30,Nunito,sans-serif">Quitter</button></div>';
    return r;
  }
  function tick() {
    if (!root) return;
    var t = now();
    root.querySelectorAll('[data-cd]').forEach(function (e) { var rem = +e.getAttribute('data-cd') - t; e.textContent = mmss(rem); if (e.hasAttribute('data-urg')) e.classList.toggle('urg', rem <= 10000 && rem > 0); });
    root.querySelectorAll('[data-pie]').forEach(function (e) { var f = Math.max(0, Math.min(1, (+e.getAttribute('data-pie') - t) / +e.getAttribute('data-dur'))); e.style.strokeDashoffset = (150.8 * (1 - f)).toFixed(2); });
    root.querySelectorAll('[data-cdbar]').forEach(function (e) { e.style.width = Math.max(0, Math.min(100, (+e.getAttribute('data-cdbar') - t) / +e.getAttribute('data-dur') * 100)) + '%'; });
    // ré-affichages liés au temps (dés, fin de chrono, rasengan, diaporama)
    if (st && (needsTimeRedraw(t))) { lastHtml = ''; draw(); }
    if (isPlayer()) { flushTaps(); finTick(); }
  }
  var lastPhase = '';
  function needsTimeRedraw(t) {
    var ph = '';
    if (st.step === 3 && st.ombre) { var end = st.ombre.cur ? st.ombre.cur.end : st.ombre.end; ph += 'o' + (end && t > end ? 1 : 0) + (st.ombre.startAt && t > st.ombre.startAt + 600000 ? 'f' : ''); }
    if (st.step === 5 && st.boss && st.boss.intro) ph += 'i' + (introOn() ? 1 : 0);
    if (st.step === 7 && st.echo) ph += 'e' + (st.echo.start ? (t > st.echo.end ? 2 : 1) : 0);
    if (st.step === 4 && st.destin) ph += 'd' + (st.destin.shownAt && t - st.destin.shownAt < 7200 ? 1 : 0) + (st.destin.voteEnd && t > st.destin.voteEnd ? 'v' : '');
    if (st.step === 5 && st.boss && mode !== 'ecran') {
      var b = st.boss, p2 = b.p2;
      ph += 'b' + (b.p1 && b.p1.at && t - b.p1.at < 1600 ? 1 : 0) + (p2 ? (t < p2.start ? 'w' : t < p2.end ? 'r' : 'e') : '') + (b.dead && b.deadAt && t - b.deadAt < 2600 ? 'x' : '');
    }
    if (st.step === 0) ph += 'L' + (lockMoment() ? 1 : 0) + (st.ouv && st.ouv.spotAt && t - st.ouv.spotAt < 6000 ? 's' : '');
    if (st.step === 5 && st.boss && mode !== 'ecran') {
      var bp = st.boss.p1, bf = st.boss.fin;
      if (bp && bp.sums && window.Finale) { var t1 = t - bp.at, wi = Math.floor(t1 / Finale.CLMS), wt = t1 - wi * Finale.CLMS; ph += 'w' + (t1 < 0 || wi > 2 ? 'x' : wi + (wt < 1700 ? 'a' : wt < 2600 ? 'b' : wt < 4300 ? 'c' : 'd')); }
      if (bf) ph += 'F' + (bf.launchAt ? (t >= bf.launchAt + 900 ? 2 : 1) : 0);
    }
    if (st.timer) ph += 't' + (t > st.timer.end ? 1 : 0);
    if (st.step === 6 && st.hokage && st.hokage.view === 'slides') ph += 'h' + hokCur();
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
    if (bri() !== null) return pBrief(myClan());
    if (st.step === 0 && st.sel && st.sel.mode === 'pick' && st.sel.phase !== 'locked') return pSel();
    var c = myClan();
    if (c && lockMoment()) return pLock(c);
    if (!c) return wrap('<h1>Salut ' + esc(myName()) + ' !</h1><section class="card" style="align-items:center;text-align:center;padding:26px 16px"><div class="ser" style="font-size:22px">Le maître du jeu forme les clans</div><div class="muted">Ton clan apparaîtra ici dans un instant.</div></section>');
    var s = st.step;
    if (s === 3) return pOmbre(c);
    if (s === 7) return pEcho(c);
    if (s === 4) return pDestin(c);
    if (s === 5 && st.boss && st.boss.fin) return pFinal(c);
    if (s === 5) { var p2 = st.boss && st.boss.p2; if (p2 && !p2.done && now() < p2.end + 800) return pRasengan(c, p2); return pBoss(c); }
    var head = '<div class="hd"><div><div class="kk">' + esc(KK[s] || '') + '</div><h1>' + esc(STEPN[s]) + '</h1></div><div class="vk">' + (VK[s] || '') + '</div></div>' + banner(c, 91, 'vw', { max: 396, style: 'margin:-2px auto 2px' });
    if (jk(c.k) === 'on' && jokerOk(s)) head += '<div class="card" style="flex-direction:row;align-items:center;gap:10px;background:#1E1A17;color:#fff;border-color:#1E1A17;padding:10px 14px"><span class="ser" style="background:#F7E6A8;color:#1E1A17;border-radius:10px;padding:4px 10px">x2</span><span style="font-weight:800">Joker activé : vos points comptent double</span></div>';
    else if (jk(c.k) === 'free' && jokerOk(s)) head += '<div class="muted" style="font-size:13px">Joker x2 encore disponible : annoncez-le avant l’épreuve.</div>';
    if (st.timer && now() < st.timer.end + 1000) head += '<div class="row" style="gap:10px">' + cdBar(st.timer.end, st.timer.dur * 1000) + cd(st.timer.end, 'ser', 'font-size:20px;min-width:52px;text-align:right') + '</div>';
    var body = s === 0 ? pClan(c) : s === 1 ? pRythme(c) : s === 2 ? pSavoir() : s === 4 ? pDestin(c) : pHokage();
    return wrap(head + body);
  }
  // Annonce de l'épreuve suivante : son nom, et le joueur écoute le MJ expliquer les règles.
  function pBrief(c) {
    var i = bri(), j = c ? jk(c.k) : '';
    var jkl = c && jokerOk(i) ? (j === 'on' ? '<div class="card" style="flex-direction:row;align-items:center;gap:10px;background:#1E1A17;color:#fff;border-color:#1E1A17;padding:10px 14px"><span class="ser" style="background:#F7E6A8;color:#1E1A17;border-radius:10px;padding:4px 10px">x2</span><span style="font-weight:800">Joker activé sur cette épreuve</span></div>' : j === 'free' ? '<div class="muted" style="font-size:13px;text-align:center">Joker x2 encore disponible : c’est le moment de l’annoncer au maître du jeu.</div>' : '') : '';
    return wrap((c ? banner(c, 91, 'vw', { max: 396, style: 'margin:0 auto' }) : '') + '<div class="br"><div class="kk">' + esc(KK[i] || '') + '</div><div class="br-sl">' + (SEAL[i] || '') + '</div><h1>' + esc(STEPN[i]) + '</h1><div class="br-li"><span class="cs-dot"></span>Écoutez le maître du jeu…</div></div>' + jkl);
  }
  /* ---------- choix des clans (téléphone) ---------- */
  function pSel() {
    var S = st.sel, me = myName().trim().toLowerCase(), isA = me === 'alessia';
    if (!(S.phase === 'open' || (S.phase === 'alessia' && isA))) return csWait(S);
    if (st.clan && !pl.csChange) return csDone(st.clan, S, me);
    return csPick(S, isA);
  }
  function csScreen(inner) { return { html: '<div class="cs">' + inner + '</div>', cls: 'dark' }; }
  function csWait(S) {
    var a = S.alessia, t, sub;
    if (S.phase === 'alessia') { t = a ? 'Alessia a rejoint le ' + clanName(a) + ' !' : 'Alessia choisit son clan en premier…'; sub = a ? 'Le choix va bientôt s’ouvrir à toi.' : 'Patience, ninja : ton tour arrive juste après.'; }
    else { t = 'Le maître du jeu va ouvrir le choix des clans.'; sub = 'Garde cette page ouverte, elle se mettra à jour toute seule.'; }
    return csScreen('<div class="cs-splash" style="background-image:url(/clans/chefs.webp?v=1)"><div class="kk">始まり · La Quête des 30 ans</div><h1 class="ser">Trois chefs.<br>Un seul clan.</h1><p style="font-size:18px;color:#F4ECDD">' + (a ? '' : '<span class="cs-dot"></span>') + esc(t) + '</p><p>' + esc(sub) + '</p></div>');
  }
  // Texte du chef posé sur son illustration (variante B), visible quand sa colonne est sélectionnée.
  function csInfo(k, S) {
    var n = S.count[k] || 0, mine = st.clan === k, full = n >= S.cap && !mine, m = (st.members && st.members[k]) || [], nm = clanName(k);
    return '<div class="cs-info" data-g="csnop"><div class="kk">' + CHEF[k].s + ' · ' + n + ' / ' + S.cap + ' ninjas</div><h2>' + esc(nm) + '</h2><p>' + esc(CHEF[k].p) + '</p>' +
      '<div class="cs-ml">' + (m.length ? m.map(esc).join(' · ') : 'Personne pour l’instant') + '</div>' +
      '<button class="btn" style="width:100%" data-g="cspick" data-k="' + k + '"' + (full || pl.csBusy ? ' disabled' : '') + '>' + (mine ? 'Rester dans ce clan' : full ? 'Clan complet' : 'Rejoindre ce clan') + '</button></div>';
  }
  function csPick(S, isA) {
    var k = pl.csK;
    var cols = CS_ORDER.map(function (x) {
      var n = S.count[x] || 0, full = n >= S.cap && st.clan !== x;
      return '<div class="cs-col' + (k === x ? ' on' : '') + '" role="button" tabindex="0" data-g="cssel" data-k="' + x + '" style="--c:' + CHEF[x].c + '" aria-label="' + esc(clanName(x)) + '"><img src="/clans/chef-' + x + '.webp?v=1" alt=""><span class="cs-fl"></span><span class="cs-cnt">' + n + ' / ' + S.cap + '</span>' + (full ? '<span class="cs-full">COMPLET</span>' : '') + '<span class="cs-seal">' + CHEF[x].s + '</span>' + csInfo(x, S) + '</div>';
    }).join('');
    var splash = pl.csGo || st.clan ? '' : '<div class="cs-splash" style="background-image:url(/clans/chefs.webp?v=1)"><div class="kk">始まり · La Quête des 30 ans</div><h1 class="ser">Trois chefs.<br>Un seul clan.</h1><p>' + (isA ? 'Tu choisis en premier, future Hokage. Lequel suivras-tu ?' : 'Chaque chef cherche ses ninjas. Lequel suivras-tu ?') + '</p><button class="btn" data-g="csgo">Choisir mon clan</button></div>';
    return csScreen('<div class="cs-cols' + (k ? ' has' : '') + '">' + cols + '</div><div class="cs-top"><div class="kk">選択 · Le choix du clan</div><div class="cs-t">' + (st.clan ? 'Changer de clan' : 'Choisis ton clan') + '</div></div>' +
      splash);
  }
  function csDone(k, S, me) {
    var m = ((st.members && st.members[k]) || []).filter(function (x) { return x.toLowerCase() !== me; });
    return csScreen('<div class="cs-done" style="background-image:url(/clans/chef-' + k + '.webp?v=1)"><div class="cs-stamp' + (Date.now() - pl.csAt < 4000 ? ' anim' : '') + '">選</div><h2>Bienvenue dans le ' + esc(clanName(k)) + '</h2>' +
      '<p>' + (m.length ? 'Avec ' + m.map(esc).join(', ') + '.' : 'Personne d’autre pour l’instant : ton clan va vite se remplir.') + '</p>' +
      '<p style="font-size:14px;color:#bdae95">' + (S.phase === 'alessia' ? 'Les autres ninjas choisiront juste après toi.' : 'Le maître du jeu verrouillera bientôt les clans.') + '</p><button class="btn2" data-g="cschange">Changer de clan</button></div>');
  }
  function csSelect(k) {
    pl.csK = pl.csK === k ? null : k;
    var cols = root.querySelector('.cs-cols');
    if (!cols) { lastHtml = ''; draw(); return; }
    cols.classList.toggle('has', !!pl.csK);
    cols.querySelectorAll('.cs-col').forEach(function (b) {
      var on = b.getAttribute('data-k') === pl.csK; b.classList.toggle('on', on);
      if (on) { b.classList.remove('fx'); void b.offsetWidth; b.classList.add('fx'); }
    });
    syncHtml();
  }
  // Carte de ninja : portrait du chef, nom du clan, coéquipiers (le joueur en noir).
  function pClan(c) {
    var me = myName().trim().toLowerCase();
    return '<section class="nj" style="--c:' + CHEF[c.k].c + '"><div class="nj-img" style="background-image:url(/clans/chef-' + c.k + '.webp?v=1)"><span class="nj-sl">' + CHEF[c.k].s + '</span><div class="nj-t"><div class="lab">Tu es dans le</div><div class="ser">' + esc(clanName(c.k)) + '</div></div></div>' +
      '<div class="nj-m">' + st.members[c.k].map(function (x) { return '<span' + (x.toLowerCase() === me ? ' class="me"' : '') + '>' + esc(x) + '</span>'; }).join('') + '</div></section>' +
      jokerCard(c) + pCri(c);
  }
  // 3 s plein écran quand le MJ verrouille les clans.
  function lockMoment() { var S = st.sel; return !!(st.step === 0 && S && S.mode === 'pick' && S.phase === 'locked' && S.lockAt && now() - S.lockAt < 3500); }
  function pLock(c) {
    return { html: '<div class="lk" style="--c:' + CHEF[c.k].c + ';background-image:url(/clans/chef-' + c.k + '.webp?v=1)"><div class="lk-st">結</div><h1>Les clans sont formés !</h1><p>Tu es dans le ' + esc(clanName(c.k)) + '</p></div>', cls: 'dark' };
  }
  function jokerCard(c) {
    var s = jk(c.k), j = st.joker[c.k];
    if (st.step === 0 && s === 'free') return '<button class="jk" data-g="jkinfo" aria-expanded="' + (pl.jkOpen ? 'true' : 'false') + '"><b class="x" style="background:' + c.bg + ';color:' + c.ink + '">x2</b><span style="display:flex;flex-direction:column;gap:2px"><span class="ser" style="font-size:16px">Votre joker x2 <span style="font:700 12px Gothic30,sans-serif;color:#8a7b68">' + (pl.jkOpen ? '▴' : 'ⓘ') + '</span></span><span style="font-size:13px;font-weight:700;color:#6b5e52">' + (pl.jkOpen ? esc(JOKER_TXT) : 'Une fois dans la partie : points ×2 sur l’épreuve de votre choix.') + '</span></span></button>';
    return '<section class="card" style="flex-direction:row;align-items:center;gap:14px;' + (s === 'on' ? 'background:#1E1A17;color:#fff;border-color:#1E1A17' : s === 'used' ? 'opacity:.55' : '') + '">' +
      '<div class="ser" style="width:56px;height:56px;border-radius:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;' + (s === 'on' ? 'background:#F7E6A8;color:#1E1A17;animation:breathe 1.2s ease-in-out infinite' : 'background:' + c.bg + ';color:' + c.ink) + '">x2</div>' +
      '<div style="display:flex;flex-direction:column;gap:3px"><div class="ser" style="font-size:18px">' + (s === 'on' ? 'Joker x2 activé !' : s === 'used' ? 'Joker utilisé · ' + esc(STEPS_S[j.step]) : 'Votre joker x2') + '</div>' +
      '<div style="font-size:13px;font-weight:700;' + (s === 'on' ? 'color:#e6d9c2' : 'color:#6b5e52') + '">' + (s === 'on' ? 'Vos points comptent double sur cette épreuve' : s === 'used' ? 'Il a déjà servi' : JOKER_TXT) + '</div></div></section>';
  }
  function pCri(c) {
    var cur = st.ouv ? st.ouv.cri : '', by = st.ouv ? st.ouv.criBy : '';
    return '<section class="card"><label class="lab" for="g-cri">Cri de guerre du clan</label>' + (cur ? '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:30px;line-height:1.1;color:' + c.ink + '">« ' + esc(cur) + ' »</div>' + (by ? '<div class="muted" style="font-size:13px;margin-top:-4px">écrit par ' + esc(by) + '</div>' : '') : '<div class="muted">Inventez votre cri, un seul par clan : il s’affichera en grand sur l’écran.</div>') +
      '<div class="row"><input id="g-cri" maxlength="60" placeholder="' + (cur ? 'Modifier le cri' : 'Votre cri') + '" aria-label="Cri de guerre"><button class="chip on" style="height:44px" data-g="cri">Valider</button></div>' +
      (cur ? '' : '<div class="lab" style="margin-top:2px">Besoin d’idées ? Touchez pour remplir</div><div class="idea">' + CRI_IDEAS[c.k].map(function (t, i) { return '<button data-g="criidea" data-i="' + i + '">' + esc(t) + '</button>'; }).join('') + '</div>') + '</section>';
  }
  function curSeq() { return pl.seq && Date.now() - pl.seqAt < 5000 ? pl.seq : (st.seq || []); }
  function pRythme(c) {
    var ry = st.rythme || {}, seq = curSeq(), full = seq.length >= 4, lock = ry.locked;
    var res = ry.results || {}, h = '';
    if (ry.cur) {
      var dc = CK[ry.cur];
      if (ry.cur === c.k) h += '<section class="card" style="align-items:center;text-align:center;gap:8px;background:' + c.bg + ';border:2px solid #fff;padding:24px 16px"><div style="font-family:Mincho30,Georgia,serif;font-size:54px;font-weight:700;line-height:1">C’est à vous !</div><div class="ser" style="font-size:19px">' + (ry.stage === 'vote' ? 'Le public vous note…' : 'Montrez votre chorégraphie') + '</div></section>';
      else if (ry.stage === 'vote') {
        var mine = pl.rate && Date.now() - pl.rateAt < 4000 ? pl.rate : ry.myRate;
        h += '<section class="card" style="align-items:center;text-align:center;gap:12px;padding:22px 14px"><div class="lab">Note la danse du clan</div><div class="ser" style="font-size:26px;color:' + dc.ink + '">' + esc(dc.n) + '</div><div class="row" style="gap:4px;justify-content:center">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<button data-g="rate" data-n="' + n + '" aria-label="' + n + ' sur 5" style="border:0;background:none;padding:2px">' + star(mine >= n, 52) + '</button>'; }).join('') + '</div><div class="muted">' + (mine ? 'Ta note : ' + mine + ' / 5 · tu peux encore changer' : 'Touche une étoile') + '</div></section>';
      } else h += '<section class="card" style="align-items:center;text-align:center;gap:6px;padding:22px 14px"><div class="lab">En piste</div><div class="ser" style="font-size:26px;color:' + dc.ink + '">Le clan ' + CLB[dc.k].pre + ' ' + esc(dc.n) + ' danse !</div><div class="muted">Prépare-toi à le noter.</div></section>';
    }
    var done = CL.filter(function (k) { return res[k.k]; });
    if (done.length) h += '<section class="card"><div class="lab">Notes du public</div>' + done.map(function (k) { var r = res[k.k]; return '<div class="row" style="justify-content:space-between"><span class="ser" style="color:' + k.ink + '">' + esc(k.n) + '</span><span class="row" style="gap:2px">' + stars(r.avg, 18) + '</span><b>' + String(r.avg).replace('.', ',') + ' · +' + r.pts + '</b></div>'; }).join('') + '</section>';
    if (ry.cur) return h;
    var slots = [0, 1, 2, 3].map(function (i) {
      var m = MK[seq[i]];
      return '<button data-g="unseq" data-i="' + i + '"' + (lock ? ' disabled' : '') + ' style="height:64px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;' + (m ? 'background:#fff;border:2px solid #C8372D' : 'background:rgba(255,255,255,.5);border:2px dashed #e6d9c2') + '"><span style="font-size:11px;font-weight:800;color:#6b5e52">' + (i + 1) + '</span><span class="ser" style="font-size:13px;line-height:1.1">' + (m ? esc(m.t) : '—') + '</span></button>';
    }).join('');
    var grid = MOVES.map(function (m) {
      var used = seq.indexOf(m.k) >= 0;
      if (lock && !used) return '';
      return '<button data-g="seq" data-k="' + m.k + '"' + (lock ? ' disabled' : '') + ' style="display:flex;align-items:center;gap:8px;padding:8px 10px;min-height:76px;border-radius:14px;text-align:left;' + (used ? 'background:#E9E3F6;border:2px solid #C8372D' : 'background:#fff;border:1.5px solid #d9cbb4') + (full && !used ? ';opacity:.5' : '') + '">' + fig(m.k, 60, c.k) +
        '<span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="ser" style="font-size:15px;line-height:1.1">' + esc(m.t) + '</span><span style="font-size:11.5px;font-weight:700;color:#6b5e52;line-height:1.2">' + esc(m.d) + '</span></span></button>';
    }).join('');
    return h + (lock ? '<div class="card" style="flex-direction:row;align-items:center;gap:10px;background:#1E1A17;color:#fff;border-color:#1E1A17;font-weight:800">Chorégraphie verrouillée, place au spectacle !</div>' : '<div class="muted">Choisissez 4 mouvements dans l’ordre, 2 temps chacun. Le clan partage la même chorégraphie.' + (ry.lockAt ? ' Elle se verrouille à la fin du chrono.' : '') + '</div>') +
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
      var h2 = '<div class="full" style="background:#C8372D;gap:18px">';
      if (!show) h2 += '<div class="ser" style="font-size:24px;max-width:300px">C’est ' + esc(ch.mname) + ' qui mime</div><div style="font-weight:800;opacity:.85">Passe ton téléphone à ' + esc(ch.mname) + '</div><button data-g="oreveal" data-k="' + esc(o.end + ':' + ch.mname) + '" style="margin-top:10px;height:56px;padding:0 22px;border-radius:16px;border:0;background:#fff;color:#1E1A17;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:18px">Je suis ' + esc(ch.mname) + ' : voir les mimes</button>';
      else h2 += '<div class="ser" style="font-size:24px">Choisis ton mime</div>' + ch.options.map(function (x) { return '<button data-g="opickp" data-i="' + x.i + '" style="width:min(320px,86vw);min-height:58px;border-radius:16px;border:0;background:#fff;color:#1E1A17;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:20px;padding:8px 14px">' + esc(x.t) + '</button>'; }).join('') + '<div style="font-weight:700;opacity:.8">45 secondes dès que tu choisis</div>';
      return { cls: 'dark', html: h2 + '</div>' };
    }
    var open = o.state === 'green', run = o.state !== 'wait' && o.end;
    return { cls: 'dark', html: '<div class="full" style="background:' + (open ? '#2F7D64' : '#B8445F') + ';gap:22px">' +
      (run ? '<div class="ser" style="font-size:64px;line-height:1">' + cdu(o.end, '', 'padding:4px 14px;border-radius:16px') + '</div>' : '') +
      '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:40px;line-height:1.1;letter-spacing:.02em">Buzzer<br>' + (open ? 'OUVERT' : 'FERMÉ') + '</div>' +
      (o.mine ? '<button data-g="ohold" style="position:absolute;bottom:calc(26px + env(safe-area-inset-bottom));height:44px;padding:0 18px;border-radius:999px;border:1.5px solid rgba(255,255,255,.6);background:transparent;color:#fff;font-weight:800;font-size:14px;user-select:none;-webkit-user-select:none">Maintenir pour revoir le mime</button><div id="g-hold" style="display:none;position:absolute;inset:0;background:#1E1A17;align-items:center;justify-content:center;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:34px;padding:24px;text-align:center">' + esc(o.mine) + '</div>' : '') + '</div>' };
  }
  /* ---------- Écho (Hitster) ---------- */
  function echoInfo() {
    var e = st.echo || {}, t = now(), card = e.card || 0;
    return { e: e, card: card, done: card >= 6, play: card < 6 ? CL[card % 3] : null, run: !!(e.start && t < e.end), open: !!(e.start && t >= e.end), wait: !e.start };
  }
  function pEcho(c) {
    var x = echoInfo();
    if (x.done) return { cls: 'dark', html: '<div class="full" style="background:#C8372D;gap:14px"><div class="ser" style="font-size:30px">Fin de l’épreuve</div><div style="font-weight:800;opacity:.85">Regardez l’écran</div></div>' };
    if (x.wait) return { cls: 'dark', html: '<div class="full" style="background:#C8372D;gap:14px"><div style="font-weight:800;opacity:.85">Carte ' + (x.card + 1) + ' / 6</div><div class="ser" style="font-size:30px;line-height:1.15">' + (x.play.k === c.k ? 'À vous de piocher !' : 'Au tour du clan ' + CLB[x.play.k].pre + ' ' + esc(x.play.n)) + '</div></div>' };
    var open = x.run ? x.play.k === c.k : true;
    return { cls: 'dark', html: '<div class="full" style="background:' + (open ? '#2F7D64' : '#B8445F') + ';gap:22px">' +
      (x.run ? '<div class="ser" style="font-size:64px;line-height:1">' + cdu(x.e.end, '', 'padding:4px 14px;border-radius:16px') + '</div>' : '') +
      '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:40px;line-height:1.1;letter-spacing:.02em">Buzzer<br>' + (open ? 'OUVERT' : 'FERMÉ') + '</div></div>' };
  }
  function mEcho() {
    var x = echoInfo(), res = x.e.res || [], h = '';
    var hist = res.slice(0, x.card).map(function (r, i) { var p = CL[i % 3], w = r && r.clan ? CL.filter(function (c) { return c.k === r.clan; })[0] : null; return (i + 1) + '. ' + esc(p.n) + ' → ' + (w ? esc(w.n) + ' +' + r.pts : 'personne'); }).join(' · ');
    if (x.done) h += '<section class="card" style="align-items:center;text-align:center"><div class="ser" style="font-size:22px">Épreuve terminée</div><div class="muted" style="font-size:13px">' + hist + '</div></section>';
    else {
      var p = x.play, others = CL.filter(function (c) { return c.k !== p.k; });
      h += '<section class="card" style="background:' + p.bg + ';border-color:' + p.bg + '"><div class="row" style="justify-content:space-between"><span class="lab" style="color:' + p.ink + '">Tour ' + (x.card < 3 ? 1 : 2) + ' · carte ' + (x.card + 1) + ' / 6</span>' + (x.run ? cdu(x.e.end, 'ser', 'font-size:24px;padding:0 8px;border-radius:8px') : x.open ? '<b style="color:' + p.ink + '">Aux autres clans</b>' : '') + '</div>' +
        '<div class="ser" style="font-size:22px;color:' + p.ink + '">Clan ' + CLB[p.k].pre + ' ' + esc(p.n) + '</div>' +
        (x.wait ? '<button class="btn" data-g="estart">Lancer les 45 s</button>' :
          '<button class="btn" data-g="escore" data-c="' + p.k + '">Trouvé · +2 ' + esc(p.n) + '</button><div class="row" style="gap:8px">' + others.map(function (c) { return '<button class="btn2" style="flex:1;height:46px;color:' + c.ink + '" data-g="escore" data-c="' + c.k + '">+1 ' + esc(c.n) + '</button>'; }).join('') + '<button class="btn2" style="flex:1;height:46px" data-g="escore" data-c="">Personne</button></div>') +
        '</section>';
      if (hist) h += '<div class="muted" style="font-size:12px;line-height:1.5">' + hist + '</div>';
    }
    if (x.card > 0) h += '<button class="chip" data-g="ego" data-i="' + (x.card - 1) + '" style="align-self:flex-start">Revenir à la carte ' + x.card + '</button><div class="muted" style="font-size:12px">Revenir ne retire pas les points : corrige avec −1 / +1 en haut.</div>';
    return h + nextBtn();
  }
  function projEcho() {
    var x = echoInfo(), p = x.play, ink = p ? p.ink : '#1E1A17', C = 150.8;
    var f = x.wait ? 1 : x.run ? Math.max(0, (x.e.end - now()) / 45000) : 0;
    var pie = '<svg viewBox="0 0 100 100" style="width:24vw;height:24vw;display:block"><circle cx="50" cy="50" r="48" fill="#fff" stroke="' + ink + '" stroke-width="2"/><circle ' + (x.run ? 'data-pie="' + x.e.end + '" data-dur="45000" ' : '') + 'cx="50" cy="50" r="24" fill="none" stroke="' + ink + '" stroke-width="48" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - f)).toFixed(2) + '" transform="rotate(-90 50 50) scale(1 -1) translate(0 -100)" style="transition:stroke-dashoffset .3s linear' + (x.run ? '' : ';transition:none') + '"/></svg>';
    var left = x.done ? '<div class="ser" style="font-size:4vw;text-align:center">Fin de l’épreuve</div>' :
      '<div style="display:flex;flex-direction:column;align-items:center;gap:1.4vw;width:30vw;flex-shrink:0;text-align:center">' + pie +
      '<div class="ser" style="font-size:2.8vw;color:' + ink + '">' + (x.run ? cd(x.e.end, '', 'font-size:3.4vw') : x.open ? 'Aux autres clans !' : 'Clan ' + CLB[p.k].pre + ' ' + esc(p.n) + ' : piochez !') + '</div></div>';
    var scores = '<div style="display:flex;flex-direction:column;gap:1.2vw;flex:1;align-items:center">' + CL.map(function (c) {
      var on = p && p.k === c.k && !x.open;
      return banner(c, 50, 'vw', { style: 'transition:transform .4s,opacity .4s,filter .4s;' + (on ? 'transform:scale(1.06);filter:drop-shadow(0 0 1.2vw rgba(255,255,255,.75))' : p && !x.open ? 'filter:saturate(.5) brightness(.85)' : '') });
    }).join('') + '</div>';
    return { cls: 'peach proj', html: '<div class="pw">' + pHeader('Hit-Jutsu', 'Épreuve 2 / 6 · ' + (x.done ? '6 cartes jouées' : 'Tour ' + (x.card < 3 ? 1 : 2) + ' · carte ' + (x.card + 1) + ' / 6'), '') +
      '<div style="flex:1;display:flex;align-items:center;gap:5vw;padding:0 3vw">' + left + scores + '</div></div>' };
  }
  function scrollWrap(inner) { return { cls: 'dark', html: '<div class="scr"' + (demo() ? ' style="padding-top:calc(52px + env(safe-area-inset-top))"' : '') + '><div class="rod"></div><div class="paper">' + inner + '</div><div class="rod"></div></div>' }; }
  function pDestin(c) {
    var d = st.destin; if (!d) return scrollWrap('');
    var head = '<div class="sk">Carrefour ' + ['一', '二', '三'][d.c] + (d.double ? ' · points ×2' : '') + '</div><div style="font-size:26px;font-weight:700;line-height:1.1">' + esc(d.title) + '</div><div style="height:2px;background:linear-gradient(90deg,#2b1d12,transparent)"></div>';
    var foot = function (txt) { return '<div class="sk" style="margin-top:auto;text-align:center">' + txt + '</div>'; };
    if (d.mine) {
      var r = d.mine, rs = d.mineAt ? rollSpec(d.mineAt) : '', del = d.mineAt ? Math.max(0, 1.6 - (now() - d.mineAt) / 1000) : 0;
      var h = head + '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center">' +
        '<div class="sk">' + esc(['Prudent', 'Audacieux', 'Fou'][' ABC'.indexOf(r.opt) - 1]) + (r.roll === null ? ' · assuré' : ' · difficulté ' + r.dd) + '</div>' +
        (r.roll === null ? '<div class="stamp" style="width:84px;height:84px;font-size:44px;animation:stampin .5s ease-out both">成</div>' :
          d3(r.roll, '190px', d.mineAt || 0, 'm') + '<div class="stamp" style="width:76px;height:76px;font-size:40px;' + (r.ok ? '' : 'border-color:#2b1d12;color:#2b1d12;') + 'animation:stampin .5s ' + del.toFixed(2) + 's ease-out both">' + (r.ok ? '成' : '敗') + '</div>') +
        (calcTxt(r) ? '<div style="font:800 14px Gothic30,Nunito,Arial,sans-serif;animation:fadeup .5s ' + del.toFixed(2) + 's both">' + esc(calcTxt(r)) + '</div>' : '') +
        '<div style="font-size:28px;font-weight:700;animation:fadeup .5s ' + del.toFixed(2) + 's both">' + (r.ok ? 'Réussite !' : 'Échec…') + '</div>' +
        '<div style="font-style:italic;font-size:16px;line-height:1.5;animation:fadeup .5s ' + del.toFixed(2) + 's both">' + esc(r.text) + '</div>' +
        '<div style="font:800 15px Gothic30,Nunito,Arial,sans-serif;color:' + (r.pts > 0 ? '#2f6b45' : r.pts < 0 ? '#b5302a' : '#8a5a2b') + ';animation:fadeup .5s ' + del.toFixed(2) + 's both">' + (r.pts > 0 ? '+' : '') + r.pts + ' point' + (Math.abs(r.pts) > 1 ? 's' : '') + (r.double ? ' · ×2 dernier carrefour' : '') + (r.joker ? ' · joker' : '') + '</div>' +
        (r.gage ? '<div style="border:2px dashed #b5302a;border-radius:10px;padding:10px 12px;font-size:15px;line-height:1.45;animation:fadeup .5s ' + (del + 5.8).toFixed(2) + 's both"><b style="color:#b5302a">Gage :</b> ' + emo(r.gage) + '</div>' : '') + '</div>';
      return scrollWrap(h);
    }
    if (d.waiting) return scrollWrap(head + '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center"><div class="stamp" style="width:70px;height:70px;font-size:36px;opacity:.5">運</div><div style="font-size:20px;font-style:italic">Le destin de votre clan va être révélé…</div></div>');
    var vote = d.stage === 'vote' && now() <= d.voteEnd + 500, mine = pl.vote && Date.now() - pl.voteAt < 4000 ? pl.vote : d.myVote;
    var cols = ['#2f6b45', '#9a6a12', '#b5302a'];
    var scrolls = '<div class="scroll3">' + d.opts.map(function (o, i) {
      var on = mine === o.k;
      return '<button class="scl" data-g="vote" data-k="' + o.k + '"' + (vote ? '' : ' disabled') + '><i></i><b style="min-height:' + (on ? 330 : 270) + 'px;' + (on ? 'outline:3px solid #b5302a;outline-offset:-3px;' : '') + (vote || on ? '' : 'opacity:.75') + '"><span style="font-size:28px;color:' + cols[i] + '">' + ['一', '二', '三'][i] + '</span><span style="font-size:15px;line-height:1.3">' + esc(o.t) + '</span>' + dTag(i, cols[i], '10.5px', '30px') + (on ? '<span class="stamp" style="margin-top:auto;width:44px;height:44px;font-size:24px;animation:stampin .4s ease-out both">選</span>' : '') + '</b><i></i></button>';
    }).join('') + '</div>';
    var status = d.stage === 'story' ? 'Écoutez le récit… le vote va s’ouvrir' : vote ? 'Clan ' + CLB[c.k].pre + ' ' + esc(c.n) + ' · ' + cdu(d.voteEnd, '', 'border-radius:6px;padding:0 4px') : 'Votes verrouillés';
    return scrollWrap(head + '<div style="font-style:italic;font-size:15px;line-height:1.5">' + esc(d.text) + '</div>' + ctxLines(d.ctx, '14px') + scrolls + foot(status));
  }
  function pBoss(c) {
    var b = st.boss || {};
    var dying = b.dead && b.deadAt && now() - b.deadAt < 2600;
    var txt = b.dead ? 'Alessia a terrassé Sanjûbi !' : b.p2 && b.p2.done ? 'Le coup final revient à Alessia…' : b.p1 ? 'Préparez-vous pour le Rasengan collectif' : 'Les clans attaquent Sanjûbi';
    var p1 = b.p1, mine = '', FN = window.Finale, ord = p1 && p1.sums && FN ? FN.clanOrder(p1.sums) : [], wi = ord.indexOf(c.k);
    var tw = p1 ? now() - (p1.at + Math.max(0, wi) * (FN ? FN.CLMS : 6000)) : -1, rolling = !!p1 && tw < 1700;
    if (p1 && !b.dead && wi >= 0 && tw >= 0 && tw < 4300) return pAttack(c, p1, tw, p1.at + wi * (FN ? FN.CLMS : 6000));
    var ai = p1 && FN ? Math.floor((now() - p1.at) / FN.CLMS) : -1;
    if (p1 && ai >= 0 && ai <= 2 && ord[ai] !== c.k && !(b.p2)) txt = 'Le ' + clanName(ord[ai]) + ' attaque…';
    if (p1 && !b.dead) mine = '<div style="width:100%;background:' + c.bg + ';color:#1E1A17;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;align-items:center"><div class="lab" style="color:' + c.ink + '">Attaques du clan · chakra ×' + p1.mult + '</div><div class="row" style="gap:4px;flex-wrap:wrap;justify-content:center">' + p1.dice.map(function (x) { return d20s(x, '42px', rolling); }).join('') + '</div><div class="ser" style="font-size:26px">' + (rolling ? '…' : '−' + fmt(p1.sum) + ' PV') + '</div></div>';
    if (b.intro && now() - b.intro < 25500 && !b.p1) return { cls: 'dark', html: '<div class="full" style="background:#1d1626;gap:16px"><img src="/sanjubi/face.webp" alt="" style="width:150px;height:150px;border-radius:50%;object-fit:cover;filter:brightness(.7);animation:pop .6s ease-out both"><div class="ser" style="font-size:28px">Regardez l’écran…</div></div>' };
    if (b.dead && !dying) return { cls: 'dark', html: '<div class="w" style="align-items:center;text-align:center;justify-content:center;gap:18px">' + faceImg(200, true) + '<div style="font-family:Mincho30,Georgia,serif;font-size:72px;font-weight:700;color:#F7E6A8;line-height:1;animation:pop .6s ease-out both">Vaincu !</div><div class="ser" style="font-size:22px;line-height:1.35">Alessia a terrassé Sanjûbi</div><div style="font-size:17px;font-weight:700;color:#e6d9c2;line-height:1.45;animation:fadeup .6s .8s both">Regardez l’écran : la cérémonie du Hokage va commencer…</div></div>' };
    return { cls: 'dark', html: '<div class="w" style="align-items:center;text-align:center"><div class="hd" style="width:100%"><h1>Sanjûbi</h1></div>' + banner(c, 91, 'vw', { max: 396 }) +
      faceImg(p1 ? 170 : 240, false, 'boss' + (dying ? ' boom' : '')) + mine +
      '<div style="width:100%;display:flex;flex-direction:column;gap:8px"><div class="row" style="justify-content:space-between;font-weight:800;color:#e6d9c2"><span>POINTS DE VIE</span><span>' + fmt(hpNow(b)) + ' / 2 026</span></div>' + hpBar(hpNow(b)) + '</div>' +
      '<div class="ser" style="font-size:22px;line-height:1.3">' + txt + '</div></div>' };
  }
  // PV affichés sur les téléphones, au rythme des impacts de la projection.
  function hpNow(b) {
    var FN = window.Finale; if (!FN || !b.p1 || !b.p1.sums) return b.hp;
    var ord = FN.clanOrder(b.p1.sums), tot = 0, hp = 2026, T = now();
    ord.forEach(function (k) { tot += b.p1.sums[k] || 0; });
    ord.forEach(function (k, i) { if (T >= b.p1.at + i * FN.CLMS + 2600) hp -= Math.round(b.p1.dmg * (b.p1.sums[k] || 0) / (tot || 1)); });
    if (b.p2 && b.p2.done && T >= (b.p2.at || 0) + 1100) hp -= b.p2.dmg;
    return b.dead ? 0 : Math.max(Math.min(hp, 2026), b.hp);
  }
  // Pendant l'attaque de son clan, le téléphone s'allume à la couleur du clan (dés, jutsu, dégâts).
  function pAttack(c, p1, tw, ws) {
    var K = window.Finale.CLAN[c.k], roll = tw < 1700;
    return { cls: 'dark', html: '<div class="atk" style="--c:' + K.c + ';--g:' + K.g + '"><div class="kk" style="color:#fff">' + K.s + ' · Votre clan attaque !</div><div class="ser atk-j">' + esc(K.j) + '</div>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;max-width:360px">' + p1.dice.map(function (x, i) { return d3(x, p1.dice.length > 6 ? '58px' : '72px', ws + 100 + i * 40, c.k + i); }).join('') + '</div>' +
      '<div class="ser" style="font-size:44px;color:#fff">' + (roll ? '…' : '−' + fmt(p1.sum) + ' PV') + '</div><div style="font-weight:800;color:rgba(255,255,255,.85)">Regardez l’écran !</div></div>' };
  }
  // Coup final : Alessia joue (QTE façon osu!), les autres donnent leur chakra ; flash blanc et victoire à l'impact.
  function pFinal(c) {
    var f = st.boss.fin, T = now(), isA = myName().trim().toLowerCase() === 'alessia', imp = f.launchAt ? f.launchAt + 900 : 0;
    if (imp && T >= imp) return { cls: 'dark', html: '<div class="fv">' + (T - imp < 1500 ? '<div class="fv-fl"></div>' : '') + '<div class="fv-k">勝</div><h1>Victoire !</h1><p>Sanjûbi est vaincu. Regardez l’écran…</p></div>' };
    if (isA) {
      if (f.launchAt) return { cls: 'dark', html: '<div class="fv"><div class="fv-k" style="color:#7FD4FF;text-shadow:0 0 40px rgba(127,212,255,.6)">見</div><h1>Rasen-shuriken lancé !</h1><p>Regarde l’écran…</p></div>' };
      return { cls: 'dark', html: '<div class="fq"><canvas id="fq-cv" aria-label="Jeu de rythme du coup final"></canvas><div class="fq-ov" id="fq-ov"><div class="fq-sl">決</div><div class="kk" style="color:#f0a090">決戦 · Le coup final</div><h1>Alessia, le village compte sur toi.</h1>' +
        '<ul><li>Touche les cercles quand l’anneau se referme dessus. Commence par les 3 sceaux d’incantation.</li><li>Tourne ton doigt autour du cercle pour charger le Rasen-shuriken.</li><li>Glisse vers le haut pour le lancer sur Sanjûbi.</li></ul><button class="btn" style="width:100%" data-g="fqgo">Je suis prête</button></div></div>' };
    }
    return { cls: 'dark', html: '<div class="fh"><div class="kk" style="color:#f0a090">決戦 · Le coup final</div><h2>Donnez votre chakra à Alessia</h2><p>Garde le doigt appuyé sur la sphère</p>' +
      '<button class="fh-b" id="fh-b" aria-label="Maintenir pour donner son chakra"><svg viewBox="0 0 248 248" aria-hidden="true"><circle cx="124" cy="124" r="118" fill="none" stroke="rgba(244,236,221,.15)" stroke-width="8"/><circle id="fh-r" cx="124" cy="124" r="118" fill="none" stroke="#F7E6A8" stroke-width="8" stroke-linecap="round" stroke-dasharray="741.4" stroke-dashoffset="741.4"/></svg><span>Chakra</span></button>' +
      '<p id="fh-n" style="color:#7FD4FF">Alessia prépare son attaque…</p></div>' };
  }
  function fqStart() {
    var cv = document.getElementById('fq-cv'), ov = document.getElementById('fq-ov'); if (!cv || !window.Finale) return;
    if (ov) ov.style.display = 'none';
    if (pl.qte) pl.qte.destroy();
    var phase = function (s) { return s === 'notes' ? 'qte' : s === 'spin' ? 'spin' : 'launch'; };
    pl.finSent = 0;
    pl.qte = new Finale.QTE(cv, { onEvent: function (type, r, state) {
      var body = { name: myName(), prog: state === 'notes' ? r.done / r.total : 1, combo: r.combo, score: r.score, seals: r.seals, spin: r.spin, phase: phase(state), maxCombo: r.maxCombo };
      if (type === 'launch') { req('/api/game/finGo', { method: 'POST', body: body }).then(poll).catch(function () { setTimeout(function () { req('/api/game/finGo', { method: 'POST', body: body }).then(poll); }, 800); }); return; }
      if (Date.now() - pl.finSent > 450 || type === 'spinStart' || type === 'launchReady') { pl.finSent = Date.now(); req('/api/game/fin', { method: 'POST', body: body }).catch(function () {}); }
    } });
    pl.qte.start();
  }
  // Chaque 250 ms côté téléphone : chakra donné par les amis, ménage du QTE.
  function finTick() {
    if (pl.qte && !pl.qte.cv.isConnected) { pl.qte.destroy(); pl.qte = null; }
    var ring = document.getElementById('fh-r'); if (!ring) { pl.holding = false; return; }
    var t = Date.now(); pl.gave = Math.min(1, (pl.gave || 0) + (pl.holding ? (t - (pl.gaveT || t)) / 6000 : 0)); pl.gaveT = t;
    ring.style.strokeDashoffset = (741.4 * (1 - pl.gave)).toFixed(1);
    var nt = document.getElementById('fh-n'); if (nt) nt.textContent = pl.gave > 0 ? Math.round(pl.gave * 100) + ' % de ton chakra donné' : 'Alessia prépare son attaque…';
    if (pl.holding && t - (pl.chSent || 0) > 1500) { pl.chSent = t; req('/api/game/chakra', { method: 'POST', body: { name: myName() } }).catch(function () {}); }
  }
  // Portrait de Sanjûbi sur les téléphones ; version grise et fissurée après la victoire.
  function faceImg(w, beaten, cls) {
    var img = '<img class="' + (cls || '') + '" src="/sanjubi/face.webp" alt="Sanjûbi" style="width:' + w + 'px;height:' + w + 'px;border-radius:50%;object-fit:cover;display:block;' + (beaten ? 'filter:grayscale(1) brightness(.75) contrast(1.15)' : 'box-shadow:0 0 0 4px #F7C948,0 0 40px rgba(255,140,40,.55)') + '">';
    if (!beaten) return img;
    return '<div style="position:relative;width:' + w + 'px;height:' + w + 'px;animation:pop .6s ease-out both">' + img +
      '<svg viewBox="0 0 100 100" style="position:absolute;inset:0" aria-hidden="true" fill="none" stroke="#f3eee6" stroke-width="1.6" stroke-linejoin="round"><path d="M46 2 L52 20 L44 33 L55 47 L47 60 L58 74 L50 98"/><path d="M52 20 L66 26 L74 22"/><path d="M44 33 L30 38 L22 34"/><path d="M55 47 L72 52"/><path d="M47 60 L31 66 L26 76"/></svg></div>';
  }
  function pRasengan(c, p2) {
    var t = now(), wait = t < p2.start, run = t >= p2.start && t < p2.end;
    var key = p2.start; if (pl.p2 !== key) { pl.p2 = key; pl.taps = 0; pl.tapSent = 0; }
    return { cls: 'dark', html: '<div class="w" style="align-items:center;text-align:center"><div class="hd" style="width:100%"><h1>Rasengan</h1></div>' + banner(c, 91, 'vw', { max: 396 }) +
      '<div class="ser" style="font-size:22px">' + (wait ? 'Prêts ? Ça commence dans…' : run ? 'Tape le plus vite possible !' : 'Terminé !') + '</div>' +
      '<div class="row" style="gap:12px"><div style="background:rgba(255,255,255,.1);border-radius:16px;padding:10px 18px"><div class="lab" style="color:#e6d9c2">Temps</div><div class="ser" style="font-size:30px">' + cd(wait ? p2.start : p2.end) + '</div></div>' +
      '<div style="background:rgba(255,255,255,.1);border-radius:16px;padding:10px 18px"><div class="lab" style="color:#e6d9c2">Tes tapes</div><div class="ser" style="font-size:30px" id="g-taps">' + pl.taps + '</div></div></div>' +
      '<button data-g="tap" aria-label="Taper" ' + (run ? '' : 'disabled') + ' style="margin-top:14px;width:270px;height:270px;border-radius:50%;border:0;padding:0;touch-action:manipulation;background:radial-gradient(circle at 40% 38%,#fff 0%,#CFE9FF 22%,#7FB6F0 52%,#5B4B8A 100%);box-shadow:0 0 60px rgba(127,182,240,.55);display:flex;align-items:center;justify-content:center;' + (run ? '' : 'opacity:.5') + '">' +
      '<svg width="210" height="210" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round" aria-hidden="true" style="animation:spin ' + (run ? '.6s' : '3s') + ' linear infinite"><path d="M50 14a36 36 0 0 1 36 36"/><path d="M86 50a36 36 0 0 1-36 36"/><path d="M50 86a36 36 0 0 1-36-36"/><path d="M14 50a36 36 0 0 1 36-36"/><path d="M50 28a22 22 0 0 1 22 22"/><path d="M50 72a22 22 0 0 1-22-22"/></svg></button>' +
      '<div style="font-weight:800;color:#F7E6A8">1 tape = ' + fmt(p2.per || 1) + ' dégâts</div><div class="muted" style="color:#e6d9c2">Pas de téléphone ? Tape sur celui de ton voisin, à deux</div></div>' };
  }
  function pHokage() {
    return '<section class="card" style="align-items:center;text-align:center;padding:26px 16px;gap:8px"><div style="font-family:Mincho30,Georgia,serif;font-size:52px;font-weight:700;line-height:1">Alessia est Hokage !</div><div class="ser" style="font-size:18px">Regardez l’écran, place aux souvenirs</div></section>';
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
    h += '<div class="scroll">' + ORDER.map(function (i, k) { return '<button class="chip' + (i === s ? ' on' : '') + '" data-g="step" data-i="' + i + '">' + (k + 1) + '. ' + esc(STEPS_S[i]) + '</button>'; }).join('') + '</div>';
    if (!st.on && !st.demo) h += '<div class="card" style="background:#FFF6D9;border-color:#F7E3A0;flex-direction:row;align-items:center;gap:10px"><span style="flex:1;font-weight:800">Le jeu est invisible pour les joueurs</span><button class="chip on" data-g="on" data-v="1">Ouvrir</button></div>';
    // scores
    h += '<section class="card"><div class="lab">Scores</div><div class="grid3">' + CL.map(function (c) {
      return '<div style="background:' + c.bg + ';border-radius:14px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px">' + ico(c, 18) + '<b class="ser" style="font-size:26px">' + st.scores[c.k] + '</b>' +
        '<div class="row" style="gap:4px"><button class="chip" style="height:32px;padding:0 10px" data-g="pts" data-c="' + c.k + '" data-d="-1" aria-label="Moins 1 ' + c.n + '">−1</button><button class="chip" style="height:32px;padding:0 10px" data-g="pts" data-c="' + c.k + '" data-d="1" aria-label="Plus 1 ' + c.n + '">+1</button></div>' +
        jokerBtn(c) + '</div>';
    }).join('') + '</div><div class="muted" style="font-size:12px">Joker x2 : touche pour l’activer sur l’épreuve en cours (de K-pop no Jutsu à la Voie du ninja), retouche pour annuler. Les gains comptent double automatiquement.</div></section>';
    // chrono
    h += '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Chrono</span>' + (st.timer && now() < st.timer.end ? cd(st.timer.end, 'ser', 'font-size:22px') : '<span class="muted">—</span>') + '</div><div class="row" style="flex-wrap:wrap">' +
      [[30, '0:30'], [45, '0:45'], [90, '1:30'], [600, '10 min']].map(function (x) { return '<button class="chip" data-g="timer" data-s="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '<button class="chip" data-g="timerStop">Stop</button></div></section>';
    h += bri() !== null ? mBrief() : [mOuverture, mRythme, mSavoir, mOmbre, mDestin, mBoss, mHokage, mEcho][s]();
    return wrap(h);
  }
  function jokerBtn(c) {
    var s = jk(c.k), j = st.joker[c.k], ok = jokerOk(jkStep());
    if (s === 'used') return '<span style="font-size:11px;font-weight:800;color:' + c.ink + ';text-align:center">Joker : ' + esc(STEPS_S[j.step]) + '</span>';
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
    hp += '</section>';
    var S = st.selInfo || { phase: 'closed', cap: 1, count: {}, n: 0, mode: 'pick' }, none = ids.filter(function (id) { return !r[id].clan; }).length;
    var sel = '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Choix des clans</span><span class="muted" style="font-size:12px">' + (S.mode === 'draw' ? 'Tirage au sort utilisé' : { closed: 'Fermé', alessia: 'Alessia choisit', open: 'Ouvert à tous', locked: 'Verrouillé' }[S.phase]) + '</span></div>' +
      '<div class="grid3">' + [['alessia', '1. Alessia'], ['open', '2. Tous'], ['locked', '3. Verrouiller']].map(function (x) { return '<button class="chip' + (S.mode === 'pick' && S.phase === x[0] ? ' on' : '') + '" style="height:42px" data-g="selph" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="justify-content:space-between"><span style="font-weight:700">Joueurs attendus</span><span class="row" style="gap:6px"><button class="chip" data-g="seln" data-n="-1" aria-label="Un joueur de moins">−</button><span class="ser" style="font-size:20px;min-width:30px;text-align:center">' + Math.max(S.n, ids.length) + '</span><button class="chip" data-g="seln" data-n="1" aria-label="Un joueur de plus">+</button></span></div>' +
      '<div class="muted" style="font-size:13px">' + S.cap + ' places par clan · ' + CS_ORDER.map(function (k) { return CK[k].n + ' ' + (S.count[k] || 0) + '/' + S.cap; }).join(' · ') + '</div>' +
      '<div style="font-weight:700;font-size:14px">' + (S.alessia === null ? 'Alessia n’a pas encore ouvert le jeu (prénom « Alessia »).' : S.alessia ? 'Alessia a choisi le ' + esc(clanName(S.alessia)) + '.' : 'Alessia n’a pas encore choisi.') + (none ? ' · ' + none + ' sans clan' : '') + '</div>' +
      '<div class="muted" style="font-size:12px">1. Alessia choisit seule sur son téléphone. 2. Tout le monde choisit ; un clan plein affiche COMPLET. 3. Verrouiller fige les clans et affiche « Les clans sont formés ! ». Les joueurs sans téléphone : ajoute-les puis touche leur clan. « Placer les nouveaux » répartit ceux qui restent sans clan.</div></section>';
    hp = sel + hp;
    var h = hp + '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Joueurs · ' + ids.length + '</span><span class="muted" style="font-size:13px">Feu ' + cnt.feu + ' · Foudre ' + cnt.foudre + ' · Vent ' + cnt.vent + '</span></div>';
    h += ids.length ? ids.map(function (id) {
      var p = r[id], c = p.clan ? CK[p.clan] : null;
      return '<div class="row" style="gap:8px;border-top:1.5px dashed #e6dccb;padding-top:8px"><span style="flex:1;font-weight:800">' + esc(p.name) + (p.phone ? ' <span class="muted" style="font-size:12px">· tél.</span>' : '') + '</span>' +
        '<button class="chip" data-g="move" data-id="' + esc(id) + '" style="' + (c ? 'background:' + c.bg + ';border-color:' + c.bg + ';color:' + c.ink : '') + '">' + (c ? esc(c.n) : 'Sans clan') + '</button>' +
        '<button class="chip" data-g="delp" data-id="' + esc(id) + '" aria-label="Retirer ' + esc(p.name) + '">×</button></div>';
    }).join('') : '<div class="muted">Les joueurs apparaissent quand ils ouvrent le jeu. Ajoute ceux sans téléphone ci-dessous.</div>';
    h += '<div class="row"><input id="g-add" maxlength="40" placeholder="Prénom" aria-label="Prénom à ajouter"><button class="chip on" style="height:44px" data-g="addp">Ajouter</button></div>' +
      (st.demo ? '<button class="btn2" data-g="demofake">Ajouter 8 joueurs fictifs + toi</button>' : '') + '<div class="grid2"><button class="btn2" data-g="drawRest">Placer les nouveaux</button><button class="btn2" data-g="draw">Tirage au sort (secours)</button></div><div class="muted" style="font-size:12px">Touche le clan d’un joueur pour le changer. Le tirage au sort remplace tous les choix et lance la révélation animée.</div></section>';
    h += '<section class="card"><div class="lab">Partie</div><div class="grid2">' + (st.demo ? '' : '<button class="btn2" data-g="on" data-v="' + (st.on ? 0 : 1) + '">' + (st.on ? 'Masquer le jeu' : 'Ouvrir le jeu') + '</button>') + '<button class="btn2" data-g="reset" style="color:#A63A55">' + (mj.resetArm ? 'Confirmer ?' : 'Réinitialiser') + '</button></div><div class="muted" style="font-size:12px">Réinitialiser efface clans, scores et votes (les questions et les photos restent).</div></section>';
    return h + nextBtn();
  }
  // « Épreuve suivante » ouvre d'abord l'annonce (sauf pour la Nuit de la Hokage, qui démarre directement).
  function nextBtn() { var k = ORDER.indexOf(st.step), nx = ORDER[k + 1]; return nx !== undefined ? '<button class="btn" data-g="' + (BRIEF[nx] ? 'brief' : 'step') + '" data-i="' + nx + '">' + (BRIEF[nx] ? 'Annoncer : ' : 'Épreuve suivante : ') + esc(STEPN[nx]) + '</button>' : ''; }
  function mBrief() {
    var i = bri(), jkTxt = jokerOk(i) ? CL.filter(function (c) { return jk(c.k) === 'free'; }).map(function (c) { return esc(c.n); }) : [];
    return '<section class="card"><div class="lab">Annonce · ' + esc(KK[i] || '') + '</div><div class="ser" style="font-size:26px">' + esc(STEPN[i]) + '</div>' +
      '<div class="muted" style="font-size:12px">Les téléphones et l’écran affichent le nom de l’épreuve. Lis le texte, puis lance l’épreuve.</div>' +
      '<div style="background:#FBF7F2;border:1.5px solid #e6dccb;border-radius:6px;padding:14px;font-weight:600;font-size:17px;line-height:1.55">' + esc(BRIEF[i] || '') + '</div>' +
      (jkTxt.length ? '<div style="font-weight:800;font-size:14px">Rappel joker x2 (encore dispo : ' + jkTxt.join(', ') + ') : c’est le moment de l’annoncer. Active-le dans les scores en haut.</div>' : '') +
      '<button class="btn" data-g="briefGo">Commencer l’épreuve</button><button class="btn2" data-g="briefX">Annuler l’annonce</button></section>';
  }
  function mRythme() {
    var ry = st.rythme || {}, res = ry.results || {}, songs = ry.songs || {};
    var h = '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Chorégraphies</span>' + (st.rLocked ? '<button class="chip" data-g="runlock">Déverrouiller</button>' : '<span class="muted" style="font-size:12px">' + (ry.lockAt ? 'Verrouillage à la fin du chrono' : 'Lance 1:30 : verrouillage à la fin') + '</span>') + '</div>';
    h += CL.map(function (c) {
      var s = (st.seqs || {})[c.k] || [], r = res[c.k], cur = ry.cur === c.k, other = ry.cur && !cur;
      var btn = cur ? (ry.stage === 'dance' ? '<button class="chip on" data-g="rvote">Ouvrir le vote</button>' : '<button class="chip on" data-g="rreveal">Révéler · ' + (st.rateCount || 0) + ' vote' + ((st.rateCount || 0) > 1 ? 's' : '') + '</button>') : '<button class="chip" data-g="rstage" data-c="' + c.k + '"' + (other ? ' disabled style="opacity:.45"' : '') + '>' + (r ? 'Redanser' : 'En piste') + '</button>';
      return '<div style="background:' + c.bg + ';border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;' + (cur ? 'box-shadow:0 0 0 3px #1E1A17' : '') + '"><div class="row" style="justify-content:space-between"><span class="ser" style="font-size:16px;color:' + c.ink + '">' + esc(c.n) + (r ? ' · ' + String(r.avg).replace('.', ',') + '/5 · +' + r.pts : '') + '</span>' + btn + '</div>' +
        '<div style="font-weight:700;font-size:14px">' + (s.length ? s.map(function (k, i) { return (i + 1) + '. ' + esc(MK[k].t); }).join(' · ') : 'Pas encore choisie') + '</div>' +
        (songs[c.k] ? '<div class="row" style="gap:6px">' + (ry.music && ry.music.clan === c.k ? '<button class="chip" data-g="music" data-c="' + c.k + '" data-on="0">Couper la musique</button>' : '<button class="chip" data-g="music" data-c="' + c.k + '" data-on="1">Musique</button>') + '</div>' : '') + '</div>';
    }).join('') + '<div class="muted" style="font-size:12px">En piste : la musique du clan démarre sur l’écran. Après la danse, ouvre le vote : les 2 autres clans notent sur 5 depuis leurs téléphones, la moyenne arrondie devient leurs points.</div></section>';
    var sg = songs.feu || '', sv = yt(sg), se = ry.songEnd || 0;
    h += '<section class="card"><div class="lab">Musique · la même pour les 3 clans</div><label class="muted" for="g-song" style="font-size:13px">Lien YouTube avec le début (?t=)</label><input id="g-song" inputmode="url" placeholder="https://youtu.be/…?t=60" value="' + esc(sg) + '">' +
      '<label class="muted" for="g-songend" style="font-size:13px">Fin de l’extrait (min:s, vide = jusqu’au bout)</label><input id="g-songend" inputmode="numeric" placeholder="1:40" value="' + (se ? Math.floor(se / 60) + ':' + String(se % 60).padStart(2, '0') : '') + '">' +
      (sv ? '<div class="muted" style="font-size:12px">Extrait joué : ' + Math.floor(sv.start / 60) + ':' + String(sv.start % 60).padStart(2, '0') + (se ? ' → ' + Math.floor(se / 60) + ':' + String(se % 60).padStart(2, '0') + ' (' + (se - sv.start) + ' s)' : '') + '</div>' : '') +
      '<button class="btn2" data-g="songs">Enregistrer la musique</button></section>';
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
      h += '<button class="btn" data-g="onext">Mime suivant : clan ' + CLB[nextClan.k].pre + ' ' + esc(nextClan.n) + '</button></section>';
    } else if (c.mime === null) {
      h += '<div class="ser" style="font-size:18px">' + esc(c.mname || 'Le mimeur') + ' (' + esc(CK[c.clan].n) + ') choisit son mime sur un téléphone de son clan…</div>' +
        (mj.showOpts ? c.options.map(function (i) { return '<button class="btn2" style="height:56px;font-family:Mincho30,Georgia,serif;font-size:18px" data-g="opick" data-i="' + i + '">' + esc(st.mimes[i]) + '</button>'; }).join('') : '<button class="btn2" data-g="oshow">Pas de téléphone ? Choisir sur ma console</button>') + '</section>';
    } else {
      var over = now() > c.end;
      h += '<div class="lab">Mimeur · ' + esc(c.mname || '') + ' · clan ' + CLB[c.clan].pre + ' ' + esc(CK[c.clan].n) + '</div><div class="ser" style="font-size:28px;text-align:center">' + esc(st.mimes[c.mime]) + '</div><div class="row" style="gap:10px">' + cdBar(c.end, 45000) + cdu(c.end, 'ser', 'font-size:22px;min-width:50px;text-align:right;border-radius:8px;padding:0 4px') + '</div></section>';
      h += '<div class="lab">Qui a levé la main ?</div>' + CL.map(function (k) {
        var red = c.red[k.k], sel = mj.sel === k.k;
        return '<button data-g="osel" data-c="' + k.k + '" ' + (red ? 'disabled' : '') + ' style="height:56px;display:flex;align-items:center;gap:10px;padding:0 18px;border-radius:16px;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:19px;' + (red ? 'background:#F3D5DC;color:#A63A55;border:2px solid #E7B3C0' : 'background:' + k.bg + ';color:' + k.ink + ';border:' + (sel ? '3px solid #1E1A17' : '2px solid transparent')) + '"><span style="flex:1;text-align:left">' + esc(k.n) + '</span><span style="font-family:Gothic30,Nunito,sans-serif;font-size:13px;font-weight:800">' + (red ? 'Bloqué' : sel ? 'Interrogé' : 'Peut répondre') + '</span></button>';
      }).join('');
      h += '<div class="grid2"><button data-g="ojudge" data-ok="0" ' + (mj.sel ? '' : 'disabled') + ' style="height:60px;border-radius:18px;border:2px solid #C8372D;background:#fff;color:#A63A55;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:21px">Faux</button><button data-g="ojudge" data-ok="1" ' + (mj.sel ? '' : 'disabled') + ' style="height:60px;border-radius:18px;border:0;background:#3E8E74;color:#fff;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:21px;box-shadow:0 5px 0 #2C6B57">Vrai</button></div>';
      h += '<button class="btn2" data-g="oskip">' + (over ? 'Temps écoulé : mime suivant' : 'Passer ce mime') + '</button>';
    }
    return h + nextBtn();
  }
  function mDestin() {
    var d = st.destin, sc = st.destinScenes[d.c], v = st.destinVotes || {}, res = d.results || {};
    var h = '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Carrefour ' + (d.c + 1) + ' / 3</span>' + (d.c === 2 ? '<span class="pill" style="background:#1E1A17;color:#F7E6A8">Points ×2</span>' : '') + '</div><div class="ser" style="font-size:20px">' + esc(sc.title) + '</div>' +
      '<div style="background:#FFF6D9;border-radius:12px;padding:10px 12px;font-weight:700;line-height:1.45">À lire : ' + esc(sc.text) + '</div>' +
      sc.opts.map(function (o, i) { return '<div style="font-weight:700;font-size:14px"><b>' + 'ABC'[i] + '</b> · ' + esc(o.t) + ' <span class="muted" style="font-size:12px">(' + esc(sc.tags[i]) + ')</span></div>'; }).join('') + '</section>';
    var cxs = st.destinCtx || {};
    if (d.c > 0 && d.stage !== 'reveal') h += '<section class="card"><div class="lab">Suite de chaque clan · affichée sur son téléphone</div>' + CL.map(function (c) { var cx = cxs[c.k]; if (!cx || !cx.lines.length) return ''; return '<div style="background:' + c.bg + ';border-radius:12px;padding:8px 12px"><div style="font-weight:800;color:' + c.ink + '">' + esc(c.n) + ' · ' + sgn(cx.mod).replace('+0', '±0').replace('−0', '±0') + ' au dé</div>' + cx.lines.map(function (l) { return '<div style="font-size:14px;font-weight:600">' + esc(l.t) + '</div>'; }).join('') + '</div>'; }).join('') + '</section>';
    if (d.stage === 'story') h += '<button class="btn" data-g="dopen">Ouvrir le vote · 45 s</button>';
    else if (d.stage === 'vote') {
      var tleft = now() <= d.voteEnd;
      h += '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Votes</span>' + (tleft ? cdu(d.voteEnd, 'ser', 'font-size:20px;border-radius:8px;padding:0 4px') : '<span style="font-weight:800;color:#A63A55">Verrouillés</span>') + '</div>' + CL.map(function (c) {
        return '<div class="row"><span class="ser" style="flex:1;color:' + c.ink + '">' + esc(c.n) + '</span>' + ['A', 'B', 'C'].map(function (k) { return '<button class="chip' + (v[c.k] === k ? ' on' : '') + '" data-g="dvote" data-c="' + c.k + '" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div>';
      }).join('') + '<div class="muted" style="font-size:12px">Tu peux voter pour un clan sans téléphone. Sans vote, un clan joue A.</div></section><button class="btn" data-g="dreveal">Lancer les dés</button>';
    } else {
      h += '<section class="card"><div class="lab">Révélations</div>' + d.order.map(function (k, i) {
        var c = CK[k], r = res[k];
        if (i >= d.shown) return i === d.shown ? '<button class="btn" data-g="dshow" style="background:' + c.ink + ';box-shadow:0 5px 0 rgba(0,0,0,.25)">Révéler : clan ' + CLB[c.k].pre + ' ' + esc(c.n) + '</button>' : '<div class="muted">Clan ' + CLB[c.k].pre + ' ' + esc(c.n) + ' · en attente</div>';
        return '<div style="background:' + c.bg + ';border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px"><div style="font-weight:800">' + esc(c.n) + ' · ' + r.opt + (r.roll === null ? ' · assuré' : ' · d20 ' + (r.mod ? r.roll + ' ' + sgn(r.mod).replace(/^([+−])/, '$1 ') + ' = ' + r.total : r.roll) + ' / ' + r.dd) + ' · ' + (r.pts > 0 ? '+' : '') + r.pts + '</div><div style="font-weight:700;font-size:14px">À lire : ' + esc(r.text) + '</div>' + (r.gage ? '<div style="font-weight:800;color:#A63A55;font-size:14px">Gage : ' + emo(r.gage) + '</div>' : '') + '</div>';
      }).join('') + '</section>';
      if (d.shown >= 3) h += d.c < 2 ? '<button class="btn" data-g="dnext">Carrefour suivant</button>' : '<section class="card" style="background:#1E1A17;color:#fff;border-color:#1E1A17"><div class="lab" style="color:#e6d9c2">À lire pour conclure</div><div style="font-weight:700;line-height:1.45">' + esc(st.destinOutro) + '</div></section>' + nextBtn();
    }
    return h;
  }
  function mBoss() {
    var b = st.boss, p2 = b.p2, t = now();
    var h = '<section class="card"><div class="row" style="justify-content:space-between"><span class="lab">Sanjûbi</span><b class="ser">' + fmt(b.hp) + ' / 2 026</b></div>' + hpBar(b.hp) + '</section>';
    if (!b.p1) h += '<section class="card"><div class="lab">Cinématique · Le Réveil de Sanjûbi</div>' + (introOn() ? '<div style="font-weight:800">En cours sur l’écran · ' + Math.ceil((b.intro + INTRO_MS - t) / 1000) + ' s</div><button class="btn2" data-g="bintro" data-on="0">Passer la cinématique</button>' : '<div class="muted">25 s plein écran sur la projection, avant le combat. Les téléphones affichent « Regardez l’écran ».</div><button class="btn" data-g="bintro" data-on="1">' + (b.intro ? 'Relancer' : 'Lancer') + ' le Réveil de Sanjûbi</button>') + '</section>';
    h += '<section class="card"><div class="lab">Phase 1 · attaques</div>' + (b.p1 ? CL.map(function (c) { return '<div style="font-weight:700;font-size:14px"><b style="color:' + c.ink + '">' + esc(c.n) + '</b> : (' + b.p1.dice[c.k].join(' + ') + ') × ' + (b.p1.mult || 1) + ' = ' + fmt(b.p1.sums ? b.p1.sums[c.k] : 0) + '</div>'; }).join('') + '<div style="font-weight:800">Total : ' + fmt(b.p1.dmg) + ' dégâts</div>' : '<div class="muted">1 attaque par tranche de 5 points (au moins 1 par clan, 12 max), chaque attaque = un d20 multiplié par le chakra. Tous les dés roulent en même temps. Le Rasengan finit le travail jusqu’à 30 PV.</div><button class="btn" data-g="bp1">Lancer toutes les attaques</button>') + '</section>';
    if (b.p1) {
      h += '<section class="card"><div class="lab">Phase 2 · Rasengan</div>';
      if (!p2) h += '<div class="muted">Décompte de 3 s puis 10 s de tapes sur tous les téléphones.</div><button class="btn" data-g="bp2s">Lancer le Rasengan</button>';
      else if (!p2.done) h += '<div class="row" style="justify-content:space-between"><span style="font-weight:800">' + (t < p2.start ? 'Départ dans ' : t < p2.end ? 'En cours · ' : 'Terminé · ') + (t < p2.end ? cd(t < p2.start ? p2.start : p2.end) : '') + '</span><b class="ser" style="font-size:22px">' + fmt(st.tapsLive || 0) + ' tapes</b></div><div class="muted">1 tape = ' + fmt(p2.per || 1) + ' dégâts · −' + fmt(Math.min(p2.cap || 0, (st.tapsLive || 0) * (p2.per || 1))) + '</div><button class="btn" data-g="bp2c"' + (t < p2.end + 1200 ? ' disabled' : '') + '>Encaisser les dégâts</button>';
      else h += '<div style="font-weight:800">' + fmt(p2.taps || 0) + ' tapes × ' + fmt(p2.per || 1) + ' = ' + fmt(p2.dmg) + ' dégâts</div>';
      h += '</section>';
    }
    if (p2 && p2.done) {
      var fn = b.fin, fr = st.fin || {}, lv = fr.live, la = fr.launch, dark = 'background:#1E1A17;color:#fff;border:0;';
      if (!fn && b.dead) h += '<section class="card" style="align-items:center;' + dark + '"><div style="font-family:Mincho30,Georgia,serif;font-size:48px;color:#F7E6A8">Vaincu !</div></section>' + nextBtn();
      else if (!fn) h += '<section class="card" style="' + dark + 'gap:12px"><div class="lab" style="color:#f0a090">Le coup final</div><div class="ser" style="font-size:22px">Au tour d’Alessia</div>' +
        '<div style="font-size:14px;font-weight:600;color:#e6d9c2">Sur son téléphone : les 3 sceaux, le rythme façon osu!, le spinner, puis elle glisse vers le haut pour lancer le Rasen-shuriken. Les autres gardent le doigt sur la sphère pour lui donner leur chakra.</div>' +
        '<button class="btn" data-g="finstart">Lancer le coup final</button></section>';
      else if (!la) h += '<section class="card" style="' + dark + 'gap:10px"><div class="lab" style="color:#f0a090">Le coup final · en cours</div>' +
        (lv ? '<div class="ser" style="font-size:22px">' + (lv.phase === 'qte' ? 'Rythme · ' + Math.round(lv.prog * 100) + ' %' : lv.phase === 'spin' ? 'Spinner · chakra ' + Math.round(lv.spin * 100) + ' %' : 'Prête à lancer !') + '</div><div style="font-weight:700;color:#7FD4FF">' + fmt(lv.score) + ' pts · combo ' + lv.combo + '</div>' : '<div style="font-weight:700;color:#e6d9c2">En attente : Alessia doit toucher « Je suis prête » sur son téléphone (prénom « Alessia »).</div>') +
        '<button class="btn2" data-g="finforce">Secours : lancer l’attaque à sa place</button><button class="chip" style="align-self:flex-start;background:transparent;color:#bdae95;border-color:#5a4f45" data-g="finreset">' + (mj.finArm ? 'Confirmer ?' : 'Recommencer le coup final') + '</button></section>';
      else h += '<section class="card" style="' + dark + 'gap:10px;align-items:center;text-align:center"><div class="ser" style="font-size:26px;color:#F7E6A8">Rasen-shuriken lancé !</div><div style="font-weight:700;color:#e6d9c2">' + (la.forced ? 'Lancé par le secours' : fmt(la.res.score) + ' pts · combo max ' + la.res.maxCombo) + ' · la Nuit de la Hokage démarre seule à la fin de la cinématique.</div>' +
        '<button class="btn2" data-g="finreplay">Rejouer la cinématique</button><button class="chip" style="background:transparent;color:#bdae95;border-color:#5a4f45" data-g="finreset">' + (mj.finArm ? 'Confirmer ?' : 'Recommencer le coup final') + '</button></section>' + nextBtn();
    }
    return h;
  }
  function mHokage() {
    var h = st.hokage || {}, ph = st.photos || [], n = ph.length, v = h.view || 'ceremony', cur = hokCur();
    var hb = 'height:44px;flex:1;padding:0 8px';
    var out = '<section class="card"><div class="lab">Écran de projection</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      [['ceremony', 'Cérémonie'], ['podium', 'Podium'], ['speech', 'Ton mot'], ['slides', 'Diaporama']].map(function (x) { return '<button class="' + (v === x[0] ? 'btn' : 'btn2') + '" style="height:48px" data-g="hview" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      '</div><div class="muted" style="font-size:12px">Toucher la vue affichée la relance depuis le début (animations, première photo).</div></section>';
    out += '<section class="card"><div class="lab">Ton mot pour Alessia</div><textarea id="g-speech" rows="6" maxlength="1200" placeholder="Écris ton mot ici, il s’affichera en grand sur l’écran.">' + esc(h.speech || '') + '</textarea>' +
      '<button class="btn2" data-g="hspeech">Enregistrer le mot</button>' + (h.speech ? '<div class="muted" style="font-size:12px">Enregistré · ' + h.speech.length + ' caractères</div>' : '') + '</section>';
    out += '<section class="card"><div class="lab">Diaporama · ' + n + ' photo' + (n > 1 ? 's' : '') + '</div>' +
      (v === 'slides' ? '<div style="font-weight:800">' + (cur >= n ? 'Carte de fin « Joyeux anniversaire »' : 'Photo ' + (cur + 1) + ' / ' + n) + (h.paused ? ' · en pause' : '') + '</div>' +
        '<div class="row" style="gap:8px"><button class="btn2" style="' + hb + '" data-g="hgo" data-i="' + (cur - 1) + '"' + (cur <= 0 ? ' disabled' : '') + ' aria-label="Photo précédente">◀ Préc.</button><button class="btn2" style="' + hb + '" data-g="hpause" data-on="' + (h.paused ? 0 : 1) + '">' + (h.paused ? 'Reprendre' : 'Pause') + '</button><button class="btn2" style="' + hb + '" data-g="hgo" data-i="' + (cur + 1) + '"' + (cur >= n ? ' disabled' : '') + ' aria-label="Photo suivante">Suiv. ▶</button></div>'
        : '<div class="muted">Touche « Diaporama » ci-dessus pour démarrer à la première photo.</div>') +
      '<div class="row" style="gap:8px;align-items:center"><span class="lab" style="width:54px">Durée</span>' + [3, 5, 8].map(function (d) { return '<button class="' + ((h.dur || 5) === d ? 'btn' : 'btn2') + '" style="' + hb + '" data-g="hdur" data-d="' + d + '">' + d + ' s</button>'; }).join('') + '</div>' +
      '<div class="lab">Musique du diaporama (lien YouTube)</div><div class="row" style="gap:8px"><input id="g-hmusic" inputmode="url" placeholder="https://youtu.be/…?t=30" value="' + esc(h.music || '') + '" style="flex:1;min-width:0"><button class="btn2" style="height:44px;width:auto;padding:0 16px" data-g="hmusic">OK</button></div>' +
      '<label class="btn2" style="display:flex;align-items:center;justify-content:center;cursor:pointer">' + (mj.upl ? 'Envoi… ' + mj.upl + ' restante' + (mj.upl > 1 ? 's' : '') : 'Ajouter des photos') + '<input id="g-file" type="file" accept="image/*" multiple style="display:none"></label>' +
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">' + ph.map(function (id, i) { var on = v === 'slides' && i === cur; return '<div style="position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#e6dccb;' + (on ? 'box-shadow:0 0 0 3px #1E1A17' : '') + '"><img data-ph="' + id + '" alt="" data-g="hgo" data-i="' + i + '" style="width:100%;height:100%;object-fit:cover;cursor:pointer"><button data-g="pdel" data-id="' + id + '" aria-label="Supprimer la photo" style="position:absolute;top:4px;right:4px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(58,51,80,.8);color:#fff;font-weight:800;padding:0">×</button></div>'; }).join('') + '</div>' +
      '<div class="muted" style="font-size:12px">Touche une photo pour l’afficher. Les photos ne sont visibles qu’avec le code admin.</div></section>';
    setTimeout(loadThumbs, 0);
    return out;
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
    var ry = st && st.rythme, m = st && st.step === 1 && ry && ry.music, v = m ? yt(ry.songs[m.clan]) : null, end = v && ry.songEnd > v.start ? ry.songEnd : 0;
    var key = v ? m.clan + m.at : '', box = document.getElementById('gmusic');
    var hk = st && st.step === 6 && st.hokage, hv = hk && hk.view === 'slides' && hk.music ? yt(hk.music) : null;
    if (hv) { v = hv; end = 0; key = 'h' + hk.music + hk.viewAt; }
    if (key === musicKey) return;
    musicKey = key;
    if (box) box.remove();
    if (!v || mode !== 'ecran') return;
    box = document.createElement('div'); box.id = 'gmusic';
    box.style.cssText = 'position:fixed;right:1.4vw;bottom:1.4vw;width:20vw;aspect-ratio:16/9;z-index:40;border-radius:1vw;overflow:hidden;box-shadow:0 1vw 2vw rgba(0,0,0,.25);background:#000';
    box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + v.id + '?autoplay=1&start=' + v.start + (end ? '&end=' + end : '') + '&rel=0&playsinline=1" title="Musique" allow="autoplay; encrypted-media" style="width:100%;height:100%;border:0"></iframe>';
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
  var firedH = '';
  function fxHokage() {
    var h = st && st.step === 6 && st.hokage; if (!h || !h.viewAt) return;
    var key = h.view + h.viewAt, el0 = now() - h.viewAt;
    if (firedH === key || el0 > 3000) return;
    firedH = key;
    if (h.view === 'ceremony') setTimeout(function () { var el = root && root.querySelector('[data-hat]'); fx(el, 'burst', { r: 170 }); fx(el, 'don', { size: 220, dy: 60 }); }, Math.max(0, 1350 - el0));
    if (h.view === 'podium') setTimeout(function () { root && root.querySelectorAll('[data-crown]').forEach(function (el) { fx(el, 'burst', { r: 150 }); fx(el, 'don', { size: 200, dy: 40 }); }); }, Math.max(0, 3950 - el0));
  }
  var firedD = '';
  function fxDestin() {
    var d = st && st.step === 4 && st.destin;
    if (!d || d.stage !== 'reveal' || !d.shownAt) { root.removeAttribute('data-dfreeze'); return; }
    var key = d.shownAt + ':' + d.shown;
    if (now() - d.shownAt < 7200) root.setAttribute('data-dfreeze', key); else root.removeAttribute('data-dfreeze');
    if (firedD === key || now() - d.shownAt > 3000) return;
    firedD = key;
    var k = d.order[d.shown - 1], r = d.results[k];
    setTimeout(function () {
      var el = root && root.querySelector('[data-dr="' + k + '"]'); if (!el) return;
      if (r.roll === null) fx(el, 'pon'); else if (r.ok) { fx(el, 'burst', { r: 120 }); fx(el, 'don', { size: 170, dy: 100 }); } else fx(el, 'zuza');
    }, Math.max(0, d.shownAt + 1650 - now()));
  }
  function fxHook() {
    fxJoker(); fxRythme(); fxOmbre(); fxDestin(); fxHokage(); fxIntro(); musicSync();
    if (!st || st.step !== 0 || !st.ouv) { root.removeAttribute('data-reveal'); return; }
    var o = st.ouv, S = st.selInfo;
    if (S && S.mode === 'pick' && o.view === 'clans') {
      if (S.phase === 'locked' && S.lockAt && fired.lockAt !== S.lockAt && now() - S.lockAt < 5000) {
        fired.lockAt = S.lockAt;
        setTimeout(function () { var el = root && root.querySelector('[data-csplock]'); fx(el, 'don', { size: 190, dy: 90 }); fx(el, 'burst', { r: 140 }); }, 300);
      }
      if (S.alessia && fired.al !== S.alessia) {
        var firstAl = fired.al === undefined; fired.al = S.alessia;
        if (!firstAl) setTimeout(function () { var el = root && root.querySelector('[data-csp="' + S.alessia + '"]'); fx(el, 'burst', { r: 120 }); fx(el, 'pon', {}); }, 250);
      }
    }
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
      var wait = S && S.mode === 'pick' ? Math.max(0, 700 + Array.from((st.cris || {})[o.spot] || '').length * 45 - (now() - o.spotAt)) : 350;
      setTimeout(function () { var el = root && root.querySelector('[data-spot="' + o.spot + '"]'); fx(el, 'burst', { r: 140 }); fx(el, 'don', { size: 190, dy: 120 }); }, wait);
    }
  }
  function projOuverture() {
    var o = st.ouv || { view: 'intro' };
    if (o.view === 'intro') {
      return '<div class="pw" style="justify-content:center;gap:2vw;padding:4vw 8vw"><div class="pk" style="animation:rise .8s ease-out both">La Quête des 30 ans</div>' +
        INTRO.map(function (s, i) { var last = i === INTRO.length - 1; return '<div class="ser" style="font-size:' + (last ? '4.4vw' : '2.5vw') + ';line-height:1.3;font-weight:' + (last ? 700 : 600) + ';' + (last ? 'font-family:Mincho30,Georgia,serif;' : '') + 'animation:rise 1s ' + (0.6 + i * 2.2) + 's ease-out both">' + esc(s) + '</div>'; }).join('') + '</div>';
    }
    if (o.view === 'cris' && st.selInfo && st.selInfo.mode === 'pick') return projCris(o);
    if (o.view === 'cris') {
      return '<div class="pw">' + pHeader('Cris de guerre', 'L’Appel des clans', timerRight()) + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (c) {
        var cri = (st.cris || {})[c.k], spot = o.spot === c.k, dim = o.spot && !spot;
        return '<div data-spot="' + c.k + '" style="background:' + c.bg + ';border-radius:2.4vw;padding:2vw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4vw;text-align:center;transition:transform .4s,opacity .4s;' + (spot ? 'transform:scale(1.08);box-shadow:0 0 0 .4vw #1E1A17' : '') + (dim ? ';opacity:.4' : '') + '">' + banner(c, 27, 'vw') +
          '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:' + (spot ? '4.6vw' : '3.2vw') + ';line-height:1.05">' + (cri ? '« ' + esc(cri) + ' »' : '…') + '</div></div>';
      }).join('') + '</div></div>';
    }
    if (st.selInfo && st.selInfo.mode === 'pick') return projSel();
    // clans + révélation (tirage au sort de secours)
    var rev = revealing(), order = o.order || [], el0 = now() - (o.drawAt || 0), r = st.roster || {};
    var cols = { feu: [], foudre: [], vent: [] };
    var ids = rev ? order : Object.keys(r).filter(function (id) { return r[id].clan; }).sort(function (a, b) { return r[a].name.localeCompare(r[b].name, 'fr'); });
    ids.forEach(function (id) { if (r[id] && r[id].clan) cols[r[id].clan].push(id); });
    return '<div class="pw">' + pHeader('Les clans', 'L’Appel des clans · La Quête des 30 ans', timerRight()) + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (c) {
      return '<div style="background:' + c.bg + ';border-radius:2.4vw;padding:1.4vw 1.4vw 2vw;display:flex;flex-direction:column;align-items:center;gap:1vw;text-align:center">' + banner(c, 27, 'vw') +
        cols[c.k].map(function (id) {
          var i = order.indexOf(id), d = rev ? (1200 + i * 900 - el0) / 1000 : 0, al = id === 'alessia';
          return '<div data-rid="' + esc(id) + '" style="font-weight:800;font-size:' + (al ? '3vw' : '2.2vw') + ';line-height:1.35;' + (al ? 'font-family:Mincho30,Georgia,serif;color:#1E1A17;' : '') + (rev ? 'animation:pop .55s ' + d.toFixed(2) + 's cubic-bezier(.3,1.6,.5,1) both' : '') + '">' + esc(r[id].name) + '</div>';
        }).join('') + '</div>';
    }).join('') + '</div></div>';
  }

  function projBrief() {
    var i = bri();
    return { html: '<div class="bp"><div class="pk">' + esc(KK[i] || '') + '</div><div class="bp-sl">' + (SEAL[i] || '') + '</div><h1>' + esc(STEPN[i]) + '</h1><div class="bp-li">Le maître du jeu vous explique les règles</div><div class="bp-sc">' + pScores(false) + '</div></div>', cls: 'peach proj' };
  }
  // Cris de guerre sur l'image de groupe : une plaque par chef ; le cri mis en avant grandit et s'écrit lettre par lettre.
  function projCris(o) {
    var POS = { foudre: 17, feu: 50, vent: 83 }, spot = o.spot, fresh = spot && o.spotAt && now() - o.spotAt < 6000;
    var veils = CS_ORDER.map(function (k, i) { return '<div class="crp-veil' + (spot && spot !== k ? ' on' : '') + '" style="left:' + (i * 33.3) + '%"></div>'; }).join('');
    var pls = CS_ORDER.map(function (k) {
      var t = (st.cris || {})[k] || '', by = (st.crisBy || {})[k] || '', on = spot === k, len = t.length;
      var fs = on ? (len > 40 ? 3.2 : len > 24 ? 3.8 : 4.6) : (len > 40 ? 2 : len > 24 ? 2.3 : 2.6);
      var txt = !t ? '…' : on && fresh ? '« ' + Array.from(t).map(function (ch, i) { return '<span style="animation-delay:' + (0.5 + i * 0.045).toFixed(3) + 's">' + esc(ch) + '</span>'; }).join('') + ' »' : '« ' + esc(t) + ' »';
      return '<div class="crp' + (on ? ' spot' : spot ? ' dim' : '') + '" data-spot="' + k + '" style="left:' + POS[k] + '%;--c:' + CHEF[k].c + '"><div class="ck">' + CHEF[k].s + ' · ' + esc(clanName(k)) + '</div><div class="ct" style="font-size:' + fs + 'em">' + txt + '</div><div class="cb">' + (by ? 'écrit par ' + esc(by) : t ? '' : 'en attente du cri') + '</div></div>';
    }).join('');
    return '<div class="csp"><div class="csp-st">' + veils + '<div class="csp-top"><div class="csp-sl">吼</div><div><div class="csp-kk">L’Appel des clans · La Quête des 30 ans</div><h1>Cris de guerre</h1></div></div>' + pls + '</div></div>';
  }
  // Choix des clans sur grand écran : les 3 chefs, les prénoms arrivent en direct sous chacun.
  var cspSeen = null;
  function projSel() {
    var S = st.selInfo, ph = S.phase, mem = st.members || {}, POS = { foudre: 17, feu: 50, vent: 83 };
    var title = ph === 'closed' ? 'Trois chefs. Un seul clan.' : ph === 'alessia' ? (S.alessia ? 'Alessia rejoint le ' + clanName(S.alessia) + ' !' : 'Alessia choisit son clan…') : ph === 'open' ? 'Choisissez votre clan' : 'Les clans sont formés !';
    var sub = ph === 'alessia' ? 'La future Hokage choisit en premier' : ph === 'open' ? 'Sur vos téléphones · ' + S.cap + ' places par clan' : 'L’Appel des clans · La Quête des 30 ans';
    var first = !cspSeen, seen = {};
    var pl3 = ph === 'closed' ? '' : CS_ORDER.map(function (k) {
      var names = mem[k] || [], n = names.length, full = n >= S.cap, al = S.alessia === k;
      return '<div class="csp-pl' + (al && ph === 'alessia' ? ' al' : '') + '" data-csp="' + k + '" style="left:' + POS[k] + '%;--c:' + CHEF[k].c + '"><h3>' + esc(clanName(k)) + '<small' + (full && ph !== 'locked' ? ' class="f"' : '') + '>' + (ph === 'locked' ? n + ' ninja' + (n > 1 ? 's' : '') : full ? 'COMPLET' : n + ' / ' + S.cap) + '</small></h3><div class="csp-nm">' +
        (n ? names.map(function (x) { var id = k + ':' + x; seen[id] = 1; return '<span class="' + (x.toLowerCase() === 'alessia' ? 'a' : '') + (!first && !cspSeen[id] ? ' new' : '') + '">' + esc(x) + '</span>'; }).join('') : '<i>En attente de ninjas…</i>') + '</div></div>';
    }).join('');
    cspSeen = seen;
    return '<div class="csp"><div class="csp-st"><div class="csp-top"><div class="csp-sl">' + (ph === 'locked' ? '結' : '集') + '</div><div><div class="csp-kk">' + esc(sub) + '</div><h1' + (ph === 'locked' ? ' class="csp-lock" data-csplock="1"' : '') + '>' + esc(title) + '</h1></div></div>' + pl3 + '</div></div>';
  }
  /* ---------- PROJECTION ---------- */
  // Bandeaux des clans (images détourées, score écrit en direct sur le parchemin de droite).
  var CLB = { feu: { ar: 4.7059, cy: 54.5, ink: '#6a0c02', pre: 'du' }, foudre: { ar: 4.5113, cy: 46, ink: '#012467', pre: 'de la' }, vent: { ar: 4.898, cy: 43, ink: '#334324', pre: 'du' } };
  // w : largeur (nombre) dans l'unité u ('vw' ou 'px'), max : largeur maximale en px (facultatif).
  function banner(c, w, u, o) {
    o = o || {}; var b = CLB[c.k], sc = o.score === undefined ? st.scores[c.k] : o.score, big = String(sc).length > 2;
    var k = (big ? 0.38 : 0.47) / b.ar, fs = o.max ? 'min(' + (w * k).toFixed(2) + u + ',' + (o.max * k).toFixed(1) + 'px)' : (w * k).toFixed(2) + u;
    var W = o.max ? 'min(' + w + u + ',' + o.max + 'px)' : w + u;
    return '<div class="cban" style="position:relative;flex-shrink:0;width:' + W + ';aspect-ratio:' + b.ar + ';' + (o.style || '') + '">' +
      '<img src="/clans/' + c.k + '.webp?v=1" alt="Clan ' + b.pre + ' ' + esc(c.n) + '" style="position:absolute;inset:0;width:100%;height:100%;display:block">' +
      (o.noScore ? '' : '<div style="position:absolute;z-index:2;left:85.6%;top:' + b.cy + '%;transform:translate(-50%,-50%);display:flex;align-items:baseline;gap:.16em;color:' + b.ink + ';font-family:Gothic30,Nunito,Arial,sans-serif;font-weight:900;line-height:1;font-size:' + fs + ';white-space:nowrap"><span>' + sc + '</span><span style="font-size:.36em;font-weight:900;letter-spacing:.02em">PTS</span></div>') +
      (jk(c.k) === 'on' && !o.noJoker ? '<span data-jk="' + c.k + '" class="ser" style="position:absolute;z-index:3;right:2%;top:-6%;background:#1E1A17;color:#F7E6A8;border-radius:.6em;padding:.15em .55em;font-size:' + (o.max ? 'min(' + (w * 0.045).toFixed(2) + u + ',' + (o.max * 0.045).toFixed(1) + 'px)' : (w * 0.045).toFixed(2) + u) + ';box-shadow:0 .2em .6em rgba(0,0,0,.3)">x2</span>' : '') + '</div>';
  }
  function pScores(big) {
    if (!big) return '<div style="display:flex;gap:1.6vw;justify-content:center;align-items:center">' + CL.map(function (c) { return banner(c, 29, 'vw'); }).join('') + '</div>';
    return '<div class="grid3" style="gap:2vw;' + (big ? 'flex:1' : '') + '">' + CL.map(function (c) {
      var js = jk(c.k);
      return '<div style="background:' + c.bg + ';border:.25vw solid #fff;border-radius:2.4vw;display:flex;' + (big ? 'flex-direction:column;justify-content:center' : 'flex-direction:row;justify-content:space-between;padding:1vw 2vw') + ';align-items:center;gap:.6vw;box-shadow:0 1vw 2vw rgba(58,51,80,.12)">' +
        '<div class="row" style="gap:.8vw">' + ico(c, big ? '64' : '36') + '<span class="ser" style="font-size:' + (big ? '2.8vw' : '2vw') + ';color:' + c.ink + '">' + esc(c.n) + '</span></div>' +
        '<span class="ser" style="font-size:' + (big ? '8.5vw' : '3.6vw') + ';line-height:1">' + st.scores[c.k] + '</span>' +
        (js === 'on' ? '<span data-jk="' + c.k + '" class="ser" style="background:#1E1A17;color:#F7E6A8;border-radius:1vw;padding:.3vw 1vw;font-size:' + (big ? '2.4vw' : '1.8vw') + '">x2</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  // Habillage japonais : sceau rouge, kanji vertical et coup de pinceau (style « Washi & encre »).
  var SEAL = { 0: '集', 1: '一', 7: '二', 2: '三', 3: '四', 4: '五', 5: '戦', 6: '祝' };
  var VK = { 0: '一族', 1: '舞の術', 7: '音の術', 2: '中忍試験', 3: '影絵', 4: '忍道', 5: '決戦', 6: '火影' };
  var KK = { 0: '始まり · La Quête des 30 ans', 1: '第一の試練 · Épreuve 1', 7: '第二の試練 · Épreuve 2', 2: '第三の試練 · Épreuve 3', 3: '第四の試練 · Épreuve 4', 4: '第五の試練 · Épreuve 5', 5: '決戦 · Épreuve finale', 6: '祝 · La fête' };
  function pHeader(title, kicker, right) {
    var s = st ? st.step : 0;
    return '<div><div style="display:flex;align-items:flex-end;justify-content:space-between;gap:2vw;padding-right:4vw"><div style="display:flex;align-items:flex-end;gap:1.6vw"><div class="pseal">' + (SEAL[s] || '忍') + '</div><div><div class="pk">' + kicker + '</div><h1 class="pt">' + title + '</h1></div></div>' + (right || '') + '</div><div class="pbrush"></div></div><div class="pvk">' + (VK[s] || '') + '</div>';
  }
  function timerRight() { return st.timer && now() < st.timer.end + 1000 ? cd(st.timer.end, 'pclock') : ''; }
  function vProj() {
    if (!st) return { html: '', cls: 'peach proj' };
    var s = st.step, h = '', cls = 'peach proj';
    if ((s === 4 || s === 5) && !sanjPre) { sanjPre = new Image(); sanjPre.src = SANJ; ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'village', 'village-bg'].forEach(function (k) { new Image().src = '/sanjubi/' + k + '.webp'; }); } // préchargement avant la bataille
    if (bri() !== null) return projBrief();
    if (s === 5 && introOn()) return projIntro();
    if (s === 6) return projHokage();
    if (s === 7) return projEcho();
    if (s === 5) return projBoss();
    if (s === 0) return { html: projOuverture(), cls: cls };
    if (s === 1) {
      var ry = st.rythme || {}, res = ry.results || {};
      h = pHeader('K-pop no Jutsu', 'Épreuve 1 / 6', timerRight()) + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (c) {
        var q = (st.seqs || {})[c.k] || [], cur = ry.cur === c.k, r = res[c.k], dim = ry.cur && !cur;
        return '<div data-rr="' + c.k + '" style="background:' + c.bg + ';border-radius:2.4vw;padding:1.6vw;display:flex;flex-direction:column;gap:1vw;transition:transform .4s,opacity .4s;' + (cur ? 'transform:scale(1.04);box-shadow:0 0 0 .4vw #1E1A17' : '') + (dim ? ';opacity:.45' : '') + '"><div class="row" style="gap:.8vw">' + ico(c, '40') + '<span class="ser" style="font-size:2.4vw;color:' + c.ink + '">' + esc(c.n) + '</span><span class="ser" style="margin-left:auto;font-size:2.4vw">' + st.scores[c.k] + '</span></div>' +
          (cur ? '<div class="ser" style="text-align:center;background:#1E1A17;color:#fff;border-radius:1vw;padding:.5vw;font-size:1.7vw">' + (ry.stage === 'vote' ? 'Vote du public · ' + (st.rateCount || 0) : 'En piste !') + '</div>' : '') +
          (r ? '<div style="display:flex;flex-direction:column;align-items:center;gap:.3vw;background:#fff;border-radius:1.2vw;padding:.8vw"><span class="row" style="gap:.2vw">' + stars(r.avg, 34) + '</span><span class="ser" style="font-size:2vw">' + String(r.avg).replace('.', ',') + ' / 5 · +' + r.pts + (r.joker ? ' (x2)' : '') + '</span></div>' : '') +
          (q.length ? q.map(function (k, i) { return '<div class="row" style="gap:1vw;background:#fff;border-radius:1.2vw;padding:.4vw 1vw;color:#1E1A17">' + fig(k, 62, c.k) + '<span class="ser" style="font-size:1.7vw">' + (i + 1) + '. ' + esc(MK[k].t) + '</span></div>'; }).join('') : '<div style="font-weight:800;font-size:1.6vw;color:#6b5e52">Chorégraphie en préparation…</div>') + '</div>';
      }).join('') + '</div>';
    } else if (s === 2) {
      var sv = st.savoir, q = sv.list[sv.idx];
      h = pHeader('L’Examen Chûnin', 'Épreuve 3 / 6 · Sensei Alessia', timerRight()) +
        '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.4vw"><div class="pk">' + (q ? 'Question ' + (sv.idx + 1) + ' / ' + sv.list.length : '') + '</div><div class="ser" style="font-size:4.2vw;line-height:1.2">' + (q ? esc(q.q) : 'Les questions arrivent…') + '</div></div>' + pScores(false);
    } else if (s === 3) {
      var o = st.ombre, c = o.cur, cnt = o.count || {}, tnow = now();
      var endAll = o.startAt ? o.startAt + 600000 : 0;
      var running = c && !c.done && c.mime !== null && tnow <= c.end, timeout = c && !c.done && c.mime !== null && tnow > c.end;
      var finished = endAll && tnow > endAll && cnt.feu === cnt.foudre && cnt.foudre === cnt.vent && (!c || c.done);
      var right = '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.6vw">' + (running ? cdu(c.end, 'pclock') : '') + (endAll && !finished ? '<span class="pk">Épreuve ' + cd(endAll) + '</span>' : '') + '</div>';
      var mid;
      if (finished) mid = '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:7vw">Fin de l’épreuve !</div>';
      else if (running) mid = '<div class="pk">Mimeur · ' + esc(c.mname || '') + ' · clan ' + CLB[c.clan].pre + ' ' + esc(CK[c.clan].n) + '</div><div class="row" style="gap:2vw">' + CL.map(function (k) { var red = c.red[k.k]; return '<div data-ot="' + k.k + '" style="width:18vw;height:9vw;border-radius:2vw;display:flex;align-items:center;justify-content:center;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:2.6vw;color:#fff;transition:background .3s;background:' + (red ? '#B8445F' : '#2F7D64') + '">' + esc(k.n) + '</div>'; }).join('') + '</div>';
      else if (c && (c.done || timeout)) mid = '<div data-oban="1" style="display:flex;flex-direction:column;align-items:center;gap:1vw;animation:pop .6s ease-out both"><div class="pk" style="font-size:1.8vw">' + (c.winner ? 'Trouvé par le clan ' + CLB[c.winner].pre + ' ' + esc(CK[c.winner].n) + ' !' : timeout ? 'Temps écoulé !' : 'Personne n’a trouvé') + '</div>' +
          '<div class="ser" style="font-size:6vw;line-height:1.1">' + esc(st.mimes[c.mime]) + '</div>' + (c.winner ? '<div class="ser" style="font-size:2.2vw;color:#2F6F5E">' + (c.winner === c.clan ? esc(CK[c.clan].n) + ' +2' : esc(CK[c.clan].n) + ' +1 · ' + esc(CK[c.winner].n) + ' +1') + '</div>' : '') + '</div>';
      else if (c) mid = '<div class="ser" style="font-size:3.4vw">' + esc(c.mname || 'Le mimeur') + ' choisit son mime…</div>';
      else mid = '<div class="ser" style="font-size:3.4vw">Prochain mime…</div>';
      h = pHeader('Le Théâtre des ombres', 'Épreuve 4 / 6 · Passages : ' + CL.map(function (k) { return esc(k.n) + ' ' + (cnt[k.k] || 0); }).join(' · '), right) +
        '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6vw;text-align:center">' + mid + '</div>' + pScores(false);
    } else if (s === 4) {
      return projDestin();
    }
    return { html: '<div class="pw">' + h + '</div>', cls: cls };
  }
  function projDestin() {
    var d = st.destin, sc = st.destinScenes[d.c], res = d.results || {}, tnow = now();
    var cols = ['#2f6b45', '#9a6a12', '#b5302a'], inner;
    var head = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:2vw"><div><div class="sk" style="font-size:1.1vw">Épreuve 5 / 6 · La Voie du ninja · Carrefour ' + ['一', '二', '三'][d.c] + '</div><div style="font-size:4.4vw;font-weight:700;line-height:1.05;margin-top:.4vw">' + esc(sc.title) + '</div></div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.6vw">' + (d.c === 2 ? '<span class="stamp" style="font-size:1.4vw;padding:.4vw 1vw;border-width:.25vw;font-family:Gothic30,Nunito,Arial,sans-serif;font-weight:800;transform:rotate(4deg)">POINTS ×2</span>' : '') + (d.stage === 'vote' && tnow <= d.voteEnd ? cdu(d.voteEnd, 'pclock') : '') + '</div></div>';
    if (d.stage !== 'reveal') {
      inner = head + '<div style="font-style:italic;font-size:1.9vw;line-height:1.45;max-width:80%">' + esc(sc.text) + '</div>' +
        '<div style="display:flex;gap:3vw;justify-content:center;flex:1;align-items:flex-start">' + sc.opts.map(function (o, i) {
          return '<div class="scl" style="max-width:none;width:18vw"><i></i><b style="min-height:24vw;padding:1.6vw 1vw;gap:1.2vw"><span style="font-size:3.4vw;color:' + cols[i] + '">' + ['一', '二', '三'][i] + '</span><span style="font-size:1.7vw;line-height:1.3">' + esc(o.t) + '</span>' + dTag(i, cols[i], '1vw', '3.4vw') + '</b><i></i></div>';
        }).join('') + '</div>' +
        '<div style="display:flex;gap:2vw;justify-content:center">' + CL.map(function (k) { var ok = !!(st.destinVotes || {})[k.k]; return '<span class="pill" style="font-size:1.4vw;padding:.5vw 1.4vw;background:' + (ok ? k.bg : 'rgba(255,255,255,.5)') + ';color:' + k.ink + '">' + esc(k.n) + (d.stage === 'story' ? ' · écoute le récit' : ok ? ' a choisi' : ' réfléchit…') + '</span>'; }).join('') + '</div>';
    } else {
      var lastK = d.order[d.shown - 1], wheelOn = false;
      inner = head + '<div class="grid3" style="gap:2vw;flex:1">' + CL.map(function (k) {
        var pos = d.order.indexOf(k.k), shown = pos < d.shown, r = res[k.k];
        if (!shown) return '<div style="border:.2vw dashed #8a5a2b;border-radius:1.6vw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1vw;opacity:.7"><div class="ser" style="font-size:2.4vw;color:' + k.ink + '">' + esc(k.n) + '</div><div class="stamp" style="width:6vw;height:6vw;font-size:3vw;opacity:.5">運</div><div style="font-style:italic;font-size:1.4vw">Le destin attend…</div></div>';
        var latest = k.k === lastK, rs = latest ? rollSpec(d.shownAt) : '', del = latest ? Math.max(0, 1.6 - (tnow - d.shownAt) / 1000) : 0;
        if (latest && r.gage && tnow - d.shownAt < 7200) wheelOn = true;
        return '<div data-dr="' + k.k + '" style="background:rgba(255,255,255,.45);border:.2vw solid ' + k.ink + ';border-radius:1.6vw;padding:1.4vw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.9vw;text-align:center">' +
          '<div class="ser" style="font-size:2.2vw;color:' + k.ink + '">' + esc(k.n) + ' · ' + ['一', '二', '三'][' ABC'.indexOf(r.opt) - 1] + '</div><div style="font-size:1.3vw;line-height:1.3">' + esc(sc.opts[' ABC'.indexOf(r.opt) - 1].t) + '</div>' +
          (r.roll === null ? '<div class="stamp" style="width:7vw;height:7vw;font-size:3.6vw;animation:stampin .5s ease-out both">成</div>' : '<div style="display:flex;align-items:center;gap:1.2vw">' + d3(r.roll, '14vw', latest ? d.shownAt : 0, k.k) + '<div class="stamp" style="width:5.6vw;height:5.6vw;font-size:3vw;' + (r.ok ? '' : 'border-color:#2b1d12;color:#2b1d12;') + 'animation:stampin .5s ' + del.toFixed(2) + 's ease-out both">' + (r.ok ? '成' : '敗') + '</div></div>') +
          (calcTxt(r) ? '<div style="font:800 1.3vw Gothic30,Nunito,Arial,sans-serif;animation:fadeup .5s ' + del.toFixed(2) + 's both">' + esc(calcTxt(r)) + '</div>' : '') +
          '<div style="font-style:italic;font-size:1.35vw;line-height:1.4;animation:fadeup .5s ' + del.toFixed(2) + 's both">' + esc(r.text) + '</div>' +
          '<div style="font:800 1.8vw Gothic30,Nunito,Arial,sans-serif;color:' + (r.pts > 0 ? '#2f6b45' : r.pts < 0 ? '#b5302a' : '#8a5a2b') + ';animation:fadeup .5s ' + del.toFixed(2) + 's both">' + (r.pts > 0 ? '+' : '') + r.pts + (r.double ? ' (×2)' : '') + '</div>' +
          (r.gage && !(latest && tnow - d.shownAt < 7200) ? '<div style="font-size:1.25vw;line-height:1.35;color:#b5302a;font-weight:700">Gage : ' + emo(r.gage) + '</div>' : '') + '</div>';
      }).join('') + '</div>' + (d.c === 2 && d.shown >= 3 ? '<div style="text-align:center;font-style:italic;font-size:1.9vw;line-height:1.4">' + esc(st.destinOutro) + '</div>' : '');
      if (wheelOn) {
        var r2 = res[lastK], startIn = (d.shownAt + 1800 - tnow) / 1000;
        inner += '<div style="position:absolute;inset:0;background:rgba(43,29,18,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vw;color:#f3e7cc;animation:fadein .4s ' + Math.max(0, startIn - 0.4).toFixed(2) + 's both"><div class="sk" style="color:#e9d6ad;font-size:1.4vw">Gage pour le clan ' + CLB[lastK].pre + ' ' + esc(CK[lastK].n) + '</div>' + wheelSvg(r2.gageIdx, '30vw', startIn) +
          '<div style="font-size:2.2vw;max-width:70%;text-align:center;line-height:1.35;animation:fadeup .6s ' + (startIn + 4.1).toFixed(2) + 's both">' + emo(r2.gage) + '</div></div>';
      }
    }
    return { cls: 'dark proj', html: '<div class="pw" style="padding:0;gap:0;background:#2b211a"><div class="rod" style="margin:1.2vw 2vw 0"></div><div class="paper" style="margin:0 3vw;padding:2.2vw 3vw;gap:1.6vw">' + inner + '</div><div class="rod" style="margin:0 2vw 1.2vw"></div></div>' };
  }

  /* ---------- Le Réveil de Sanjûbi : cinématique de ~25 s avant la bataille ---------- */
  var INTRO_MS = 25500, SHOT_MS = 3200;
  var SHOTS = [
    ['r1', '50% 40%', 'Au cœur de la nuit, une ombre se dresse sur le village…'],
    ['r2', '50% 35%', 'Un hurlement déchire le ciel.'],
    ['r3', '40% 45%', 'Les flammes dévorent les toits.'],
    ['r4', '60% 45%', 'Il a senti l’odeur des 30 bougies.'],
    ['r5', '50% 18%', 'Trente queues. Trente flammes. Une seule colère.'],
    ['r6', '50% 50%', 'Sanjûbi s’est réveillé.']
  ];
  function introOn() { var b = st && st.step === 5 && st.boss; return !!(b && b.intro && now() - b.intro < INTRO_MS); }
  function projIntro() {
    var el = (now() - st.boss.intro) / 1000, h = '';
    SHOTS.forEach(function (x, i) {
      var d = (i * SHOT_MS / 1000 - el).toFixed(2), last = i === SHOTS.length - 1;
      h += '<div style="position:absolute;inset:0;opacity:0;animation:ishot ' + ((SHOT_MS + 800) / 1000) + 's ' + d + 's ease-in-out both">' +
        '<img src="/sanjubi/' + x[0] + '.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:' + x[1] + ';animation:' + (i % 2 ? 'ikbB' : 'ikbA') + ' ' + ((SHOT_MS + 800) / 1000) + 's ' + d + 's linear both">' +
        '<div style="position:absolute;left:0;right:0;bottom:12vh;text-align:center;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:' + (last ? '5.4vw' : '3.4vw') + ';color:#fff;text-shadow:0 .3vw 1.6vw rgba(0,0,0,.9);padding:0 8vw;opacity:0;animation:icap ' + ((SHOT_MS + 800) / 1000) + 's ' + d + 's ease-out both">' + esc(x[2]) + '</div></div>';
    });
    var t0 = (SHOTS.length * SHOT_MS / 1000 - el).toFixed(2), f6 = ((SHOTS.length - 1) * SHOT_MS / 1000 - el).toFixed(2);
    h += '<div style="position:absolute;inset:0;background:#fff;opacity:0;animation:flash .9s ' + f6 + 's ease-out both;pointer-events:none"></div>';
    h += '<div style="position:absolute;inset:0;opacity:0;animation:fadein 1s ' + t0 + 's ease-out both"><img src="/sanjubi/village.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:ikbA 7s ' + t0 + 's linear both"><div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(20,10,20,.35),rgba(20,10,20,.85))"></div>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6vw;text-align:center"><div style="font:800 1.6vw Gothic30,Nunito,sans-serif;letter-spacing:.3em;color:#F7E6A8;opacity:0;animation:rise .8s ' + (+t0 + 1.2).toFixed(2) + 's ease-out both">ÉPREUVE FINALE</div>' +
      '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:8vw;line-height:1;color:#fff;text-shadow:0 .4vw 2vw rgba(0,0,0,.8);animation:pop .7s ' + (+t0 + 0.4).toFixed(2) + 's cubic-bezier(.3,1.5,.5,1) both">La Bataille<br>des 30 queues</div></div></div>';
    h += '<div style="position:absolute;left:0;right:0;top:0;height:7vh;background:#000;z-index:5"></div><div style="position:absolute;left:0;right:0;bottom:0;height:7vh;background:#000;z-index:5"></div>';
    return { cls: 'dark proj', html: '<div data-introwrap style="position:absolute;inset:0;overflow:hidden;background:#000">' + h + '</div>' };
  }
  var firedI = '';
  function fxIntro() {
    if (!introOn()) { root.removeAttribute('data-intro'); return; }
    var at = st.boss.intro; root.setAttribute('data-intro', String(at));
    if (firedI === String(at)) return; firedI = String(at);
    var el = now() - at;
    [[(SHOTS.length - 1) * SHOT_MS + 150, 'don'], [SHOTS.length * SHOT_MS + 500, 'don']].forEach(function (x) {
      if (x[0] < el) return;
      setTimeout(function () { var w = root && root.querySelector('[data-introwrap]'); if (!w || !introOn()) return; fx(w, x[1], { size: 300 }); w.style.animation = 'none'; void w.offsetWidth; w.style.animation = 'ishake .5s ease-out'; }, x[0] - el);
    });
  }
  // Bataille des 30 queues : toute la projection est dessinée par l'arène (public/finale.js) sur un canvas qui ne change pas.
  function projBoss() { return { html: '<div class="arena"><div class="arena-in"><canvas id="arena-cv" aria-label="La Bataille des 30 queues"></canvas><canvas id="arena-fx" aria-hidden="true"></canvas></div></div>', cls: 'dark proj' }; }
  // Sorts des clans : PixiJS (MIT) et les planches d'effets ne sont chargés que sur l'écran de projection.
  var spellsP = null;
  function loadSpells() {
    if (spellsP) return spellsP;
    var add = function (src) { return new Promise(function (ok, ko) { var sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = ko; document.head.appendChild(sc); }); };
    spellsP = (window.PIXI ? Promise.resolve() : add('/vendor/pixi.min.js?v=742')).then(function () { return window.Sorts ? null : add('/sorts.js?v=2'); });
    return spellsP;
  }
  var arena = null;
  function syncArena() {
    var on = mode === 'ecran' && st && st.step === 5 && bri() === null && !introOn() && window.Finale;
    var el = on && document.getElementById('arena-cv');
    if (!el) { if (arena) { arena.destroy(); arena = null; } return; }
    if (!arena || arena.cv !== el) {
      if (arena) arena.destroy();
      arena = new Finale.Arena(el, { now: now, sanj: SANJ, bg: '/sanjubi/village-bg.webp', portrait: '/clans/alessia-portrait.webp', onEnd: function () { if (st && st.step === 5 && mode === 'ecran') act('step', { i: 6 }); } });
      var ar = arena; loadSpells().then(function () { var fxc = document.getElementById('arena-fx'); if (ar === arena && fxc) ar.attachSpells(fxc); }).catch(function () {});
    }
    arena.update(st);
  }
  function hokCur() {
    var h = st.hokage || {}, n = (st.photos || []).length, d = (h.dur || 5) * 1000;
    return Math.min(n, h.paused ? (h.idx || 0) : (h.idx || 0) + Math.floor(Math.max(0, now() - (h.idxAt || 0)) / d));
  }
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  // Pluie de confettis (positions fixes pour que l'écran ne se redessine pas à chaque rafraîchissement).
  function confetti(n) {
    var cols = ['#F9C3AE', '#F7E3A0', '#BFE3D4', '#F4C6D3', '#C8372D', '#F7E6A8', '#7FB6F0'], h = '';
    for (var i = 0; i < n; i++) h += '<i style="position:absolute;top:0;left:' + (rnd(i) * 100).toFixed(1) + '%;width:' + (0.6 + rnd(i + 50) * 0.7).toFixed(2) + 'vw;height:' + (1 + rnd(i + 90) * 0.9).toFixed(2) + 'vw;background:' + cols[i % cols.length] + ';border-radius:.2vw;opacity:.9;animation:conf ' + (4 + rnd(i + 7) * 4).toFixed(2) + 's ' + (rnd(i + 3) * 6).toFixed(2) + 's linear infinite both"></i>';
    return '<div aria-hidden="true" style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:5">' + h + '</div>';
  }
  function letters(txt, start, step) {
    var k = 0;
    return txt.split(' ').map(function (w) { return '<span style="display:inline-block;white-space:nowrap">' + w.split('').map(function (ch) { return '<span style="display:inline-block;animation:rise .5s ' + (start + (k++) * step).toFixed(2) + 's cubic-bezier(.3,1.6,.5,1) both">' + esc(ch) + '</span>'; }).join('') + '</span>'; }).join(' ');
  }
  var CROWN = '<svg viewBox="0 0 100 70" style="width:100%;height:auto;display:block" aria-hidden="true"><path d="M8 60 L4 16 L28 36 L50 6 L72 36 L96 16 L92 60 Z" fill="#F7C948" stroke="#8a5a00" stroke-width="4" stroke-linejoin="round"/><rect x="8" y="56" width="84" height="10" rx="3" fill="#E5A92A" stroke="#8a5a00" stroke-width="4"/><circle cx="50" cy="38" r="6" fill="#C8372D"/><circle cx="26" cy="46" r="4.5" fill="#7FB6F0"/><circle cx="74" cy="46" r="4.5" fill="#BFE3D4"/></svg>';
  function projHokage() {
    var v = (st.hokage && st.hokage.view) || 'ceremony';
    if (v === 'podium') return projPodium();
    if (v === 'speech') return projSpeech();
    if (v === 'slides') return projSlides();
    return { cls: 'peach proj', html: '<div class="pw" style="flex-direction:row;align-items:center;gap:5vw;position:relative"><div style="position:relative;width:32vw;flex-shrink:0;padding-top:6vw">' +
      '<div style="background:#fff;padding:1.4vw 1.4vw 5vw;transform:rotate(-3deg);box-shadow:0 1.4vw 3vw rgba(58,51,80,.22);position:relative"><img src="/photo.jpg" alt="Alessia" style="width:100%;aspect-ratio:1;object-fit:cover;display:block"><div style="position:absolute;bottom:1vw;left:0;right:0;text-align:center;font-family:Mincho30,Georgia,serif;font-weight:700;font-size:3vw">Hokage Alessia</div></div>' +
      '<svg data-hat width="80%" viewBox="0 0 300 150" aria-hidden="true" style="position:absolute;top:0;left:10%;animation:drop 1.1s .3s cubic-bezier(.3,1.4,.5,1) both"><path d="M150 10 L 290 120 Q 150 150 10 120 Z" fill="#fff" stroke="#1E1A17" stroke-width="5" stroke-linejoin="round"/><path d="M150 10 L 222 66 Q 150 82 78 66 Z" fill="#C8372D"/><text x="150" y="112" text-anchor="middle" font-family="serif" font-size="40" font-weight="700" fill="#C8372D">火</text></svg></div>' +
      '<div style="flex:1;display:flex;flex-direction:column;gap:1.6vw"><div class="pk" style="animation:rise .8s 1.2s ease-out both">Sanjûbi est vaincu</div><h1 class="pt" style="font-size:6.6vw;line-height:1.1">' + letters('Alessia', 1.5, 0.07) + '<br>' + letters('est Hokage !', 2.05, 0.07) + '</h1><div class="ser" style="font-size:2.4vw;font-weight:600;line-height:1.3;animation:rise .8s 3.1s ease-out both">L’élève de Kakashi a 30 ans et veille désormais sur le village.</div></div>' + confetti(70) + '</div>' };
  }
  function projPodium() {
    var sc = st.scores, r = st.roster || {}, ranked = CL.slice().sort(function (a, b) { return sc[b.k] - sc[a.k]; });
    var rank = {}; CL.forEach(function (c) { rank[c.k] = 1 + CL.filter(function (o) { return sc[o.k] > sc[c.k]; }).length; });
    var winners = CL.filter(function (c) { return rank[c.k] === 1; });
    var H = { 1: 22, 2: 15, 3: 10 }, D = { 1: 2.6, 2: 1.4, 3: 0.3 };
    var cols = [ranked[1], ranked[0], ranked[2]].map(function (c) {
      var rk = rank[c.k], d = D[rk], names = Object.keys(r).filter(function (id) { return r[id].clan === c.k; }).map(function (id) { return r[id].name; }).sort(function (a, b) { return a.localeCompare(b, 'fr'); });
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1vw;text-align:center">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:.6vw;animation:rise .7s ' + (d + 0.5).toFixed(1) + 's ease-out both">' +
        (rk === 1 ? '<div data-crown style="width:9vw;animation:crown 1s 3.3s cubic-bezier(.3,1.4,.5,1) both">' + CROWN + '</div>' : '') + banner(c, rk === 1 ? 26 : 22, 'vw', { noJoker: true, score: sc[c.k] }) +
        '<div style="font-weight:700;font-size:1.3vw;line-height:1.35;max-width:24vw;color:#1E1A17">' + names.map(esc).join(' · ') + '</div></div>' +
        '<div style="width:100%;height:' + H[rk] + 'vw;background:' + c.bg + ';border:.3vw solid #fff;border-bottom:0;border-radius:1.6vw 1.6vw 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4vw;transform-origin:bottom;animation:grow .9s ' + d.toFixed(1) + 's cubic-bezier(.3,1.3,.5,1) both;box-shadow:0 1vw 2vw rgba(58,51,80,.15)">' +
        '<span class="ser" style="font-size:' + (rk === 1 ? '7vw' : '5vw') + ';line-height:1;color:' + c.ink + '">' + rk + '</span></div></div>';
    }).join('');
    var title = winners.length > 1 ? 'Égalité au sommet : ' + winners.map(function (c) { return c.n; }).join(' et ') + ' !' : 'Victoire du clan ' + CLB[winners[0].k].pre + ' ' + winners[0].n + ' !';
    return { cls: 'peach proj', html: '<div class="pw" style="gap:1.6vw;position:relative"><div style="display:flex;flex-direction:column;gap:.6vw"><div class="pk">Le podium des clans</div><h1 class="pt" style="font-size:4.6vw;animation:rise .8s 3.9s ease-out both">' + esc(title) + '</h1></div>' +
      '<div style="flex:1;display:flex;align-items:flex-end;gap:2vw;padding:0 4vw;border-bottom:.4vw solid #1E1A17">' + cols + '</div></div>' };
  }
  function projSpeech() {
    var t = ((st.hokage && st.hokage.speech) || '').trim() || '…';
    var fs = t.length < 180 ? '3.4vw' : t.length < 420 ? '2.6vw' : t.length < 750 ? '2.1vw' : '1.75vw';
    return { cls: 'peach proj', html: '<div class="pw" style="justify-content:center;align-items:center;padding:4vw 9vw"><div style="background:#fff;border-radius:2.4vw;padding:3.6vw 4.6vw;max-width:80vw;box-shadow:0 1.6vw 4vw rgba(58,51,80,.2);transform:rotate(-1deg);animation:rise 1s ease-out both">' +
      '<div class="pk" style="margin-bottom:1.6vw">Un mot pour Alessia</div><div class="ser" style="font-size:' + fs + ';line-height:1.45;font-weight:600;white-space:pre-wrap">' + esc(t) + '</div></div></div>' };
  }
  function projSlides() {
    var ph = st.photos || [], n = ph.length, h = st.hokage, cur = hokCur();
    if (cur >= n) return { cls: 'dark proj', html: '<div class="pw" style="justify-content:center;align-items:center;text-align:center;gap:2.4vw;position:relative">' + confetti(80) +
      '<div style="font-family:Mincho30,Georgia,serif;font-weight:700;font-size:10vw;line-height:1;color:#F7E6A8;animation:pop 1s ease-out both;position:relative;z-index:6">Joyeux anniversaire<br>Alessia ' + emo('🫰') + '</div><div class="ser" style="font-size:2.6vw;animation:rise .8s 1s ease-out both;position:relative;z-index:6">30 ans · Hokage du village</div></div>' };
    var id = ph[cur], rot = cur % 2 ? 2.4 : -2.4;
    setTimeout(function () { var img = root && root.querySelector('img[data-sl]'); if (img && !img.src) photoUrl(id).then(function (u) { img.src = u; }).catch(function () {}); if (cur + 1 < n) photoUrl(ph[cur + 1]).catch(function () {}); }, 0);
    return { cls: 'dark proj', html: '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#4a3f66,#231c33);display:flex;align-items:center;justify-content:center">' +
      '<div style="background:#fff;padding:1.1vw 1.1vw 4vw;transform:rotate(' + rot + 'deg);box-shadow:0 2vw 4vw rgba(0,0,0,.45);animation:fadein .8s ease-out both"><div style="overflow:hidden;display:flex"><img data-sl="' + id + '" alt="" style="display:block;max-height:76vh;max-width:74vw;animation:kb ' + ((h.dur || 5) + 1) + 's linear both"></div></div>' +
      '<div style="position:absolute;left:2vw;bottom:1.6vw;font:800 1.3vw Gothic30,Nunito,Arial,sans-serif;color:rgba(255,255,255,.55)">' + (cur + 1) + ' / ' + n + (h.paused ? ' · pause' : '') + '</div></div>' };
  }

  /* ---------- interactions ---------- */
  function onDown(e) {
    var fh = e.target.closest('#fh-b');
    if (fh) { e.preventDefault(); pl.holding = true; pl.gaveT = Date.now(); fh.classList.add('on'); var stop = function () { pl.holding = false; fh.classList.remove('on'); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); }; window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop); return; }
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
    if (g === 'csgo') { var sp = root.querySelector('.cs-splash'); pl.csGo = true; if (sp) sp.classList.add('off'); syncHtml(); return; }
    if (g === 'csnop') return;
    if (g === 'fqgo') { fqStart(); return; }
    if (g === 'finstart') { act('finStart'); return; }
    if (g === 'finforce') { act('finForce'); return; }
    if (g === 'finreplay') { act('finReplay'); return; }
    if (g === 'finreset') { if (mj.finArm) { mj.finArm = false; act('finReset'); } else { mj.finArm = true; lastHtml = ''; draw(); setTimeout(function () { mj.finArm = false; lastHtml = ''; draw(); }, 3000); } return; }
    if (g === 'brief') { act('brief', { i: +d('i') }); return; }
    if (g === 'briefGo') { act('briefGo'); return; }
    if (g === 'briefX') { act('briefCancel'); return; }
    if (g === 'jkinfo') { pl.jkOpen = !pl.jkOpen; lastHtml = ''; draw(); return; }
    if (g === 'criidea') { var cin = document.getElementById('g-cri'), cc = myClan(); if (cin && cc) { cin.value = CRI_IDEAS[cc.k][+d('i')]; cin.focus(); } return; }
    if (g === 'cssel') { csSelect(d('k')); return; }
    if (g === 'cschange') { pl.csChange = true; pl.csGo = true; pl.csK = st.clan; lastHtml = ''; draw(); return; }
    if (g === 'cspick') {
      var ck = d('k');
      if (ck === st.clan) { pl.csChange = false; pl.csK = null; lastHtml = ''; draw(); return; }
      pl.csBusy = true; b.disabled = true;
      req('/api/game/pick', { method: 'POST', body: { name: myName(), clan: ck } }).then(function () { pl.csBusy = false; pl.csChange = false; pl.csK = null; pl.csAt = Date.now(); poll(); })
        .catch(function (er) { pl.csBusy = false; A.toast(er && er.code === 'full' ? 'Ce clan vient d’être complété' : er && er.code === 'closed' ? 'Le choix des clans est fermé' : A.errMsg(er)); lastHtml = ''; poll(); });
      return;
    }
    if (g === 'selph') { act('selPhase', { p: d('v') }); return; }
    if (g === 'seln') { act('selN', { n: Math.max(0, ((st.selInfo && st.selInfo.n) || Object.keys(st.roster || {}).length) + (+d('n'))) }); return; }
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
      var se1 = document.getElementById('g-song'), se2 = document.getElementById('g-songend'), u = se1 ? se1.value.trim() : '', et = se2 ? se2.value.trim() : '';
      if (u && !yt(u)) { A.toast('Lien YouTube invalide'); return; }
      var em = et.match(/^(\d+):([0-5]\d)$/), end = et ? (em ? +em[1] * 60 + +em[2] : /^\d+$/.test(et) ? +et : -1) : 0;
      if (end < 0 || (end && u && end <= yt(u).start)) { A.toast('Fin invalide (format 1:40, après le début)'); return; }
      act('rSongs', { url: u, end: end }).then(function () { A.toast('Musique enregistrée'); });
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
    if (g === 'dopen') { act('destinOpen'); return; }
    if (g === 'dshow') { act('destinShow'); return; }
    if (g === 'dnext') { act('destinNext'); return; }
    if (g === 'bp1') { act('bossP1'); return; }
    if (g === 'bp2s') { act('bossP2Start'); return; }
    if (g === 'bp2c') { act('bossP2Close'); return; }
    if (g === 'bfinal') { act('bossFinal'); try { if (navigator.vibrate) navigator.vibrate([60, 40, 120]); } catch (_) {} return; }
    if (g === 'bintro') { act('bossIntro', { on: d('on') === '1' }); return; }
    if (g === 'estart') { act('echoStart'); return; }
    if (g === 'escore') { act('echoScore', { clan: d('c') }); return; }
    if (g === 'ego') { act('echoGo', { i: +d('i') }); return; }
    if (g === 'hview') { act('hokView', { v: d('v') }); return; }
    if (g === 'hspeech') { var sp = document.getElementById('g-speech'); act('hokSpeech', { t: sp ? sp.value : '' }).then(function () { A.toast('Mot enregistré'); }); return; }
    if (g === 'hmusic') { var hm = document.getElementById('g-hmusic'), u = hm ? hm.value.trim() : ''; if (u && !yt(u)) { A.toast('Lien YouTube invalide'); return; } act('hokMusic', { url: u }).then(function () { A.toast(u ? 'Musique enregistrée' : 'Musique retirée'); }); return; }
    if (g === 'hgo') { if ((st.hokage || {}).view !== 'slides') { act('hokView', { v: 'slides' }).then(function () { act('hokGo', { i: +d('i') }); }); return; } act('hokGo', { i: +d('i') }); return; }
    if (g === 'hpause') { act('hokPause', { on: d('on') === '1', cur: hokCur() }); return; }
    if (g === 'hdur') { act('hokDur', { d: +d('d'), cur: hokCur() }); return; }
    if (g === 'pdel') { fetch('/api/game/photo?id=' + d('id'), { method: 'DELETE', headers: { 'x-code': code() } }).then(poll); return; }
  }

  window.A30G = { routes: { jeu: 1, mj: 1, ecran: 1, final: 1 }, show: show, hide: hide, fig: fig, moves: MOVES };
})();
