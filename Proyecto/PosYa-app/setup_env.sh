

echo ">> Verificando e instalando dependencias del sistema..."

# --- Instalador para Node.js ---
if ! command -v node &> /dev/null; then
    echo "--> Node.js no encontrado. Intentando instalar..."
    if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
        winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        echo "--> Node.js instalado. Por favor, CIERRA y VUELVE A ABRIR esta terminal para continuar."
        exit 0
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y nodejs npm
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    else
        echo "ERROR: Sistema operativo no reconocido. Por favor, instala Node.js manualmente."
        exit 1
    fi
fi

# Verificar de nuevo después del intento de instalación
if ! command -v node &> /dev/null; then
    echo "ERROR: La instalación automática falló. Por favor, instala las dependencias manualmente."
    exit 1
fi

echo ">> Todas las dependencias del sistema (Node.js, npm) están instaladas."

# 2. INSTALACIÓN DE DEPENDENCIAS DEL PROYECTO
echo ">> Instalando dependencias del proyecto..."
if [ ! -d "node_modules" ]; then
    npm install
fi
echo ">> Dependencias del proyecto listas."

echo ">> Ejecutando el proyecto en modo desarrollo..."
npm run dev
