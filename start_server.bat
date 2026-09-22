@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Anti Survivors Web Game Server

echo ====================================================
echo   Anti Survivors 웹 게임 서버를 시작합니다...
echo ====================================================
echo.

where node >nul 2>&1
if errorlevel 1 goto :NO_NODE

echo [1/2] 기본 웹 브라우저를 실행합니다: http://localhost:3000
start http://localhost:3000

echo [2/2] Node.js 게임 서버를 실행합니다...
echo.
echo ====================================================
echo   서버가 실행 중입니다! 종료하려면 이 창을 닫으세요.
echo   (To stop the server, close this window or press Ctrl+C)
echo ====================================================
echo.

node server.js
goto :AFTER_NODE

:NO_NODE
echo.
echo ====================================================
echo [오류] Node.js가 설치되어 있지 않거나 PATH에 등록되지 않았습니다.
echo https://nodejs.org 에서 Node.js를 설치한 후 다시 실행해 주세요.
echo ====================================================
echo.
pause
exit /b 1

:AFTER_NODE
echo.
echo ====================================================
echo [알림] 게임 서버가 종료되었습니다.
echo ====================================================
pause
