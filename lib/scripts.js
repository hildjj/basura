'use strict'
const Chars = require('./chars')

const INTERNAL = Symbol('Scripts_Internal')
let INSTANCE = null

/**
 * Manage Unicode scripts, getting access to each of their codepoints,
 * as well as data about each codepoint.  This class is a singleton,
 * because it caches a bunch of data lazily.
 */
class Scripts {
  /**
   * Do not call.  Use Scripts.instance() instead.
   *
   * @param {symbol} internal - the INTERNAL symbol to prove you're internal
   */
  constructor(internal) {
    if (internal !== INTERNAL) {
      throw new TypeError(
        'Do not call constructor directly, use Scripts.instance()'
      )
    }
    this.chars = new Chars()
    this.scripts = this.chars.data.scripts.map(v => v[0])
    this.scriptMap = this.chars.data.scripts.reduce((t, v) => {
      t[v[0]] = [v[2], v[3]]
      return t
    }, {})
    this.scriptPoints = {}
  }

  /**
   * Get singleton instance.
   *
   * @return {Scripts}
   */
  static instance() {
    if (!INSTANCE) {
      INSTANCE = new Scripts(INTERNAL)
    }
    return INSTANCE
  }

  /**
   * Get information about a script
   *
   * @param {string} script - name of the script, e.g. 'Latin'
   * @param {boolean|Array<string>} - if true, return only codepoints that are
   *   IDNA 2008 PVALID (see
   *   {@link https://tools.ietf.org/html/rfc8753 RFC8753} for more info).  If
   *   an array of strings, only returns codepoints that have one of those
   *   general categories (e.g. Ll for lowercas letter).
   * @return {Array<CodePoint>}
   */
  get(script, filter) {
    if (!script) {
      throw new TypeError('no script')
    }
    let sc = this.scriptPoints[script]
    if (!sc) {
      this.scriptPoints[script] = sc = []
      // TODO: find a more economical way to walk the trie
      const map = this.scriptMap[script]
      if (!map) {
        throw new Error(`Unknown script: "${script}"`)
      }
      const [first, last] = map
      for (let i = first; i <= last; i++) {
        const c = this.chars.get(i)
        if (c && (c.script === script)) {
          sc.push(c)
        }
      }
    }
    if (filter != null) {
      if (typeof filter === 'boolean') {
        if (filter) {
          return sc.filter(c => c.property === 'PVALID')
        }
      } else {
        return sc.filter(({category}) => filter.includes(category))
      }
    }
    return sc
  }
}

module.exports = Scripts
