import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended, // Mantiene las reglas recomendadas por ESLint para posibles errores
      reactHooks.configs['recommended-latest'], // Mantiene las reglas recomendadas para React Hooks
      reactRefresh.configs.vite, // Mantiene las reglas específicas de Vite para React Fast Refresh
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // Define variables globales de entorno de navegador
      parserOptions: {
        ecmaVersion: 'latest', // Permite la sintaxis de la última versión de ECMAScript
        ecmaFeatures: { jsx: true }, // Habilita el soporte para JSX
        sourceType: 'module', // Permite el uso de módulos ES (import/export)
      },
    },
    rules: {
      // --- Reglas equilibradas: la mayoría son 'warn' para avisar, no bloquear ---

      // 1. Variables no usadas: Ahora es una advertencia, no un error.
      // Así te enteras, pero no te rompe el build. Puedes ajustarlo para ignorar patrones específicos si es necesario.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],

      // 2. Uso de console: Sigue siendo una advertencia.
      // Te avisa si dejas un console.log, pero no te impide compilar.
      'no-console': 'warn',

      // 3. Puntos y coma: Ahora es una advertencia. Puedes elegir un estilo ('always' o 'never')
      // Aquí, por ejemplo, lo configuramos para preferir los puntos y coma y te advierta si faltan.
      // Si prefieres sin punto y coma, cámbialo a ['warn', 'never'].
      'semi': ['warn', 'always'],

      // 4. Indentación: Ahora es una advertencia. Define tu preferencia (ej. 2 espacios).
      // Te avisa si la indentación no coincide, pero no es un error que detenga el proceso.
      'indent': ['warn', 2, { SwitchCase: 1 }], // Ajusta '2' si prefieres 4 espacios o tabs

      // 5. Múltiples líneas vacías: Ahora es una advertencia.
      // Te avisa si hay demasiadas líneas vacías consecutivas, manteniendo el código más compacto.
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],

      // 6. Llaves en bloques de una sola línea: Ahora es una advertencia.
      // Te sugiere usar llaves para mayor claridad, pero no lo impone estrictamente.
      'curly': ['warn', 'multi-line'], // 'multi-line' permite omitir llaves en una sola línea, pero las exige en múltiples.

      // 7. react/react-in-jsx-scope: Sigue siendo 'off'.
      // Con React 17+ y el nuevo JSX transform, no es necesario importar React explícitamente.
      'react/react-in-jsx-scope': 'off',

      // 8. react/prop-types: Sigue siendo 'off'.
      // Si usas TypeScript, esta regla es redundante y puede desactivarse.
      'react/prop-types': 'off',

      // 9. Uso de 'var': Ahora es una advertencia.
      // Te recomienda usar 'let' o 'const', pero no prohíbe 'var'.
      'no-var': 'warn',

      // 10. Tipo de comillas: Ahora es una advertencia.
      // Te sugiere usar comillas simples, pero te permite usar dobles con una advertencia.
      'quotes': ['warn', 'single'], // Puedes cambiar a 'double' si lo prefieres

      // --- Nuevas reglas añadidas para un mejor equilibrio (todas como 'warn') ---

      // Prefiere 'const' si la variable no se reasigna.
      'prefer-const': 'warn',

      // Fuerza el uso de '===' en lugar de '==' (igualdad estricta). Es una buena práctica.
      'eqeqeq': ['warn', 'always'],

      // Asegura que las funciones flecha que solo retornan un valor, lo hagan de forma concisa.
      'arrow-body-style': ['warn', 'as-needed'],

      // Requiere espacios alrededor de los operadores.
      'space-infix-ops': 'warn',

      // No permite espacios extra al final de las líneas.
      'no-trailing-spaces': 'warn',

      // Desactiva algunas advertencias de accesibilidad de JSX que pueden ser muy estrictas al principio.
      // Si usas plugin:jsx-a11y/recommended, estas se activarían como errores.
      // Podrías añadir un "overrides" para archivos JSX/TSX si quieres más control.
      // Por ahora, solo como ejemplo general de cómo relajar rules de plugins si se vuelven muy estrictas.
      // Por ejemplo, para JSX-A11y, podrías hacer:
      // 'jsx-a11y/alt-text': 'warn',
      // 'jsx-a11y/anchor-is-valid': 'warn',
    },
  },
]);