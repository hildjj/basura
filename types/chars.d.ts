/**
 * Information about a single Unicode codepoint.
 *
 * @typedef {object} CodePoint
 * @property {number} code - Codepoint as a number.
 * @property {"DISALLOWED"|"PVALID"|"CONTEXTO"|"CONTEXTJ"} property - IDNA
 *   2008 derived property.
 * @property {string} script - Script name.
 * @property {string} category - General category.
 */
/**
 * Information about all relevant Unicode codepoints.  Irrelevant codepoints
 * include ones that are unassigned, half surrogates, etc.
 */
export class Chars {
    trie: import("@cto.af/unicode-trie").UnicodeTrie;
    data: any;
    propertyMask: number;
    categoryMask: number;
    scriptMask: number;
    /**
     * Get information about a single codepoint.
     *
     * @param {number} code The codepoint.
     * @returns {CodePoint} The data associated with the codepoint.
     * @throws Trie error.
     */
    get(code: number): CodePoint;
}
/**
 * Information about a single Unicode codepoint.
 */
export type CodePoint = {
    /**
     * - Codepoint as a number.
     */
    code: number;
    /**
     * - IDNA
     * 2008 derived property.
     */
    property: "DISALLOWED" | "PVALID" | "CONTEXTO" | "CONTEXTJ";
    /**
     * - Script name.
     */
    script: string;
    /**
     * - General category.
     */
    category: string;
};
