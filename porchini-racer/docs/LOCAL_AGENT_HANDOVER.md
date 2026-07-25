# Porchini Racer — local agent handover

Use this when continuing work in a **local Cursor agent** on the Windows machine that has `C:\Porchini Racer`. Prefer local for art uploads (cloud/mobile often only delivers an image *description*, not the file bytes).

---

## What this project is

| | |
|---|---|
| **Game** | Vite + TypeScript + Canvas 2D side-scroller |
| **Play path** | `C:\Porchini Racer` → `npm run dev` → browser `http://localhost:5173` |
| **Canonical game GitHub** | https://github.com/uberslaw/PorchiniRacer (`main`) |
| **Agent / cloud handoff repo** | https://github.com/uberslaw/CopperHead branch `cursor/mushroom-blaze-racer-dde7` folder `porchini-racer/` |
| **Latest stamp** | **v0.7.5 · 2026-07-25 13:15 UTC** (`src/version.ts`) |

Cloud Cursor agents historically could **write CopperHead** but not always **read/write PorchiniRacer** (private + GitHub App install scope). Local agents on the laptop can use both if `gh`/git is signed in as the user.

---

## Current gameplay (as of v0.7.5)

- Side-scroll: mushroom rocket through single-colour ROYGBIV gates
- Clear = fly through the **full art hollow** (gates drawn mostly face-on; not a tiny foreshortened bullseye)
- Successful clear → gate **shatters** into ~1000 shards of its spectrum colour (~1s fade)
- Triple gate spacing; ~50% larger gates on Easy/Normal; no wobble yet
- Rush gates every 1st/3rd/5th/7th (rolled per run)
- Buffalo wing powerup ~every 60s: meteor shield + free miss charges
- Art: `Art/Porcini base image.png`, `Art/Buffalo wing.png` (from `Art/source/` with BG removed)
- Arrow/WASD move +50% vs early builds

### Key source files

| File | Role |
|---|---|
| `src/game.ts` | Main loop, menus, wiring |
| `src/collision.ts` | Gate clear / rim / miss (art-boundary hollow) |
| `src/shatter.ts` | Gate break-up particles |
| `src/gates.ts` | Spawn, rush, spacing |
| `src/powerups.ts` | Buffalo wings |
| `src/render.ts` | Draw gates / player |
| `src/assets.ts` | Load `Art/` sprites |
| `Art/source/` | White-BG originals |
| `vite.config.ts` | Serves/copies `Art/` |

---

## Sync without losing data (Windows)

### A) Pull latest agent work (CopperHead → local game folder)

Does **not** delete your `Art/source` or uncommitted work if you copy carefully:

```bat
cd %USERPROFILE%\CopperHead-tmp
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" fetch origin
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" checkout cursor/mushroom-blaze-racer-dde7
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" pull origin cursor/mushroom-blaze-racer-dde7

:: Backup local art first (optional but safe)
mkdir "C:\Porchini Racer\Art\_backup" 2>nul
xcopy /E /Y /I "C:\Porchini Racer\Art\source" "C:\Porchini Racer\Art\_backup\source\"

:: Overlay agent game files onto the play folder
xcopy /E /Y /I "%USERPROFILE%\CopperHead-tmp\porchini-racer\*" "C:\Porchini Racer\"

cd /d "C:\Porchini Racer"
npm install
npm run dev
```

Then **Ctrl+F5** in the browser. Confirm the menu version stamp.

### B) Push local art / fixes to PorchiniRacer (RepoSync)

1. Put files where the game loads them:
   - `Art\Porcini base image.png`
   - `Art\Buffalo wing.png`
   - keep originals in `Art\source\`
2. RepoSync → **Porchini Racer** → **Commit** → **Push**
3. Status should become **Up to date** (not `↑ N not on main`)

### C) Avoid losing work

| Do | Don’t |
|---|---|
| Commit/Push before Sync if you have local edits | **Reset to GitHub** unless you mean to discard |
| Backup `Art\source` before big xcopies | Rely on **Merge cursor/** (needs full branch name; often wrong repo) |
| Uncheck **Relaunch on Update** until Vite handoff exists | Expect Sync alone to start the game |

---

## RepoSync: Vite / web-app relaunch

Today **Relaunch on Update** assumes a **.NET** app (`App.exe`, `dotnet build`). Porchini Racer is **Node + Vite** — that handoff is wrong.

### Recommended product change (RepoSync repo)

Add a per-repo **app kind** (or auto-detect) and branch the handoff.

#### 1) Detection (auto)

In order, treat as **vite-web** if any of these exist in the repo root (or configured subfolder):

- `package.json` with scripts `dev` and/or `build`, and dependency/devDependency `vite`
- `vite.config.ts` / `vite.config.js`
- `index.html` + `src/main.ts` (or `src/main.tsx`) without a `*.csproj`

Treat as **dotnet** if `*.csproj` / `App.exe` under `bin\`.

Optional override in `repos.json` per entry:

```json
{
  "name": "Porchini Racer",
  "path": "C:\\Porchini Racer",
  "url": "https://github.com/uberslaw/PorchiniRacer",
  "appKind": "vite-web"
}
```

Values: `"dotnet"` | `"vite-web"` | `"none"` (sync only).

#### 2) UI switch

In repo edit / More menu:

- **App type:** Auto / .NET / Vite web / None  
- **Relaunch on Update** only enabled when type ≠ None

#### 3) Vite handoff script (replace Finish-RepoSyncUpdate.ps1 behaviour)

After pull, for `vite-web`:

1. `cd` to repo path  
2. `npm install` (if `node_modules` missing or `package-lock.json` newer)  
3. Stop any process listening on the Vite port (default **5173**) or matching `node.*vite`  
4. Start `npm run dev` in a **kept-open** console (or reuse `dev-loop.cmd`)  
5. Optionally `Start-Process` the printed localhost URL  
6. Log under `logs\reposync-vite-*.log`

Sketch:

```powershell
# Finish-RepoSyncUpdate-Vite.ps1
param($RepoPath, $Port = 5173)
Set-Location $RepoPath
if (-not (Test-Path node_modules)) { npm install }
# kill old vite if any
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Process cmd.exe -ArgumentList '/k','npm run dev' -WorkingDirectory $RepoPath
```

Ship `dev-loop.cmd` already in Porchini Racer for manual restarts.

#### 4) What not to do for this app

- Do not run `dotnet build` / look for `App.exe`
- Do not fail the sync if no `.exe` appears

---

## Moving this chat to a local agent

1. Open Cursor **on the Windows machine** with folder `C:\Porchini Racer` (or CopperHead checkout).
2. Paste this file + ask to continue from **v0.7.5**.
3. For art: drop files into `Art\source\` — local agents can usually read disk paths / attachments better than cloud mobile.
4. Prefer committing to **PorchiniRacer** from the local machine; use CopperHead only if the cloud agent must ship code.

### Cloud agent limitations (why local helps)

- Mobile image attachments often arrive as **descriptions only**
- GitHub App token for a cloud run may be scoped to the launch repo (CopperHead) even when PorchiniRacer is selected in the install UI
- Workaround that worked: push `Art/source` to CopperHead `porchini-racer/Art/source`, process there, xcopy back

---

## Quick verify checklist

- [ ] Menu stamp is latest version  
- [ ] Gates clear through the full hollow (not a tiny centre circle)  
- [ ] Clear → coloured shatter ~1s  
- [ ] Wing + rocket sprites load (no checkerboard)  
- [ ] RepoSync: Relaunch on Update off **or** vite-web handoff installed  
- [ ] `Art/source` originals still present after sync  
