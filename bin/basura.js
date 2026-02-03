#!/usr/bin/env -S node

import {Command, InvalidOptionArgumentError, Option} from 'commander';
import {diagnose, encode} from 'cbor2';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Basura} from '../lib/index.js';
import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import {registerEncoder} from 'cbor2/encoder';
import util from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

function myParseInt(value, _prev) {
  const v = parseInt(value, 10);
  if (isNaN(v)) {
    throw new InvalidOptionArgumentError('Not a number.');
  }
  if (v < 0) {
    throw new InvalidOptionArgumentError('Must not be negative');
  }
  return v;
}

function myParse01(value, _prev) {
  const v = parseFloat(value);
  if (isNaN(v)) {
    throw new InvalidOptionArgumentError('Not a number.');
  }
  if (v < 0 || v > 1) {
    throw new InvalidOptionArgumentError('Must be between 0 and 1 inclusive');
  }
  return v;
}

function myParseArray(value, prev) {
  prev ??= [];
  prev.push(...value.split(/,/g).map(v => v.trim()));
  return prev;
}

const program = new Command();
const opts = program
  .version(pkg.version)
  .usage('[options]')
  .description('Generate a random JavaScript object')
  .option(
    '-a, --arrayLength <number>', 'Maximum array/object size', myParseInt, 10
  )
  .option('-b, --noBoxed', 'Do not generate boxed types, like String.')
  .option('-c, --cborSafe', 'Do not generate types that break CBOR.')
  .addOption(new Option('-C, --cbor', 'Output CBOR.  Implies --cborSafe.')
    .implies({cborSafe: true})
    .conflicts('json')
    .conflicts('jsonSafe'))
  .option('-d, --depth <number>', 'Maximum depth.', myParseInt, 5)
  .option('-e, --edgeFreq <number>', 'Edge case frequency.', myParse01, 0.1)
  .addOption(new Option('-E, --edn', 'Output as EDN.  Implies --cborSafe')
    .implies('cborSafe')
    .conflicts('json')
    .conflicts('cbor'))
  .option(
    '-i, --import <files>',
    'Import the given files (comma-separated), and use its default export as an additional type generator.  Can be specified multiple times.',
    myParseArray
  )
  .addOption(new Option('-j, --json', 'Output JSON.  Implies --jsonSafe.')
    .implies({jsonSafe: true}))
  .option('--jsonSafe', 'Do not generate types that break JSON.')
  .option('-o, --output <file>', 'File to output.')
  .option(
    '-s, --stringLength <number>', 'Maximum string length.', myParseInt, 20
  )
  .option('--scripts <names>', 'Generate strings only with these scripts (comma-separated).  Can be specified multiple times.', myParseArray)
  .option('-t, --type <type>', 'Generate this specific type.')
  .option('-T, --listTypes', 'List all supported types, then exit.')
  .option('-z, --zalgoHeight <number>', 'Max Zalgo height', myParseInt, 0)
  .option('-Z, --zalgoFreq <number>', 'Zalgo frequency', myParse01, 0.2)
  .addHelpText('after', `
Examples:
  $ basura -t object
  $ basura -t Array -o array.js`)
  .parse(process.argv)
  .opts();

opts.types = {};
opts.fakeSymbols = true;

const cwdu = pathToFileURL(`${process.cwd()}/`);
if (opts.import) {
  for (const i of opts.import) {
    const u = new URL(i, cwdu);
    const f = (await import(u)).default;
    const m = f.name.match(/^generate_(?<cls>.*)/);
    const nm = m ? m.groups.cls : f.name;
    opts.types[nm] = f;
  }
}

function stringify(obj) {
  if (opts.json) {
    return JSON.stringify(obj, null, 2);
  }
  if (opts.edn || opts.cbor) {
    registerEncoder(Buffer, b => [
      // Don't write a tag
      NaN,
      // New view on the ArrayBuffer, without copying bytes
      new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
    ]);
  }
  if (opts.edn) {
    const c = encode(obj, {avoidInts: true});
    return diagnose(c);
  }
  if (opts.cbor) {
    return encode(obj, {avoidInts: true});
  }
  return util.inspect(obj, {
    depth: Infinity,
    colors: !opts.output && process.stdout.isTTY,
    maxArrayLength: Infinity,
    maxStringLength: Infinity,
  });
}

function main() {
  const g = new Basura(opts);

  let obj = null;
  if (opts.listTypes) {
    console.log(g.typeNames.join('\n'));
    return;
  }

  if (opts.type) {
    const t = opts.type;
    delete opts.type;
    obj = g.types[t].call(g);
  } else {
    obj = g.generate();
  }

  const str = stringify(obj);

  let out = process.stdout;
  if (opts.output) {
    if (opts.output !== '-') {
      out = fs.createWriteStream(opts.output);
    }
    if (!opts.json) {
      out.write('export default ');
    }
  }
  out.write(str);
  out.end('\n');
}

main();
