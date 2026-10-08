/* Bubs' World — shared pixel-art helpers (scenery, collectibles, text, particles) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, R = U.R;
  const Art = (BW.Art = {});
  const FONT = '"Press Start 2P", "Courier New", monospace';
  Art.FONT = FONT;

  /* ---- pattern sprites: rows of chars, palette map ---- */
  Art.pat = function (ctx, rows, pal, x, y, s) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.' || ch === ' ') continue;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(Math.round(x + c * s), Math.round(y + r * s), s, s);
      }
    }
  };
  Art.patOutlined = function (ctx, rows, pal, x, y, s, ink) {
    const op = {};
    for (const k in pal) op[k] = ink || C.ink;
    for (const d of [[-1, 0], [1, 0], [0, -1], [0, 1]]) Art.pat(ctx, rows, op, x + d[0] * s, y + d[1] * s, s);
    Art.pat(ctx, rows, pal, x, y, s);
  };

  const HEART = ['.rr.rr.', 'rhrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
  const STAR = ['...y...', '...y...', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', '.y...y.'];
  const STAR5 = ['...y...', '..yhy..', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.'];

  /** (x,y) = centre. */
  Art.heart = function (ctx, x, y, s, col, noOutline) {
    s = s || 2;
    const px = x - 3.5 * s, py = y - 3 * s;
    const pal = { r: col || C.heart, h: '#ffd0da' };
    if (noOutline) Art.pat(ctx, HEART, pal, px, py, s);
    else Art.patOutlined(ctx, HEART, pal, px, py, s);
  };
  Art.star = function (ctx, x, y, s, col, noOutline) {
    s = s || 2;
    const px = x - 3.5 * s, py = y - 3 * s;
    const pal = { y: col || C.sun, h: '#fff7c8' };
    if (noOutline) Art.pat(ctx, STAR5, pal, px, py, s);
    else Art.patOutlined(ctx, STAR5, pal, px, py, s);
  };
  Art.sparkle = function (ctx, x, y, s, t, col) {
    const k = Math.floor(((t * 6) % 4));
    const sz = [1, 2, 1, 0][k] * s;
    if (sz <= 0) return;
    ctx.fillStyle = col || '#fffbe0';
    ctx.fillRect(Math.round(x - s / 2), Math.round(y - sz - s / 2), s, sz * 2 + s);
    ctx.fillRect(Math.round(x - sz - s / 2), Math.round(y - s / 2), sz * 2 + s, s);
  };

  /* ---- text ---- */
  Art.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.font = (o.size || 8) + 'px ' + FONT;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'top';
    if (o.outline !== false) {
      ctx.fillStyle = o.outlineColor || C.ink;
      const d = o.size && o.size > 10 ? 2 : 1;
      for (const p of [[-d, 0], [d, 0], [0, -d], [0, d], [d, d]]) ctx.fillText(str, x + p[0], y + p[1]);
    }
    ctx.fillStyle = o.color || C.white;
    ctx.fillText(str, x, y);
  };
  Art.textWidth = function (ctx, str, size) {
    ctx.font = (size || 8) + 'px ' + FONT;
    return ctx.measureText(str).width;
  };
  Art.panel = function (ctx, x, y, w, h, fill) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = C.ink; ctx.fillRect(x - 2, y, w + 4, h); ctx.fillRect(x, y - 2, w, h + 4);
    ctx.fillStyle = fill || C.cream; ctx.fillRect(x, y, w, h);
  };
  Art.bubble = function (ctx, x, y, str, o) {
    o = o || {};
    const size = o.size || 7;
    const w = Math.ceil(Art.textWidth(ctx, str, size)) + 10, h = size + 10;
    const bx = Math.round(x - w / 2), by = Math.round(y - h);
    Art.panel(ctx, bx, by, w, h, '#fff');
    ctx.fillStyle = C.ink; ctx.fillRect(Math.round(x) - 2, by + h + 1, 4, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x) - 2, by + h - 1, 4, 2);
    Art.text(ctx, str, bx + 5, by + 5, { size, color: C.ink, outline: false });
  };

  /* ---- sky & clouds & far scenery ---- */
  Art.skyBands = function (ctx, W, H, colors) {
    const bh = Math.ceil(H / colors.length);
    for (let i = 0; i < colors.length; i++) { ctx.fillStyle = colors[i]; ctx.fillRect(0, i * bh, W, bh + 1); }
  };
  const CLOUD = [
    '.....wwww.......', '...wwwwwwww.ww..', '..wwwwwwwwwwwww.', '.wwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', '.ssssssssssssss.'
  ];
  Art.cloud = function (ctx, x, y, s, white, shade) {
    Art.pat(ctx, CLOUD, { w: white || '#ffffff', s: shade || '#d7ecf7' }, x, y, s);
  };
  Art.sun = function (ctx, x, y, s) {
    ctx.fillStyle = '#ffe9a0';
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const d = dx * dx + dy * dy;
      if (d <= 36) { ctx.fillStyle = d <= 20 ? '#fff4c0' : '#ffe48a'; ctx.fillRect(x + dx * s, y + dy * s, s, s); }
    }
  };
  Art.mountain = function (ctx, cx, baseY, w, h, col, snow, rowH) {
    rowH = rowH || 3;
    const rows = Math.ceil(h / rowH);
    for (let i = 0; i < rows; i++) {
      const half = ((i + 1) / rows) * (w / 2);
      const y = baseY - h + i * rowH;
      ctx.fillStyle = (snow && i < rows * 0.22) ? '#ffffff' : col;
      ctx.fillRect(Math.round(cx - half), Math.round(y), Math.round(half * 2), rowH + 1);
    }
  };
  /** chunky rolling hills layer, parallax-aware */
  Art.hills = function (ctx, camX, W, H, baseY, amp, wl, col, par, seed) {
    ctx.fillStyle = col;
    const off = camX * par;
    for (let x = 0; x < W; x += 4) {
      const wx = x + off;
      const y = baseY - amp * (Math.sin(wx / wl + (seed || 0)) * 0.6 + Math.sin(wx / (wl * 0.43) + (seed || 0) * 2) * 0.4 + 1) / 2;
      ctx.fillRect(x, Math.round(y / 2) * 2, 4, H);
    }
  };
  const BIRD = [['x.x', '.x.'], ['...', 'xxx']];
  Art.bird = function (ctx, x, y, t, s, col) {
    s = s || 2;
    Art.pat(ctx, [ ['x...x', '.x.x.', '..x..'], ['.x.x.', 'x...x', '.....'] ][Math.floor(t * 5) % 2], { x: col || C.ink2 }, x, y, s);
  };
  Art.butterfly = function (ctx, x, y, t, col, s) {
    s = s || 1;
    const f = Math.floor(t * 8) % 2;
    ctx.fillStyle = col || C.pink2;
    if (f) { ctx.fillRect(x - 3 * s, y - 2 * s, 3 * s, 3 * s); ctx.fillRect(x + s, y - 2 * s, 3 * s, 3 * s); }
    else { ctx.fillRect(x - 2 * s, y - s, 2 * s, 2 * s); ctx.fillRect(x + s, y - s, 2 * s, 2 * s); }
    ctx.fillStyle = C.ink; ctx.fillRect(x, y - s, s, 3 * s);
  };
  Art.bee = function (ctx, x, y, t) {
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(x - 2, y - 1, 4, 3);
    ctx.fillStyle = C.ink; ctx.fillRect(x - 1, y - 1, 1, 3); ctx.fillRect(x + 1, y - 1, 1, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 3 + (Math.floor(t * 20) % 2), 3, 1);
  };

  /* ---- plants ---- */
  const TREE = [
    '...dddddd...', '.ddgggggggd.', 'dgGGgggggggd', 'dgGggggggggd', 'dggggggggggd', 'dgggggggdggd', '.dgggggggdd.', '..dddddddd..'
  ];
  Art.tree = function (ctx, x, baseY, s, hue) {
    s = s || 2;
    const pal = hue === 'pink' ? { d: '#c8607f', g: '#f4a6bd', G: '#ffd3df' }
      : hue === 'autumn' ? { d: '#c27a2c', g: '#efb33f', G: '#ffd97a' }
      : { d: '#3f7d4f', g: '#6fb85d', G: '#9ad779' };
    R(ctx, x - s, baseY - 5 * s, 2 * s, 5 * s, C.brown2);
    R(ctx, x, baseY - 5 * s, s, 5 * s, C.brown);
    Art.pat(ctx, TREE, pal, x - 6 * s, baseY - 12 * s, s);
  };
  const BUSH = ['..dddd..', '.dgggGd.', 'dggggggd', 'dgGgggdd', '.dddddd.'];
  Art.bush = function (ctx, x, baseY, s) {
    s = s || 2;
    Art.pat(ctx, BUSH, { d: '#3f7d4f', g: '#6fb85d', G: '#9ad779' }, x - 4 * s, baseY - 5 * s, s);
  };
  Art.flower = function (ctx, x, baseY, col, s, sway) {
    s = s || 2;
    const sw = Math.round((sway || 0) * s);
    R(ctx, x, baseY - 3 * s, s, 3 * s, C.green2);
    ctx.fillStyle = col || C.pink2;
    ctx.fillRect(x + sw - s, baseY - 4 * s, s, s); ctx.fillRect(x + sw + s, baseY - 4 * s, s, s);
    ctx.fillRect(x + sw, baseY - 5 * s, s, s); ctx.fillRect(x + sw, baseY - 3 * s, s, s);
    ctx.fillStyle = '#fff3a0'; ctx.fillRect(x + sw, baseY - 4 * s, s, s);
    if (sw) ctx.fillStyle = C.green2;
  };
  const SUNF = [
    '..y.y.y..', '.yyyyyyy.', 'yyybbbyyy', '.ybbbbby.', 'yybbBbbyy', '.ybbbbby.', 'yyybbbyyy', '.yyyyyyy.', '..y.y.y..'
  ];
  /** (x,baseY) = ground point. */
  Art.sunflower = function (ctx, x, baseY, s, sway, glow, t) {
    s = s || 2;
    const h = 11 * s, sw = (sway || 0);
    for (let i = 0; i < h; i += s) {
      const ox = Math.round(sw * s * (i / h));
      R(ctx, x + ox, baseY - i - s, s, s, C.green2);
    }
    R(ctx, x - s, baseY - 4 * s, s, s, C.green); R(ctx, x - 2 * s, baseY - 5 * s, s, s, C.green);
    R(ctx, x + s, baseY - 3 * s, s, s, C.green); R(ctx, x + 2 * s, baseY - 4 * s, s, s, C.green);
    const hx = x + Math.round(sw * s) - 4 * s, hy = baseY - h - 8 * s;
    if (glow) {
      ctx.save(); ctx.globalAlpha = 0.28 + 0.12 * Math.sin((t || 0) * 5);
      ctx.fillStyle = '#fff3a0';
      const cx = hx + 4.5 * s, cy = hy + 4.5 * s, r = 8 * s;
      for (let dy = -r; dy <= r; dy += s) for (let dx = -r; dx <= r; dx += s) if (dx * dx + dy * dy < r * r) ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), s, s);
      ctx.restore();
    }
    Art.pat(ctx, SUNF, { y: C.sun, b: '#7a4a2a', B: '#a8683c' }, hx, hy, s);
  };
  Art.house = function (ctx, x, baseY, s) {
    s = s || 2;
    R(ctx, x, baseY - 12 * s, 14 * s, 12 * s, '#fff1d0');
    R(ctx, x, baseY - 2 * s, 14 * s, 2 * s, '#e8cf9f');
    for (let i = 0; i < 6; i++) R(ctx, x - (1 + i) * s + 0, baseY - 12 * s - (i + 1) * s * 1, (16 + 2 * i) * s - 2 * i * s * 0, s, i % 2 ? '#e8647c' : '#f08ba0');
    R(ctx, x - s, baseY - 13 * s, 16 * s, s, '#d6506a');
    R(ctx, x + 2 * s, baseY - 8 * s, 4 * s, 8 * s, C.brown);
    R(ctx, x + 5 * s, baseY - 4 * s, s, s, C.sun);
    R(ctx, x + 8 * s, baseY - 9 * s, 4 * s, 4 * s, '#9ad8f0');
    R(ctx, x + 10 * s, baseY - 9 * s, s, 4 * s, '#fff1d0'); R(ctx, x + 8 * s, baseY - 7 * s, 4 * s, s, '#fff1d0');
    R(ctx, x + 11 * s, baseY - 17 * s, 2 * s, 4 * s, '#b08a6a');
  };
  Art.fence = function (ctx, x, baseY, w, s) {
    s = s || 2;
    R(ctx, x, baseY - 7 * s, w, s, C.brown); R(ctx, x, baseY - 4 * s, w, s, C.brown);
    for (let px = 0; px <= w - 2 * s; px += 8 * s) { R(ctx, x + px, baseY - 9 * s, 2 * s, 9 * s, '#a8683c'); R(ctx, x + px, baseY - 9 * s, s, 9 * s, '#c98450'); }
  };
  Art.signpost = function (ctx, x, baseY, s) {
    s = s || 2;
    R(ctx, x, baseY - 10 * s, 2 * s, 10 * s, C.brown2);
    R(ctx, x - 5 * s, baseY - 13 * s, 12 * s, 6 * s, '#d9a066');
    R(ctx, x - 5 * s, baseY - 13 * s, 12 * s, s, '#f0c48a');
    R(ctx, x - 3 * s, baseY - 11 * s, 8 * s, s, C.brown2); R(ctx, x - 3 * s, baseY - 9 * s, 6 * s, s, C.brown2);
  };
  Art.rock = function (ctx, x, baseY, s) {
    s = s || 2;
    Art.pat(ctx, ['..ggg..', '.ggggg.', 'ggghggg', 'ddddddd'], { g: '#a7a3b5', h: '#cfcbdc', d: '#7d7990' }, x - 3.5 * s, baseY - 4 * s, s);
  };
  Art.log = function (ctx, x, baseY, s) {
    s = s || 2;
    R(ctx, x - 6 * s, baseY - 5 * s, 12 * s, 5 * s, '#8a5a3c'); R(ctx, x - 6 * s, baseY - 5 * s, 12 * s, s, '#a8743f');
    R(ctx, x - 7 * s, baseY - 4 * s, s, 3 * s, '#e8c88f'); R(ctx, x + 6 * s, baseY - 4 * s, s, 3 * s, '#e8c88f');
    R(ctx, x - 2 * s, baseY - 3 * s, 2 * s, s, '#6b4128');
  };
  Art.cone = function (ctx, x, baseY, s) {
    s = s || 2;
    Art.pat(ctx, ['..o..', '..o..', '.owo.', '.owo.', 'ooooo', 'ooooo'], { o: '#f08c4a', w: '#fffaf0' }, x - 2.5 * s, baseY - 6 * s, s);
  };
  Art.haystack = function (ctx, x, baseY, s) {
    s = s || 2;
    Art.pat(ctx, ['...yyyy...', '..yyyyyy..', '.yyYyyyyy.', 'yyyyyYyyyy', 'yYyyyyyyYy', 'dddddddddd'], { y: '#f0cf6a', Y: '#d9a93a', d: '#b8862a' }, x - 5 * s, baseY - 6 * s, s);
  };
  Art.lamp = function (ctx, x, baseY, s, t) {
    s = s || 2;
    R(ctx, x, baseY - 14 * s, s, 14 * s, C.ink2); R(ctx, x - s, baseY - 16 * s, 3 * s, 2 * s, '#ffe27a');
  };
  Art.mushroom = function (ctx, x, baseY, s) {
    s = s || 2;
    Art.pat(ctx, ['.rrr.', 'rwrrr', 'rrrwr', '.sss.', '.sss.'], { r: '#e8647c', w: '#fff', s: '#fff3d6' }, x - 2.5 * s, baseY - 5 * s, s);
  };

  /* ---- little icons for results / final ---- */
  Art.parachute = function (ctx, cx, y, s) {
    for (let i = 0; i < 6; i++) {
      const half = Math.round(Math.sqrt(36 - i * i * 1.0) * 1.3);
      ctx.fillStyle = i % 2 ? C.pink : '#fff';
    }
    // canopy
    const rows = ['..pppppppp..', '.pwpwpwpwpw.', 'pwpwpwpwpwpw', 'pppppppppppp'];
    Art.patOutlined(ctx, rows, { p: C.pink, w: '#fff' }, cx - 6 * s, y, s);
    ctx.fillStyle = C.ink;
    for (const dx of [-5, -2, 2, 5]) {
      ctx.fillRect(cx + dx * s * 0.8 * 1 - 0, y + 4 * s, 1, 6 * s);
    }
    R(ctx, cx - 2 * s, y + 10 * s, 4 * s, 4 * s, C.sun); R(ctx, cx - s, y + 14 * s, 2 * s, 3 * s, '#3b2522');
  };
  Art.racket = function (ctx, hx, hy, th, s, frameCol) {
    const c = Math.cos(th), sn = Math.sin(th);
    const pl = (ux, uy, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(ux) * s, Math.round(uy) * s, s, s); };
    for (let i = -1; i <= 4; i++) pl(hx + c * i, hy + sn * i, i < 1 ? '#8a5a3c' : '#c8cdd6');
    const cx = hx + c * 8.5, cy = hy + sn * 8.5, a = 3.7, b = 2.7;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const u = (dx * c + dy * sn) / a, v = (-dx * sn + dy * c) / b, d = u * u + v * v;
      if (d <= 1.15 && d >= 0.55) pl(cx + dx, cy + dy, frameCol || '#e9edf5');
      else if (d < 0.55) pl(cx + dx, cy + dy, '#d9efe8');
    }
  };
  Art.shuttle = function (ctx, x, y, ang, s) {
    s = s || 1;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
    ctx.fillStyle = '#fff'; ctx.fillRect(-5 * s, -3 * s, 6 * s, 6 * s);
    ctx.fillStyle = '#d9d4e8'; ctx.fillRect(-5 * s, -s, 2 * s, 2 * s);
    ctx.fillStyle = C.ink; ctx.fillRect(1 * s, -2 * s, 1 * s, 4 * s);
    ctx.fillStyle = '#f6a5b1'; ctx.fillRect(2 * s, -2 * s, 3 * s, 4 * s);
    ctx.fillStyle = C.ink; ctx.fillRect(5 * s, -2 * s, s, 4 * s);
    ctx.restore();
  };

  /* ---- particles ---- */
  class Particles {
    constructor() { this.l = []; }
    add(p) { p.life = p.life || 1; p.age = 0; this.l.push(p); return p; }
    heart(x, y, o) { o = o || {}; this.add({ type: 'heart', x, y, vx: U.rand(-12, 12), vy: -U.rand(20, 40), life: o.life || 1.3, s: o.s || 2, col: o.col }); }
    sparkle(x, y, o) { o = o || {}; this.add({ type: 'spark', x, y, vx: U.rand(-20, 20), vy: U.rand(-30, 5), life: U.rand(0.4, 0.8), s: o.s || 1, col: o.col }); }
    dust(x, y, o) { this.add({ type: 'dust', x, y, vx: U.rand(-25, 5), vy: -U.rand(5, 25), life: U.rand(0.25, 0.5), col: (o && o.col) || '#fff3d6' }); }
    confetti(x, y, n) {
      const cols = [C.pink, C.sun, C.green, C.sky, C.purple, '#fff'];
      for (let i = 0; i < (n || 1); i++) this.add({ type: 'conf', x, y, vx: U.rand(-60, 60), vy: U.rand(-110, -20), life: U.rand(1.5, 2.6), col: U.pick(cols), g: 140, rot: U.rand(0, 6) });
    }
    burst(x, y, n, kinds) {
      for (let i = 0; i < n; i++) {
        const k = U.pick(kinds || ['heart', 'spark']);
        const a = U.rand(0, Math.PI * 2), sp = U.rand(25, 70);
        if (k === 'heart') this.add({ type: 'heart', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 25, life: U.rand(0.8, 1.4), s: 2, drag: 2.5 });
        else this.add({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.4, 0.9), s: 1, drag: 2 });
      }
    }
    update(dt) {
      for (const p of this.l) {
        p.age += dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.g) p.vy += p.g * dt;
        if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
        if (p.type === 'dust') p.vy -= 6 * dt;
      }
      this.l = this.l.filter((p) => p.age < p.life);
      if (this.l.length > 400) this.l.splice(0, this.l.length - 400);
    }
    draw(ctx, cx, cy) {
      cx = cx || 0; cy = cy || 0;
      for (const p of this.l) {
        const x = Math.round(p.x - cx), y = Math.round(p.y - cy), k = p.age / p.life;
        ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        if (p.type === 'heart') Art.heart(ctx, x, y, p.s, p.col, true);
        else if (p.type === 'spark') Art.sparkle(ctx, x, y, 1, p.age * 3 + p.x, p.col);
        else if (p.type === 'dust') { ctx.fillStyle = p.col; ctx.fillRect(x, y, 2, 2); }
        else if (p.type === 'conf') { ctx.fillStyle = p.col; const w = Math.sin(p.age * 8 + p.rot) > 0 ? 3 : 1; ctx.fillRect(x, y, w, 3); }
      }
      ctx.globalAlpha = 1;
    }
  }
  BW.Particles = Particles;
})();
