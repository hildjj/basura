/// <reference types="node" />
/**
 * Function to generate random bytes.  This is pluggable to allow for testing,
 * but I bet someone else will find a reason to use it.
 *
 * @callback BasuraRandBytes
 * @param {number} size Number of bytes to generate.
 * @param {string} reason Reason the bytes are being generated.
 * @returns {Buffer} Random bytes.
 * @private
 */
/**
 * Function to generate basura of a certain type.  Called with `this` the
 * current Basura instance.
 *
 * @callback BasuraGenerator
 * @param {number} [depth=0] How deep are we in the generated tree of objects
 *   already?
 * @returns {any} The generated basura.  Return null if too deep.
 */
/**
 * Create garbage javascript types for testing.
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
     * @param {string} str The string to modify.
     * @returns {string} The modified string.
     */
    static quoteSymbols(str: string): string;
    /**
     * Create some Basura.
     *
     * @param {object} [opts={}] Options.
     * @param {number} [opts.arrayLength=10] Maximum size of arrays and objects.
     * @param {boolean} [opts.cborSafe=false] Generate only CBOR-safe types?
     * @param {number} [opts.depth=5] Maximum depth of object to create.
     * @param {number} [opts.edgeFreq=0.1] How often do edge cases happen (0-1)?
     * @param {boolean} [opts.jsonSafe=false] Generate only JSON-safe types?
     * @param {boolean} [opts.noBoxed=false] Ignore boxed types, like String?
     * @param {boolean} [opts.output=false] Add custom inspect functions that
     *   make output parseable JS?
     * @param {BasuraRandBytes} [opts.randBytes] Randomness source.  Defaults
     *   to a thin wrapper around
     *   {@linkcode http://bit.ly/3dV5sSf crypto.randomBytes}.
     * @param {Array<string>} [opts.scripts] List of script names to select from
     *   for generating strings.  Defaults to all Unicode scripts from data.json.
     * @param {number} [opts.stringLength=20] Maximum size of generated strings.
     *   (in codepoints), BigInts (in bytes), and buffers (in bytes).
     * @param {Record<string, ?BasuraGenerator>} [opts.types] Additional types.
     *   The key is the type name, the value is a function used to generate, or
     *   null to prevent that type from being generated.
     */
    constructor(opts?: {
        arrayLength?: number;
        cborSafe?: boolean;
        depth?: number;
        edgeFreq?: number;
        jsonSafe?: boolean;
        noBoxed?: boolean;
        output?: boolean;
        randBytes?: BasuraRandBytes;
        scripts?: Array<string>;
        stringLength?: number;
        types?: Record<string, BasuraGenerator | null>;
    });
    opts: {
        arrayLength: number;
        cborSafe: boolean;
        depth: number;
        edgeFreq: number;
        jsonSafe: boolean;
        noBoxed: boolean;
        output: boolean;
        randBytes: BasuraRandBytes;
        scripts: any;
        stringLength: number;
        types: Record<string, BasuraGenerator | null>;
        catchUnhandled: boolean;
    };
    /** @type {WeakMap<any, any[]>} */
    weakMembers: WeakMap<any, any[]>;
    spareGauss: number;
    funNumbers: number[];
    functionSpecies: string[];
    typedArrays: (ArrayBufferConstructor | DataViewConstructor | Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor | SharedArrayBufferConstructor | BigInt64ArrayConstructor | BigUint64ArrayConstructor)[];
    ErrorConstructors: (ErrorConstructor | AggregateErrorConstructor)[];
    validWeak: string[];
    types: Record<string, BasuraGenerator>;
    typeNames: string[];
    /**
     * Wrapper around this.opts.randBytes to default the reason.
     *
     * @param {number} num Number of bytes to generate.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {Buffer} The random bytes.
     * @private
     */
    private _randBytes;
    /**
     * Random unsigned 32-bit integer.
     *
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     * @private
     */
    private _randUInt32;
    /**
     * Random positive BigInt.
     *
     * @param {number} [bytes=-1] The number of bytes to generate, or -1
     *   to generate up to stringLength bytes.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {bigint} The random number.
     * @private
     */
    private _randUBigInt;
    /**
     * Generate a random number (0,1].
     *
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     * @private
     */
    private _random01;
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
     * @private
     */
    private _randomGauss;
    /**
     * Generate a random positive integer less than a given number.
     *
     * @param {number} num One more than the maximum number generated.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {number} The random number.
     * @private
     */
    private _upto;
    /**
     * Pick an arbitrary element from the specified array.
     *
     * @template T
     * @param {Array<T>} ary Array to pick from, MUST NOT be empty.
     * @param {string} [reason='unspecified'] Reason reason for generation.
     * @returns {T} The selected array element.
     * @private
     */
    private _pick;
    /**
     * Pick zero or more of the array elements or string characters.
     *
     * @template T
     * @param {string|Array<T>} ary Pool to select from.
     * @param {string} [reason='unspecified'] Reason for generation.
     * @returns {ary extends Array<T> ? T : string} The selected string
     *   characters (concatenated) or the selected array elements.
     * @private
     */
    private _some;
    /**
     * Generate undefined.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {undefined} Always returns undefined.
     */
    generate_undefined(depth?: number): undefined;
    /**
     * Generate boolean.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @param {string} [reason='boolean'] Reason for generating bool.
     * @returns {boolean} True or false.
     */
    generate_boolean(depth?: number, reason?: string): boolean;
    /**
     * Generate boxed Boolean.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Boolean} New Boolean(true) or new Boolean(false).
     */
    generate_Boolean(depth?: number): boolean;
    /**
     * Generate signed 32-bit integer.
     * Note: may be folded into generate_number later.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {number} 32-bit integer.
     */
    generate_integer(depth?: number): number;
    /**
     * Generate 64-bit floating point number, with a 10% chance of something
     * "fun": 0, -0, NaN, Infinity, -Infinity.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {number} Number or edge case.
     */
    generate_number(depth?: number): number;
    /**
     * Generate boxed 64-bit floating point Number, with a 10% chance of something
     * "fun": 0, -0, NaN, Infinity, -Infinity.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Number} Wrapped new Number(num).
     */
    generate_Number(depth?: number): number;
    /**
     * Generate a {@linkcode https://nodejs.org/api/buffer.html Buffer} of up
     * to stringLength size.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Buffer} NodeJS Buffer.
     */
    generate_Buffer(depth?: number): Buffer;
    /**
     * Generate a string of up to stringLength size, all from the same random
     * Unicode script.  The first codepoint will not be a combining character.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @param {string} [reason='string'] Reason for generation, since this
     *   function is called by others.
     * @returns {string} Generated string.
     */
    generate_string(depth?: number, reason?: string): string;
    /**
     * Generate a boxed String of up to stringLength size, all from the same
     * random Unicode script.  The first codepoint will not be a combining
     * character.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {String} Wrapped new String().
     */
    generate_String(depth?: number): string;
    /**
     * Generate a regular expression of up to stringLength size, all from the same
     * random Unicode script.  The first codepoint will not be a combining
     * character.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {RegExp} Generated regexp.
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
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {URL} Generated punycode URL.
     */
    generate_URL(depth?: number): URL;
    /**
     * Generate an Array of up to arrayLength size, with each element of the
     * array being generated from the list of types this object currently
     * supports.  Generates an empty array (`[]`) if we're too deep already.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Array<any>} Generated array.
     */
    generate_Array(depth?: number): Array<any>;
    /**
     * Generate one of the TypedArrays, ArrayBuffer, SharedArrayBuffer, or
     * DataView of arrayLength elements.  If we're too deep already, generate
     * an array with length 0.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns { ArrayBuffer |
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
     * } Generated TypedArray.
     */
    generate_TypedArray(depth?: number): ArrayBuffer | DataView | Float32Array | Float64Array | Uint8Array | Uint8ClampedArray | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | BigUint64Array | BigInt64Array | SharedArrayBuffer;
    /**
     * Generate a random object with up to arrayLength properties.  Will generate
     * null (an Object!) if we are too deep already.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {?Object} Object or null.
     */
    generate_object(depth?: number): any | null;
    /**
     * Generate a random BigInt of up to stringLength bytes.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {bigint} Generated BigInt, possibly negative.
     */
    generate_bigint(depth?: number): bigint;
    /**
     * Generate a random Date, gaussian-distributed around today with a standard
     * deviation of 10 years.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Date} Generated Date.
     */
    generate_Date(depth?: number): Date;
    /**
     * Generate a random Error.  If an AggregateError is selected, fill it with
     * random Errors.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Error} Generated Error.
     */
    generate_Error(depth?: number): Error;
    /**
     * Generate a rejected or resolved promise.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Promise<any>} Resolved or rejected promise.
     */
    generate_Promise(depth?: number): Promise<any>;
    /**
     * Generate a WeakSet containing 0 or more sub-items of any valid type.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {WeakSet} Generated.
     */
    generate_WeakSet(depth?: number): WeakSet<any>;
    /**
     * Generate a WeakMap containing 0 or more key/value pairs where the keys
     * are valid weak items, and the values can be any valid type.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {WeakMap} Generated.
     */
    generate_WeakMap(depth?: number): WeakMap<any, any>;
    /**
     * Generate a symbol from a random string.  This will intern the Symbol
     * with Symbol.for to make testing possible.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {symbol} Generated Symbol.
     */
    generate_symbol(depth?: number): symbol;
    /**
     * Generate a random Map with up to arrayLength elements.  If we are too
     * deep already, will generate an empty Map.  Each key and value will be
     * of a random type currently supported by this object.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Map} Generated Map.
     */
    generate_Map(depth?: number): Map<any, any>;
    /**
     * Generate a Proxy over a random object.  If we are already too deep,
     * generates a Proxy around `{}`.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Proxy} Plain object in output mode, otherwise Proxy.
     */
    generate_Proxy(depth?: number): ProxyConstructor;
    /**
     * Generate a Set of random things, with length up to arrayLength, and each
     * element being any one of the types this object currently supports.  If
     * we are already too deep, generates an empty set.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {Set} Generated Set.
     */
    generate_Set(depth?: number): Set<any>;
    /**
     * Generate a function of a random "species".  The current species list is
     * stored in this.functionSpecies.  See [tutorial](tutorials/functions.md) for
     * more information.  If we are already too deep, generates `() => {}`.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {function} Generated function.
     */
    generate_function(depth?: number): Function;
    /**
     * Generate a random type that this object currently supports.  Returns
     * null if we're already too deep.
     *
     * @param {number} [depth=0] How deep are we in the generated tree of
     *   objects already?
     * @returns {any} Might generate... Anything!
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
