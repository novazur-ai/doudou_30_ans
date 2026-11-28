/* Cérémonie de la Hokage (projection) — PixiJS v7 (licence MIT).
   Aube dorée → polaroïd de la vraie photo → le chapeau tombe → la photo devient la kunoichi → le portrait s'envole
   et se grave dans le mont des Hokage → la pierre prend vie → le manteau « 三十代目火影 » se déploie → feux d'artifice. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eout(t) { return 1 - Math.pow(1 - t, 3); }
  function eback(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function eio(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

  // Moments clés (ms depuis le début de la cérémonie)
  var K = { polIn: 1200, hat: 3400, hatLand: 4100, morphEnd: 5200, fly: 5600, carve: 6500, carveEnd: 9000, alive: 9200, cloak: 10400, title: 11600, fw: 11800 };
  var SPOT = { x: 1472, y: 300, r: 148 }; // emplacement libre sur le mont (à ajuster sur l'image définitive)

  function canvasTex(w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return PIXI.Texture.from(c); }

  function Ceremony(view, opt) {
    opt = opt || {}; this.opt = opt;
    var A = this.app = new PIXI.Application({ view: view, width: 1920, height: 1080, backgroundColor: 0x1a0f0c, antialias: true, resolution: 1 });
    var S = A.stage, self = this;
    this.TX = {
      dot: canvasTex(32, 32, function (c) { var g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); }),
      glow: canvasTex(256, 256, function (c) { var g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }),
      petal: canvasTex(40, 28, function (c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(2, 14); c.bezierCurveTo(10, -2, 30, 0, 38, 10); c.lineTo(32, 14); c.lineTo(38, 18); c.bezierCurveTo(30, 28, 10, 30, 2, 14); c.fill(); }),
      smoke: canvasTex(128, 128, function (c) { for (var i = 0; i < 12; i++) { var x = 64 + rnd(-20, 20), y = 64 + rnd(-20, 20), r = rnd(18, 40), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } }),
      lantern: canvasTex(64, 90, function (c) {
        var g = c.createRadialGradient(32, 46, 4, 32, 46, 40); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.45, '#ffb347'); g.addColorStop(1, '#c8372d');
        c.fillStyle = g; c.beginPath(); c.moveTo(14, 16); c.quadraticCurveTo(2, 46, 14, 78); c.lineTo(50, 78); c.quadraticCurveTo(62, 46, 50, 16); c.closePath(); c.fill();
        c.fillStyle = '#3a1a10'; c.fillRect(16, 10, 32, 7); c.fillRect(16, 77, 32, 7);
      }),
      ray: canvasTex(64, 512, function (c) { var g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(255,236,170,0)'); g.addColorStop(1, 'rgba(255,236,170,.9)'); c.fillStyle = g; c.beginPath(); c.moveTo(24, 0); c.lineTo(40, 0); c.lineTo(64, 512); c.lineTo(0, 512); c.fill(); }),
    };
    this.TX.cloak = this.cloakTex();
    this.TX.hat = this.hatTex();
    // décor
    this.world = new PIXI.Container(); S.addChild(this.world);
    this.bg = PIXI.Sprite.from(opt.monument); this.bg.anchor.set(0.5); this.bg.x = 960; this.bg.y = 540; this.world.addChild(this.bg);
    var fitBg = function () { if (self.dead || !self.bg.texture) return; if (self.bg.texture.width > 1) { var k = Math.max(1920 / self.bg.texture.width, 1080 / self.bg.texture.height); self.bg.scale.set(k); } else setTimeout(fitBg, 60); }; fitBg();
    this.grade = new PIXI.Graphics(); this.world.addChild(this.grade); // voile chaud/sombre
    if (opt.placeholder) { // en attendant l'image du mont : un pan de roche lisse
      var ph = new PIXI.Graphics(); ph.beginFill(0x8a7462, 0.9).drawRoundedRect(SPOT.x - 240, SPOT.y - 250, 480, 500, 40).endFill(); ph.beginFill(0x6e5a4b, 0.6).drawRoundedRect(SPOT.x - 220, SPOT.y - 230, 440, 460, 34).endFill(); this.world.addChild(ph);
    }
    this.sky = new PIXI.Container(); this.world.addChild(this.sky); // feux d'artifice et lanternes
    this.face = new PIXI.Container(); this.world.addChild(this.face); // visage gravé
    this.fx = new PIXI.Container(); this.world.addChild(this.fx);
    this.cloakC = new PIXI.Container(); this.world.addChild(this.cloakC);
    this.pol = new PIXI.Container(); this.world.addChild(this.pol);
    this.ui = new PIXI.Container(); S.addChild(this.ui);
    this.over = new PIXI.Graphics(); S.addChild(this.over);
    this.parts = []; this.fws = []; this.t = -1; this.speed = 1;
    this.buildPolaroid(); this.buildFace(); this.buildCloak(); this.buildTitle();
    A.ticker.add(function () { self.tick(Math.min(0.05, A.ticker.deltaMS / 1000)); });
  }
  Ceremony.prototype.hatTex = function () {
    return canvasTex(420, 220, function (c) {
      c.lineJoin = 'round';
      c.fillStyle = '#ffffff'; c.strokeStyle = '#1E1A17'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(210, 12); c.lineTo(408, 170); c.quadraticCurveTo(210, 214, 12, 170); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#C8372D'; c.beginPath(); c.moveTo(210, 14); c.lineTo(290, 78); c.quadraticCurveTo(210, 96, 130, 78); c.closePath(); c.fill();
      c.fillStyle = '#C8372D'; c.font = '800 70px Mincho30, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('火', 210, 140);
    });
  };
  Ceremony.prototype.cloakTex = function () {
    return canvasTex(600, 860, function (c, w, h) {
      // dos du manteau : blanc, flammes rouges en bas, inscription verticale
      c.fillStyle = '#FBF8F2'; c.beginPath(); c.moveTo(120, 0); c.lineTo(480, 0); c.quadraticCurveTo(560, 400, 596, 856); c.lineTo(4, 856); c.quadraticCurveTo(40, 400, 120, 0); c.closePath(); c.fill();
      var g = c.createLinearGradient(0, 0, 600, 0); g.addColorStop(0, 'rgba(0,0,0,.12)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.16)'); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      c.fillStyle = '#C8372D';
      for (var i = 0; i < 9; i++) { var x0 = -20 + i * 75, hh = 150 + (i % 3) * 50; c.beginPath(); c.moveTo(x0, h); c.quadraticCurveTo(x0 + 10, h - hh * 0.6, x0 + 38, h - hh); c.quadraticCurveTo(x0 + 30, h - hh * 0.55, x0 + 62, h - hh * 0.7); c.quadraticCurveTo(x0 + 56, h - hh * 0.3, x0 + 80, h); c.closePath(); c.fill(); }
      c.restore();
      c.fillStyle = '#1E1A17'; c.font = '800 92px Mincho30, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      ['三', '十', '代', '目', '火', '影'].forEach(function (ch, i) { c.fillText(ch, 300, 110 + i * 100); });
    });
  };
  Ceremony.prototype.buildPolaroid = function () {
    var p = this.pol, W = 520, H = 600;
    var sh = new PIXI.Sprite(this.TX.glow); sh.tint = 0x000000; sh.alpha = 0.35; sh.anchor.set(0.5); sh.width = W * 1.5; sh.height = H * 1.4; sh.y = 30; p.addChild(sh);
    var card = new PIXI.Graphics(); card.beginFill(0xffffff).drawRect(-W / 2, -H / 2, W, H).endFill(); p.addChild(card);
    var ph = this.photo = PIXI.Sprite.from(this.opt.photo); ph.anchor.set(0.5); ph.y = -40; p.addChild(ph);
    var kn = this.kuno = PIXI.Sprite.from(this.opt.kunoichi); kn.anchor.set(0.5); kn.y = -40; p.addChild(kn);
    var self0 = this, fit = function (s) { var go = function () { if (self0.dead || !s.texture) return; if (s.texture.width > 1) { var k = 460 / Math.min(s.texture.width, s.texture.height); s.scale.set(k); } else setTimeout(go, 60); }; go(); };
    fit(ph); fit(kn);
    var m1 = new PIXI.Graphics(); m1.beginFill(0xffffff).drawRect(-230, -270, 460, 460).endFill(); p.addChild(m1); ph.mask = m1;
    this.kMask = new PIXI.Graphics(); p.addChild(this.kMask); kn.mask = this.kMask; // balayage lumineux de la transformation
    this.sweep = new PIXI.Sprite(this.TX.ray); this.sweep.anchor.set(0.5); this.sweep.rotation = 0.5; this.sweep.width = 140; this.sweep.height = 900; this.sweep.blendMode = PIXI.BLEND_MODES.ADD; this.sweep.alpha = 0; p.addChild(this.sweep);
    var m2 = new PIXI.Graphics(); m2.beginFill(0xffffff).drawRect(-230, -270, 460, 460).endFill(); p.addChild(m2); this.sweep.mask = m2;
    var cap = new PIXI.Text('Alessia', { fontFamily: 'Mincho30, serif', fontSize: 52, fontWeight: '800', fill: 0x1E1A17 }); cap.anchor.set(0.5); cap.y = 240; p.addChild(cap); this.cap = cap;
    this.hat = new PIXI.Sprite(this.TX.hat); this.hat.anchor.set(0.5, 0.75); this.hat.alpha = 0; p.addChild(this.hat);
    p.x = 640; p.y = -700; p.rotation = -0.05;
  };
  Ceremony.prototype.buildFace = function () {
    var f = this.face, r = SPOT.r;
    this.stone = PIXI.Sprite.from(this.opt.kunoichi); this.stone.anchor.set(0.5);
    var cm = new PIXI.ColorMatrixFilter(); cm.desaturate(); cm.contrast(0.3, true); cm.brightness(0.95, true);
    var nz = new PIXI.NoiseFilter(0.18); this.stone.filters = [cm, nz]; this.stone.tint = 0xe3b98c;
    this.alive = PIXI.Sprite.from(this.opt.kunoichi); this.alive.anchor.set(0.5); this.alive.alpha = 0;
    var self = this, fit = function () { if (self.dead || !self.stone.texture) return; if (self.stone.texture.width > 1) { var k = (r * 2.3) / self.stone.texture.width; self.stone.scale.set(k); self.alive.scale.set(k); } else setTimeout(fit, 60); }; fit();
    var stoneC = new PIXI.Container(); f.addChild(stoneC); this.stoneC = stoneC;
    [this.stone, this.alive].forEach(function (s) { s.x = SPOT.x; s.y = SPOT.y; });
    stoneC.addChild(this.stone); f.addChild(this.alive);
    this.carveMask = new PIXI.Graphics(); f.addChild(this.carveMask); this.stone.mask = this.carveMask;
    // masque doux : le visage en couleurs se fond dans la roche
    var soft = canvasTex(256, 256, function (c) { var g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.62, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
    var ring = new PIXI.Sprite(soft); ring.anchor.set(0.5); ring.x = SPOT.x; ring.y = SPOT.y; ring.width = r * 1.95; ring.height = r * 2.25; f.addChild(ring); this.alive.mask = ring; this.alive.tint = 0xfff0dc;
    var ring2 = new PIXI.Sprite(soft); ring2.anchor.set(0.5); ring2.x = SPOT.x; ring2.y = SPOT.y; ring2.width = r * 2.2; ring2.height = r * 2.5; f.addChild(ring2); this.stoneC.mask = ring2;
    f.alpha = 0;
    // traits de ciseau : bandes irrégulières qui se révèlent une à une
    this.chisel = []; for (var i = 0; i < 56; i++) this.chisel.push({ y: SPOT.y - r * 1.15 + i * (r * 2.3 / 56), w: rnd(0.9, 1.02), o: rnd(-0.03, 0.03) });
  };
  Ceremony.prototype.buildCloak = function () {
    var tex = this.TX.cloak, pl = this.cloak = new PIXI.SimplePlane(tex, 10, 14);
    pl.x = 160; pl.y = 1100; this.cloakC.addChild(pl);
    var buf = pl.geometry.getBuffer('aVertexPosition'); this.cloakBase = Float32Array.from(buf.data);
  };
  Ceremony.prototype.buildTitle = function () {
    var u = this.ui;
    this.kick = new PIXI.Text('SANJÛBI EST VAINCU · LE VILLAGE CÉLÈBRE', { fontFamily: 'Gothic30, sans-serif', fontSize: 26, fontWeight: '900', fill: 0xF7E6A8, letterSpacing: 6 });
    this.t1 = new PIXI.Text('Alessia', { fontFamily: 'Mincho30, serif', fontSize: 150, fontWeight: '800', fill: 0xFFF6E4, stroke: 0x2a1410, strokeThickness: 10, dropShadow: true, dropShadowBlur: 18, dropShadowColor: 0x000000, dropShadowDistance: 0 });
    this.t2 = new PIXI.Text('la 30e Hokage du village', { fontFamily: 'Mincho30, serif', fontSize: 70, fontWeight: '800', fill: 0xF7C948, stroke: 0x2a1410, strokeThickness: 8 });
    [this.kick, this.t1, this.t2].forEach(function (t) { t.anchor.set(0, 0.5); t.alpha = 0; u.addChild(t); });
    this.kick.x = 790; this.kick.y = 690; this.t1.x = 780; this.t1.y = 800; this.t2.x = 790; this.t2.y = 930;
  };
  Ceremony.prototype.play = function (fromMs) { this.t = fromMs || 0; this.done = {}; this.parts.forEach(function (p) { p.s.destroy(); }); this.parts = []; };
  // Particule générique (pétales, poussière, étincelles, débris)
  Ceremony.prototype.add = function (o) {
    var s = new PIXI.Sprite(o.tex || this.TX.dot); s.anchor.set(0.5); s.x = o.x; s.y = o.y; s.tint = o.c || 0xffffff; if (o.add !== false) s.blendMode = PIXI.BLEND_MODES.ADD; s.rotation = rnd(0, TAU);
    (o.layer || this.fx).addChild(s);
    this.parts.push({ s: s, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag || 0, life: 0, max: o.life || 1000, sc0: o.sc0 || 1, sc1: o.sc1 === undefined ? 0 : o.sc1, a0: o.a === undefined ? 1 : o.a, spin: o.spin || 0, sway: o.sway || 0, ph: rnd(0, TAU), flick: o.flick });
  };
  // Feu d'artifice : fusée qui monte puis gerbe aux couleurs du clan, avec le prénom de l'invité
  Ceremony.prototype.firework = function (name, col) {
    var x = rnd(260, 1660), y = rnd(140, 420), self = this;
    this.fws.push({ x: x, y0: 1100, y: y, t: 0, col: col || [0xF7C948, 0xE0532C, 0x3C7BEA, 0x5E9B47][Math.floor(rnd(0, 4))], name: name, boom: false });
  };
  Ceremony.prototype.tick = function (rdt) {
    if (this.t < 0) return;
    var dt = rdt * this.speed, t = (this.t += dt * 1000), self = this, TX = this.TX;
    // voile : aube dorée qui se dissipe, puis lumière chaude du matin
    var gl = this.grade; gl.clear();
    var dark = t < K.fly ? 0.42 : t < K.fw ? 0.2 : 0.1; gl.beginFill(0x1a0a06, dark).drawRect(0, 0, 1920, 1080).endFill();
    this.over.clear(); var dawn = 1 - seg(t, 0, 1900); if (dawn > 0) this.over.beginFill(0xFFE2A8, dawn * 0.95).drawRect(0, 0, 1920, 1080).endFill();
    // pétales tout du long
    if (Math.random() < 0.3) this.add({ tex: TX.petal, x: rnd(-100, 1920), y: -30, vx: rnd(40, 140), vy: rnd(60, 140), life: rnd(7000, 10000), sc0: rnd(0.5, 0.9), sc1: 0.5, c: [0xF8C8D8, 0xF4A9C0, 0xFFE0EA][Math.floor(rnd(0, 3))], add: false, a: 0.9, spin: rnd(-2, 2), sway: 60, layer: this.ui });
    // 1. le polaroïd tombe
    var p = this.pol, pin = seg(t, K.polIn, K.polIn + 900);
    if (t < K.fly) { p.y = lerp(-700, 560, eback(pin)); p.rotation = lerp(-0.3, -0.05, eout(pin)); p.x = 640; p.scale.set(1.2); }
    // 2. le chapeau tombe et se pose
    var hd = seg(t, K.hat, K.hatLand);
    this.hat.alpha = t >= K.hat ? 1 : 0; this.hat.y = lerp(-900, -250, eback(hd)); this.hat.rotation = lerp(-0.5, 0.06, eout(hd)); this.hat.scale.set(1.15);
    if (t >= K.hatLand && !this.done.land) { this.done.land = 1; this.shake = 22; for (var i = 0; i < 90; i++) { var a = rnd(0, TAU), sp = rnd(300, 1100); this.add({ x: p.x, y: p.y - 260, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, g: 900, drag: 0.02, life: rnd(700, 1300), sc0: rnd(0.5, 1), c: 0xFFD97A }); } if (this.opt.onReveal) this.opt.onReveal(); }
    // 3. la photo devient la kunoichi (balayage de lumière)
    var mk = seg(t, K.hatLand + 100, K.morphEnd); this.kMask.clear();
    if (mk > 0) { var xw = lerp(-330, 330, eio(mk)); this.kMask.beginFill(0xffffff).drawPolygon([-230, -270, xw + 80, -270, xw - 80, 190, -230, 190]).endFill(); this.kuno.visible = true; } else this.kuno.visible = false;
    if (mk >= 1) { this.kMask.clear(); this.kMask.beginFill(0xffffff).drawRect(-230, -270, 460, 460).endFill(); }
    this.sweep.alpha = mk > 0 && mk < 1 ? 1 : 0; this.sweep.x = lerp(-330, 330, eio(mk)); this.sweep.y = -40;
    // 4. le portrait s'envole vers le mont
    var fl = seg(t, K.fly, K.carve);
    if (t >= K.fly) { p.x = lerp(640, SPOT.x, eio(fl)); p.y = lerp(560, SPOT.y + 40, eio(fl)) - Math.sin(fl * Math.PI) * 160; p.scale.set(lerp(1.2, 0.32, eio(fl))); p.rotation = lerp(-0.05, 0.4, fl); p.alpha = 1 - seg(t, K.carve - 250, K.carve); }
    // 5. gravure dans la roche : bandes de ciseau, poussière et éclats
    var cv = seg(t, K.carve, K.carveEnd);
    this.face.alpha = t >= K.carve - 150 ? 1 : 0;
    var cm = this.carveMask; cm.clear();
    if (cv > 0) {
      cm.beginFill(0xffffff); var n = this.chisel.length, r = SPOT.r;
      for (var c = 0; c < n; c++) { var ch = this.chisel[c], pr = clamp(cv * 1.35 - c / n * 0.4, 0, 1); if (pr <= 0) continue; var dy = (ch.y + r * 2.3 / n / 2 - SPOT.y) / (r * 1.15), half = r * 1.02 * Math.sqrt(Math.max(0, 1 - dy * dy)), w = 2 * half * (0.92 + 0.08 * ch.w) * eout(pr); cm.drawRect(SPOT.x - w / 2 + ch.o * r * 0.3, ch.y, w, r * 2.3 / n + 1.5); }
      cm.endFill();
      if (cv < 1 && Math.random() < 0.9) { var row = this.chisel[Math.min(n - 1, Math.floor(cv * 1.2 * n))];
        for (var d = 0; d < 2; d++) this.add({ tex: TX.smoke, x: SPOT.x + rnd(-r, r), y: row.y, vx: rnd(-60, 60), vy: rnd(20, 90), g: 40, life: rnd(1000, 1600), sc0: rnd(0.35, 0.6), sc1: rnd(0.9, 1.3), c: 0xcdb89f, add: false, a: 0.28 });
        this.add({ x: SPOT.x + rnd(-r, r), y: row.y, vx: rnd(-160, 160), vy: rnd(-260, -60), g: 1300, life: rnd(800, 1300), sc0: rnd(0.25, 0.45), sc1: 0.2, c: 0x5a4636, add: false });
        if (Math.random() < 0.3) this.shake = Math.max(this.shake || 0, 4); }
    }
    // 6. la pierre prend vie
    var al = seg(t, K.alive, K.alive + 1300); this.alive.alpha = 0.92 * eout(al);
    if (t >= K.alive && !this.done.alive) { this.done.alive = 1; for (var q = 0; q < 70; q++) { var aq = rnd(0, TAU); this.add({ x: SPOT.x + Math.cos(aq) * SPOT.r, y: SPOT.y + Math.sin(aq) * SPOT.r * 1.1, vx: Math.cos(aq) * rnd(60, 260), vy: Math.sin(aq) * rnd(60, 260) - 80, life: rnd(900, 1600), sc0: rnd(0.6, 1.1), c: 0xFFE7A0 }); } }
    // 7. le manteau se déploie et flotte au vent
    var ck = seg(t, K.cloak, K.cloak + 1500), pl = this.cloak;
    pl.y = lerp(1120, 170, eback(ck)); pl.x = 150;
    var buf = pl.geometry.getBuffer('aVertexPosition'), d0 = this.cloakBase, dd = buf.data;
    for (var v = 0; v < dd.length; v += 2) { var vx = d0[v], vy = d0[v + 1], k = vy / 860; dd[v] = vx + Math.sin(t / 420 + vy / 120) * 28 * k * k + Math.sin(t / 260 + vx / 90) * 6 * k; dd[v + 1] = vy + Math.sin(t / 380 + vx / 140) * 10 * k; }
    buf.update();
    // 8. titre
    this.kick.alpha = seg(t, K.title, K.title + 600); this.t1.alpha = seg(t, K.title + 250, K.title + 1000); this.t2.alpha = seg(t, K.title + 800, K.title + 1500);
    this.t1.x = 780 + (1 - eout(this.t1.alpha)) * 60; this.t2.x = 790 + (1 - eout(this.t2.alpha)) * 60;
    // 9. feux d'artifice et lanternes
    if (t >= K.fw) {
      if (Math.random() < 0.012 * this.speed * 4) this.firework(null);
      if (Math.random() < 0.05) this.add({ tex: TX.lantern, x: rnd(100, 1820), y: 1120, vx: rnd(-15, 15), vy: rnd(-70, -40), life: rnd(14000, 20000), sc0: rnd(0.45, 0.8), sc1: 0.3, add: false, a: 0.95, sway: 25, layer: this.sky, flick: true });
    }
    this.fws = this.fws.filter(function (f) {
      f.t += dt * 1000; var k = clamp(f.t / 900, 0, 1);
      if (!f.boom) {
        var y = lerp(f.y0, f.y, eout(k)); self.add({ x: f.x + rnd(-3, 3), y: y, vy: rnd(40, 120), life: 400, sc0: 0.6, sc1: 0, c: 0xFFE7B0, layer: self.sky });
        if (k >= 1) { f.boom = true; var n = 110;
          for (var b = 0; b < n; b++) { var ab = b / n * TAU + rnd(-0.05, 0.05), sb = rnd(380, 560); self.add({ x: f.x, y: f.y, vx: Math.cos(ab) * sb, vy: Math.sin(ab) * sb, g: 220, drag: 0.025, life: rnd(1400, 2000), sc0: rnd(0.7, 1), sc1: 0.1, c: f.col, layer: self.sky, flick: true }); }
          var gw = new PIXI.Sprite(TX.glow); gw.anchor.set(0.5); gw.x = f.x; gw.y = f.y; gw.tint = f.col; gw.blendMode = PIXI.BLEND_MODES.ADD; gw.scale.set(3); self.sky.addChild(gw); self.parts.push({ s: gw, vx: 0, vy: 0, g: 0, drag: 0, life: 0, max: 700, sc0: 3, sc1: 5, a0: 0.6, spin: 0, sway: 0, ph: 0 });
          if (f.name) { var tx = new PIXI.Text(f.name, { fontFamily: 'Mincho30, serif', fontSize: 46, fontWeight: '800', fill: 0xFFF6E4, stroke: 0x2a1410, strokeThickness: 6 }); tx.anchor.set(0.5); tx.x = f.x; tx.y = f.y; self.sky.addChild(tx); self.parts.push({ s: tx, vx: 0, vy: -20, g: 0, drag: 0, life: 0, max: 2200, sc0: 1, sc1: 1.1, a0: 1, spin: 0, sway: 0, ph: 0, text: true }); }
          return false; }
      }
      return true;
    });
    // particules
    this.parts = this.parts.filter(function (q) {
      q.life += dt * 1000; var lt = q.life / q.max; if (lt >= 1) { q.s.destroy(); return false; }
      q.vx *= Math.pow(1 - q.drag, dt * 60); q.vy = q.vy * Math.pow(1 - q.drag, dt * 60) + q.g * dt;
      q.s.x += (q.vx + (q.sway ? Math.sin(t / 700 + q.ph) * q.sway : 0)) * dt; q.s.y += q.vy * dt;
      if (!q.text) { var sc = lerp(q.sc0, q.sc1, lt); q.s.scale.set(sc); q.s.rotation += q.spin * dt; }
      q.s.alpha = q.a0 * (lt < 0.08 ? lt / 0.08 : 1 - Math.pow(lt, 2)) * (q.flick ? 0.75 + 0.25 * Math.sin(t / 60 + q.ph * 9) : 1);
      return true;
    });
    // secousse
    var sh = this.shake || 0; this.world.x = (Math.random() - 0.5) * sh; this.world.y = (Math.random() - 0.5) * sh; this.shake = sh * Math.pow(0.002, rdt);
  };
  Ceremony.prototype.destroy = function () { this.dead = true; try { this.app.destroy(false, { children: true }); } catch (_) {} };
  Ceremony.prototype.advance = function (ms) { this.app.ticker.stop(); var n = Math.round(ms / 16.67); for (var i = 0; i < n; i++) this.tick(1 / 60); this.app.render(); };

  window.Hokage = { Ceremony: Ceremony, K: K, SPOT: SPOT };
})();
