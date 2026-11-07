@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo          ResumeFit AI — GitHub ^& Render Push
echo =======================================================
echo.

set /p REPO_URL="Enter your GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo [ERROR] No repository URL entered. Exiting.
    pause
    exit /b 1
)

echo.
echo [*] Checking existing git remote...
git remote remove origin 2>nul

echo [*] Adding origin: %REPO_URL%
git remote add origin %REPO_URL%

echo [*] Pushing to GitHub (branch: master)...
git push -u origin master

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo =======================================================
    echo.
    echo Opening Render Blueprint Dashboard...
    start https://dashboard.render.com/blueprints
    echo.
    echo In Render:
    echo 1. Click "New Blueprint Instance"
    echo 2. Connect this repository
    echo 3. Click "Apply" to launch both Backend and Frontend!
    echo.
) else (
    echo.
    echo [!] Push failed. Please check your credentials or repo permissions.
)

pause

