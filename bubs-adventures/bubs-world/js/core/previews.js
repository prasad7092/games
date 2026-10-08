/* Bubs' World — animated mini-scenes for the game-board cards (240x135) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art, R = U.R;
  const W = 240, H = 135;
  const SKY = ['#8fd3f0', '#a3dcf4', '#b8e5f7', '#cdeefa', '#e1f5fc', '#f4fbf8', '#fdf0dd'];
  const parts = {};
  const P = (id) => (parts[id] = parts[id] || new BW.Particles());
  const clouds = (ctx, t, n) => { for (let i = 0; i < n; i++) Art.cloud(ctx, Math.round((((i * 110 - t * (6 + i * 2)) % 330) + 330) % 330 - 60), 8 + i * 18, 2); };
  const ground = (ctx, y, t, speed, top, mid, dirt) => {
    R(ctx, 0, y, W, 3, top); R(ctx, 0, y + 3, W, 5, mid); R(ctx, 0, y + 8, W, H, dirt);
    for (let x = -((t * speed) % 24); x < W; x += 24) R(ctx, Math.round(x), y + 14, 8, 2, 'rgba(0,0,0,.12)');
  };

  const Previews = (BW.Previews = {});

  Previews.riding = function (ctx, t, hover) {
    Art.skyBands(ctx, W, 108, SKY); R(ctx, 0, 100, W, 40, '#fdf0dd');
    Art.sun(ctx, 196, 30, 2);
    clouds(ctx, t, 3);
    for (let i = 0; i < 4; i++) Art.mountain(ctx, (((i * 90 - t * 6) % 360) + 360) % 360 - 40, 100, 110, 50 + (i % 2) * 14, '#b6c3ea', true);
    Art.hills(ctx, t * 14, W, H, 108, 18, 60, '#a8d9a0', 0.5, 1);
    ground(ctx, 106, t, hover ? 150 : 80, '#8fd3a0', '#5fa05a', '#c9985a');
    const sp = hover ? 150 : 80;
    for (let i = 0; i < 5; i++) {
      const x = (((i * 64 - t * sp) % 320) + 320) % 320 - 30;
      if (i % 2) Art.tree(ctx, Math.round(x), 108, 2); else Art.flower(ctx, Math.round(x), 110, [C.pink2, '#fff3a0', C.purple][i % 3], 2, Math.sin(t * 3 + i) * 0.6);
    }
    const hop = hover ? Math.max(0, Math.sin(t * 5)) * 14 : 0;
    BW.Vehicles.bike.draw(ctx, 96, 108 - hop, 2, { wheel: t * 12, angle: hover ? -Math.sin(t * 5) * 0.12 : 0, expr: BW.Bubs.autoExpr(t, hover ? 'open' : undefined) });
    const pp = P('riding');
    if (hover && Math.random() < 0.18) pp.heart(96 + U.rand(-10, 10), 70);
    for (let i = 0; i < 3; i++) Art.heart(ctx, (((i * 90 - t * sp * 0.9 + 190) % 300) + 300) % 300 + 20 - 20, 66 + Math.round(Math.sin(t * 3 + i) * 4) + i * 4, 2);
    pp.draw(ctx);
  };

  Previews.sunflower = function (ctx, t, hover) {
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) R(ctx, x, y, 16, 16, ((x + y) / 16) % 2 ? '#9ad36f' : '#93cf69');
    R(ctx, 0, 100, W, 16, '#ecd09a'); R(ctx, 0, 104, W, 8, '#dcbd86');
    clouds(ctx, t, 0);
    const sp = hover ? 38 : 18;
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const x = (((i * 34 + row * 17 - t * sp) % 306) + 306) % 306 - 30, y = row ? 56 : 38;
      Art.sunflower(ctx, Math.round(x), y, 2, Math.sin(t * 1.6 + i + row) * 0.7);
    }
    for (let i = 0; i < 8; i++) Art.sunflower(ctx, Math.round((((i * 40 - t * sp * 1.4) % 320) + 320) % 320 - 30), 132, 3, Math.sin(t * 1.4 + i) * 0.7);
    BW.Bubs.draw(ctx, 120, 118, { pose: hover ? 'wave' : 'walk', frame: BW.Bubs.frame(hover ? 'wave' : 'walk', t), outfit: 'garden', scale: 2, expr: BW.Bubs.autoExpr(t, 'smile') });
    for (let i = 0; i < 3; i++) Art.butterfly(ctx, Math.round(120 + Math.cos(t * 1.4 + i * 2.1) * 34), Math.round(52 + Math.sin(t * 1.9 + i * 2.1) * 10), t + i, [C.pink2, C.sun, C.purple][i], 2);
    const pp = P('sunflower'); if (hover && Math.random() < 0.12) pp.heart(120 + U.rand(-14, 14), 70);
    pp.draw(ctx);
  };

  Previews.bungee = function (ctx, t, hover) {
    Art.skyBands(ctx, W, H, ['#6fc3ee', '#8fd3f2', '#a8dcf5', '#bde8f8', '#d4effa', '#e8f5fa', '#f6e8d4']);
    clouds(ctx, t, 4);
    for (let i = 0; i < 5; i++) Art.mountain(ctx, 20 + i * 60, 140, 110, 52 + (i % 2) * 14, '#a9b8e2', true);
    R(ctx, 0, 126, W, 12, '#8fc96b');
    for (let i = 0; i < 6; i++) Art.tree(ctx, 12 + i * 44, 130, 2, i % 3 === 0 ? 'pink' : undefined);
    // cliff + platform
    for (let y = 0; y < H; y += 8) for (let x = 0; x < 66; x += 8) R(ctx, x, y, 8, 8, (((x * 7) ^ (y * 13)) % 3) ? '#8d7a8f' : '#9d8a9d');
    R(ctx, 0, 0, 66, 6, '#8fc96b'); R(ctx, 50, 18, 70, 6, '#c98450'); R(ctx, 50, 18, 70, 2, '#e0a56c');
    const ax = 116, ay = 24;
    const cyc = Math.sin(t * (hover ? 3.2 : 2.0));
    const by = 74 + cyc * 36;
    // rope
    ctx.fillStyle = '#f2a0b5';
    const steps = 40;
    for (let i = 0; i < steps; i++) { const k = i / steps; ctx.fillRect(Math.round(ax + (118 - ax) * k), Math.round(ay + (by - 14 - ay) * k), 2, 3); }
    BW.Bubs.draw(ctx, 118, Math.round(by), { pose: cyc > 0 ? 'fall' : 'happy', outfit: 'bungee', scale: 2, expr: cyc > 0 ? 'surprised' : 'open' });
    R(ctx, 112, Math.round(by) - 17, 12, 3, C.ink); R(ctx, 113, Math.round(by) - 16, 10, 1, C.pink2);
    for (let i = 0; i < 3; i++) Art.bird(ctx, Math.round((((i * 90 + t * 24) % 300) + 300) % 300 - 30), 20 + i * 24, t + i, 2);
    const pp = P('bungee'); if (hover && Math.abs(cyc) > 0.96 && Math.random() < 0.3) pp.heart(118 + U.rand(-10, 10), by - 30);
    pp.draw(ctx);
  };

  Previews.horse = function (ctx, t, hover) {
    Art.skyBands(ctx, W, 108, SKY); R(ctx, 0, 100, W, 40, '#fff4e0');
    clouds(ctx, t, 3);
    for (let i = 0; i < 4; i++) Art.mountain(ctx, (((i * 100 - t * 5) % 400) + 400) % 400 - 50, 98, 130, 56 + (i % 2) * 14, '#a9b9e4', true);
    Art.hills(ctx, t * 12, W, H, 104, 20, 70, '#b9e2b0', 0.5, 2);
    const sp = hover ? 120 : 64;
    ground(ctx, 108, t, sp, '#9bd47a', '#6fb85d', '#b98d58');
    for (let i = 0; i < 4; i++) {
      const x = (((i * 90 - t * sp * 0.8) % 360) + 360) % 360 - 60;
      if (i % 2) Art.house(ctx, Math.round(x), 106, 2); else Art.tree(ctx, Math.round(x), 106, 2, 'pink');
    }
    const fx = (((-t * sp) % 150) + 150) % 150;
    Art.fence(ctx, Math.round(fx + 160), 112, 60, 2);
    const jump = hover ? Math.max(0, Math.sin(t * 4)) * 18 : 0;
    BW.Vehicles.horse.draw(ctx, 104, 110 - jump, 2, { phase: t * (hover ? 14 : 9), speed: hover ? 1 : 0.7, bob: Math.abs(Math.sin(t * 9)), t, expr: BW.Bubs.autoExpr(t, 'smile') });
    for (let i = 0; i < 3; i++) Art.flower(ctx, Math.round((((i * 80 - t * sp) % 260) + 260) % 260 - 10), 116, [C.pink2, '#fff', C.purple][i], 2, 0);
    const pp = P('horse'); if (hover && Math.random() < 0.15) pp.heart(104 + U.rand(-10, 10), 56);
    pp.draw(ctx);
  };

  Previews.badminton = function (ctx, t, hover) {
    Art.skyBands(ctx, W, 108, SKY); R(ctx, 0, 100, W, 40, '#8fc96b');
    clouds(ctx, t, 2);
    for (let i = 0; i < 5; i++) Art.tree(ctx, 20 + i * 52, 98, 2, i % 2 ? 'pink' : undefined);
    R(ctx, 8, 108, W - 16, 27, '#7cc6a4'); R(ctx, 8, 108, W - 16, 2, '#fff'); R(ctx, 8, 133, W - 16, 2, '#fff'); R(ctx, 8, 108, 2, 27, '#fff'); R(ctx, W - 10, 108, 2, 27, '#fff');
    R(ctx, 118, 70, 4, 40, C.brown2); R(ctx, 108, 76, 24, 1, 'rgba(255,255,255,.6)'); R(ctx, 108, 70, 24, 3, '#fff');
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let y = 78; y < 108; y += 5) ctx.fillRect(108, y, 24, 1); for (let x = 108; x <= 132; x += 5) ctx.fillRect(x, 76, 1, 32);
    const T = hover ? 1.4 : 2.2, k = (t % T) / T, dir = Math.floor(t / T) % 2 ? -1 : 1;
    const swingP = k < 0.2 ? k / 0.2 : -1;
    const bx = U.lerp(dir > 0 ? 40 : 200, dir > 0 ? 200 : 40, k), by = 100 - Math.sin(k * Math.PI) * 54 - 6;
    BW.Bubs.draw(ctx, 52, 112, { pose: dir > 0 && swingP >= 0 ? 'swing' : 'ready', p: Math.max(0, swingP), outfit: 'badminton', scale: 2, expr: BW.Bubs.autoExpr(t, 'smile') });
    if (BW.Mochi) {
      const sp = BW.Mochi(dir < 0 && k < 0.2 ? 'happy' : 'normal');
      ctx.save(); ctx.translate(190, 112); ctx.scale(-1, 1); ctx.imageSmoothingEnabled = false; ctx.drawImage(sp, -26, -48, sp.width * 2, sp.height * 2); ctx.restore();
      ctx.save(); ctx.translate(190, 112); Art.racket(ctx, -6, -9, Math.PI + 1.0, 2, '#f6a5b1'); ctx.restore();
    }
    Art.shuttle(ctx, bx, by, Math.atan2(Math.cos(k * Math.PI) * -1 * dir * 0 + (k < 0.5 ? -1 : 1) * 0.6, dir), 1.5);
    const pp = P('badminton'); if (hover && Math.random() < 0.12) pp.heart(120 + U.rand(-30, 30), 50);
    pp.draw(ctx);
  };

  Previews.W = W; Previews.H = H;
  Previews.tick = function (dt) { for (const k in parts) parts[k].update(dt); };
})();
