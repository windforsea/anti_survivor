@echo off
cd /d "%~dp0"
title Vampire Survivors Web Game Server

echo ====================================================
echo   Vampire Survivors 웹 게임 서버를 시작합니다...
echo ====================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [오류] Node.js가 설치되어 있지 않거나 환경변수 PATH에 등록되어 있지 않습니다.
    echo Node.js(https://nodejs.org)가 정상적으로 설치되어 있는지 확인해 주세요.
    echo.
    pause
    exit /b 1
)

echo 잠시 후 기본 웹 브라우저에서 게임이 실행됩니다...
start http://localhost:3000

node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [알림] 서버가 종료되었습니다.
    pause
)
