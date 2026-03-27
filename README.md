# Vector Keep

[![License: MIT](https://img.shields.io/github/license/vedjuk/Vector-Keep)](LICENSE)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Deploy](https://github.com/vedjuk/Vector-Keep/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/vedjuk/Vector-Keep/actions/workflows/deploy-pages.yml)
[![Play on Pages](https://img.shields.io/badge/Play-GitHub%20Pages-222?logo=githubpages&logoColor=white)](https://vedjuk.github.io/Vector-Keep/)
[![Canvas 2D](https://img.shields.io/badge/Canvas-2D-e34f26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

A browser-based **Star Castle–style vector siege**: rotating energy rings with gaps, a central gun that shoots back, homing mines, inertia flight, shields, and a high score saved locally. Built with **TypeScript**, **Vite**, and the **Canvas 2D** API—no game engine, small bundle, runs anywhere you can host static files.

**Fan tribute.** Vector Keep is inspired by classic late-70s / early-80s coin-op vector games (including Cinematronics-style castle shooters). It is **not** affiliated with any rights holder, and it does not use original ROM assets, logos, or sampled audio.

---

## Play

| | |
| :-- | :-- |
| **Live (GitHub Pages)** | [**Play on GitHub Pages →**](https://vedjuk.github.io/Vector-Keep/) |
| **Local** | See below |

Open the live link or run locally, then press **Space** or **Enter** to start.

```bash
npm install
npm run dev
```

Vite prints a URL (usually `http://localhost:5173`).

---

## Controls

| Action | Keys |
|--------|------|
| Start (title) / Restart (game over) | **Space**, **Enter** |
| Rotate | **←** **→** or **A** **D** |
| Thrust | **↑** or **W** |
| Fire | **Space** (up to 4 shots on screen) |
| Shield | **Shift** (hold; uses energy, recharges) |
| Pause | **P** |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve `dist/` locally (good check before deploy) |

**Requirements:** [Node.js](https://nodejs.org/) 20+ recommended (LTS).

---

## Deploying

**GitHub Pages (this repo):** Pushes to `main` run [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)—`npm ci`, `npm run build`, then publish `dist/`. In the repo **Settings → Pages**, set **Source** to **GitHub Actions**.

`vite.config.ts` sets [`base`](https://vite.dev/config/shared-options.html#base) to `/Vector-Keep/` so asset URLs match `https://vedjuk.github.io/Vector-Keep/`. If you fork or rename the repo, update `base` to `/YourRepoName/` (with trailing slash), rebuild, and push.

**Other hosts:** After `npm run build`, upload the contents of **`dist/`** anywhere that serves static files. For a site at the domain root (not a subpath), use `base: '/'`.

---

## Project layout

```
src/
  main.ts              # Canvas + game loop bootstrap
  game/                # Loop, constants, Game orchestration
  entities/            # Ship, bullets, castle (rings + core), mines
  systems/             # Input, collision
  render/              # Canvas drawing (vector look, HUD, title)
  audio/               # Web Audio beeps
```

---

## License

This project is licensed under the [MIT License](LICENSE).

Permission is hereby granted to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, subject to the conditions in the license file. **The software is provided “as is,” without warranty of any kind.**

The MIT license applies to **this project’s source code and assets** only. It does not grant any rights in third-party trademarks or in the classic games that inspired this tribute.
