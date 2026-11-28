/* Dé à 20 faces en vraie 3D (icosaèdre dessiné sur canvas 2D, sans bibliothèque).
   Le dé tombe toujours sur la valeur demandée : on calcule l'orientation finale qui montre cette face, puis on y ajoute des tours qui s'amortissent. */
(function () {
  'use strict';
  var TAU = Math.PI * 2, PHI = (1 + Math.sqrt(5)) / 2;
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mv(M, v) { return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]]; }
  function mm(A, B) { var C = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) C.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]); return C; }
  function rot(ax, a) { var x = ax[0], y = ax[1], z = ax[2], c = Math.cos(a), s = Math.sin(a), t = 1 - c; return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function eout(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // --- géométrie de l'icosaèdre ---
  var RAW = [];
  [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI]].forEach(function (p) { RAW.push(p, [p[1], p[2], p[0]], [p[2], p[0], p[1]]); });
  var V = RAW.map(norm), F = [];
  for (var i = 0; i < 12; i++) for (var j = i + 1; j < 12; j++) for (var k = j + 1; k < 12; k++) {
    var e = function (a, b) { return Math.hypot(RAW[a][0] - RAW[b][0], RAW[a][1] - RAW[b][1], RAW[a][2] - RAW[b][2]); };
    if (Math.abs(e(i, j) - 2) < 1e-6 && Math.abs(e(j, k) - 2) < 1e-6 && Math.abs(e(i, k) - 2) < 1e-6) {
      var c = norm([(V[i][0] + V[j][0] + V[k][0]), (V[i][1] + V[j][1] + V[k][1]), (V[i][2] + V[j][2] + V[k][2])]);
      var n = norm(cross(sub(V[j], V[i]), sub(V[k], V[i])));
      F.push(dot(n, c) > 0 ? { v: [i, j, k], n: c } : { v: [i, k, j], n: c });
    }
  }
  // numéros : faces opposées = 21 (comme un vrai d20)
  var ORDER = [1, 7, 13, 19, 5, 11, 17, 3, 9, 15], k0 = 0;
  F.forEach(function (f) { if (f.num) return; var o = F.filter(function (g) { return dot(g.n, f.n) < -0.99; })[0]; f.num = ORDER[k0++]; o.num = 21 - f.num; });
  F.forEach(function (f) { var p = V[f.v[0]]; var cen = [(V[f.v[0]][0] + V[f.v[1]][0] + V[f.v[2]][0]) / 3, (V[f.v[0]][1] + V[f.v[1]][1] + V[f.v[2]][1]) / 3, (V[f.v[0]][2] + V[f.v[1]][2] + V[f.v[2]][2]) / 3]; f.c = cen; f.up = norm(sub(p, cen)); });

  // Orientation qui montre la face « val » de face, lisible, avec une légère inclinaison pour garder le relief.
  function finalMatrix(val, tiltX, tiltY) {
    var f = F.filter(function (g) { return g.num === val; })[0], n = f.n, u = f.up, w = cross(n, u);
    // R * n = (0,0,1) ; R * u = (0,-1,0) (haut de l'écran) ; R * w = (1,0,0)
    var S = [n, u, w], T = [[0, 0, 1], [0, -1, 0], [1, 0, 0]], R = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var a = 0; a < 3; a++) for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) R[r * 3 + c] += T[a][r] * S[a][c];
    return mm(mm(rot([1, 0, 0], tiltX || 0), rot([0, 1, 0], tiltY || 0)), R);
  }
  function randAxis(R) { return norm([R() * 2 - 1, R() * 2 - 1, R() * 2 - 1]); }

  /* Un lancer : trajectoire (rebonds), rotation amortie, valeur finale garantie. */
  function Roll(opt) {
    var R = opt.rand || Math.random;
    this.val = opt.val; this.t0 = opt.t0; this.dur = opt.dur || 1700;
    this.from = opt.from; this.to = opt.to; this.size = opt.size; this.bounces = opt.bounces || 3; this.h = opt.h || opt.size * 2.2;
    this.Rf = finalMatrix(opt.val, (opt.tilt === undefined ? 0.32 : opt.tilt) * (R() < 0.5 ? 1 : -1) * (0.6 + R() * 0.4), (R() - 0.5) * 0.5);
    this.a1 = randAxis(R); this.a2 = randAxis(R); this.n1 = (3 + R() * 2) * TAU; this.n2 = (1 + R()) * TAU;
  }
  Roll.prototype.at = function (now) {
    var t = clamp((now - this.t0) / this.dur, 0, 1), e = eout(t);
    var spin = Math.pow(1 - t, 2.2);
    var M = mm(mm(rot(this.a1, this.n1 * spin), rot(this.a2, this.n2 * spin)), this.Rf);
    var x = lerp(this.from[0], this.to[0], eout(Math.min(1, t * 1.15)));
    var bt = t * this.bounces, bi = Math.floor(bt), bf = bt - bi, amp = Math.pow(0.42, bi) * (1 - t);
    var hgt = t >= 1 ? 0 : Math.sin(bf * Math.PI) * this.h * amp;
    var y = lerp(this.from[1], this.to[1], eout(Math.min(1, t * 1.4))) - hgt;
    var land = t >= 1 ? now - (this.t0 + this.dur) : -1;
    var sq = land >= 0 && land < 160 ? 1 - Math.sin(land / 160 * Math.PI) * 0.08 : 1; // petit écrasement à l'arrêt
    return { t: t, M: M, x: x, y: y, gy: this.to[1] + this.size * 0.95, hgt: hgt, done: t >= 1, land: land, sq: sq };
  }

  /* Dessin d'un dé. style : 'laque' (vermillon et or, plein) ou 'chakra' (arêtes lumineuses). */
  function draw(c, x, y, s, M, style, o) {
    o = o || {};
    var P = V.map(function (v) { var p = mv(M, v), k = 5 / (5 - p[2]); return [x + p[0] * s * k, y + p[1] * s * k * (o.sq || 1), p[2]]; });
    var faces = F.map(function (f) { var n = mv(M, f.n); return { f: f, n: n, z: (P[f.v[0]][2] + P[f.v[1]][2] + P[f.v[2]][2]) / 3 }; }).sort(function (a, b) { return a.z - b.z; });
    var L = norm([-0.45, -0.75, 0.9]), H = norm([L[0], L[1], L[2] + 1]);
    c.save();
    c.lineJoin = 'round';
    if (style === 'chakra') {
      var col = o.col || '#7FD4FF';
      faces.forEach(function (q) {
        var a = P[q.f.v[0]], b = P[q.f.v[1]], d = P[q.f.v[2]], front = q.n[2] > 0;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.closePath();
        if (front) { c.fillStyle = 'rgba(10,20,45,' + (0.55 + 0.25 * q.n[2]) + ')'; c.fill(); }
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = front ? col : 'rgba(127,212,255,.18)'; c.lineWidth = front ? s * 0.035 : s * 0.02; c.shadowColor = col; c.shadowBlur = front ? s * 0.25 : 0; c.stroke();
        c.shadowBlur = 0; c.globalCompositeOperation = 'source-over';
        if (front && q.n[2] > 0.3) label(c, a, d, b, q.f.num, 'rgba(235,248,255,' + clamp(q.n[2] * 1.3, 0, 1) + ')', col, s, true);
      });
    } else {
      var base = o.base || [200, 55, 45], gold = o.gold || '#F3CF6A';
      faces.forEach(function (q) {
        if (q.n[2] <= 0) return;
        var a = P[q.f.v[0]], b = P[q.f.v[1]], d = P[q.f.v[2]];
        var df = Math.max(0, dot(q.n, L)), sp = Math.pow(Math.max(0, dot(q.n, H)), 48) * 0.5, k = 0.3 + 0.62 * df;
        var r = Math.min(255, base[0] * k + 255 * sp * 0.8), g = Math.min(255, base[1] * k + 230 * sp * 0.8), bb = Math.min(255, base[2] * k + 200 * sp * 0.8);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.closePath();
        c.fillStyle = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (bb | 0) + ')'; c.fill();
        c.strokeStyle = 'rgba(60,8,6,.85)'; c.lineWidth = Math.max(1, s * 0.028); c.stroke();
        c.strokeStyle = 'rgba(255,215,150,' + (0.25 * df) + ')'; c.lineWidth = Math.max(1, s * 0.012); c.stroke();
        if (q.n[2] > 0.22) label(c, a, d, b, q.f.num, gold, 'rgba(40,6,4,.9)', s, false, clamp((q.n[2] - 0.22) * 2.2, 0, 1));
      });
    }
    c.restore();
  }
  // Numéro posé dans le plan de la face (transformation affine du triangle de référence vers le triangle projeté).
  function label(c, a, b, d, num, fill, edge, s, glow, alpha) {
    var c0 = [0, -1], c1 = [-0.866, 0.5], c2 = [0.866, 0.5];
    var e1 = [b[0] - a[0], b[1] - a[1]], e2 = [d[0] - a[0], d[1] - a[1]], f1 = [c1[0] - c0[0], c1[1] - c0[1]], f2 = [c2[0] - c0[0], c2[1] - c0[1]];
    var det = f1[0] * f2[1] - f2[0] * f1[1]; if (Math.abs(det) < 1e-6) return;
    var i00 = f2[1] / det, i01 = -f2[0] / det, i10 = -f1[1] / det, i11 = f1[0] / det;
    var A = e1[0] * i00 + e2[0] * i10, C = e1[0] * i01 + e2[0] * i11, B = e1[1] * i00 + e2[1] * i10, D = e1[1] * i01 + e2[1] * i11;
    var E = a[0] - (A * c0[0] + C * c0[1]), Fy = a[1] - (B * c0[0] + D * c0[1]);
    c.save(); c.transform(A, B, C, D, E, Fy); if (alpha !== undefined) c.globalAlpha = alpha;
    var t = String(num) + (num === 6 || num === 9 ? '.' : '');
    c.font = '800 ' + (t.length > 1 ? 0.62 : 0.74) + 'px Mincho30, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (glow) { c.shadowColor = edge; c.shadowBlur = 0.4; }
    else { c.lineWidth = 0.09; c.strokeStyle = edge; c.strokeText(t, 0, 0.12); }
    c.fillStyle = fill; c.fillText(t, 0, 0.12);
    c.restore();
  }
  function shadow(c, x, gy, s, hgt) {
    var k = 1 / (1 + hgt / (s * 2)); c.save(); c.fillStyle = 'rgba(0,0,0,' + 0.35 * k + ')'; c.beginPath(); c.ellipse(x, gy, s * 0.95 * k, s * 0.28 * k, 0, 0, TAU); c.fill(); c.restore();
  }

  function cracks(c, x, y, s, p) {
    c.save(); c.strokeStyle = 'rgba(20,10,8,.9)'; c.lineWidth = s * 0.05; c.lineCap = 'round';
    [[[0, 0], [-0.3, -0.25], [-0.5, -0.2], [-0.62, -0.45]], [[0, 0], [0.25, -0.1], [0.32, -0.42]], [[0, 0], [0.1, 0.3], [0.38, 0.42], [0.45, 0.62]], [[0, 0], [-0.22, 0.28], [-0.5, 0.3]]].forEach(function (ln) {
      var n = Math.max(2, Math.ceil(ln.length * p)); c.beginPath(); c.moveTo(x + ln[0][0] * s, y + ln[0][1] * s); for (var i = 1; i < n; i++) c.lineTo(x + ln[i][0] * s, y + ln[i][1] * s); c.stroke();
    });
    c.restore();
  }
  // Dé laqué complet : ombre, rayons dorés sur un 20, dé gris et fissuré sur un 1, onde dorée à l'arrêt.
  function render(c, roll, T, o) {
    o = o || {};
    var st = roll.at(T), s = roll.size, v = roll.val, pn = performance.now(), dead = v === 1 && st.done && st.land > 120;
    if (st.done && v === 20 && !o.noRays) {
      c.save(); c.translate(st.x, st.y); c.rotate(pn / 2400); c.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 14; i++) { c.rotate(TAU / 14); var a = clamp(st.land / 400, 0, 1) * (0.3 + 0.12 * Math.sin(pn / 200 + i)); c.fillStyle = 'rgba(255,205,90,' + a + ')'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-s * 0.16, -s * (o.rays || 3)); c.lineTo(s * 0.16, -s * (o.rays || 3)); c.closePath(); c.fill(); }
      c.restore();
    }
    shadow(c, st.x, st.gy, s, st.hgt);
    draw(c, st.x, st.y, s, st.M, 'laque', { sq: st.sq, base: dead ? [95, 88, 86] : [200, 55, 45], gold: dead ? '#c9c0b6' : '#F3CF6A' });
    if (dead) cracks(c, st.x, st.y, s, clamp((st.land - 120) / 400, 0, 1));
    if (st.done && st.land < 600) { var rg = st.land / 600; c.save(); c.globalAlpha = 1 - rg; c.strokeStyle = v === 1 ? '#b0453a' : '#F3CF6A'; c.lineWidth = s * 0.12 * (1 - rg); c.beginPath(); c.ellipse(st.x, st.gy - s * 0.2, s * (1 + rg * 2), s * (0.35 + rg * 0.7), 0, 0, TAU); c.stroke(); c.restore(); }
    return st;
  }
  // Générateur pseudo-aléatoire déterministe : un même lancer a la même trajectoire sur tous les écrans.
  function seeded(key) { var h = 2166136261; key = String(key); for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); } var s = h >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  window.Dice3D = { Roll: Roll, draw: draw, shadow: shadow, finalMatrix: finalMatrix, faces: F, render: render, seeded: seeded, cracks: cracks };
})();
