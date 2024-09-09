import * as crypto from 'node:crypto';
import {Vose} from './vose.js';
import assert from 'node:assert';

/**
 * Function to generate random bytes.  This is pluggable to allow for testing,
 * but I bet someone else will find a reason to use it.
 *
 * @callback BasuraRandBytes
 * @param {number} size Number of bytes to generate.
 * @param {string} reason Reason the bytes are being generated.
 * @returns {Buffer} Random bytes.
 */

/**
 * Default RNG that uses crypto.randomBytes.
 *
 * @type {BasuraRandBytes}
 */
export function randBytes(size, _reason) {
  return crypto.randomBytes(size);
}

/**
 * Random number generation with pluggable source.
 * @private
 */
export class Random {
  static FREQS = Symbol('FREQS');

  /** @type {number|null} */
  #spareGauss = null; // Method `gauss` generates two numbers each time.
  #source;

  /** @type {WeakMap<any[], Vose>} */
  #freqs = new WeakMap();

  /**
   * Create.
   *
   * @param {BasuraRandBytes} [source] Random source.
   */
  constructor(source = randBytes) {
    this.#source = source;
  }

  /**
   * Wrapper around source.randBytes to default the reason.
   *
   * @param {number} num Number of bytes to generate.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {Buffer} The random bytes.
   */
  bytes(num, reason = 'unspecified') {
    return this.#source(num, reason);
  }

  /**
   * Random unsigned 32-bit integer.
   *
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {number} The random number.
   */
  uInt32(reason = 'unspecified') {
    return this.bytes(4, `uInt32,${reason}`).readUInt32BE(0);
  }

  /**
   * Generate a random positive integer less than a given number.
   *
   * @param {number} num One more than the maximum number generated.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {number} The random number.
   */
  upto(num, reason = 'unspecified') {
    if (num === 0) {
      return 0;
    }
    return (this.uInt32(`upto(${num}),${reason}`) % num);
  }

  /**
   * Random positive BigInt.
   *
   * @param {number} bytes The number of bytes to generate.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {bigint} The random number.
   */
  uBigInt(bytes, reason = 'unspecified') {
    return BigInt(
      `0x${this.bytes(bytes, `uBigInt,${reason}`).toString('hex')}`
    );
  }

  /**
   * Generate a random number (0,1].
   *
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {number} The random number.
   */
  random(reason = 'unspecified') {
    const buf = this.bytes(8, `random,${reason}`);
    // Little-endian float64.  Set sign bit to 0, and exponent to 511
    // (1.0 + mantissa).  This avoids subnormals etc.
    buf[6] |= 0xf0;
    buf[7] = 0x3f;
    return new DataView(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength
    ).getFloat64(0, true) - 1.0;
  }

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
  gauss(mean, stdDev, reason = 'unspecified') {
    // See: https://stackoverflow.com/a/60476586/8388 or
    // Section 3.4.1 of Donald Knuth's book The Art of Computer Programming
    if (this.#spareGauss != null) {
      const ret = mean + (stdDev * this.#spareGauss);
      this.#spareGauss = null;
      return ret;
    }
    let v1 = 0;
    let v2 = 0;
    let s = 0;
    do {
      v1 = (2 * this.random(reason)) - 1;
      v2 = (2 * this.random(reason)) - 1;
      s = (v1 * v1) + (v2 * v2);
    } while (s >= 1);
    if (s === 0) {
      return mean;
    }
    s = Math.sqrt(-2.0 * Math.log(s) / s);
    this.#spareGauss = v2 * s;
    return mean + (stdDev * v1 * s);
  }

  /**
   * Pick an arbitrary element from the specified array.
   *
   * @template T
   * @param {Array<T>} ary Array to pick from, MUST NOT be empty.
   * @param {string} [reason='unspecified'] Reason reason for generation.
   * @returns {T} The selected array element.
   */
  pick(ary, reason = 'unspecified') {
    assert(ary.length > 0);
    const weights = ary[Random.FREQS];
    if (weights) {
      let freqs = this.#freqs.get(ary);
      if (!freqs) {
        freqs = new Vose(weights, this);
        this.#freqs.set(ary, freqs);
      }
      return ary[freqs.pick(reason)];
    }
    return ary[this.upto(ary.length, `pick(${ary.length}),${reason}`)];
  }

  /**
   * Flip a coin, true or false.
   *
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {boolean} Generated.
   */
  bool(reason = 'unspecified') {
    return Boolean(this.upto(2, `bool,${reason}`));
  }

  /**
   * @overload
   * @param {string} str String to select from.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {string} Subset of str.
   */
  /**
   * @template T
   * @overload
   * @param {T[]} ary Pool to select from.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {T[]} Selected array elements.
   */
  /**
   * Pick zero or more of the array elements or string characters.
   *
   * @template T
   * @param {string|T[]} ary Pool to select from.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {string|T[]} The selected string
   *   characters (concatenated) or the selected array elements.
   */
  some(ary, reason = 'unspecified') {
    if (typeof ary === 'string') {
      return [...ary].filter(() => this.bool(`some,${reason}`)).join('');
    }
    return ary.filter(() => this.bool(`some,${reason}`));
  }
}
