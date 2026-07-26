# Porchini Rocket — agent handover

Use this when starting a **new Cursor agent** on the standalone game repo.

| | |
|---|---|
| **GitHub (canonical)** | https://github.com/uberslaw/PorchiniRocket |
| **Local Windows path** | `C:\Porchini Rocket` |
| **Stack** | Vite + TypeScript + Canvas 2D |
| **Last known build** | **v0.8.1 · 2026-07-26 03:40 UTC** (`src/version.ts`) |
| **Not this project** | CopperHead (separate .NET app). Do not put game code under CopperHead. |

---

## 1) Auth / repo access (do this first)

1. Create or open https://github.com/uberslaw/PorchiniRocket  
2. GitHub → Settings → Applications → **Cursor** → Configure → repository access includes **PorchiniRocket** (or “All repositories”) → **Save**  
3. Start the new Cursor cloud agent **from PorchiniRocket** (not from CopperHead)  
4. Local Cursor: **File → Open Folder** → `C:\Porchini Rocket`

If the agent was started on CopperHead, it often cannot push to PorchiniRocket even when the app install lists that repo.

---

## 2) Get the code onto PorchiniRocket (one-time)

### Option A — Windows migrate script (recommended)

On the machine with Git:

```bat
cd %USERPROFILE%
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" clone https://github.com/uberslaw/CopperHead.git CopperHead-tmp
cd CopperHead-tmp
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" checkout cursor/mushroom-blaze-racer-dde7
MIGRATE-TO-PORCHINIROCKET.cmd
```

That script:

- Checks out handoff commit `9a771c3c1b93b649f0440a6584c00eb1ee0a9313` (full `porchini-racer/` tree, v0.8.1)  
- Copies into **`C:\Porchini Rocket`** (repo root — no nested `porchini-racer\`)  
- Pushes **`main`** to https://github.com/uberslaw/PorchiniRocket  
- Deletes `CopperHead-tmp`

### Option B — Unpack this zip

1. Clone PorchiniRocket → `C:\Porchini Rocket` (or empty folder + `git init`)  
2. Copy **contents** of `porchini-racer\*` into `C:\Porchini Rocket\` (not a nested folder)  
3. Then:

```bat
cd /d "C:\Porchini Rocket"
git add -A
git commit -m "Import v0.8.1 Porchini Rocket"
git remote add origin https://github.com/uberslaw/PorchiniRocket.git
git branch -M main
git push -u origin main
npm install
npm run dev
```

### Option C — Paste this to the new agent (on PorchiniRocket)

```text
You are working in uberslaw/PorchiniRocket only (local: C:\Porchini Rocket).
Vite + TypeScript Canvas game. Do not touch CopperHead.

If the repo is empty or missing the game, import from public CopperHead commit
9a771c3c1b93b649f0440a6584c00eb1ee0a9313 path porchini-racer/ into this repo ROOT,
commit and push main. No nested porchini-racer folder.

Confirm menu stamp v0.8.1+. Read PORCHINI_ROCKET_HANDOVER.md / README.md.
Bump src/version.ts when shipping.
```

---

## 3) Day-to-day after cutover

```bat
cd /d "C:\Porchini Rocket"
git pull origin main
npm install
npm run dev
```

Or **`dev-loop.cmd`**. Confirm menu: **v0.8.1 · 2026-07-26 03:40 UTC**.

**RepoSync:** PorchiniRocket → `C:\Porchini Rocket`. Uncheck **Relaunch on Update** (Vite, not .NET).

---

## 4) Features (v0.8.1)

- Porcini rocket art + buffalo wing powerups (~60s): shield + free misses  
- Face-on gates; clear = art hollow; shatter ~1000 shards  
- Lab / Tuning: god mode, rocket speeds, gate size/spacing/frequency, rush, resize, bounce, reaction report  
- Main menu **Lab Run (test)**

Key files: `src/game.ts`, `tunables.ts`, `reaction.ts`, `gates.ts`, `collision.ts`, `shatter.ts`, `powerups.ts`, `player.ts`, `render.ts`, `assets.ts`, `version.ts`

---

## 5) Pitfalls

1. CopperHead ≠ game  
2. Agent started on CopperHead cannot push here — start on PorchiniRocket  
3. No nested `porchini-racer\` in the game folder  
4. Prefer `Art/source/` on disk for art (mobile uploads often description-only)

---

*Handoff from CopperHead agent; game tree commit `9a771c3`.*
