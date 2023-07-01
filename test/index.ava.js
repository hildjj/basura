import {Arusab} from './fixtures/un.js'
import {Basura} from '../lib/index.js'
import {Buffer} from 'buffer'
import Module from 'module'
import example from './fixtures/example.js'
import test from 'ava'
import util from 'util'

test('create', t => {
  const first = new Basura()
  t.truthy(first)

  const small = new Basura({
    extra: false,
    depth: -1,
  })
  const a = small.generate_Array()
  t.deepEqual(a, [])
})

test('constructor edges', t => {
  const f = new Basura()
  const g = new Basura({
    types: {Array: null},
  })
  t.not(Object.keys(f.opts.types).length, Object.keys(g.opts.types).length)
})

test('playback', t => {
  const un = new Arusab({
    arrayLength: 1000,
  })
  un.generate(example)

  let g = new Basura({
    randBytes: un.playback.bind(un),
    arrayLength: 1000,
  })

  let o = g.generate()
  t.deepEqual(o, example)

  // With output
  un.generate(example)

  g = new Basura({
    randBytes: un.playback.bind(un),
    output: true,
    arrayLength: 1000,
  })

  o = g.generate()
  const insp = Basura.quoteSymbols(
    util.inspect(o, {colors: false, depth: Infinity})
  )
  const str = `\
'use strict'
module.exports = ${insp}\n`
  const m = new Module()
  m._compile(str, 'memory')
  t.deepEqual(m.exports, example)
})

test('depth', t => {
  const g = new Basura()
  t.is(g.generate(Infinity), null)
  t.deepEqual(g.generate_Set(Infinity), new Set())
  t.deepEqual(g.generate_Map(Infinity), new Map())
  t.is(g.generate_object(Infinity), null)
  t.is(g.generate_function(Infinity).toString(), '() => {}')
  t.is(g.generate_Proxy(Infinity), null)
  t.is(g.generate_TypedArray(Infinity).byteLength, 0)
  t.is(typeof g.generate_bigint(), 'bigint')
  t.is(typeof g.generate_symbol(), 'symbol')
  t.true(g.generate_TypedArray().byteLength >= 0)
  t.is(typeof g.generate_object(), 'object')
  t.is(g.generate_Map().constructor.name, 'Map')
  t.is(g.generate_Set().constructor.name, 'Set')
  t.true(util.types.isProxy(g.generate_Proxy()))
  t.is(typeof g.generate_function(), 'function')
  t.is(typeof g.generate_string(), 'string')
  t.is(g.generate_String().constructor.name, 'String')
  t.is(g.generate_RegExp().constructor.name, 'RegExp')
  t.is(g.generate_URL().constructor.name, 'URL')
})

test('cbor/json safe', t => {
  let g = new Basura({
    cborSafe: true,
  })
  t.falsy(g.typeNames.Boolean)
  t.is(g.generate_RegExp().flags, '')

  g = new Basura({
    jsonSafe: true,
  })
  t.falsy(g.typeNames.NaN)
})

test('unspecified', t => {
  const g = new Basura()
  let buf = g._randBytes(5)
  t.true(Buffer.isBuffer(buf))
  t.is(buf.length, 5)
  buf = g._randUInt32()
  t.is(typeof buf, 'number')
  buf = g._randUBigInt(8)
  t.is(typeof buf, 'bigint')
  buf = g._randUBigInt()
  t.is(typeof buf, 'bigint')
  buf = g._random01()
  t.true((buf >= 0) || (buf < 1))
  buf = g._randomGauss(0.5, 0.00001)
  t.true((buf >= 0) && (buf < 1))
  buf = g._upto(10)
  t.true((buf >= 0) && (buf < 10) && (~~buf === buf))
  buf = g._pick(['foo'])
  t.is(buf, 'foo')
  buf = g._some('a')
  t.true((buf === '') || (buf === 'a'))
  buf = g._some(['a'])
  t.true(Array.isArray(buf) && (buf.length < 2))
  buf = g.generate_boolean()
  t.is(typeof buf, 'boolean')
  buf = g.generate_Boolean()
  t.is(buf.constructor.name, 'Boolean')
  buf = g.generate_integer()
  t.is(typeof buf, 'number')
  t.is(~~buf, buf)
  buf = g.generate_number()
  t.is(typeof buf, 'number')
  buf = g.generate_Number()
  t.is(buf.constructor.name, 'Number')
  buf = g.generate_Buffer()
  t.true(Buffer.isBuffer(buf))
  buf = g.generate_Buffer(Infinity)
  t.is(buf.length, 0)
})

