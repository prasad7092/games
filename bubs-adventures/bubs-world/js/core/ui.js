/* Bubs' World — screens, hub, Adventure Book, transitions, ambient background, final ending */
(function () {
  const BW = window.BW, U = BW.U, C = U.C, Art = BW.Art, R = U.R;
  const $ = (id) => document.getElementById(id);

  const UI = (BW.UI = {
    screen: 'title', busy: false, hovered: null,

    /* ---------------- screens ---------------- */
    show(name) {
      if (this.screen === 'game' && name !== 'game') BW.Shell.close();
      this.screen = name;
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
      document.body.dataset.screen = name;
      $('btn-back').classList.toggle('hidden', !(name === 'game' || name === 'final'));
      window.scrollTo(0, 0);
      if (name === 'hub') { this.refreshHub(); }
      if (name === 'final') { Final.start(); } else { Final.stop(); }
      Loops.sync();
    },
    go(name, cb) {
      if (this.busy) return;
      if (name === this.screen && !cb) return;
      this.busy = true;
      Transition.run(() => { this.show(name); if (cb) cb(); }, () => { this.busy = false; });
    },
    openGame(id) { BW.Audio.sfx('click'); this.go('game', () => BW.Shell.open(id)); },

    say(text) { const s = $('speech'); if (s) s.textContent = text; },

    /* ---------------- hub ---------------- */
    buildHub() {
      const wrap = $('cards'); wrap.innerHTML = '';
      BW.ORDER.forEach((id) => {
        const d = BW.Games[id];
        const card = document.createElement('article');
        card.className = 'card'; card.dataset.game = id; card.tabIndex = 0; card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Play ' + d.name);
        card.innerHTML =
          '<div class="stamp">✓ BUBS<br>CONQUERED<br>THIS!</div>' +
          '<canvas width="240" height="135"></canvas>' +
          '<h3>' + d.emoji + ' ' + d.name + '</h3><p>' + d.desc + '</p><div class="conq"></div>' +
          '<button class="pbtn" type="button">▶ PLAY</button>';
        const over = () => { this.hovered = id; this.say(d.hover); BW.Audio.sfx('hover'); };
        const out = () => { if (this.hovered === id) { this.hovered = null; this.say('Choose an adventure ♡'); } };
        card.addEventListener('mouseenter', over); card.addEventListener('mouseleave', out);
        card.addEventListener('focus', over); card.addEventListener('blur', out);
        card.addEventListener('click', () => this.openGame(id));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openGame(id); } });
        wrap.appendChild(card);
      });
    },
    refreshHub() {
      document.querySelectorAll('.card').forEach((c) => {
        const id = c.dataset.game, done = BW.Store.isDone(id);
        c.classList.toggle('done', done);
        c.querySelector('.conq').textContent = done ? '✓ Bubs conquered this adventure!' : '';
      });
      const list = $('book-list'); list.innerHTML = '';
      BW.ORDER.forEach((id) => {
        const d = BW.Games[id], done = BW.Store.isDone(id), best = BW.Store.best(id);
        const li = document.createElement('li'); li.className = done ? 'done' : '';
        li.innerHTML = '<span class="ico">' + d.emoji + '</span><span class="nm">' + d.name.replace(/^Bubs( Goes| Plays)? /, '').replace(/^Bubs' /, '') + '</span><span class="st">' + (done ? 'Completed' : 'Not completed') + '</span>';
        list.appendChild(li);
      });
      const n = BW.Store.count(), all = BW.Store.allDone();
      $('book-ending').textContent = all ? '★ Ending unlocked! ★' : n + '/5 done — finish all five for a surprise ♡';
      $('btn-ending').classList.toggle('hidden', !all);
    },

    /* ---------------- init ---------------- */
    init() {
      this.buildHub();
      const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (touch) document.body.classList.add('touch');
      const soundBtn = $('btn-sound');
      const refreshSound = () => { soundBtn.textContent = BW.Audio.muted ? '🔇' : '🔊'; soundBtn.setAttribute('aria-pressed', String(!BW.Audio.muted)); };
      refreshSound();
      soundBtn.onclick = () => { BW.Audio.init(); BW.Audio.setMuted(!BW.Audio.muted); refreshSound(); BW.Audio.sfx('click'); };
      $('btn-home').onclick = () => { BW.Audio.init(); BW.Audio.sfx('click'); this.go('hub'); };
      $('btn-back').onclick = () => { BW.Audio.sfx('click'); this.go('hub'); };
      $('btn-final-back').onclick = () => { BW.Audio.sfx('click'); this.go('hub'); };
      $('btn-ending').onclick = () => { BW.Audio.sfx('start'); this.go('final'); };
      $('btn-reset').onclick = () => { if (confirm("Reset all of Bubs' adventure progress?")) { BW.Store.reset(); this.refreshHub(); } };
      const start = () => {
        if (this.screen !== 'title') return;
        BW.Audio.init(); BW.Audio.sfx('start'); this.go('hub');
      };
      $('btn-start').onclick = start;
      window.addEventListener('keydown', (e) => { if (this.screen === 'title' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); start(); } });
      const first = () => { BW.Audio.init(); window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); };
      window.addEventListener('pointerdown', first); window.addEventListener('keydown', first);
      $('portrait').addEventListener('click', () => { Portrait.cycle(); });
      Ambient.init(); Transition.init();
      this.show('title');
    }
  });

  /* ---------------- transition (pixel hearts wipe) ---------------- */
  const Transition = {
    init() { this.c = $('wipe'); this.g = this.c.getContext('2d'); },
    run(mid, done) {
      const c = this.c, g = this.g, cell = 44;
      c.width = window.innerWidth; c.height = window.innerHeight;
      const cols = Math.ceil(c.width / cell), rows = Math.ceil(c.height / cell);
      const dur = 340, t0 = performance.now(); let fired = false;
      const draw = (p) => {
        g.clearRect(0, 0, c.width, c.height);
        if (p <= 0) return;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const delay = ((q + r) / (cols + rows)) * 0.6;
          const k = U.clamp((p - delay) / 0.4, 0, 1);
          if (k <= 0) continue;
          const s = Math.ceil(cell * k / 4) * 4, x = q * cell + (cell - s) / 2, y = r * cell + (cell - s) / 2;
          g.fillStyle = C.ink; g.fillRect(x, y, s, s);
          g.fillStyle = (q + r) % 2 ? C.pink : C.cream; g.fillRect(x + 3, y + 3, Math.max(0, s - 6), Math.max(0, s - 6));
          if (k > 0.9) Art.heart(g, q * cell + cell / 2, r * cell + cell / 2, 3, (q + r) % 2 ? '#fff' : C.pink2, true);
        }
      };
      const step = (now) => {
        const e = now - t0;
        if (e < dur) { draw(e / dur); requestAnimationFrame(step); }
        else if (e < dur + 60) { draw(1); if (!fired) { fired = true; mid(); } requestAnimationFrame(step); }
        else if (e < dur * 2 + 60) { draw(1 - (e - dur - 60) / dur); requestAnimationFrame(step); }
        else { g.clearRect(0, 0, c.width, c.height); if (done) done(); }
      };
      requestAnimationFrame(step);
    }
  };

  /* ---------------- ambient pixel background ---------------- */
  const Ambient = {
    S: 4, hearts: [], t: 0,
    init() {
      this.c = $('ambient'); this.g = this.c.getContext('2d');
      const rs = () => { this.c.width = Math.ceil(window.innerWidth / this.S); this.c.height = Math.ceil(window.innerHeight / this.S); };
      rs(); window.addEventListener('resize', rs);
      for (let i = 0; i < 9; i++) this.hearts.push({ x: Math.random() * 400, y: Math.random() * 300, v: 4 + Math.random() * 6, p: Math.random() * 6 });
    },
    draw(dt) {
      const g = this.g, W = this.c.width, H = this.c.height; this.t += dt; const t = this.t;
      g.imageSmoothingEnabled = false;
      Art.skyBands(g, W, H, ['#c4e6f7', '#d6e6f7', '#e8e2f2', '#f4dded', '#f9d9e2', '#fbdcd4', '#fde8d2']);
      for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = (i * 53) % Math.floor(H * 0.55); if ((Math.floor(t * 1.2 + i) % 3) === 0) Art.sparkle(g, x, y, 1, t + i, '#ffffff'); }
      for (let i = 0; i < 5; i++) Art.cloud(g, Math.round((((i * 70 + t * (2 + i * 0.7)) % (W + 60)) + W + 60) % (W + 60) - 30), 8 + ((i * 29) % Math.max(10, H * 0.4)), 1 + (i % 2), '#fff', '#f1e6f3');
      for (const h of this.hearts) { h.y -= h.v * dt; if (h.y < -8) { h.y = H + 8; h.x = Math.random() * W; } g.globalAlpha = 0.55; Art.heart(g, Math.round(h.x + Math.sin(t + h.p) * 4), Math.round(h.y), 1, '#f08ba0', true); }
      g.globalAlpha = 1;
      // grass + flowers at the bottom
      R(g, 0, H - 9, W, 9, '#9ad36f'); R(g, 0, H - 9, W, 1, '#b7e58f');
      for (let x = 0; x < W; x += 4) { if (((x * 7) % 11) < 3) R(g, x, H - 10, 1, 1, '#9ad36f'); }
      for (let x = 3; x < W; x += 13) Art.flower(g, x, H - 4 - (x % 3), [C.pink2, '#fff3a0', C.purple, '#fff'][(x / 13 | 0) % 4], 1, Math.sin(t * 2 + x) * 0.6);
    }
  };

  /* ---------------- portrait + title Bubs ---------------- */
  const Portrait = {
    t: 0, clickT: 0, parts: new BW.Particles(), outfit() { return BW.Bubs.ORDER[BW.Store.d.outfit % BW.Bubs.ORDER.length]; },
    cycle() {
      BW.Store.d.outfit = (BW.Store.d.outfit + 1) % BW.Bubs.ORDER.length; BW.Store.save();
      this.clickT = 1.3; BW.Audio.init(); BW.Audio.sfx('star');
      this.parts.burst(80, 70, 8, ['heart', 'spark']);
      UI.say('New outfit: ' + BW.Bubs.outfitName(this.outfit()) + '! ♡');
    },
    draw(ctx, dt) {
      this.t += dt; this.clickT = Math.max(0, this.clickT - dt); this.parts.update(dt);
      ctx.clearRect(0, 0, 160, 190);
      let pose = this.t % 9 > 6.5 ? 'wave' : 'idle'; if (this.clickT > 0) pose = 'happy';
      ctx.fillStyle = 'rgba(58,36,49,.18)'; ctx.fillRect(34, 158, 92, 8);
      const hop = this.clickT > 0 ? Math.abs(Math.sin(this.clickT * 8)) * 10 : 0;
      BW.Bubs.draw(ctx, 80, 160 - hop, { pose, frame: BW.Bubs.frame(pose, this.t), outfit: this.outfit(), scale: 5, expr: BW.Bubs.autoExpr(this.t, pose === 'wave' ? 'smile' : undefined) });
      this.parts.draw(ctx);
    }
  };
  const TitleBubs = {
    t: 0, parts: new BW.Particles(),
    draw(ctx, dt) {
      this.t += dt; this.parts.update(dt);
      ctx.clearRect(0, 0, 160, 180);
      if (Math.random() < dt * 1.4) this.parts.heart(40 + Math.random() * 80, 60);
      ctx.fillStyle = 'rgba(58,36,49,.18)'; ctx.fillRect(34, 154, 92, 8);
      BW.Bubs.draw(ctx, 80, 156 - Math.abs(Math.sin(this.t * 2)) * 4, { pose: 'wave', frame: BW.Bubs.frame('wave', this.t), outfit: 'casual', scale: 5, expr: BW.Bubs.autoExpr(this.t, 'smile') });
      this.parts.draw(ctx);
    }
  };

  /* ---------------- final ending ---------------- */
  const Final = {
    on: false, t: 0, parts: new BW.Particles(),
    start() { this.on = true; this.t = 0; this.parts = new BW.Particles(); BW.Store.d.endingSeen = true; BW.Store.save(); BW.Audio.sfx('win'); for (let i = 0; i < 60; i++) this.parts.confetti(240 + U.rand(-120, 120), U.rand(-40, 40), 1); },
    stop() { this.on = false; },
    draw(ctx, dt) {
      const W = 480, H = 270, t = (this.t += dt), P = this.parts; P.update(dt);
      Art.skyBands(ctx, W, 200, ['#3a2a63', '#53387a', '#7a4488', '#a2558f', '#cc6a90', '#ec8a90', '#f8ae94', '#fccaa0']);
      for (let i = 0; i < 40; i++) { const x = (i * 71) % W, y = (i * 37) % 120; if ((Math.floor(t * 1.5 + i) % 4) !== 0) Art.sparkle(ctx, x, y, 1, t + i, '#fff6d8'); }
      Art.sun(ctx, 240, 168, 5);
      for (let i = 0; i < 6; i++) Art.cloud(ctx, Math.round((((i * 110 + t * (3 + i)) % 620) + 620) % 620 - 70), 20 + i * 18, 2 + (i % 2), '#ffd0e0', '#e8a8c8');
      // sunflower meadow
      R(ctx, 0, 196, W, 80, '#7cbf5f'); R(ctx, 0, 196, W, 3, '#a6dc80');
      for (let i = 0; i < 16; i++) Art.sunflower(ctx, 14 + i * 31, 214 + (i % 3) * 6, 2 + (i % 2), Math.sin(t * 1.6 + i) * 0.7);
      for (let i = 0; i < 24; i++) Art.flower(ctx, 6 + i * 20, 240 + (i % 3) * 7, [C.pink2, '#fff3a0', C.purple][i % 3], 2, Math.sin(t * 2 + i) * 0.6);
      // Bubs in the centre
      const hop = Math.abs(Math.sin(t * 3)) * 8, pose = t % 6 > 3 ? 'wave' : 'happy';
      ctx.fillStyle = 'rgba(40,20,50,.25)'; ctx.fillRect(196, 232, 88, 8);
      BW.Bubs.draw(ctx, 240, 236 - (pose === 'happy' ? hop : 0), { pose, frame: BW.Bubs.frame(pose, t), outfit: 'casual', scale: 5, expr: BW.Bubs.autoExpr(t, 'open') });
      // five adventures orbiting
      for (let i = 0; i < 5; i++) {
        const a = t * 0.55 + (i * Math.PI * 2) / 5, x = 240 + Math.cos(a) * 178, y = 112 + Math.sin(a) * 38 + Math.sin(t * 2 + i) * 4, back = Math.sin(a) < 0;
        ctx.save(); ctx.globalAlpha = back ? 0.75 : 1;
        if (i === 0) BW.Vehicles.bike.draw(ctx, x, y + 14, 2, { rider: false, wheel: t * 6 });
        else if (i === 1) Art.sunflower(ctx, x, y + 30, 3, Math.sin(t * 2) * 0.6, true, t);
        else if (i === 2) Art.parachute(ctx, x, y - 22, 3);
        else if (i === 3) BW.Vehicles.horse.draw(ctx, x, y + 26, 2, { rider: false, phase: t * 8, speed: 1, t, bob: 0 });
        else { Art.racket(ctx, x - 24, y + 14, -0.9, 3, '#e9edf5'); Art.shuttle(ctx, x + 16, y - 6 + Math.sin(t * 4) * 4, 0.6 + Math.sin(t * 4) * 0.2, 2); }
        ctx.restore();
        Art.sparkle(ctx, x + 22, y - 18, 1, t + i, '#ffffff');
      }
      if (Math.random() < dt * 4) P.heart(U.rand(30, 450), 250);
      if (Math.random() < dt * 5) P.confetti(U.rand(40, 440), -4, 1);
      P.draw(ctx);
      Art.text(ctx, 'THE END ♡', W / 2, 8, { size: 10, align: 'center', color: '#fff6d8' });
    }
  };

  /* ---------------- animation loops ---------------- */
  const Loops = {
    raf: 0, last: 0, frame: 0,
    sync() {
      if (this.raf) return;
      this.last = performance.now();
      const step = (now) => {
        this.raf = requestAnimationFrame(step);
        const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.frame++;
        const s = UI.screen;
        if (s === 'game') return;
        if (this.frame % 2 === 0) Ambient.draw(dt * 2);
        if (s === 'title') TitleBubs.draw($('title-bubs').getContext('2d'), dt);
        else if (s === 'hub') {
          Portrait.draw($('portrait').getContext('2d'), dt);
          BW.Previews.tick(dt);
          document.querySelectorAll('.card').forEach((c) => {
            const id = c.dataset.game, hov = UI.hovered === id;
            if (hov || this.frame % 4 === 0) { const cv = c.querySelector('canvas'), x = cv.getContext('2d'); x.imageSmoothingEnabled = false; BW.Previews[id](x, now / 1000, hov); }
          });
        } else if (s === 'final' && Final.on) Final.draw($('final-canvas').getContext('2d'), dt);
      };
      this.raf = requestAnimationFrame(step);
    }
  };
})();
