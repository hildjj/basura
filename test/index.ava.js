import * as ntest from 'node:test';
import {Arusab} from './fixtures/un.js';
import {Basura} from '../lib/index.js';
import Module from 'node:module';
import example from './fixtures/example.js';
import test from 'ava';
import util from 'node:util';

test.beforeEach(t => {
  const a = new Arusab({arrayLength: 1000});
  const b = new Basura({arrayLength: 1000});
  const g = new Basura({
    arrayLength: 1000,
    randBytes: a.source,
  });
  const o = new Basura({
    arrayLength: 1000,
    randBytes: a.source,
    fakeSymbols: true,
    output: true,
  });
  t.context = {
    a, b, g, o,
  };
});

test.afterEach(t => {
  t.assert(t.context.a.isDone);
});

test('create', t => {
  const {b} = t.context;
  t.truthy(b);

  const small = new Basura({
    extra: false,
    depth: -1,
  });
  const a = small.generate_Array();
  t.deepEqual(a, []);
});

test('constructor edges', t => {
  const {b} = t.context;
  const g = new Basura({
    types: {Array: null},
  });
  t.not(b.typeNames.length, g.typeNames.length);
});

test('quick', t => {
  const {a, g} = t.context;
  a.generate([0]);
  t.deepEqual(g.generate(), [0]);
});

test('playback', t => {
  const {a, g, o} = t.context;
  a.generate(example);

  let p = g.generate();
  t.deepEqual(p, example);

  // With output
  a.generate(example);

  p = o.generate();
  const insp = util.inspect(p, {
    colors: false,
    depth: Infinity,
    maxArrayLength: Infinity,
    maxStringLength: Infinity,
  });
  const str = `\
'use strict'
module.exports = ${insp}\n`;
  const m = new Module();
  m._compile(str, 'memory');
  t.deepEqual(m.exports, example);
});

test('depth', t => {
  const b = new Basura();
  t.is(b.generate(Infinity), null);
  t.deepEqual(b.generate_Set(Infinity), new Set());
  t.deepEqual(b.generate_Map(Infinity), new Map());
  t.is(b.generate_Object(Infinity), null);
  t.is(b.generate_function(Infinity).toString(), '() => {}');
  t.deepEqual(b.generate_Proxy(Infinity), {});
  t.is(b.generate_TypedArray(Infinity).byteLength, 0);
  t.is(typeof b.generate_bigint(), 'bigint');
  t.is(typeof b.generate_symbol(), 'symbol');
  t.true(b.generate_TypedArray().byteLength >= 0);
  t.is(typeof b.generate_Object(), 'object');
  t.is(b.generate_Map().constructor.name, 'Map');
  t.is(b.generate_Set().constructor.name, 'Set');
  t.true(util.types.isProxy(b.generate_Proxy()));
  t.is(typeof b.generate_function(), 'function');
  t.is(typeof b.generate_string(), 'string');
  t.is(b.generate_String().constructor.name, 'String');
  t.is(b.generate_RegExp().constructor.name, 'RegExp');
  t.is(b.generate_URL().constructor.name, 'URL');
});

test('cbor/json safe', t => {
  const g = new Basura({
    cborSafe: true,
  });
  t.falsy(g.typeNames.Boolean);
  t.is(g.generate_RegExp().flags, '');

  const g1 = new Basura({
    jsonSafe: true,
  });
  t.falsy(g1.typeNames.NaN);
});

test('functions', t => {
  const {a, g, o} = t.context;

  // These are needed for the evals, which eslint can't see into.
  // eslint-disable-next-line no-unused-vars, prefer-const
  let f1 = null;
  // eslint-disable-next-line no-unused-vars, prefer-const
  let f2 = null;
  // eslint-disable-next-line no-unused-vars, prefer-const
  let f3 = null;

  const val = 'foo';
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
    // eslint-disable-next-line @stylistic/max-len
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
  ];

  a.generate(funcs);
  t.deepEqual(
    g.generate().map(f => f.toString()),
    funcs.map(f => f.toString())
  );

  a.generate(funcs);
  t.deepEqual(
    o.generate().map(f => util.inspect(f, {colors: false, depth: Infinity})),
    funcs.map(f => f.toString())
  );
});

test('date', t => {
  const {a, b, o} = t.context;
  t.is(b.generate_Date().constructor.name, 'Date');
  t.is(b.generate_Date().constructor.name, 'Date');

  // Node 16 doesn't have mock.
  if (typeof ntest?.mock?.timers?.enable === 'function') {
    ntest.mock.timers.enable();
    // Node 18's date mocks don't work
    if (Date.now() === 0) {
      const d1 = a.generate_Date();
      const d2 = a.generate_Date();
      t.deepEqual(o.generate_Date(), d1);
      t.deepEqual(o.generate_Date(), d2);
    }
    ntest.mock.timers.reset();
  }
});

