@echo off
cd /d "%~dp0"
echo SHOPEE FLOW 360 - servidor local
echo Abra a URL exibida abaixo. Para encerrar, pressione Ctrl+C.
call npm run dev
pause
