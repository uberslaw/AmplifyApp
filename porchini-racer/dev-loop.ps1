# Porchini Racer — keep-open terminal loop
# Stop server → git sync → npm install (if needed) → npm run dev
# Terminal stays open. Ctrl+C stops the server and returns to the menu.
#
# Usage (from C:\Porchini Racer):
#   powershell -ExecutionPolicy Bypass -File .\dev-loop.ps1
# Or right-click → Run with PowerShell

$ErrorActionPreference = 'Continue'
Set-Location -Path $PSScriptRoot

function Write-Banner {
  param([string]$Text)
  Write-Host ''
  Write-Host "======== $Text ========" -ForegroundColor Cyan
}

function Stop-DevServer {
  Write-Banner 'Stopping server (port 5173 / vite)'
  $killed = $false

  # Prefer killing whatever is listening on Vite's default port
  try {
    $conns = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
      $procId = $c.OwningProcess
      if ($procId -and $procId -ne 0) {
        Write-Host "  Killing PID $procId (port 5173)"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        $killed = $true
      }
    }
  } catch {
    # Get-NetTCPConnection may need admin / not available — fall through
  }

  # Also stop node processes started from this folder (best-effort)
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'vite' -or $_.CommandLine -match [regex]::Escape($PSScriptRoot) } |
    ForEach-Object {
      Write-Host "  Killing node PID $($_.ProcessId)"
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      $killed = $true
    }

  if (-not $killed) {
    Write-Host '  No running Vite/node server found (ok).'
  }
  Start-Sleep -Milliseconds 400
}

function Sync-Git {
  Write-Banner 'Git sync'
  if (-not (Test-Path (Join-Path $PSScriptRoot '.git'))) {
    Write-Host '  Not a git repo — skipping fetch/pull.' -ForegroundColor Yellow
    return
  }

  git remote -v
  Write-Host ''
  git fetch --prune origin 2>&1 | ForEach-Object { Write-Host "  $_" }

  $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
  if (-not $branch) { $branch = 'main' }
  Write-Host "  Branch: $branch"

  git pull --ff-only origin $branch 2>&1 | ForEach-Object { Write-Host "  $_" }
  if ($LASTEXITCODE -ne 0) {
    Write-Host '  ff-only pull failed (local changes or divergence).' -ForegroundColor Yellow
    Write-Host '  Fix with git status, or continue without pull.' -ForegroundColor Yellow
  }

  # Show version stamp from source if present
  $verFile = Join-Path $PSScriptRoot 'src\version.ts'
  if (Test-Path $verFile) {
    $ver = Select-String -Path $verFile -Pattern "GAME_VERSION|GAME_BUILD_UTC" | ForEach-Object { $_.Line.Trim() }
    Write-Host ''
    Write-Host '  Build stamp in src/version.ts:' -ForegroundColor Green
    $ver | ForEach-Object { Write-Host "    $_" }
  }
}

function Ensure-Deps {
  if (-not (Test-Path (Join-Path $PSScriptRoot 'node_modules'))) {
    Write-Banner 'npm install (first time / missing node_modules)'
    npm install
  }
}

function Start-DevServer {
  Write-Banner 'Starting npm run dev'
  Write-Host '  Open the URL Vite prints (usually http://localhost:5173)'
  Write-Host '  Hard-refresh browser with Ctrl+F5 after it starts.'
  Write-Host '  Press Ctrl+C here to stop the server and return to the menu.' -ForegroundColor Yellow
  Write-Host ''
  npm run dev
}

function Show-Menu {
  Write-Host ''
  Write-Host 'Porchini Racer — dev loop' -ForegroundColor Magenta
  Write-Host "Folder: $PSScriptRoot"
  Write-Host ''
  Write-Host '  [Enter]  Stop → git pull → start server'
  Write-Host '  [S]      Sync git only (no server)'
  Write-Host '  [R]      Restart server only (no git)'
  Write-Host '  [I]      npm install + restart'
  Write-Host '  [Q]      Quit'
  Write-Host ''
}

# ---- main loop ----
while ($true) {
  Show-Menu
  $choice = Read-Host 'Choice'
  if (-not $choice) { $choice = 'enter' }
  $choice = $choice.Trim().ToLowerInvariant()

  switch ($choice) {
    { $_ -in @('enter', 'e', '') } {
      Stop-DevServer
      Sync-Git
      Ensure-Deps
      Start-DevServer
    }
    's' {
      Sync-Git
    }
    'r' {
      Stop-DevServer
      Ensure-Deps
      Start-DevServer
    }
    'i' {
      Stop-DevServer
      Write-Banner 'npm install'
      npm install
      Start-DevServer
    }
    'q' {
      Stop-DevServer
      Write-Host 'Bye.'
      exit 0
    }
    default {
      Write-Host "Unknown choice: $choice" -ForegroundColor Yellow
    }
  }
}
