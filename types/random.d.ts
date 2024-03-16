export function randBytes(size: number, reason: string): Buffer;
/**
 * Random number generation with pluggable source.
 * @private
 */
export class Random {
    static FREQS: symbol;
    /**
     * Create.
     *
     * @param {BasuraRandBytes} [source] Random source.
     */
    constructor(source?: BasuraRandBytes);
    /**
     * Wrapper around source.randBytes to default the reason.
     *
     * @param {number} num Number of bytes to generate.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {Buffer} The random bytes.
     */
    bytes(num: number, reason?: string): Buffer;
    /**
     * Random unsigned 32-bit integer.
     *
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     */
    uInt32(reason?: string): number;
    /**
     * Generate a random positive integer less than a given number.
     *
     * @param {number} num One more than the maximum number generated.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     */
    upto(num: number, reason?: string): number;
    /**
     * Random positive BigInt.
     *
     * @param {number} bytes The number of bytes to generate.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {bigint} The random number.
     */
    uBigInt(bytes: number, reason?: string): bigint;
    /**
     * Generate a random number (0,1].
     *
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     */
    random(reason?: string): number;
    /**
     * Generate a random number with close to gaussian distribution.
     * Uses the polar method for normal deviates, which generates two
     * numbers at a time.  Saves the second number for next time in a way
     * that a different mean and standard deviation can be used on each
     * call.
     *
     * @param {number} mean The mean for the set of numbers generated.
     * @param {number} stdDev The standard deviation for the set of numbers
     *   generated.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     */
    gauss(mean: number, stdDev: number, reason?: string): number;
    /**
     * Pick an arbitrary element from the specified array.
     *
     * @template T
     * @param {Array<T>} ary Array to pick from, MUST NOT be empty.
     * @param {string} [reason='unspecified'] Reason reason for generation.
     * @returns {T} The selected array element.
     */
    pick<T>(ary: T[], reason?: string): T;
    /**
     * Flip a coin, true or false.
     *
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {boolean} Generated.
     */
    bool(reason?: string): boolean;
    /**
     * @overload
     * @param {string} str String to select from.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {string} Subset of str.
     */
    some(str: string, reason?: string): string;
    /**
     * @template T
     * @overload
     * @param {T[]} ary Pool to select from.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {T[]} Selected array elements.
     */
    some<T_1>(ary: T_1[], reason?: string): T_1[];
    #private;
}
/**
 * Function to generate random bytes.  This is pluggable to allow for testing,
 * but I bet someone else will find a reason to use it.
 */
export type BasuraRandBytes = (size: number, reason: string) => Buffer;
