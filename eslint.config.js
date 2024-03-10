import ava from '@cto.af/eslint-config/ava.js';
import es6 from '@cto.af/eslint-config/es6.js';

export default [
  {
    ignores: ['types/**'],
  },
  ...es6,
  ...ava,
];
