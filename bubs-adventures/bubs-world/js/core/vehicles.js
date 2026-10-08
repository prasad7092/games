/* Bubs' World — the cute little motorbike and the horse (with Bubs sitting on them) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C;
  const INK = C.ink;
  const V = (BW.Vehicles = {});

  /** scratch renderer: draws into a small canvas, then adds the dark pixel outline */
  function makeRenderer(w, h) {
    const a = U.makeCanvas(w, h), sil = U.makeCanvas(w, h), out = U.makeCanvas(w, h);
    const ag = a.getContext('2d'), sg = sil.getContext('2d'), og = out.getContext('2d');
    return function (fn) {
      ag.clearRect(0, 0, w, h);
      ag.save(); ag.translate(1, 1); fn(ag); ag.restore();
      sg.globalCompositeOperation = 'source-over';
      sg.clearRect(0, 0, w, h); sg.drawImage(a, 0, 0);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = INK; sg.fillRect(0, 0, w, h);
      og.clearRect(0, 0, w, h);
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) og.drawImage(sil, d[0], d[1]);
      og.drawImage(a, 0, 0);
      return out;
    };
  }
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  /* ================= BIKE ================= */
  const BW_ = 22, BH = 14;
  const renderBike = makeRenderer(BW_ + 2, BH + 2);

  function bikeWheel(g, cx, cy, ang) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = dx * dx + dy * dy;
      if (d > 17) continue;
      let col = d >= 10 ? '#2f2a35' : '#e8ebf1';
      if (d <= 1) col = '#6b6b7a';
      R(g, cx + dx, cy + dy, 1, 1, col);
    }
    for (let k = 0; k < 4; k++) {
      const a = ang + k * Math.PI / 2;
      R(g, cx + Math.round(Math.cos(a) * 2), cy + Math.round(Math.sin(a) * 2), 1, 1, '#8d90a0');
    }
  }
  function drawBikeUnits(g, wheel) {
    R(g, 1, 4, 7, 1, '#5fb26a');             // rear fender
    R(g, 5, 5, 5, 1, '#2f6a3f'); R(g, 11, 5, 4, 1, '#2f6a3f'); // frame bars
    R(g, 8, 6, 6, 3, '#4a4a58');             // engine
    for (const x of [9, 11, 13]) R(g, x, 6, 1, 1, '#7a7a8c');
    R(g, 1, 8, 7, 1, '#c8cdd6'); R(g, 0, 8, 1, 2, '#9aa0ac'); // exhaust
    R(g, 9, 2, 5, 3, '#5fb26a'); R(g, 10, 2, 3, 1, '#9be0a2'); // tank
    R(g, 4, 3, 6, 2, '#8a4a52'); R(g, 4, 3, 6, 1, '#a8606a');  // seat
    for (let i = 0; i < 6; i++) R(g, i < 2 ? 16 : 17, 3 + i, 1, 1, '#c8cdd6'); // fork
    R(g, 14, 2, 3, 1, '#2f2a35'); R(g, 13, 2, 1, 1, '#f6a5b1');                // handlebar + grip
    R(g, 17, 3, 2, 2, '#ffe27a'); R(g, 19, 3, 1, 2, '#fff6c0');                // headlight
    R(g, 16, 5, 4, 1, '#5fb26a');                                              // front fender
    bikeWheel(g, 4, 9, wheel); bikeWheel(g, 17, 9, wheel);
  }
  V.bike = {
    W: BW_, H: BH, seat: { x: 7, y: 3 },
    /** (x, gy) = bottom-centre (ground contact). o: {angle, wheel, rider(bool), pose, outfit, expr, flip} */
    draw(ctx, x, gy, s, o) {
      o = o || {};
      const cv = renderBike((g) => drawBikeUnits(g, o.wheel || 0));
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(x), Math.round(gy));
      if (o.angle) ctx.rotate(o.angle);
      if (o.flip) ctx.scale(-1, 1);
      ctx.drawImage(cv, -(11 + 1) * s, -(BH + 1) * s, cv.width * s, cv.height * s);
      if (o.rider !== false) {
        BW.Bubs.draw(ctx, (7 - 11) * s, (10 - BH) * s, { pose: o.pose || 'ride', outfit: o.outfit || 'riding', scale: s, expr: o.expr, frame: 0 });
      }
      ctx.restore();
    }
  };

  /* ================= HORSE ================= */
  const HW = 31, HH = 26;
  const renderHorse = makeRenderer(HW + 2, HH + 2);
  function limb(g, hx, hy, phi, m, col) {
    const t1 = Math.sin(phi) * 0.75 * m;
    const t2 = t1 * 0.5 - 0.55 * m * Math.max(0, Math.sin(phi + 1.3));
    const kx = hx + Math.sin(t1) * 4, ky = hy + Math.cos(t1) * 4;
    const fx = kx + Math.sin(t2) * 6, fy = ky + Math.cos(t2) * 6;
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let px, py;
      if (t < 0.4) { const u = t / 0.4; px = hx + (kx - hx) * u; py = hy + (ky - hy) * u; }
      else { const u = (t - 0.4) / 0.6; px = kx + (fx - kx) * u; py = ky + (fy - ky) * u; }
      R(g, Math.round(px), Math.round(py), 2, 1, col);
    }
    R(g, Math.round(fx), Math.round(fy), 3, 1, '#3b2420');
  }
  function drawHorseUnits(g, phase, m, tailT) {
    const body = '#a8683c', dark = '#8a5230', light = '#c98450', mane = '#3b2420';
    // far legs
    limb(g, 18, 15, phase + 0.7, m, dark); limb(g, 10, 15, phase + Math.PI + 0.7, m, dark);
    // tail
    const sw = Math.round(Math.sin(tailT) * (1 + 2 * m));
    R(g, 3, 10, 3, 2, mane); R(g, 1 + sw, 12, 3, 3, mane); R(g, 0 + sw * 2, 15, 2, 3, mane);
    // body
    R(g, 6, 9, 16, 8, body); R(g, 5, 10, 1, 6, body); R(g, 22, 10, 1, 6, body);
    R(g, 7, 9, 14, 1, light); R(g, 6, 15, 16, 2, dark);
    // neck + head
    R(g, 21, 5, 4, 6, body); R(g, 23, 3, 3, 3, body);
    R(g, 24, 2, 5, 4, body); R(g, 28, 4, 3, 3, light); R(g, 30, 5, 1, 1, mane); R(g, 26, 3, 1, 1, INK);
    R(g, 24, 0, 2, 2, dark);
    // mane
    R(g, 20, 4, 2, 8, mane); R(g, 22, 2, 2, 3, mane); R(g, 26, 1, 2, 2, mane);
    // saddle blanket
    R(g, 11, 8, 6, 2, '#e8647c'); R(g, 11, 8, 6, 1, '#f6a5b1'); R(g, 12, 7, 4, 1, '#8a5a3c');
    // near legs
    limb(g, 20, 15, phase, m, body); limb(g, 8, 15, phase + Math.PI, m, body);
  }
  V.horse = {
    W: HW, H: HH,
    /** o: {angle, phase, speed(0..1), rider(bool), pose, outfit, expr, bob, t} */
    draw(ctx, x, gy, s, o) {
      o = o || {};
      const m = U.clamp(o.speed == null ? 1 : o.speed, 0, 1);
      const cv = renderHorse((g) => drawHorseUnits(g, o.phase || 0, m, (o.t || 0) * 6));
      const bob = o.bob || 0;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(x), Math.round(gy));
      if (o.angle) ctx.rotate(o.angle);
      if (o.flip) ctx.scale(-1, 1);
      ctx.drawImage(cv, -(15 + 1) * s, (-(HH + 1) - bob) * s, cv.width * s, cv.height * s);
      if (o.rider !== false) {
        BW.Bubs.draw(ctx, (14 - 15) * s, (14 - HH - bob) * s, { pose: o.pose || 'ride', outfit: o.outfit || 'riding', scale: s, expr: o.expr, frame: 0 });
      }
      ctx.restore();
    }
  };
})();
