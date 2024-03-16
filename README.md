# Basura

Generate trash JavaScript.  This is useful for testing libraries and APIs.

The strings that are generated are random, but every string comes from a single
Unicode script, so they at least look vaguely interesting.

## Install

    npm install basura

## Command line

```
Usage: basura [options]

Generate a random JavaScript object

Options:
  -V, --version                output the version number
  -a, --arrayLength <number>   Maximum array/object size (default: 10)
  -b, --noBoxed                Do not generate boxed types, like String
  -c, --cborSafe               Do not generate types that break CBOR
  -d, --depth <number>         Maximum depth (default: 5)
  -e, --edgeFreq <number>      Edge case frequency (default: 0.1)
  -j, --json                   Output JSON
  -o, --output <file>          File to output
  -s, --stringLength <number>  Maximum string length (default: 20)
  -t, --type <type>            Generate this specific type
  -T, --listTypes              List all supported types, then exit
  -h, --help                   display help for command

Examples:
  $ basura -t object
  $ basura -t Array -o array.js
```

## API

Full [API docs](https://hildjj.github.io/basura/) are available.

```js
import {Basura} from 'basura'

// The default options.  No need to pass anything in if you like these
const opts = {
  arrayLength: 10,  // maximum size of arrays and objects
  cborSafe: false,  // generate only CBOR-safe types?
  depth: 5,         // How deep to go
  edgeFreq: 0.1,    // How often to prefer edge cases?
  jsonSafe: false,  // generate only JSON-safe types?
  noBoxed: false,   // ignore boxed types, like String?
  output: false,    // add custom inspect functions that make output parseable JS?
  scripts: [],      // Array of script names to limit output to.  Defaults to all
  stringLength: 20, // Maximum string and Buffer length, in codepoints
  types: {},        // Extra types to generate.  Pass in `{Date: null}` to not generate Dates
}
const b = new Basura(opts)
console.log(b.generate_Date()) // Example output: 2011-02-16T11:28:41.539Z
console.log(b.generate())
const exampleOutput = new Map([
  [ Symbol.for('ຜ'), new EvalError('ᨧ', { cause: 'BasuraGenerated' }) ],
  [
    new RegExp('𑗇𑗌𑖃𑗓𑖀𑗁𑖋𑖅𑖹𑗜𑖺𑖿𑖋𑖲𑗄𑗛𑖢𑖓𑖐', 'imuy'),
    14173888573465899285761442798361374484n
  ],
  [
    new TypeError('𐓂𐓉𐓱𐓜𐓸𐓣𐓅', { cause: 'BasuraGenerated' }),
    false
  ],
  [
    (function *gen() { yield *[
      new Boolean(false),
      new Boolean(true),
      true,
      (function *gen() { yield *[]; }()),
      new AggregateError([], '𐑕𐑵𐑐𐑕𐑘𐑟', { cause: 'BasuraGenerated' })
    ]; }()),
    true
  ],
  [
    new RegExp('𗺰𗈢𘍘𗏏𗚰', 'gimsu'),
    [
      Symbol.for('𑇆𑆈𑇗𑆑'),
      new WeakSet([
        new URL('http://xn--0ca75aujzol61igmb0k5okzn85hrm6zb8b3trbgma45a.analytics/'),
        new Number(1.2897127236855344e-62),
        new RegExp('𑓆𑒦𑒍𑒛𑓅𑒿', 'mu'),
        new Boolean(true),
        new URL('ftp://xn--ig-pza40elk719kdzajmuwg2av080iniam3bh05agb.allfinanz/'),
        new Proxy({
          '𐣣𐣨𐣢𐣫𐣴𐣡𐣧𐣫𐣽𐣾𐣰': null,
          '𑨘𑨼𑨀𑨡𑨛𑨻𑨱𑨒𑨲𑨍𑩂𑩅𑨒': null,
          'ꩫꩶံ': null,
          'ꢥꢮꢁ꣄ꢃꢷꢆꣂ꣎ꢦꣃꢃꢊꢓ': null,
          'ᜉ': null,
          'ઈઽઢ૫઼ઁષ૬ઢૌઢાગ૬ડચ': null,
          '𑰎𑰈𑱔𑱕𑱅𑱂𑱀𑰻𑱙𑰣𑱘𑰳𑱤𑰫': null
        }, {}),
        new RegExp('ඟෞ෧', 'g')
      ]),
      false,
      new Number(2.0992456464465825e+50),
      true
    ]
  ],
  [ new Number(-1.4843923095683823e-168), Symbol.for('𐡕𐡋') ],
  [ new Date(1648352302083.9736), undefined ],
  [
    new Proxy({
      '𒒤𒅣𒆗𒃚𒎓𒇙𒓓𒌸𒆪𒄖𒅕𒐦𒁡𒒁𒉠𒅲': { '𐬻𐬚𐬁𐬤𐬫𐬮𐬽𐬇𐬻': null },
      'ᦗᦾᦞᦡᦵᦺ': {},
      '𞥐𞤥𞤩𞤍𞤀𞤪𞤗𞤾𞤳𞤅𞤋𞥄𞥃𞤴': new WeakSet([]),
      '𐦘𐦂𐦀𐦁𐦓𐦘𐦜𐦉𐦀𐦚𐦞𐦓𐦒𐦜𐦄': Buffer.from('d2093eb0f70f95d7', 'hex'),
      '𐼴𐽍𐽎𐼶𐽑𐽐𐼾𐼸𐽈': new WeakMap([]),
      '𐐿𐐚𐐯𐐮𐐴𐐦': new Map([ [ null, null ] ]),
      '': '㋯ピヾ㋶㋛㋓㌕ェｱ㋠ｬニﾌ㋫㍅㌺',
      '𐏓': {
        '𐼷𐼼𐽂𐽌𐽒𐽔𐽙𐽕𐼴𐽘𐽌𐼺𐼲𐽖𐼽': null,
        '𐠛𐠨𐠐𐠼𐠟𐠄𐠓': null,
        '𞠙𞠳𞠖𞢌𞢈𞡔𞢍𞢌𞣂𞡗𞢙': null,
        '𓇉𓄨𓇘𓅿𓌦𓋚𓇯𓀠𓅈': null
      },
      '𖹕𖹯𖹀𖺇𖹫𖹈𖹯𖺄𖺍𖹛𖹮𖺎𖹂𖹍𖹳': new Date(1700466403164.0664)
    }, {}),
    new URL('ftp://xn--peayr7fl7dy0bf9bl77kbxay8erwaier76sybz4a.pictures/')
  ],
  [ new Map([]), new Date(1486178771166.9426) ]
]);
```

---
[![Tests](https://github.com/hildjj/basura/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/basura/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/hildjj/basura/badge.svg?branch=main)](https://coveralls.io/github/hildjj/basura?branch=main)
