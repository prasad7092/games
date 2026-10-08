/* Game 3 — Bubs Goes Bungee Jumping 🪂  (vertical timing game: rope spring physics, bounce on the beat) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art, R = U.R;
  const W = 480, H = 270;
  const PLAT_X = 268, ANCHOR = { x: 296, y: 22 };
  const L = 400, K = 14, DAMP = 0.8, G = 820;
  const FLOOR_Y = 840;
  const NEED = 3, MAX_BOTTOMS = 6;

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const SKYSTOPS = [[-500, '#5fb8ec'], [0, '#8fd3f2'], [300, '#bde8f8'], [600, '#f6e8d4'], [900, '#f9d9c6']].map((s) => [s[0], hex(s[1])]);
  function skyAt(wy) {
    let a = SKYSTOPS[0], b = SKYSTOPS[SKYSTOPS.length - 1];
    for (let i = 0; i < SKYSTOPS.length - 1; i++) if (wy >= SKYSTOPS[i][0] && wy <= SKYSTOPS[i + 1][0]) { a = SKYSTOPS[i]; b = SKYSTOPS[i + 1]; break; }
    const t = U.clamp((wy - a[0]) / (b[0] - a[0] || 1), 0, 1);
    const c = [0, 1, 2].map((i) => Math.round(a[1][i] + (b[1][i] - a[1][i]) * t));
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  const CLOUDS = [];
  { const r = U.rng(3); for (let i = 0; i < 18; i++) CLOUDS.push({ x: r() * 900, y: -240 + i * 62 + r() * 30, s: 2 + Math.floor(r() * 3), v: 3 + r() * 6 }); }
  const BIRDS = [0, 1, 2, 3, 4].map((i) => ({ x: i * 220, y: 40 + i * 140, v: 18 + i * 4 }));

  function drawBackdrop(ctx, camY, t) {
    for (let sy = 0; sy < H; sy += 6) { ctx.fillStyle = skyAt(sy + camY + 3); ctx.fillRect(0, sy, W, 7); }
    // sun
    Art.sun(ctx, 400, Math.round(60 - camY * 0.3), 3);
    for (const c of CLOUDS) {
      const x = (((c.x + t * c.v) % 1100) + 1100) % 1100 - 180, y = Math.round(c.y - camY * 0.85);
      if (y > -40 && y < H) Art.cloud(ctx, Math.round(x), y, c.s);
    }
    // far mountains + valley
    const fy = FLOOR_Y - camY;
    if (fy < H + 140) {
      for (let i = 0; i < 7; i++) Art.mountain(ctx, 40 + i * 90, fy + 4, 170 + (i % 3) * 36, 110 + (i % 3) * 26, i % 2 ? '#a9b8e2' : '#b7c4ea', true);
      Art.hills(ctx, 0, W, H, fy + 4, 24, 70, '#a6d8a0', 1, 3);
      ctx.fillStyle = '#8fc96b'; ctx.fillRect(0, fy, W, H);
      for (let x = 0; x < W; x += 16) { ctx.fillStyle = (x / 16) % 2 ? '#93cf69' : '#8fc96b'; ctx.fillRect(x, fy, 16, 6); }
      ctx.fillStyle = '#7cc6e8'; ctx.fillRect(0, fy + 34, W, 10); ctx.fillStyle = '#a8dcf2'; for (let x = 0; x < W; x += 24) ctx.fillRect(x + ((t * 20) % 24), fy + 37, 8, 2);
      for (let i = 0; i < 9; i++) Art.tree(ctx, 30 + i * 56, fy + 28, 2, i % 4 === 0 ? 'pink' : undefined);
      Art.house(ctx, 250, fy + 20, 2); Art.house(ctx, 380, fy + 24, 2);
      for (let i = 0; i < 16; i++) Art.flower(ctx, 8 + i * 30, fy + 56 + (i % 3) * 5, [C.pink2, '#fff3a0', C.purple][i % 3], 2, Math.sin(t * 2 + i) * 0.6);
      for (let i = 0; i < 6; i++) Art.sunflower(ctx, 20 + i * 80, fy + 78, 2, Math.sin(t * 1.5 + i) * 0.6);
    }
    // birds
    for (const b of BIRDS) { const x = (((b.x + t * b.v) % 700) + 700) % 700 - 100, y = Math.round(b.y - camY * 0.9); if (y > -10 && y < H) Art.bird(ctx, Math.round(x), y, t + b.x, 2); }
  }

  function drawCliff(ctx, camY) {
    // rock wall on the left
    const top = Math.floor((camY - 20) / 10) * 10;
    for (let wy = top; wy < camY + H + 10; wy += 10) {
      if (wy < 0) continue;
      for (let bx = 0; bx < 170; bx += 10) {
        const h = ((bx * 73856093) ^ (wy * 19349663)) >>> 0, v = h % 7;
        ctx.fillStyle = v < 3 ? '#8d7a8f' : v < 6 ? '#9d8a9d' : '#7d6a82';
        ctx.fillRect(bx, Math.round(wy - camY), 10, 10);
        if (v === 6) { ctx.fillStyle = '#b3a1b0'; ctx.fillRect(bx + 2, Math.round(wy - camY) + 2, 4, 2); }
      }
      ctx.fillStyle = '#5b4862'; ctx.fillRect(166, Math.round(wy - camY), 4, 10);
    }
    // grass top
    const gy = Math.round(-camY);
    R(ctx, 0, gy - 8, 170, 8, '#8fc96b'); R(ctx, 0, gy - 8, 170, 2, '#b0e08a');
    for (let i = 0; i < 6; i++) Art.flower(ctx, 10 + i * 26, gy, [C.pink2, '#fff3a0', C.purple][i % 3], 2, 0);
    Art.tree(ctx, 36, gy - 4, 3, 'pink');
    // wooden platform
    R(ctx, 150, gy, 156, 8, '#c98450'); R(ctx, 150, gy, 156, 2, '#e0a56c'); R(ctx, 150, gy + 6, 156, 2, '#8a5a3c');
    for (let x = 160; x < 306; x += 14) R(ctx, x, gy + 2, 1, 4, '#8a5a3c');
    R(ctx, 296, gy, 10, 8, '#a8683c');
    for (let i = 0; i < 30; i++) { R(ctx, 160 + i * 3, gy + 8 + Math.round(i * 1.4), 5, 3, '#8a5a3c'); }
    R(ctx, 296, gy + 8, 4, 12, '#6b4128');
    // railing
    R(ctx, 154, gy - 20, 3, 20, '#a8683c'); R(ctx, 214, gy - 20, 3, 20, '#a8683c'); R(ctx, 154, gy - 20, 63, 3, '#c98450'); R(ctx, 154, gy - 10, 63, 3, '#c98450');
    Art.signpost(ctx, 232, gy, 2);
    // winch anchor
    R(ctx, ANCHOR.x - 3, Math.round(ANCHOR.y - camY) - 3, 6, 6, C.ink); R(ctx, ANCHOR.x - 2, Math.round(ANCHOR.y - camY) - 2, 4, 4, '#cfd3d8');
  }

  function line(ctx, x0, y0, x1, y1, c1, c2) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, i = 0;
    for (;;) {
      ctx.fillStyle = (i++ >> 2) % 2 ? c2 : c1; ctx.fillRect(x0 - 1, y0, 3, 2);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function create(g) {
    const st = {
      t: 0, state: 'ready', x: PLAT_X, y: 0, vy: 0, camY: -112, crouch: 0, hop: 0, maxY: 0,
      bottoms: 0, perfect: 0, good: 0, miss: 0, success: 0, wasStretch: false, prevVy: 0, pressT: -9, pendingT: -9, pending: false,
      apexCount: 0, floaters: [], flash: 0, celT: 0, ended: false, win: false, hint: 0, ringOn: false, prevS: -1
    };
    const P = g.particles;
    const stretch = () => (st.y - ANCHOR.y) - L;
    const popup = (txt, col) => { st.floaters.push({ txt, col, t: 0, y: st.y }); };

    function judge(err, early) {
      let res;
      if (err < 0.11) { res = 'perfect'; st.perfect++; st.success++; st.vy -= 380; g.sfx('perfect'); popup('PERFECT! ♡', C.sun); P.burst(st.x, st.y - 20, 14, ['heart', 'spark']); }
      else if (err < 0.26) { res = 'good'; st.good++; st.success++; st.vy -= 220; g.sfx('good'); popup('GOOD!', C.green); P.burst(st.x, st.y - 20, 6, ['spark']); }
      else { res = 'miss'; st.miss++; st.vy *= 0.8; g.sfx('miss'); popup(early ? 'TOO EARLY' : 'TOO LATE', '#ffffff'); }
      st.pending = false; st.pressT = -9;
      st.result = res; st.resultT = 1.1;
      return res;
    }

    function update(dt) {
      st.t += dt;
      const inp = g.input, press = inp.pressed('jump') || inp.pressed('act') || inp.pressed('up');
      st.resultT = Math.max(0, (st.resultT || 0) - dt);
      for (const f of st.floaters) f.t += dt; st.floaters = st.floaters.filter((f) => f.t < 1.1);

      if (st.state === 'ready') {
        st.camY += (-112 - st.camY) * Math.min(1, dt * 4);
        if (press) { st.state = 'crouch'; st.crouch = 0; g.sfx('click'); }
      } else if (st.state === 'crouch') {
        st.crouch += dt;
        if (st.crouch > 0.32) { st.state = 'air'; st.vy = -150; st.hop = 0; g.sfx('jump'); g.sfx('whoosh'); }
      } else if (st.state === 'air') {
        st.hop += dt;
        if (st.hop < 0.5) st.x += (ANCHOR.x - st.x) * Math.min(1, dt * 5);
        else st.x = ANCHOR.x + Math.sin(st.t * 2.2) * 3;
        const s = stretch();
        let a = G;
        if (s > 0) a -= K * s + DAMP * st.vy;
        st.prevVy = st.vy;
        st.vy += a * dt; st.y += st.vy * dt;
        st.maxY = Math.max(st.maxY, st.y);
        const s2 = stretch();
        if (press) {
          if (s2 > -10 || st.bt != null && st.t - st.bt < 0.3) { st.pressT = st.t; if (st.pending) { judge(st.t - st.bt, false); } }
          else { st.pressT = st.t; }
        }
        // entering stretch zone
        if (s2 > 0 && !st.wasStretch) { st.wasStretch = true; st.bt = null; st.hint++; if (st.bottoms === 0) g.sfx('whoosh'); }
        // bottom of bounce (velocity turns upward while stretched)
        if (st.wasStretch && st.prevVy > 0 && st.vy <= 0 && s2 > 0) {
          st.bottoms++; st.bt = st.t; g.sfx('bounce');
          P.dust(st.x, st.y);
          if (st.t - st.pressT < 0.3 && st.pressT > 0) judge(st.bt - st.pressT, true);
          else st.pending = true;
        }
        if (st.pending && st.t - st.bt > 0.28) { judge(1, false); }
        // leaving the stretch zone
        if (s2 <= 0 && st.wasStretch) { st.wasStretch = false; st.pending = false; st.bt = null; }
        // settled into a hang: wrap up once the last judgement is done
        if ((st.success >= NEED || st.bottoms >= MAX_BOTTOMS) && !st.pending && st.bt != null && st.t - st.bt > 0.5 && st.state === 'air') {
          st.state = 'celebrate'; st.celT = 0; st.win = st.success >= NEED; st.ey = st.y; st.vy = 0;
          g.sfx(st.win ? 'win' : 'lose');
        }
        // apex
        if (st.state === 'air' && s2 <= 0 && st.prevVy < 0 && st.vy >= 0 && st.bottoms > 0) {
          st.apexCount++;
          if (st.success >= NEED || st.bottoms >= MAX_BOTTOMS) {
            st.state = 'celebrate'; st.celT = 0; st.win = st.success >= NEED; st.ey = st.y; st.vy = 0;
            g.sfx(st.win ? 'win' : 'lose');
          }
        }
        st.ringOn = s2 > -30 && s2 < 400 && st.vy > -40 && st.wasStretch;
        const target = U.clamp(st.y - 130, -112, 760);
        st.camY += (target - st.camY) * Math.min(1, dt * 11);
      } else if (st.state === 'celebrate') {
        st.celT += dt;
        const target = U.clamp(st.ey - 120, -112, 700);
        st.camY += (target - st.camY) * Math.min(1, dt * 3);
        st.y = st.ey + Math.sin(st.celT * 3) * 6;
        if (st.win) { if (Math.random() < dt * 18) P.confetti(st.x + U.rand(-90, 90), st.y - 140, 1); if (Math.random() < dt * 5) P.heart(st.x + U.rand(-30, 30), st.y - 30); }
        if (st.celT > 2.6 && !st.ended) {
          st.ended = true;
          const m = Math.round(st.maxY / 10);
          const score = Math.round(st.maxY * 0.4) + st.perfect * 150 + st.good * 75 + (st.win ? 200 : 0);
          if (st.win) g.finish({ won: true, score, title: 'Bubs survived the adventure! ♡', message: 'Bounced like a champion, and the rope never stood a chance.', stats: [['MAX DEPTH', m + ' m'], ['PERFECT', st.perfect], ['GOOD', st.good], ['SCORE', score]] });
          else g.finish({ won: false, score, title: 'Wobbly, but brave! ♡', message: 'Bubs needs ' + NEED + ' good bounces to finish. Press at the very bottom of the stretch!', stats: [['MAX DEPTH', m + ' m'], ['BOUNCES', st.success + '/' + NEED], ['SCORE', score]] });
        }
      }
    }

    function draw(ctx) {
      const camY = st.camY;
      drawBackdrop(ctx, camY, st.t);
      drawCliff(ctx, camY);
      const sx = Math.round(st.x), sy = Math.round(st.y - camY);
      // rope
      if (st.state !== 'ready' && st.state !== 'crouch') {
        const ax = ANCHOR.x, ay = Math.round(ANCHOR.y - camY), wx = sx, wy = sy - 14;
        const slack = U.clamp(1 - (st.y - ANCHOR.y) / L, 0, 1);
        if (slack > 0.02) {
          // sagging rope: draw as two segments via a drooping midpoint
          const mx = (ax + wx) / 2 + 14 * slack, my = (ay + wy) / 2 + 60 * slack;
          line(ctx, ax, ay, mx, my, '#f2a0b5', '#fff'); line(ctx, mx, my, wx, wy, '#f2a0b5', '#fff');
        } else line(ctx, ax, ay, wx, wy, '#f2a0b5', '#fff');
      } else {
        line(ctx, ANCHOR.x, Math.round(ANCHOR.y - camY), sx + 6, sy - 14, '#f2a0b5', '#fff');
      }
      // Bubs
      let pose = 'idle', expr;
      if (st.state === 'ready') { pose = 'idle'; expr = (st.t % 2 < 1.2) ? 'surprised' : undefined; }
      else if (st.state === 'crouch') { pose = 'idle'; expr = 'surprised'; }
      else if (st.state === 'air') { pose = st.vy > 0 ? 'fall' : 'jump'; expr = st.vy > 0 ? 'surprised' : 'open'; if (st.result === 'perfect' && st.resultT > 0) pose = 'happy'; }
      else pose = st.win ? 'happy' : 'wave';
      const crouchDy = st.state === 'crouch' ? Math.round(Math.min(1, st.crouch / 0.3) * 4) : 0;
      BW.Bubs.draw(ctx, sx, sy + crouchDy, { pose, frame: BW.Bubs.frame(pose, st.t), outfit: 'bungee', scale: 2, expr: expr || BW.Bubs.autoExpr(st.t) });
      // harness band
      R(ctx, sx - 6, sy + crouchDy - 17, 12, 3, C.ink); R(ctx, sx - 5, sy + crouchDy - 16, 10, 1, C.pink2);
      // timing ring
      if (st.ringOn && st.state === 'air') {
        const r = 10 + Math.abs(st.vy) * 0.075, ok = Math.abs(st.vy) < 90;
        ctx.save(); ctx.strokeStyle = ok ? C.sun : '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy - 24, r + 6, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy - 24, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        Art.text(ctx, 'TAP!', sx, sy - 70, { size: 8, align: 'center', color: ok ? C.sun : '#fff' });
      }
      P.draw(ctx, 0, camY);
      for (const f of st.floaters) Art.text(ctx, f.txt, sx + 28, Math.round(f.y - camY) - 36 - f.t * 24, { size: 9, color: f.col });
      // prompts
      if (st.state === 'ready') Art.bubble(ctx, sx - 4, sy - 56, (Math.floor(st.t * 2) % 2 ? 'Ready? ' : 'Ready? ') + 'Press SPACE / TAP', { size: 6 });
      if (st.state === 'celebrate') Art.bubble(ctx, sx - 4, sy - 56, st.win ? 'Bubs survived! ♡' : 'Whoa… wobbly!', { size: 7 });
      // HUD
      Art.panel(ctx, 8, 8, 120, 34);
      Art.text(ctx, 'DEPTH ' + Math.max(0, Math.round(st.y / 10)) + 'm', 14, 13, { size: 7, color: C.ink, outline: false });
      Art.text(ctx, 'BOUNCES', 14, 26, { size: 6, color: C.ink, outline: false });
      for (let i = 0; i < NEED; i++) Art.heart(ctx, 82 + i * 14, 29, 1, i < st.success ? C.heart : '#d9c9a0', i >= st.success);
      Art.panel(ctx, W - 118, 8, 110, 18);
      const sc = Math.round(st.maxY * 0.4) + st.perfect * 150 + st.good * 75;
      Art.text(ctx, 'SCORE ' + sc, W - 112, 13, { size: 7, color: C.ink, outline: false });
      if (st.state === 'air' && st.bottoms === 0 && st.wasStretch) Art.text(ctx, 'TAP at the very bottom!', W / 2, 52, { size: 8, align: 'center', color: C.sun });
    }
    return { update, draw, state: st };
  }

  BW.Games.bungee = {
    id: 'bungee', emoji: '🪂', name: 'Bubs Goes Bungee Jumping', desc: 'Leap off the cliff and bounce on the beat!',
    hover: 'Deep breath, Bubs… jump! 🪂', outfit: 'bungee', tapAction: 'jump',
    intro: ['SPACE / tap to jump off the cliff', 'When the rope stretches, press SPACE / tap at the very bottom of the bounce', 'Land ' + NEED + ' good bounces to complete it'],
    touch: { left: [], right: [{ a: 'jump', t: 'JUMP / BOUNCE', cls: 'wide sun' }] },
    create
  };
})();
