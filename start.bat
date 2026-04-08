@echo off
echo Iniciando Arachiz...
start "Backend" cmd /k "cd backend && node server.js"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"
echo Listo. Backend en http://localhost:3000 - Frontend en http://localhost:5173
