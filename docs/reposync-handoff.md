# RepoSync — handoff for other agent sessions

Use this when debugging or changing **RepoSync** (the Windows tray/local sync app), or when a user mentions sync status / fleet scan / handoff remotes.

## What RepoSync is

RepoSync is a **local Windows app** that keeps one or more GitHub repositories cloned on disk in sync with GitHub. It is **not** the game, and not Cursor Cloud itself.

Typical traits (from the running UI):

- Runs in the **system tray** (`RepoSync --tray`).
- Can **start at login** via `HKCU\...\Run` → `RepoSync --tray`.
- Manages a **fleet** of repos (examples seen: `RepoSync`, `Heimdall`, `SerraviewDeskTshoot`, `Porchini Racer`).
- Each fleet entry maps to a **local folder** (e.g. Porchini Racer → `C:\Porchini Racer`) and a **GitHub remote URL** (e.g. `https://github.com/uberslaw/PorchiniRacer`).

## What it does with Git

RepoSync is a thin orchestrator around normal `git` commands. A sync of one repo typically looks like:

1. `git remote set-url origin "<github-url>"` — ensure `origin` points at the right repo.
2. Pick the **current default branch** (often `main`).
3. `git fetch --progress --prune origin "+refs/heads/*:refs/remotes/origin/*"` — download commits; prune deleted remote branch names.
4. Stay on / checkout the tracked branch (often `main`).
5. `git pull --ff-only origin "<branch>"` — update local branch **only if fast-forward** is possible (no merge commits from the app).

Important implications:

- **“Up to date”** means local `main` (or configured default) matches what was fetched from GitHub for that branch.
- **`↓ N on GitHub vs main`** means GitHub is **ahead** by N commits (local needs pull/sync). RepoSync’s update check / sync is meant to close that gap.
- Sync **downloads** code; it does **not** install npm deps or start a dev server.
- `--ff-only` will **fail** if local has divergent commits. Then the user must resolve manually (`git status`, merge/rebase/reset) — RepoSync is not a full conflict resolver.

### Remotes: `origin` vs `handoff`

From the app’s own explanation in the log:

- A **remote** is just a nickname for a GitHub URL.
- **`origin`** — usually the user’s primary repo.
- **`handoff`** — often a **second** remote used for agent/cloud branches (e.g. copying work from another repo like CopperHead into the real project repo).

When diagnosing “I have the agent branch but RepoSync says up to date”, check:

- Which remote was fetched (`origin` vs `handoff`).
- Which **branch** is checked out locally vs where the agent pushed.
- Whether the agent pushed to a **different repo** than the folder RepoSync is watching.

## Background loops (UI)

When active, the UI describes roughly:

| Loop | Cadence (approx.) | Purpose |
|---|---|---|
| Fleet scan | ~every **60s** | Local status of all watched repos (often **no** network fetch). |
| Update check | ~every **15m** | Fetches from GitHub to see if remotes moved. |
| Manual “Check now” | On demand | Immediate GitHub fetch / status refresh. |
| Sync \<repo\> | On demand | Full fetch + ff-only pull for one repo. |

Output shows **busy elapsed** time and **next-scan countdown** while work is in progress (“… still working (Ns elapsed)”).

## Status phrases (how to read them)

| Message | Meaning |
|---|---|
| `Using current default branch 'main'` | Sync target branch is `main` (or whatever GitHub reports as default). |
| `Up to date` | Local tracked branch matches remote after last fetch/pull. |
| `↓ N on GitHub vs main` | Remote is ahead by N commits; sync/pull needed. |
| `Already up to date.` (after `git pull`) | Pull found nothing new to apply. |
| `Local status check (no fetch)` | Compared local refs only; may be stale vs GitHub until an update check/sync. |
| `Update check (fetching from GitHub)` | Network fetch; authoritative for “is GitHub ahead?”. |

## What RepoSync does **not** do

- Does not run `npm install` / `npm run dev` / build tools.
- Does not open `http://localhost:5173` for you (Vite only serves while `npm run dev` is running).
- Does not replace Cursor Cloud agents or grant them GitHub App access.
- Does not automatically merge feature branches into `main` unless that’s what was already on `main` on GitHub.

## Common failure patterns

1. **Synced but site blank**  
   Files are on disk; user still needs e.g.  
   `cd "C:\Porchini Racer"` → `npm install` → `npm run dev`.

2. **Agent pushed to repo A; RepoSync watches repo B**  
   Example: agent only had write access to `CopperHead`, game lived under `porchini-racer/` handoff; PorchiniRacer remote stayed empty until user copied/pushed. RepoSync “Up to date” on PorchiniRacer can be correct *and* still miss agent work on another repo/branch.

3. **ff-only pull rejected**  
   Local commits diverged from `origin/main`. Inspect with `git status`, `git log --oneline --graph --all -20`.

4. **Wrong folder / space in path**  
   Paths like `C:\Porchini Racer` need quoting in shells: `cd "C:\Porchini Racer"`.

5. **Node installed but `npm` not found**  
   Restart the terminal (or sign out) after installing Node so `PATH` updates.

## Useful questions to ask the user

- Exact **local path** RepoSync shows for the repo.
- **GitHub URL** for `origin` (and whether a `handoff` remote exists).
- Branch name (`main` vs feature branch).
- Paste of the **Sync** / **Update check** log block.
- Output of (from that folder):

```powershell
cd "C:\path\to\repo"
git remote -v
git branch -vv
git status
git log -5 --oneline
```

## Minimal repro checklist for “sync worked but app doesn’t run”

```powershell
cd "C:\Porchini Racer"   # or the path RepoSync printed
dir                      # expect package.json, src\, index.html
node -v
npm -v
npm install
npm run dev
# then open the URL Vite prints (often http://localhost:5173)
```

## Related repos (context from prior sessions)

| Repo | Role |
|---|---|
| [uberslaw/PorchiniRacer](https://github.com/uberslaw/PorchiniRacer) | The game (Vite + TypeScript). |
| [uberslaw/CopperHead](https://github.com/uberslaw/CopperHead) | Earlier monorepo; cloud agent often scoped here; may contain `porchini-racer/` handoff. |
| RepoSync (user’s app + its own repo) | The sync tray app described above. |

---

**For agents:** Prefer diagnosing with the user’s pasted RepoSync log + `git remote -v` / `git status` from the local path. Do not assume RepoSync started the app or merged agent branches.
