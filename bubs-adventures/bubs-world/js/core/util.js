/* Bubs' World — shared utilities, palette, save data */
(function () {
  const BW = (window.BW = window.BW || {});
  BW.Games = BW.Games || {};
  BW.ORDER = ['riding', 'sunflower', 'bungee', 'horse', 'badminton'];

  const U = (BW.U = {});
  U.C = {
    ink: '#3a2431', ink2: '#5b3a46', cream: '#fff3d6', cream2: '#f7e3b5', white: '#fffaf0',
    pink: '#f6a5b1', pink2: '#f08ba0', rose: '#e8647c', heart: '#ee5f7e',
    sun: '#f7c948', sun2: '#e8a52c', green: '#8fc96b', green2: '#5fa05a', green3: '#3f7d4f',
    sky: '#a8dcf2', sky2: '#d7f0fa', brown: '#8a5a3c', brown2: '#6b4128', water: '#7cc6e8',
    purple: '#b9a3e3', peach: '#f7cfa5'
  };
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (a) => a[Math.floor(Math.random() * a.length)];
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.R = function (ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  U.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  /* ---- local save (no backend) ---- */
  const KEY = 'bubs_world_v1';
  BW.Store = {
    d: { done: {}, best: {}, outfit: 0, endingSeen: false },
    load() {
      try {
        const r = localStorage.getItem(KEY);
        if (r) { const o = JSON.parse(r); Object.assign(this.d, o); this.d.done = o.done || {}; this.d.best = o.best || {}; }
      } catch (e) {}
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (e) {} },
    isDone(id) { return !!this.d.done[id]; },
    count() { return BW.ORDER.filter((id) => this.d.done[id]).length; },
    allDone() { return this.count() === BW.ORDER.length; },
    best(id) { return this.d.best[id] || 0; },
    /** returns {first, allNow} */
    complete(id, score) {
      const wasAll = this.allDone();
      const first = !this.d.done[id];
      this.d.done[id] = true;
      if (score > (this.d.best[id] || 0)) this.d.best[id] = score;
      this.save();
      return { first, allNow: this.allDone() && !wasAll };
    },
    recordScore(id, score) {
      if (score > (this.d.best[id] || 0)) { this.d.best[id] = score; this.save(); }
    },
    reset() { this.d = { done: {}, best: {}, outfit: 0, endingSeen: false }; this.save(); }
  };
})();
