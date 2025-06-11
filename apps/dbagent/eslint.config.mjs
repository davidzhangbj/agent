import { includeIgnoreFile } from '@eslint/compat';
import { nextjs } from '@internal/eslint-config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
  {
    ignores: ['next.config.js', 'react-table-config.d.ts', 'eslint.config.mjs', 'postcss.config.js']
  },
  ...nextjs,
  {
    rules: {
      'no-process-env': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'configcat-react',
              importNames: ['useFeatureFlag'],
              message: `Please use: import { useFeatureFlag } from '~/hooks/useFeatureFlag';`
            }
          ]
        }
      ],
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-unused-vars': 'warn', // 对于未使用的变量只发出警告
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // 对于不必要的类型断言只发出警告
      'no-unused-private-class-members': 'warn', // 对于未使用的私有类成员只发出警告
      'no-empty': 'warn', // 对于空的代码块只发出警告
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname
      }
    }
  }
];
