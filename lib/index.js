import * as crypto from 'crypto';
import * as tlds from 'tlds2';
import * as util from 'util';
import {Buffer} from 'buffer';
import {Scripts} from './scripts.js';
import {strict as assert} from 'assert';

const DATE_10YEARS = 315569520000;
const FAKE_PROXY = Symbol('FakeProxy');
const BASURA_GENERATED = 'BasuraGenerated';
const ERROR_OPTS = {
  cause: BASURA_GENERATED,
};

const scripts = Scripts.instance();

// Generated promises that were rejected result in unhandled rejections, and I
// don't see a better way to clean them up.  Make sure that ava's
// unhandledRejection still fires for non-BasuraGenerated errors.
const oldUnhandledRejection = process.listeners('unhandledRejection');
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (/** @type {Error} */ er, p) => {
  // This block will only be an issue if a non-BasuraGenerated rejection is
  // unhandled. That's basically impossible to cause and still have a passing
  // test with ava, I think.
  /* c8 ignore start */
  if (er?.cause !== BASURA_GENERATED) {
    for (const f of oldUnhandledRejection) {
      f(er, p);
    }
    throw er;
  }

  /* c8 ignore stop */
});

function randBytes(size, reason) {
  return crypto.randomBytes(size);
}

function inspectOpts(options) {
  return {
    ...options,
    depth: options.depth == null ? null : options.depth - 1,
  };
}

function inspectMap(depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...this.entries()], inspectOpts(options));
  return `new Map(${inner})`;
}

function inspectSet(depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...this.values()], inspectOpts(options));
  return `new Set(${inner})`;
}

function inspectTypedArray(depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...this], inspectOpts(options));
  // eslint-disable-next-line no-invalid-this
  return `new ${this.constructor.name}(${inner})`;
}

function inspectArrayBuffer(depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...new Uint8Array(this)], inspectOpts(options));
  return `new Uint8Array(${inner}).buffer`;
}

function inspectSharedArrayBuffer(depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...new Uint8Array(this)], inspectOpts(options));
  // eslint-disable-next-line no-invalid-this
  return `(() => { const s = new SharedArrayBuffer(${this.byteLength}); const b = Buffer.from(s); Buffer.from(${inner}).copy(b); return s })()`;
}

function inspectDataView(depth, options) {
  const inner = inspectArrayBuffer.call(
    // eslint-disable-next-line no-invalid-this
    this.buffer,
    depth + 1,
    inspectOpts(options)
  );
  return `new DataView(${inner})`;
}

