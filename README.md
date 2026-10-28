<div align="center">

# Vector Keep

**A vector siege shooter for the browser.**
Blast through spinning energy rings, take out the gun at the core and dodge the homing mines it sends after you, all drawn in glowing vector lines.

[![Play on GitHub Pages](https://img.shields.io/badge/▶_Play_now-GitHub%20Pages-ff9a1f?style=for-the-badge&labelColor=0a0500)](https://vedjuk.github.io/Vector-Keep/)

[![Deploy](https://github.com/vedjuk/Vector-Keep/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/vedjuk/Vector-Keep/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/github/license/vedjuk/Vector-Keep)](LICENSE)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Canvas 2D](https://img.shields.io/badge/Canvas-2D-e34f26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

<a href="https://vedjuk.github.io/Vector-Keep/">
  <img src="docs/screenshots/gameplay.png" alt="Vector Keep gameplay: the ship with its shield up firing at the keep's rotating rings, while a homing mine closes in" width="860">
</a>

</div>

---

## Features

- **Rotating ring defences.** Three energy rings spin in alternating directions, and each has a gap. Wear them down or slip shots through the openings.
- **A gun that shoots back.** The core turret tracks your ship and fires faster on every level.
- **Homing mines.** The keep releases mines that chase you down, up to five at a time.
- **Inertia flight.** Thrust, drift and wrap around the edges of the screen.
- **Shield.** Hold it to absorb shots, mines and ring contact. It drains energy while up and recharges when lowered.
- **Escalating levels.** Destroy the core to clear the keep. The next one spins faster and fights harder.
- **Local high score.** Saved in your browser.
- **No engine, no assets.** Plain TypeScript and Canvas 2D. Every sound is generated with the Web Audio API.

---

## Play

| | |
| :-- | :-- |
| **In your browser** | [**vedjuk.github.io/Vector-Keep →**](https://vedjuk.github.io/Vector-Keep/) |
| **Locally** | `npm install` then `npm run dev` |

Vite prints a local URL (usually `http://localhost:5173`). Press **Space** or **Enter** to start.

## Controls

| Action | Keys |
| :-- | :-- |
| Start / restart | **Space**, **Enter** (or **R** on the game-over screen) |
| Rotate | **←** **→** or **A** **D** |
| Thrust | **↑** or **W** |
| Fire | **Space** (up to 4 shots on screen) |
| Shield | **Shift** (hold) |
| Pause | **P** |

## Scoring

| Target | Points |
| :-- | --: |
| Ring hit | 12 |
| Core hit | 80 |
| Mine | 150 |
| Keep destroyed | 800 |

<div align="center">
  <img src="docs/screenshots/title.png" alt="Vector Keep title screen listing the controls" width="640">
</div>

---

## Development

| Command | Description |
| :-- | :-- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve `dist/` locally (a good check before deploying) |

**Requirements:** [Node.js](https://nodejs.org/) 20+ (LTS recommended).

Most of the game feel (ship handling, shield drain, ring spin, turret fire rate, mine speed, scoring) can be tuned from [`src/game/constants.ts`](src/game/constants.ts).

### Project layout

```
src/
  main.ts              # Canvas + game loop bootstrap
  game/                # Fixed-step loop, tuning constants, Game orchestration
  entities/            # Ship, bullets, castle (rings + core), mines
  systems/             # Input, collision
  render/              # Canvas drawing (vector look, HUD, title)
  audio/               # Web Audio beeps
```

### Deploying

**GitHub Pages (this repo):** every push to `main` runs [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml), which runs `npm ci` and `npm run build` and then publishes `dist/`. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

[`vite.config.ts`](vite.config.ts) sets [`base`](https://vite.dev/config/shared-options.html#base) to `/Vector-Keep/` so asset URLs match `https://vedjuk.github.io/Vector-Keep/`. If you fork or rename the repo, change `base` to `/<your-repo-name>/` (with the trailing slash).

**Other hosts:** run `npm run build`, then upload the contents of `dist/` to any static file host. For a site at the domain root, use `base: '/'`.

---

## Fan tribute

Vector Keep is inspired by the vector coin-op games of the late '70s and early '80s. It is **not** affiliated with any rights holder, and it uses no original ROM assets, logos or sampled audio.

## License

[MIT](LICENSE). The license covers this project's source code and assets only. It grants no rights in third-party trademarks or in the classic games that inspired this tribute.
