/**
 * Vose's Alias Method.
 *
 * @param {number[]} weights Weights of the the N choices.
 * @see https://www.keithschwarz.com/darts-dice-coins/
 * @see https://en.wikipedia.org/wiki/Alias_method
 */
export class Vose {
    /**
     * Prepare the probability and alias tables.
     *
     * @param {number[]} weights Relative weights, per pick array item.  If
     *   undefined, `1` is the default.
     * @param {import('./random').Random} random Random source.
     */
    constructor(weights: number[], random: import('./random').Random);
    get _tables(): any[][];
    /**
     * Pick a random position in the weighted array.
     *
     * @param {string} reason Reason for generation.
     * @returns {number} The *position*, not the item in the array.
     */
    pick(reason?: string): number;
    #private;
}
