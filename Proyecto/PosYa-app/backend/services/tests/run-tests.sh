#!/bin/bash

echo "Ejecutando todos los tests con Jest..."

# Verificar si jest está instalado
if ! npx --yes jest --version >/dev/null 2>&1; then
  echo "Jest no está instalado. Ejecuta 'npm install --save-dev jest' primero."
  exit 1
fi

# Configuración predeterminada de jest
npx jest --bail=false --passWithNoTests

# Guardar el código de salida de Jest
exit_code=$?

# Resultado final
if [ $exit_code -eq 0 ]; then
  echo "Todos los tests pasaron exitosamente."
else
  echo "Algunos tests fallaron."
fi

exit $exit_code
