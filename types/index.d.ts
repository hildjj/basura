/// <reference types="node" />
/**
 * Function to generate random bytes.  This is pluggable to allow for testing,
 * but I bet someone else will find a reason to use it.
 *
 * @callback BasuraRandBytes
 * @param {number} size - number of bytes to generate
 * @param {string} reason - reason the bytes are being generated
 * @returns {Buffer} random bytes
 * @private
 */
/**
 * Function to generate basura of a certain type.  Called with `this` the
 * current Basura instance.
 *
 * @callback BasuraGenerator
 * @param {number} [depth=0] - How deep are we in the generated tree of objects
 *   already?
 * @return {any} the generated basura.  Return null if too deep.
 */
/**
 * Create garbage javascript types for testing
 */
export class Basura {
    /**
     * Symbols can't take a custom inspect function.  They always output
     * `Symbol(foo)`.  This function tries to find all of those in a string,
     * and replace them with `Symbol.for('foo')`, which will create a valid
     * symbol when parsed as JavaScript.
     *
     * This function currently fails on edge cases such as what is created from
     * Symbol(')))'), which luckily shouldn't be created from this library.
     *
     * @param {string} str - the string to modify
     * @return {string} the modified string
     */
    static quoteSymbols(str: string): string;
    /**
     * Create some Basura
     *
     * @param {Object} [opts={}] - Options
     * @param {number} [opts.arrayLength=10] - Maximum size of arrays and objects
     * @param {boolean} [opts.cborSafe=false] - Generate only CBOR-safe types?
     * @param {number} [opts.depth=5] - Maximum depth of object to create
     * @param {boolean} [opts.jsonSafe=false] - Generate only JSON-safe types?
     * @param {boolean} [opts.noBoxed=false] - ignore boxed types, like String?
     * @param {boolean} [opts.output=false] - add custom inspect functions that
     *   make output parseable JS?
     * @param {BasuraRandBytes} [opts.randBytes] - Randomness source.  Defaults
     *   to a thin wrapper around
     *   {@linkcode http://bit.ly/3dV5sSf crypto.randomBytes}.
     * @param {Array<string>} [opts.scripts] - List of script names to select from
     *   for generating strings.  Defaults to all Unicode scripts from data.json.
     * @param {number} [opts.stringLength=20] - Maximum size of generated strings
     *   (in codepoints), BigInts (in bytes), and buffers (in bytes).
     * @param {Object<string, ?BasuraGenerator>} [opts.types] - Additional types.
     *   The key is the type name, the value is a function used to generate, or
     *   null to prevent that type from being generated
     */
    constructor(opts?: {
        arrayLength?: number;
        cborSafe?: boolean;
        depth?: number;
        jsonSafe?: boolean;
        noBoxed?: boolean;
        output?: boolean;
        randBytes?: BasuraRandBytes;
        scripts?: Array<string>;
        stringLength?: number;
        types?: {
            [x: string]: BasuraGenerator | null;
        };
    });
    opts: {
        arrayLength: number;
        cborSafe: boolean;
        depth: number;
        jsonSafe: boolean;
        noBoxed: boolean;
        output: boolean;
        randBytes: BasuraRandBytes;
        scripts: any;
        stringLength: number;
        types: {
            [x: string]: BasuraGenerator | null;
        };
    };
    spareGauss: number;
    funNumbers: number[];
    functionSpecies: string[];
    typedArrays: (ArrayBufferConstructor | DataViewConstructor | Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor | SharedArrayBufferConstructor | BigInt64ArrayConstructor | BigUint64ArrayConstructor)[];
    types: {
        [x: string]: BasuraGenerator;
    };
    typeNames: string[];
    /**
     * Wrapper around this.opts.randBytes to default the reason.
     *
     * @param {number} num - number of bytes to generate
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {Buffer} the random bytes
     * @private
     */
    private _randBytes;
    /**
     * Random unsigned 32-bit integer
     *
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {number} the random number
     * @private
     */
    private _randUInt32;
    /**
     * Random positive BigInt
     *
     * @param {number} [bytes=-1] - the number of bytes to generate, or -1
     *   to generate up to stringLength bytes
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {bigint} the random number
     */
    _randUBigInt(bytes?: number, reason?: string): bigint;
    /**
     * Generate a random number (0,1].
     *
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {number} the random number
     */
    _random01(reason?: string): number;
    /**
     * Generate a random number with close to gaussian distribution.
     * Uses the polar method for normal deviates, which generates two
     * numbers at a time.  Saves the second number for next time in a way
     * that a different mean and standard deviation can be used on each
     * call.
     *
     * @param {number} mean - The mean for the set of numbers generated
     * @param {number} stdDev - The standard deviation for the set of numbers
     *   generated
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {number} the random number
     */
    _randomGauss(mean: number, stdDev: number, reason?: string): number;
    /**
     * Generate a random positive integer less than a given number.
     *
     * @param {number} num - one more than the maximum number generated
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {number} the random number
     */
    _upto(num: number, reason?: string): number;
    /**
     * Pick an arbitrary element from the specified array
     *
     * @template T
     * @param {Array<T>} ary - Array to pick from, MUST NOT be empty
     * @param {string} [reason='unspecified'] reason - reason for generation
     * @return {T} the selected array element
     * @private
     */
    private _pick;
    /**
     * Pick zero or more of the array elements or string characters
     *
     * @template T
     * @param {string|Array<T>} ary - Pool to select from
     * @param {string} [reason='unspecified'] - reason for generation
     * @return {ary extends Array<T> ? T : string} the selected string
     *   characters (concatenated) or the selected array elements
     * @private
     */
    private _some;
    /**
     * Generate undefined.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {undefined} always returns undefined
     */
    generate_undefined(depth?: number): undefined;
    /**
     * Generate boolean.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {boolean} true or false
     */
    generate_boolean(depth?: number, reason?: string): boolean;
    /**
     * Generate boxed Boolean.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Boolean} new Boolean(true) or new Boolean(false)
     */
    generate_Boolean(depth?: number): boolean;
    /**
     * Generate signed 32-bit integer.
     * Note: may be folded into generate_number later.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {number}
     */
    generate_integer(depth?: number): number;
    /**
     * Generate 64-bit floating point number, with a 10% chance of something
     * "fun": 0, -0, NaN, Infinity, -Infinity
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {number}
     */
    generate_number(depth?: number): number;
    /**
     * Generate boxed 64-bit floating point Number, with a 10% chance of something
     * "fun": 0, -0, NaN, Infinity, -Infinity
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Number} new Number(num)
     */
    generate_Number(depth?: number): number;
    /**
     * Generate a {@linkcode https://nodejs.org/api/buffer.html Buffer} of up
     * to stringLength size.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Buffer}
     */
    generate_Buffer(depth?: number): Buffer;
    /**
     * Generate a string of up to stringLength size, all from the same random
     * Unicode script.  The first codepoint will not be a combining character.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @param {string} [reason='string'] - reason for generation, since this
     *   function is called by others
     * @return {string}
     */
    generate_string(depth?: number, reason?: string): string;
    /**
     * Generate a boxed String of up to stringLength size, all from the same
     * random Unicode script.  The first codepoint will not be a combining
     * character.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {String}
     */
    generate_String(depth?: number): string;
    /**
     * Generate a regular expression of up to stringLength size, all from the same
     * random Unicode script.  The first codepoint will not be a combining
     * character.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {RegExp}
     */
    generate_RegExp(depth?: number): RegExp;
    /**
     * Generate a URL object where each component can be up to stringLength
     * size, and each component is all from the same random Unicode script. The
     * top-level domain (TLD) name will be valid, and the preceding domain label
     * will be from the same script as the TLD.
     *
     * However, that means you'll see a lot of Punycode, thanks to the way that
     * the URL class works.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {URL}
     */
    generate_URL(depth?: number): URL;
    /**
     * Generate an Array of up to arrayLength size, with each element of the
     * array being generated from the list of types this object currently
     * supports.  Generates an empty array (`[]`) if we're too deep already.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Array<any>}
     */
    generate_Array(depth?: number): Array<any>;
    /**
     * Generate one of the TypedArrays, ArrayBuffer, SharedArrayBuffer, or
     * DataView of arrayLength elements.  If we're too deep already, generate
     * an array with length 0.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return { ArrayBuffer |
     *   DataView |
     *   Float32Array |
     *   Float64Array |
     *   Uint8Array |
     *   Uint8ClampedArray |
     *   Int8Array |
     *   Uint16Array |
     *   Int16Array |
     *   Uint32Array |
     *   Int32Array |
     *   BigUint64Array |
     *   BigInt64Array |
     *   SharedArrayBuffer
     * }
     */
    generate_TypedArray(depth?: number): ArrayBuffer | DataView | Float32Array | Float64Array | Uint8Array | Uint8ClampedArray | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | BigUint64Array | BigInt64Array | SharedArrayBuffer;
    /**
     * Generate a random object with up to arrayLength properties.  Will generate
     * null (an Object!) if we are too deep already.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {?Object}
     */
    generate_object(depth?: number): any | null;
    /**
     * Generate a random BigInt of up to stringLength bytes
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {bigint}
     */
    generate_bigint(depth?: number): bigint;
    /**
     * Generate a random Date, gaussian-distributed around today with a
     * standard deviation of 10 years.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Date}
     */
    generate_Date(depth?: number): Date;
    /**
     * Generate a symbol from a random string.  This will intern the Symbol
     * with Symbol.for to make testing possible.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {symbol}
     */
    generate_symbol(depth?: number): symbol;
    /**
     * Generate a random Map with up to arrayLength elements.  If we are too
     * deep already, will generate an empty Map.  Each key and value will be
     * of a random type currently supported by this object.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Map}
     */
    generate_Map(depth?: number): Map<any, any>;
    /**
     * Generate a Proxy over a random object.  If we are already too deep,
     * generates a null.  If in output mode, generates a fake Proxy which
     * can have a custom inspect on it -- that may not be possible for a
     * real proxy, since util.inspect treats Proxy objects specially.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Proxy|Object} plain object in output mode, otherwise Proxy
     */
    generate_Proxy(depth?: number): ProxyConstructor | any;
    /**
     * Generate a Set of random things, with length up to arrayLength, and each
     * element being any one of the types this object currently supports.  If
     * we are already too deep, generates an empty set.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {Set}
     */
    generate_Set(depth?: number): Set<any>;
    /**
     * Generate a function of a random "species".  The current species list is
     * stored in this.functionSpecies.  See [tutorial](tutorials/functions.md) for
     * more information.  If we are already too deep, generates `() => {}`.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {function}
     */
    generate_function(depth?: number): Function;
    /**
     * Generate a random type that this object currently supports.  Returns
     * null if we're already too deep.
     *
     * @param {number} [depth=0] - How deep are we in the generated tree of
     *   objects already?
     * @return {any}
     */
    generate(depth?: number): any;
}
/**
 * Function to generate random bytes.  This is pluggable to allow for testing,
 * but I bet someone else will find a reason to use it.
 */
export type BasuraRandBytes = (size: number, reason: string) => Buffer;
/**
 * Function to generate basura of a certain type.  Called with `this` the
 * current Basura instance.
 */
export type BasuraGenerator = (depth?: number) => any;
import { Buffer } from 'buffer';
