# Mushroom Blaze

Side-scrolling space chase: ride a flaming giant mushroom, collect a full rainbow spectrum through single-colour gates to speed up, dodge meteors, and catch **Nyan Cat** riding ahead on rainbow power.

## Where this lives

| Place | Path |
|---|---|
| **GitHub repo** | [github.com/uberslaw/CopperHead](https://github.com/uberslaw/CopperHead) |
| **Game folder in repo** | `mushroom-racer/` |
| **PR branch** | `cursor/mushroom-blaze-racer-dde7` ([PR #7](https://github.com/uberslaw/CopperHead/pull/7)) |
| Cloud agent workspace | `/workspace/mushroom-racer` |

On Windows after clone, typical path:

`C:\Users\<you>\CopperHead\mushroom-racer`

A dedicated game repo is fine if you prefer — create it on GitHub and we can retarget the remote. Until then, changes push to the CopperHead branch above.

## Play (Windows / macOS / Linux)

Needs [Node.js](https://nodejs.org/) 18+:

```bash
cd mushroom-racer
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Gameplay

- Each gate is **one** rainbow colour (R O Y G B I V), not a full rainbow rim.
- Fly through the hollow middle to collect that colour. Fill all seven for a **full spectrum** → speed boost.
- Repeat spectra to close the gap on **Nyan Cat** (ahead / off-screen at first; marker on the right).
- Catch Nyan after **3** full spectra when you reach them.
- Fail if you hit a **meteor**, or miss / clip **3 gates**.

## Controls

| Input | Action |
|---|---|
| `W` / `S` or `↑` / `↓` | Steer |
| `Space` / `D` / `→` | Boost |
| `P` / `Esc` | Pause |
| Touch drag / right side | Steer / boost |
