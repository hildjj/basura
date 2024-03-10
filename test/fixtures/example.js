import {Buffer} from 'buffer';

export default [
  undefined,
  NaN,
  true,
  false,
  Infinity,
  -Infinity,
  0,
  -0,
  1,
  1.1,
  'foo', // Latin
  'ㄅㄆㄇㄈ', // Bopomofo
  'σήμερα', // Greek
  'ⲧⲁⲛⲧⲁⲑⲟ', // Coptic
  'слово', // Cyrillic
  'խոսք', // Armenian
  'מִלָה', // Hebrew
  'كلمة', // Arabic
  'ܡܲܕ݂ܢܚܵܝܵܐ', // Syriac
  'ތާނަ', // Thaana
  'ߒߞߏ', // Nko
  'શબ્દ', // Gujarati
  {
    one: 2,
    three: 4,
  },
  0n,
  -127n,
  65536n,
  Symbol.for('Sym'),
  new Map([['a', 'one'], ['foo', false]]),
  new Set([2, true, 'foo']),
  // eslint-disable-next-line no-new-wrappers
  new String('foo'),
  // eslint-disable-next-line no-new-wrappers
  new Boolean(false),
  // eslint-disable-next-line no-new-wrappers
  new Boolean(true),
  // eslint-disable-next-line no-new-wrappers
  new Number(12.1),
  Buffer.from('01020304', 'hex'),
  /foo/gm,
  new Uint8Array([1, 2, 3]),
  new Uint8Array(),
  new Uint8ClampedArray([1, 2, 3]),
  new Int8Array([-1, 0, 1]),
  new Uint16Array([1, 2, 3]),
  new Int16Array([-1, 0, 1]),
  new Uint32Array([1, 2, 3]),
  new Int32Array([-1, 0, 1]),
  new BigUint64Array([1n, 2n, 3n]),
  new BigInt64Array([-1n, 0n, 1n]),
  new ArrayBuffer(12),
  new SharedArrayBuffer(12),
  new DataView(new ArrayBuffer(12)),
  new Proxy({a: 1, b: 2}, {}),
  new URL('https://example.com'),
  new URL('https://example.com:4000'),
  new URL('https://example.com/'),
  new URL('https://example.com/foo'),
  new URL('https://example.com/?foo=bar&baz=boo'),
  new URL('https://example.com#blat'),
  new URL('https://example.com/#blat'),
  new URL('https://example.com/foo#blat'),
  new URL('https://example.com/bug?foo=bar&baz=boo'),
  new URL('https://example.com/bug?foo=bar&baz=boo#blat'),
  new URL('https://example.com:0/bug?foo=bar&baz=boo#blat'),
];
