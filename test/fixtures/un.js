'use strict'

const Basura = require('../../lib/index')
const Scripts = require('../../lib/scripts')
const scripts = Scripts.instance()
const tlds = require('tlds')
const util = require('util')

/**
 * Un-generate garbage.  Inverse of Basura, for creating test cases.
 */
class Arusab extends Basura {
  constructor(opts) {
    super(opts)
    this.record = []
  }

  _randBytes(bytes, reason = 'unspecified') {
    this.record.push([bytes, reason])
  }

  _randUInt32(i, reason = 'unspecified') {
    const b = Buffer.alloc(4)
    b.writeUInt32BE(i)
    this._randBytes(b, `_randUInt32,${reason}`)
  }

  _random01(n, reason = 'unspecified') {
    const buf = Buffer.alloc(8)
    new DataView(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength
    ).setFloat64(0, 1 + n, true)
    this._randBytes(buf, `_random01,${reason}`)
  }

  _upto(num, i, reason = 'unspecified') {
    this._randUInt32(i, `_upto(${num}),${reason}`)
  }

  _pick(ary, m, reason = 'unspecified') {
    const i = ary.indexOf(m)
    if (i === -1) {
      throw new Error(`not found: ${m} in ${ary}`, {ary, m, reason})
    }
    this._upto(ary.length, i, `_pick(${ary.length}),${reason}`)
  }

  _some(ary, sa, reason = 'unspecified') {
    [...ary].forEach(c => this._upto(2, sa.includes(c), reason))
  }

  generate_boolean(b, depth = 0, reason = 'boolean') {
    this._upto(2, b, reason)
  }

  generate_Boolean(b, depth = 0) {
    this._upto(2, b, 'Boolean')
  }

  generate_integer(i) {
    this._randUInt32(i + 0x7FFFFFFF, 'integer')
  }

  generate_number(n) {
    const i = this.funNumbers.findIndex(o => Object.is(o, n))
    if (i !== -1) {
      this._random01(0.05, 'number')
      this._upto(
        this.funNumbers.length,
        i,
        `_pick(${this.funNumbers.length}),fun number`
      )
      return
    }
    this._random01(0.9, 'number')
    const b = Buffer.alloc(8)
    b.writeDoubleBE(n)
    this._randBytes(b, 'number')
  }

  generate_Number(n, depth = 0) {
    this.generate_number(n.valueOf())
  }

  generate_Buffer(b, depth = 0) {
    if (depth > this.opts.depth) {
      return
    }
    this._upto(this.opts.stringLength, b.length, 'Buffer length')
    this._randBytes(Buffer.concat([b]), 'Buffer')
  }

  generate_string(txt, depth, reason = 'string') {
    const cp = txt.codePointAt(0)
    const { script } = scripts.chars.get(cp)
    this._pick(this.opts.scripts, script, `script,${reason}`)
    const points = scripts.get(script)
    let len = txt.length
    const chars = [...txt] // splits on codepoint boundaries

    // scan the string once, reducing the length by the number of initial
    // combining characters
    for (const char of chars) {
      const info = points.find(ch => ch.code === char.codePointAt(0))
      if (info && info.category === 'Mn') {
        len--
      } else {
        break
      }
    }

    this._upto(this.opts.stringLength, len, `stringLength,${reason}`)
    const codes = points.map(c => c.code)
    for (const char of chars) {
      this._pick(
        codes,
        char.codePointAt(0),
        `codepoint,${reason}`
      )
    }
  }

  generate_String(txt, depth) {
    this.generate_string(txt.valueOf(), depth, 'String')
  }

  generate_RegExp(re, depth) {
    this.generate_string(re.source, depth, 'RegExp')
    if (!this.opts.cborSafe) {
      this._some('gimsuy', re.flags, 'RegExp flags')
    }
  }

  generate_URL(url, depth = 0) {
    this._pick([
      'http:', 'https:', 'ftp:'
    ], url.protocol, 'URL proto')
    const m = url.hostname.match(/(.*)\.([^.]+)$/)
    const [, tu, tld] = m

    this._pick(tlds, tld, 'URL tld')

    if (url.port !== '') {
      this._random01(0.05, 'URL port?')
      this._upto(65536, parseInt(url.port, 10), 'URL port')
    } else {
      this._random01(0.9, 'URL port?')
    }

    if (url.pathname !== '/') {
      this._random01(0.05, 'URL pathname?')
      this.generate_string(url.pathname.slice(1), depth + 1, 'URL pathname')
    } else {
      this._random01(0.9, 'URL pathname?')
    }

    if (url.search) {
      this._random01(0.05, 'URL search?')
      const params = [...url.searchParams]
      this._upto(3, params.length, 'num search params')
      for (const [k, v] of params) {
        this.generate_string(k, depth + 1, 'URL search name')
        this.generate_string(v, depth + 1, 'URL search value')
      }
    } else {
      this._random01(0.9, 'URL search?')
    }

    if (url.hash) {
      this._random01(0.05, 'URL hash?')
      // hash has # in front
      this.generate_string(url.hash.slice(1), depth + 1, 'URL hash')
    } else {
      this._random01(0.9, 'URL hash?')
    }

    let script = 'Latin'
    for (const c of [...tld]) {
      const char = scripts.chars.get(c.codePointAt(0))
      if (char && char.script) {
        ({script} = char)
        break
      }
    }
    const str = [...tu].map(c => c.codePointAt(0))
    const points = scripts.get(script, true)
    const lowercase = points.filter(
      c => ['Ll', 'Lo', 'Lm'].includes(c.category)
    ).map(c => c.code)

    this._pick(lowercase, str.shift(), 'copdepoint1,URL')

    const more = points.filter(
      c => ['Ll', 'Lm', 'Lo', 'Nd', 'Mn', 'Mc'].includes(c.category)
    ).map(c => c.code)

    this._upto(this.opts.stringLength - 1, str.length, 'stringLength,URL')
    for (const p of str) {
      this._pick(more, p, 'codepoint,URL')
    }
  }

