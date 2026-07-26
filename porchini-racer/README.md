# Porchini Racer

Side-scrolling space chase: ride a flaming giant mushroom, collect a full rainbow spectrum through single-colour gates, dodge meteors, and catch **Nyan Cat**.

| | |
|---|---|
| **GitHub** | https://github.com/uberslaw/PorchiniRacer |
| **Local (Windows)** | `C:\Porchini Racer` |
| **Stack** | Vite + TypeScript + Canvas 2D |

This project is **standalone**. It is not part of CopperHead.

## Play

Needs [Node.js](https://nodejs.org/) 18+:

```bat
cd /d "C:\Porchini Racer"
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). Hard-refresh with **Ctrl+F5** after updates. Confirm the menu stamp (`vX.Y.Z · … UTC`).

### Windows keep-open loop

Double-click **`dev-loop.cmd`**. Press **Enter** to stop server → `git pull` → `npm run dev`.

## RepoSync

- Watch **https://github.com/uberslaw/PorchiniRacer** → folder `C:\Porchini Racer`
- **Uncheck Relaunch on Update** until Vite handoff exists (this is not a .NET `App.exe`)
- After Sync: `npm install` (if needed) → `npm run dev` or `dev-loop.cmd`

See `docs/LOCAL_AGENT_HANDOVER.md` and `docs/reposync-vite.md`.

## Menus

- **New Game** / **Lab Run (test)** — Lab = god mode + tuning knobs  
- **Settings** → Difficulty, Character, Vehicle, Controls, **Lab / Tuning**  
- **High Scores**, **Pause** (Esc / P)

## Gameplay

- Single-colour ROYGBIV gates; clear the **art hollow** → shatter  
- Full spectrum → rainbow trail + speed  
- Buffalo wing powerups (~every minute)  
- Lab: god mode, gate/rocket tunables, reaction-time report  

## Controls

| Input | Action |
|---|---|
| `W`/`S` or `↑`/`↓` | Up / down |
| `A`/`D` or `←`/`→` | Back / forward |
| `Space` | Boost |
| `P` / `Esc` | Pause |
