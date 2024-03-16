import {Basura} from '../../lib/index.js';
import {Buffer} from 'buffer';
import {Modnar} from './modnar.js';
import {Scripts} from '../../lib/scripts.js';
import assert from 'node:assert';
import tlds from 'tlds2';
import util from 'util';

const scripts = Scripts.instance();
const ONEISH = 1 - Number.EPSILON;

/**
 * Un-generate garbage.  Inverse of Basura, for creating test cases.
 */
export class Arusab extends Basura {
  rand = new Modnar();

  constructor(opts) {
    super(opts);
  }

  get source() {
    return this.rand.source;
  }

  get isDone() {
    return this.rand.isDone;
  }

  drop(reason) {
    return this.rand.drop(reason);
  }

  generate_boolean(b, depth = 0, reason = 'boolean') {
    this.rand.bool(b, reason);
  }

  generate_Boolean(b, depth = 0) {
    this.rand.bool(b, 'Boolean');
  }

  generate_integer(i) {
    this.rand.uInt32(i + 0x7FFFFFFF, 'integer');
  }

  generate_number(n) {
    const i = this.funNumbers.findIndex(o => Object.is(o, n));
    if (i !== -1) {
      this.rand.random(this.opts.edgeFreq / 2, 'number');
      this.rand.upto(
        i,
        this.funNumbers.length,
        `pick(${this.funNumbers.length}),fun number`
      );
      return;
    }
    this.rand.random(ONEISH, 'number');
    const b = Buffer.alloc(8);
    b.writeDoubleBE(n);
    this.rand.bytes(b, 'number');
  }

  generate_Number(n, depth = 0) {
    this.generate_number(n.valueOf());
  }

  generate_Buffer(b, depth = 0) {
    if (depth > this.opts.depth) {
      return;
    }
    this.rand.upto(b.length, this.opts.stringLength, 'Buffer length');
    this.rand.bytes(Buffer.concat([b]), 'Buffer');
  }

  generate_string(txt, depth, reason = 'string') {
    const cp = txt.codePointAt(0);
    const {script} = scripts.chars.get(cp);
    this.rand.pick(script, this.opts.scripts, `script,${reason}`);
    const points = scripts.get(script);
    let len = txt.length;
    const chars = [...txt]; // Splits on codepoint boundaries

    // Scan the string once, reducing the length by the number of initial
    // combining characters
    for (const char of chars) {
      const info = points.find(ch => ch.code === char.codePointAt(0));
      if (info && info.category === 'Mn') {
        len--;
      } else {
        break;
      }
    }

    this.rand.upto(len, this.opts.stringLength, `stringLength,${reason}`);
    const codes = points.map(c => c.code);
    for (const char of chars) {
      this.rand.pick(
        char.codePointAt(0),
        codes,
        `codepoint,${reason}`
      );
    }
  }

  generate_String(txt, depth) {
    this.generate_string(txt.valueOf(), depth, 'String');
  }

  generate_RegExp(re, depth) {
    this.generate_string(re.source, depth, 'RegExp');
    if (!this.opts.cborSafe) {
      this.rand.some(re.flags, 'gimsuy', 'RegExp flags');
    }
  }

