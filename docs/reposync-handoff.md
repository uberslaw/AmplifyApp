# RepoSync — handoff for agent sessions

RepoSync is a **local Windows tray app** that syncs GitHub repos to disk.

## Porchini Racer (separate from CopperHead)

| | |
|---|---|
| GitHub | https://github.com/uberslaw/PorchiniRacer |
| Path | `C:\Porchini Racer` |
| Kind | Vite web (`appKind: "vite-web"`) |

Do **not** sync the game from CopperHead. CopperHead is a different .NET app.

Vite relaunch notes live in the PorchiniRacer repo: `docs/reposync-vite.md`.

## CopperHead (this repo)

| | |
|---|---|
| GitHub | https://github.com/uberslaw/CopperHead |
| Path | wherever you keep CopperHead locally |
| Kind | .NET WinForms (`App.exe`) |

## Status phrases

| Message | Meaning |
|---|---|
| Up to date | Local branch matches remote |
| ↑ N not on main | Local commits need **Push** |
| ↓ N on GitHub | Need **Sync** / pull |
| Local edits | Uncommitted changes — Commit first |

## Remotes

- **origin** — primary GitHub URL for that folder  
- Do not use CopperHead as a handoff remote for Porchini Racer  
