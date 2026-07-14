import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'packages/acoustic-service/.venv/**',
    'Woody/**',
    'app/debug/**',
    'app/legacy/**',
    'components/map/**',
    'components/player/**',
    'components/screens/**',
    'hooks/**',
    '*.html',
  ]),
])
