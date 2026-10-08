/* Game 1 — Bubs Goes Riding 🏍️  (side-scrolling motorbike, ramps, hearts/stars/sunflowers, checkpoints) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art;
  const LEN = 7200;
  const RAMPS = [
    { x: 950, w: 80, h: 38 }, { x: 2050, w: 90, h: 44 }, { x: 3300, w: 80, h: 36 },
    { x: 4450, w: 100, h: 48 }, { x: 5700, w: 90, h: 42 }, { x: 6600, w: 70, h: 34 }
  ];
  function base(x) {
    const k = Math.min(1, x / 420);
    return 200 + k * (Math.sin(x / 190) * 13 + Math.sin(x / 67 + 1) * 3.5 + Math.sin(x / 460) * 16);
  }
  function terrain(x) {
    let y = base(x);
    for (const r of RAMPS) {
      const d = x - r.x;
      if (d > 0 && d < r.w) y -= r.h * (d / r.w);
      else if (d >= r.w && d < r.w + 14) y -= r.h * (1 - (d - r.w) / 14);
    }
    return y;
  }
  function nearRamp(x, before, after) { return RAMPS.some((r) => x > r.x - before && x < r.x + r.w + after); }

  function buildLevel() {
    const rnd = U.rng(11);
    const items = [], obstacles = [], decor = [];
    // hearts in little arcs
    for (let x = 300; x < LEN - 200; x += 210 + Math.floor(rnd() * 90)) {
      if (nearRamp(x, 60, 40)) continue;
      const n = 3 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) items.push({ x: x + i * 26, h: 24 + Math.sin(i / (n - 1) * Math.PI) * 22, type: 'heart' });
    }
    // stars above each ramp (reach them by launching!)
    RAMPS.forEach((r) => {
      const x = r.x + r.w + 24;
      items.push({ x: x, h: 70, type: 'star' }, { x: x + 40, h: 92, type: 'star' }, { x: x + 80, h: 76, type: 'star' });
      items.push({ x: r.x + r.w * 0.5, h: 54, type: 'heart' });
    });
    // sunflowers on the ground
    for (let x = 520; x < LEN - 200; x += 420 + Math.floor(rnd() * 160)) {
      if (nearRamp(x, 80, 60)) continue;
      for (let i = 0; i < 3; i++) items.push({ x: x + i * 22, h: 12, type: 'sunflower' });
    }
    // obstacles
    const kinds = ['rock', 'log', 'cone', 'rock', 'bush'];
    for (let x = 620; x < LEN - 300; x += 330 + Math.floor(rnd() * 200)) {
      if (nearRamp(x, 50, 150)) continue;
      obstacles.push({ x, type: kinds[Math.floor(rnd() * kinds.length)] });
    }
    // scenery
    const cols = [C.pink2, '#fff3a0', C.purple, '#ff9aa8'];
    for (let x = 60; x < LEN + 300; x += 38 + Math.floor(rnd() * 70)) {
      const r = rnd();
      if (r < 0.34) decor.push({ x, type: 'tree', s: 2 + (rnd() < 0.3 ? 1 : 0), hue: rnd() < 0.18 ? 'pink' : undefined });
      else if (r < 0.52) decor.push({ x, type: 'bush' });
      else if (r < 0.74) decor.push({ x, type: 'flowers', cols: [cols[Math.floor(rnd() * 4)], cols[Math.floor(rnd() * 4)]] });
      else if (r < 0.80) decor.push({ x, type: 'sign' });
      else if (r < 0.86) decor.push({ x, type: 'lamp' });
      else if (r < 0.92) decor.push({ x, type: 'mushroom' });
      else decor.push({ x, type: 'sunflower' });
    }
    return { items, obstacles, decor };
  }

  const SKY = ['#8fd3f0', '#a0daf3', '#b3e2f6', '#c7eaf9', '#dcf2fb', '#eef8f9', '#fdf1dc'];
  const CLOUDS = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ x: i * 200, y: 14 + ((i * 41) % 70), s: 2 + (i % 2) }));
  function drawSky(ctx, camX, t, W, H) {
    Art.skyBands(ctx, W, 200, SKY);
    ctx.fillStyle = '#fdf1dc'; ctx.fillRect(0, 196, W, H);
    Art.sun(ctx, 410, 52, 3);
    for (const c of CLOUDS) {
      const x = (((c.x - camX * 0.1 - t * 5) % 1400) + 1400) % 1400 - 140;
      Art.cloud(ctx, Math.round(x), c.y, c.s);
    }
    for (let i = 0; i < 6; i++) {
      const x = (((i * 300 - camX * 0.16) % 1800) + 1800) % 1800 - 200;
      Art.mountain(ctx, x, 196, 190 + (i % 3) * 40, 80 + (i % 3) * 22, '#b6c3ea', true);
    }
    Art.hills(ctx, camX, W, H, 214, 36, 80, '#b5e0ae', 0.3, 1);
    Art.hills(ctx, camX, W, H, 226, 30, 55, '#9ccf8f', 0.5, 4);
    for (let i = 0; i < 3; i++) {
      const bx = (((i * 420 - t * 38 - camX * 0.3) % 1300) + 1300) % 1300 - 120;
      Art.bird(ctx, Math.round(bx), 40 + i * 22 + Math.round(Math.sin(t * 2 + i) * 3), t + i, 2);
    }
  }

  const lvl = buildLevel();
  BW.Games.riding = {
    id: 'riding', emoji: '🏍️', name: 'Bubs Goes Riding', desc: 'Zoom over ramps, grab hearts & stars, reach the finish!',
    hover: "Ready, Bubs? Let's ride! 🏍️", outfit: 'riding',
    intro: ['Hold → / D to ride, ← / A to brake', 'SPACE or ↑ to jump (ramps = big air!)', 'Grab ♥ ★ 🌻, dodge rocks & logs'],
    touch: { left: [{ a: 'left', t: '◀' }, { a: 'right', t: '▶' }], right: [{ a: 'jump', t: 'JUMP', cls: 'wide sun' }] },
    create(g) {
      return BW.Side.make(g, {
        id: 'riding', len: LEN, startX: 60, seed: 11, vehicle: 'bike',
        terrain, drawSky,
        ground: { top: '#8fd3a0', mid: '#5fa05a', dirt: '#c9985a', dirt2: '#b5834a' },
        groundOverride: (x) => (RAMPS.some((r) => x > r.x && x < r.x + r.w + 2) ? { top: '#e8b878', mid: '#b5834a' } : null),
        physics: { gravity: 720, jumpV: 250, maxV: 215, minV: -40, cruise: null, accel: 150, brake: 340, coast: 60, slope: 150, boostV: 215 },
        items: lvl.items, obstacles: lvl.obstacles, decor: lvl.decor,
        checkpoints: [Math.round(LEN / 3), Math.round(LEN * 2 / 3)],
        hud: ['heart', 'star', 'sunflower'],
        startSay: "Let's ride! →", hitText: 'Oof!',
        finishSay: 'Bubs made it! ♡', finishBanner: 'BUBS MADE IT!',
        finishTitle: 'Bubs made it! ♡', finishMessage: 'What a ride! The finish line was lucky to have you.',
        stats: (S) => [['HEARTS', S.counts.heart], ['STARS', S.counts.star], ['SUNFLOWERS', S.counts.sunflower], ['SCORE', S.score]]
      });
    }
  };
})();
