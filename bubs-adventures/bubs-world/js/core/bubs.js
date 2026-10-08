/* Bubs' World — the Bubs character sprite system.
 *
 * Bubs is generated from a small pixel-grid recipe (hair, glasses, outfit, pose) and cached as
 * outlined sprite canvases, so every game uses the exact same character.
 *
 *   BW.Bubs.draw(ctx, x, y, { pose, frame, outfit, expr, scale, flip, p, rot, alpha })
 *     (x, y) = bottom-centre of her feet.
 *
 * To swap in hand-made pixel art later, see assets/sprites/overrides.js (BW.Bubs.setOverride).
 */
(function () {
  const BW = window.BW, U = BW.U, C = U.C;
  const SKIN = '#eeb48a', SKIN_D = '#d99a70', HAIR = '#3b2522', HAIR_L = '#5c3b35', FRAME = '#a98048', LENS = '#fbf0de';
  const MOUTH = '#c4524c', BLUSH = '#f4a0a0', EYE = '#2a1a20', INK = C.ink;
  const GX = 9, GY = 7, SW = 32, SH = 36, AX = 16, AY = 30; // grid origin in sprite canvas, size, anchor (feet)

  const OUTFITS = {
    casual:    { name: 'Casual',    kind: 'dress',  top: '#f7e6ba', hi: '#fff4d6', sleeve: 'short', shoe: '#8a5a3c' },
    cozy:      { name: 'Cozy',      kind: 'pants',  top: '#dcdce2', hi: '#f4f4f8', bottom: '#2f3350', sleeve: 'long', shoe: '#f4f1ea', strings: true },
    riding:    { name: 'Riding',    kind: 'pants',  top: '#4a3028', hi: '#6a463a', bottom: '#5b87b8', sleeve: 'long', shoe: '#8a5a3c', tee: true },
    garden:    { name: 'Garden',    kind: 'dress',  top: '#f6d86a', hi: '#ffeaa0', dots: '#f08c9a', sleeve: 'short', shoe: '#8a5a3c', hat: true },
    bungee:    { name: 'Bungee',    kind: 'shorts', top: '#6f7a52', hi: '#8c986a', bottom: '#2f3140', sleeve: 'long', shoe: '#2b2b3a', strap: true },
    badminton: { name: 'Badminton', kind: 'shorts', top: '#f6f3ea', hi: '#ffffff', bottom: '#34406a', sleeve: 'short', shoe: '#f4f1ea', racket: true },
    night:     { name: 'Night out', kind: 'pants',  top: '#2c2b38', hi: '#44435a', bottom: '#24232e', sleeve: 'long', shoe: '#f4f1ea', bag: true }
  };
  const ORDER = ['casual', 'cozy', 'riding', 'garden', 'bungee', 'badminton', 'night'];

  /* ---- arm shapes (right/front arm; left is mirrored). rect = [x,y,w,h,part]; a=upper f=fore h=hand ---- */
  const ARM_R = {
    down:  { r: [[10, 10, 2, 2, 'a'], [10, 12, 2, 2, 'f'], [10, 14, 2, 1, 'h']], h: [11, 14.5] },
    out:   { r: [[10, 10, 2, 2, 'a'], [12, 11, 2, 2, 'f'], [13, 13, 1, 1, 'h']], h: [13.5, 13.5] },
    up:    { r: [[10, 9, 2, 2, 'a'], [12, 7, 2, 2, 'f'], [12, 5, 2, 2, 'f'], [12, 4, 2, 1, 'h']], h: [13, 4.5] },
    wave:  { r: [[10, 9, 2, 2, 'a'], [12, 8, 2, 2, 'f'], [12, 6, 2, 2, 'f'], [12, 5, 2, 1, 'h']], h: [13, 5.5] },
    wave2: { r: [[10, 9, 2, 2, 'a'], [12, 8, 2, 2, 'f'], [13, 6, 2, 2, 'f'], [13, 5, 2, 1, 'h']], h: [14, 5.5] },
    fwd:   { r: [[10, 10, 2, 2, 'a'], [12, 11, 2, 2, 'f'], [13, 12, 1, 1, 'h']], h: [13.5, 12.5] },
    hold:  { r: [[10, 10, 2, 2, 'a'], [12, 9, 2, 2, 'f'], [13, 8, 1, 1, 'h']], h: [13.5, 8.5] },
    s0:    { r: [[10, 9, 2, 2, 'a'], [11, 7, 2, 2, 'f'], [10, 5, 2, 2, 'f'], [10, 4, 2, 1, 'h']], h: [11, 4.5] },
    s1:    { r: [[10, 9, 2, 2, 'a'], [12, 7, 2, 2, 'f'], [13, 5, 2, 2, 'f'], [14, 4, 1, 1, 'h']], h: [14.5, 4.5] },
    s2:    { r: [[10, 10, 2, 2, 'a'], [12, 11, 2, 2, 'f'], [13, 13, 2, 1, 'h']], h: [14, 13.5] }
  };
  const ARM_L_SPECIAL = {
    fwdL: { r: [[4, 10, 2, 2, 'a'], [6, 11, 2, 2, 'f'], [8, 11, 1, 1, 'h']], h: [8.5, 11.5] }
  };
  function mirror(sh) {
    return { r: sh.r.map((q) => [14 - (q[0] + q[2]), q[1], q[2], q[3], q[4]]), h: [14 - sh.h[0], sh.h[1]] };
  }
  const armR = (n) => ARM_R[n];
  const armL = (n) => ARM_L_SPECIAL[n] || mirror(ARM_R[n]);

  const FRAMES = { idle: 2, walk: 4, run: 4, wave: 2 };
  const RK = { idle: 70, walk: 70, run: 60, jump: -70, fall: -70, happy: -80, wave: 70, ride: 20, ready: -55, hold: -55 };

  function poseSpec(pose, fr, p) {
    const n = FRAMES[pose] || 1;
    const f = ((fr | 0) % n + n) % n;
    let s = { L: 'down', R: 'down', legs: { L: { dx: 0, lift: 0 }, R: { dx: 0, lift: 0 } }, rk: RK[pose] != null ? RK[pose] : 70 };
    switch (pose) {
      case 'idle': break;
      case 'walk': {
        const T = [
          { L: { dx: -1, lift: 0 }, R: { dx: 1, lift: 1 }, a: ['down', 'out'] },
          { L: { dx: 0, lift: 0 }, R: { dx: 0, lift: 0 }, a: ['down', 'down'] },
          { L: { dx: 1, lift: 1 }, R: { dx: -1, lift: 0 }, a: ['out', 'down'] },
          { L: { dx: 0, lift: 0 }, R: { dx: 0, lift: 0 }, a: ['down', 'down'] }][f];
        s.legs = { L: T.L, R: T.R }; s.L = T.a[0]; s.R = T.a[1]; break;
      }
      case 'run': {
        const T = [
          { L: { dx: -2, lift: 0 }, R: { dx: 2, lift: 2 }, a: ['out', 'fwd'] },
          { L: { dx: 0, lift: 2 }, R: { dx: 0, lift: 1 }, a: ['out', 'fwd'] },
          { L: { dx: 2, lift: 2 }, R: { dx: -2, lift: 0 }, a: ['fwd', 'out'] },
          { L: { dx: 0, lift: 1 }, R: { dx: 0, lift: 2 }, a: ['fwd', 'out'] }][f];
        s.legs = { L: T.L, R: T.R }; s.L = T.a[0]; s.R = T.a[1]; break;
      }
      case 'jump': s.L = 'up'; s.R = 'up'; s.legs = { L: { dx: -1, lift: 1 }, R: { dx: 1, lift: 0 } }; break;
      case 'fall': s.L = 'up'; s.R = 'up'; s.legs = { L: { dx: -1, lift: 0 }, R: { dx: 1, lift: 1 } }; s.expr = 'surprised'; break;
      case 'happy': s.L = 'up'; s.R = 'up'; s.legs = { L: { dx: 0, lift: 1 }, R: { dx: 0, lift: 1 } }; s.expr = 'open'; break;
      case 'wave': s.R = f ? 'wave2' : 'wave'; s.expr = 'smile'; break;
      case 'ride': s.L = 'fwdL'; s.R = 'fwd'; s.sit = true; break;
      case 'ready': s.R = 'hold'; s.legs = { L: { dx: -1, lift: 0 }, R: { dx: 1, lift: 0 } }; break;
      case 'swing': {
        const q = p == null ? 0 : p;
        s.R = q < 0.28 ? 's0' : q < 0.58 ? 's1' : 's2';
        const keys = [[0, -165], [0.28, -150], [0.45, -85], [0.6, -30], [1, 45]];
        let ang = keys[keys.length - 1][1];
        for (let i = 0; i < keys.length - 1; i++) {
          if (q >= keys[i][0] && q <= keys[i + 1][0]) { const t = (q - keys[i][0]) / (keys[i + 1][0] - keys[i][0]); ang = U.lerp(keys[i][1], keys[i + 1][1], t); break; }
        }
        s.rk = ang;
        s.legs = { L: { dx: -1, lift: 0 }, R: { dx: 2, lift: 0 } };
        s.expr = 'open'; break;
      }
      default: break;
    }
    return s;
  }

  /* ---- sprite construction ---- */
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  function drawArm(g, o, shape) {
    for (const q of shape.r) {
      let col;
      if (q[4] === 'h') col = SKIN;
      else if (q[4] === 'a') col = o.sleeve === 'none' ? SKIN : o.top;
      else col = o.sleeve === 'long' ? o.top : SKIN;
      R(g, q[0], q[1], q[2], q[3], col);
    }
  }
  function drawLegs(g, o, spec) {
    const legCol = (far) => (o.kind === 'pants' ? (far ? shade(o.bottom, -18) : o.bottom) : (far ? SKIN_D : SKIN));
    if (spec.sit) {
      // far leg (behind), then near leg: thigh forward + shin down
      R(g, 4, 16, 5, 2, legCol(true)); R(g, 9, 17, 2, 3, legCol(true)); R(g, 9, 20, 3, 2, shade(o.shoe, -25));
      R(g, 5, 16, 5, 2, legCol(false)); R(g, 10, 17, 2, 4, legCol(false)); R(g, 10, 21, 3, 2, o.shoe);
      return;
    }
    for (const side of ['L', 'R']) {
      const lg = spec.legs[side];
      const x = (side === 'L' ? 4 : 8) + lg.dx;
      const len = Math.max(1, 3 - lg.lift);
      const far = side === 'L';
      R(g, x, 18, 2, len, legCol(far));
      R(g, side === 'R' ? x : x - 1, 18 + len, 3, 2, far ? shade(o.shoe, -25) : o.shoe);
    }
  }
  function shade(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    const r = U.clamp((n >> 16) + d, 0, 255), gg = U.clamp(((n >> 8) & 255) + d, 0, 255), b = U.clamp((n & 255) + d, 0, 255);
    return '#' + ((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1);
  }
  function drawFace(g, expr) {
    R(g, 3, 2, 8, 7, SKIN); R(g, 4, 9, 6, 1, SKIN);
    // round glasses: light lens, thin frame, rounded corners
    for (const lx of [3, 7]) {
      R(g, lx + 1, 4, 2, 1, FRAME); R(g, lx + 1, 7, 2, 1, FRAME); R(g, lx, 5, 1, 2, FRAME); R(g, lx + 3, 5, 1, 2, FRAME);
      R(g, lx + 1, 5, 2, 2, LENS);
    }
    R(g, 6, 5, 2, 1, FRAME); // bridge
    const eye = (lx, kind, right) => {
      const ex = right ? lx + 1 : lx + 2;
      if (kind === 'blink') { R(g, lx + 1, 6, 2, 1, EYE); }
      else if (kind === 'happy') { R(g, lx + 1, 5, 2, 1, EYE); R(g, lx + 1, 6, 1, 1, LENS); }
      else { R(g, ex, 5, 1, 2, EYE); }
    };
    let kl = 'open', kr = 'open';
    if (expr === 'blink') { kl = kr = 'blink'; }
    if (expr === 'wink') { kl = 'blink'; }
    if (expr === 'open') { kl = kr = 'happy'; }
    eye(3, kl, false); eye(7, kr, true);
    if (expr === 'surprised') { R(g, 4, 3, 2, 1, HAIR); R(g, 8, 3, 2, 1, HAIR); }
    R(g, 3, 8, 2, 1, BLUSH); R(g, 9, 8, 2, 1, BLUSH);
    switch (expr) {
      case 'smile': case 'wink': R(g, 5, 8, 4, 1, MOUTH); break;
      case 'open': R(g, 5, 8, 4, 1, '#7a2c3a'); R(g, 6, 9, 2, 1, '#e97b86'); break;
      case 'surprised': R(g, 6, 8, 2, 2, '#7a2c3a'); break;
      case 'cute': R(g, 6, 8, 1, 1, MOUTH); R(g, 7, 8, 1, 1, MOUTH); R(g, 5, 7, 1, 1, MOUTH); R(g, 8, 7, 1, 1, MOUTH); break;
      default: R(g, 6, 8, 2, 1, MOUTH);
    }
  }
  function drawHairBack(g, fr) {
    R(g, 2, 0, 10, 2, HAIR); R(g, 1, 2, 12, 12, HAIR);
    R(g, 0, 9, 1, 4, HAIR); R(g, 13, 9, 1, 4, HAIR);
    R(g, 1, 14, 3, 1, HAIR); R(g, 10, 14, 3, 1, HAIR);
    if (fr % 2) { R(g, 0, 13, 1, 1, HAIR); R(g, 13, 14, 1, 1, HAIR); } else { R(g, 0, 14, 1, 1, HAIR); R(g, 13, 13, 1, 1, HAIR); }
    for (const q of [[2, 6], [11, 7], [1, 11], [12, 10], [3, 12], [10, 12], [1, 4], [12, 5], [0, 10], [13, 11]]) R(g, q[0], q[1], 1, 1, HAIR_L);
  }
  function drawHairFront(g) {
    R(g, 3, 2, 3, 2, HAIR); R(g, 8, 2, 3, 1, HAIR); R(g, 9, 3, 2, 1, HAIR);
    R(g, 4, 0, 2, 1, HAIR_L); R(g, 9, 1, 2, 1, HAIR_L); R(g, 3, 3, 1, 1, HAIR_L);
  }
  function drawBody(g, o, spec) {
    const top = o.top, hi = o.hi;
    if (o.kind === 'dress') {
      R(g, 4, 10, 6, 3, top); R(g, 3, 13, 8, 5, top);
      R(g, 5, 11, 2, 1, hi); R(g, 3, 17, 8, 1, shade(top, -22)); R(g, 4, 13, 1, 4, hi);
      if (o.dots) for (const q of [[5, 11], [8, 12], [4, 14], [7, 15], [9, 16], [5, 17], [6, 13], [9, 14]]) R(g, q[0], q[1], 1, 1, o.dots);
    } else {
      R(g, 4, 10, 6, 5, top); R(g, 5, 11, 2, 1, hi);
      R(g, 4, 15, 6, 3, o.bottom);
      if (o.kind === 'pants') R(g, 4, 15, 6, 1, shade(o.bottom, 25));
      if (o.strings) { R(g, 4, 10, 6, 1, hi); R(g, 6, 11, 1, 3, '#ffffff'); R(g, 7, 11, 1, 3, '#ffffff'); R(g, 4, 14, 6, 1, shade(top, -18)); }
      if (o.tee) { R(g, 6, 10, 2, 5, '#f4f0e8'); R(g, 6, 10, 2, 1, '#e3dccd'); }
    }
    if (o.strap) { for (let i = 0; i < 6; i++) R(g, 4 + i, 10 + i, 1, 1, '#8a5a3c'); R(g, 8, 14, 3, 3, '#b0723e'); R(g, 8, 14, 3, 1, '#8a5a3c'); }
    if (o.bag) { R(g, 3, 13, 3, 3, '#b0723e'); R(g, 3, 13, 3, 1, '#8a5a3c'); R(g, 4, 10, 1, 3, '#8a5a3c'); }
  }
  function drawHat(g) {
    R(g, 3, -2, 8, 2, '#f2cf6a'); R(g, 3, 0, 8, 1, '#f08c9a'); R(g, 0, 1, 14, 1, '#e8b94a'); R(g, 4, -2, 2, 1, '#ffe49a');
  }

  function build(key, o) {
    const c = U.makeCanvas(SW, SH), g = c.getContext('2d');
    g.translate(GX, GY);
    const outfit = OUTFITS[o.outfit] || OUTFITS.casual;
    const spec = poseSpec(o.pose, o.frame, o.p);
    const expr = o.expr || spec.expr || 'normal';
    drawHairBack(g, o.frame | 0);
    drawLegs(g, outfit, spec);
    drawBody(g, outfit, spec);
    drawFace(g, expr);
    drawHairFront(g);
    if (outfit.hat) drawHat(g);
    const aL = armL(spec.L), aR = armR(spec.R);
    drawArm(g, outfit, aL);
    drawArm(g, outfit, aR);
    if (outfit.racket && o.pose !== 'ride') {
      Art_racket(g, aR.h[0], aR.h[1], spec.rk * Math.PI / 180);
    }
    // outline pass
    const sil = U.makeCanvas(SW, SH), sg = sil.getContext('2d');
    sg.drawImage(c, 0, 0);
    sg.globalCompositeOperation = 'source-in';
    sg.fillStyle = INK; sg.fillRect(0, 0, SW, SH);
    const out = U.makeCanvas(SW, SH), og = out.getContext('2d');
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) og.drawImage(sil, d[0], d[1]);
    og.drawImage(c, 0, 0);
    return out;
  }
  function Art_racket(g, hx, hy, th) { BW.Art.racket(g, hx, hy, th, 1, '#e9edf5'); }

  const cache = new Map();
  const overrides = {};

  const Bubs = (BW.Bubs = {
    OUTFITS, ORDER, W: SW, H: SH, AX, AY,
    outfitName(id) { return (OUTFITS[id] || OUTFITS.casual).name; },
    /** animation helper: which frame for pose at time t (seconds) */
    frame(pose, t) {
      if (pose === 'walk') return Math.floor(t * 8) % 4;
      if (pose === 'run') return Math.floor(t * 13) % 4;
      if (pose === 'wave') return Math.floor(t * 5) % 2;
      if (pose === 'idle') return Math.floor(t * 1.6) % 2;
      return 0;
    },
    /** blink every few seconds */
    autoExpr(t, base) { return (t % 3.4) < 0.14 ? 'blink' : (base || undefined); },
    sprite(o) {
      const pose = o.pose || 'idle';
      const pq = pose === 'swing' ? Math.round((o.p || 0) * 12) / 12 : 0;
      const frame = (FRAMES[pose] ? ((o.frame | 0) % FRAMES[pose]) : 0);
      const key = [o.outfit || 'casual', pose, frame, o.expr || '', pq].join('|');
      let s = cache.get(key);
      if (!s) { s = build(key, { outfit: o.outfit || 'casual', pose, frame, expr: o.expr, p: pq }); cache.set(key, s); }
      return s;
    },
    /** Draw Bubs with feet bottom-centre at (x,y). scale = screen px per sprite pixel. */
    draw(ctx, x, y, o) {
      o = o || {};
      const s = o.scale || 2;
      const ov = overrides[o.pose || 'idle'];
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (o.alpha != null) ctx.globalAlpha = o.alpha;
      ctx.translate(Math.round(x), Math.round(y));
      if (o.rot) ctx.rotate(o.rot);
      if (o.flip) ctx.scale(-1, 1);
      if (ov && ov.img && ov.img.complete && ov.img.naturalWidth) {
        const fw = ov.fw, fh = ov.fh, n = ov.frames || 1;
        const fr = ((o.frame | 0) % n + n) % n;
        ctx.drawImage(ov.img, fr * fw, 0, fw, fh, -(ov.ax != null ? ov.ax : fw / 2) * s, -(ov.ay != null ? ov.ay : fh) * s, fw * s, fh * s);
      } else {
        ctx.drawImage(Bubs.sprite(o), -AX * s, -AY * s, SW * s, SH * s);
      }
      ctx.restore();
    },
    /** world position of the racket head (for hit-testing) when drawn at (x,y) facing right/left */
    racketInfo(x, y, o) {
      const s = o.scale || 2, spec = poseSpec(o.pose || 'ready', o.frame || 0, o.p || 0);
      const h = armR(spec.R).h, th = spec.rk * Math.PI / 180, dir = o.flip ? -1 : 1;
      const gx = h[0] + Math.cos(th) * 8.5, gy = h[1] + Math.sin(th) * 8.5;
      return {
        hx: x + dir * (h[0] - 7) * s, hy: y - (23 - h[1]) * s,
        cx: x + dir * (gx - 7) * s, cy: y - (23 - gy) * s, th
      };
    },
    /** Replace a pose with your own sprite strip: Bubs.setOverride('idle', {src:'assets/sprites/idle.png', fw:32, fh:48, frames:2, ax:16, ay:48}) */
    setOverride(pose, cfg) {
      const img = new Image();
      img.src = cfg.src;
      overrides[pose] = Object.assign({}, cfg, { img });
    },
    clearOverrides() { for (const k in overrides) delete overrides[k]; }
  });
})();