  generate_URL(url, depth = 0) {
    this.rand.pick(url.protocol, [
      'http:', 'https:', 'ftp:',
    ], 'URL proto');
    const m = url.hostname.match(/(?<tu>.*)\.(?<tld>[^.]+)$/);
    const {tu, tld} = m.groups;

    this.rand.pick(tld.toUpperCase(), tlds.top, 'URL tld');

    if (url.port === '') {
      this.rand.random(0.9, 'URL port?');
    } else {
      this.rand.random(0.05, 'URL port?');
      this.rand.upto(parseInt(url.port, 10), 65536, 'URL port');
    }

    if (url.pathname === '/') {
      this.rand.random(0.9, 'URL pathname?');
    } else {
      this.rand.random(0.05, 'URL pathname?');
      this.generate_string(url.pathname.slice(1), depth + 1, 'URL pathname');
    }

    if (url.search) {
      this.rand.random(0.05, 'URL search?');
      const params = [...url.searchParams];
      this.rand.upto(params.length, 3, 'num search params');
      for (const [k, v] of params) {
        this.generate_string(k, depth + 1, 'URL search name');
        this.generate_string(v, depth + 1, 'URL search value');
      }
    } else {
      this.rand.random(0.9, 'URL search?');
    }

    if (url.hash) {
      this.rand.random(0.05, 'URL hash?');
      // Hash has # in front
      this.generate_string(url.hash.slice(1), depth + 1, 'URL hash');
    } else {
      this.rand.random(0.9, 'URL hash?');
    }

    let script = 'Latin';
    for (const c of [...tld]) {
      const char = scripts.chars.get(c.codePointAt(0));
      if (char && char.script) {
        ({script} = char);
        break;
      }
    }
    const str = [...tu].map(c => c.codePointAt(0));
    const points = scripts.get(script, true);
    const lowercase = points.filter(
      c => ['Ll', 'Lo', 'Lm'].includes(c.category)
    ).map(c => c.code);

    this.rand.pick(str.shift(), lowercase, 'copdepoint1,URL');

    const more = points.filter(
      c => ['Ll', 'Lm', 'Lo', 'Nd', 'Mn', 'Mc'].includes(c.category)
    ).map(c => c.code);

    this.rand.upto(str.length, this.opts.stringLength - 1, 'stringLength,URL');
    for (const p of str) {
      this.rand.pick(p, more, 'codepoint,URL');
    }
  }

  generate_Array(a, depth = 0) {
    const len = a.length;
    this.rand.upto(len, this.opts.arrayLength, 'arrayLength');
    for (const i of a) {
      this.generate(i, depth + 1);
    }
  }

  generate_TypedArray(ary, depth = 0) {
    this.rand.pick(
      ary.constructor,
      this.typedArrays,
      'TypedArray type'
    );
    const sz = ary.BYTES_PER_ELEMENT || 1;
    if (depth <= this.opts.depth) {
      this.rand.upto(
        ary.byteLength / sz,
        this.opts.arrayLength,
        `${ary.constructor.name} len`
      );
    }
    const buf = Buffer.from(ary.buffer || ary, ary.byteOffset, ary.byteLength);
    this.rand.bytes(buf, ary.constructor.name);
  }

  generate_Object(obj, depth = 0) {
    const keys = Object.keys(obj);
    const len = keys.length;
    this.rand.upto(len, this.opts.arrayLength, 'objectlen');
    for (let i = 0; i < len; i++) {
      this.generate_string(keys[i], depth + 1, 'key');
      this.generate(obj[keys[i]], depth + 1);
    }
  }

  generate_bigint(n, depth = 0) {
    let neg = false;
    if (n < 0) {
      n *= -1n;
      neg = true;
    }
    let str = n.toString(16);
    if (str.length % 2 !== 0) {
      str = `0${str}`;
    }
    const buf = Buffer.from(str, 'hex');
    this.rand.upto(
      buf.length - 1,
      this.opts.stringLength - 1,
      'uBigInt len'
    );
    this.rand.bytes(buf, 'uBigInt,uBigInt unsigned');
    this.generate_boolean(neg, depth, 'uBigInt sign');
  }

  generate_Date(depth = 0) {
    const n = this.rand.gauss(Date.now(), 315569520000, 'date');
    return new Date(n);
  }

  generate_Error(e, depth = 0) {
    this.rand.pick(e.constructor, this.ErrorConstructors, 'errorClass');
    this.generate_string(e.message, depth + 1, 'errorMessage');
    if (e.constructor === AggregateError) {
      this.rand.upto(e.errors.length, this.opts.arrayLength, 'AggregateErrorLength');
      for (const er of e.errors) {
        this.generate_Error(er, depth + 1);
      }
    }
  }

