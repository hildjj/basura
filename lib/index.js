import * as tlds from 'tlds2';
import * as util from 'node:util';
import {Random, randBytes} from '@cto.af/random';
import {Scripts, ZALGO} from './scripts.js';
import {
  boxed, cborUnsafe, decorateMethod, freq, jsonUnsafe, weak,
} from './decorators.js';
import {Buffer} from 'node:buffer';
import {FakeSymbol} from './fakeSymbol.js';
import {strict as assert} from 'node:assert';

const DATE_10YEARS = 315569520000;
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

/**
 * Update inspect options to subtract one from the depth.
 *
 * @param {import('util').InspectOptions} [options] Original opts.
 * @param {import('util').InspectOptions} [extra] Extra options to add in.
 * @returns {import('util').InspectOptions} Combined.
 * @private
 */
function inspectOpts(options, extra = {}) {
  return {
    ...options,
    depth: options.depth == null ? null : options.depth - 1,
    ...extra,
  };
}

/**
 * Set the custom inspection function in such a way that it does not show up
 * in normal inspects.
 *
 * @param {object} obj Object to set a custom inspector on.
 * @param {string|((inspect: (sub: any) => any) => any)} fn Function for custom
 *   inspection.  Param is a function that can be used for inspecting sub-items.
 *   Alternately, a string with the inspection pre-computed.
 * @param {util.InspectOptions} [extra] Extra options when calling sub-inspect.
 * @private
 */
function setInspect(obj, fn, extra) {
  Object.defineProperty(obj, util.inspect.custom, {
    value(_depth, opts, inspect) {
      return (typeof fn === 'function') ?
        fn(o => inspect(o, inspectOpts(opts, extra))) :
        fn;
    },
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

function inspectTypedArray(_depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...this], inspectOpts(options));
  // eslint-disable-next-line no-invalid-this
  return `new ${this.constructor.name}(${inner})`;
}

function inspectArrayBuffer(_depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...new Uint8Array(this)], inspectOpts(options));
  return `new Uint8Array(${inner}).buffer`;
}

function inspectSharedArrayBuffer(_depth, options) {
  // eslint-disable-next-line no-invalid-this
  const inner = util.inspect([...new Uint8Array(this)], inspectOpts(options));
  // eslint-disable-next-line no-invalid-this
  return `(() => { const s = new SharedArrayBuffer(${this.byteLength}); const b = Buffer.from(s); Buffer.from(${inner}).copy(b); return s })()`;
}

function inspectDataView(depth, options) {
  /* eslint-disable no-invalid-this */
  const ab = this.buffer.slice(
    this.byteOffset,
    this.byteOffset + this.byteLength
  );
  /* eslint-enable no-invalid-this */

  const inner = inspectArrayBuffer.call(
    ab,
    depth + 1,
    inspectOpts(options)
  );
  return `new DataView(${inner})`;
}

/**
 * Function to generate basura of a certain type.  Called with `this` the
 * current Basura instance.
 *
 * @template T
 * @typedef {(this: Basura, depth?: number) => T|null} BasuraGen
 */

/**
 * @typedef {object} GenMeta
 * @property {number} [freq] Relative frequency for this generator.
 * @property {boolean} [boxed] Generates a boxed type.
 * @property {boolean} [cborUnsafe] Generator unsafe for CBOR.
 * @property {boolean} [jsonUnsafe] Generator unsafe for JSON.
 * @property {boolean} [weak] Generates a type that can be weakly held.
 */

/**
 * @template T
 * @typedef {BasuraGen<T> & GenMeta} BasuraGenerator
 */

/**
 * Create garbage javascript types for testing.
 */
export class Basura {
  #rand;

