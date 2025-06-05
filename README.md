# Basura

Generate trash JavaScript.  This is useful for testing libraries and APIs.

The strings that are generated are random, but every string comes from a single
Unicode script, so they at least look vaguely interesting.

## Install

    npm install basura

## Command line

```text
Usage: basura [options]

Generate a random JavaScript object

Options:
  -V, --version                output the version number
  -a, --arrayLength <number>   Maximum array/object size (default: 10)
  -b, --noBoxed                Do not generate boxed types, like
                               String.
  -c, --cborSafe               Do not generate types that break CBOR.
  -d, --depth <number>         Maximum depth. (default: 5)
  -e, --edgeFreq <number>      Edge case frequency. (default: 0.1)
  -i, --import <file>          Import the given file, and use its
                               default export as an additional type
                               generator.  Can be specified multiple
                               times. (default: [])
  -j, --json                   Output JSON, not generating any types
                               that will not fit.
  -o, --output <file>          File to output.
  -s, --stringLength <number>  Maximum string length. (default: 20)
  -t, --type <type>            Generate this specific type.
  -T, --listTypes              List all supported types, then exit.
  -h, --help                   display help for command

Examples:
  $ basura -t object
  $ basura -t Array -o array.js
```

## Supported Types

- AggregateError
- Array
- ArrayBuffer
- BigInt64Array
- BigUint64Array
- Boolean
- Buffer
- DataView
- Date
- Error
- EvalError
- Float32Array
- Float64Array
- Generator
- Int16Array
- Int32Array
- Int8Array
- Map
- Number
- Object
- Promise
- Proxy
- RangeError
- ReferenceError
- RegExp
- Set
- SharedArrayBuffer
- String
- SyntaxError
- TypeError
- URIError
- URL
- Uint16Array
- Uint32Array
- Uint8Array
- Uint8ClampedArray
- WeakMap
- WeakRef
- WeakSet
- bigint
- boolean
- function
- integer
- number
- string
- symbol
- undefined

## Adding new types

Pass new types in the `types` option, or from the command line, use `--import
<moduleFile>`. See an [example](test/fixtures/custom.js).

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
console.log(b.generate()) // Some possibly-large chunk of JS
```

See some example output in the
[examples](https://github.com/hildjj/basura/tree/main/examples)
directory.

## Development

To recreate `lib/data.js`:

- Unzip a copy of the
  [Unicode Database](https://www.unicode.org/Public/zipped/latest/UCD.zip)
  into `data/ucd`
- `npm run data`

TODO: the IDNA properties are based on Unicode 12.

---
[![Tests](https://github.com/hildjj/basura/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/basura/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/hildjj/basura/graph/badge.svg?token=KB5O5NFTKS)](https://codecov.io/gh/hildjj/basura)
