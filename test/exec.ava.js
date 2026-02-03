import {Basura} from '../lib/index.js';
import {Buffer} from 'node:buffer';
import {decode} from 'cbor2';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import {parseEDN} from 'cbor-edn';
import path from 'node:path';
import {spawn} from 'node:child_process';
import test from 'ava';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

async function withTempDir(f) {
  const p = `${path.join(os.tmpdir(), pkg.name)}-`;
  const dir = await fs.promises.mkdtemp(p);
  try {
    await f(dir);
  } finally {
    await fs.promises.rm(dir, {recursive: true});
  }
}

function exec(bin, opts = {}) {
  opts = {
    args: [],
    encoding: 'utf8',
    env: {},
    ...opts,
  };
  return new Promise((resolve, reject) => {
    bin = path.join(root, 'bin', `${bin}.js`);
    const env = {
      ...process.env,
      ...opts.env,
    };
    const c = spawn(bin, opts.args, {
      cwd: root,
      stdio: 'pipe',
      env,
    });
    c.on('error', reject);
    const bufs = [];
    c.stdout.on('data', b => bufs.push(b));
    c.stderr.on('data', b => bufs.push(b));
    c.on('close', code => {
      const buf = Buffer.concat(bufs);
      const str = buf.toString(opts.encoding);
      if (code === 0) {
        resolve(opts.encoding === 'binary' ? buf : str);
      } else {
        const err = new Error(`process fail, code ${code}`);
        err.buf = buf;
        err.str = str;
        reject(err);
      }
    });
    c.on('exit', (code, signal) => {
      const problem = code || signal;
      if (problem) {
        const buf = Buffer.concat(bufs);
        const str = buf.toString(opts.encoding);
        reject(new Error(`Invalid exit: ${problem}\n${str}`));
      }
    });
    if (opts.stdin != null) {
      c.stdin.write(opts.stdin);
    }
    c.stdin.end();
  });
}

test('help', async t => {
  const help = await exec('basura', {
    args: ['-h'],
  });
  t.snapshot(help);
});

test('defaults', async t => {
  t.is(typeof (await exec('basura')), 'string');
});

test('version', async t => {
  t.is(await exec('basura', {args: ['-V']}), `${pkg.version}\n`);
});

test('arrayLength', async t => {
  t.is(await exec('basura', {args: ['-a', '0', '-t', 'Array']}), '[]\n');
  await t.throwsAsync(() => exec('basura', {args: ['-a', 'foo']}));
});

test('json', async t => {
  const txt = await exec('basura', {args: ['-j']});
  t.notThrows(() => JSON.parse(txt));
});

test('cbor', async t => {
  const c = await exec('basura', {args: ['-C'], encoding: 'binary'});
  t.notThrows(() => decode(c));
});

test('edn', async t => {
  const e = await exec('basura', {args: ['-E']});
  t.notThrows(() => parseEDN(e));
});

test('list types', async t => {
  const txt = await exec('basura', {args: ['-b', '--listTypes']});
  const b = new Basura({noBoxed: true});
  t.is(txt, `${b.typeNames.join('\n')}\n`);
});

test('option parsing', async t => {
  await t.throwsAsync(() => exec('basura', {args: ['-e']}));
  await t.throwsAsync(() => exec('basura', {args: ['-e', 'aaa']}));
  await t.throwsAsync(() => exec('basura', {args: ['-e', '2']}));
  await t.throwsAsync(() => exec('basura', {args: ['-d', '-1']}));
});

test('output', async t => {
  const txt = await exec('basura', {args: ['-j', '-o-']});
  t.notThrows(() => JSON.parse(txt), `Original text: "${txt}"`);
  await withTempDir(async d => {
    const f = path.resolve(d, 'foo.mjs');
    t.is(await exec('basura', {args: ['-o', f]}), '');
    try {
      await import(f);
    } catch (er) {
      if (er.cause !== 'BasuraGenerated') {
        // eslint-disable-next-line no-console
        console.error(await fs.promises.readFile(f, 'utf-8'));
        throw er;
      }
    }
    t.is(await exec('basura', {args: ['-t', 'Promise', '-e', '1', '-o', f]}), '');
    try {
      await import(f);
    } catch (er) {
      t.is(
        er.cause,
        'BasuraGenerated',
        `module contents: ${await fs.promises.readFile(f, 'utf-8')}`
      );
    }
    t.is(await exec('basura', {args: ['-t', 'Promise', '-e', '0', '-o', f]}), '');
    try {
      await import(f);
    } catch (er) {
      t.is(
        er.cause,
        'BasuraGenerated',
        `module contents: ${await fs.promises.readFile(f, 'utf-8')}`
      );
    }
  });
});

test('imports', async t => {
  t.regex(await exec('basura', {
    args: ['-i', './test/fixtures/custom.js', '-t', 'Foo'],
  }), /Foo/);

  t.is(await exec('basura', {
    args: ['-i', './test/fixtures/custom_min.js', '-t', 'min'],
  }), '4\n');
});