test('functions', t => {
  if (parseFloat(process.version.slice(1)) < 14) {
    t.pass(`Skipping function tests on node ${process.version}`)
    return
  }
  const un = new Arusab({
    arrayLength: 1000,
  })

  // These are needed for the evals, which eslint can't see into.
  // eslint-disable-next-line no-unused-vars, prefer-const
  let f1 = null
  // eslint-disable-next-line no-unused-vars, prefer-const
  let f2 = null
  // eslint-disable-next-line no-unused-vars, prefer-const
  let f3 = null

  const val = 'foo'
  const funcs = [
    // [Function (anonymous)]
    () => 'foo',
    // [Function: anonymous],
    // eslint-disable-next-line no-new-func
    new Function(`return '${val}'`),
    // [Function: f1]
    // eslint-disable-next-line no-eval
    eval(`f1 = function() { return '${val}' }`),
    // [Function: f2]
    // eslint-disable-next-line no-eval
    eval(`(function f2() { return '${val}' })`),
    // [AsyncFunction (anonymous)]
    // eslint-disable-next-line no-eval
    eval(`async() => '${val}'`),
    // [AsyncFunction: anonymous]
    // eslint-disable-next-line max-len
    // eslint-disable-next-line func-names, no-empty-function, prefer-arrow-callback
    new (Object.getPrototypeOf(async function() { })
      .constructor)(`return '${val}'`),
    // [AsyncFunction: f1]
    // eslint-disable-next-line no-eval
    eval(`f1 = async() => '${val}'`),
    // [AsyncFunction: f2]
    // eslint-disable-next-line no-eval
    eval(`f2 = async function() { return '${val}' }`),
    // [AsyncFunction: f3]
    // eslint-disable-next-line no-eval
    eval(`(async function f3() { return '${val}' })`),
    // [GeneratorFunction (anonymous)]
    // eslint-disable-next-line no-eval
    eval(`(function*() { yield '${val}' })`),
    // [GeneratorFunction: anonymous]
    // eslint-disable-next-line func-names, no-empty-function
    new (Object.getPrototypeOf(function *() { })
      .constructor)(`yield '${val}'`),
    // [GeneratorFunction: f1]
    // eslint-disable-next-line no-eval
    eval(`f1 = function * () { yield '${val}' }`),
    //
    // case '[GeneratorFunction: f2]':
    // eslint-disable-next-line no-eval
    eval(`(function *f2() { yield '${val}' })`),
    // [AsyncGeneratorFunction (anonymous)]
    // eslint-disable-next-line no-eval
    eval(`(async function*() { yield '${val}' })`),
    // [AsyncGeneratorFunction: anonymous]
    // eslint-disable-next-line func-names, no-empty-function
    new (Object.getPrototypeOf(async function *() { })
      .constructor)(`yield '${val}'`),
    //
    // case '[AsyncGeneratorFunction: f1]':
    // eslint-disable-next-line no-eval
    eval(`f1 = async function * () { yield '${val}' }`),
    // [AsyncGeneratorFunction: f2]
    // eslint-disable-next-line no-eval
    eval(`(async function *f2() { yield '${val}' })`),

  ]

  un.generate(funcs)
  let g = new Basura({
    arrayLength: 1000,
    randBytes: un.playback.bind(un),
  })
  t.deepEqual(g.generate().map(f => f.toString()), funcs.map(f => f.toString()))

  un.generate(funcs)
  g = new Basura({
    output: true,
    arrayLength: 1000,
    randBytes: un.playback.bind(un),
  })

  t.deepEqual(
    g.generate().map(f => util.inspect(f, {colors: false, depth: Infinity})),
    funcs.map(f => f.toString())
  )
})

test('quote symbols', t => {
  t.is(Basura.quoteSymbols('Symbol(foo)'), 'Symbol.for(\'foo\')')
  t.is(Basura.quoteSymbols('Symbol())'), 'Symbol.for(\')\')')
})

test('date', t => {
  // Punt on re-generating the same date every time.  Let's just try it out.
  const g = new Basura()
  t.is(g.generate_Date().constructor.name, 'Date')
  t.is(g.generate_Date().constructor.name, 'Date')
})

test('inspect', t => {
  const b = new Basura({output: true})
  const m = b.generate_Map()
  t.truthy(util.inspect(m, {depth: null}))
})

test('combining', t => {
  // U+05BA is a combining character in the Hebrew script.  U+05E1 is not.
  const un = new Arusab()
  un.generate([
    String.fromCodePoint(0x05BA, 0x05E1),
    String.fromCodePoint(0x05BA, 0x05BA, 0x05E1),
    String.fromCodePoint(0x05BA, 0x05BA),
  ])
  const g = new Basura({
    randBytes: un.playback.bind(un),
  })
  t.deepEqual(g.generate(), [
    String.fromCodePoint(0x05E1),
    String.fromCodePoint(0x05E1),
    '',
  ])
})

test('invalid regex', t => {
  const un = new Arusab()
  un.generate(/./) // Valid
  // Copy the first half, minus the "pick regexp", deep-ish-ly
  un.record = [...un.record, ...un.record.slice(1).map(a => [...a])]
  // Find the first "."
  const rec = un.record.find(
    ([b, d]) => d.match(/,codepoint,RegExp$/)
  )
  rec[0] = Buffer.concat([rec[0]]) // Copy it, we weren't full deep above
  rec[0][3] = 0x2b // Change the . to a +, giving the bad regex /+/
  const g = new Basura({
    randBytes: un.playback.bind(un),
  })
  t.deepEqual(g.generate(), /./)
})
