/* ------------------------------------------------------------------
 * Custom Bubs sprites go here (optional).
 *
 * Right now Bubs is drawn by js/core/bubs.js from a pixel-grid recipe
 * (based on the character sheet). When you have hand-made pixel art,
 * drop PNG strips into assets/sprites/ and register them below —
 * every game will pick them up automatically.
 *
 * Each PNG is a horizontal strip of frames. Example:
 *
 *   BW.Bubs.setOverride('idle',  { src: 'assets/sprites/bubs-idle.png',  fw: 32, fh: 48, frames: 2, ax: 16, ay: 48 });
 *   BW.Bubs.setOverride('walk',  { src: 'assets/sprites/bubs-walk.png',  fw: 32, fh: 48, frames: 4, ax: 16, ay: 48 });
 *   BW.Bubs.setOverride('run',   { src: 'assets/sprites/bubs-run.png',   fw: 32, fh: 48, frames: 4, ax: 16, ay: 48 });
 *   BW.Bubs.setOverride('jump',  { src: 'assets/sprites/bubs-jump.png',  fw: 32, fh: 48, frames: 1, ax: 16, ay: 48 });
 *
 * fw/fh = frame size in source pixels, ax/ay = anchor (feet, bottom-centre).
 * Poses used by the games: idle, walk, run, jump, fall, happy, wave, ride, ready, swing.
 * Leave this file as-is to keep the built-in sprite.
 * ------------------------------------------------------------------ */
