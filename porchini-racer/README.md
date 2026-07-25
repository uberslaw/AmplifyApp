# Porchini Racer

Side-scrolling space chase: ride a flaming giant mushroom, collect a full rainbow spectrum through single-colour gates to speed up (with a rainbow jet trail), dodge meteors, and catch **Nyan Cat**.

**Repo:** https://github.com/uberslaw/PorchiniRacer

## Play (Mac / Windows / Linux)

Needs [Node.js](https://nodejs.org/) 18+:

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Menus

- **New Game** — start a run with current settings  
- **Continue** — load a saved mid-run (browser `localStorage`)  
- **Settings** — Difficulty, Character, Vehicle / rocket type  
- **High Scores** — top runs on this device  
- **Exit Game** — leave (or thanks screen if the browser blocks tab close)  
- **Pause (Esc / P)** — Resume, Save Game, Settings, Quit to Menu  

### Vehicles (rockets)

| Vehicle | Feel |
|---|---|
| Blaze Cap | Balanced starter |
| Comet Cap | Faster, snappier |
| Bunker Cap | Slower, tougher hitbox |
| Spore Dart | Fastest, unforgiving |

## Gameplay

- Gates are **one** ROYGBIV colour each.  
- Fill all seven → **full spectrum** → speed up + **rainbow trail** out the back.  
- Catch Nyan after enough spectra (depends on difficulty).  
- Fail on meteor hit or too many missed gates.

## Controls

| Input | Action |
|---|---|
| `W` / `S` or `↑` / `↓` | Steer |
| `Space` / `D` | Boost |
| `P` / `Esc` | Pause |
| Touch drag / right side | Steer / boost |