  async generate_Promise(p, depth = 0) {
    await p.then(val => {
      this.rand.random(0.9, 'promiseReject');
      this.generate(val, depth + 1);
    }, er => {
      this.rand.random(0.05, 'promiseReject');
      this.generate_Error(er, depth + 1);
    });
  }

  generate_WeakSet(s, depth = 0) {
    if (depth <= this.opts.depth) {
      const members = this.weakMembers.get(s);
      assert(members);
      this.rand.upto(members.length, this.opts.arrayLength, 'weakSetSize');
      for (const m of members) {
        const cls = m.constructor.name;
        assert(cls);
        this.rand.pick(cls, this.validWeak, 'weakSetClass');
        const typ = this.types[cls];
        assert(typ);
        typ.call(this, m, depth + 1);
      }
    }
  }

  generate_WeakMap(m, depth = 0) {
    if (depth <= this.opts.depth) {
      const entries = this.weakMembers.get(m);
      this.rand.upto(entries.length, this.opts.arrayLength, 'weakMapSize');
      for (const [k, v] of entries) {
        const cls = k.constructor.name;
        this.rand.pick(cls, this.validWeak, 'weakMapKeyClass');
        const typ = this.types[cls];
        typ.call(this, k, depth + 1);
        this.generate(v);
      }
    }
  }

  generate_WeakRef(w, depth = 0) {
    const [o] = this.weakMembers.get(w);
    const cls = o.constructor.name;
    this.rand.pick(cls, this.validWeak, 'weakRef');
    const typ = this.types[cls];
    typ.call(this, o, depth + 1);
  }

  generate_symbol(s, depth = 0) {
    const {name} = s.toString().match(/^Symbol\((?<name>.*)\)$/).groups;
    this.generate_string(name, depth + 1, 'symbol');
  }

  generate_Map(m, depth = 0) {
    if (depth > this.opts.depth) {
      m = 0;
    }

    this.rand.upto(m.size, this.opts.arrayLength, 'Map len');
    for (const [k, v] of m.entries()) {
      this.generate(k, depth + 1);
      this.generate(v, depth + 1);
    }
  }

  generate_Proxy(p, depth = 0) {
    if (depth > this.opts.depth) {
      return;
    }
    this.generate_Object(p, depth);
  }

  generate_Set(s, depth = 0) {
    this.rand.upto(s.size, this.opts.arrayLength, 'setlen');
    for (const o of s) {
      this.generate(o, depth + 1);
    }
  }

  generate_function(f, depth = 0) {
    if (depth > this.opts.depth) {
      return;
    }
    const fstr = f.toString();
    const m = fstr.match(/'(?<name>.*)'/);
    this.generate_string(m.groups.name, depth, 'function');
    const fin = util.inspect(f, {
      colors: false,
      depth: Infinity,
      customInspect: false,
    });
    this.rand.pick(fin, this.functionSpecies, 'function species');
  }

  generate_Generator(g, depth = 0) {
    const o = this.weakMembers.get(g);
    this.generate_Array(o);
  }

  generate(o, depth = 0) {
    let typ = typeof o;
    switch (typ) {
      case 'bigint':
      case 'boolean':
      case 'function':
      case 'string':
      case 'symbol':
      case 'undefined':
        break;
      case 'number':
        // 0 and -0 are "fun"
        if ((o !== 0) && Number.isInteger(o)) {
          typ = 'integer';
        }
        break;
      case 'object':
        if (!o) {
          typ = 'null';
        } else if (this.typedArrays.includes(o.constructor)) {
          typ = 'TypedArray';
        } else if (this[`generate_${o.constructor.name}`]) {
          typ = o.constructor.name;
        } else if (util.types.isProxy(o)) {
          typ = 'Proxy';
        }
        break;
      default:
        throw new Error(`Unknown type: "${typeof o}"`);
    }
    this.rand.pick(typ, this.typeNames, 'type');
    const f = this.types[typ];
    if (!f) {
      throw new Error(`invalid type: "${typ}"`);
    }
    f.call(this, o, depth + 1);
  }
}
