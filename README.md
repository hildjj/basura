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
  jsonSafe: false,  // generate only JSON-safe types?
  noBoxed: false,   // ignore boxed types, like String?
  output: false,    // add custom inspect functions that make output parseable JS?
  scripts: [],      // Array of script names to limit output to.  Defaults to all
  stringLength: 20, // Maximum string and Buffer length, in codepoints
  types: {},        // Extra types to generate.  Pass in `{Date: null}` to not generate Dates
}
const b = new Basura(opts)
console.log(b.generate()) // output: ???
console.log(b.generate_Date()) // output: some date
```

---
[![Tests](https://github.com/hildjj/basura/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/basura/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/hildjj/basura/badge.svg?branch=main)](https://coveralls.io/github/hildjj/basura?branch=main)
