/* Bubs' World — shared side-scrolling engine (used by "Bubs Goes Riding" and "Bubs Goes Horse Riding").
 * A game supplies a config (terrain, scenery, items, obstacles, physics); this runs the rest. */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art, R = U.R;
  const W = 480, H = 270;

  const OBST = {
    rock: { w: 14, h: 9, draw: (c, x, y) => Art.rock(c, x, y, 2) },
    log: { w: 26, h: 10, draw: (c, x, y) => Art.log(c, x, y, 2) },
    cone: { w: 10, h: 12, draw: (c, x, y) => Art.cone(c, x, y, 2) },
    fence: { w: 32, h: 18, draw: (c, x, y) => Art.fence(c, x - 16, y, 32, 2) },
    bush: { w: 22, h: 13, draw: (c, x, y) => Art.bush(c, x, y, 3) }
  };

  function drawDecor(ctx, d, sx, gy, t) {
    switch (d.type) {
      case 'tree': Art.tree(ctx, sx, gy + 2, d.s || 2, d.hue); break;
      case 'bush': Art.bush(ctx, sx, gy + 1, d.s || 2); break;
      case 'flowers': for (let i = 0; i < 4; i++) Art.flower(ctx, sx + i * 7 - 10, gy + 1 + (i % 2), d.cols[i % d.cols.length], 2, Math.sin(t * 2 + i + d.x) * 0.6); break;
      case 'sign': Art.signpost(ctx, sx, gy + 1, 2); break;
      case 'house': Art.house(ctx, sx, gy + 1, 2); break;
      case 'fence': Art.fence(ctx, sx, gy + 1, d.w || 64, 2); break;
      case 'haystack': Art.haystack(ctx, sx, gy + 1, 2); break;
      case 'lamp': Art.lamp(ctx, sx, gy + 1, 2, t); break;
      case 'mushroom': Art.mushroom(ctx, sx, gy + 1, 2); break;
      case 'sunflower': Art.sunflower(ctx, sx, gy + 2, 2, Math.sin(t * 1.5 + d.x) * 0.7); break;
      default: break;
    }
  }

  function iconHeart(ctx, x, y) { Art.heart(ctx, x, y, 2, null, false); }
  function iconStar(ctx, x, y) { Art.star(ctx, x, y, 2, null, false); }
  function iconSun(ctx, x, y) { R(ctx, x - 5, y - 5, 10, 10, C.ink); R(ctx, x - 4, y - 4, 8, 8, C.sun); R(ctx, x - 2, y - 2, 4, 4, '#7a4a2a'); }
  function iconFlower(ctx, x, y) { R(ctx, x - 5, y - 5, 10, 10, C.ink); R(ctx, x - 4, y - 4, 8, 8, C.pink2); R(ctx, x - 1, y - 1, 3, 3, '#fff3a0'); }
  const ICONS = { heart: iconHeart, star: iconStar, sunflower: iconSun, flower: iconFlower };
  const SCORE = { heart: 10, star: 25, sunflower: 15, flower: 10 };

  BW.Side = {
    make(g, cfg) {
      const P = cfg.physics;
      const rnd = U.rng(cfg.seed || 7);
      const S = {
        x: cfg.startX || 60, y: 0, vx: 0, vy: 0, grounded: true, angle: 0, slope: 0, wheel: 0, phase: 0,
        t: 0, state: 'play', cel: 0, invul: 0, shake: 0, jumpBuf: 0, airT: 0,
        score: 0, counts: { heart: 0, star: 0, sunflower: 0, flower: 0 }, boostMeter: cfg.boost ? 0.34 : 0, boosting: false,
        cp: -1, banner: '', bannerT: 0, say: '', sayT: 0, camX: 0, hits: 0, floaters: []
      };
      S.y = cfg.terrain(S.x);
      const items = cfg.items.map((i) => ({ x: i.x, type: i.type, y: cfg.terrain(i.x) - i.h, got: false }));
      const obstacles = cfg.obstacles.map((o) => ({ x: o.x, type: o.type, y: cfg.terrain(o.x) }));
      const cps = cfg.checkpoints.map((x) => ({ x, hit: false }));
      const particles = g.particles;
      const speak = (txt, d) => { S.say = txt; S.sayT = d || 1.4; };

      if (cfg.startSay) speak(cfg.startSay, 3.2);

      function land(vyImpact) {
        S.grounded = true; S.airT = 0;
        if (vyImpact > 140) { g.sfx('land'); for (let i = 0; i < 4; i++) particles.dust(S.x - 8, S.y); }
      }

      function update(dt) {
        S.t += dt;
        const inp = g.input;
        const playing = S.state === 'play';
        const right = playing && inp.isDown('right'), left = playing && inp.isDown('left');
        if (playing && (inp.pressed('jump') || inp.pressed('up'))) S.jumpBuf = 0.13;
        S.jumpBuf = Math.max(0, S.jumpBuf - dt);
        S.invul = Math.max(0, S.invul - dt);
        S.shake = Math.max(0, S.shake - dt * 3);
        S.bannerT = Math.max(0, S.bannerT - dt);
        S.sayT = Math.max(0, S.sayT - dt);

        // boost
        S.boosting = false;
        if (cfg.boost && playing && (inp.isDown('boost') || inp.isDown('down')) && S.boostMeter > 0.01) {
          S.boosting = true; S.boostMeter = Math.max(0, S.boostMeter - dt / 1.6);
          if (Math.random() < 0.5) particles.sparkle(S.x - 20, S.y - 14);
        }
        if (inp.pressed('boost') || (inp.pressed('down') && cfg.boost)) { if (S.boostMeter > 0.01 && playing) g.sfx('boost'); }

        // target speed
        let target;
        if (S.state !== 'play') target = 0;
        else if (S.boosting) target = P.boostV;
        else if (right) target = P.maxV;
        else if (left) target = P.minV;
        else target = P.cruise != null ? P.cruise : 0;
        const rate = target > S.vx ? P.accel : (left || P.cruise != null ? P.brake : P.coast);
        if (S.state === 'finish') S.vx *= Math.pow(0.35, dt);
        else if (target > S.vx) S.vx = Math.min(target, S.vx + P.accel * (S.boosting ? 2.5 : 1) * dt);
        else S.vx = Math.max(target, S.vx - rate * dt);
        if (S.grounded && P.slope) S.vx += S.slope * P.slope * dt;
        S.vx = U.clamp(S.vx, -60, P.boostV + 30);

        // jump
        if (S.grounded && S.jumpBuf > 0 && playing) {
          S.vy = -P.jumpV + Math.min(0, S.slope * S.vx * 0.4);
          S.grounded = false; S.jumpBuf = 0; g.sfx('jump');
          for (let i = 0; i < 3; i++) particles.dust(S.x - 8, S.y);
        }

        // move
        const ox = S.x, oy = S.y;
        let nx = Math.max(20, S.x + S.vx * dt);
        if (S.grounded) {
          const ny = cfg.terrain(nx);
          if (ny - S.y > 5 + Math.abs(S.vx) * dt * 0.5) {
            S.grounded = false; S.vy = S.slope * S.vx; S.x = nx; S.y += S.vy * dt;
          } else {
            S.x = nx; S.y = ny;
            if (nx - ox > 0.01) S.slope = U.clamp((ny - oy) / (nx - ox), -1.4, 1.4);
          }
        } else {
          S.vy += P.gravity * dt; S.y += S.vy * dt; S.x = nx; S.airT += dt;
          const gy = cfg.terrain(S.x);
          if (S.y >= gy && S.vy >= 0) { const v = S.vy; S.y = gy; S.vy = 0; land(v); }
        }
        S.wheel += (S.vx * dt) / 4;
        S.phase += S.vx * dt * (S.grounded ? 0.075 : 0.04);

        // tilt
        let ta;
        if (S.grounded) ta = Math.atan(S.slope) * 0.9;
        else ta = U.clamp(Math.atan2(S.vy, Math.max(S.vx, 80)), -0.55, 0.55) * 0.7 + ((right ? -0.2 : 0) + (left ? 0.2 : 0));
        S.angle += (ta - S.angle) * Math.min(1, dt * 9);
        if (!S.grounded && S.airT > 0.55 && S.sayT <= 0 && playing) speak('Wheee!', 1);
        if (S.grounded && S.vx > 140 && Math.random() < dt * 14) particles.dust(S.x - 14, S.y);

        if (playing) {
          // obstacles
          for (const o of obstacles) {
            const d = OBST[o.type];
            if (!S.invul && Math.abs(S.x - o.x) < d.w / 2 + 11 && S.y > o.y - d.h + 3 && S.y < o.y + 30) {
              S.vx = Math.max(25, S.vx * 0.18); S.vy = -150; S.grounded = false; S.invul = 1.3; S.shake = 0.6; S.hits++;
              g.sfx('bump'); speak(cfg.hitText || 'Oof!', 1.1);
              for (let i = 0; i < 7; i++) particles.dust(S.x + 8, S.y - 4);
            }
          }
          // items
          for (const it of items) {
            if (it.got) continue;
            if (Math.abs(it.x - S.x) < 19 && Math.abs(it.y - (S.y - 20)) < 22) {
              it.got = true; S.counts[it.type]++; S.score += SCORE[it.type];
              S.floaters.push({ x: it.x, y: it.y, t: 0, txt: '+' + SCORE[it.type] });
              if (it.type === 'star') {
                g.sfx('star'); particles.burst(it.x, it.y, 8, ['spark']);
                if (cfg.boost) S.boostMeter = Math.min(1, S.boostMeter + 0.34);
              } else if (it.type === 'heart') { g.sfx('heart'); particles.burst(it.x, it.y, 5, ['heart']); }
              else { g.sfx('flower'); particles.burst(it.x, it.y, 6, ['heart', 'spark']); }
            }
          }
          // checkpoints
          for (let i = 0; i < cps.length; i++) {
            if (!cps[i].hit && S.x >= cps[i].x) {
              cps[i].hit = true; S.cp = i; S.banner = 'CHECKPOINT ' + (i + 1) + '/' + cps.length; S.bannerT = 1.8;
              g.sfx('checkpoint'); particles.burst(cps[i].x, S.y - 40, 12, ['heart', 'spark']);
            }
          }
          if (S.x >= cfg.len) { S.state = 'finish'; speak('Almost there…', 1); }
        } else if (S.state === 'finish') {
          if (Math.abs(S.vx) < 10 && S.grounded) {
            S.state = 'celebrate'; S.cel = 0; S.vx = 0;
            g.sfx('win'); speak(cfg.finishSay || 'Bubs made it! ♡', 99);
            S.banner = cfg.finishBanner || 'YOU DID IT!'; S.bannerT = 99;
          }
        } else if (S.state === 'celebrate') {
          S.cel += dt;
          if (Math.random() < dt * 14) particles.confetti(S.x + U.rand(-60, 60), S.y - 130, 1);
          if (Math.random() < dt * 4) particles.heart(S.x + U.rand(-30, 30), S.y - 30);
          if (S.cel > 2.6 && !S.ended) {
            S.ended = true;
            g.finish({
              won: true, score: S.score, title: cfg.finishTitle, message: cfg.finishMessage,
              stats: cfg.stats(S)
            });
          }
        }
        if (Math.random() < dt * 0.35 && playing) particles.heart(S.x, S.y - 50);

        S.camX = U.clamp(S.x - 150, 0, cfg.len + 80 - W);
        for (const f of S.floaters) f.t += dt;
        S.floaters = S.floaters.filter((f) => f.t < 0.9);
      }

      function drawGround(ctx, camX) {
        const gc = cfg.ground;
        for (let x = 0; x < W + 3; x += 3) {
          const wx = Math.floor((x + camX) / 3) * 3;
          const y = Math.round(cfg.terrain(wx));
          const ov = cfg.groundOverride ? cfg.groundOverride(wx) : null;
          R(ctx, x, y, 3, 3, ov ? ov.top : gc.top); R(ctx, x, y + 3, 3, 5, ov ? ov.mid : gc.mid);
          ctx.fillStyle = gc.dirt; ctx.fillRect(x, y + 8, 3, H - y);
          for (let yy = y + 12 + ((wx / 3) % 3) * 2; yy < H; yy += 11) R(ctx, x, yy, 3, 2, gc.dirt2);
          const hsh = (wx * 2654435761 >>> 0) % 17;
          if (hsh === 0) R(ctx, x, y - 2, 1, 2, gc.top);
          if (hsh === 5) R(ctx, x + 1, y - 3, 1, 3, gc.mid);
        }
      }

      function drawHUD(ctx) {
        Art.panel(ctx, 8, 8, 128, 18);
        let x = 18;
        const kinds = cfg.hud;
        const gap = Math.floor(116 / kinds.length);
        for (const k of kinds) {
          ICONS[k](ctx, x + 4, 17);
          Art.text(ctx, String(S.counts[k]), x + 14, 13, { size: 8, color: C.ink, outline: false });
          x += gap;
        }
        Art.text(ctx, 'SCORE ' + S.score, 142, 12, { size: 8 });
        // progress
        const px = W - 138, py = 12, pw = 126;
        Art.panel(ctx, px - 3, py - 3, pw + 6, 14, C.cream);
        R(ctx, px, py + 2, pw, 4, '#d9c9a0');
        R(ctx, px, py + 2, Math.round(pw * U.clamp(S.x / cfg.len, 0, 1)), 4, C.pink2);
        for (const cp of cps) R(ctx, px + Math.round(pw * cp.x / cfg.len), py - 1, 2, 10, cp.hit ? C.green2 : C.ink2);
        R(ctx, px + pw - 2, py - 2, 4, 12, C.sun);
        Art.heart(ctx, px + Math.round(pw * U.clamp(S.x / cfg.len, 0, 1)), py + 4, 1, null, false);
        if (cfg.boost) {
          Art.panel(ctx, 8, 32, 96, 12);
          R(ctx, 11, 35, 90, 6, '#d9c9a0');
          R(ctx, 11, 35, Math.round(90 * S.boostMeter), 6, S.boosting ? C.sun : C.green);
          Art.text(ctx, 'BOOST', 14, 35, { size: 5, color: C.ink, outline: false });
        }
        if (S.bannerT > 0) {
          const k = Math.min(1, S.bannerT * 3, (S.t * 4 % 1) + 0.5);
          Art.text(ctx, S.banner, W / 2, 52 + Math.round(Math.sin(S.t * 6) * 1.5), { size: 10, align: 'center', color: C.sun });
        }
      }

      function draw(ctx) {
        const camX = Math.round(S.camX);
        const sh = S.shake > 0 ? Math.round(Math.sin(S.t * 60) * S.shake * 3) : 0;
        ctx.save();
        if (sh) ctx.translate(0, sh);
        cfg.drawSky(ctx, camX, S.t, W, H);
        for (const d of cfg.decor) {
          const sx = Math.round(d.x - camX);
          if (sx < -60 || sx > W + 60) continue;
          drawDecor(ctx, d, sx, cfg.terrain(d.x), S.t);
        }
        drawGround(ctx, camX);
        // checkpoint flags + finish
        for (const cp of cps) {
          const sx = cp.x - camX; if (sx < -30 || sx > W + 30) continue;
          const gy = cfg.terrain(cp.x);
          R(ctx, sx, gy - 34, 2, 34, C.ink2);
          R(ctx, sx + 2, gy - 34, 16, 10, cp.hit ? C.green : C.pink2); R(ctx, sx + 2, gy - 34, 16, 2, '#fff');
          Art.heart(ctx, sx + 10, gy - 29, 1, '#fff', true);
        }
        {
          const sx = cfg.len - camX;
          if (sx > -40 && sx < W + 40) {
            const gy = cfg.terrain(cfg.len);
            R(ctx, sx - 30, gy - 56, 4, 56, C.ink2); R(ctx, sx + 30, gy - 56, 4, 56, C.ink2);
            for (let i = 0; i < 16; i++) R(ctx, sx - 30 + i * 4, gy - 58, 4, 8, i % 2 ? '#fff' : C.pink2);
            R(ctx, sx - 30, gy - 50, 64, 2, C.ink);
            Art.text(ctx, 'FINISH', sx + 2, gy - 48, { size: 7, align: 'center', color: C.sun });
            for (let i = 0; i < 6; i++) Art.heart(ctx, sx - 24 + i * 10, gy - 62 - ((i + Math.floor(S.t * 3)) % 2) * 2, 1, null, true);
          }
        }
        for (const o of obstacles) {
          const sx = o.x - camX; if (sx < -40 || sx > W + 40) continue;
          OBST[o.type].draw(ctx, sx, o.y + 1);
        }
        for (const it of items) {
          if (it.got) continue;
          const sx = Math.round(it.x - camX); if (sx < -20 || sx > W + 20) continue;
          const bob = Math.round(Math.sin(S.t * 4 + it.x * 0.05) * 2), y = Math.round(it.y) + bob;
          if (it.type === 'heart') Art.heart(ctx, sx, y, 2);
          else if (it.type === 'star') { Art.star(ctx, sx, y, 2); if (((S.t * 3 + it.x) | 0) % 5 === 0) Art.sparkle(ctx, sx + 8, y - 8, 1, S.t); }
          else if (it.type === 'sunflower') Art.sunflower(ctx, sx, y + 12, 1, Math.sin(S.t * 2 + it.x) * 0.6);
          else { ctx.save(); ctx.translate(sx, y); R(ctx, -5, -5, 10, 10, C.ink); R(ctx, -4, -4, 8, 8, C.pink2); R(ctx, -2, -2, 4, 4, '#fff3a0'); R(ctx, -1, -1, 2, 2, C.sun); ctx.restore(); }
        }
        // vehicle + Bubs
        const sx = Math.round(S.x - camX);
        const blink = S.invul > 0 && Math.floor(S.t * 14) % 2 === 0;
        if (!blink) {
          if (S.state === 'celebrate') {
            if (cfg.vehicle === 'bike') BW.Vehicles.bike.draw(ctx, sx, S.y, 2, { rider: false, wheel: S.wheel });
            else BW.Vehicles.horse.draw(ctx, sx, S.y, 2, { rider: false, speed: 0, phase: 0, t: S.t });
            const hop = Math.abs(Math.sin(S.cel * 6)) * 8;
            BW.Bubs.draw(ctx, sx + 48, S.y - hop, { pose: 'happy', outfit: 'riding', scale: 2 });
          } else if (cfg.vehicle === 'bike') {
            BW.Vehicles.bike.draw(ctx, sx, S.y, 2, { angle: S.angle, wheel: S.wheel, expr: S.grounded ? BW.Bubs.autoExpr(S.t) : 'open' });
          } else {
            const m = S.grounded ? U.clamp(Math.abs(S.vx) / 130, 0, 1) : 0.45;
            const bob = S.grounded ? Math.abs(Math.sin(S.phase)) * 1.3 * m : 0;
            BW.Vehicles.horse.draw(ctx, sx, S.y, 2, { angle: S.angle * 0.7, phase: S.phase, speed: m, bob, t: S.t, expr: S.grounded ? BW.Bubs.autoExpr(S.t) : 'open' });
          }
        }
        if (S.boosting) for (let i = 0; i < 5; i++) R(ctx, sx - 40 - i * 14, Math.round(S.y - 12 - i * 5 + (S.t * 90 % 6)), 14, 2, 'rgba(255,255,255,.7)');
        particles.draw(ctx, camX, 0);
        for (const f of S.floaters) Art.text(ctx, f.txt, f.x - camX, f.y - 14 - f.t * 24, { size: 7, align: 'center', color: C.sun });
        if (S.sayT > 0) Art.bubble(ctx, sx + (S.state === 'celebrate' ? 48 : 4), S.y - (S.state === 'celebrate' ? 66 : 74), S.say, { size: 7 });
        ctx.restore();
        drawHUD(ctx);
      }
      return { update, draw, state: S };
    }
  };
})();
