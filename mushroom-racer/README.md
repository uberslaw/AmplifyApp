# Mushroom Blaze

Side-scrolling space racer: ride a flaming giant mushroom through side-on rainbow portal gates, dodge raining meteors, and catch **Nyan Cat** (plus the rare **Nyan Boss**).

## Play (macOS / Linux / Windows)

Needs [Node.js](https://nodejs.org/) 18+ (LTS is fine). Same commands work in **PowerShell**, **Command Prompt**, or Windows Terminal:

```bash
cd mushroom-racer
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the build
```

On Windows, if `npm` is not found, install Node from nodejs.org and reopen the terminal.

## Controls

| Input | Action |
|---|---|
| `W` / `S` or `↑` / `↓` | Steer up / down |
| `Space` / `D` / `→` | Boost |
| `P` / `Esc` | Pause |
| Touch drag | Steer |
| Touch right side | Boost |

## Gameplay

- Fly through the hollow middle of side-on rainbow portal gates to score. Clip the rim or miss and the run ends.
- Gates keep **ROYGBIV** colour order on geometric shapes: triangle, circle, square, star, arch, hexagon.
- Background is an outer-space starfield; **meteors** rain down — steer to avoid them.
- **Nyan Cat** flies across with a rainbow trail — steer into it to catch it.
  - Power-up: score multiplier, brief invulnerability, rainbow thrust.
- **Nyan Boss** (rarer, after some distance): bigger, wilder flight path, bigger score + longer power.
- Best score is saved in the browser (`localStorage`).
