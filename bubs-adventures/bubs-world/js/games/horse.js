/* Game 4 — Bubs Goes Horse Riding 🐎  (peaceful countryside gallop: fences, flowers, hearts, stars, speed boost) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art;
  const LEN = 6600;
  function terrain(x) {
    const k = Math.min(1, x / 300);
    return 205 + k * (Math.sin(x / 260) * 12 + Math.sin(x / 90 + 2) * 3 + Math.sin(x / 640) * 12);
  }
  function buildLevel() {
    const rnd = U.rng(23);
    const items = [], obstacles = [], decor = [];
    // fences & stumbling blocks to jump
    const kinds = ['fence', 'fence', 'bush', 'fence', 'rock', 'log'];
    const obsX = [];
    for (let x = 650; x < LEN - 350; x += 300 + Math.floor(rnd() * 170)) {
      const type = kinds[Math.floor(rnd() * kinds.length)];
      obstacles.push({ x, type }); obsX.push(x);
    }
    // collectibles: arcs over each obstacle (reward for jumping) + flower trails
    obsX.forEach((x, i) => {
      items.push({ x: x - 34, h: 32, type: 'flower' }, { x: x - 12, h: 62, type: 'heart' }, { x: x + 12, h: 70, type: 'heart' }, { x: x + 36, h: 54, type: 'flower' });
      if (i % 2 === 0) items.push({ x: x + 18, h: 98, type: 'star' });
    });
    for (let x = 420; x < LEN - 200; x += 260 + Math.floor(rnd() * 130)) {
      if (obsX.some((o) => Math.abs(o - x) < 130)) continue;
      const n = 4;
      for (let i = 0; i < n; i++) items.push({ x: x + i * 24, h: 18 + (i % 2) * 7, type: i % 2 ? 'heart' : 'flower' });
    }
    // stars for boost along the way
    for (let x = 1200; x < LEN - 300; x += 900) if (!obsX.some((o) => Math.abs(o - x) < 90)) items.push({ x, h: 40, type: 'star' });
    // countryside
    const cols = [C.pink2, '#fff3a0', C.purple, '#ff9aa8', '#ffffff'];
    for (let x = 40; x < LEN + 300; x += 40 + Math.floor(rnd() * 70)) {
      const r = rnd();
      if (r < 0.30) decor.push({ x, type: 'tree', s: 2 + (rnd() < 0.25 ? 1 : 0), hue: rnd() < 0.2 ? 'pink' : undefined });
      else if (r < 0.42) decor.push({ x, type: 'bush' });
      else if (r < 0.62) decor.push({ x, type: 'flowers', cols: [cols[Math.floor(rnd() * 5)], cols[Math.floor(rnd() * 5)]] });
      else if (r < 0.76) decor.push({ x, type: 'fence', w: 64 + Math.floor(rnd() * 4) * 16 });
      else if (r < 0.84) decor.push({ x, type: 'house' });
      else if (r < 0.90) decor.push({ x, type: 'haystack' });
      else decor.push({ x, type: 'sunflower' });
    }
    return { items, obstacles, decor };
  }
  const SKY = ['#9ad8f2', '#aee0f5', '#c2e8f8', '#d6eefa', '#e8f5fb', '#f6faf6', '#fff4e0'];
  const CLOUDS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x: i * 170, y: 10 + ((i * 53) % 80), s: 2 + (i % 3 === 0 ? 1 : 0) }));
  function drawSky(ctx, camX, t, W, H) {
    Art.skyBands(ctx, W, 200, SKY);
    ctx.fillStyle = '#fff4e0'; ctx.fillRect(0, 196, W, H);
    for (const c of CLOUDS) {
      const x = (((c.x - camX * 0.08 - t * 4) % 1360) + 1360) % 1360 - 140;
      Art.cloud(ctx, Math.round(x), c.y, c.s);
    }
    for (let i = 0; i < 6; i++) {
      const x = (((i * 310 - camX * 0.14) % 1860) + 1860) % 1860 - 220;
      Art.mountain(ctx, x, 190, 230 + (i % 2) * 70, 100 + (i % 3) * 20, '#a9b9e4', true);
    }
    Art.hills(ctx, camX, W, H, 208, 44, 95, '#b9e2b0', 0.25, 2);
    Art.hills(ctx, camX, W, H, 222, 34, 62, '#9ccf8f', 0.45, 5);
    // distant little farm houses
    for (let i = 0; i < 4; i++) {
      const x = (((i * 520 - camX * 0.3) % 2080) + 2080) % 2080 - 100;
      Art.house(ctx, Math.round(x), 218 + Math.round(Math.sin(i * 2) * 4), 1);
    }
    for (let i = 0; i < 4; i++) {
      const bx = (((i * 380 - t * 34 - camX * 0.25) % 1500) + 1500) % 1500 - 120;
      Art.bird(ctx, Math.round(bx), 36 + i * 18 + Math.round(Math.sin(t * 2 + i) * 3), t + i, 2);
    }
    // butterflies floating across the field
    for (let i = 0; i < 3; i++) {
      const bx = (((i * 410 + t * 14 - camX * 0.6) % 1300) + 1300) % 1300 - 80;
      Art.butterfly(ctx, Math.round(bx), 160 + Math.round(Math.sin(t * 3 + i * 2) * 10) + i * 8, t + i, [C.pink2, C.sun, C.purple][i], 1);
    }
  }
  const lvl = buildLevel();
  BW.Games.horse = {
    id: 'horse', emoji: '🐎', name: 'Bubs Goes Horse Riding', desc: 'Gallop through the countryside and hop over the fences.',
    hover: 'Giddy up, Bubs! 🐎', outfit: 'riding',
    intro: ['The horse gallops by itself — → to go faster, ← to slow', 'SPACE or ↑ to jump fences', 'Collect ★ to fill BOOST, then hold ↓ / SHIFT'],
    touch: { left: [{ a: 'left', t: '◀' }, { a: 'right', t: '▶' }], right: [{ a: 'down', t: 'BOOST', cls: 'green' }, { a: 'jump', t: 'JUMP', cls: 'wide sun' }] },
    create(g) {
      return BW.Side.make(g, {
        id: 'horse', len: LEN, startX: 60, seed: 23, vehicle: 'horse', boost: true,
        terrain, drawSky,
        ground: { top: '#9bd47a', mid: '#6fb85d', dirt: '#b98d58', dirt2: '#a47a48' },
        physics: { gravity: 780, jumpV: 290, maxV: 190, minV: 55, cruise: 112, accel: 130, brake: 180, coast: 0, slope: 0, boostV: 285 },
        items: lvl.items, obstacles: lvl.obstacles, decor: lvl.decor,
        checkpoints: [Math.round(LEN / 3), Math.round(LEN * 2 / 3)],
        hud: ['flower', 'heart', 'star'],
        startSay: 'Giddy up! 🐎', hitText: 'Whoa!',
        finishSay: "What a lovely ride! ♡", finishBanner: 'SWEET COUNTRYSIDE!',
        finishTitle: "Bubs' little countryside adventure ♡", finishMessage: 'The horse thinks you are the best rider in the whole meadow.',
        stats: (S) => [['FLOWERS', S.counts.flower], ['HEARTS', S.counts.heart], ['STARS', S.counts.star], ['SCORE', S.score]]
      });
    }
  };
})();
