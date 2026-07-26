# Porchini Racer — local agent handover

**Canonical project (only):**

| | |
|---|---|
| GitHub | https://github.com/uberslaw/PorchiniRacer (`main`) |
| Disk | `C:\Porchini Racer` |
| Open in Cursor | Folder `C:\Porchini Racer` (linked to PorchiniRacer) |

Do **not** use CopperHead, `CopperHead-tmp`, or a nested `porchini-racer\` folder for this game.

---

## Day-to-day sync

```bat
cd /d "C:\Porchini Racer"
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" pull origin main
npm install
npm run dev
```

Or RepoSync → Porchini Racer → Sync, then `dev-loop.cmd`.

**Commit local art/code:** RepoSync Commit → Push (or `git add -A && git commit && git push`).

Backup art before big resets: copy `Art\source` somewhere safe.

---

## Lab / tuning (v0.8+)

Settings → **Lab / Tuning**, or main menu **Lab Run (test)**:

- God mode, rocket speeds, gate size/spacing/frequency  
- Fast gates, resizing, bouncy, resize+bounce  
- Reaction mode → report on pause / end  

---

## RepoSync Vite apps

Set `appKind: "vite-web"` (or auto-detect `vite.config.*`). Relaunch should run `npm run dev`, not `dotnet` / `App.exe`. Until then: **uncheck Relaunch on Update**.

Details: `docs/reposync-vite.md`.

---

## Verify

- [ ] Menu stamp is latest `src/version.ts`  
- [ ] `git remote -v` shows `uberslaw/PorchiniRacer` only  
- [ ] No `CopperHead-tmp` in the workflow  
- [ ] Game root has `package.json`, `src\`, `Art\` (not nested under `porchini-racer\`)  
