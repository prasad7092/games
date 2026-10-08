/* Game 2 — Bubs' Sunflower Garden 🌻  (peaceful top-down exploration: find 7 special sunflowers) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art, R = U.R;
  const W = 480, H = 270, WW = 1152, WH = 768;
  const POND = { x: 880, y: 170, rx: 105, ry: 62 };
  const PATH = [[130, 700], [190, 610], [300, 560], [420, 480], [520, 420], [600, 330], [680, 260], [790, 240]];
  const FIELD_A = { x: 110, y: 100, w: 420, h: 280 }, FIELD_B = { x: 590, y: 420, w: 420, h: 280 };
  const SPECIALS = [
    { x: 300, y: 520, hint: 'near the start' }, { x: 172, y: 192 }, { x: 640, y: 112 }, { x: 985, y: 330 },
    { x: 78, y: 92 }, { x: 724, y: 612 }, { x: 1092, y: 690 }
  ];
  const SIGNS = [
    { x: 232, y: 646, text: 'Find 7 special sunflowers!' }, { x: 584, y: 336, text: 'Psst… some hide in secret nooks' },
    { x: 790, y: 262, text: 'Duck pond (ducks on holiday)' }, { x: 1004, y: 436, text: "Bubs' favourite spot ♡" },
    { x: 150, y: 400, text: 'Something shiny in the NW glade…' }
  ];
  const BENCH = { x: 760, y: 300 };

  let CACHE = null;

  function nearPath(x, y, d) {
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i], b = PATH[i + 1];
      for (let t = 0; t <= 1; t += 0.05) {
        if (Math.hypot(x - (a[0] + (b[0] - a[0]) * t), y - (a[1] + (b[1] - a[1]) * t)) < d) return true;
      }
    }
    return false;
  }
  const inPond = (x, y, pad) => ((x - POND.x) / (POND.rx + pad)) ** 2 + ((y - POND.y) / (POND.ry + pad)) ** 2 < 1;
  const inRect = (r, x, y, p) => x > r.x - p && x < r.x + r.w + p && y > r.y - p && y < r.y + r.h + p;

  function build() {
    const rnd = U.rng(5);
    const trees = [], signs = SIGNS.map((s) => Object.assign({}, s)), fieldFlowers = [];
    const addTree = (x, y, hue) => trees.push({ x, y, r: 9, hue });
    // border
    for (let x = 14; x < WW; x += 30) { addTree(x + (rnd() * 8 - 4), 14, rnd() < .2 ? 'pink' : undefined); addTree(x + 15, 34, undefined); addTree(x + (rnd() * 8 - 4), WH - 4, undefined); addTree(x + 15, WH - 24, rnd() < .2 ? 'pink' : undefined); }
    for (let y = 54; y < WH - 30; y += 30) { addTree(8, y, undefined); addTree(26, y + 15, rnd() < .2 ? 'pink' : undefined); addTree(WW - 8, y, undefined); addTree(WW - 26, y + 15, undefined); }
    // rings around hidden nooks (gap angle in radians, screen-space: +y is down)
    const ring = (cx, cy, r, gap, n) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        let d = Math.abs(((a - gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < 0.62) continue;
        addTree(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 'pink');
      }
    };
    ring(80, 92, 48, Math.PI / 2, 15);        // NW glade: opening to the south
    ring(1092, 690, 46, Math.PI, 15);         // SE nook: opening to the west
    // scattered trees
    let guard = 0;
    while (trees.length < 150 && guard++ < 4000) {
      const x = 40 + rnd() * (WW - 80), y = 70 + rnd() * (WH - 120);
      if (nearPath(x, y, 34) || inPond(x, y, 26) || inRect(FIELD_A, x, y, 12) || inRect(FIELD_B, x, y, 12)) continue;
      if (SPECIALS.some((s) => Math.hypot(s.x - x, s.y - y) < 44)) continue;
      if (Math.hypot(x - 160, y - 650) < 70) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < 34)) continue;
      if (SIGNS.some((s) => Math.hypot(s.x - x, s.y - y) < 30)) continue;
      addTree(Math.round(x), Math.round(y), rnd() < 0.15 ? 'pink' : rnd() < 0.1 ? 'autumn' : undefined);
    }
    // sunflower fields
    for (const F of [FIELD_A, FIELD_B]) {
      for (let y = F.y; y < F.y + F.h; y += 22) for (let x = F.x; x < F.x + F.w; x += 22) {
        const px = x + rnd() * 12 - 4 + ((y / 22) % 2) * 8, py = y + rnd() * 8;
        if (nearPath(px, py, 20) || SPECIALS.some((s) => Math.hypot(s.x - px, s.y - py) < 17)) continue;
        if (SIGNS.some((s) => Math.hypot(s.x - px, s.y - py) < 16)) continue;
        if (trees.some((t) => Math.hypot(t.x - px, t.y - py) < 16)) continue;
        fieldFlowers.push({ x: px, y: py, ph: rnd() * 6.28, wig: 0 });
      }
    }
    // static ground layer
    const cv = U.makeCanvas(WW, WH), g = cv.getContext('2d');
    for (let y = 0; y < WH; y += 16) for (let x = 0; x < WW; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#9ad36f' : '#93cf69'; g.fillRect(x, y, 16, 16); }
    for (let i = 0; i < 900; i++) { const x = Math.floor(rnd() * WW), y = Math.floor(rnd() * WH); g.fillStyle = rnd() < .5 ? '#7fbf5a' : '#b0e08a'; g.fillRect(x, y, 2, 3); g.fillRect(x + 3, y + 1, 1, 2); }
    // glade floors
    for (const [cx, cy, r] of [[80, 92, 40], [1092, 690, 38]]) {
      g.fillStyle = '#b6e48f';
      for (let dy = -r; dy <= r; dy += 4) for (let dx = -r; dx <= r; dx += 4) if (dx * dx + dy * dy < r * r) g.fillRect(cx + dx, cy + dy, 4, 4);
    }
    // path
    const brush = (x, y, rad, col) => { g.fillStyle = col; for (let dy = -rad; dy <= rad; dy += 4) for (let dx = -rad; dx <= rad; dx += 4) if (dx * dx + dy * dy <= rad * rad) g.fillRect(Math.round((x + dx) / 4) * 4, Math.round((y + dy) / 4) * 4, 4, 4); };
    for (let i = 0; i < PATH.length - 1; i++) for (let t = 0; t <= 1; t += 0.02) { const a = PATH[i], b = PATH[i + 1]; brush(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 18, '#dcbd86'); }
    for (let i = 0; i < PATH.length - 1; i++) for (let t = 0; t <= 1; t += 0.02) { const a = PATH[i], b = PATH[i + 1]; brush(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 14, '#ecd09a'); }
    for (let i = 0; i < 160; i++) { const k = Math.floor(rnd() * (PATH.length - 1)), t = rnd(), a = PATH[k], b = PATH[k + 1]; g.fillStyle = '#cfae74'; g.fillRect(Math.round(a[0] + (b[0] - a[0]) * t + rnd() * 20 - 10), Math.round(a[1] + (b[1] - a[1]) * t + rnd() * 20 - 10), 2, 2); }
    // pond
    for (let dy = -POND.ry - 8; dy <= POND.ry + 8; dy += 4) for (let dx = -POND.rx - 8; dx <= POND.rx + 8; dx += 4) {
      const e = (dx / (POND.rx + 8)) ** 2 + (dy / (POND.ry + 8)) ** 2, w = (dx / POND.rx) ** 2 + (dy / POND.ry) ** 2;
      if (e <= 1) { g.fillStyle = w <= 1 ? (((dx + dy) / 4) % 7 === 0 ? '#a8dcf2' : '#7cc6e8') : '#f1e0a8'; g.fillRect(POND.x + dx, POND.y + dy, 4, 4); }
    }
    for (const [lx, ly] of [[850, 190], [905, 150], [930, 195], [820, 160]]) { g.fillStyle = '#5fa05a'; g.fillRect(lx, ly, 12, 8); g.fillRect(lx + 2, ly - 2, 8, 12); g.fillStyle = '#ffd0da'; g.fillRect(lx + 4, ly + 2, 3, 3); }
    // wildflowers & mushrooms
    const wcols = ['#fff', '#f6a5b1', '#fff3a0', '#b9a3e3', '#ff9aa8'];
    for (let i = 0; i < 360; i++) {
      const x = Math.floor(rnd() * WW), y = Math.floor(rnd() * WH);
      if (nearPath(x, y, 22) || inPond(x, y, 12) || inRect(FIELD_A, x, y, 0) || inRect(FIELD_B, x, y, 0)) continue;
      g.fillStyle = wcols[Math.floor(rnd() * wcols.length)]; g.fillRect(x, y, 3, 3); g.fillStyle = '#fff3a0'; g.fillRect(x + 1, y + 1, 1, 1); g.fillStyle = '#5fa05a'; g.fillRect(x + 1, y + 3, 1, 3);
    }
    for (const [mx, my] of [[50, 120], [110, 120], [64, 64], [100, 64], [1060, 700], [1120, 668], [1070, 656]]) Art.mushroom(g, mx, my, 2);
    // pond fence & bench shadows
    return { cv, trees, signs, fieldFlowers };
  }

  function create(g) {
    if (!CACHE) CACHE = build();
    const { cv, trees, signs, fieldFlowers } = CACHE;
    fieldFlowers.forEach((f) => (f.wig = 0));
    const specials = SPECIALS.map((s, i) => ({ x: s.x, y: s.y, got: false, ph: i * 1.3, wig: 0 }));
    const colliders = trees.map((t) => ({ x: t.x, y: t.y, r: t.r }));
    for (const s of signs) colliders.push({ x: s.x, y: s.y, r: 7 });
    colliders.push({ x: BENCH.x, y: BENCH.y, r: 14 }, { x: BENCH.x + 14, y: BENCH.y, r: 10 }, { x: BENCH.x - 14, y: BENCH.y, r: 10 });
    const B = { x: 160, y: 680, face: 1, moving: false, idle: 0, wave: 0 };
    const st = {
      t: 0, found: 0, state: 'play', cel: 0, lastFind: 0, wiggles: 0, ended: false, hintT: 0, hintOn: 0, intro: 4.8, floaters: [],
      steps: 0
    };
    const flies = [0, 1, 2].map((i) => ({ x: B.x + 10, y: B.y - 30, c: [C.pink2, C.sun, C.purple][i] }));
    const wild = [0, 1, 2].map((i) => ({ x: 300 + i * 200, y: 300 + i * 60, tx: 300 + i * 200, ty: 300 + i * 60, c: ['#ff9aa8', '#7cc6e8', '#ffd34d'][i] }));
    const bees = [0, 1, 2].map((i) => ({ cx: 200 + i * 90, cy: 180 + i * 40, p: i * 2 }));
    const blocked = (x, y) => {
      if (x < 24 || x > WW - 24 || y < 48 || y > WH - 16) return true;
      if (inPond(x, y, 6)) return true;
      for (const c of colliders) if (Math.abs(c.x - x) < c.r + 6 && Math.abs(c.y - y) < c.r + 6 && Math.hypot(c.x - x, c.y - y) < c.r + 6) return true;
      return false;
    };
    const say = (txt) => { st.said = txt; st.saidT = 2.4; };

    function update(dt) {
      st.t += dt;
      const inp = g.input, play = st.state === 'play';
      st.intro = Math.max(0, st.intro - dt);
      st.saidT = Math.max(0, (st.saidT || 0) - dt);
      let dx = 0, dy = 0;
      if (play) {
        if (inp.isDown('left')) dx -= 1; if (inp.isDown('right')) dx += 1;
        if (inp.isDown('up')) dy -= 1; if (inp.isDown('down')) dy += 1;
        if (inp.pressed('act') || inp.pressed('jump')) { st.hintOn = 5; g.sfx('sparkle'); }
      }
      st.hintOn = Math.max(0, st.hintOn - dt);
      B.moving = !!(dx || dy);
      if (B.moving) {
        const l = Math.hypot(dx, dy), sp = 80 * dt;
        const nx = B.x + (dx / l) * sp, ny = B.y + (dy / l) * sp;
        if (!blocked(nx, B.y)) B.x = nx;
        if (!blocked(B.x, ny)) B.y = ny;
        if (dx) B.face = dx > 0 ? 1 : -1;
        B.idle = 0; B.wave = 0;
        st.steps += dt;
        if (st.steps > 0.28) { st.steps = 0; g.sfx('wiggle'); }
      } else { B.idle += dt; if (B.idle > 4 && B.wave <= 0) { B.wave = 1.6; } B.wave = Math.max(0, B.wave - dt); if (B.wave <= 0 && B.idle > 7) B.idle = 0; }

      // wiggle flowers near Bubs
      for (const f of fieldFlowers) if (Math.abs(f.x - B.x) < 13 && Math.abs(f.y - B.y) < 10 && f.wig <= 0.1) { f.wig = 0.7; }
      for (const f of fieldFlowers) f.wig = Math.max(0, f.wig - dt);
      for (const s of specials) s.wig = Math.max(0, s.wig - dt);

      // collect
      if (play) for (const s of specials) {
        if (!s.got && Math.hypot(s.x - B.x, s.y - 6 - B.y) < 24) {
          s.got = true; st.found++; st.lastFind = st.t; st.hintT = 0;
          g.sfx(st.found === 7 ? 'win' : 'special');
          g.particles.burst(s.x, s.y - 30, 14, ['heart', 'spark']);
          st.floaters.push({ x: s.x, y: s.y - 60, t: 0, txt: st.found + '/7' });
          const msgs = ['First one!', 'Two! So pretty', 'Three sunflowers!', 'Halfway… almost', 'Five! Wow', 'One more…!', ''];
          say(msgs[st.found - 1]);
          if (st.found === 7) { st.state = 'celebrate'; st.cel = 0; }
        }
      }
      if (play) { st.hintT += dt; }
      // celebrate
      if (st.state === 'celebrate') {
        st.cel += dt;
        if (Math.random() < dt * 16) g.particles.confetti(B.x + U.rand(-70, 70), B.y - 120, 1);
        if (Math.random() < dt * 5) g.particles.heart(B.x + U.rand(-30, 30), B.y - 40);
        if (st.cel > 2.8 && !st.ended) {
          st.ended = true;
          const sec = Math.round(st.t), tm = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
          g.finish({
            won: true, score: 700 + st.wiggles * 5, title: 'The garden is prettier with Bubs in it 🌻♡',
            message: 'All 7 special sunflowers found. Every flower turned to look at you.',
            stats: [['SUNFLOWERS', '7/7'], ['TIME', tm], ['WIGGLES', st.wiggles]]
          });
        }
      }
      if (Math.random() < dt * 0.4) g.particles.heart(B.x + U.rand(-10, 10), B.y - 50);
      // critters
      flies.forEach((f, i) => {
        const tx = B.x + Math.cos(st.t * 1.3 + i * 2.1) * 24, ty = B.y - 44 + Math.sin(st.t * 1.8 + i * 2.1) * 12;
        f.x += (tx - f.x) * Math.min(1, dt * 2.2); f.y += (ty - f.y) * Math.min(1, dt * 2.2);
      });
      wild.forEach((w) => {
        if (Math.hypot(w.tx - w.x, w.ty - w.y) < 6) { w.tx = U.clamp(w.x + U.rand(-90, 90), 60, WW - 60); w.ty = U.clamp(w.y + U.rand(-60, 60), 80, WH - 60); }
        const a = Math.atan2(w.ty - w.y, w.tx - w.x); w.x += Math.cos(a) * 26 * dt; w.y += Math.sin(a) * 26 * dt + Math.sin(st.t * 6 + w.x) * 0.3;
      });
      for (const f of st.floaters) f.t += dt; st.floaters = st.floaters.filter((f) => f.t < 1.2);
    }

    function pointer(px, py) {
      const wx = px + st.camX, wy = py + st.camY;
      let hit = false;
      for (const f of fieldFlowers) if (Math.abs(f.x - wx) < 12 && wy > f.y - 44 && wy < f.y + 4) { f.wig = 0.8; st.wiggles++; hit = true; }
      for (const s of specials) if (!s.got && Math.abs(s.x - wx) < 14 && wy > s.y - 60 && wy < s.y + 4) { s.wig = 0.8; hit = true; }
      if (hit) { g.sfx('wiggle'); g.particles.heart(wx, wy - 6); }
    }

    function drawArrow(ctx, bx, by) {
      let best = null, bd = 1e9;
      for (const s of specials) if (!s.got) { const d = Math.hypot(s.x - B.x, s.y - B.y); if (d < bd) { bd = d; best = s; } }
      if (!best || bd < 70) return;
      const a = Math.atan2(best.y - B.y, best.x - B.x), r = 62 + Math.sin(st.t * 6) * 3;
      const ax = bx + Math.cos(a) * r, ay = by - 22 + Math.sin(a) * r;
      ctx.save(); ctx.translate(Math.round(ax), Math.round(ay)); ctx.rotate(a);
      ctx.fillStyle = C.ink; ctx.fillRect(-6, -4, 12, 8); ctx.fillRect(6, -7, 4, 14); ctx.fillRect(10, -4, 3, 8);
      ctx.fillStyle = C.sun; ctx.fillRect(-5, -3, 10, 6); ctx.fillRect(5, -6, 3, 12); ctx.fillRect(8, -3, 3, 6);
      ctx.restore();
    }

    function draw(ctx) {
      const camX = Math.round(U.clamp(B.x - W / 2, 0, WW - W)), camY = Math.round(U.clamp(B.y - 20 - H / 2, 0, WH - H));
      st.camX = camX; st.camY = camY;
      ctx.drawImage(cv, camX, camY, W, H, 0, 0, W, H);
      // pond sparkles
      for (let i = 0; i < 6; i++) { const px = POND.x + Math.cos(i * 2.4 + Math.floor(st.t * 0.7 + i)) * 70 * ((i % 3 + 1) / 3), py = POND.y + Math.sin(i * 1.7 + Math.floor(st.t * 0.7 + i)) * 38 * ((i % 3 + 1) / 3); Art.sparkle(ctx, px - camX, py - camY, 1, st.t + i * 0.3, '#ffffff'); }
      // y-sorted objects
      const list = [];
      const vis = (x, y, pad) => x > camX - pad && x < camX + W + pad && y > camY - pad && y < camY + H + pad + 60;
      for (const t of trees) if (vis(t.x, t.y, 40)) list.push({ y: t.y, f: () => Art.tree(ctx, t.x - camX, t.y - camY + 2, 3, t.hue) });
      for (const s of signs) if (vis(s.x, s.y, 20)) list.push({ y: s.y, f: () => Art.signpost(ctx, s.x - camX, s.y - camY, 2) });
      list.push({ y: BENCH.y, f: () => { const x = BENCH.x - camX - 20, y = BENCH.y - camY; R(ctx, x, y - 16, 40, 6, '#c98450'); R(ctx, x, y - 8, 40, 6, '#a8683c'); R(ctx, x + 2, y - 2, 4, 8, C.brown2); R(ctx, x + 34, y - 2, 4, 8, C.brown2); R(ctx, x, y - 18, 4, 14, C.brown2); R(ctx, x + 36, y - 18, 4, 14, C.brown2); } });
      for (const f of fieldFlowers) if (vis(f.x, f.y, 24)) {
        const sw = Math.sin(st.t * 1.6 + f.ph) * 0.6 + (f.wig > 0 ? Math.sin(st.t * 30) * 1.6 * f.wig : 0);
        list.push({ y: f.y, f: () => Art.sunflower(ctx, Math.round(f.x - camX), Math.round(f.y - camY), 2, sw) });
      }
      for (const s of specials) if (!s.got && vis(s.x, s.y, 40)) {
        const near = Math.hypot(s.x - B.x, s.y - B.y) < 120 || st.hintOn > 0;
        const sw = Math.sin(st.t * 1.6 + s.ph) * 0.6 + (s.wig > 0 ? Math.sin(st.t * 30) * 1.6 * s.wig : 0);
        list.push({ y: s.y, f: () => {
          Art.sunflower(ctx, Math.round(s.x - camX), Math.round(s.y - camY), 3, sw, near, st.t);
          if (near) for (let i = 0; i < 3; i++) Art.sparkle(ctx, Math.round(s.x - camX + Math.cos(st.t * 2 + i * 2.1 + s.ph) * 22), Math.round(s.y - camY - 36 + Math.sin(st.t * 2.6 + i * 2.1) * 20), 1, st.t + i * 0.4);
        } });
      }
      const pose = st.state === 'celebrate' ? 'happy' : B.moving ? 'walk' : (B.wave > 0 ? 'wave' : 'idle');
      const hop = st.state === 'celebrate' ? Math.abs(Math.sin(st.cel * 6)) * 10 : 0;
      list.push({ y: B.y + 0.5, f: () => {
        ctx.fillStyle = 'rgba(40,70,30,.25)'; ctx.fillRect(Math.round(B.x - camX - 12), Math.round(B.y - camY - 2), 24, 4);
        BW.Bubs.draw(ctx, B.x - camX, B.y - camY - hop, { pose, frame: BW.Bubs.frame(pose, st.t), outfit: 'garden', scale: 2, flip: B.face < 0, expr: BW.Bubs.autoExpr(st.t) });
      } });
      list.sort((a, b) => a.y - b.y);
      for (const o of list) o.f();
      // critters on top
      wild.forEach((w) => Art.butterfly(ctx, Math.round(w.x - camX), Math.round(w.y - camY - 14), st.t + w.x, w.c, 1));
      flies.forEach((f, i) => Art.butterfly(ctx, Math.round(f.x - camX), Math.round(f.y - camY), st.t + i, f.c, 2));
      bees.forEach((b) => Art.bee(ctx, Math.round(b.cx + Math.cos(st.t * 2.4 + b.p) * 40 - camX), Math.round(b.cy + Math.sin(st.t * 3.1 + b.p) * 24 - 20 - camY), st.t));
      // sign text when close
      for (const s of signs) if (Math.hypot(s.x - B.x, s.y - B.y) < 42) Art.bubble(ctx, s.x - camX, s.y - camY - 30, s.text, { size: 6 });
      g.particles.draw(ctx, camX, camY);
      for (const f of st.floaters) Art.text(ctx, f.txt, f.x - camX, f.y - camY - f.t * 24, { size: 10, align: 'center', color: C.sun });
      if (st.hintOn > 0 || (st.hintT > 28 && st.state === 'play')) drawArrow(ctx, B.x - camX, B.y - camY);
      // cloud shadows
      ctx.save(); ctx.globalAlpha = 0.07;
      for (let i = 0; i < 3; i++) {
        const cx = (((i * 520 + st.t * 14) % 1700) + 1700) % 1700 - 250 - camX * 0.9, cy = 40 + i * 110 - camY * 0.9 + (i % 2) * 60;
        Art.cloud(ctx, Math.round(cx), Math.round(cy), 10, '#1c3a24', '#1c3a24');
      }
      ctx.restore();
      // HUD
      Art.panel(ctx, 8, 8, 132, 20);
      Art.sunflower(ctx, 24, 36, 1, 0);
      Art.text(ctx, st.found + '/7', 40, 13, { size: 8, color: C.ink, outline: false });
      for (let i = 0; i < 7; i++) { ctx.fillStyle = C.ink; ctx.fillRect(80 + i * 8, 14, 7, 8); ctx.fillStyle = i < st.found ? C.sun : '#d9c9a0'; ctx.fillRect(81 + i * 8, 15, 5, 6); }
      if (st.intro > 0) Art.bubble(ctx, W / 2, 66, 'Find 7 special sunflowers for Bubs ♡', { size: 7 });
      else if (st.saidT > 0 && st.said) Art.bubble(ctx, W / 2, 56, st.said, { size: 7 });
      else if (st.hintT > 28 && st.state === 'play') Art.bubble(ctx, W / 2, 56, 'Stuck? Look for sparkles ♡', { size: 7 });
    }
    return { update, draw, pointer, state: st, B, specials };
  }

  BW.Games.sunflower = {
    id: 'sunflower', emoji: '🌻', name: "Bubs' Sunflower Garden", desc: 'A peaceful stroll. Find the 7 special sunflowers.',
    hover: 'The sunflowers are waiting, Bubs! 🌻', outfit: 'garden', tapAction: null,
    intro: ['Walk with arrows / WASD', 'Find 7 special sunflowers (they sparkle when you are near)', 'Stuck? Press Z / J for a hint. Tap flowers to make them wiggle!'],
    touch: { left: [{ dpad: true }], right: [{ a: 'act', t: 'HINT', cls: 'green' }] },
    create
  };
})();
