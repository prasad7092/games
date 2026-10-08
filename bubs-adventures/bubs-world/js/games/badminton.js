/* Game 5 — Bubs Plays Badminton 🏸  (first to 5 vs Mochi the bunny: move, jump, time your swing) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art, R = U.R;
  const W = 480, H = 270;
  const GROUND = 232, NET_X = 240, NET_TOP = 176, GS = 560, WIN = 5;
  const SWING_T = 0.3;
  const KEYS = [[0, -165], [0.28, -150], [0.45, -85], [0.6, -30], [1, 45]];
  function swingAngle(p) {
    for (let i = 0; i < KEYS.length - 1; i++) if (p >= KEYS[i][0] && p <= KEYS[i + 1][0]) return U.lerp(KEYS[i][1], KEYS[i + 1][1], (p - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]));
    return KEYS[KEYS.length - 1][1];
  }

  /* ---- Mochi, the bunny opponent (pre-rendered tiny sprite with outline) ---- */
  const mochiCache = {};
  function mochiSprite(face) {
    if (mochiCache[face]) return mochiCache[face];
    const w = 24, h = 26, a = U.makeCanvas(w, h), g = a.getContext('2d');
    g.translate(2, 2);
    // feet & ears
    R(g, 5, 20, 4, 2, '#f6a5b1'); R(g, 11, 20, 4, 2, '#f6a5b1');
    R(g, 4, 0, 3, 8, '#fffaf0'); R(g, 13, 0, 3, 8, '#fffaf0'); R(g, 5, 1, 1, 6, '#f6a5b1'); R(g, 14, 1, 1, 6, '#f6a5b1');
    for (let dy = -9; dy <= 9; dy++) for (let dx = -10; dx <= 10; dx++) {
      const e = (dx / 10) ** 2 + (dy / 8.6) ** 2;
      if (e <= 1) R(g, 10 + dx, 12 + dy, 1, 1, dy > 4 ? '#f1e2da' : '#fffaf0');
    }
    R(g, 3, 13, 3, 2, '#f6a5b1'); R(g, 14, 13, 3, 2, '#f6a5b1');
    const eye = (x) => {
      if (face === 'blink' || face === 'happy') R(g, x, 11, 2, 1, '#2a1a20');
      else { R(g, x, 10, 2, 3, '#2a1a20'); R(g, x + 1, 10, 1, 1, '#fff'); }
    };
    eye(5); eye(13);
    if (face === 'sad') { R(g, 9, 15, 2, 1, '#c4524c'); R(g, 4, 9, 3, 1, '#2a1a20'); }
    else if (face === 'happy') { R(g, 8, 14, 4, 1, '#7a2c3a'); R(g, 9, 15, 2, 1, '#e97b86'); }
    else { R(g, 9, 14, 1, 1, '#c4524c'); R(g, 10, 14, 1, 1, '#c4524c'); R(g, 8, 13, 1, 1, '#c4524c'); R(g, 11, 13, 1, 1, '#c4524c'); }
    R(g, 8, 6, 4, 2, '#e8647c'); R(g, 9, 7, 2, 1, '#f6a5b1');
    const sil = U.makeCanvas(w, h), sg = sil.getContext('2d'); sg.drawImage(a, 0, 0);
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = C.ink; sg.fillRect(0, 0, w, h);
    const out = U.makeCanvas(w, h), og = out.getContext('2d');
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) og.drawImage(sil, d[0], d[1]);
    og.drawImage(a, 0, 0);
    return (mochiCache[face] = out);
  }

  BW.Mochi = mochiSprite;

  function create(g) {
    const P = g.particles;
    const me = { x: 110, y: GROUND, vy: 0, face: 1, swing: -1, hit: false, walk: 0, moving: false, score: 0 };
    const op = { x: 370, y: GROUND, vy: 0, swing: -1, hit: false, tx: 370, err: 0, react: 0, score: 0, mood: 'normal', moodT: 0, jumpCd: 0, planned: false, whiff: false };
    const sh = { x: 0, y: 0, vx: 0, vy: 0, state: 'held', last: null, px: 0, trail: [] };
    const st = {
      t: 0, server: 'P', state: 'serve', pauseT: 0, serveT: 0, rally: 0, bestRally: 0, msg: '', msgT: 0, over: false, winner: null, celT: 0, ended: false, hits: 0
    };

    function placeServe() {
      me.x = 110; op.x = 370; me.y = op.y = GROUND; me.vy = op.vy = 0; me.swing = op.swing = -1;
      sh.state = 'held'; sh.last = null; sh.vx = sh.vy = 0; st.rally = 0; st.state = 'serve'; st.serveT = 0; op.tx = 370; op.err = U.rand(-18, 18); op.planned = false;
    }
    placeServe();

    /** compute launch velocity that lands near tx, clearing the net */
    function shoot(fx, fy, who, smash, serve) {
      const dirRight = who === 'P';
      let tx;
      if (smash) tx = dirRight ? U.rand(290, 390) : U.rand(80, 190);
      else if (serve) tx = dirRight ? U.rand(320, 420) : U.rand(60, 160);
      else tx = dirRight ? U.rand(300, 440) : U.rand(40, 210);
      // aim away from the defender
      const def = dirRight ? op.x : me.x;
      if (!serve && Math.abs(tx - def) < 55) tx = dirRight ? (def < 370 ? U.rand(395, 445) : U.rand(290, 335)) : (def < 130 ? U.rand(150, 215) : U.rand(40, 90));
      let h = smash ? 6 : serve ? 95 : U.rand(75, 150);
      const gy = GROUND - 4;
      for (let k = 0; k < 12; k++) {
        const vy0 = -Math.sqrt(2 * GS * h);
        const T = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * GS * (gy - fy))) / GS;
        const vx = (tx - fx) / T;
        const tn = (NET_X - fx) / vx;
        if (tn > 0 && tn < T) {
          const yn = fy + vy0 * tn + 0.5 * GS * tn * tn;
          if (yn > NET_TOP - 14) { h += 22; continue; }
        }
        return { vx, vy: vy0 };
      }
      return { vx: dirRight ? 220 : -220, vy: -330 };
    }
    function launch(who, x, y, smash, serve) {
      const v = shoot(x, y, who, smash, serve);
      sh.vx = v.vx; sh.vy = v.vy; sh.state = 'flight'; sh.last = who;
      st.rally++; st.bestRally = Math.max(st.bestRally, st.rally);
      g.sfx(smash ? 'bump' : 'hit'); if (smash) st.msg = 'SMASH!', st.msgT = 0.7;
      P.burst(x, y, smash ? 10 : 5, ['spark']);
    }
    function point(side, why) {
      if (st.state === 'point' || st.over) return;
      if (side === 'P') me.score++; else op.score++;
      st.state = 'point'; st.pauseT = 1.5; st.server = side;
      st.msg = (side === 'P' ? 'Point for Bubs! ♡' : 'Point for Mochi!'); st.msgT = 1.5;
      g.sfx(side === 'P' ? 'point' : 'miss');
      if (side === 'P') { P.burst(me.x, me.y - 40, 10, ['heart']); op.mood = 'sad'; } else { op.mood = 'happy'; }
      op.moodT = 1.5;
      if (me.score >= WIN || op.score >= WIN) {
        st.over = true; st.winner = me.score >= WIN ? 'P' : 'O'; st.celT = 0;
        g.sfx(st.winner === 'P' ? 'win' : 'lose');
      }
    }
    function racketOf(who) {
      if (who === 'P') {
        const p = me.swing < 0 ? 0 : me.swing / SWING_T;
        return { p, ...BW.Bubs.racketInfo(me.x, me.y, { pose: 'swing', p, scale: 2 }) };
      }
      const p = op.swing < 0 ? 0 : op.swing / SWING_T;
      const th = (180 - swingAngle(p)) * Math.PI / 180;
      const hx = op.x - 12, hy = op.y - 18;
      return { p, hx, hy, cx: hx + Math.cos(th) * 17, cy: hy + Math.sin(th) * 17, th };
    }
    function tryHit(who) {
      const body = who === 'P' ? me : op;
      if (body.swing < 0 || body.hit || sh.state !== 'flight' || sh.last === who) return;
      const r = racketOf(who);
      if (r.p < 0.12 || r.p > 0.82) return;
      if (Math.hypot(sh.x - r.cx, sh.y - r.cy) < 27) {
        body.hit = true;
        const air = body.y < GROUND - 14 && sh.y < GROUND - 78;
        launch(who, sh.x, sh.y, air && Math.random() < 0.9, false);
      }
    }
    // landing prediction for the AI
    function predictX(yTarget) {
      let x = sh.x, y = sh.y, vx = sh.vx, vy = sh.vy;
      for (let i = 0; i < 400; i++) {
        vy += GS * 0.016; x += vx * 0.016; y += vy * 0.016;
        if (vy > 0 && y >= yTarget) return x;
        if (y > GROUND) return x;
      }
      return x;
    }

    function update(dt) {
      st.t += dt;
      const inp = g.input;
      st.msgT = Math.max(0, st.msgT - dt);
      op.moodT = Math.max(0, op.moodT - dt); if (op.moodT <= 0) op.mood = 'normal';
      const live = !st.over;

      // ---- Bubs ----
      let dx = 0;
      if (live) { if (inp.isDown('left')) dx -= 1; if (inp.isDown('right')) dx += 1; }
      me.moving = dx !== 0;
      me.x = U.clamp(me.x + dx * 135 * dt, 28, NET_X - 20);
      if (dx) me.walk += dt;
      if (live && (inp.pressed('jump') || inp.pressed('up')) && me.y >= GROUND) { me.vy = -300; g.sfx('jump'); }
      me.vy += 950 * dt; me.y += me.vy * dt;
      if (me.y >= GROUND) { if (me.vy > 220) { g.sfx('land'); P.dust(me.x - 6, GROUND); } me.y = GROUND; me.vy = 0; }
      if (live && inp.pressed('act') && me.swing < 0) {
        me.swing = 0; me.hit = false; g.sfx('swing');
        if (st.state === 'serve' && st.server === 'P' && sh.state === 'held') { st.pendingServe = true; }
      }
      if (me.swing >= 0) { me.swing += dt; if (me.swing > SWING_T) { me.swing = -1; } }
      if (st.pendingServe && me.swing >= 0.1) { st.pendingServe = false; const r = racketOf('P'); launch('P', me.x + 16, me.y - 60, false, true); st.state = 'play'; me.hit = true; }

      // ---- Mochi (AI) ----
      const level = 0.9 + Math.min(0.15, (me.score - op.score) * 0.03);
      if (st.state === 'serve' && st.server === 'O') {
        st.serveT += dt;
        if (st.serveT > 1.0 && op.swing < 0) { op.swing = 0; op.hit = false; g.sfx('swing'); st.pendingServeO = true; }
      }
      if (st.pendingServeO && op.swing >= 0.1) { st.pendingServeO = false; launch('O', op.x - 16, op.y - 60, false, true); st.state = 'play'; op.hit = true; }
      let want = 372;
      if (sh.state === 'flight' && sh.last === 'P' && sh.vx > 0) {
        if (!op.planned) { op.planned = true; op.err = U.rand(-20, 20); op.whiff = Math.random() < 0.14; op.react = U.rand(0.04, 0.16); }
        want = predictX(GROUND - 55) + 16 + op.err;
      } else if (sh.state === 'flight' && sh.last === 'O') { want = 372; op.planned = false; }
      want = U.clamp(want, NET_X + 22, 452);
      const dxo = want - op.x;
      if (live && Math.abs(dxo) > 3) op.x += Math.sign(dxo) * Math.min(Math.abs(dxo), 104 * level * dt);
      op.jumpCd = Math.max(0, op.jumpCd - dt);
      if (live && sh.state === 'flight' && sh.last === 'P' && op.y >= GROUND && op.jumpCd <= 0 && sh.y < GROUND - 96 && Math.abs(sh.x - op.x) < 70 && sh.vy > -20) { op.vy = -290; op.jumpCd = 1.2; }
      op.vy += 950 * dt; op.y += op.vy * dt; if (op.y >= GROUND) { op.y = GROUND; op.vy = 0; }
      if (live && sh.state === 'flight' && sh.last === 'P' && op.swing < 0) {
        const r = racketOf('O');
        const close = Math.hypot(sh.x - (op.x - 20), sh.y - (op.y - 50)) < (op.whiff ? 130 : 58);
        if (close && sh.vx > 0 || (close && sh.x > NET_X)) { op.react -= dt; if (op.react <= 0) { op.swing = 0; op.hit = false; g.sfx('swing'); op.react = 99; } }
      }
      if (op.swing >= 0) { op.swing += dt; if (op.swing > SWING_T) { op.swing = -1; } }

      // ---- shuttle ----
      if (sh.state === 'held') {
        const srv = st.server === 'P' ? me : op, dir = st.server === 'P' ? 1 : -1;
        sh.x = srv.x + dir * 16; sh.y = srv.y - 62 + Math.sin(st.t * 5) * 2; sh.px = sh.x;
      } else {
        const px = sh.x;
        sh.vy += GS * dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        sh.trail.push({ x: sh.x, y: sh.y, t: 0 }); if (sh.trail.length > 8) sh.trail.shift();
        // net
        if (sh.state === 'flight' && ((px < NET_X && sh.x >= NET_X) || (px > NET_X && sh.x <= NET_X)) && sh.y > NET_TOP) {
          sh.vx = -sh.vx * 0.2; sh.vy = Math.max(sh.vy, 0); sh.x = px; sh.state = 'dead'; g.sfx('net');
          point(sh.last === 'P' ? 'O' : 'P', 'net');
        }
        if (live && sh.state === 'flight') { tryHit('P'); tryHit('O'); }
        if (sh.y >= GROUND - 3 && sh.state !== 'landed') {
          sh.y = GROUND - 3; const wasFlight = sh.state === 'flight'; sh.state = 'landed'; sh.vx = sh.vy = 0; g.sfx('land'); P.dust(sh.x, GROUND);
          if (wasFlight || st.state === 'play') point(sh.x < NET_X ? 'O' : 'P', 'floor');
        }
      }
      // ---- state flow ----
      if (st.state === 'point') {
        st.pauseT -= dt;
        if (st.pauseT <= 0 && !st.over) placeServe();
      }
      if (st.over) {
        st.celT += dt;
        if (st.winner === 'P') { if (Math.random() < dt * 20) P.confetti(U.rand(40, 440), 40, 1); if (Math.random() < dt * 6) P.heart(me.x + U.rand(-20, 20), me.y - 50); }
        if (st.celT > 2.8 && !st.ended) {
          st.ended = true;
          const score = me.score * 100 + Math.max(0, (me.score - op.score)) * 50 + st.bestRally * 5;
          if (st.winner === 'P') g.finish({ won: true, score, title: 'BUBS WINS! 🏆♡', message: 'Mochi bowed deeply. A flawless victory (with a little cheering).', stats: [['FINAL', me.score + ' - ' + op.score], ['BEST RALLY', st.bestRally], ['SCORE', score]] });
          else g.finish({ won: false, score, title: 'Mochi wins this round!', message: 'So close, Bubs! One more match and that bunny is toast. ♡', stats: [['FINAL', me.score + ' - ' + op.score], ['BEST RALLY', st.bestRally]] });
        }
      }
      for (const q of sh.trail) q.t += dt;
      sh.trail = sh.trail.filter((q) => q.t < 0.25);
    }

    function drawBackground(ctx) {
      Art.skyBands(ctx, W, 200, ['#8fd3f0', '#a3dcf4', '#b8e5f7', '#cdeefa', '#e1f5fc', '#f4fbf8', '#fdf0dd']);
      Art.sun(ctx, 60, 54, 3);
      for (const [x, y, s] of [[120, 30, 2], [260, 52, 3], [380, 24, 2], [450, 70, 2]]) Art.cloud(ctx, Math.round(x + Math.sin(st.t * 0.3 + x) * 8), y, s);
      for (let i = 0; i < 5; i++) Art.mountain(ctx, 30 + i * 120, 168, 180, 70 + (i % 2) * 20, '#b6c3ea', true);
      Art.hills(ctx, 0, W, H, 186, 24, 60, '#a8d9a0', 0, 2);
      Art.hills(ctx, 0, W, H, 196, 18, 44, '#8fc96b', 0, 6);
      // bunting
      for (let i = 0; i < 22; i++) {
        const x = 10 + i * 22, y = 14 + Math.round(Math.sin(i / 21 * Math.PI) * 10);
        R(ctx, x, y, 22, 1, C.ink2);
        R(ctx, x + 4, y + 1, 12, 3, ['#f6a5b1', '#fff3d6', '#f7c948', '#a8dcf2'][i % 4]); R(ctx, x + 6, y + 4, 8, 3, ['#f6a5b1', '#fff3d6', '#f7c948', '#a8dcf2'][i % 4]); R(ctx, x + 8, y + 7, 4, 2, ['#f6a5b1', '#fff3d6', '#f7c948', '#a8dcf2'][i % 4]);
      }
      // garden backdrop
      for (let i = 0; i < 9; i++) Art.tree(ctx, 20 + i * 56 + (i % 2) * 14, 206, 2, i % 3 === 0 ? 'pink' : undefined);
      Art.fence(ctx, 0, 214, W, 2);
      for (let i = 0; i < 20; i++) Art.flower(ctx, 12 + i * 24, 224 + (i % 2) * 3, [C.pink2, '#fff3a0', C.purple][i % 3], 2, Math.sin(st.t * 2 + i) * 0.6);
      // court
      R(ctx, 0, 226, W, 44, '#8fc96b');
      R(ctx, 14, GROUND, W - 28, 32, '#7cc6a4'); R(ctx, 14, GROUND, W - 28, 2, '#5fae8a');
      for (let x = 14; x < W - 14; x += 20) R(ctx, x, GROUND + 2, 10, 30, 'rgba(255,255,255,.06)');
      R(ctx, 14, GROUND, 3, 32, '#fff'); R(ctx, W - 17, GROUND, 3, 32, '#fff'); R(ctx, 14, GROUND + 30, W - 28, 2, '#fff'); R(ctx, 14, GROUND, W - 28, 2, '#fff');
      R(ctx, 120, GROUND, 2, 32, '#fff'); R(ctx, 358, GROUND, 2, 32, '#fff'); R(ctx, NET_X - 1, GROUND, 2, 32, '#fff');
      // net
      R(ctx, NET_X - 3, NET_TOP - 4, 6, GROUND - NET_TOP + 8, C.brown2); R(ctx, NET_X - 2, NET_TOP - 4, 2, GROUND - NET_TOP + 8, '#a8683c');
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let y = NET_TOP + 4; y < GROUND; y += 6) ctx.fillRect(NET_X - 12, y, 24, 1);
      for (let x = NET_X - 12; x <= NET_X + 12; x += 6) ctx.fillRect(x, NET_TOP + 4, 1, GROUND - NET_TOP - 4);
      ctx.fillStyle = '#fff'; ctx.fillRect(NET_X - 13, NET_TOP, 26, 4); ctx.fillStyle = C.ink; ctx.fillRect(NET_X - 13, NET_TOP + 4, 26, 1);
    }

    function draw(ctx) {
      drawBackground(ctx);
      // shadows
      ctx.fillStyle = 'rgba(40,70,60,.28)';
      ctx.fillRect(Math.round(me.x - 12), GROUND + 1, 24, 4); ctx.fillRect(Math.round(op.x - 12), GROUND + 1, 24, 4);
      if (sh.state !== 'held') ctx.fillRect(Math.round(sh.x - 3), GROUND + 3, 6, 2);
      // Mochi
      {
        const face = op.mood === 'happy' ? 'happy' : op.mood === 'sad' ? 'sad' : (st.t % 3.1 < 0.13 ? 'blink' : 'normal');
        const sp = mochiSprite(face), bob = op.vy === 0 && Math.abs(op.x - 372) > 2 ? Math.abs(Math.sin(st.t * 14)) * 2 : 0;
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ctx.translate(Math.round(op.x), Math.round(op.y - bob));
        ctx.scale(-1, 1);
        ctx.drawImage(sp, -13 * 2, -25 * 2 + 2, sp.width * 2, sp.height * 2);
        ctx.restore();
        const r = racketOf('O'), th = op.swing < 0 ? (180 - (-60)) * Math.PI / 180 : r.th;
        ctx.save(); ctx.translate(Math.round(op.x), Math.round(op.y - bob));
        Art.racket(ctx, -6, -9, op.swing < 0 ? Math.PI + 1.0 : (180 - swingAngle(r.p)) * Math.PI / 180, 2, '#f6a5b1');
        ctx.restore();
      }
      // Bubs
      {
        let pose = 'ready', p;
        if (st.over && st.winner === 'P') pose = 'happy';
        else if (me.swing >= 0) { pose = 'swing'; p = me.swing / SWING_T; }
        else if (me.y < GROUND - 3) pose = 'jump';
        else if (me.moving) pose = 'walk';
        const hop = pose === 'happy' ? Math.abs(Math.sin(st.celT * 6)) * 10 : 0;
        BW.Bubs.draw(ctx, me.x, me.y - hop, { pose, p, frame: BW.Bubs.frame(pose, st.t), outfit: 'badminton', scale: 2, expr: st.over && st.winner === 'O' ? 'surprised' : BW.Bubs.autoExpr(st.t) });
      }
      // shuttle
      for (const q of sh.trail) { ctx.globalAlpha = 0.5 * (1 - q.t / 0.25); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(q.x) - 1, Math.round(q.y) - 1, 3, 3); }
      ctx.globalAlpha = 1;
      if (sh.state === 'held') Art.shuttle(ctx, sh.x, sh.y, st.server === 'P' ? -Math.PI / 2 + 0.2 : -Math.PI / 2 - 0.2, 1.5);
      else Art.shuttle(ctx, sh.x, sh.y, sh.state === 'landed' ? 0.5 : Math.atan2(sh.vy, sh.vx), 1.5);
      P.draw(ctx, 0, 0);
      // scoreboard
      Art.panel(ctx, W / 2 - 96, 36, 192, 24);
      Art.text(ctx, 'BUBS', W / 2 - 90, 44, { size: 8, color: C.rose, outline: false });
      Art.text(ctx, String(me.score), W / 2 - 38, 43, { size: 11, color: C.ink, outline: false });
      Art.text(ctx, '-', W / 2 - 3, 43, { size: 11, color: C.ink, outline: false });
      Art.text(ctx, String(op.score), W / 2 + 16, 43, { size: 11, color: C.ink, outline: false });
      Art.text(ctx, 'MOCHI', W / 2 + 36, 44, { size: 8, color: '#8a5a6a', outline: false });
      Art.text(ctx, 'first to ' + WIN, W / 2, 63, { size: 6, align: 'center' });
      if (st.rally > 1) Art.text(ctx, 'RALLY ' + st.rally, W - 12, 10, { size: 7, align: 'right' });
      if (st.state === 'serve' && st.server === 'P' && !st.over) Art.bubble(ctx, me.x + 10, me.y - 74, 'SERVE! press SWING', { size: 6 });
      if (st.msgT > 0 && st.msg) Art.text(ctx, st.msg, W / 2, 98, { size: 11, align: 'center', color: C.sun });
    }
    return { update, draw, state: st, me, op, sh };
  }

  BW.Games.badminton = {
    id: 'badminton', emoji: '🏸', name: 'Bubs Plays Badminton', desc: 'A friendly match against Mochi the bunny. First to 5!',
    hover: 'Game on, Bubs! 🏸', outfit: 'badminton',
    intro: ['← → / A D to move, SPACE or ↑ to jump', 'Z / J / X / Enter = swing the racket (time it!)', 'Hit the shuttle while jumping for a SMASH. First to 5 wins!'],
    touch: { left: [{ a: 'left', t: '◀' }, { a: 'right', t: '▶' }], right: [{ a: 'jump', t: 'JUMP', cls: 'green' }, { a: 'act', t: 'SWING', cls: 'wide sun' }] },
    create
  };
})();
