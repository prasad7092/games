/* Bubs' World — tiny generated chiptune sound effects (no audio files, no copyrighted music) */
(function () {
  const BW = window.BW;
  const A = (BW.Audio = {
    ctx: null, master: null, muted: false,
    init() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) { this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.22; this.master.connect(this.ctx.destination); }
        } catch (e) { this.ctx = null; }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = !!m;
      try { localStorage.setItem('bubs_muted', m ? '1' : '0'); } catch (e) {}
    },
    loadPref() { try { this.muted = localStorage.getItem('bubs_muted') === '1'; } catch (e) {} },
    tone(f, d, type, vol, t0, slideTo) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (t0 || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + d);
      const v = (vol == null ? 0.5 : vol);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + d + 0.02);
    },
    seq(notes, step, type, vol) {
      notes.forEach((n, i) => this.tone(n, step * 1.4, type || 'square', vol == null ? 0.4 : vol, i * step));
    },
    sfx(n) {
      if (!this.ctx || this.muted) return;
      switch (n) {
        case 'click': this.tone(660, 0.05, 'square', 0.35); break;
        case 'hover': this.tone(900, 0.03, 'square', 0.12); break;
        case 'start': this.seq([523, 659, 784, 1047], 0.09); break;
        case 'heart': this.tone(880, 0.07, 'square', 0.35); this.tone(1175, 0.12, 'square', 0.35, 0.06); break;
        case 'star': this.seq([784, 988, 1175, 1568], 0.05, 'triangle', 0.5); break;
        case 'flower': this.tone(700, 0.06, 'triangle', 0.5); this.tone(1000, 0.1, 'triangle', 0.5, 0.06); break;
        case 'special': this.seq([659, 784, 988, 1319, 1568], 0.07, 'triangle', 0.55); break;
        case 'jump': this.tone(300, 0.16, 'square', 0.3, 0, 640); break;
        case 'land': this.tone(130, 0.08, 'triangle', 0.5); break;
        case 'bump': this.tone(220, 0.22, 'sawtooth', 0.35, 0, 70); break;
        case 'boost': this.tone(380, 0.3, 'square', 0.3, 0, 1300); break;
        case 'checkpoint': this.seq([523, 784, 1047], 0.08, 'square', 0.35); break;
        case 'win': this.seq([523, 523, 659, 784, 659, 784, 1047], 0.12, 'square', 0.4); break;
        case 'lose': this.seq([392, 330, 262, 196], 0.14, 'triangle', 0.5); break;
        case 'point': this.tone(660, 0.08, 'square', 0.35); this.tone(990, 0.14, 'square', 0.35, 0.08); break;
        case 'swing': this.tone(900, 0.09, 'sawtooth', 0.12, 0, 260); break;
        case 'hit': this.tone(520, 0.06, 'square', 0.4); this.tone(260, 0.1, 'triangle', 0.5, 0.02); break;
        case 'net': this.tone(180, 0.15, 'triangle', 0.5, 0, 100); break;
        case 'bounce': this.tone(180, 0.28, 'sine', 0.6, 0, 520); break;
        case 'perfect': this.seq([784, 988, 1319, 1568], 0.06, 'triangle', 0.55); break;
        case 'good': this.seq([660, 880], 0.07, 'triangle', 0.5); break;
        case 'miss': this.tone(300, 0.2, 'triangle', 0.4, 0, 150); break;
        case 'whoosh': this.tone(1200, 0.7, 'triangle', 0.22, 0, 160); break;
        case 'sparkle': this.tone(1568, 0.05, 'triangle', 0.25); break;
        case 'wiggle': this.tone(500, 0.05, 'triangle', 0.2); this.tone(620, 0.05, 'triangle', 0.2, 0.05); break;
        case 'stamp': this.tone(110, 0.12, 'square', 0.5); this.tone(220, 0.08, 'square', 0.3, 0.05); break;
        default: this.tone(600, 0.05);
      }
    }
  });
  A.loadPref();
})();