  /**
   * Create some Basura.
   *
   * @param {object} [opts={}] Options.
   * @param {number} [opts.arrayLength=10] Maximum size of arrays and objects.
   * @param {boolean} [opts.cborSafe=false] Generate only CBOR-safe types?
   * @param {number} [opts.depth=5] Maximum depth of object to create.
   * @param {number} [opts.edgeFreq=0.1] How often do edge cases happen (0-1)?
   * @param {boolean} [opts.fakeSymbols=false] Instead of generating symbols,
   *   generate an object that will inspect as Symbol.for('string').
   * @param {boolean} [opts.jsonSafe=false] Generate only JSON-safe types?
   * @param {boolean} [opts.noBoxed=false] Ignore boxed types, like String?
   * @param {boolean} [opts.output=false] Add custom inspect functions that
   *   make output parseable JS?
   * @param {import('@cto.af/random').RandBytes} [opts.randBytes] Randomness
   *   source.  Defaults to a thin wrapper around
   *   {@linkcode http://bit.ly/3dV5sSf crypto.randomBytes}.
   * @param {Array<string>} [opts.scripts] List of script names to select from
   *   for generating strings.  Defaults to all Unicode scripts from
   *   data.json.
   * @param {number} [opts.stringLength=20] Maximum size of generated strings.
   *   (in codepoints), BigInts (in bytes), and buffers (in bytes).
   * @param {Record<string, ?BasuraGenerator<unknown>>} [opts.types]
   *   Additional types.  The key is the type name, the value is a function
   *   used to generate, or null to prevent that type from being generated.
   * @param {number} [opts.zalgoHeight=0] Maximum depth for zalgofication. Use
   *   0 to disable.
   * @param {number} [opts.zalgoFreq=0.2] How frequently to zalgofy strings
   *   (0-1).
   */
  constructor(opts = {}) {
    this.opts = {
      arrayLength: 10,
      cborSafe: false,
      depth: 5,
      edgeFreq: 0.1,
      fakeSymbols: false,
      jsonSafe: false,
      noBoxed: false,
      output: false,
      randBytes,
      scripts: scripts.scripts,
      stringLength: 20,
      types: {},
      catchUnhandled: true,
      zalgoHeight: 0,
      zalgoFreq: 0.2,
      ...opts,
    };

    /** @type {WeakMap<any, any[]>} */
    this.weakMembers = new WeakMap();

    /** @private */
    this.#rand = new Random(this.opts.randBytes);

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
      for (const n of Object.getOwnPropertyNames(o)) {
        const m = n.match(/^generate_(?<rest>.*)/);
        if (m && (typeof this[n] === 'function')) {
          if (!(m.groups.rest in this.types)) {
            this.types[m.groups.rest] = this[n];
          }
        }
      }
    }

    if (this.opts.cborSafe) {
      // None of these round-trip in CBOR yet.
      this.typedArrays = this.typedArrays.filter(c => !([
        ArrayBuffer,
        DataView,
        SharedArrayBuffer,
      // @ts-ignore
      ].includes(c)));
    }

    if (this.opts.jsonSafe) {
      this.funNumbers = [0]; // That's not very fun
    }

    const typeEntries = Object.entries(this.types).filter(([_nm, fn]) => {
      if (!fn) {
        return false;
      }
      if (this.opts.noBoxed && fn.boxed) {
        return false;
      }
      if (this.opts.jsonSafe && fn.jsonUnsafe) {
        return false;
      }
      if (this.opts.cborSafe && fn.cborUnsafe) {
        return false;
      }
      return true;
    });
    typeEntries.sort(([a], [b]) => (a < b ? -1 : 1));

    this.validWeak = typeEntries
      .filter(([_nm, fn]) => fn.weak)
      .map(([nm]) => nm);