function inspectProxy(depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect(this[FAKE_PROXY], inspectOpts(options));
  return `new Proxy(${inner}, {})`;
}

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
  constructor(opts = {}) {
    this.opts = {
      arrayLength: 10,
      cborSafe: false,
      depth: 5,
      edgeFreq: 0.1,
      jsonSafe: false,
      noBoxed: false,
      output: false,
      randBytes,
      scripts: scripts.scripts,
      stringLength: 20,
      types: {},
      catchUnhandled: true,
      ...opts,
    };

    // _randGauss generates two numbers each time
    this.spareGauss = null;

    // Somtimes, numbers aren't boring
    this.funNumbers = [
      NaN,
      0,
      -0,
      Infinity,
      -Infinity,
    ];

    this.functionSpecies = [
      '[Function (anonymous)]',
      '[Function: anonymous]',
      '[Function: f1]',
      '[Function: f2]',
      '[AsyncFunction (anonymous)]',
      '[AsyncFunction: anonymous]',
      '[AsyncFunction: f1]',
      '[AsyncFunction: f2]',
      '[AsyncFunction: f3]',
      '[GeneratorFunction (anonymous)]',
      '[GeneratorFunction: anonymous]',
      '[GeneratorFunction: f1]',
      '[GeneratorFunction: f2]',
      '[AsyncGeneratorFunction (anonymous)]',
      '[AsyncGeneratorFunction: anonymous]',
      '[AsyncGeneratorFunction: f1]',
      '[AsyncGeneratorFunction: f2]',
    ];

    this.typedArrays = [
      ArrayBuffer,
      DataView,
      Float32Array, // TODO: sprinkle in some NaN's, -0's and +/- Infinities?
      Float64Array,
      Uint8Array,
      Uint8ClampedArray,
      Int8Array,
      Uint16Array,
      Int16Array,
      Uint32Array,
      Int32Array,
      BigUint64Array,
      BigInt64Array,
      SharedArrayBuffer, // Keep as last
    ];

    this.ErrorConstructors = [
      AggregateError,
      Error,
      EvalError,
      RangeError,
      ReferenceError,
      SyntaxError,
      TypeError,
      URIError,
    ];

    // All of the things that we support, plus things from
    // the options, minus things from the options that the caller
    // wants us to omit (which they signal by passing in null)
    // `this` may be a subclass; make sure to enumerate the whole
    // prototype chain, preferring the implementation from opts, then
    // more-highly-derived classes.
    this.types = this.opts.types;
    for (let o = this; o; o = Object.getPrototypeOf(o)) {
      for (const n of Object.getOwnPropertyNames(o).sort()) {
        const m = n.match(/^generate_(?<rest>.*)/);
        if (m && (typeof this[n] === 'function')) {
          if (!(m.groups.rest in this.types)) {
            this.types[m.groups.rest] = this[n];
          }
        }
      }
    }
    for (const [k, v] of Object.entries(this.types)) {
      if (!v) {
        delete this.types[k];
      }
    }

    if (this.opts.cborSafe) {
      // None of these round-trip in CBOR yet.
      delete this.types.Boolean;
      delete this.types.function;
      delete this.types.Number;
      delete this.types.Promise;
      delete this.types.Proxy;
      delete this.types.String;
      delete this.types.symbol;
      delete this.types.WeakMap;
      delete this.types.WeakSet;
      this.typedArrays = this.typedArrays.filter(c => !([
        ArrayBuffer,
        DataView,
        SharedArrayBuffer,
      // @ts-ignore
      ].includes(c)));
    }

    if (this.opts.jsonSafe) {
      // None of these round-trip in JSON
      delete this.types.bigint;
      delete this.types.Boolean;
      delete this.types.Buffer;
      delete this.types.Date;
      delete this.types.Error;
      delete this.types.function;
      delete this.types.Map;
      delete this.types.Number;
      delete this.types.Promise;
      delete this.types.Proxy;
      delete this.types.RegExp;
      delete this.types.Set;
      delete this.types.String;
      delete this.types.symbol;
      delete this.types.TypedArray;
      delete this.types.undefined;
      delete this.types.URL;
      delete this.types.WeakMap;
      delete this.types.WeakSet;

      this.funNumbers = [0]; // That's not very fun
    }

    if (this.opts.noBoxed) {
      delete this.types.Boolean;
      delete this.types.Number;
      delete this.types.String;
    }

    this.typeNames = Object.keys(this.types).sort();
  }

  /**
   * Wrapper around this.opts.randBytes to default the reason.
   *
   * @param {number} num Number of bytes to generate.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {Buffer} The random bytes.
   * @private
   */
  _randBytes(num, reason = 'unspecified') {
    return this.opts.randBytes(num, reason);
  }

  /**
   * Random unsigned 32-bit integer.
   *
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {number} The random number.
   * @private
   */
  _randUInt32(reason = 'unspecified') {
    return this._randBytes(4, `_randUInt32,${reason}`).readUInt32BE(0);
  }

  /**
   * Random positive BigInt.
   *
   * @param {number} [bytes=-1] The number of bytes to generate, or -1
   *   to generate up to stringLength bytes.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {bigint} The random number.
   * @private
   */
  _randUBigInt(bytes = -1, reason = 'unspecified') {
    const len = (bytes === -1) ?
      this._upto(this.opts.stringLength - 1, `_randUBigInt len,${reason}`) + 1 :
      bytes;
    return BigInt(
      `0x${this._randBytes(len, `_randUBigInt,${reason}`).toString('hex')}`
    );
  }

  /**
   * Generate a random number (0,1].
   *
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {number} The random number.
   * @private
   */
  _random01(reason = 'unspecified') {
    const buf = this._randBytes(8, `_random01,${reason}`);
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
   * @private
   */
  _randomGauss(mean, stdDev, reason = 'unspecified') {
    // See: https://stackoverflow.com/a/60476586/8388 or
    // Section 3.4.1 of Donald Knuth's book The Art of Computer Programming
    if (this.spareGauss != null) {
      const ret = mean + (stdDev * this.spareGauss);
      this.spareGauss = null;
      return ret;
    }
    let v1 = 0;
    let v2 = 0;
    let s = 0;
    do {
      v1 = (2 * this._random01(reason)) - 1;
      v2 = (2 * this._random01(reason)) - 1;
      s = (v1 * v1) + (v2 * v2);
    } while ((s === 0) || (s >= 1));
    s = Math.sqrt(-2.0 * Math.log(s) / s);
    this.spareGauss = v2 * s;
    return mean + (stdDev * v1 * s);
  }

  /**
   * Generate a random positive integer less than a given number.
   *
   * @param {number} num One more than the maximum number generated.
   * @param {string} [reason='unspecified'] Reason for generation.
   * @returns {number} The random number.
   * @private
   */
  _upto(num, reason = 'unspecified') {
    if (num === 0) {
      return 0;
    }
    return (this._randUInt32(`_upto(${num}),${reason}`) % num);
  }

  /**
   * Pick an arbitrary element from the specified array.
   *
   * @template T
   * @param {Array<T>} ary Array to pick from, MUST NOT be empty.
   * @param {string} [reason='unspecified'] Reason reason for generation.
   * @returns {T} The selected array element.
   * @private
   */
  _pick(ary, reason = 'unspecified') {
    assert(ary.length > 0);
    return ary[this._upto(ary.length, `_pick(${ary.length}),${reason}`)];
  }

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
  _some(ary, reason = 'unspecified') {
    const ret = Array.prototype.filter.call(ary, () => this._upto(2, reason));
    return (typeof ary === 'string') ? ret.join('') : ret;
  }

  /**
   * Generate undefined.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {undefined} Always returns undefined.
   */
  // eslint-disable-next-line class-methods-use-this
  generate_undefined(depth = 0) {
    return undefined;
  }

  /**
   * Generate boolean.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @param {string} [reason='boolean'] Reason for generating bool.
   * @returns {boolean} True or false.
   */
  generate_boolean(depth = 0, reason = 'boolean') {
    return Boolean(this._upto(2, reason));
  }

  /**
   * Generate boxed Boolean.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Boolean} New Boolean(true) or new Boolean(false).
   */
  generate_Boolean(depth = 0) {
    // eslint-disable-next-line no-new-wrappers
    const n = new Boolean(this._upto(2, 'Boolean'));
    if (this.opts.output) {
      n[util.inspect.custom] = () => `new Boolean(${n.valueOf()})`;
    }
    // @ts-ignore -- I really mean Boolean, not boolean
    return n;
  }

  /**
   * Generate signed 32-bit integer.
   * Note: may be folded into generate_number later.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {number} 32-bit integer.
   */
  generate_integer(depth = 0) {
    return this._randUInt32('integer') - 0x7FFFFFFF;
  }

  /**
   * Generate 64-bit floating point number, with a 10% chance of something
   * "fun": 0, -0, NaN, Infinity, -Infinity.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {number} Number or edge case.
   */
  generate_number(depth = 0) {
    if (this._random01('number') < this.opts.edgeFreq) {
      return this._pick(this.funNumbers, 'fun number');
    }

    let n = Infinity;
    while (isNaN(n) || !isFinite(n)) {
      n = this._randBytes(8, 'number').readDoubleBE(0);
    }
    return n;
  }

  /**
   * Generate boxed 64-bit floating point Number, with a 10% chance of something
   * "fun": 0, -0, NaN, Infinity, -Infinity.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Number} Wrapped new Number(num).
   */
  generate_Number(depth = 0) {
    // eslint-disable-next-line no-new-wrappers
    const n = new Number(this.generate_number());
    if (this.opts.output) {
      n[util.inspect.custom] = () => `new Number(${n.valueOf()})`;
    }
    // @ts-ignore -- I really mean Number not number
    return n;
  }

  /**
   * Generate a {@linkcode https://nodejs.org/api/buffer.html Buffer} of up
   * to stringLength size.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Buffer} NodeJS Buffer.
   */
  generate_Buffer(depth = 0) {
    if (depth > this.opts.depth) {
      return Buffer.alloc(0);
    }
    const len = this._upto(this.opts.stringLength, 'Buffer length');
    const buf = this._randBytes(len, 'Buffer');
    if (this.opts.output) {
      buf[util.inspect.custom] =
        () => `Buffer.from('${buf.toString('hex')}', 'hex')`;
    }
    return buf;
  }

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
  generate_string(depth = 0, reason = 'string') {
    const script = this._pick(this.opts.scripts, `script,${reason}`);
    const points = scripts.get(script);
    const str = [];
    const len = this._upto(this.opts.stringLength, `stringLength,${reason}`);
    for (let i = 0; i < len;) {
      const point = this._pick(points, `codepoint,${reason}`);
      if (i === 0) {
        if (point.category !== 'Mn') {
          str.push(point.code);
          i++;
        }
      } else {
        str.push(point.code);
        i++;
      }
    }
    return String.fromCodePoint(...str);
  }

  /**
   * Generate a boxed String of up to stringLength size, all from the same
   * random Unicode script.  The first codepoint will not be a combining
   * character.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {String} Wrapped new String().
   */
  generate_String(depth = 0) {
    // eslint-disable-next-line no-new-wrappers
    const n = new String(this.generate_string(depth, 'String'));
    if (this.opts.output) {
      n[util.inspect.custom] = () => `new String('${n.valueOf()}')`;
    }
    // @ts-ignore -- I really want String not string
    return n;
  }

  /**
   * Generate a regular expression of up to stringLength size, all from the same
   * random Unicode script.  The first codepoint will not be a combining
   * character.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {RegExp} Generated regexp.
   */
  generate_RegExp(depth = 0) {
    // TODO: throw in some `.`, `*`, `+`, and parens for fun.
    let n = null;
    do {
      try {
        n = new RegExp(
          this.generate_string(depth, 'RegExp'),
          this.opts.cborSafe ? '' : this._some('gimsuy', 'RegExp flags')
        );
        if (this.opts.output) {
          const str = `new RegExp('${n.source}', '${n.flags}')`;
          n[util.inspect.custom] = () => str;
        }
      } catch (ignored) {
        // Lots of ways that a regex can be bad.
      }
    } while (!n);
    return n;
  }

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
  generate_URL(depth = 0) {
    // I *think* I made sure that the only way this can fail is if stringLength
    // is long enough that the overall URL is too long, but I only validated
    // that with a long simulation run, not by tracing the code in V8's URL
    // implementation, which dips liberally into ICU.

    // TODO: add valid xmpp:, tag:, and data: URIs, each of which have
    // interesting properties.  In particular, xmpp: breaks the URL class
    // because we usually use non-encoded IRIs there.
    const proto = this._pick([
      'http:', 'https:', 'ftp:',
    ], 'URL proto');
    const tld = this._pick(tlds.top, 'URL tld');

    let port = '';
    if (proto.startsWith('http')) {
      if (this._random01('URL port?') < this.opts.edgeFreq) {
        port = `:${this._upto(65536, 'URL port')}`;
      }
    }

    let pathname = '';
    if (this._random01('URL pathname?') < this.opts.edgeFreq) {
      pathname = this.generate_string(depth + 1, 'URL pathname');
    }

    let search = '';
    if (this._random01('URL search?') < this.opts.edgeFreq) {
      search = '?';

      // ArrayLength seems excessive, so I'm making an executive decision of "3"
      const len = this._upto(3, 'num search params');
      for (let i = 0; i < len; i++) {
        if (i !== 0) {
          search += '&';
        }
        search += this.generate_string(depth + 1, 'URL search name');
        search += '=';
        search += this.generate_string(depth + 1, 'URL search value');
      }
    }

    let hash = '';
    if (this._random01('URL hash?') < this.opts.edgeFreq) {
      hash += '#';
      hash += this.generate_string(depth + 1, 'URL hash');
    }

    const {script} = scripts.chars.get(tld.codePointAt(0));
    const str = [];
    const points = scripts.get(script, true);
    const lowercase = points.filter(
      c => ['Ll', 'Lo', 'Lm'].includes(c.category)
    );
    assert(lowercase.length > 0);

    // First codepoint lowercase-ish
    str.push(this._pick(lowercase, 'copdepoint1,URL').code);

    const more = points.filter(
      c => ['Ll', 'Lm', 'Lo', 'Nd', 'Mn', 'Mc'].includes(c.category)
    );
    const len = this._upto(this.opts.stringLength - 1, 'stringLength,URL');
    for (let i = 0; i < len; i++) {
      str.push(this._pick(more, 'codepoint,URL').code);
    }

    const tu = String.fromCodePoint(...str).normalize('NFC');
    const urls = `${proto}//${tu}.${tld}${port}/${pathname}${search}${hash}`;

    // Throws on invalid:
    const u = new URL(urls);
    if (this.opts.output) {
      u[util.inspect.custom] = () => `new URL('${u.toString()}')`;
    }
    return u;
  }

  /**
   * Generate an Array of up to arrayLength size, with each element of the
   * array being generated from the list of types this object currently
   * supports.  Generates an empty array (`[]`) if we're too deep already.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Array<any>} Generated array.
   */
  generate_Array(depth = 0) {
    if (depth > this.opts.depth) {
      return [];
    }
    const a = [];
    const len = this._upto(this.opts.arrayLength, 'arrayLength');
    for (let i = 0; i < len; i++) {
      a.push(this.generate(depth + 1));
    }
    return a;
  }

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
  generate_TypedArray(depth = 0) {
    const Type = this._pick(this.typedArrays, 'TypedArray type');
    const nm = Type.name;
    const len = (depth > this.opts.depth) ?
      0 :
      this._upto(this.opts.arrayLength, `${nm} len`);
    const sz = ('BYTES_PER_ELEMENT' in Type) ? Type.BYTES_PER_ELEMENT : 1;
    const buf = this._randBytes(sz * len, nm);

    let ab = null;
    let inspect = null;
    switch (Type) {
      case ArrayBuffer:
        ab = buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength
        );
        inspect = inspectArrayBuffer;
        break;
      case SharedArrayBuffer: {
        ab = new SharedArrayBuffer(buf.byteLength);
        const bsab = Buffer.from(ab);
        buf.copy(bsab);
        inspect = inspectSharedArrayBuffer;
        break;
      }
      case DataView:
        ab = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        inspect = inspectDataView;
        break;
      default:
        // @ts-ignore -- There might be one type that doesn't work correctly?
        ab = new Type(buf.buffer, buf.byteOffset, len);
        inspect = inspectTypedArray;
        break;
    }

    if (this.opts.output) {
      ab[util.inspect.custom] = inspect;
    }
    return ab;
  }

  /**
   * Generate a random object with up to arrayLength properties.  Will generate
   * null (an Object!) if we are too deep already.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {?Object} Object or null.
   */
  generate_object(depth = 0) {
    if (depth > this.opts.depth) {
      return null;
    }
    const o = {};
    const len = this._upto(this.opts.arrayLength, 'objectlen');
    for (let i = 0; i < len; i++) {
      o[this.generate_string(depth + 1, 'key')] = this.generate(depth + 1);
    }
    return o;
  }

  /**
   * Generate a random BigInt of up to stringLength bytes.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {bigint} Generated BigInt, possibly negative.
   */
  generate_bigint(depth = 0) {
    let bi = this._randUBigInt(-1, 'signed');
    if (this.generate_boolean(depth, 'bigint sign')) {
      bi *= -1n;
    }
    return bi;
  }

  /**
   * Generate a random Date, gaussian-distributed around today with a standard
   * deviation of 10 years.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Date} Generated Date.
   */
  generate_Date(depth = 0) {
    // A Number can exactly represent all integers from -9,007,199,254,740,992
    // to 9,007,199,254,740,992 (20.1.2.8 and 20.1.2.6). A time value supports
    // a slightly smaller range of -8,640,000,000,000,000 to
    // 8,640,000,000,000,000 milliseconds. This yields a supported time value
    // range of exactly -100,000,000 days to 100,000,000 days relative to
    // midnight at the beginning of 01 January, 1970 UTC.

    // Normally distribute the dates around today, with a standard deviation
    // of 10 years
    const n = this._randomGauss(new Date().getTime(), DATE_10YEARS, 'date');
    const d = new Date(n);
    if (this.opts.output) {
      d[util.inspect.custom] = () => `new Date(${n})`;
    }
    return d;
  }

  /**
   * Generate a random Error.  If an AggregateError is selected, fill it with
   * random Errors.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Error} Generated Error.
   */
  generate_Error(depth = 0) {
    const Cls = this._pick(this.ErrorConstructors, 'errorClass');
    const msg = this.generate_string(depth + 1, 'errorMessage');
    let er = null;
    if (Cls === AggregateError) {
      const ers = [];
      if (depth <= this.opts.depth) {
        const len = this._upto(this.opts.arrayLength, 'AggregateErrorLength');
        for (let i = 0; i < len; i++) {
          ers.push(this.generate_Error(depth + 1));
        }
      }
      er = new AggregateError(ers, msg, ERROR_OPTS);
      if (this.opts.output) {
        er[util.inspect.custom] =
          () => `new AggregateError(${util.inspect(ers)}, '${msg}', ${util.inspect(ERROR_OPTS)})`;
      }
    } else {
      er = new /** @type ErrorConstructor */(Cls)(msg, ERROR_OPTS);
      if (this.opts.output) {
        er[util.inspect.custom] = () => `new ${Cls.name}('${msg}', ${util.inspect(ERROR_OPTS)})`;
      }
    }
    return er;
  }

  /**
   * Generate a rejected or resolved promise.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Promise<any>} Resolved or rejected promise.
   */
  generate_Promise(depth = 0) {
    if (this._random01('promiseReject') < this.opts.edgeFreq) {
      const er = this.generate_Error(depth + 1);
      const ret = Promise.reject(er);
      if (this.opts.output) {
        ret[util.inspect.custom] = () => `Promise.reject(${util.inspect(er)})`;
      }
      return ret;
    }
    const res = this.generate(depth + 1);
    const ret = Promise.resolve(res);
    if (this.opts.output) {
      ret[util.inspect.custom] = () => `Promise.resolve(${util.inspect(res)})`;
    }
    return ret;
  }

  /**
   * Generate a symbol from a random string.  This will intern the Symbol
   * with Symbol.for to make testing possible.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {symbol} Generated Symbol.
   */
  generate_symbol(depth = 0) {
    return Symbol.for(this.generate_string(depth + 1, 'symbol'));
  }

  /**
   * Generate a random Map with up to arrayLength elements.  If we are too
   * deep already, will generate an empty Map.  Each key and value will be
   * of a random type currently supported by this object.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Map} Generated Map.
   */
  generate_Map(depth = 0) {
    const m = new Map();
    const len = (depth > this.opts.depth) ?
      0 :
      this._upto(this.opts.arrayLength, 'Map len');

    for (let i = 0; i < len; i++) {
      m.set(this.generate(depth + 1), this.generate(depth + 1));
    }
    if (this.opts.output) {
      m[util.inspect.custom] = inspectMap;
    }
    return m;
  }

  /**
   * Generate a Proxy over a random object.  If we are already too deep,
   * generates a null.  If in output mode, generates a fake Proxy which
   * can have a custom inspect on it -- that may not be possible for a
   * real proxy, since util.inspect treats Proxy objects specially.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Proxy|Object} Plain object in output mode, otherwise Proxy.
   */
  generate_Proxy(depth = 0) {
    if (depth > this.opts.depth) {
      return null;
    }

    const o = this.generate_object(depth); // Not +1.  Can't use a null.
    if (this.opts.output) {
      const p = {
        [FAKE_PROXY]: o,
      };
      p[util.inspect.custom] = inspectProxy;
      return p;
    }
    return new Proxy(o, {});
  }

  /**
   * Generate a Set of random things, with length up to arrayLength, and each
   * element being any one of the types this object currently supports.  If
   * we are already too deep, generates an empty set.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Set} Generated Set.
   */
  generate_Set(depth = 0) {
    const s = new Set();
    const len = (depth > this.opts.depth) ?
      0 :
      this._upto(this.opts.arrayLength, 'setlen');
    for (let i = 0; i < len; i++) {
      s.add(this.generate(depth + 1));
    }
    if (this.opts.output) {
      s[util.inspect.custom] = inspectSet;
    }
    return s;
  }

  /**
   * Generate a function of a random "species".  The current species list is
   * stored in this.functionSpecies.  See [tutorial](tutorials/functions.md) for
   * more information.  If we are already too deep, generates `() => {}`.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {function} Generated function.
   */
  generate_function(depth = 0) {
    let f = null;
    if (depth > this.opts.depth) {
      // eslint-disable-next-line no-eval
      f = eval('() => {}');
    } else {
      // We'll use this as the function name (if needed) and the return value
      const val = this.generate_string(depth, 'function');

      const species = this._pick(this.functionSpecies, 'function species');

      switch (species) {
        case '[Function (anonymous)]':
          // eslint-disable-next-line no-eval
          f = eval(`() => '${val}'`);
          break;
        case '[Function: anonymous]':
          // eslint-disable-next-line no-new-func
          f = new Function(`return '${val}'`);
          break;
        case '[Function: f1]':
          // Leave f inside to get function named
          // eslint-disable-next-line no-eval
          eval(`f = function() { return '${val}' }`);
          break;
        case '[Function: f2]':
          // eslint-disable-next-line no-eval
          f = eval(`(function f2() { return '${val}' })`);
          break;
        case '[AsyncFunction (anonymous)]':
          // eslint-disable-next-line no-eval
          f = eval(`async() => '${val}'`);
          break;
        case '[AsyncFunction: anonymous]': {
          const AF = Object.getPrototypeOf(
            // eslint-disable-next-line @stylistic/max-len
            // eslint-disable-next-line func-names, prefer-arrow-callback, no-empty-function
            /* c8 ignore next */async function() { }
          ).constructor;
          f = new AF(`return '${val}'`);
          break;
        }
        case '[AsyncFunction: f1]':
          // Leave f inside to get function named
          // eslint-disable-next-line no-eval
          eval(`f = async() => '${val}'`);
          break;
        case '[AsyncFunction: f2]':
          // Leave f inside to get function named
          // eslint-disable-next-line no-eval
          eval(`f = async function() { return '${val}' }`);
          break;
        case '[AsyncFunction: f3]':
          // eslint-disable-next-line no-eval
          f = eval(`(async function f3() { return '${val}' })`);
          break;
        case '[GeneratorFunction (anonymous)]':
          // eslint-disable-next-line no-eval
          f = eval(`(function*() { yield '${val}' })`);
          break;
        case '[GeneratorFunction: anonymous]': {
          const GF = Object.getPrototypeOf(
            // eslint-disable-next-line func-names, no-empty-function
            /* istanbul ignore next */ function *() { }
          ).constructor;
          f = new GF(`yield '${val}'`);
          break;
        }
        case '[GeneratorFunction: f1]':
          // Leave f inside to get function named
          // eslint-disable-next-line no-eval
          eval(`f = function * () { yield '${val}' }`);
          break;
        case '[GeneratorFunction: f2]':
          // eslint-disable-next-line no-eval
          f = eval(`(function *f2() { yield '${val}' })`);
          break;
        case '[AsyncGeneratorFunction (anonymous)]':
          // eslint-disable-next-line no-eval
          f = eval(`(async function*() { yield '${val}' })`);
          break;
        case '[AsyncGeneratorFunction: anonymous]': {
          const AGF = Object.getPrototypeOf(
            // eslint-disable-next-line func-names, no-empty-function
            /* istanbul ignore next */ async function *() { }
          ).constructor;
          f = new AGF(`yield '${val}'`);
          break;
        }
        case '[AsyncGeneratorFunction: f1]':
          // Leave f inside to get function named
          // eslint-disable-next-line no-eval
          eval(`f = async function * () { yield '${val}' }`);
          break;
        case '[AsyncGeneratorFunction: f2]':
          // eslint-disable-next-line no-eval
          f = eval(`(async function *f2() { yield '${val}' })`);
          break;
      }
    }

    if (this.opts.output) {
      f[util.inspect.custom] = () => f.toString();
    }
    return f;
  }

  /**
   * Generate a random type that this object currently supports.  Returns
   * null if we're already too deep.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {any} Might generate... Anything!
   */
  generate(depth = 0) {
    if (depth > this.opts.depth) {
      return null;
    }
    const typN = this._pick(this.typeNames, 'type');
    const typ = this.types[typN];
    return typ.call(this, depth + 1);
  }

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
  static quoteSymbols(str) {
    return str.replace(/Symbol\((?<name>.+?)\)/g, 'Symbol.for(\'$<name>\')');
  }
}
