@echo off
rem Campo de Batalha RPG - Abrir client no navegador.
rem Inicia o servidor Vite e abre o navegador automaticamente.

cd /d "%~dp0"
echo [client] Iniciando servidor Vite...
start "" "http://localhost:5173"
npx vite
