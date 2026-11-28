/* Coup final d'Alessia — moteur du QTE (téléphone, façon osu!) et de la cinématique (projection).
   Aucun fichier son : les bruitages sont synthétisés par le navigateur (Web Audio). */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eio(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function eout(t) { return 1 - Math.pow(1 - t, 3); }
  function ein(t) { return t * t * t; }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  /* ================= Partition ================= */
  var BPM = 138, BEAT = 60000 / BPM;
  var SEALS = [{ k: '未', n: 'Bélier' }, { k: '巳', n: 'Serpent' }, { k: '寅', n: 'Tigre' }];
  var SPIN_MS = 5000, SPIN_GOAL = 7; // 7 tours de doigt en 5 s = chakra au maximum
  function chart() {
    var R = rng(3030), notes = [];
    function add(beat, appr, x, y, o) { var n = { t: Math.round(beat * BEAT), appr: appr, x: x, y: y, n: 1, sec: 1 }; for (var k in o) n[k] = o[k]; notes.push(n); }
    // 1. Les 3 sceaux d'incantation
    SEALS.forEach(function (s, i) { add(3 + i * 2, 1150, 0.5, [0.3, 0.56, 0.8][i], { seal: i, sec: 0, n: i + 1 }); });
    // 2. Rythme : une note par temps, grands sauts
    var x = 0.5, y = 0.8, c = 1;
    for (var b = 10; b <= 25; b++) {
      var a, nx, ny, tries = 0;
      do { a = R() * TAU; nx = x + Math.cos(a) * (0.3 + R() * 0.15); ny = y + Math.sin(a) * (0.26 + R() * 0.14); tries++; } while ((nx < 0.15 || nx > 0.85 || ny < 0.22 || ny > 0.86) && tries < 40);
      x = clamp(nx, 0.15, 0.85); y = clamp(ny, 0.22, 0.86);
      add(b, 980, x, y, { n: c, sec: 1 }); c = c % 4 + 1;
    }
    // 3. Rafales : 4 notes au demi-temps en arc, puis une pause
    for (var g = 0; g < 4; g++) {
      var cx = 0.3 + R() * 0.4, cy = 0.34 + R() * 0.4, a0 = R() * TAU, dir = R() < 0.5 ? 1 : -1;
      for (var k = 0; k < 4; k++) add(27 + g * 3 + k * 0.5, 820, clamp(cx + Math.cos(a0 + dir * k * 0.9) * 0.17, 0.14, 0.86), clamp(cy + Math.sin(a0 + dir * k * 0.9) * 0.12, 0.2, 0.86), { n: k + 1, sec: 2 });
    }
    // 4. Final : sauts gauche-droite toutes les 3/4 de temps (adouci après test)
    for (var j = 0; j < 10; j++) {
      var side = j % 2 ? 0.68 : 0.32;
      add(40 + j * 0.75, 820, side + (R() - 0.5) * 0.06, 0.32 + (j / 9) * 0.46 + (R() - 0.5) * 0.06, { n: (j % 4) + 1, sec: 3 });
    }
    notes.sort(function (p, q) { return p.t - q.t; });
    return notes;
  }
  var SECTIONS = [
    { at: -3 * BEAT, k: '印', t: 'Les sceaux d’incantation' },
    { at: 9 * BEAT, k: '律', t: 'Concentre ton chakra' },
    { at: 26 * BEAT, k: '速', t: 'Plus vite !' },
    { at: 39 * BEAT, k: '極', t: 'Dernière ligne droite' },
  ];

  /* ================= Sons (synthétisés) ================= */
  function Sfx() { this.ctx = null; this.on = true; }
  Sfx.prototype.unlock = function () {
    if (this.ctx) return;
    try { var AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination); } catch (_) { this.ctx = null; }
  };
  Sfx.prototype.tone = function (f0, f1, dur, type, vol, delay) {
    if (!this.on || !this.ctx) return;
    var c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  };
  Sfx.prototype.noise = function (dur, vol, hp, delay) {
    if (!this.on || !this.ctx) return;
    var c = this.ctx, t = c.currentTime + (delay || 0), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 1200; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
  };
  Sfx.prototype.hit = function (j) { this.tone(j === 300 ? 230 : 190, 70, 0.16, 'sine', 0.9); this.noise(0.05, j === 300 ? 0.35 : 0.22, 2500); };
  Sfx.prototype.seal = function () { this.tone(520, 520, 0.5, 'triangle', 0.25); this.tone(780, 780, 0.6, 'sine', 0.18, 0.04); this.tone(160, 60, 0.3, 'sine', 0.9); };
  Sfx.prototype.miss = function () { this.tone(120, 90, 0.12, 'square', 0.08); };
  Sfx.prototype.tick = function (k) { this.tone(k ? 880 : 660, k ? 880 : 660, 0.09, 'sine', 0.22); };
  Sfx.prototype.spin = function (p) { this.tone(300 + p * 900, 320 + p * 900, 0.06, 'sawtooth', 0.04); };
  Sfx.prototype.launch = function () { this.noise(1.1, 0.5, 400); this.tone(140, 900, 0.9, 'sawtooth', 0.12); this.tone(60, 40, 1.2, 'sine', 0.8, 0.1); };

  /* ================= QTE (téléphone d'Alessia) ================= */
  var W300 = 70, W100 = 130, W50 = 190; // fenêtres de jugement (ms), un peu plus larges qu'osu!
  var COLS = ['#C8372D', '#2F6FE0', '#D99A1E', '#7A4CC2'];
  function QTE(canvas, opt) {
    this.cv = canvas; this.cx = canvas.getContext('2d'); this.opt = opt || {};
    this.sfx = this.opt.sfx || new Sfx();
    this.notes = chart(); this.fx = []; this.state = 'idle';
    this.n300 = 0; this.n100 = 0; this.n50 = 0; this.miss = 0; this.combo = 0; this.maxCombo = 0; this.score = 0;
    this.spinRot = 0; this.spinAng = null; this.spinLastTick = 0; this.sealsDone = 0;
    var self = this;
    this._resize = function () { self.resize(); };
    this._down = function (e) { self.down(e); };
    this._move = function (e) { self.move(e); };
    this._up = function (e) { self.up(e); };
    window.addEventListener('resize', this._resize);
    canvas.addEventListener('pointerdown', this._down);
    canvas.addEventListener('pointermove', this._move);
    window.addEventListener('pointerup', this._up);
    canvas.style.touchAction = 'none';
    this.resize();
  }
  QTE.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2.5);
    this.w = r.width; this.h = r.height; this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d);
    this.cx.setTransform(d, 0, 0, d, 0, 0);
    this.rad = clamp(Math.min(this.w, this.h) * 0.105, 30, 54);
  };
  QTE.prototype.pos = function (n) { var top = 70, bot = 70; return { x: n.x * this.w, y: top + n.y * (this.h - top - bot) }; };
  QTE.prototype.start = function (delay) {
    window.__qte = this;
    this.sfx.unlock();
    this.t0 = performance.now() + (delay === undefined ? 3 * BEAT + 600 : delay);
    this.state = 'notes'; this.lastBeat = -99; var self = this;
    var loop = function () { if (self.state === 'gone') return; self.frame(); self.raf = requestAnimationFrame(loop); };
    loop();
  };
  QTE.prototype.destroy = function () {
    this.state = 'gone'; cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._resize); window.removeEventListener('pointerup', this._up);
    this.cv.removeEventListener('pointerdown', this._down); this.cv.removeEventListener('pointermove', this._move);
  };
  QTE.prototype.now = function () { return performance.now() - this.t0; };
  QTE.prototype.total = function () { return this.notes.length; };
  QTE.prototype.judged = function () { return this.n300 + this.n100 + this.n50 + this.miss; };
  QTE.prototype.acc = function () { var j = this.judged(); return j ? (300 * this.n300 + 100 * this.n100 + 50 * this.n50) / (300 * j) : 1; };
  QTE.prototype.rank = function () {
    var a = this.acc(), r300 = this.judged() ? this.n300 / this.judged() : 1;
    if (a === 1) return 'SS';
    if (r300 > 0.9 && this.miss === 0) return 'S';
    if ((r300 > 0.8 && this.miss === 0) || r300 > 0.9) return 'A';
    if ((r300 > 0.7 && this.miss === 0) || r300 > 0.8) return 'B';
    if (r300 > 0.6) return 'C';
    return 'D';
  };
  QTE.prototype.result = function () {
    return { acc: this.acc(), rank: this.rank(), maxCombo: this.maxCombo, combo: this.combo, n300: this.n300, n100: this.n100, n50: this.n50, miss: this.miss, score: this.score, spin: clamp(this.spinRot / SPIN_GOAL, 0, 1), seals: this.sealsDone, total: this.total(), done: this.judged() };
  };
  QTE.prototype.emit = function (type) { if (this.opt.onEvent) this.opt.onEvent(type, this.result(), this.state); };
  QTE.prototype.judge = function (n, j) {
    n.j = j; n.jt = this.now();
    var p = this.pos(n);
    if (j) {
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += j * (1 + Math.floor(Math.max(0, this.combo - 1) / 10) * 0.25) | 0;
      if (j === 300) this.n300++; else if (j === 100) this.n100++; else this.n50++;
      if (n.seal !== undefined) { this.sealsDone++; this.sfx.seal(); } else this.sfx.hit(j);
    } else { this.miss++; this.combo = 0; this.sfx.miss(); }
    this.fx.push({ x: p.x, y: p.y, t: this.now(), j: j, seal: n.seal, col: n.seal !== undefined ? '#E9B949' : COLS[(n.sec + (n.n > 2 ? 1 : 0)) % 4] });
    this.emit(j ? 'hit' : 'miss');
  };
  QTE.prototype.pt = function (e) { var r = this.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  QTE.prototype.down = function (e) {
    e.preventDefault();
    var p = this.pt(e), t = this.now();
    if (this.state === 'notes') {
      for (var i = 0; i < this.notes.length; i++) {
        var n = this.notes[i]; if (n.j !== undefined) continue;
        if (t < n.t - n.appr) break;
        var q = this.pos(n), r = this.rad * (n.seal !== undefined ? 1.35 : 1) * 1.2;
        if (Math.hypot(p.x - q.x, p.y - q.y) > r) { continue; }
        var dt = Math.abs(t - n.t);
        if (t < n.t - W50 - 60) return; // trop tôt : ignoré
        this.judge(n, dt <= W300 ? 300 : dt <= W100 ? 100 : dt <= W50 ? 50 : 0);
        return;
      }
    } else if (this.state === 'spin') {
      this.spinAng = Math.atan2(p.y - this.h / 2, p.x - this.w / 2);
    } else if (this.state === 'launch') {
      this.swipe = { y: p.y, x: p.x, t: t };
    }
  };
  QTE.prototype.move = function (e) {
    var p = this.pt(e);
    if (this.state === 'spin' && this.spinAng !== null) {
      var a = Math.atan2(p.y - this.h / 2, p.x - this.w / 2), d = a - this.spinAng;
      if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      this.spinAng = a; var before = Math.floor(this.spinRot);
      this.spinRot += Math.abs(d) / TAU;
      if (Math.floor(this.spinRot) > before) { this.score += this.spinRot > SPIN_GOAL ? 1000 : 100; this.emit('spin'); }
      var now = performance.now(); if (now - this.spinLastTick > 70) { this.spinLastTick = now; this.sfx.spin(clamp(this.spinRot / SPIN_GOAL, 0, 1)); }
    } else if (this.state === 'launch' && this.swipe) {
      if (this.swipe.y - p.y > 90) this.doLaunch();
    }
  };
  QTE.prototype.up = function () { this.spinAng = null; this.swipe = null; };
  QTE.prototype.doLaunch = function () {
    if (this.state !== 'launch') return;
    this.state = 'flying'; this.flyAt = this.now(); this.swipe = null; this.sfx.launch();
    if (navigator.vibrate) try { navigator.vibrate([30, 40, 120]); } catch (_) {}
    this.emit('launch');
  };
  QTE.prototype.lastT = function () { return this.notes[this.notes.length - 1].t; };
  QTE.prototype.frame = function () {
    var t = this.now(), c = this.cx, w = this.w, h = this.h;
    // transitions d'état
    if (this.state === 'notes') {
      for (var i = 0; i < this.notes.length; i++) { var n = this.notes[i]; if (n.j === undefined && t > n.t + W50) this.judge(n, 0); }
      if (t > this.lastT() + 900) { this.state = 'spin'; this.spinStart = t; this.emit('spinStart'); }
      var bi = Math.floor(t / BEAT); if (t < 0 && bi !== this.lastBeat) { this.lastBeat = bi; if (bi >= -3) this.sfx.tick(bi === -1); }
    } else if (this.state === 'spin' && t > this.spinStart + SPIN_MS) { this.state = 'launch'; this.launchStart = t; this.emit('launchReady'); }
    else if (this.state === 'flying' && t > this.flyAt + 1100) { this.state = 'done'; this.emit('done'); }

    // fond
    var bg = c.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.5, Math.max(w, h) * 0.8);
    bg.addColorStop(0, '#2a1c2e'); bg.addColorStop(1, '#09070b');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    // filigrane + métronome visuel
    c.save(); c.globalAlpha = 0.05; c.fillStyle = '#F4ECDD'; c.font = '800 ' + (w * 0.62) + 'px Mincho30, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('火', w / 2, h / 2); c.restore();
    if (this.state === 'notes') {
      var ph = ((t % BEAT) + BEAT) % BEAT / BEAT;
      c.save(); c.strokeStyle = 'rgba(244,236,221,' + (0.1 * (1 - ph)) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) * (0.2 + ph * 0.5), 0, TAU); c.stroke(); c.restore();
    }

    if (this.state === 'notes' || (this.state === 'spin' && t - this.spinStart < 400)) this.drawNotes(t);
    if (this.state === 'spin') this.drawSpinner(t);
    if (this.state === 'launch' || this.state === 'flying' || this.state === 'done') this.drawLaunch(t);
    this.drawFx(t);
    this.drawHud(t);
  };
  QTE.prototype.drawNotes = function (t) {
    var c = this.cx;
    for (var i = this.notes.length - 1; i >= 0; i--) {
      var n = this.notes[i];
      if (n.j !== undefined) continue;
      var s = n.t - n.appr; if (t < s || t > n.t + W50) continue;
      var p = this.pos(n), seal = n.seal !== undefined, r = this.rad * (seal ? 1.35 : 1);
      var fade = clamp((t - s) / (n.appr * 0.35), 0, 1), late = t > n.t ? clamp(1 - (t - n.t) / W50, 0, 1) : 1;
      var col = seal ? '#E9B949' : COLS[(n.sec + (n.n > 2 ? 1 : 0)) % 4];
      c.save(); c.globalAlpha = fade * late;
      // cercle d'approche
      if (t < n.t) { var ar = r * (1 + 2.3 * (n.t - t) / n.appr); c.strokeStyle = col; c.lineWidth = 3.5; c.beginPath(); c.arc(p.x, p.y, ar, 0, TAU); c.stroke(); }
      // note
      var g = c.createRadialGradient(p.x - r * 0.3, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
      g.addColorStop(0, seal ? '#FFF3C4' : '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, seal ? '#7a4f05' : '#140f14');
      c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill();
      c.lineWidth = 4; c.strokeStyle = '#F4ECDD'; c.stroke();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (seal) { c.font = '800 ' + (r * 1.05) + 'px Mincho30, serif'; c.fillText(SEALS[n.seal].k, p.x, p.y + 2); c.font = '700 ' + Math.max(11, r * 0.28) + 'px Gothic30, sans-serif'; c.fillStyle = '#F7E6A8'; c.fillText(SEALS[n.seal].n, p.x, p.y + r + 16); }
      else { c.font = '900 ' + (r * 0.8) + 'px Gothic30, sans-serif'; c.fillText(n.n, p.x, p.y + 1); }
      c.restore();
    }
  };
  QTE.prototype.drawFx = function (t) {
    var c = this.cx;
    this.fx = this.fx.filter(function (f) { return t - f.t < 650; });
    for (var i = 0; i < this.fx.length; i++) {
      var f = this.fx[i], k = (t - f.t) / 650;
      c.save();
      if (f.j) {
        c.globalAlpha = 1 - k; c.strokeStyle = f.col; c.lineWidth = 6 * (1 - k); c.beginPath(); c.arc(f.x, f.y, this.rad * (1 + k * 0.9) * (f.seal !== undefined ? 1.35 : 1), 0, TAU); c.stroke();
        for (var s = 0; s < 8; s++) { var a = s / 8 * TAU + f.t, d = this.rad * (1.1 + eout(k) * 1.4); c.fillStyle = f.col; c.fillRect(f.x + Math.cos(a) * d - 2, f.y + Math.sin(a) * d - 2, 4, 4); }
      }
      c.globalAlpha = clamp(1.4 - k * 1.4, 0, 1); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 ' + (f.j === 300 ? 22 : 20) + 'px Gothic30, sans-serif';
      c.fillStyle = f.j === 300 ? '#7FD4FF' : f.j === 100 ? '#9BE37E' : f.j === 50 ? '#F2C14E' : '#FF5A4E';
      c.fillText(f.j ? String(f.j) : '✕', f.x, f.y - this.rad * 0.2 - k * 22);
      c.restore();
    }
  };
  QTE.prototype.drawSpinner = function (t) {
    var c = this.cx, w = this.w, h = this.h, k = clamp((t - this.spinStart) / 350, 0, 1), p = clamp(this.spinRot / SPIN_GOAL, 0, 1);
    var R = Math.min(w, h) * 0.36, cx = w / 2, cy = h / 2, left = Math.max(0, SPIN_MS - (t - this.spinStart));
    c.save(); c.globalAlpha = k;
    // anneau de progression
    c.lineWidth = 10; c.strokeStyle = 'rgba(244,236,221,.12)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    c.strokeStyle = p >= 1 ? '#F7E6A8' : '#7FD4FF'; c.shadowColor = '#7FD4FF'; c.shadowBlur = 18; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * p); c.stroke(); c.shadowBlur = 0;
    // Rasen-shuriken qui se forme
    drawShuriken(c, cx, cy, R * (0.25 + p * 0.5), t / 1000 * (4 + p * 14), 0.5 + p * 0.5);
    c.fillStyle = '#F4ECDD'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '800 22px Mincho30, serif'; c.fillText(p >= 1 ? 'Chakra au maximum !' : 'Tourne ton doigt autour du cercle !', cx, cy - R - 34);
    c.font = '900 15px Gothic30, sans-serif'; c.fillStyle = '#bdae95'; c.fillText(Math.round(p * 100) + ' % · ' + (left / 1000).toFixed(1) + ' s', cx, cy + R + 30);
    c.restore();
  };
  QTE.prototype.drawLaunch = function (t) {
    var c = this.cx, w = this.w, h = this.h, p = clamp(this.spinRot / SPIN_GOAL, 0, 1), cx = w / 2;
    var fly = this.state === 'launch' ? 0 : clamp((t - this.flyAt) / 900, 0, 1);
    var cy = lerp(h * 0.62, -h * 0.4, ein(fly));
    drawShuriken(c, cx, cy, Math.min(w, h) * (0.16 + p * 0.1) * (1 + fly * 0.6), t / 1000 * 16, 1);
    if (this.state === 'launch') {
      var b = (t - this.launchStart) % 1100 / 1100;
      c.save(); c.fillStyle = '#F7E6A8'; c.textAlign = 'center'; c.font = '800 26px Mincho30, serif'; c.fillText('Glisse vers le haut', cx, h * 0.25); c.font = '800 20px Mincho30, serif'; c.fillText('pour lancer !', cx, h * 0.25 + 32);
      c.globalAlpha = 1 - b; c.strokeStyle = '#F7E6A8'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
      var ay = h * 0.46 - b * 50; c.beginPath(); c.moveTo(cx - 26, ay + 20); c.lineTo(cx, ay - 6); c.lineTo(cx + 26, ay + 20); c.stroke();
      c.restore();
    }
    if (fly > 0.6) { c.save(); c.globalAlpha = clamp((fly - 0.6) / 0.4, 0, 1); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.restore(); }
  };
  QTE.prototype.drawHud = function (t) {
    var c = this.cx, w = this.w, h = this.h;
    c.save(); c.fillStyle = '#F4ECDD';
    // score + précision
    c.textAlign = 'right'; c.textBaseline = 'top'; c.font = '900 24px Gothic30, sans-serif';
    c.fillText(String(Math.round(this.score)).padStart(7, '0'), w - 14, 14);
    // combo
    if (this.state === 'notes' && this.combo > 1) { c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillStyle = '#F4ECDD'; c.font = '900 ' + (34 + Math.min(this.combo, 60) * 0.25) + 'px Gothic30, sans-serif'; c.fillText(this.combo + 'x', 14, h - 12); }
    // progression
    var prog = this.state === 'notes' ? clamp((t + 3 * BEAT) / (this.lastT() + 3 * BEAT), 0, 1) : 1;
    c.strokeStyle = 'rgba(244,236,221,.2)'; c.lineWidth = 3; c.beginPath(); c.arc(28, 30, 13, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(244,236,221,.7)'; c.beginPath(); c.moveTo(28, 30); c.arc(28, 30, 13, -Math.PI / 2, -Math.PI / 2 + TAU * prog); c.closePath(); c.fill();
    // sections
    if (this.state === 'notes') {
      for (var i = SECTIONS.length - 1; i >= 0; i--) {
        var s = SECTIONS[i]; if (t < s.at) continue;
        var k = (t - s.at) / 1600; if (k > 1) break;
        c.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#C8372D'; c.font = '800 46px Mincho30, serif'; c.fillText(s.k, w / 2, h * 0.11);
        c.fillStyle = '#F4ECDD'; c.font = '800 20px Mincho30, serif'; c.fillText(s.t, w / 2, h * 0.11 + 40);
        break;
      }
      if (t < 0) { var cd = Math.ceil(-t / BEAT); if (cd <= 3) { c.globalAlpha = 1; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F7E6A8'; c.font = '800 96px Mincho30, serif'; c.fillText(cd, w / 2, h * 0.5); } }
    }
    c.restore();
  };
  // Rasen-shuriken : cœur lumineux, anneau de chakra, 4 lames qui tournent.
  function drawShuriken(c, x, y, r, rot, a) {
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
    var g = c.createRadialGradient(x, y, 0, x, y, r * 1.6); g.addColorStop(0, 'rgba(180,225,255,.55)'); g.addColorStop(1, 'rgba(60,120,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.6, 0, TAU); c.fill();
    for (var b = 0; b < 4; b++) {
      var a0 = rot + b * TAU / 4;
      c.fillStyle = 'rgba(225,242,255,.55)';
      c.beginPath(); c.moveTo(x + Math.cos(a0) * r * 0.25, y + Math.sin(a0) * r * 0.25);
      c.quadraticCurveTo(x + Math.cos(a0 + 0.55) * r * 1.05, y + Math.sin(a0 + 0.55) * r * 1.05, x + Math.cos(a0 + 0.2) * r * 1.5, y + Math.sin(a0 + 0.2) * r * 1.5);
      c.quadraticCurveTo(x + Math.cos(a0 + 0.12) * r * 0.85, y + Math.sin(a0 + 0.12) * r * 0.85, x + Math.cos(a0 - 0.35) * r * 0.3, y + Math.sin(a0 - 0.35) * r * 0.3);
      c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(160,215,255,.8)'; c.lineWidth = Math.max(2, r * 0.05);
    for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(x, y, r * (0.5 + k * 0.12), rot * (k % 2 ? -1.3 : 1.1) + k, rot * (k % 2 ? -1.3 : 1.1) + k + 4.2); c.stroke(); }
    var core = c.createRadialGradient(x, y, 0, x, y, r * 0.55); core.addColorStop(0, '#ffffff'); core.addColorStop(0.5, 'rgba(170,220,255,.95)'); core.addColorStop(1, 'rgba(70,140,255,0)');
    c.fillStyle = core; c.beginPath(); c.arc(x, y, r * 0.55, 0, TAU); c.fill();
    c.restore();
  }

  /* ================= Arène de la Bataille des 30 queues (projection, 1920×1080 virtuel) =================
     Tout est calculé à partir de l'état du jeu et de l'heure du serveur : un rechargement de page retombe au bon endroit. */
  var VW = 1920, VH = 1080, SX = 1300, SY = 560, SWID = 940, HPMAX = 2026, CLMS = 6000;
  var HERO = { x: 560, y: 600, r: 190 };
  var CLAN = {
    feu: { n: 'Clan du Feu', c: '#E0532C', g: '#FFB347', j: 'Katon : Boule de feu suprême', s: '火' },
    foudre: { n: 'Clan de la Foudre', c: '#3C7BEA', g: '#BFE0FF', j: 'Raiton : Chidori', s: '雷' },
    vent: { n: 'Clan du Vent', c: '#5E9B47', g: '#D8F5C8', j: 'Fûton : Lames de vide', s: '風' },
  };
  var IMPACT = 900, SHATTER = 3300, FORM = 6400, TXT = 9800;
  function fmtNum(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function clanOrder(sums) { // le clan qui fait le moins de dégâts attaque en premier, pour finir en apothéose
    return ['foudre', 'feu', 'vent'].slice().sort(function (a, b) { return (sums[a] || 0) - (sums[b] || 0); });
  }
  function makeCracks(x0, y0, seed, n, L0) {
    var R = rng(seed), out = [];
    for (var b = 0; b < n; b++) {
      var a = b / n * TAU + R() * 0.5, len = 0, x = x0, y = y0, pts = [[x, y]], L = L0 + R() * L0;
      while (len < L) { a += (R() - 0.5) * 0.7; var s = 22 + R() * 26; x += Math.cos(a) * s; y += Math.sin(a) * s; len += s; pts.push([x, y]); }
      out.push({ pts: pts, d: R() * 0.4 });
    }
    return out;
  }
  function d20Poly(c, x, y, s, val, col, glow) {
    c.save(); c.translate(x, y);
    if (glow) { c.shadowColor = glow; c.shadowBlur = 30; }
    c.beginPath(); for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * TAU / 6; c.lineTo(Math.cos(a) * s, Math.sin(a) * s); } c.closePath();
    c.fillStyle = col || '#f8efdc'; c.fill(); c.shadowBlur = 0; c.lineWidth = s * 0.09; c.strokeStyle = '#2b1d12'; c.stroke();
    c.fillStyle = '#2b1d12'; c.font = '800 ' + (s * (String(val).length > 1 ? 0.78 : 0.95)) + 'px Mincho30, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(val, 0, s * 0.06);
    c.restore();
  }

  function Arena(canvas, opt) {
    this.cv = canvas; this.cx = canvas.getContext('2d'); this.opt = opt || {};
    this.st = null; this.embers = []; this.names = []; this.fx = []; this.seenCh = {}; this.parts = null;
    this.hpShown = HPMAX; this.hpTrail = HPMAX; this.trailHold = 0; this.prevTaps = null; this.emitQ = { feu: 0, foudre: 0, vent: 0 };
    var self = this;
    ['sanj', 'bg', 'portrait'].forEach(function (k) { if (self.opt[k]) { var im = new Image(); im.onload = function () { self[k] = im; if (k === 'sanj') self.prepParticles(); }; im.src = self.opt[k]; } });
    for (var i = 0; i < 140; i++) this.embers.push(this.newEmber(true));
    this.cracks = makeCracks(SX, SY, 77, 9, 260);
    this.glass = makeCracks(1640, 160, 12, 7, 220);
    this._resize = function () { self.resize(); }; window.addEventListener('resize', this._resize); this.resize();
    var loop = function () { if (self.gone) return; if (self.cv.isConnected) self.frame(); self.raf = requestAnimationFrame(loop); }; loop();
  }
  Arena.prototype.destroy = function () { this.gone = true; cancelAnimationFrame(this.raf); window.removeEventListener('resize', this._resize); };
  Arena.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return;
    this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d); this.k = this.cv.width / VW;
  };
  Arena.prototype.newEmber = function (anyY) { return { x: Math.random() * VW, y: anyY ? Math.random() * VH : VH + 20, vy: 30 + Math.random() * 70, vx: (Math.random() - 0.5) * 20, s: 1.5 + Math.random() * 3, ph: Math.random() * TAU }; };
  Arena.prototype.T = function () { return this.opt.now ? this.opt.now() : Date.now(); };
  // Nouvel état du jeu (à chaque interrogation du serveur).
  Arena.prototype.update = function (st) {
    var self = this; this.st = st;
    var tc = st.tapsClan;
    if (tc) { if (this.prevTaps) ['feu', 'foudre', 'vent'].forEach(function (k) { self.emitQ[k] += Math.max(0, (tc[k] || 0) - (self.prevTaps[k] || 0)); }); this.prevTaps = tc; }
    var f = st.fin;
    if (f && f.ch) f.ch.forEach(function (v) { var key = v.n + ':' + v.t; if (!self.seenCh[key]) { self.seenCh[key] = 1; self.addName(v.n); } });
    var L = f && f.launch;
    if (L && this.launchKey !== L.at) { this.launchKey = L.at; this.ended = false; if (this.parts) this.parts.forEach(function (p) { p.x = p.hx; p.y = p.hy; p.fired = false; }); }
  };
  Arena.prototype.addName = function (name) { var side = Math.random() < 0.5; this.names.push({ t: performance.now(), name: name, x: side ? -100 : VW + 100, y: 150 + Math.random() * 780 }); };
  Arena.prototype.prepParticles = function () {
    var im = this.sanj, sh = SWID * im.height / im.width, oc = document.createElement('canvas'), step = 7;
    oc.width = Math.round(SWID / step); oc.height = Math.round(sh / step);
    var o = oc.getContext('2d'); o.drawImage(im, 0, 0, oc.width, oc.height);
    var d, ps = [];
    try { d = o.getImageData(0, 0, oc.width, oc.height).data; } catch (_) { return; }
    for (var y = 0; y < oc.height; y++) for (var x = 0; x < oc.width; x++) {
      var i = (y * oc.width + x) * 4; if (d[i + 3] < 140) continue;
      var hx = SX - SWID / 2 + x * step, hy = SY - sh / 2 + y * step;
      ps.push({ hx: hx, hy: hy, x: hx, y: hy, vx: 0, vy: 0, r: d[i], g: d[i + 1], b: d[i + 2], tx: 0, ty: 0, seed: Math.random() });
    }
    var tc = document.createElement('canvas'); tc.width = 900; tc.height = 560; var tx = tc.getContext('2d');
    tx.fillStyle = '#fff'; tx.font = '800 600px Mincho30, Georgia, serif'; tx.textAlign = 'center'; tx.textBaseline = 'middle'; tx.fillText('30', 450, 300);
    var td = tx.getImageData(0, 0, 900, 560).data, tg = [];
    for (var yy = 0; yy < 560; yy += 9) for (var xx = 0; xx < 900; xx += 9) if (td[(yy * 900 + xx) * 4 + 3] > 128) tg.push([960 - 450 + xx, 520 - 300 + yy]);
    for (var j = tg.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), tmp = tg[j]; tg[j] = tg[r]; tg[r] = tmp; }
    ps.forEach(function (p, i) { if (i < tg.length) { p.tx = tg[i][0] + (Math.random() - 0.5) * 6; p.ty = tg[i][1] + (Math.random() - 0.5) * 6; p.keep = true; } else p.keep = false; });
    this.parts = ps; this.sh = sh;
  };
  // Les coups portés à Sanjûbi (heure, dégâts, couleur), déduits de l'état : servent aux PV, chiffres, flashs et secousses.
  Arena.prototype.hits = function () {
    var st = this.st, b = st && st.boss, out = [];
    if (!b) return out;
    if (b.p1 && b.p1.sums) {
      var ord = clanOrder(b.p1.sums), tot = ord.reduce(function (a, k) { return a + (b.p1.sums[k] || 0); }, 0) || 1;
      ord.forEach(function (k, i) { out.push({ at: b.p1.at + i * CLMS + 2600, dmg: Math.round(b.p1.dmg * (b.p1.sums[k] || 0) / tot), col: CLAN[k].c, k: 1 }); });
    }
    if (b.p2 && b.p2.done) out.push({ at: (b.p2.at || 0) + 1100, dmg: b.p2.dmg, col: '#7FD4FF', k: 1.3 });
    var L = st.fin && st.fin.launch; if (L) out.push({ at: L.at + IMPACT, dmg: 30, col: '#ffffff', k: 2, fin: true });
    return out;
  };
  Arena.prototype.frame = function () {
    if (!this.st || !this.k) return;
    var c = this.cx, k = this.k, T = this.T(), now = performance.now(), st = this.st, b = st.boss || {};
    var f = st.fin || null, launch = f && f.launch, L = launch ? T - launch.at : -1e9, inFinal = !!b.fin;
    var hits = this.hits(), hp = HPMAX, shake = 0, flash = 0, recoil = 0;
    hits.forEach(function (h) {
      if (T >= h.at) hp -= h.dmg;
      var dt = T - h.at; if (dt >= 0 && dt < 700) { shake = Math.max(shake, (1 - dt / 700) * 18 * h.k); flash = Math.max(flash, (1 - dt / 500) * 0.55 * Math.min(1, h.k)); recoil = Math.max(recoil, 1 - dt / 400); }
    });
    if (launch && L >= IMPACT) hp = 0;
    hp = Math.max(0, hp);
    if (L > SHATTER && L < SHATTER + 400) shake = Math.max(shake, (1 - (L - SHATTER) / 400) * 16);
    if (L >= IMPACT && L < IMPACT + 700) shake = Math.max(shake, (1 - (L - IMPACT) / 700) * 28);
    // barre de vie : descend vite, traînée blanche qui rattrape après un temps
    this.hpShown += (hp - this.hpShown) * 0.12; if (Math.abs(hp - this.hpShown) < 0.5) this.hpShown = hp;
    if (hp < this.hpTrail) { if (!this.trailHold) this.trailHold = now + 650; if (now > this.trailHold) this.hpTrail += (hp - this.hpTrail) * 0.06; } else { this.hpTrail = hp; this.trailHold = 0; }
    if (Math.abs(this.hpTrail - hp) < 0.5) { this.hpTrail = hp; this.trailHold = 0; }

    c.setTransform(k, 0, 0, k, (Math.random() - 0.5) * shake * k, (Math.random() - 0.5) * shake * k);
    var zoom = L > 0 && L < IMPACT ? 1 + eio(L / IMPACT) * 0.06 : L >= IMPACT && L < IMPACT + 800 ? 1.06 - eout((L - IMPACT) / 800) * 0.06 : 1;
    if (zoom !== 1) { c.translate(VW / 2, VH / 2); c.scale(zoom, zoom); c.translate(-VW / 2, -VH / 2); }
    var dawn = L > FORM ? clamp((L - FORM) / 3000, 0, 1) : 0;
    // fond : le village en flammes, puis l'aube
    c.fillStyle = '#0d0a0c'; c.fillRect(-50, -50, VW + 100, VH + 100);
    if (this.bg) { var bh = VW * this.bg.height / this.bg.width; c.save(); c.filter = 'blur(3px)'; c.drawImage(this.bg, 0, (VH - bh) / 2, VW, bh); c.restore(); }
    var dim = inFinal ? 0.6 : 0.3; if (L > 0) dim = lerp(0.8, 0.35, dawn);
    c.fillStyle = 'rgba(10,6,10,' + dim + ')'; c.fillRect(-50, -50, VW + 100, VH + 100);
    if (dawn > 0) { var dg = c.createLinearGradient(0, 0, 0, VH); dg.addColorStop(0, 'rgba(255,190,120,' + 0.28 * dawn + ')'); dg.addColorStop(1, 'rgba(120,40,60,' + 0.2 * dawn + ')'); c.fillStyle = dg; c.fillRect(0, 0, VW, VH); }
    // vignette rouge qui bat tant que Sanjûbi vit
    if (L < SHATTER) { var vp = 0.32 + 0.12 * Math.sin(now / 520); var vg = c.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VH * 1.05); vg.addColorStop(0, 'rgba(120,10,10,0)'); vg.addColorStop(1, 'rgba(150,15,10,' + vp + ')'); c.fillStyle = vg; c.fillRect(-50, -50, VW + 100, VH + 100); }
    this.drawEmbers(c, now, L > SHATTER ? '#ffd9a0' : '#ff8a3d');
    // Sanjûbi (ou ses étincelles après l'éclatement)
    var ripoAmp = this.riposte(T);
    if (L < SHATTER) this.drawSanj(c, now, L, recoil, ripoAmp);
    if (L >= SHATTER && this.parts) this.drawParts(c, L - SHATTER, FORM - SHATTER);
    if (L < SHATTER) this.drawHp(c, now, T);
    // phases
    if (b.p1 && !inFinal) this.drawP1(c, T, now);
    if (b.p2 && !inFinal) this.drawP2(c, T, now);
    if (inFinal && L < IMPACT + 400) this.drawHero(c, now, L);
    this.drawNames(c, now);
    var live = f && f.live;
    if (launch && L >= 0 && L < IMPACT + 120) { var fl = clamp(L / IMPACT, 0, 1), e = ein(fl), x = lerp(HERO.x, SX, e), y = lerp(HERO.y - 130, SY - 40, e) - Math.sin(fl * Math.PI) * 120; this.drawTrail(c, x, y, now); drawShuriken(c, x, y, 120 + 60 * fl, now / 1000 * 18, 1); }
    else if (inFinal && L < 0 && live && (live.phase === 'spin' || live.phase === 'launch')) drawShuriken(c, HERO.x, HERO.y - 250, 50 + live.spin * 110, now / 1000 * (5 + live.spin * 14), 0.6 + live.spin * 0.4);
    if (L >= IMPACT && L < IMPACT + 1200) { var q = (L - IMPACT) / 1200; c.save(); c.globalAlpha = 1 - q; c.strokeStyle = '#ffffff'; c.lineWidth = 40 * (1 - q); c.beginPath(); c.arc(SX, SY - 40, 80 + eout(q) * 1100, 0, TAU); c.stroke(); c.restore(); }
    // chiffres de dégâts
    this.drawDmg(c, T, hits, L);
    c.setTransform(k, 0, 0, k, 0, 0);
    // riposte : l'écran se fissure
    if (ripoAmp > 0) this.drawGlass(c, ripoAmp);
    // bandes cinéma
    var lb = launch ? (L < 0 ? 0.6 : L < 600 ? 0.6 + 0.4 * eout(L / 600) : L > TXT + 4000 ? 1 - clamp((L - TXT - 4000) / 800, 0, 1) : 1) : (inFinal && live ? 0.6 : 0);
    if (lb > 0) { c.fillStyle = '#000'; c.fillRect(0, 0, VW, 90 * lb); c.fillRect(0, VH - 90 * lb, VW, 90 * lb); }
    if (flash > 0 && !(launch && L >= IMPACT && L < IMPACT + 900)) { c.fillStyle = 'rgba(255,255,255,' + flash + ')'; c.fillRect(0, 0, VW, VH); }
    if (launch && L >= IMPACT && L < IMPACT + 900) { c.fillStyle = 'rgba(255,255,255,' + (1 - (L - IMPACT) / 900) + ')'; c.fillRect(0, 0, VW, VH); }
    if (L >= SHATTER && L < SHATTER + 500) { c.fillStyle = 'rgba(255,240,220,' + 0.7 * (1 - (L - SHATTER) / 500) + ')'; c.fillRect(0, 0, VW, VH); }
    if (L >= IMPACT && L < IMPACT + 1500) this.drawDon(c, L - IMPACT);
    if (L >= TXT) this.drawEnd(c, L - TXT, launch.res);
    this.drawCaption(c, T, now, inFinal, live, L, b);
    if (launch && !launch.replay && L > TXT + 9000 && !this.ended) { this.ended = true; if (this.opt.onEnd) this.opt.onEnd(); }
  };
  Arena.prototype.drawEmbers = function (c, now, col) {
    var dt = Math.min(0.05, (now - (this.lastT || now)) / 1000); this.lastT = now;
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = col;
    for (var i = 0; i < this.embers.length; i++) {
      var e = this.embers[i]; e.y -= e.vy * dt; e.x += (e.vx + Math.sin(now / 700 + e.ph) * 14) * dt;
      if (e.y < -20) this.embers[i] = e = this.newEmber(false);
      c.globalAlpha = 0.35 + 0.35 * Math.sin(now / 180 + e.ph); c.beginPath(); c.arc(e.x, e.y, e.s, 0, TAU); c.fill();
    }
    // fumée qui passe
    c.globalCompositeOperation = 'source-over';
    for (var s = 0; s < 4; s++) {
      var sx = ((now / 60 + s * 600) % (VW + 800)) - 400, sy = 260 + s * 190 + Math.sin(now / 3000 + s) * 40;
      var sg = c.createRadialGradient(sx, sy, 0, sx, sy, 380); sg.addColorStop(0, 'rgba(40,30,35,.22)'); sg.addColorStop(1, 'rgba(40,30,35,0)');
      c.globalAlpha = 1; c.fillStyle = sg; c.fillRect(sx - 400, sy - 400, 800, 800);
    }
    c.restore();
  };
  // Amplitude de la riposte de Sanjûbi entre deux attaques de clans (0 à 1).
  Arena.prototype.riposte = function (T) {
    var b = this.st.boss; if (!b || !b.p1 || b.fin) return 0;
    for (var i = 0; i < 2; i++) { var t = T - (b.p1.at + i * CLMS + 4300); if (t >= 0 && t < 1500) return Math.sin(t / 1500 * Math.PI); }
    return 0;
  };
  Arena.prototype.drawSanj = function (c, now, L, recoil, ripo) {
    if (!this.sanj) return;
    var frozen = L >= IMPACT, br = frozen ? 1 : 1 + Math.sin(now / 900) * 0.015 + ripo * 0.07, sh = SWID * this.sanj.height / this.sanj.width;
    var tremble = frozen ? (Math.random() - 0.5) * 4 * clamp((L - IMPACT) / 2400, 0, 1) : ripo * (Math.random() - 0.5) * 10;
    c.save(); c.translate(SX + tremble + recoil * 34, SY - ripo * 20); c.scale(br, br);
    c.shadowColor = frozen ? 'rgba(255,255,255,.9)' : ripo > 0 ? 'rgba(255,40,20,.9)' : 'rgba(255,140,40,.55)';
    c.shadowBlur = frozen ? 40 + 60 * clamp((L - IMPACT) / 2400, 0, 1) : 50 + Math.sin(now / 450) * 15 + ripo * 60;
    if (this.st.boss.fin && L < 0) c.globalAlpha = 0.85;
    c.drawImage(this.sanj, -SWID / 2, -sh / 2, SWID, sh); c.shadowBlur = 0;
    if (recoil > 0 || frozen) { var w = frozen ? clamp((L - IMPACT - 600) / 1800, 0, 1) : recoil * 0.7; c.globalCompositeOperation = 'lighter'; c.globalAlpha = w * 0.9; c.drawImage(this.sanj, -SWID / 2, -sh / 2, SWID, sh); }
    c.restore();
    if (frozen) {
      var g = clamp((L - IMPACT - 200) / 2000, 0, 1);
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      for (var i = 0; i < this.cracks.length; i++) {
        var cr = this.cracks[i], p = clamp((g - cr.d) / (1 - cr.d), 0, 1); if (p <= 0) continue;
        var n = Math.max(2, Math.floor(cr.pts.length * p));
        c.strokeStyle = 'rgba(255,250,235,.95)'; c.shadowColor = '#bfe4ff'; c.shadowBlur = 24; c.lineWidth = 5;
        c.beginPath(); c.moveTo(cr.pts[0][0], cr.pts[0][1] - 40); for (var j = 1; j < n; j++) c.lineTo(cr.pts[j][0], cr.pts[j][1] - 40); c.stroke();
      }
      c.restore();
    }
  };
  Arena.prototype.drawGlass = function (c, a) {
    c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(255,245,235,.95)'; c.lineWidth = 6; c.lineJoin = 'round'; c.shadowColor = '#fff'; c.shadowBlur = 10;
    for (var i = 0; i < this.glass.length; i++) { var g = this.glass[i]; c.beginPath(); c.moveTo(g.pts[0][0], g.pts[0][1]); for (var j = 1; j < g.pts.length; j++) c.lineTo(g.pts[j][0], g.pts[j][1]); c.stroke(); }
    var fg = c.createLinearGradient(0, VH, 0, VH - 360); fg.addColorStop(0, 'rgba(255,90,20,' + 0.55 * a + ')'); fg.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = fg; c.globalAlpha = 1; c.fillRect(0, VH - 360, VW, 360);
    c.fillStyle = 'rgba(160,10,0,' + 0.18 * a + ')'; c.fillRect(0, 0, VW, VH);
    c.globalAlpha = a; c.shadowBlur = 0; c.font = '800 80px Mincho30, serif'; c.textAlign = 'center'; c.lineWidth = 14; c.strokeStyle = '#1E1A17'; c.strokeText('Sanjûbi riposte !', SX, 950); c.fillStyle = '#FFD9B8'; c.fillText('Sanjûbi riposte !', SX, 950);
    c.restore();
  };
  Arena.prototype.drawParts = function (c, T, formAt) {
    var dt = Math.min(0.05, (performance.now() - (this.lastP || performance.now())) / 1000); this.lastP = performance.now();
    var forming = T > formAt, ft = forming ? clamp((T - formAt) / 2600, 0, 1) : 0, t = performance.now();
    c.save(); c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (!p.fired) { var a = Math.atan2(p.hy - (SY - 40), p.hx - SX) + (p.seed - 0.5) * 0.8, sp = 300 + p.seed * 1100; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 120; p.fired = true; }
      if (!forming) { p.vx *= Math.pow(0.12, dt); p.vy = p.vy * Math.pow(0.12, dt) - 20 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      else if (p.keep) { var e = eio(clamp(ft * 1.15 - p.seed * 0.15, 0, 1)); p.x = lerp(p.x, p.tx, 0.04 + e * 0.2); p.y = lerp(p.y, p.ty, 0.04 + e * 0.2); }
      else { p.y -= 60 * dt; p.x += Math.sin(t / 500 + p.seed * 9) * 0.6; }
      var heat = clamp(T / 2200, 0, 1), alpha = p.keep ? 1 : clamp(1 - (T - 1500) / 3000, 0, 1);
      if (alpha <= 0) continue;
      var fl = forming && p.keep ? 0.75 + 0.25 * Math.sin(t / 90 + p.seed * 40) : 1;
      var r = Math.round(lerp(p.r, 255, heat)), g = Math.round(lerp(p.g, forming ? 150 + 80 * p.seed : 200, heat)), bb = Math.round(lerp(p.b, forming ? 40 : 120, heat));
      c.globalAlpha = alpha * fl; c.fillStyle = 'rgb(' + r + ',' + g + ',' + bb + ')';
      var s = forming && p.keep ? 4.2 : 3.4; c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    if (forming && ft > 0.6) { var hg = c.createRadialGradient(960, 520, 40, 960, 520, 520); hg.addColorStop(0, 'rgba(255,170,60,' + 0.22 * (ft - 0.6) / 0.4 + ')'); hg.addColorStop(1, 'rgba(255,120,40,0)'); c.globalAlpha = 1; c.fillStyle = hg; c.fillRect(0, 0, VW, VH); }
    c.restore();
  };
  // Barre de vie façon jeu de combat + les 30 bougies (une par PV restant) après le Rasengan.
  Arena.prototype.drawHp = function (c, now, T) {
    var x = 360, y = 112, w = 1200, b = this.st.boss;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - 6, y - 6, w + 12, 32);
    c.fillStyle = '#3a0d0d'; c.fillRect(x, y, w, 20);
    c.fillStyle = '#F4ECDD'; c.fillRect(x, y, w * clamp(this.hpTrail / HPMAX, 0, 1), 20);
    var hg = c.createLinearGradient(0, y, 0, y + 20); hg.addColorStop(0, '#ff5a3c'); hg.addColorStop(1, '#a3241a');
    c.fillStyle = hg; c.fillRect(x, y, w * clamp(this.hpShown / HPMAX, 0, 1), 20);
    c.font = '800 34px Mincho30, serif'; c.fillStyle = '#F4ECDD'; c.textBaseline = 'bottom'; c.textAlign = 'left'; c.fillText('SANJÛBI', x, y - 12);
    c.font = '700 20px Gothic30, sans-serif'; c.fillStyle = '#f0a090'; c.fillText('三十尾 · le démon à 30 queues', x + 190, y - 16);
    c.textAlign = 'right'; c.font = '900 24px Gothic30, sans-serif'; c.fillStyle = '#F4ECDD'; c.fillText(fmtNum(this.hpShown) + ' / ' + fmtNum(HPMAX) + ' PV', x + w, y - 12);
    // les 30 bougies enchaînées, qui arrivent après l'impact du Rasengan
    var p2 = b && b.p2, ca = p2 && p2.done ? T - ((p2.at || 0) + 1300) : -1;
    if (ca >= 0) {
      var by = y + 62;
      c.strokeStyle = 'rgba(190,190,200,' + clamp(ca / 1600, 0, 1) * 0.8 + ')'; c.lineWidth = 3;
      for (var lx = x + 10; lx < x + w - 10; lx += 22) { c.beginPath(); c.ellipse(lx, by + 28, 9, 5, 0, 0, TAU); c.stroke(); }
      for (var i = 0; i < 30; i++) {
        var p = clamp((ca - i * 30) / 900, 0, 1); if (p <= 0) continue;
        var tx = x + 20 + i * (w - 40) / 29, sx = SX, sy = SY, e = eout(p), bx = lerp(sx, tx, e), byy = lerp(sy, by, e) - Math.sin(p * Math.PI) * 120, fl = Math.sin(now / 120 + i * 1.7) * 0.15;
        c.fillStyle = '#e9dcc4'; c.fillRect(bx - 4, byy, 8, 22);
        c.globalCompositeOperation = 'lighter';
        var fg = c.createRadialGradient(bx, byy - 8, 0, bx, byy - 8, 16); fg.addColorStop(0, 'rgba(255,240,180,.95)'); fg.addColorStop(1, 'rgba(255,120,30,0)');
        c.fillStyle = fg; c.beginPath(); c.ellipse(bx, byy - 8, 7, 12 * (1 + fl), 0, 0, TAU); c.fill();
        c.globalCompositeOperation = 'source-over';
      }
    }
    c.restore();
  };
  // Phase 1 : chaque clan attaque à son tour (dés, jutsu, impact), Sanjûbi riposte entre deux.
  Arena.prototype.drawP1 = function (c, T, now) {
    var p1 = this.st.boss.p1, ord = clanOrder(p1.sums), t0 = T - p1.at;
    if (t0 < 0 || t0 > 3 * CLMS + 3500) return;
    var i = Math.min(2, Math.floor(t0 / CLMS)), k = ord[i], t = t0 - i * CLMS, cl = CLAN[k];
    var dice = (p1.dice && p1.dice[k]) || [];
    if (t0 >= 3 * CLMS - 1700) { // bilan
      var a = clamp((t0 - (3 * CLMS - 1700)) / 600, 0, 1) * clamp((3 * CLMS + 3500 - t0) / 600, 0, 1);
      c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.fillStyle = '#F7E6A8'; c.font = '800 70px Mincho30, serif'; c.shadowColor = '#000'; c.shadowBlur = 20;
      c.fillText('Total des clans : ' + fmtNum(p1.dmg) + ' dégâts', 960, 960); c.restore();
      if (t0 >= 3 * CLMS) return;
    }
    if (t > 4300) return;
    // bandeau du clan
    var ba = clamp(t / 350, 0, 1) * clamp((4300 - t) / 400, 0, 1);
    c.save(); c.globalAlpha = ba; c.translate(-80 * (1 - eout(clamp(t / 350, 0, 1))), 0);
    var gr = c.createLinearGradient(0, 0, 1100, 0); gr.addColorStop(0, cl.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.fillRect(0, 230, 1100, 150);
    c.fillStyle = '#fff'; c.font = '800 34px Mincho30, serif'; c.textBaseline = 'middle'; c.fillText(cl.s + '  ' + cl.n + ' attaque !', 70, 278);
    c.font = '800 54px Mincho30, serif'; c.fillStyle = '#FFF6E0'; c.fillText(cl.j, 70, 338);
    c.restore();
    // dés en 3D (public/dice.js), lancés depuis la gauche et posés sous le bandeau
    var n = dice.length, s = n > 8 ? 34 : n > 5 ? 44 : 54, gap = s * 2.4, x0 = 520 - (n - 1) * gap / 2, ws = p1.at + i * CLMS, key = p1.at + ':' + k;
    this.p1Rolls = this.p1Rolls || {};
    if (!this.p1Rolls[key] && window.Dice3D) this.p1Rolls[key] = dice.map(function (v, d) { var R = Dice3D.seeded(key + ':' + d); return new Dice3D.Roll({ val: v, t0: ws + 200 + d * 40, dur: 1500, from: [-80 + R() * 160, 200 + R() * 120], to: [x0 + d * gap, 610], size: s, h: s * 2.4, rand: R }); });
    var rl = this.p1Rolls[key] || [];
    for (var d = 0; d < rl.length; d++) {
      if (T < rl[d].t0) continue;
      var stD = Dice3D.render(c, rl[d], T, { rays: 2.4 }), v = dice[d];
      if (stD.done) {
        var pop = clamp(stD.land / 260, 0, 1), sc = 1.8 - 0.8 * eout(pop);
        c.save(); c.translate(stD.x, stD.y - s * 1.75); c.scale(sc, sc); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 ' + (s * 0.95) + 'px Mincho30, serif'; c.lineWidth = s * 0.14; c.strokeStyle = '#1E1A17'; c.strokeText(v, 0, 0); c.fillStyle = v === 20 ? '#FFD34D' : v === 1 ? '#FF7A6E' : '#F3CF6A'; c.fillText(v, 0, 0); c.restore();
        if (v === 20 || v === 1) { c.save(); c.globalAlpha = clamp((stD.land - 120) / 300, 0, 1); c.textAlign = 'center'; c.font = '900 ' + (s * 0.55) + 'px Gothic30, sans-serif'; c.fillStyle = v === 20 ? '#FFD34D' : '#FF7A6E'; c.lineWidth = 6; c.strokeStyle = '#1E1A17'; c.strokeText(v === 20 ? 'CRITIQUE !' : 'Raté !', stD.x, stD.y - s * 2.75); c.fillText(v === 20 ? 'CRITIQUE !' : 'Raté !', stD.x, stD.y - s * 2.75); c.restore(); }
      }
    }
    if (t >= 1950) { c.save(); c.globalAlpha = clamp((t - 1950) / 300, 0, 1); c.textAlign = 'center'; c.font = '900 ' + (n > 8 ? 26 : 32) + 'px Gothic30, sans-serif'; c.fillStyle = '#F4ECDD'; c.shadowColor = '#000'; c.shadowBlur = 12; c.fillText('(' + dice.join(' + ') + ') × chakra ' + p1.mult + ' = ' + fmtNum(p1.sums[k]), 520, 730); c.restore(); }
    // jutsu
    if (t >= 1700 && t < 2700) this.drawJutsu(c, k, (t - 1700) / 900, now);
  };
  Arena.prototype.drawJutsu = function (c, k, p, now) {
    var tx = SX - 120, ty = SY - 20;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (k === 'feu') {
      var e = eio(clamp(p, 0, 1)), x = lerp(120, tx, e), y = lerp(820, ty, e) - Math.sin(e * Math.PI) * 220;
      for (var i = 0; i < 18; i++) { var q = i / 18, px = lerp(x, lerp(120, tx, Math.max(0, e - 0.25)), q), py = lerp(y, y + 60, q) + Math.sin(now / 50 + i) * 12; var r = 70 * (1 - q); var g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,230,150,' + (0.6 * (1 - q)) + ')'); g.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill(); }
      var g2 = c.createRadialGradient(x, y, 0, x, y, 110); g2.addColorStop(0, '#fff8e0'); g2.addColorStop(0.35, '#FFB347'); g2.addColorStop(0.7, 'rgba(230,70,20,.7)'); g2.addColorStop(1, 'rgba(200,40,10,0)');
      c.fillStyle = g2; c.beginPath(); c.arc(x, y, 110, 0, TAU); c.fill();
    } else if (k === 'foudre') {
      var R = rng(Math.floor(now / 70));
      for (var b = 0; b < 5; b++) {
        var sx = 700 + R() * 1100, sy = -20, ex = tx + (R() - 0.5) * 300, ey = ty + (R() - 0.5) * 220, pts = [[sx, sy]], steps = 12;
        for (var j = 1; j <= steps; j++) { var f = j / steps; pts.push([lerp(sx, ex, f) + (R() - 0.5) * 80 * (1 - f * 0.6), lerp(sy, ey, f)]); }
        var vis = clamp(p * 1.6 - b * 0.12, 0, 1); if (vis <= 0) continue;
        var m = Math.max(2, Math.floor(pts.length * vis));
        c.strokeStyle = 'rgba(150,200,255,.55)'; c.lineWidth = 16; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (j = 1; j < m; j++) c.lineTo(pts[j][0], pts[j][1]); c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke();
      }
    } else {
      for (var w = 0; w < 6; w++) {
        var pw = clamp(p * 1.3 - w * 0.06, 0, 1); if (pw <= 0 || pw >= 1) continue;
        var wx = lerp(-100, tx, eio(pw)), wy = 330 + w * 85 + Math.sin(w) * 30, rot = -0.3 + pw * 0.6;
        c.save(); c.translate(wx, wy); c.rotate(rot);
        c.strokeStyle = 'rgba(216,245,200,.9)'; c.lineWidth = 10; c.shadowColor = '#bff5a8'; c.shadowBlur = 20;
        c.beginPath(); c.arc(0, 0, 90, -1.1, 1.1); c.stroke(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.beginPath(); c.arc(-8, 0, 84, -0.9, 0.9); c.stroke();
        c.restore();
      }
      if (p > 0.75) { var tp = (p - 0.75) / 0.25; c.strokeStyle = 'rgba(216,245,200,' + (0.6 * (1 - tp)) + ')'; c.lineWidth = 6; for (var e2 = 0; e2 < 7; e2++) { c.beginPath(); c.ellipse(tx, ty + 200 - e2 * 60, 80 + e2 * 30 + tp * 60, 22 + e2 * 6, 0, now / 200 + e2, now / 200 + e2 + 4.5); c.stroke(); } }
    }
    c.restore();
  };
  // Phase 2 : le Rasengan collectif, nourri par trois flux de chakra aux couleurs des clans.
  Arena.prototype.drawP2 = function (c, T, now) {
    var st = this.st, p2 = st.boss.p2, O = { x: 600, y: 560 }, exp = Math.max(1, (p2.cap || 500) / (p2.per || 1));
    var taps = p2.done ? (p2.taps || 0) : (st.tapsLive || 0), fill = clamp(taps / exp, 0, 1);
    if (p2.done) {
      var t = T - (p2.at || 0); if (t > 4800) return;
      if (t < 1100) { var e = ein(clamp(t / 1100, 0, 1)), x = lerp(O.x, SX - 60, e), y = lerp(O.y, SY - 30, e); this.drawTrail(c, x, y, now); this.drawRasengan(c, x, y, 70 + 160 * fill, now); }
      if (t >= 1500) { c.save(); c.globalAlpha = clamp((t - 1500) / 500, 0, 1) * clamp((4800 - t) / 500, 0, 1); c.textAlign = 'center'; c.font = '800 58px Mincho30, serif'; c.fillStyle = '#F7E6A8'; c.shadowColor = '#000'; c.shadowBlur = 20; c.fillText('Il ne lui reste que 30 PV… une par bougie !', 960, 940); c.restore(); }
      return;
    }
    var dt = Math.min(0.05, (now - (this.lastE || now)) / 1000); this.lastE = now;
    var run = T >= p2.start && T < p2.end, src = { foudre: [260, -40], feu: [-60, 880], vent: [760, 1140] }, self = this;
    if (run) ['feu', 'foudre', 'vent'].forEach(function (k) { var n = Math.min(12, Math.ceil(self.emitQ[k] * dt * 3)) + (Math.random() < 0.3 ? 1 : 0); self.emitQ[k] = Math.max(0, self.emitQ[k] - n / 3); for (var i = 0; i < n; i++) self.fx.push({ k: k, x: src[k][0] + (Math.random() - 0.5) * 220, y: src[k][1] + (Math.random() - 0.5) * 120, v: 500 + Math.random() * 500, life: 0 }); });
    c.save(); c.globalCompositeOperation = 'lighter';
    this.fx = this.fx.filter(function (p) {
      var dx = O.x - p.x, dy = O.y - p.y, d = Math.hypot(dx, dy); if (d < 40) return false;
      p.x += dx / d * p.v * dt + Math.sin(now / 120 + p.v) * 2; p.y += dy / d * p.v * dt; p.v *= 1.02; p.life += dt;
      c.fillStyle = CLAN[p.k].g; c.globalAlpha = 0.85; c.beginPath(); c.arc(p.x, p.y, 5, 0, TAU); c.fill();
      c.globalAlpha = 0.25; c.fillStyle = CLAN[p.k].c; c.beginPath(); c.arc(p.x, p.y, 14, 0, TAU); c.fill();
      return p.life < 3;
    });
    c.restore();
    this.drawRasengan(c, O.x, O.y, 60 + 160 * fill * (run || T >= p2.end ? 1 : 0.2), now);
    c.save(); c.textAlign = 'center'; c.shadowColor = '#000'; c.shadowBlur = 16;
    if (T < p2.start) { var cd = Math.ceil((p2.start - T) / 1000); c.fillStyle = '#F7E6A8'; c.font = '800 240px Mincho30, serif'; c.fillText(cd, O.x, O.y + 80); c.font = '800 48px Mincho30, serif'; c.fillStyle = '#F4ECDD'; c.fillText('Rasengan collectif : préparez vos doigts !', 960, 940); }
    else {
      if (run) { var rp = clamp((p2.end - T) / (p2.end - p2.start), 0, 1); c.strokeStyle = '#7FD4FF'; c.lineWidth = 12; c.beginPath(); c.arc(O.x, O.y, 280, -Math.PI / 2, -Math.PI / 2 + TAU * rp); c.stroke(); }
      c.fillStyle = '#F4ECDD'; c.font = '900 46px Gothic30, sans-serif'; c.fillText(fmtNum(taps) + ' tapes · ' + fmtNum(Math.min(p2.cap || 1e9, taps * (p2.per || 1))) + ' dégâts', O.x, 960);
      c.font = '800 44px Mincho30, serif'; c.fillStyle = '#F7E6A8'; c.fillText(run ? 'Tapez ! Tapez ! Tapez !' : 'Rasengan chargé !', O.x, 200 + 0 * Math.sin(now / 200));
      // flux par clan
      var tc = st.tapsClan || {}; c.font = '900 30px Gothic30, sans-serif';
      ['foudre', 'feu', 'vent'].forEach(function (k, i) { c.fillStyle = CLAN[k].g; c.fillText(CLAN[k].s + ' ' + fmtNum(tc[k] || 0), O.x - 260 + i * 260, 1020); });
    }
    c.restore();
  };
  Arena.prototype.drawRasengan = function (c, x, y, r, now) {
    c.save(); c.globalCompositeOperation = 'lighter';
    var g = c.createRadialGradient(x, y, 0, x, y, r * 1.5); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(190,228,255,.95)'); g.addColorStop(0.65, 'rgba(90,150,255,.6)'); g.addColorStop(1, 'rgba(60,90,200,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(3, r * 0.04);
    for (var i = 0; i < 6; i++) { var a = now / 90 + i * 1.05; c.beginPath(); c.arc(x, y, r * (0.45 + (i % 3) * 0.18), a, a + 2.2); c.stroke(); }
    c.restore();
  };
  Arena.prototype.drawTrail = function (c, x, y, now) {
    this.trail = (this.trail || []).filter(function (p) { return now - p.t < 260; }); this.trail.push({ x: x, y: y, t: now });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.trail.length; i++) { var p = this.trail[i], a = 1 - (now - p.t) / 260; c.globalAlpha = a * 0.5; c.fillStyle = '#9fd3ff'; c.beginPath(); c.arc(p.x, p.y, 90 * a, 0, TAU); c.fill(); }
    c.restore();
  };
  Arena.prototype.drawDmg = function (c, T, hits, L) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    hits.forEach(function (h, i) {
      var dt = T - h.at; if (dt < 0 || dt > 1800 || h.fin) return;
      var p = dt / 1800, s = dt < 200 ? 1.6 - 0.6 * (dt / 200) : 1;
      c.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
      c.save(); c.translate(SX + (i % 2 ? 140 : -120), SY - 160 - p * 120); c.scale(s, s);
      c.font = '900 110px Gothic30, sans-serif'; c.lineWidth = 12; c.strokeStyle = '#1E1A17'; c.strokeText('−' + fmtNum(h.dmg), 0, 0); c.fillStyle = h.col === '#ffffff' ? '#F7E6A8' : '#FFF1DC'; c.shadowColor = h.col; c.shadowBlur = 30; c.fillText('−' + fmtNum(h.dmg), 0, 0);
      c.restore();
    });
    c.restore();
  };
  Arena.prototype.drawHero = function (c, now, L) {
    var m = (this.st.fin && this.st.fin.live) || { phase: 'wait', prog: 0, seals: 0, spin: 0, combo: 0, score: 0 }, launch = this.st.fin && this.st.fin.launch;
    if (launch && launch.res && L >= 0) m = { phase: 'launch', prog: 1, seals: 3, spin: launch.res.spin || 1, combo: 0, score: launch.res.score };
    var x = HERO.x, y = HERO.y, r = HERO.r, a = L > 0 ? 1 - clamp((L - 300) / 900, 0, 1) : 1;
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    var au = 0.35 + m.prog * 0.4 + m.spin * 0.4, ag = c.createRadialGradient(x, y, r * 0.8, x, y, r * (1.6 + m.spin * 0.6));
    ag.addColorStop(0, 'rgba(120,190,255,' + (0.35 * au) + ')'); ag.addColorStop(1, 'rgba(80,140,255,0)');
    c.fillStyle = ag; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
    if (this.portrait) { var s = Math.max(2 * r / this.portrait.width, 2 * r / this.portrait.height); c.drawImage(this.portrait, x - this.portrait.width * s / 2, y - this.portrait.height * s / 2, this.portrait.width * s, this.portrait.height * s); }
    else { c.fillStyle = '#2a1c2e'; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
    c.restore();
    c.lineWidth = 8; c.strokeStyle = '#F4ECDD'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.lineWidth = 12; c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x, y, r + 26, 0, TAU); c.stroke();
    c.strokeStyle = '#7FD4FF'; c.shadowColor = '#7FD4FF'; c.shadowBlur = 20; c.beginPath(); c.arc(x, y, r + 26, -Math.PI / 2, -Math.PI / 2 + TAU * m.prog); c.stroke(); c.shadowBlur = 0;
    for (var i = 0; i < 3; i++) {
      var an = -Math.PI / 2 + (i - 1) * 0.75, sx = x + Math.cos(an) * (r + 80), sy = y + Math.sin(an) * (r + 80), on = m.seals > i;
      c.save(); c.translate(sx, sy); c.rotate(-0.08);
      c.fillStyle = on ? '#C8372D' : 'rgba(30,22,26,.85)'; c.strokeStyle = on ? '#F7E6A8' : 'rgba(244,236,221,.35)'; c.lineWidth = 3;
      if (on) { c.shadowColor = '#ffb347'; c.shadowBlur = 30; }
      c.fillRect(-36, -36, 72, 72); c.shadowBlur = 0; c.strokeRect(-36, -36, 72, 72);
      c.fillStyle = on ? '#FBF3E6' : 'rgba(244,236,221,.4)'; c.font = '800 46px Mincho30, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(SEALS[i].k, 0, 3);
      c.restore();
    }
    c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = '#F4ECDD'; c.font = '800 52px Mincho30, serif'; c.fillText('Alessia', x, y + r + 44);
    if (m.phase !== 'wait') { c.font = '900 30px Gothic30, sans-serif'; c.fillStyle = '#7FD4FF'; c.fillText((m.phase === 'qte' ? m.combo + 'x combo · ' : '') + fmtNum(m.score || 0) + ' pts', x, y + r + 110); }
    c.restore();
  };
  Arena.prototype.drawNames = function (c, now) {
    this.names = this.names.filter(function (n) { return now - n.t < 2600; });
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    for (var i = 0; i < this.names.length; i++) {
      var n = this.names[i], f = (now - n.t) / 2600, e = eio(f), x = lerp(n.x, HERO.x, e), y = lerp(n.y, HERO.y, e) - Math.sin(f * Math.PI) * 80;
      c.globalAlpha = f < 0.15 ? f / 0.15 : f > 0.8 ? (1 - f) / 0.2 : 1;
      c.font = '800 ' + (50 - f * 20) + 'px Mincho30, serif'; c.fillStyle = '#F7E6A8'; c.shadowColor = '#7FD4FF'; c.shadowBlur = 16; c.fillText(n.name, x, y);
    }
    c.restore();
  };
  Arena.prototype.drawDon = function (c, T) {
    var p = clamp(T / 260, 0, 1), s = T < 260 ? 2.4 - 1.4 * eout(p) : 1, a = T > 1100 ? 1 - (T - 1100) / 400 : 1;
    c.save(); c.globalAlpha = clamp(a, 0, 1); c.translate(1500, 300); c.rotate(-0.12); c.scale(s, s);
    c.font = '800 220px Mincho30, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 18; c.strokeStyle = '#fff'; c.strokeText('ドン!', 0, 0); c.fillStyle = '#1E1A17'; c.fillText('ドン!', 0, 0);
    c.restore();
  };
  Arena.prototype.drawEnd = function (c, T, r) {
    function fade(t0) { return clamp((T - t0) / 700, 0, 1); }
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    var a1 = fade(0); c.globalAlpha = a1; c.fillStyle = '#F4ECDD'; c.font = '800 64px Mincho30, serif'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 20;
    c.fillText('Sanjûbi est vaincu.', 960, 860 - (1 - eout(a1)) * 20);
    var a2 = fade(1400); c.globalAlpha = a2; c.fillStyle = '#F7E6A8'; c.font = '800 54px Mincho30, serif';
    c.fillText('Les 30 bougies sont libérées !', 960, 940 - (1 - eout(a2)) * 20);
    if (r && !r.forced) {
      var a3 = fade(2800); c.globalAlpha = a3; c.shadowBlur = 0;
      var sc = T < 2800 ? 0 : T < 3200 ? 1.8 - 0.8 * eout((T - 2800) / 400) : 1;
      c.save(); c.translate(1580, 470); c.scale(sc, sc);
      c.font = '700 26px Gothic30, sans-serif'; c.fillStyle = '#f0a090'; c.fillText('SCORE D’ALESSIA', 0, -86);
      c.font = '800 110px Mincho30, serif'; c.fillStyle = '#F7E6A8'; c.shadowColor = '#F7C948'; c.shadowBlur = 30; c.fillText(fmtNum(r.score || 0), 0, 0);
      c.shadowBlur = 0; c.font = '900 30px Gothic30, sans-serif'; c.fillStyle = '#F4ECDD'; c.fillText('combo max ' + (r.maxCombo || 0), 0, 86);
      c.restore();
    }
    c.restore();
  };
  Arena.prototype.drawCaption = function (c, T, now, inFinal, live, L, b) {
    var txt = '';
    if (inFinal && !live && L < 0) txt = 'Alessia, à toi de porter le coup final';
    else if (!b.p1 && !inFinal) txt = 'Les clans se préparent à attaquer…';
    if (!txt) return;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F4ECDD'; c.font = '800 72px Mincho30, serif'; c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 24;
    c.globalAlpha = 0.75 + 0.25 * Math.sin(now / 600); c.fillText(txt, 960, 980); c.restore();
  };

  window.Finale = { QTE: QTE, Arena: Arena, Sfx: Sfx, chart: chart, BEAT: BEAT, SPIN_MS: SPIN_MS, drawShuriken: drawShuriken, clanOrder: clanOrder, CLMS: CLMS, CLAN: CLAN };
})();
