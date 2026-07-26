@echo off
setlocal EnableExtensions
title ONE-TIME: migrate Porchini Racer off CopperHead
REM ============================================================================
REM Run this ONCE on Windows. It:
REM   1) Pulls the last CopperHead commit that still contains the game
REM   2) Writes files into C:\Porchini Racer  (game root — no nested folder)
REM   3) Commits + pushes to https://github.com/uberslaw/PorchiniRacer
REM   4) Deletes temp folders including CopperHead-tmp
REM After this, never use CopperHead for the game again.
REM ============================================================================

set "GIT=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if not exist "%GIT%" set "GIT=git"

set "GAME=C:\Porchini Racer"
set "TMP=%USERPROFILE%\PorchiniMigrateTmp"
REM Filled automatically when this script is published — last commit WITH porchini-racer/
set "HANDOFF_SHA=9a771c3c1b93b649f0440a6584c00eb1ee0a9313"

if "%HANDOFF_SHA%"=="REPLACE_WITH_SHA" (
  echo ERROR: HANDOFF_SHA not set. Pull the latest CopperHead branch that includes this script.
  pause
  exit /b 1
)

echo.
echo Game folder: %GAME%
echo Handoff SHA: %HANDOFF_SHA%
echo.

if exist "%TMP%" rmdir /s /q "%TMP%"
"%GIT%" clone --filter=blob:none https://github.com/uberslaw/CopperHead.git "%TMP%"
if errorlevel 1 (
  echo Clone failed.
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
  echo porchini-racer missing at that commit.
  popd
  pause
  exit /b 1
)
popd

if not exist "%GAME%" mkdir "%GAME%"

REM Keep source art backup
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

REM Remove mistaken nested copy from older workflows
if exist "%GAME%\porchini-racer" (
  echo Removing nested %GAME%\porchini-racer ...
  rmdir /s /q "%GAME%\porchini-racer"
)

cd /d "%GAME%"
"%GIT%" remote set-url origin "https://github.com/uberslaw/PorchiniRacer"
"%GIT%" checkout main 2>nul
"%GIT%" add -A
"%GIT%" status
"%GIT%" commit -m "Standalone Porchini Racer (migrated off CopperHead handoff)"
if errorlevel 1 (
  echo Nothing to commit or commit failed — check status. Continuing to push if possible.
)
"%GIT%" push -u origin main
if errorlevel 1 (
  echo Push failed — sign in to GitHub / check RepoSync credentials, then: git push -u origin main
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
echo  DONE. Use only:
echo    Folder:  C:\Porchini Racer
echo    GitHub:  https://github.com/uberslaw/PorchiniRacer
echo  Open that folder in Cursor for future agents.
echo  CopperHead is unrelated — leave it alone for the other app.
echo ============================================================
echo.
cd /d "%GAME%"
call npm install
echo Run:  npm run dev   or double-click dev-loop.cmd
pause
endlocal
