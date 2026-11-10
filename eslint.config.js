import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/', 'coverage/', 'public/js/']),
  {
    files: ['**/*.{ts,js,mjs}'],
    extends: [tseslint.configs.recommended],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]);
