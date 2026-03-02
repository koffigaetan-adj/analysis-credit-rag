@echo off
echo ========================================================
echo Lancement de l'environnement de developpement...
echo ========================================================
start powershell -NoExit -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process; .\venv\Scripts\Activate.ps1"
