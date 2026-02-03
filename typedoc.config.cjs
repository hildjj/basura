'use strict';

/** @import {TypeDocOptions} from 'typedoc' */
/** @type {TypeDocOptions} */
module.exports = {
  entryPoints: [
    'lib/index.js',
    'lib/decorators.js',
  ],
  out: 'docs',
  cleanOutputDir: true,
  includeVersion: true,
  sidebarLinks: {
    GitHub: 'https://github.com/hildjj/basura/',
    Documentation: 'http://hildjj.github.io/basura/',
  },
  navigation: {
    includeCategories: false,
    includeGroups: false,
  },
  categorizeByGroup: false,
  sort: ['static-first', 'alphabetical'],
};
