# ♡ Bubs' Little Adventures

A tiny retro mini-game arcade made just for Bubs. Pure HTML / CSS / JavaScript:
no build step, no dependencies, no backend. Everything (art, sprites, sound) is generated in code.

## Run it
- **Locally:** open `index.html` (double-click). Or `npx serve .` / `python3 -m http.server`.
- **Deploy on Vercel:** drag the folder into vercel.com/new, or run `vercel` inside it.
  (Framework preset: "Other". No build command, output directory is the root.)

## The 5 games
| Game | Controls |
|---|---|
| 🏍️ Bubs Goes Riding | → / D ride, ← / A brake, Space / ↑ jump |
| 🌻 Sunflower Garden | Arrows / WASD walk, Z or J = hint, tap flowers to wiggle them |
| 🪂 Bungee Jumping | Space / tap to jump, then tap again at the very bottom of each bounce (3 good bounces to win) |
| 🐎 Horse Riding | → faster, ← slower, Space jump, ↓ / Shift boost (fill it with ★) |
| 🏸 Badminton | ← → move, Space jump, Z / J / X / Enter swing. Jump-hit = smash. First to 5 |

Esc / P pauses. Mobile gets on-screen touch buttons automatically. 🔊 mutes sound.
Progress (stamps, best scores, outfit, mute) is stored in `localStorage` only.
Finish all five to unlock the ending screen.

## Project layout
```
index.html            page shell (title, hub, game stage, ending)
css/style.css         pixel UI, CRT overlay, responsive + touch layout
js/main.js            boot
js/core/
  util.js             palette, helpers, save data (BW.Store)
  audio.js            generated chiptune SFX + mute
  input.js            keyboard → actions (touch buttons feed the same actions)
  art.js              shared pixel art: scenery, hearts, stars, text, particles
  bubs.js             ★ the Bubs character sprite system
  vehicles.js         the bike and the horse (Bubs rides them)
  sidescroller.js     shared engine for Riding + Horse
  shell.js            runs a game: loop, intro / pause / results, touch buttons
  previews.js         animated hub-card scenes
  ui.js               hub, Adventure Book, transitions, ending
js/games/             riding.js  sunflower.js  bungee.js  horse.js  badminton.js
assets/sprites/overrides.js   ← drop-in point for custom Bubs sprite PNGs
```

## Swapping in custom Bubs pixel art later
Bubs is drawn by `js/core/bubs.js` from a small pixel-grid recipe, so every game uses the same
character (7 outfits from the character sheet). Poses: idle, walk, run, jump, fall, happy, wave,
ride, ready, swing. To use your own art, put PNG strips in `assets/sprites/` and register them in
`assets/sprites/overrides.js`:
```js
BW.Bubs.setOverride('idle', { src:'assets/sprites/bubs-idle.png', fw:32, fh:48, frames:2, ax:16, ay:48 });
```
Any pose you don't override keeps the built-in sprite.

## Adding a game
Create `js/games/yourgame.js` that sets `BW.Games.yourgame = { id, emoji, name, desc, hover, intro:[…],
touch:{left:[…],right:[…]}, create(g) → { update(dt), draw(ctx) } }`, add the id to `BW.ORDER`
(js/core/util.js), add a preview in `previews.js`, and include the script in `index.html`.
Call `g.finish({won, score, title, message, stats})` when it ends.
