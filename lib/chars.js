import * as fs from 'node:fs';
import * as path from 'node:path';
import {Trie} from './data.js';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {"DISALLOWED"|"PVALID"|"CONTEXTO"|"CONTEXTJ"} PropertyKind
 */

/**
 * Information about a single Unicode codepoint.
 *
 * @typedef {object} CodePoint
 * @property {number} code - Codepoint as a number.
 * @property {PropertyKind} property - IDNA
 *   2008 derived property.
 * @property {string} script - Script name.
 * @property {string} category - General category.
 */

/**
 * @typedef {[string, number, number, number]} ScriptData
 * Name, count, first, last
 */

/**
 * @typedef {object} DataFile
 * @property {ScriptData[]} scripts Ranges of each script.
 * @property {string[]} categories Category list.
 * @property {PropertyKind[]} properties Property List.
 * @property {number} categoryBits Fewer than 2^x categories.
 * @property {number} scriptBits Fewer than 2^x scripts.
 * @property {number} propertyBits Fewer than 2^x properties.
 * @property {number} categoryShift How far to shift categories.
 * @property {number} scriptShift How far to shift scripts.
 * @property {number} propertyShift How far to shift properties.
 * @property {number} invalid Mask for invalid.
 * @property {number} error Mask for error.
 */

/**
 * Information about all relevant Unicode codepoints.  Irrelevant codepoints
 * include ones that are unassigned, half surrogates, etc.
 */
export class Chars {
  /**
   * Construct an instance.  This reads from `data/data.js` and
   * `data/data.json` synchronously.  Those files are created by
   * `tools/create.js`.
   */
  constructor() {
    this.trie = Trie;

    /** @type {DataFile} */
    this.data = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', 'data', 'data.json'), 'utf8'
    ));
    this.propertyMask = (1 << this.data.propertyBits) - 1;
    this.categoryMask = (1 << this.data.categoryBits) - 1;
    this.scriptMask = (1 << this.data.scriptBits) - 1;
  }

  /**
   * Get information about a single codepoint.
   *
   * @param {number} code The codepoint.
   * @returns {CodePoint|null} The data associated with the codepoint.
   * @throws {Error} Trie error.
   */
  get(code) {
    const x = this.trie.get(code);
    // Thanks to https://github.com/foliojs/unicode-properties for showing me
    // how to do this.

    // x can be invalid (32768), error (65536), or a 15 bit integer
    // with the following fields or'd together:
    // cccccSSSSSSSSpp
    // categoryBits: 5
    // scriptBits: 8
    // propertyBits: 2

    if (x === this.data.invalid) {
      return null;
    }
    if (x === this.data.error) {
      throw new Error('Trie error');
    }
    const num = (x >> this.data.scriptShift) & this.scriptMask;
    const s = this.data.scripts.find(props => props[1] === num);
    assert(s, 'All invalid characters should have been caught above');

    return {
      code,
      property: this.data.properties[
        (x >> this.data.propertyShift) & this.propertyMask
      ],
      category: this.data.categories[
        (x >> this.data.categoryShift) & this.categoryMask
      ],
      script: s[0],
    };
  }
}