    this.typeNames = typeEntries.map(([nm]) => nm);
    Random.assignWeights(
      this.typeNames,
      typeEntries.map(([_nm, fn]) => fn.freq ?? 1)
    );
  }

  #randWeak(depth = 0, reason = 'unspecified') {
    const gen = this.#rand.pick(this.validWeak, reason);
    const typ = this.types[gen];
    return typ.call(this, depth); // Not +1.  Can't take null.
  }

  /**
   * Generate undefined.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {undefined} Always returns undefined.
   */
  // eslint-disable-next-line class-methods-use-this
  generate_undefined(_depth = 0) {
    return undefined;
  }

  /**
   * Generate boolean.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @param {string} [reason='boolean'] Reason for generating bool.
   * @returns {boolean} True or false.
   */
  generate_boolean(_depth = 0, reason = 'boolean') {
    return this.#rand.bool(reason);
  }

  /**
   * Generate boxed Boolean.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Boolean} New Boolean(true) or new Boolean(false).
   */
  generate_Boolean(_depth = 0) {
    // eslint-disable-next-line no-new-wrappers
    const n = new Boolean(this.#rand.bool('Boolean'));
    if (this.opts.output) {
      setInspect(n, () => `new Boolean(${n.valueOf()})`);
    }
    // @ts-ignore -- I really mean Boolean, not boolean
    return n;
  }

  /**
   * Generate signed 32-bit integer.
   * Note: may be folded into generate_number later.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {number} 32-bit integer.
   */
  generate_integer(_depth = 0) {
    return this.#rand.uInt32('integer') - 0x7FFFFFFF;
  }

  /**
   * Generate 64-bit floating point number, with a 10% chance of something
   * "fun": 0, -0, NaN, Infinity, -Infinity.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {number} Number or edge case.
   */
  generate_number(_depth = 0) {
    if (this.#rand.random('number') < this.opts.edgeFreq) {
      return this.#rand.pick(this.funNumbers, 'fun number');
    }

    let n = Infinity;
    while (isNaN(n) || !isFinite(n)) {
      n = Buffer.from(this.#rand.bytes(8, 'number')).readDoubleBE(0);
    }
    return n;
  }

  /**
   * Generate boxed 64-bit floating point Number, with a 10% chance of something
   * "fun": 0, -0, NaN, Infinity, -Infinity.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Number} Wrapped new Number(num).
   */
  generate_Number(_depth = 0) {
    // eslint-disable-next-line no-new-wrappers
    const n = new Number(this.generate_number());
    if (this.opts.output) {
      setInspect(n, () => `new Number(${n.valueOf()})`);
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
    let buf = null;
    if (depth > this.opts.depth) {
      buf = Buffer.alloc(0);
    } else {
      const len = this.#rand.upto(this.opts.stringLength, 'Buffer length');
      buf = Buffer.from(this.#rand.bytes(len, 'Buffer'));
    }
    if (this.opts.output) {
      setInspect(buf, () => `Buffer.from('${buf.toString('hex')}', 'hex')`);
    }
    return buf;
  }

  /**
   * Generate a string of up to stringLength size, all from the same random
   * Unicode script.  The first codepoint will not be a combining character.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @param {string} [reason='string'] Reason for generation, since this
   *   function is called by others.
   * @param {string} [script] If specified, use this script instead of a
   *   random one.
   * @returns {string} Generated string.
   */
  generate_string(_depth = 0, reason = 'string', script = undefined) {
    script ??= this.#rand.pick(this.opts.scripts, `script,${reason}`);
    const points = scripts.get(script);
    const str = [];
    const len = this.#rand.upto(this.opts.stringLength, `stringLength,${reason}`);

    // Put this after script to make testing more palatable.
    const z = ((this.opts.zalgoHeight !== 0) &&
               (this.opts.zalgoFreq !== 0) &&
               (this.#rand.random(`zalgoFreq,${reason}`) < this.opts.zalgoFreq));

    for (let i = 0; i < len;) {
      const point = this.#rand.pick(points, `codepoint,${reason}`);
      if (i === 0) {
        if (point.category !== 'Mn') {
          str.push(point.code);
          i++;
        }
      } else {
        str.push(point.code);
        i++;
      }
      if (z) {
        str.push(this.#rand.pick(ZALGO.M, `M,zalgo,${reason}`));
        const numTop = this.#rand.upto(this.opts.zalgoHeight, `numTop,zalgo,${reason}`);
        for (let j = 0; j < numTop; j++) {
          str.push(this.#rand.pick(ZALGO.T, `T,zalgo,${reason}`));
        }
        const numBottom = this.#rand.upto(this.opts.zalgoHeight, `numBottom,zalgo,${reason}`);
        for (let j = 0; j < numBottom; j++) {
          str.push(this.#rand.pick(ZALGO.B, `B,zalgo,${reason}`));
        }
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
      setInspect(n, () => `new String('${n.valueOf()}')`);
    }
    // @ts-ignore -- I really want String not string
    return n;
  }

  generate_paragraph(depth = 0) {
    const script = this.#rand.pick(this.opts.scripts, 'script,paragraph');
    const a = [];
    const len = this.#rand.upto(this.opts.arrayLength, 'arrayLength');
    for (let i = 0; i < len; i++) {
      a.push(this.generate_string(depth + 1, 'paragraph', script));
    }
    return a.join(' ');
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
          this.opts.cborSafe ? '' : this.#rand.some('gimsuy', 'RegExp flags')
        );
        if (this.opts.output) {
          setInspect(n, `/${n.source}/${n.flags}`);
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
    const proto = this.#rand.pick([
      'http:', 'https:', 'ftp:',
    ], 'URL proto');
    const tld = this.#rand.pick(tlds.top, 'URL tld');

    let port = '';
    if (proto.startsWith('http')) {
      if (this.#rand.random('URL port?') < this.opts.edgeFreq) {
        port = `:${this.#rand.upto(65536, 'URL port')}`;
      }
    }

    let pathname = '';
    if (this.#rand.random('URL pathname?') < this.opts.edgeFreq) {
      pathname = this.generate_string(depth + 1, 'URL pathname');
    }

    let search = '';
    if (this.#rand.random('URL search?') < this.opts.edgeFreq) {
      search = '?';

      // ArrayLength seems excessive, so I'm making an executive decision of "3"
      const len = this.#rand.upto(3, 'num search params');
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
    if (this.#rand.random('URL hash?') < this.opts.edgeFreq) {
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
    str.push(this.#rand.pick(lowercase, 'copdepoint1,URL').code);

    const more = points.filter(
      c => ['Ll', 'Lm', 'Lo', 'Nd', 'Mn', 'Mc'].includes(c.category)
    );
    const len = this.#rand.upto(this.opts.stringLength - 1, 'stringLength,URL');
    for (let i = 0; i < len; i++) {
      str.push(this.#rand.pick(more, 'codepoint,URL').code);
    }

    const tu = String.fromCodePoint(...str).normalize('NFC');
    const urls = `${proto}//${tu}.${tld}${port}/${pathname}${search}${hash}`;

    // Throws on invalid:
    const u = new URL(urls);
    if (this.opts.output) {
      setInspect(u, () => `new URL('${u.toString()}')`);
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
    const len = this.#rand.upto(this.opts.arrayLength, 'arrayLength');
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
    const Type = this.#rand.pick(this.typedArrays, 'TypedArray type');
    const nm = Type.name;
    const len = (depth > this.opts.depth) ?
      0 :
      this.#rand.upto(this.opts.arrayLength, `${nm} len`);
    const sz = ('BYTES_PER_ELEMENT' in Type) ? Type.BYTES_PER_ELEMENT : 1;
    const buf = Buffer.from(this.#rand.bytes(sz * len, nm));

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
  generate_Object(depth = 0) {
    if (depth > this.opts.depth) {
      return null;
    }
    const o = {};
    const len = this.#rand.upto(this.opts.arrayLength, 'objectlen');
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
    const len = this.#rand.upto(this.opts.stringLength - 1, 'uBigInt len') + 1;
    let bi = this.#rand.uBigInt(len, 'uBigInt unsigned');
    if (this.generate_boolean(depth, 'uBigInt sign')) {
      bi *= -1n;
    }
    return bi;
  }

  /**
   * Generate a random Date, gaussian-distributed around today with a standard
   * deviation of 10 years.
   *
   * @param {number} [_depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Date} Generated Date.
   */
  generate_Date(_depth = 0) {
    // A Number can exactly represent all integers from -9,007,199,254,740,992
    // to 9,007,199,254,740,992 (20.1.2.8 and 20.1.2.6). A time value supports
    // a slightly smaller range of -8,640,000,000,000,000 to
    // 8,640,000,000,000,000 milliseconds. This yields a supported time value
    // range of exactly -100,000,000 days to 100,000,000 days relative to
    // midnight at the beginning of 01 January, 1970 UTC.

    // Normally distribute the dates around today, with a standard deviation
    // of 10 years
    const n = this.#rand.gauss(new Date().getTime(), DATE_10YEARS, 'date');
    const d = new Date(n);
    if (this.opts.output) {
      setInspect(d, () => `new Date(${n})`);
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
    const Cls = this.#rand.pick(this.ErrorConstructors, 'errorClass');
    const msg = this.generate_string(depth + 1, 'errorMessage');
    let er = null;
    if (Cls === AggregateError) {
      const ers = [];
      if (depth <= this.opts.depth) {
        const len = this.#rand.upto(this.opts.arrayLength, 'AggregateErrorLength');
        for (let i = 0; i < len; i++) {
          ers.push(this.generate_Error(depth + 1));
        }
      }
      er = new AggregateError(ers, msg, ERROR_OPTS);
      if (this.opts.output) {
        setInspect(
          er,
          inspect => `new AggregateError(${inspect(ers)}, '${msg}', ${inspect(ERROR_OPTS)})`
        );
      }
    } else {
      er = new /** @type ErrorConstructor */(Cls)(msg, ERROR_OPTS);
      if (this.opts.output) {
        setInspect(
          er,
          inspect => `new ${Cls.name}('${msg}', ${inspect(ERROR_OPTS)})`
        );
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
    if (this.#rand.random('promiseReject') < this.opts.edgeFreq) {
      const er = this.generate_Error(depth + 1);
      const ret = Promise.reject(er);
      if (this.opts.output) {
        setInspect(ret, inspect => `Promise.reject(${inspect(er)})`);
      }
      return ret;
    }
    const res = this.generate(depth + 1);
    const ret = Promise.resolve(res);

    // If the promised result is another promise, it will already have an
    // inspector set.
    if (!(res instanceof Promise)) {
      setInspect(ret, inspect => `Promise.resolve(${inspect(res)})`);
    }
    return ret;
  }

  /**
   * Generate a WeakSet containing 0 or more sub-items of any valid type.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {WeakSet} Generated.
   */
  generate_WeakSet(depth = 0) {
    const vals = [];
    if (depth <= this.opts.depth) {
      const len = this.#rand.upto(this.opts.arrayLength, 'weakSetSize');
      for (let i = 0; i < len; i++) {
        vals.push(this.#randWeak(depth, 'weakSetClass'));
      }
    }
    const ret = new WeakSet(vals);
    this.weakMembers.set(ret, vals);
    if (this.opts.output) {
      setInspect(ret, inspect => `new WeakSet(${inspect(vals)})`);
    }
    return ret;
  }

  /**
   * Generate a WeakMap containing 0 or more key/value pairs where the keys
   * are valid weak items, and the values can be any valid type.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {WeakMap} Generated.
   */
  generate_WeakMap(depth = 0) {
    /** @type [object, any][] */
    const entries = [];
    if (depth <= this.opts.depth) {
      const len = this.#rand.upto(this.opts.arrayLength, 'weakMapSize');
      for (let i = 0; i < len; i++) {
        entries.push([
          this.#randWeak(depth, 'weakMapKeyClass'),
          this.generate(depth + 1),
        ]);
      }
    }
    const ret = new WeakMap(entries);
    this.weakMembers.set(ret, entries);
    if (this.opts.output) {
      setInspect(ret, inspect => `new WeakMap(${inspect(entries)})`);
    }
    return ret;
  }

  generate_WeakRef(depth = 0) {
    // Can't take null, so ensure depth is ok.
    const o = this.#randWeak(depth - 1, 'weakRef');
    const ret = new WeakRef(o);
    this.weakMembers.set(ret, [o]);
    if (this.opts.output) {
      setInspect(ret, inspect => `new WeakRef(${inspect(o)})`);
    }
    return ret;
  }

  /**
   * Generate a symbol from a random string.  This will intern the Symbol
   * with Symbol.for to make testing possible.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {symbol|FakeSymbol} Generated Symbol.
   */
  generate_symbol(depth = 0) {
    if (this.opts.fakeSymbols) {
      return new FakeSymbol(this.generate_string(depth + 1, 'symbol'));
    }
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
      this.#rand.upto(this.opts.arrayLength, 'Map len');

    for (let i = 0; i < len; i++) {
      m.set(this.generate(depth + 1), this.generate(depth + 1));
    }
    if (this.opts.output) {
      setInspect(m, inspect => {
        const inner = inspect([...m.entries()]);
        return `new Map(${inner})`;
      });
    }
    return m;
  }

  /**
   * Generate a Proxy over a random object.  If we are already too deep,
   * generates a Proxy around `{}`.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Proxy} Plain object in output mode, otherwise Proxy.
   */
  generate_Proxy(depth = 0) {
    const o = (depth > this.opts.depth) ?
      {} :
      this.generate_Object(depth); // Not +1.  Can't use a null.

    const p = new Proxy(o, {});
    this.weakMembers.set(p, [o]);
    if (this.opts.output) {
      // Make a copy of o so that the custom inspect doesn't fire for
      // o, but does fire for all of the things inside it.
      setInspect(p, inspect => `new Proxy(${inspect({...o})}, {})`);
    }
    return p;
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
      this.#rand.upto(this.opts.arrayLength, 'setlen');
    for (let i = 0; i < len; i++) {
      s.add(this.generate(depth + 1));
    }
    if (this.opts.output) {
      setInspect(s, inspect => `new Set(${inspect([...s.values()])})`);
    }
    return s;
  }

  /**
   * Generate a function of a random "species".  The current species list is
   * stored in this.functionSpecies.  See
   * [tutorial](https://github.com/hildjj/basura/blob/main/tutorials/functions.md)
   * for more information.  If we are already too deep, generates `() => {}`.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {function} Generated function.
   */
  generate_function(depth = 0) {
    /* eslint-disable no-eval */
    let f = null;
    if (depth > this.opts.depth) {
      f = eval('() => {}');
    } else {
      // We'll use this as the function name (if needed) and the return value
      const val = this.generate_string(depth, 'function');

      const species = this.#rand.pick(this.functionSpecies, 'function species');

      switch (species) {
        case '[Function (anonymous)]':
          f = eval(`() => '${val}'`);
          break;
        case '[Function: anonymous]':
          // eslint-disable-next-line no-new-func
          f = new Function(`return '${val}'`);
          break;
        case '[Function: f1]':
          // Leave f inside to get function named
          eval(`f = function() { return '${val}' }`);
          break;
        case '[Function: f2]':
          f = eval(`(function f2() { return '${val}' })`);
          break;
        case '[AsyncFunction (anonymous)]':
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
          eval(`f = async() => '${val}'`);
          break;
        case '[AsyncFunction: f2]':
          // Leave f inside to get function named
          eval(`f = async function() { return '${val}' }`);
          break;
        case '[AsyncFunction: f3]':
          f = eval(`(async function f3() { return '${val}' })`);
          break;
        case '[GeneratorFunction (anonymous)]':
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
          eval(`f = function * () { yield '${val}' }`);
          break;
        case '[GeneratorFunction: f2]':
          f = eval(`(function *f2() { yield '${val}' })`);
          break;
        case '[AsyncGeneratorFunction (anonymous)]':
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
          eval(`f = async function * () { yield '${val}' }`);
          break;
        case '[AsyncGeneratorFunction: f2]':
          f = eval(`(async function *f2() { yield '${val}' })`);
          break;
      }
      /* eslint-enable no-eval */
    }

    if (this.opts.output) {
      setInspect(f, () => f.toString());
    }
    return f;
  }

  /**
   * Generate a generator that yields basura.
   *
   * @param {number} [depth=0] How deep are we in the generated tree of
   *   objects already?
   * @returns {Generator} Generated.
   */
  generate_Generator(depth = 0) {
    const o = this.generate_Array(depth + 1);
    const res = (function *gen() {
      yield *o;
    }());
    this.weakMembers.set(res, o);
    if (this.opts.output) {
      setInspect(res, inspect => `(function *gen() { yield *${inspect(o)}; }())`);
    }
    return res;
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
    const typN = this.#rand.pick(this.typeNames, 'type');
    const typ = this.types[typN];
    return typ.call(this, depth + 1);
  }

  /** @type {[string, ...import("./decorators.js").MethodDecorator[]][]} */
  static annotations = [
    ['Array', weak],
    ['Boolean', freq(0.2), boxed, cborUnsafe, jsonUnsafe, weak],
    ['Buffer', jsonUnsafe, weak],
    ['Date', jsonUnsafe, weak],
    ['Error', freq(0.2), cborUnsafe, jsonUnsafe, weak],
    ['Generator', freq(0.1), cborUnsafe, jsonUnsafe],
    ['Map', jsonUnsafe, weak],
    ['Number', freq(0.2), boxed, cborUnsafe, jsonUnsafe, weak],
    ['Object', weak],
    ['Promise', freq(0.1), cborUnsafe, jsonUnsafe, weak],
    ['Proxy', freq(0.1), cborUnsafe, jsonUnsafe, weak],
    ['RegExp', jsonUnsafe, weak],
    ['Set', jsonUnsafe, weak],
    ['String', freq(0.2), boxed, cborUnsafe, jsonUnsafe, weak],
    ['TypedArray', jsonUnsafe, weak],
    ['URL', jsonUnsafe, weak],
    ['WeakMap', cborUnsafe, jsonUnsafe],
    ['WeakRef', cborUnsafe, jsonUnsafe],
    ['WeakSet', cborUnsafe, jsonUnsafe],
    ['bigint', jsonUnsafe],
    ['function', freq(0.4), cborUnsafe, jsonUnsafe],
    ['symbol', cborUnsafe, jsonUnsafe],
    ['undefined', jsonUnsafe],
  ];

  static {
    // In the future, use JS decorators.
    this.annotations.forEach(([nm, ...dex]) => decorateMethod(
      dex, Basura.prototype, `generate_${nm}`
    ));
  }
}

export {
  FakeSymbol,
};
