#!/usr/bin/env node
/* eslint-disable no-console */

import {Command, InvalidOptionArgumentError} from 'commander';
import {Basura} from '../lib/index.js';
import {fileURLToPath} from 'url';
import fs from 'fs';
import path from 'path';
import util from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

function myParseInt(value, dummyPrevious) {
  const v = parseInt(value, 10);
  if (isNaN(v)) {
    throw new InvalidOptionArgumentError('Not a number.');
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
  .option('-b, --noBoxed', 'Do not generate boxed types, like String')
  .option('-c, --cborSafe', 'Do not generate types that break CBOR')
  .option('-d, --depth <number>', 'Maximum depth', myParseInt, 5)
  .option('-j, --json', 'Output JSON')
  .option('-o, --output <file>', 'File to output')
  .option(
    '-s, --stringLength <number>', 'Maximum string length', myParseInt, 20
  )
  .option('-t, --type <type>', 'Generate this specific type')
  .option('-T, --listTypes', 'List all supported types, then exit')
  .addHelpText('after', `
Examples:
  $ basura -t object
  $ basura -t Array -o array.js`)
  .parse(process.argv)
  .opts();

if (opts.json) {
  opts.jsonSafe = true;
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
    // eslint-disable-next-line no-useless-call
    obj = g[`generate_${t}`].call(g);
  } else {
    obj = g.generate();
  }

  let str = opts.json ?
    JSON.stringify(obj, null, 2) :
    util.inspect(obj, {
      depth: Infinity,
      colors: !opts.output && process.stdout.isTTY,
    });
  let out = process.stdout;
  if (opts.output) {
    if (opts.output !== '-') {
      out = fs.createWriteStream(opts.output);
    }
    if (!opts.json) {
      out.write('export default ');
      str = Basura.quoteSymbols(str);
    }
  }
  out.write(str);
  out.write('\n');
}

main();
