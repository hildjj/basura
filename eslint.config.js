import ava from '@cto.af/eslint-config/ava.js';
import es6 from '@cto.af/eslint-config/es6.js';
// Import jsdoc from '@cto.af/eslint-config/jsdoc.js';

export default [
  {
    ignores: ['types/**'],
  },
  ...es6,
  // ...jsdoc,
  ...ava,
  {
    files: ['bin/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
