@echo off
cd /d "%~dp0backend"
echo.
echo  ================================
echo   FLICK - Starting...
echo   Open: http://localhost:5000
echo  ================================
echo.
python -c "from waitress import serve; from app import app; print('Running at http://localhost:5000'); serve(app, host='0.0.0.0', port=5000, threads=8)"
pause
