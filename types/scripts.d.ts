/**
 * @typedef {import('./chars.js').CodePoint} CodePoint
 */
/**
 * Manage Unicode scripts, getting access to each of their codepoints,
 * as well as data about each codepoint.  This class is a singleton,
 * because it caches a bunch of data lazily.
 */
export class Scripts {
    /**
     * Get singleton instance.
     *
     * @return {Scripts}
     */
    static instance(): Scripts;
    /**
     * Do not call.  Use Scripts.instance() instead.
     *
     * @param {symbol} internal - the INTERNAL symbol to prove you're internal
     */
    constructor(internal: symbol);
    chars: Chars;
    scripts: any;
    scriptMap: any;
    scriptPoints: {};
    /**
     * Get information about a script
     *
     * @param {string} script - name of the script, e.g. 'Latin'
     * @param {boolean|Array<string>} [filter] - if true, return only
     *   codepoints that are IDNA 2008 PVALID (see
     *   {@link https://tools.ietf.org/html/rfc8753 RFC8753} for more info).  If
     *   an array of strings, only returns codepoints that have one of those
     *   general categories (e.g. Ll for lowercas letter).
     * @return {Array<CodePoint>}
     */
    get(script: string, filter?: boolean | Array<string>): Array<CodePoint>;
}
export type CodePoint = import('./chars.js').CodePoint;
import { Chars } from './chars.js';
