@echo off
echo =========================================
echo Lancement du projet Analysis Credit RAG
echo =========================================

echo.
echo [1/2] Lancement du Backend (FastAPI)...
start "Backend" cmd /k "cd backend && python main.py"

echo [2/2] Lancement du Frontend (Vite/React)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Les serveurs ont ete lances dans de nouvelles fenetres.
echo - L'API du backend devrait etre accessible via http://localhost:8000
echo - L'UI du frontend devrait etre accessible via http://localhost:5173 (ou le port specifie dans la fenetre frontend).
echo.
echo Vous pouvez fermer cette fentre, les serveurs continueront de tourner dans leurs fenetres respectives.
pause
