# Snapshot report for `test/exec.ava.js`

The actual snapshot is saved in `exec.ava.js.snap`.

Generated by [AVA](https://avajs.dev).

## help

> Snapshot 1

    `Usage: basura [options]␊
    ␊
    Generate a random JavaScript object␊
    ␊
    Options:␊
      -V, --version                output the version number␊
      -a, --arrayLength <number>   Maximum array/object size (default: 10)␊
      -b, --noBoxed                Do not generate boxed types, like String.␊
      -c, --cborSafe               Do not generate types that break CBOR.␊
      -d, --depth <number>         Maximum depth. (default: 5)␊
      -e, --edgeFreq <number>      Edge case frequency. (default: 0.1)␊
      -i, --import <file>          Import the given file, and use its default␊
                                   export as an additional type generator.  Can be␊
                                   specified multiple times. (default: [])␊
      -j, --json                   Output JSON, not generating any types that will␊
                                   not fit.␊
      -o, --output <file>          File to output.␊
      -s, --stringLength <number>  Maximum string length. (default: 20)␊
      -t, --type <type>            Generate this specific type.␊
      -T, --listTypes              List all supported types, then exit.␊
      -h, --help                   display help for command␊
    ␊
    Examples:␊
      $ basura -t object␊
      $ basura -t Array -o array.js␊
    `