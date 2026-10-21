# Game Off 2026 – design (pre-theme)
## Style
Low-poly toon 3D, all built from code with three.js shapes (no asset files). It uses a 3-step toon ramp, a strong warm sun with soft shadows, a cool sky light, and thick colour fog that hides the edges and keeps the draw distance short. The palette is purple dusk with gold, cyan and red accents. The renderer caps resolution (720/900/1080p on the short side) and drops quality by itself if FPS stays under 40. Target: school laptops and phones.
## Core loop (fun in 10 s)
A top-down arena run. Move, grab sparks to build a combo (up to x20), and dash-smash enemies, which wins points and makes you invincible while you dash. Enemies come faster over time, you have 3 hearts, a run lasts 1–3 min, and you chase a best score. Game feel: hit-stop, screen shake, squash and stretch, particle bursts, score pop-ups and bouncing UI.
Next, when the theme drops: add upgrades between waves (a roguelite pick from 3 cards).
## Ways to bend it to a theme
1. **Scale/size themes**: the player grows with the combo and must smash before getting too big for the gaps.
2. **Time/loop themes**: each run leaves a ghost that replays your moves and fights alongside you or blocks you.
3. **Connection/chain themes**: sparks link into a chain behind you and must be looped around enemies.
4. **Role-swap/"you are the enemy" themes**: swap the dash-smash role, so you herd the waves instead of fighting them.
## Tech
- `src/` holds the source, and `node build.js` makes the single file `dist/index.html`, with three.js r170 vendored in `vendor/` and inlined.
- Physics runs on a fixed 60 Hz step.
- Sound: Game Music puts files in `audio/` (`music, pickup, dash, kill, hurt, ui, over` as .mp3/.ogg). The build lists whatever is in that folder, and missing files stay silent.
- Test with `node tools/bot.js`.
