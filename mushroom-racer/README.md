# Mushroom Blaze

Side-scrolling racer: ride a flaming giant mushroom through rainbow gates of shifting sizes, shapes, patterns, and speeds. Catch **Nyan Cat** for power-ups — and watch for the rare **Nyan Boss**.

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

- Clear rainbow gates to score. Hit a frame or miss the opening and the run ends.
- **Nyan Cat** flies across with a rainbow trail — steer into it to catch it.
  - Power-up: score multiplier, brief invulnerability, rainbow thrust.
- **Nyan Boss** (rarer, after some distance): bigger, wilder flight path, bigger score + longer power.
- Best score is saved in the browser (`localStorage`).
