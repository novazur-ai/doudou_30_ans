/* Sorts des clans contre Sanjûbi — effets WebGL avec PixiJS v7 (licence MIT).
   Particules maison, shader de flammes, éclairs procéduraux, onde de choc par distorsion, « impact frame » façon anime. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eout(t) { return 1 - Math.pow(1 - t, 3); }
  function ein(t) { return t * t * t; }
  function eio(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function hexLerp(c1, c2, t) { t = clamp(t, 0, 1); var r = lerp(c1 >> 16, c2 >> 16, t), g = lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t), b = lerp(c1 & 255, c2 & 255, t); return (r << 16) | (g << 8) | b; }

  /* ---------- textures générées ---------- */
  function canvasTex(w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return PIXI.Texture.from(c); }
  var TX = {};
  function makeTextures() {
    TX.glow = canvasTex(128, 128, function (c, w) { var g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
    TX.dot = canvasTex(32, 32, function (c, w) { var g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
    TX.streak = canvasTex(128, 16, function (c, w, h) { var g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2, h / 2 - 2, 0, 0, TAU); c.fill(); });
    TX.smoke = canvasTex(128, 128, function (c, w) {
      for (var i = 0; i < 14; i++) { var x = w / 2 + rnd(-22, 22), y = w / 2 + rnd(-22, 22), r = rnd(18, 40), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    });
    TX.noise = canvasTex(256, 256, function (c, w) { // bruit doux et raccordable pour la distorsion du vent
      var sm = document.createElement('canvas'); sm.width = sm.height = 16; var x = sm.getContext('2d'), id = x.createImageData(16, 16);
      for (var i = 0; i < id.data.length; i += 4) { id.data[i] = Math.random() * 255; id.data[i + 1] = Math.random() * 255; id.data[i + 2] = 128; id.data[i + 3] = 255; }
      x.putImageData(id, 0, 0); c.imageSmoothingEnabled = true; c.filter = 'blur(6px)';
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) c.drawImage(sm, dx * w, dy * w, w, w);
    });
    TX.leaf = canvasTex(32, 16, function (c) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(1, 8); c.quadraticCurveTo(16, -4, 31, 8); c.quadraticCurveTo(16, 20, 1, 8); c.fill(); });
    TX.crescent = canvasTex(256, 256, function (c) {
      c.translate(128, 128);
      var g = c.createRadialGradient(-30, 0, 60, -30, 0, 125); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(-30, 0, 120, -1.25, 1.25); c.arc(-70, 0, 112, 1.05, -1.05, true); c.closePath(); c.fill();
    });
    TX.ring = canvasTex(512, 512, function (c, w) { // carte de distorsion de l'onde de choc
      c.fillStyle = 'rgb(128,128,128)'; c.fillRect(0, 0, w, w);
      var img = c.getImageData(0, 0, w, w), d = img.data;
      for (var y = 0; y < w; y++) for (var x = 0; x < w; x++) {
        var dx = x - w / 2, dy = y - w / 2, r = Math.hypot(dx, dy) / (w / 2), k = Math.exp(-Math.pow((r - 0.75) / 0.08, 2)), i = (y * w + x) * 4;
        d[i] = 128 + (dx / (r * w / 2 + 1e-3)) * 127 * k; d[i + 1] = 128 + (dy / (r * w / 2 + 1e-3)) * 127 * k; d[i + 2] = 128;
      }
      c.putImageData(img, 0, 0);
    });
  }

  /* ---------- planches d'animation (spritesheets CC0, voir fx/LICENCES.txt) ---------- */
  var SHEETS = { explosion25: [4, 4, 16], toon31: [4, 4, 16], effect36: [4, 4, 16], effect51: [4, 4, 16], fire01: [8, 4, 32], bolt: [22, 1, 22], crackle: [20, 1, 20] }, FR = {};
  function loadSheets(base) {
    var names = Object.keys(SHEETS);
    return Promise.all(names.map(function (n) { return PIXI.Assets.load(base + n + '.png'); })).then(function (txs) {
      txs.forEach(function (tx, i) {
        var sp = SHEETS[names[i]], bt = tx.baseTexture, w = bt.width / sp[0], h = bt.height / sp[1], fr = [];
        for (var k = 0; k < sp[2]; k++) fr.push(new PIXI.Texture(bt, new PIXI.Rectangle((k % sp[0]) * w, Math.floor(k / sp[0]) * h, w, h)));
        FR[names[i]] = fr;
      });
    });
  }
  function whiteMatrix(tint) { var f = new PIXI.ColorMatrixFilter(); f.desaturate(); f.brightness(1.25, true); return f; }

  /* ---------- shader de boule de feu (bruit fractal animé) ---------- */
  var FIRE_FRAG = [
    'precision highp float;',
    'varying vec2 vTextureCoord;',
    'uniform vec4 inputSize; uniform vec4 outputFrame;',
    'uniform float uTime; uniform float uBurst; uniform vec3 uHot; uniform vec3 uMid; uniform vec3 uCold;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}',
    'void main(){',
    '  vec2 uv = vTextureCoord * inputSize.xy / outputFrame.zw;',
    '  vec2 p = uv*2.-1.;',
    '  float r = length(p);',
    '  float a = atan(p.y,p.x);',
    '  float n = fbm(vec2(a*2.2+uTime*.7, r*3.2-uTime*4.)) + .5*fbm(p*4.+vec2(uTime*1.3,-uTime*2.));',
    '  float edge = mix(.78,.95,uBurst);',
    '  float body = smoothstep(edge, edge-.42, r + (n-.75)*.55);',
    '  float core = smoothstep(.38, .0, r + (n-.7)*.45);',
    '  if (uBurst > 0.) { float ring = smoothstep(.25,.0,abs(r-.7*uBurst-.2)); body = max(body*(1.-uBurst*.7), ring*(1.-uBurst)); core *= 1.-uBurst; }',
    '  vec3 col = mix(uCold, uMid, smoothstep(.0,.6,body));',
    '  col = mix(col, uHot, core);',
    '  float al = clamp(body*.95,0.,1.) * (.75+.25*n);',
    '  gl_FragColor = vec4(col*al, al);',
    '}'].join('\n');
  function fireBall(size, colors) {
    var sp = new PIXI.Sprite(PIXI.Texture.WHITE); sp.width = sp.height = size; sp.anchor.set(0.5);
    var f = new PIXI.Filter(undefined, FIRE_FRAG, { uTime: 0, uBurst: 0, uHot: colors[0], uMid: colors[1], uCold: colors[2] });
    f.padding = 0; sp.filters = [f]; sp.fx = f; sp.blendMode = PIXI.BLEND_MODES.ADD;
    return sp;
  }

  /* ---------- particules ---------- */
  function Parts(layer) { this.layer = layer; this.list = []; }
  Parts.prototype.add = function (o) {
    var s = new PIXI.Sprite(o.tex || TX.dot); s.anchor.set(0.5); s.blendMode = o.blend === undefined ? PIXI.BLEND_MODES.ADD : o.blend;
    s.x = o.x; s.y = o.y; s.tint = o.c0 || 0xffffff; s.rotation = o.rot || 0;
    this.layer.addChild(s);
    this.list.push({ s: s, vx: o.vx || 0, vy: o.vy || 0, life: 0, max: o.life || 800, sc0: o.sc0 === undefined ? 1 : o.sc0, sc1: o.sc1 === undefined ? 0 : o.sc1, a0: o.a0 === undefined ? 1 : o.a0, c0: o.c0 || 0xffffff, c1: o.c1 === undefined ? (o.c0 || 0xffffff) : o.c1, drag: o.drag || 0, g: o.g || 0, align: !!o.align, spin: o.spin || 0, sx: o.sx || 1, home: o.home || null });
  };
  Parts.prototype.update = function (dt) {
    var keep = [];
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i]; p.life += dt * 1000; var t = p.life / p.max;
      if (t >= 1) { p.s.destroy(); continue; }
      if (p.home) { var dx = p.home.x - p.s.x, dy = p.home.y - p.s.y, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 2600 * dt; p.vy += dy / d * 2600 * dt; p.vx *= 0.93; p.vy *= 0.93; if (d < 30) { p.s.destroy(); continue; } }
      p.vx *= Math.pow(1 - p.drag, dt * 60); p.vy = p.vy * Math.pow(1 - p.drag, dt * 60) + p.g * dt;
      p.s.x += p.vx * dt; p.s.y += p.vy * dt;
      var sc = lerp(p.sc0, p.sc1, t); p.s.scale.set(sc * p.sx, sc);
      if (p.align) p.s.rotation = Math.atan2(p.vy, p.vx); else p.s.rotation += p.spin * dt;
      p.s.alpha = p.a0 * (t < 0.1 ? t / 0.1 : 1 - Math.pow(t, 1.6));
      p.s.tint = hexLerp(p.c0, p.c1, t);
      keep.push(p);
    }
    this.list = keep;
  };

  /* ---------- éclairs ---------- */
  function boltPath(x0, y0, x1, y1, disp, depth, out, branches) {
    var pts = [[x0, y0], [x1, y1]];
    for (var d = 0; d < depth; d++) {
      var np = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, off = rnd(-1, 1) * disp * len;
        np.push([mx + nx * off, my + ny * off], b);
      }
      pts = np; disp *= 0.62;
    }
    out.push({ pts: pts, w: 1 });
    if (branches) for (var k = 0; k < branches; k++) {
      var s = pts[Math.floor(rnd(0.2, 0.75) * pts.length)], ang = Math.atan2(y1 - y0, x1 - x0) + rnd(-0.9, 0.9), L = Math.hypot(x1 - x0, y1 - y0) * rnd(0.15, 0.35);
      var sub = []; boltPath(s[0], s[1], s[0] + Math.cos(ang) * L, s[1] + Math.sin(ang) * L, 0.28, depth - 2, sub, 0); sub[0].w = 0.5; out.push(sub[0]);
    }
    return out;
  }
  function drawBolts(g, bolts, col, width, alpha) {
    g.clear();
    bolts.forEach(function (b) {
      [[width * 7 * b.w, col, 0.12 * alpha], [width * 3.2 * b.w, col, 0.35 * alpha], [width * 1.6 * b.w, 0xcfe6ff, 0.8 * alpha], [width * 0.7 * b.w, 0xffffff, alpha]].forEach(function (L) {
        g.lineStyle({ width: L[0], color: L[1], alpha: L[2], cap: 'round', join: 'round' });
        g.moveTo(b.pts[0][0], b.pts[0][1]); for (var i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i][0], b.pts[i][1]);
      });
    });
  }

  /* ================= la scène ================= */
  function Stage(view, opt) {
    opt = opt || {};
    this.opt = opt;
    this.app = new PIXI.Application({ view: view, width: 1920, height: 1080, backgroundColor: 0x0d0a0c, backgroundAlpha: opt.overlay ? 0 : 1, antialias: true, resolution: opt.res || 1, autoDensity: false });
    makeTextures();
    this.O = { x: 230, y: 780 }; this.T = { x: 1230, y: 520 }; // départ du sort, cœur de Sanjûbi
    var A = this.app, s = A.stage;
    this.world = new PIXI.Container(); s.addChild(this.world);
    if (!opt.overlay) { this.bg = PIXI.Sprite.from(opt.bg); this.bg.width = 1920; this.bg.height = 1080; this.bg.filters = [new PIXI.BlurFilter(3)]; this.world.addChild(this.bg);
      this.dim = new PIXI.Graphics(); this.dim.beginFill(0x0a060a, 0.45).drawRect(0, 0, 1920, 1080).endFill(); this.world.addChild(this.dim); }
    this.sky = new PIXI.Graphics(); this.world.addChild(this.sky); // assombrissement pour la foudre
    this.sanj = PIXI.Sprite.from(opt.sanj); this.sanj.anchor.set(0.5); this.sanj.x = 1300; this.sanj.y = 560; this.world.addChild(this.sanj);
    var self = this; var fit = function () { var tx = self.sanj.texture; if (tx.width > 1) { var k = 940 / tx.width; self.sanj.scale.set(k); } else setTimeout(fit, 50); }; fit();
    this.back = new PIXI.Container(); this.world.addChild(this.back); // fumée
    this.fx = new PIXI.Container(); this.world.addChild(this.fx);
    this.bolts = new PIXI.Graphics(); this.bolts.blendMode = PIXI.BLEND_MODES.ADD; this.bolts.filters = [new PIXI.BlurFilter(1.2)]; this.world.addChild(this.bolts);
    this.slashes = new PIXI.Graphics(); this.slashes.blendMode = PIXI.BLEND_MODES.ADD; this.world.addChild(this.slashes);
    this.front = new PIXI.Container(); this.world.addChild(this.front);
    this.pBack = new Parts(this.back); this.pFx = new Parts(this.fx); this.pFront = new Parts(this.front);
    // onde de choc : distorsion du monde
    this.ringSp = new PIXI.Sprite(TX.ring); this.ringSp.anchor.set(0.5); this.ringSp.visible = false; s.addChild(this.ringSp);
    this.disp = new PIXI.DisplacementFilter(this.ringSp, 0);
    this.windSp = new PIXI.Sprite(TX.noise); this.windSp.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT; this.windSp.scale.set(4, 2.2); this.windSp.renderable = false; s.addChild(this.windSp);
    this.windDisp = new PIXI.DisplacementFilter(this.windSp, 0);
    this.world.filters = [this.disp, this.windDisp];
    // « impact frame » : silhouette de Sanjûbi en noir sur blanc, puis l'inverse
    this.flash = new PIXI.Graphics(); s.addChild(this.flash);
    this.sil = new PIXI.Sprite(); this.sil.anchor.set(0.5); this.sil.visible = false; s.addChild(this.sil);
    this.callout = new PIXI.Container(); s.addChild(this.callout);
    this.cur = null; this.speed = 1; this.t = 0; this.anims = []; if (opt.overlay) this.sanj.visible = false;
    this.ready = opt.fx ? loadSheets(opt.fx) : Promise.resolve();
    A.ticker.add(function () { self.tick(Math.min(opt.overlay ? 0.12 : 0.05, A.ticker.deltaMS / 1000)); });
  }
  Stage.prototype.play = function (kind, len) {
    this.clear();
    this.cur = { kind: kind, t: 0, fired: {}, stop: 0, len: len || 3400, wall: performance.now() };
    this.sanj.visible = true; this.active = true;
  };
  // Joue une planche : o.size (plus grand côté, px), o.dur (ms), o.loop, o.tint, o.add (fusion additive), o.rot, o.ay (ancre verticale), o.life (durée totale si boucle), o.gray (désature avant teinte)
  Stage.prototype.anim = function (name, x, y, o) {
    o = o || {}; var fr = FR[name]; if (!fr) return null;
    var sp = new PIXI.Sprite(fr[0]); sp.anchor.set(0.5, o.ay === undefined ? 0.5 : o.ay); sp.x = x; sp.y = y; sp.rotation = o.rot || 0;
    var k = (o.size || 300) / Math.max(fr[0].width, fr[0].height); sp.scale.set(k * (o.sx || 1), k);
    if (o.tint) sp.tint = o.tint; if (o.add !== false) sp.blendMode = PIXI.BLEND_MODES.ADD; if (o.gray) sp.filters = [whiteMatrix()]; sp.alpha = o.alpha === undefined ? 1 : o.alpha;
    (o.layer || this.fx).addChild(sp);
    var a = { s: sp, fr: fr, age: 0, dur: o.dur || 800, loop: !!o.loop, life: o.life || o.dur || 800, a0: sp.alpha, fade: o.fade === undefined ? 0.25 : o.fade };
    this.anims.push(a); return a;
  };
  Stage.prototype.updAnims = function (dt) {
    this.anims = this.anims.filter(function (a) {
      if (a.s.destroyed) return false;
      a.age += dt * 1000; if (a.age >= a.life) { a.s.destroy(); return false; }
      var i = Math.floor(a.age / a.dur * a.fr.length); i = a.loop ? i % a.fr.length : Math.min(a.fr.length - 1, i);
      a.s.texture = a.fr[i]; var rest = 1 - a.age / a.life; a.s.alpha = a.a0 * (a.fade ? clamp(rest / a.fade, 0, 1) : 1);
      return true;
    });
  };
  Stage.prototype.clear = function () {
    if (this.opt.overlay) { this.sanj.visible = false; this.active = false; }
    this.anims.forEach(function (a) { if (!a.s.destroyed) a.s.destroy(); }); this.anims = [];
    [this.pBack, this.pFx, this.pFront].forEach(function (P) { P.list.forEach(function (p) { p.s.destroy(); }); P.list = []; });
    this.fx.removeChildren().forEach(function (c) { c.destroy(); }); this.callout.removeChildren().forEach(function (c) { c.destroy(); });
    this.bolts.clear(); this.slashes.clear(); if (this.windDisp) this.windDisp.scale.set(0); this.sanj.x = 1300; this.sanj.rotation = 0; this.sky.clear(); this.flash.clear(); this.sil.visible = false; this.sanj.tint = 0xffffff; this.disp.scale.set(0); this.ringSp.visible = false;
    this.ball = null; this.blast = null; this.blades = null;
  };
  Stage.prototype.tick = function (rdt) {
    var dt = rdt * this.speed, c = this.cur;
    var hit = c && c.stop > 0; if (hit) { c.stop -= rdt * 1000; dt = 0; } // arrêt sur image à l'impact
    this.pBack.update(dt); this.pFx.update(dt); this.pFront.update(dt); this.updAnims(dt);
    if (c && dt > 0) { c.t += dt * 1000; this[c.kind](c, c.t, dt); if (this.opt.overlay && (c.t > c.len || performance.now() - c.wall > c.len + 400)) { this.clear(); this.cur = null; } }
    // secousse
    var sh = this.shake || 0; this.world.x = (Math.random() - 0.5) * sh; this.world.y = (Math.random() - 0.5) * sh; this.shake = sh * Math.pow(0.0015, rdt);
    if (this.ringT !== undefined) { var k = (performance.now() - this.ringT) / 700; if (k < 1) { this.ringSp.visible = true; this.ringSp.scale.set(0.3 + eout(k) * 3.2); this.disp.scale.set(90 * (1 - k)); } else { this.disp.scale.set(0); this.ringSp.visible = false; this.ringT = undefined; } }
  };
  Stage.prototype.shock = function (x, y, shake) { this.ringSp.x = x; this.ringSp.y = y; this.ringT = performance.now(); this.shake = Math.max(this.shake || 0, shake); };
  Stage.prototype.impactFrame = function (inv) { // 2 images noires sur blanc, 1 image blanche sur noir
    var s = this.sanj, sil = this.sil, fl = this.flash, self = this;
    if (!this.cm) { this.cm = new PIXI.ColorMatrixFilter(); sil.filters = [this.cm]; }
    var cm = this.cm, solid = function (col) { cm.matrix = [0, 0, 0, 0, (col >> 16) / 255, 0, 0, 0, 0, ((col >> 8) & 255) / 255, 0, 0, 0, 0, (col & 255) / 255, 0, 0, 0, 1, 0]; };
    sil.texture = s.texture; sil.scale.copyFrom(s.scale); sil.x = s.x + this.world.x; sil.y = s.y + this.world.y; sil.visible = true;
    fl.clear(); fl.beginFill(0xffffff).drawRect(0, 0, 1920, 1080).endFill(); solid(0x000000);
    setTimeout(function () { fl.clear(); fl.beginFill(0x000000).drawRect(0, 0, 1920, 1080).endFill(); solid(inv || 0xffffff); }, 55);
    setTimeout(function () { fl.clear(); sil.visible = false; }, 110);
  };
  Stage.prototype.say = function (jp, fr, col) { // nom du jutsu façon anime
    if (this.opt.noCallout) return;
    var c = this.callout; c.removeChildren().forEach(function (x) { x.destroy(); });
    var bar = new PIXI.Graphics(); bar.beginFill(col, 0.85).drawRect(0, 0, 1100, 150).endFill(); bar.y = 210; bar.alpha = 0; c.addChild(bar);
    var t1 = new PIXI.Text(jp, { fontFamily: 'Mincho30, serif', fontSize: 60, fontWeight: '800', fill: 0xffffff, stroke: 0x1e1a17, strokeThickness: 6 }); t1.x = 70; t1.y = 222; c.addChild(t1);
    var t2 = new PIXI.Text(fr, { fontFamily: 'Mincho30, serif', fontSize: 34, fontWeight: '800', fill: 0xfff6e0 }); t2.x = 74; t2.y = 300; c.addChild(t2);
    c.t0 = performance.now(); c.x = -120; c.alpha = 0;
    var self = this; var up = function () { var k = (performance.now() - c.t0) / 2600; if (k > 1 || !c.children.length) { c.alpha = 0; return; } c.x = -120 * (1 - eout(clamp(k * 6, 0, 1))); bar.alpha = 1; c.alpha = clamp(k * 8, 0, 1) * clamp((1 - k) * 5, 0, 1); requestAnimationFrame(up); }; up();
  };

  /* ================= 火 Feu : Katon, boule de feu suprême ================= */
  var FIRE = [[1, 0.86, 0.5], [1, 0.42, 0.06], [0.55, 0.06, 0.02]];
  Stage.prototype.feu = function (c, t, dt) {
    var O = this.O, T = this.T, P = this.pFx;
    if (!c.fired.say) { c.fired.say = 1; this.say('火遁・豪火球の術', 'Katon : Boule de feu suprême', 0xC8372D); }
    if (t < 650) { // les braises convergent vers le lanceur
      for (var i = 0; i < 6; i++) { var a = rnd(0, TAU), d = rnd(160, 340); P.add({ x: O.x + Math.cos(a) * d, y: O.y + Math.sin(a) * d, home: O, life: 700, sc0: rnd(0.3, 0.6), sc1: 0.1, c0: 0xffd27a, c1: 0xff5a1a }); }
      if (!this.ball) { this.ball = fireBall(120, FIRE); this.ball.x = O.x; this.ball.y = O.y; this.fx.addChild(this.ball); this.flame = this.anim('fire01', O.x, O.y, { size: 260, dur: 900, loop: true, life: 1500, ay: 0.78, fade: 0 }); }
      this.ball.width = this.ball.height = 60 + 160 * eout(t / 650);
    } else if (t < 1450) { // la boule file en arc vers Sanjûbi
      var k = (t - 650) / 800, e = eio(k), x = lerp(O.x, T.x, e), y = lerp(O.y, T.y, e) - Math.sin(k * Math.PI) * 180;
      var vx = (x - this.ball.x) / Math.max(dt, 1e-3), vy = (y - this.ball.y) / Math.max(dt, 1e-3);
      this.ball.x = x; this.ball.y = y; this.ball.width = this.ball.height = 230 + 90 * k;
      if (this.flame && !this.flame.s.destroyed) { this.flame.s.x = x; this.flame.s.y = y; this.flame.s.rotation = Math.atan2(-vy, -vx) + Math.PI / 2; var fk = (800 + 300 * k) / 128; this.flame.s.scale.set(fk * 0.9, fk); }
      for (var j = 0; j < 9; j++) P.add({ x: x + rnd(-40, 40), y: y + rnd(-40, 40), vx: -vx * 0.15 + rnd(-90, 90), vy: -vy * 0.15 + rnd(-90, 60) - 60, life: rnd(350, 650), sc0: rnd(1.1, 1.7), sc1: 0.2, c0: 0xffa030, c1: 0x7a1004, tex: TX.glow, drag: 0.04, a0: 0.42 });
      for (var f2 = 0; f2 < 3; f2++) { var fb = fireBall(rnd(70, 120), FIRE); fb.x = x + rnd(-30, 30); fb.y = y + rnd(-30, 30); fb.fx.uniforms.uTime = rnd(0, 9); this.fx.addChildAt(fb, 0); P.list.push({ s: fb, vx: -vx * 0.12 + rnd(-60, 60), vy: -vy * 0.12 - 80, life: 0, max: rnd(350, 550), sc0: fb.scale.x, sc1: fb.scale.x * 0.3, a0: 0.9, c0: 0xffffff, c1: 0xffffff, drag: 0.03, g: 0, align: false, spin: rnd(-2, 2), sx: 1, home: null }); }
      for (var s = 0; s < 2; s++) this.pBack.add({ x: x + rnd(-30, 30), y: y + rnd(-30, 30), vx: rnd(-40, 40), vy: rnd(-90, -30), life: rnd(900, 1400), sc0: rnd(0.8, 1.2), sc1: rnd(2.2, 3), c0: 0x3a2a26, c1: 0x120c0c, tex: TX.smoke, blend: PIXI.BLEND_MODES.NORMAL, a0: 0.55, spin: rnd(-1, 1) });
      for (var e2 = 0; e2 < 3; e2++) P.add({ x: x, y: y, vx: -vx * 0.3 + rnd(-220, 220), vy: -vy * 0.3 + rnd(-220, 120), life: rnd(400, 800), sc0: 0.5, sc1: 0.1, c0: 0xffe9a0, c1: 0xff5a1a, tex: TX.streak, sx: 0.5, align: true, g: 300 });
    } else if (!c.fired.hit) { // impact
      c.fired.hit = 1; c.stop = 90; this.impactFrame(0xffb347);
      if (this.ball) { this.ball.destroy(); this.ball = null; } if (this.flame && !this.flame.s.destroyed) this.flame.s.destroy();
      this.anim('explosion25', T.x, T.y - 40, { size: 1050, dur: 1300, add: false, fade: 0.2 });
      this.anim('toon31', T.x, T.y - 20, { size: 820, dur: 650, tint: 0xffb060, fade: 0.3 });
      var self2 = this; [[-260, 120], [140, -120], [300, 160], [-60, 230]].forEach(function (o, i) { self2.anim('fire01', T.x + o[0], T.y + o[1], { size: 560, dur: 700 + i * 90, loop: true, life: 1900 + i * 150, ay: 0.8, fade: 0.4, layer: self2.front }); });
      this.blast = fireBall(260, FIRE); this.blast.x = T.x; this.blast.y = T.y; this.fx.addChild(this.blast); this.blastT = t;
      this.shock(T.x, T.y, 46);
      for (var q = 0; q < 220; q++) { var an = rnd(0, TAU), sp = rnd(300, 1500); P.add({ x: T.x, y: T.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 200, life: rnd(500, 1100), sc0: rnd(0.4, 0.9), sc1: 0.1, c0: 0xfff2c0, c1: 0xff3d0a, tex: TX.streak, sx: 0.6, align: true, drag: 0.03, g: 700 }); }
      for (var m = 0; m < 26; m++) { var am = rnd(0, TAU), sm = rnd(60, 380); this.pBack.add({ x: T.x, y: T.y, vx: Math.cos(am) * sm, vy: Math.sin(am) * sm - 80, life: rnd(1400, 2400), sc0: rnd(1.5, 2.5), sc1: rnd(4, 6), c0: 0x4a3530, c1: 0x110b0b, tex: TX.smoke, blend: PIXI.BLEND_MODES.NORMAL, a0: 0.6, drag: 0.04, spin: rnd(-1, 1) }); }
    }
    if (this.blast) { // explosion qui s'étend puis se dissout
      var bk = (t - this.blastT) / 900; this.blast.fx.uniforms.uBurst = clamp(bk, 0, 1); this.blast.width = this.blast.height = 260 + eout(clamp(bk, 0, 1)) * 900; this.blast.alpha = 1 - clamp((bk - 0.6) / 0.4, 0, 1);
      if (bk > 1) { this.blast.destroy(); this.blast = null; }
      var burn = clamp(1 - (t - this.blastT) / 1600, 0, 1); this.sanj.tint = hexLerp(0xffffff, 0xff9a5a, burn * (0.6 + 0.4 * Math.sin(t / 40)));
    }
    if (c.fired.hit && t < 3200 && Math.random() < 0.6) P.add({ x: T.x + rnd(-260, 260), y: T.y + rnd(-60, 220), vx: rnd(-30, 30), vy: rnd(-160, -60), life: rnd(900, 1600), sc0: rnd(0.2, 0.4), sc1: 0, c0: 0xffc060, c1: 0xff4010 });
    [this.ball, this.blast].forEach(function (b) { if (b) b.fx.uniforms.uTime = t / 1000; });
  };

  /* ================= 雷 Foudre : Raiton, Chidori ================= */
  Stage.prototype.foudre = function (c, t, dt) {
    var O = this.O, T = this.T, P = this.pFx, self = this;
    if (!c.fired.say) { c.fired.say = 1; this.say('雷遁・千鳥', 'Raiton : Chidori', 0x2F5FD0); }
    var dark = t < 600 ? eout(t / 600) : t < 2400 ? 1 : 1 - clamp((t - 2400) / 600, 0, 1);
    this.sky.clear(); this.sky.beginFill(0x050a1e, 0.55 * dark).drawRect(0, 0, 1920, 1080).endFill();
    if (!c.fired.ch) { c.fired.ch = 1; this.anim('effect36', O.x, O.y, { size: 300, dur: 700, loop: true, life: 900, fade: 0.3, tint: 0xbfe0ff }); this.anim('crackle', O.x, O.y, { size: 260, dur: 500, loop: true, life: 900, fade: 0.3 }); }
    if (t < 650) { // la main crépite : petits arcs autour du lanceur
      if (!c.lt || t - c.lt > 45) { c.lt = t; var arcs = [];
        for (var i = 0; i < 5; i++) { var a = rnd(0, TAU), r = rnd(40, 110); boltPath(O.x, O.y, O.x + Math.cos(a) * r, O.y + Math.sin(a) * r, 0.35, 4, arcs, 0); }
        if (Math.random() < 0.4) boltPath(rnd(600, 1700), -20, rnd(700, 1600), rnd(80, 260), 0.3, 5, arcs, 1); // éclairs lointains dans les nuages
        drawBolts(this.bolts, arcs, 0x7FB8FF, 3, rnd(0.6, 1)); }
      for (var j = 0; j < 3; j++) { var aa = rnd(0, TAU); P.add({ x: O.x, y: O.y, vx: Math.cos(aa) * rnd(200, 500), vy: Math.sin(aa) * rnd(200, 500), life: 260, sc0: 0.35, sc1: 0, c0: 0xffffff, c1: 0x6fb6ff, tex: TX.streak, sx: 0.4, align: true }); }
    } else if (t < 1500) { // la frappe : 3 éclairs qui scintillent
      if (!c.fired.hit) { c.fired.hit = 1; c.stop = 80; this.impactFrame(0xbfe0ff); this.shock(T.x, T.y, 40);
        var self3 = this; [[-40, 120, 0], [-300, 220, 90], [260, 200, 170]].forEach(function (o) { setTimeout(function () { self3.anim('bolt', T.x + o[0], T.y + o[1], { size: 1150, dur: 650, ay: 0.97, fade: 0.35 }); }, o[2] / self3.speed); });
        this.anim('effect36', T.x, T.y, { size: 900, dur: 700, loop: true, life: 1100, tint: 0xcfe6ff, fade: 0.5 });
        this.anim('crackle', T.x, T.y, { size: 520, dur: 400, loop: true, life: 1500, fade: 0.4 });
        for (var q = 0; q < 160; q++) { var an = rnd(0, TAU), sp = rnd(400, 1700); P.add({ x: T.x, y: T.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: rnd(300, 700), sc0: rnd(0.4, 0.8), sc1: 0, c0: 0xffffff, c1: 0x4f8fff, tex: TX.streak, sx: 0.5, align: true, drag: 0.05 }); } }
      var k = t - 650, on = (k % 180) < 110;
      if (!c.bt || t - c.bt > 50) { c.bt = t; var bs = [];
        boltPath(T.x + rnd(-80, 80), -40, T.x + rnd(-40, 40), T.y + rnd(-30, 30), 0.22, 7, bs, 3);
        boltPath(O.x + 40, O.y - 30, T.x + rnd(-60, 0), T.y + rnd(-40, 40), 0.18, 7, bs, 2);
        if (k > 120) boltPath(T.x + rnd(200, 420), -40, T.x + rnd(40, 160), T.y + rnd(-60, 80), 0.22, 6, bs, 2);
        drawBolts(this.bolts, bs, 0x6FB6FF, 7, on ? 1 : 0.25); }
      this.flash.clear(); if (on && k < 420) this.flash.beginFill(0xdff0ff, 0.22 * (1 - k / 420)).drawRect(0, 0, 1920, 1080).endFill();
      this.sanj.tint = on ? 0xcfe6ff : 0x8fa8d8;
    } else if (t < 2600) { // des arcs rampent sur Sanjûbi
      this.flash.clear();
      if (!c.ct || t - c.ct > 60) { c.ct = t; var cr = [], fade = 1 - (t - 1500) / 1100;
        for (var n = 0; n < 4; n++) { var x0 = T.x + rnd(-380, 380), y0 = T.y + rnd(-200, 260); boltPath(x0, y0, x0 + rnd(-160, 160), y0 + rnd(-120, 120), 0.4, 4, cr, 0); }
        drawBolts(this.bolts, cr, 0x7FB8FF, 2.5, fade * rnd(0.5, 1)); }
      this.sanj.tint = hexLerp(0xffffff, 0xa9c8ff, 0.5 + 0.5 * Math.sin(t / 30) * (1 - (t - 1500) / 1100));
      if (Math.random() < 0.5) P.add({ x: T.x + rnd(-360, 360), y: T.y + rnd(-180, 240), vx: rnd(-200, 200), vy: rnd(-200, 200), life: 220, sc0: 0.3, sc1: 0, c0: 0xffffff, c1: 0x6fb6ff, tex: TX.streak, sx: 0.4, align: true });
    } else { this.bolts.clear(); this.sanj.tint = 0xffffff; }
  };

  /* ================= 風 Vent : Fûton, Grande percée ================= */
  // Un souffle invisible qui déforme l'image, porte poussière et feuilles, repousse Sanjûbi puis l'enferme dans une tornade.
  Stage.prototype.vent = function (c, t, dt) {
    var O = this.O, T = this.T, P = this.pFx, B = this.pBack, F = this.pFront;
    if (!c.fired.say) { c.fired.say = 1; this.say('風遁・大突破', 'Fûton : Grande percée', 0x4E7A3A); this.windT = 0; }
    var wd = this.windDisp, ws = 0;
    // 1. le vent se rassemble autour du lanceur (poussière et feuilles en spirale)
    if (t < 650) {
      ws = 20 * (t / 650);
      for (var i = 0; i < 3; i++) { var a = rnd(0, TAU), d = rnd(160, 320); B.add({ x: O.x + Math.cos(a) * d, y: O.y + Math.sin(a) * d * 0.55, vx: -Math.sin(a) * 900, vy: Math.cos(a) * 500, home: O, life: 800, sc0: rnd(0.9, 1.4), sc1: 0.3, c0: 0xe8f2e0, c1: 0xb8cdb0, tex: TX.smoke, blend: PIXI.BLEND_MODES.NORMAL, a0: 0.5, spin: rnd(-3, 3) }); }
      if (Math.random() < 0.7) F.add({ x: O.x + rnd(-300, 300), y: O.y + rnd(-220, 120), vx: rnd(-300, 300), vy: rnd(-300, 100), home: O, life: 800, sc0: rnd(0.9, 1.4), sc1: 0.6, c0: 0x9fd27a, c1: 0x5e9b47, tex: TX.leaf, blend: PIXI.BLEND_MODES.NORMAL, spin: rnd(-10, 10) });
    }
    // 2. la Grande percée : un mur de vent traverse l'écran
    if (t >= 650 && t < 1600) {
      var k = (t - 650) / 950, fx = lerp(O.x - 200, 2100, eio(k));
      ws = 85 * Math.sin(k * Math.PI) + 22;
      for (var j = 0; j < 3; j++) B.add({ x: fx - rnd(0, 380), y: rnd(250, 1000), vx: rnd(1800, 2600), vy: rnd(-120, 60), life: rnd(450, 700), sc0: rnd(1.2, 2), sc1: rnd(2.6, 3.6), c0: 0xf2f7ee, c1: 0xc9d8c2, tex: TX.smoke, blend: PIXI.BLEND_MODES.NORMAL, a0: 0.16, drag: 0.02, spin: rnd(-1, 1) });
      for (var q = 0; q < 3; q++) F.add({ x: fx - rnd(0, 300), y: rnd(200, 1000), vx: rnd(1600, 2400), vy: rnd(-300, 200), life: rnd(600, 900), sc0: rnd(1, 1.6), sc1: 0.8, c0: 0x9fd27a, c1: 0x4e7a3a, tex: TX.leaf, blend: PIXI.BLEND_MODES.NORMAL, spin: rnd(-14, 14) });
      if (Math.random() < 0.5) P.add({ x: fx - rnd(0, 200), y: rnd(250, 950), vx: rnd(1400, 2000), vy: 0, life: rnd(300, 500), sc0: rnd(2, 3), sc1: rnd(3, 4), c0: 0xffffff, c1: 0xdfffd8, tex: TX.glow, a0: 0.07 });
      if (fx > T.x - 350 && !c.fired.hit) { // le mur atteint Sanjûbi
        c.fired.hit = 1; c.stop = 90; this.impactFrame(0xe9ffe0); this.shock(T.x, T.y, 38); c.hitT = t;
        for (var m = 0; m < 24; m++) { var am = rnd(-1.2, 1.2), sm = rnd(500, 1500); B.add({ x: T.x - 200, y: T.y + rnd(-200, 250), vx: Math.cos(am) * sm, vy: Math.sin(am) * sm, life: rnd(600, 1000), sc0: rnd(1, 1.6), sc1: rnd(2.4, 3.2), c0: 0xf2f7ee, c1: 0xb8cdb0, tex: TX.smoke, blend: PIXI.BLEND_MODES.NORMAL, a0: 0.3, drag: 0.05, spin: rnd(-2, 2) }); }
      }
    }
    // Sanjûbi est repoussé puis revient
    var push = c.hitT ? Math.max(0, 1 - (t - c.hitT) / 900) : 0;
    this.sanj.x = 1300 + 90 * eout(push) * (push > 0 ? 1 : 0); this.sanj.rotation = 0.06 * push;
    // 3. la tornade : anneaux de poussière qui tournent autour de lui en montant
    if (t > 1300 && t < 3000) {
      var tk = (t - 1300) / 1700, fade = tk < 0.75 ? 1 : (1 - tk) / 0.25;
      ws = Math.max(ws, 55 * fade);
      for (var n = 0; n < 5; n++) {
        var ph = (t / 1000 * 7 + n * 1.26) % TAU, hy = rnd(0, 1), rad = 220 + hy * 230, x = T.x + Math.cos(ph) * rad, y = T.y + 300 - hy * 640 + Math.sin(ph) * rad * 0.18, front = Math.sin(ph) > 0;
        (front ? F : B).add({ x: x, y: y, vx: -Math.sin(ph) * rad * 6, vy: Math.cos(ph) * rad * 1.1 - 160, life: rnd(380, 560), sc0: rnd(0.7, 1.1) * (front ? 1.15 : 0.85), sc1: rnd(1.4, 1.9), c0: 0xf4f9f0, c1: 0xc5d8bd, tex: TX.smoke, blend: PIXI.BLEND_MODES.NORMAL, a0: (front ? 0.3 : 0.18) * fade, spin: 4 });
      }
      for (var lv = 0; lv < 2; lv++) if (Math.random() < 0.7 * fade) { var pl = rnd(0, TAU), rl = rnd(200, 420); F.add({ x: T.x + Math.cos(pl) * rl, y: T.y + 300 - rnd(0, 600), vx: -Math.sin(pl) * 1500, vy: rnd(-500, -200), life: 800, sc0: rnd(0.9, 1.4), sc1: 0.6, c0: 0x9fd27a, c1: 0x4e7a3a, tex: TX.leaf, blend: PIXI.BLEND_MODES.NORMAL, spin: rnd(-14, 14) }); }
    }
    if (t >= 3000) { this.sanj.x = 1300; this.sanj.rotation = 0; }
    // distorsion du vent : la carte de bruit défile vers la droite
    this.windSp.x = (this.windSp.x + 2400 * dt) % 512; this.windSp.y = 200 + Math.sin(t / 300) * 40;
    wd.scale.x = ws * 1.6; wd.scale.y = ws * 0.6;
  };


  // Avance la scène image par image (tests automatisés).
  Stage.prototype.advance = function (ms) { this.app.ticker.stop(); this._now = (this._now || performance.now()); var n = Math.round(ms / 16.67); for (var i = 0; i < n; i++) this.tick(1 / 60); this.app.render(); };
  window.Sorts = { Stage: Stage };
})();
