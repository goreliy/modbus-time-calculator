@echo off
echo Starting Modbus Application...

:: Запуск Python бэкенда
start cmd /k "cd backend && python main.py"

:: Ждем 2 секунды, чтобы бэкенд успел запуститься
timeout /t 2 /nobreak

:: Запуск React фронтенда
start cmd /k "npm install && npm run dev"

echo Application started! Please wait while services initialize...