test('inspect', t => {
  const b = new Basura({output: true});
  const m = b.generate_Map();
  t.truthy(util.inspect(m, {depth: null}));
});

test('combining', t => {
  const {a, g} = t.context;

  // U+05BA is a combining character in the Hebrew script.  U+05E1 is not.
  a.generate([
    String.fromCodePoint(0x05BA, 0x05E1),
    String.fromCodePoint(0x05BA, 0x05BA, 0x05E1),
    String.fromCodePoint(0x05BA, 0x05BA),
  ]);
  t.deepEqual(g.generate(), [
    String.fromCodePoint(0x05E1),
    String.fromCodePoint(0x05E1),
    '',
  ]);

  // Consume the last two combining chars
  a.drop('uInt32,upto(134),pick(134),codepoint,string');
  a.drop('uInt32,upto(134),pick(134),codepoint,string');
});

test('invalid regex', t => {
  const {a, g} = t.context;
  a.generate_string('+', 0, 'RegExp'); // Invalid
  a.rand.some('gimsuy', 'RegExp flags');

  a.generate(/./); // Valid
  t.deepEqual(g.generate_RegExp(), /./);
});

test('Error', t => {
  const {a, g, o} = t.context;

  const er1 = new Error('foo');
  const er2 = new SyntaxError('bar');
  const er3 = new AggregateError([er1, er2], 'baz');
  a.generate_Error(er1);
  a.generate_Error(er2);
  a.generate_Error(er3);
  t.deepEqual(g.generate_Error(), er1);
  t.deepEqual(g.generate_Error(), er2);
  t.deepEqual(g.generate_Error(), er3);

  a.generate_Error(er3);
  t.is(util.inspect(o.generate_Error()), `new AggregateError([
  new Error('foo', { cause: 'BasuraGenerated' }),
  new SyntaxError('bar', { cause: 'BasuraGenerated' })
], 'baz', { cause: 'BasuraGenerated' })`);
});

test('Promise', async t => {
  const {a, o} = t.context;
  await a.generate_Promise(Promise.resolve(1));
  await a.generate_Promise(Promise.reject(new RangeError('rover')));
  t.is(await o.generate_Promise(), 1);
  await t.throwsAsync(() => o.generate_Promise(), {message: 'rover'});
});

test('unhandled reject ok', t => new Promise((resolve, _reject) => {
  Promise.reject(new Error('Testing unhandled', {cause: 'BasuraGenerated'}));
  process.nextTick(() => {
    t.pass();
    resolve();
  });
}));

test('WeakSet', t => {
  const {a, o} = t.context;

  // eslint-disable-next-line no-new-wrappers
  const members = [new Number(5), /foo/];
  const s = new WeakSet(members);
  a.weakMembers.set(s, members);
  a.generate_WeakSet(s);
  const ws = o.generate_WeakSet();
  t.deepEqual(o.weakMembers.get(ws), members);
});

test('WeakMap', t => {
  const {a, o} = t.context;

  const entries = [
    [/bar/, 4],
  ];
  const m = new WeakMap(entries);
  a.weakMembers.set(m, entries);
  a.generate_WeakMap(m);

  const ws = o.generate_WeakMap();
  t.deepEqual(o.weakMembers.get(ws), entries);
});

test('WeakRef', t => {
  const {a, o} = t.context;
  const obj = /baz/;
  const r = new WeakRef(obj);
  a.weakMembers.set(r, [obj]);
  a.generate_WeakRef(r);

  const wr = o.generate_WeakRef();
  t.deepEqual(o.weakMembers.get(wr), [obj]);
});

test('Generator', t => {
  const {a, o} = t.context;
  const obj = [/baz/, 12];
  const gen = (function *gen() {
    yield *obj;
  }());
  a.weakMembers.set(gen, obj);
  a.generate_Generator(gen);

  const wg = o.generate_Generator();
  t.deepEqual(o.weakMembers.get(wg), obj);
  t.deepEqual([...wg], obj);
});

test('Proxy', t => {
  const {a, o} = t.context;
  const obj = {
    a: 1,
  };
  a.generate_Proxy(obj);
  const p = o.generate_Proxy();
  t.deepEqual(o.weakMembers.get(p), [obj]);
});
