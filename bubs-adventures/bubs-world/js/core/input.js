/* Bubs' World — unified keyboard + touch input ("actions", not keys) */
(function () {
  const BW = window.BW;
  const MAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'act', KeyX: 'act', KeyJ: 'act', Enter: 'act',
    ShiftLeft: 'boost', ShiftRight: 'boost'
  };
  const I = (BW.Input = {
    active: false, down: {}, edge: {},
    press(a) { if (!this.down[a]) this.edge[a] = true; this.down[a] = true; },
    release(a) { this.down[a] = false; },
    tap(a) { this.edge[a] = true; },
    isDown(a) { return !!this.down[a]; },
    pressed(a) { return !!this.edge[a]; },
    endFrame() { this.edge = {}; },
    reset() { this.down = {}; this.edge = {}; }
  });
  window.addEventListener('keydown', (e) => {
    const a = MAP[e.code];
    if (!a) return;
    if (I.active) {
      e.preventDefault();
      if (!e.repeat) I.press(a);
    }
  });
  window.addEventListener('keyup', (e) => {
    const a = MAP[e.code];
    if (a) I.release(a);
  });
  window.addEventListener('blur', () => I.reset());
})();
