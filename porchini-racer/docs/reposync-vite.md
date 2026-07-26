# RepoSync — Vite / Porchini Racer

Porchini Racer is a **Node + Vite** web app, not a .NET exe.

## Per-repo config

```json
{
  "name": "Porchini Racer",
  "path": "C:\\Porchini Racer",
  "url": "https://github.com/uberslaw/PorchiniRacer",
  "appKind": "vite-web"
}
```

## Auto-detect

Treat as `vite-web` if root has `vite.config.ts` / `vite.config.js` or `package.json` with `vite`, and no `*.csproj`.

## After Sync (vite-web)

1. `npm install` if needed  
2. Stop anything on port **5173**  
3. Start `npm run dev` or `dev-loop.cmd`  
4. Do **not** look for `App.exe` / run `dotnet build`

## Until RepoSync supports this

Uncheck **Relaunch on Update** for Porchini Racer. Use `dev-loop.cmd` manually.
