/* Bubs' World — game shell: runs one game at a time (loop, intro, pause, results, touch controls) */
(function () {
  const BW = window.BW, U = BW.U, C = U.C;
  const W = 480, H = 270;
  const $ = (id) => document.getElementById(id);

  const Shell = (BW.Shell = {
    id: null, def: null, inst: null, g: null, state: 'idle', raf: 0, last: 0, ctx: null, canvas: null, overlay: null, touchEl: null,

    init() {
      this.canvas = $('game'); this.ctx = this.canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
      this.overlay = $('overlay'); this.touchEl = $('touch');
      document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(); });
      window.addEventListener('keydown', (e) => {
        if (!this.def) return;
        if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
          if (this.state === 'play') { e.preventDefault(); this.pause(); }
          else if (this.state === 'paused') { e.preventDefault(); this.resume(); }
        } else if ((e.code === 'Space' || e.code === 'Enter') && this.state === 'intro' && !e.repeat) {
          e.preventDefault(); this.start();
        }
      });
      const canvas = this.canvas;
      canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'play' || !this.def) return;
        if (this.def.tapAction) BW.Input.tap(this.def.tapAction);
        if (this.inst && this.inst.pointer) {
          const r = canvas.getBoundingClientRect();
          this.inst.pointer((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
        }
      });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    open(id) {
      const def = BW.Games[id];
      if (!def) return;
      this.close(true);
      this.id = id; this.def = def;
      BW.Input.reset(); BW.Input.active = false;
      this.g = {
        W, H, input: BW.Input, particles: new BW.Particles(), sfx: (n) => BW.Audio.sfx(n),
        finish: (res) => this.finish(res)
      };
      this.inst = def.create(this.g);
      this.buildTouch(def);
      this.state = 'intro';
      this.showIntro();
      this.startLoop();
    },

    close(silent) {
      cancelAnimationFrame(this.raf); this.raf = 0;
      this.state = 'idle'; this.def = null; this.inst = null; this.id = null;
      BW.Input.active = false; BW.Input.reset();
      if (this.overlay) { this.overlay.classList.add('hidden'); this.overlay.innerHTML = ''; }
      if (this.touchEl) this.touchEl.innerHTML = '';
    },

    startLoop() {
      cancelAnimationFrame(this.raf);
      this.last = performance.now();
      const step = (now) => {
        this.raf = requestAnimationFrame(step);
        const dt = Math.min(1 / 30, Math.max(0, (now - this.last) / 1000));
        this.last = now;
        if (!this.inst) return;
        if (this.state === 'play' || this.state === 'ending' || this.state === 'results') {
          this.inst.update(dt);
          this.g.particles.update(dt);
        } else if (this.state === 'intro') {
          this.g.particles.update(dt);
        }
        BW.Input.endFrame();
        this.ctx.imageSmoothingEnabled = false;
        this.inst.draw(this.ctx);
        if (this.state === 'ending' || this.state === 'results') { /* celebration keeps running */ }
      };
      this.raf = requestAnimationFrame(step);
    },

    showOverlay(html) { this.overlay.innerHTML = html; this.overlay.classList.remove('hidden'); },
    hideOverlay() { this.overlay.classList.add('hidden'); this.overlay.innerHTML = ''; },

    showIntro() {
      const d = this.def;
      const best = BW.Store.best(this.id);
      this.showOverlay(
        '<div class="panel"><h2>' + d.emoji + ' ' + d.name.toUpperCase() + '</h2>' +
        '<p>' + d.desc + '</p><ul>' + d.intro.map((t) => '<li>♡ ' + t + '</li>').join('') + '</ul>' +
        (best ? '<p>Best score: ' + best + '</p>' : '') +
        '<div class="btns"><button class="pbtn big" id="ov-start" type="button">START ♡</button>' +
        '<button class="pbtn" id="ov-back" type="button">← Back</button></div></div>'
      );
      $('ov-start').onclick = () => { BW.Audio.sfx('start'); this.start(); };
      $('ov-back').onclick = () => { BW.Audio.sfx('click'); BW.UI.go('hub'); };
    },

    start() {
      if (this.state !== 'intro') return;
      this.hideOverlay(); this.state = 'play'; BW.Input.reset(); BW.Input.active = true;
    },

    pause() {
      if (this.state !== 'play') return;
      this.state = 'paused'; BW.Input.active = false; BW.Input.reset();
      this.showOverlay('<div class="panel"><h2>PAUSED</h2><p>Take your time, Bubs ♡</p><div class="btns"><button class="pbtn big" id="ov-resume" type="button">RESUME</button><button class="pbtn" id="ov-restart" type="button">Restart</button><button class="pbtn" id="ov-back" type="button">← Back to Bubs\' World</button></div></div>');
      $('ov-resume').onclick = () => { BW.Audio.sfx('click'); this.resume(); };
      $('ov-restart').onclick = () => { BW.Audio.sfx('click'); this.restart(); };
      $('ov-back').onclick = () => { BW.Audio.sfx('click'); BW.UI.go('hub'); };
    },
    resume() {
      if (this.state !== 'paused') return;
      this.hideOverlay(); this.state = 'play'; BW.Input.reset(); BW.Input.active = true;
    },
    restart() {
      this.g.particles = new BW.Particles();
      this.inst = this.def.create(this.g);
      this.hideOverlay(); this.state = 'play'; BW.Input.reset(); BW.Input.active = true;
    },

    /** called by a game when it ends */
    finish(res) {
      if (this.state !== 'play') return;
      this.state = 'ending';
      this.res = res;
      const delay = res.delay != null ? res.delay : 700;
      setTimeout(() => { if (this.state === 'ending' && this.id) this.showResults(); }, delay);
    },

    showResults() {
      const res = this.res, id = this.id, d = this.def;
      this.state = 'results'; BW.Input.active = false; BW.Input.reset();
      let info = { first: false, allNow: false };
      if (res.won) info = BW.Store.complete(id, res.score || 0); else BW.Store.recordScore(id, res.score || 0);
      if (res.won) BW.Audio.sfx('stamp');
      const stats = (res.stats || []).map((s) => '<div class="stat">' + s[0] + '<b>' + s[1] + '</b></div>').join('');
      this.showOverlay(
        '<div class="panel"><h2>' + res.title + '</h2><p>' + (res.message || '') + '</p>' +
        (stats ? '<div class="stats">' + stats + '</div>' : '') +
        (res.won ? '<div class="stampbig">✓ Bubs conquered this adventure!</div>' : '') +
        (info.allNow ? '<p>★ All five adventures complete! A surprise is waiting… ★</p>' : '') +
        '<div class="btns">' +
        (info.allNow ? '<button class="pbtn big pulse" id="ov-ending" type="button">★ SEE THE ENDING ♡</button>' : '') +
        '<button class="pbtn green" id="ov-again" type="button">' + (res.won ? 'Play again' : 'Try again') + '</button>' +
        '<button class="pbtn" id="ov-back" type="button">← Back to Bubs\' World</button></div></div>'
      );
      const again = $('ov-again'), back = $('ov-back'), end = $('ov-ending');
      again.onclick = () => { BW.Audio.sfx('click'); this.restart(); };
      back.onclick = () => { BW.Audio.sfx('click'); BW.UI.go('hub'); };
      if (end) end.onclick = () => { BW.Audio.sfx('click'); BW.UI.go('final'); };
    },

    /* ---- touch controls ---- */
    buildTouch(def) {
      const el = this.touchEl; el.innerHTML = '';
      const t = def.touch || {};
      const mk = (spec) => {
        if (spec.dpad) {
          const d = document.createElement('div'); d.className = 'dpad';
          [['u', 'up', '▲'], ['l', 'left', '◀'], ['r', 'right', '▶'], ['d', 'down', '▼']].forEach((q) => {
            const b = document.createElement('button'); b.className = 'tbtn ' + q[0]; b.textContent = q[2]; b.type = 'button'; bind(b, q[1]); d.appendChild(b);
          });
          return d;
        }
        const b = document.createElement('button'); b.type = 'button'; b.className = 'tbtn ' + (spec.cls || ''); b.textContent = spec.t; bind(b, spec.a); return b;
      };
      const bind = (b, a) => {
        const on = (e) => { e.preventDefault(); if (!BW.Input.active) return; try { b.setPointerCapture(e.pointerId); } catch (x) {} b.classList.add('on'); BW.Input.press(a); };
        const off = (e) => { e.preventDefault(); b.classList.remove('on'); BW.Input.release(a); };
        b.addEventListener('pointerdown', on);
        b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
      };
      const L = document.createElement('div'); L.className = 'tgrp l'; (t.left || []).forEach((s) => L.appendChild(mk(s)));
      const Rr = document.createElement('div'); Rr.className = 'tgrp r'; (t.right || []).forEach((s) => Rr.appendChild(mk(s)));
      el.appendChild(L); el.appendChild(Rr);
    }
  });
})();
