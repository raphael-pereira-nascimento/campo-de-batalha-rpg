@echo off
rem Campo de Batalha RPG - servidor com auto-restart.
rem Mantém o servidor de p�, reiniciando automaticamente caso caia.
rem Pressione Ctrl+C para encerrar de vez.

cd /d "%~dp0"
echo [start] Campo de Batalha RPG - servidor (auto-restart)
echo [start] Pressione Ctrl+C para parar.

:loop
echo [start] %date% %time% - iniciando servidor...
node server/src/index.js >> server.log 2>&1
echo [start] servidor encerrou (codigo %errorlevel%). Reiniciando em 3s...
timeout /t 3 /nobreak > nul
goto loop
