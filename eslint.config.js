import ava from '@cto.af/eslint-config/ava.js';
import es6 from '@cto.af/eslint-config/es6.js';
import jsdoc from '@cto.af/eslint-config/jsdoc.js';

export default [
  {
    ignores: [
      'types/**',
      'examples/**',
    ],
  },
  ...es6,
  ...jsdoc,
  {
    files: ['**/*.js'],
    rules: {
      'jsdoc/valid-types': 'off', // Let tsc handle this.
      'jsdoc/check-types': 'off', // Let tsc handle this.
      'jsdoc/lines-before-block': 'off', // Not configurable
    },
  },
  ...ava,
  {
    files: ['bin/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
