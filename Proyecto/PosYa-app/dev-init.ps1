# PowerShell script para inicializar el proyecto en modo desarrollo
# 1. Verifica dependencias mínimas (Node.js, npm, sqlite3)
# 2. Instala dependencias npm
# 3. Inicializa/migra la base de datos ----- (QUITAR)
# 4. Ejecuta el proyecto en modo dev

Write-Host "[1/4] Verificando dependencias mínimas..."

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js no está instalado. Descárgalo de https://nodejs.org/"
    exit 1
}

# Verificar npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm no está instalado. Instala Node.js que incluye npm."
    exit 1
}

# # Verificar sqlite3 (opcional, solo si se requiere CLI para pruebas)
# if (-not (Get-Command sqlite3 -ErrorAction SilentlyContinue)) {
#     Write-Warning "sqlite3 CLI no encontrado. Si necesitas manipular la base de datos manualmente, instálalo desde https://www.sqlite.org/download.html"
# }

Write-Host "[2/4] Instalando dependencias npm..."
if (Test-Path node_modules) {
    Write-Host "node_modules ya existe, saltando instalación. Usa 'npm install' manualmente si tienes problemas."
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al instalar dependencias npm."
        exit 1
    }
}

# Write-Host "[3/4] Inicializando/migrando base de datos..."
# # Ejecutar el backend una vez para crear tablas y datos de prueba (si el backend lo soporta)
# # Se asume que el backend ejecuta la migración al iniciar
# $backend = Start-Process -FilePath "node" -ArgumentList "backend/servidor.cjs" -NoNewWindow -PassThru
# Start-Sleep -Seconds 3
# if (!$backend.HasExited) {
#     # Opcional: llamar endpoint de datos de prueba
#     try {
#         Invoke-WebRequest -Uri "http://localhost:3000/api/insertar-datos-prueba" -UseBasicParsing | Out-Null
#         Write-Host "Datos de prueba insertados."
#     } catch {
#         Write-Warning "No se pudo insertar datos de prueba automáticamente."
#     }
#     Stop-Process -Id $backend.Id
# }

Write-Host "[4/4] Iniciando el proyecto en modo desarrollo..."
# Ejecutar el comando de desarrollo definido en package.json
npm run dev