  generate_Array(a, depth = 0) {
    const len = a.length
    this._upto(this.opts.arrayLength, len, 'arrayLength')
    for (const i of a) {
      this.generate(i, depth + 1)
    }
  }

  generate_TypedArray(ary, depth = 0) {
    this._pick(
      this.typedArrays,
      ary.constructor,
      'TypedArray type'
    )
    const sz = ary.BYTES_PER_ELEMENT || 1
    if (depth <= this.opts.depth) {
      this._upto(
        this.opts.arrayLength,
        ary.byteLength / sz,
        `${ary.constructor.name} len`
      )
    }
    const buf = Buffer.from(ary.buffer || ary, ary.byteOffset, ary.byteLength)
    this._randBytes(buf, ary.constructor.name)
  }

  generate_object(obj, depth = 0) {
    const keys = Object.keys(obj)
    const len = keys.length
    this._upto(this.opts.arrayLength, len, 'objectlen')
    for (let i = 0; i < len; i++) {
      this.generate_string(keys[i], depth + 1, 'key')
      this.generate(obj[keys[i]], depth + 1)
    }
  }

  generate_bigint(n, depth = 0) {
    let neg = false
    if (n < 0) {
      n *= -1n
      neg = true
    }
    let str = n.toString(16)
    if (str.length % 2 !== 0) {
      str = '0' + str
    }
    const buf = Buffer.from(str, 'hex')
    this._upto(
      this.opts.stringLength - 1,
      buf.length - 1,
      '_randUBigInt len,signed'
    )
    this._randBytes(buf, '_randUBigInt,signed')
    this.generate_boolean(neg, depth, 'bigint sign')
  }

  generate_Date(d, depth = 0, today = null) {
    this._randomGauss(today.getTime(), 315569520000, 'date')
  }

  generate_symbol(s, depth = 0) {
    const [, name] = s.toString().match(/^Symbol\((.*)\)$/)
    this.generate_string(name, depth + 1, 'symbol')
  }

  generate_Map(m, depth = 0) {
    if (depth > this.opts.depth) {
      m = 0
    }

    this._upto(this.opts.arrayLength, m.size, 'Map len')
    for (const [k, v] of m.entries()) {
      this.generate(k, depth + 1)
      this.generate(v, depth + 1)
    }
  }

  generate_Proxy(p, depth = 0) {
    if (depth > this.opts.depth) {
      return
    }
    this.generate_object(p, depth)
  }

  generate_Set(s, depth = 0) {
    this._upto(this.opts.arrayLength, s.size, 'setlen')
    for (const o of s) {
      this.generate(o, depth + 1)
    }
  }

  generate_function(f, depth = 0) {
    if (depth > this.opts.depth) {
      return
    }
    const fstr = f.toString()
    const m = fstr.match(/'(.*)'/)
    this.generate_string(m[1], depth, 'function')
    const fin = util.inspect(f, {
      colors: false,
      depth: Infinity,
      customInspect: false
    })
    this._pick(this.functionSpecies, fin, 'function species')
  }

  generate(o, depth = 0) {
    let typ = typeof o
    switch (typ) {
      case 'bigint':
      case 'boolean':
      case 'function':
      case 'string':
      case 'symbol':
      case 'undefined':
        break
      case 'number':
        // 0 and -0 are "fun"
        if ((o !== 0) && Number.isInteger(o)) {
          typ = 'integer'
        }
        break
      case 'object':
        if (!o) {
          typ = 'null'
        } else if (this.typedArrays.includes(o.constructor)) {
          typ = 'TypedArray'
        } else if (this[`generate_${o.constructor.name}`]) {
          typ = o.constructor.name
        } else if (util.types.isProxy(o)) {
          typ = 'Proxy'
        }
        break
      default:
        throw new Error(`Unknown type: "${typeof o}"`)
    }
    this._pick(this.typeNames, typ, 'type')
    const f = this.types[typ]
    if (!f) {
      throw new Error(`invalid type: "${typ}"`)
    }
    f.call(this, o, depth + 1)
  }

  playback(num, reason = 'unspecified') {
    if (!this.record.length) {
      throw new Error(`Out of playback data (${num}): "${reason}"`)
    }
    const [buf, origReason] = this.record.shift()
    if ((buf.length !== num) || (reason !== origReason)) {
      throw new Error(
        `Expected ${num} bytes, got ${buf.length}.  "${reason}" "${origReason}"`
      )
    }
    return buf
  }
}

module.exports = Arusab

if (require.main === module) {
  const path = require('path')
  const f = path.resolve(process.cwd(), process.argv[2])
  const inp = require(f)
  const u = new Arusab()
  u.generate(inp)
  const out = JSON.stringify(
    u.record.map(([b, r]) => [b.toString('hex'), r]),
    null,
    2
  )
  console.log(out)
}
