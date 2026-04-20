@echo off
title Servidor do Boi na Rede
echo ===========================================
echo   Ligando o SaaS Boi na Rede...
echo   Por favor, aguarde alguns segundos.
echo ===========================================

set NODE_ENV=development
start "" "http://localhost:5000"
npm run dev

pause
