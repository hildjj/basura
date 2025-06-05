#!/usr/bin/env -S node

import {Command, InvalidOptionArgumentError} from 'commander';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Basura} from '../lib/index.js';
import fs from 'node:fs';
import path from 'node:path';
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
  .option('-d, --depth <number>', 'Maximum depth.', myParseInt, 5)
  .option('-e, --edgeFreq <number>', 'Edge case frequency.', myParse01, 0.1)
  .option(
    '-i, --import <file>',
    'Import the given file, and use its default export as an additional type generator.  Can be specified multiple times.',
    (v, p) => p.concat([v]),
    []
  )
  .option('-j, --json', 'Output JSON, not generating any types that will not fit.')
  .option('-o, --output <file>', 'File to output.')
  .option(
    '-s, --stringLength <number>', 'Maximum string length.', myParseInt, 20
  )
  .option('-t, --type <type>', 'Generate this specific type.')
  .option('-T, --listTypes', 'List all supported types, then exit.')
  .addHelpText('after', `
Examples:
  $ basura -t object
  $ basura -t Array -o array.js`)
  .parse(process.argv)
  .opts();

if (opts.json) {
  opts.jsonSafe = true;
}

opts.types = {};
opts.fakeSymbols = true;

const cwdu = pathToFileURL(`${process.cwd()}/`);
for (const i of opts.import) {
  const u = new URL(i, cwdu);
  const f = (await import(u)).default;
  const m = f.name.match(/^generate_(?<cls>.*)/);
  const nm = m ? m.groups.cls : f.name;
  opts.types[nm] = f;
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

  const str = opts.json ?
    JSON.stringify(obj, null, 2) :
    util.inspect(obj, {
      depth: Infinity,
      colors: !opts.output && process.stdout.isTTY,
      maxArrayLength: Infinity,
      maxStringLength: Infinity,
    });

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
