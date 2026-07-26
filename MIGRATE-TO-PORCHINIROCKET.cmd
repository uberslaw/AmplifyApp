@echo off
setlocal EnableExtensions
title ONE-TIME: publish Porchini game to PorchiniRocket
REM ============================================================================
REM Publishes the last full game handoff into:
REM   Folder:  C:\Porchini Rocket
REM   GitHub:  https://github.com/uberslaw/PorchiniRocket
REM Then removes CopperHead-tmp. CopperHead stays a separate .NET app.
REM ============================================================================

set "GIT=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if not exist "%GIT%" set "GIT=git"

set "GAME=C:\Porchini Rocket"
set "REMOTE=https://github.com/uberslaw/PorchiniRocket.git"
set "TMP=%USERPROFILE%\PorchiniMigrateTmp"
REM Last CopperHead commit that still contains porchini-racer/ (v0.8.1 + Lab)
set "HANDOFF_SHA=9a771c3c1b93b649f0440a6584c00eb1ee0a9313"

echo.
echo Target folder: %GAME%
echo Target remote: %REMOTE%
echo Handoff SHA:   %HANDOFF_SHA%
echo.

if exist "%TMP%" rmdir /s /q "%TMP%"
"%GIT%" clone --filter=blob:none https://github.com/uberslaw/CopperHead.git "%TMP%"
if errorlevel 1 (
  echo Clone of CopperHead failed.
  pause
  exit /b 1
)

pushd "%TMP%"
"%GIT%" checkout "%HANDOFF_SHA%"
if errorlevel 1 (
  echo Checkout %HANDOFF_SHA% failed.
  popd
  pause
  exit /b 1
)
if not exist "%TMP%\porchini-racer\package.json" (
  echo porchini-racer missing at handoff commit.
  popd
  pause
  exit /b 1
)
popd

if not exist "%GAME%" (
  echo Cloning empty/new PorchiniRocket into %GAME% ...
  "%GIT%" clone "%REMOTE%" "%GAME%"
  if errorlevel 1 (
    echo.
    echo Clone failed. Create the repo on GitHub if needed, ensure you can access it,
    echo then mkdir and:  git init   in "%GAME%"
    mkdir "%GAME%" 2>nul
    pushd "%GAME%"
    "%GIT%" init
    "%GIT%" remote add origin "%REMOTE%"
    "%GIT%" checkout -b main
    popd
  )
)

REM Backup any existing Art\source
if exist "%GAME%\Art\source" (
  mkdir "%GAME%\Art\_backup_source" 2>nul
  xcopy /E /Y /I "%GAME%\Art\source" "%GAME%\Art\_backup_source\" >nul
)

echo Copying game files into %GAME% ...
xcopy /E /Y /I "%TMP%\porchini-racer\*" "%GAME%\"
if errorlevel 1 (
  echo xcopy failed.
  pause
  exit /b 1
)

REM Kill nested leftovers from older workflows
if exist "%GAME%\porchini-racer" rmdir /s /q "%GAME%\porchini-racer"

cd /d "%GAME%"
"%GIT%" remote remove origin 2>nul
"%GIT%" remote add origin "%REMOTE%"
"%GIT%" remote set-url origin "%REMOTE%"
"%GIT%" branch -M main
"%GIT%" add -A
"%GIT%" status
"%GIT%" commit -m "Initial Porchini Rocket game (v0.8.1 standalone from handoff)"
if errorlevel 1 (
  echo Commit skipped or failed — may already be clean. Trying push anyway.
)
"%GIT%" push -u origin main
if errorlevel 1 (
  echo.
  echo PUSH FAILED. Fix GitHub login / RepoSync auth for PorchiniRocket, then:
  echo   cd /d "%GAME%"
  echo   git push -u origin main
  pause
  exit /b 1
)

rmdir /s /q "%TMP%" 2>nul
if exist "%USERPROFILE%\CopperHead-tmp" (
  echo Removing %USERPROFILE%\CopperHead-tmp ...
  rmdir /s /q "%USERPROFILE%\CopperHead-tmp"
)

echo.
echo ============================================================
echo  DONE.
echo    Folder:  C:\Porchini Rocket
echo    GitHub:  https://github.com/uberslaw/PorchiniRocket
echo  Update RepoSync to that path + URL.
echo  Open C:\Porchini Rocket in Cursor for future game agents.
echo  CopperHead is unrelated — keep it for the other app only.
echo ============================================================
echo.
cd /d "%GAME%"
call npm install
echo Next:  npm run dev   or  dev-loop.cmd
echo Menu should show:  v0.8.1 · 2026-07-26 03:40 UTC
pause
endlocal
