# amplifyapp

Personal projects monorepo.

## Projects

| Path | Description |
|---|---|
| [`mushroom-racer/`](mushroom-racer/) | **Mushroom Blaze** — web side-scroller: flaming mushroom through rainbow gates |
| [`src/CopperHead`](src/CopperHead) | WinForms utility — hostname routes via a chosen adapter |
| [`docs/hosts-cursor.txt`](docs/hosts-cursor.txt) | Optional shared Cursor hostname list for CopperHead **Fetch list** |

## Mushroom Blaze (quick start)

Works the same on Windows, macOS, and Linux (install [Node.js](https://nodejs.org/) first):

```bash
cd mushroom-racer
npm install
npm run dev
```

Catch Nyan Cat for power-ups; rare Nyan Boss flybys award bigger bonuses. See [`mushroom-racer/README.md`](mushroom-racer/README.md) for controls and build notes.

## CopperHead (quick start)

```powershell
cd src\CopperHead
dotnet publish -c Release -r win-x64 --self-contained false -o ..\..\publish
Start-Process ..\..\publish\CopperHead.exe -Verb RunAs
```

See [`src/CopperHead/README.md`](src/CopperHead/README.md) for build and usage.
