@echo off

echo.
echo Verificando dependencias del sistema...

rem --- Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js no encontrado. Intentando instalar con Winget...
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    echo.
    echo  Node.js ha sido instalado.
    echo Por favor, cierra y vuelve a abrir esta terminal y ejecuta el script de nuevo.
    pause
    exit
)

echo.
echo Todas las dependencias del sistema estan listas.

echo.
echo Instalando dependencias del proyecto...
if not exist "node_modules" (
    call npm install
)
echo.
echo Dependencias del proyecto listas.

echo.
echo Ejecutando el proyecto en modo desarrollo...
call npm run dev
