import {Basura} from '../lib/index.js'
import {Buffer} from 'buffer'
import {fileURLToPath} from 'url'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {spawn} from 'child_process'
import test from 'ava'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))

async function withTempDir(f) {
  const p = `${path.join(os.tmpdir(), pkg.name)}-`
  const dir = await fs.promises.mkdtemp(p)
  try {
    await f(dir)
  } finally {
    await fs.rm(dir, {recursive: true})
  }
}

function exec(bin, opts = {}) {
  opts = {
    args: [],
    encoding: 'utf8',
    env: {},
    ...opts,
  }
  return new Promise((resolve, reject) => {
    bin = path.join(__dirname, '..', 'bin', `${bin}.js`)
    const env = {
      ...process.env,
      ...opts.env,
    }
    const c = spawn(bin, opts.args, {
      stdio: 'pipe',
      env,
    })
    c.on('error', reject)
    const bufs = []
    c.stdout.on('data', b => bufs.push(b))
    c.stderr.on('data', b => bufs.push(b))
    c.on('close', code => {
      const buf = Buffer.concat(bufs)
      const str = buf.toString(opts.encoding)
      if (code === 0) {
        resolve(str)
      } else {
        const err = new Error(`process fail, code ${code}`)
        err.buf = buf
        err.str = str
        reject(err)
      }
    })
    c.on('exit', (code, signal) => {
      const problem = code || signal
      if (problem) {
        const buf = Buffer.concat(bufs)
        const str = buf.toString(opts.encoding)
        reject(new Error(`Invalid exit: ${problem}\n${str}`))
      }
    })
    if (opts.stdin != null) {
      c.stdin.write(opts.stdin)
    }
    c.stdin.end()
  })
}

test('help', async t => {
  const help = await exec('basura', {
    args: ['-h'],
  })
  t.is(help, `\
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
`)
})

test('defaults', async t => {
  t.is(typeof (await exec('basura')), 'string')
})

test('version', async t => {
  t.is(await exec('basura', {args: ['-V']}), `${pkg.version}\n`)
})

test('arrayLength', async t => {
  t.is(await exec('basura', {args: ['-a', '0', '-t', 'Array']}), '[]\n')
  await t.throwsAsync(() => exec('basura', {args: ['-a', 'foo']}))
})

test('json', async t => {
  const txt = await exec('basura', {args: ['-j']})
  t.notThrows(() => JSON.parse(txt))
})

test('list types', async t => {
  const txt = await exec('basura', {args: ['-b', '--listTypes']})
  const b = new Basura({noBoxed: true})
  t.is(txt, `${b.typeNames.join('\n')}\n`)
})

test('output', async t => {
  const txt = await exec('basura', {args: ['-j', '-o-']})
  t.notThrows(() => JSON.parse(txt), `Original text: "${txt}"`)
  await withTempDir(async d => {
    const f = path.resolve(d, 'foo.mjs')
    t.is(await exec('basura', {args: ['-o', f]}), '')
    t.notThrows(
      () => import(f),
      `module contents: ${await fs.promises.readFile(f, 'utf-8')}`
    )
  })
})
