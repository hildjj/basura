import {UnicodeTrieBuilder} from '@cto.af/unicode-trie/builder.js'
import codePoints from 'codepoints'
import {fileURLToPath} from 'url'
import fs from 'fs'
import {parseFile} from '@fast-csv/parse'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const log2 = Math.log2 || (n => Math.log(n) / Math.LN2)
const bits = n => (log2(n) + 1) | 0
const DATA = path.resolve(__dirname, '..', 'data')

const categories = {}
const scripts = {}
const properties = {}
let categoryCount = 0
let scriptCount = 0
let propertyCount = 0
const codes = {}

let categoryBits = 0
let scriptBits = 0
let propertyBits = 0
let scriptShift = 0
let categoryShift = 0
let invalid = 0

for (const codePoint of codePoints) {
  if ((codePoint != null) && (codePoint.script != null)) {
    if (categories[codePoint.category] == null) {
      categories[codePoint.category] = categoryCount++
    }
    if (scripts[codePoint.script] == null) {
      scripts[codePoint.script] = {
        num: scriptCount++,
        first: codePoint.code,
        count: 0,
      }
    }
    scripts[codePoint.script].last = codePoint.code
    codes[codePoint.code] = codePoint
  }
}

function idna() {
  return new Promise((resolve, reject) => {
    const all = []
    parseFile(
      path.join(DATA, 'idna-tables-properties.csv'),
      {headers: true}
    )
      .on('data', ({Codepoint, Property}) => {
        if (Property !== 'UNASSIGNED') {
          if (properties[Property] == null) {
            properties[Property] = propertyCount++
          }
          all.push([Codepoint, Property])
        }
      })
      .on('error', reject)
      .on('end', () => {
        categoryBits = bits(categoryCount - 1)
        scriptBits = bits(scriptCount - 1)
        propertyBits = bits(propertyCount - 1)
        scriptShift = propertyBits
        categoryShift = scriptShift + scriptBits
        invalid = categoryShift + categoryBits

        const trie = new UnicodeTrieBuilder(1 << invalid, 1 << (invalid + 1))

        for (const [Codepoint, Property] of all) {
          const m = Codepoint.match(
            /(?<start>[0-9A-F]+)(?:-(?<end>[0-9A-F]+))?/
          )
          if (!m) {
            reject(new Error(`Invalid codepoint: '${Codepoint}'`))
            return
          }
          const start = parseInt(m.groups.start, 16)
          const end = m.groups.end ? parseInt(m.groups.end, 16) : start

          for (let i = start; i <= end; i++) {
            const cp = codes[i]
            if (!cp) {
              //
              // console.log(
              //   `Invalid code: 0x${i.toString(16)},\
              //    ${Property}, ${Codepoint}`
              // )
              continue
            }
            // Version mismatch between codepoints database and IANA table
            // means some scripts won't have any characters
            scripts[cp.script].count++
            trie.set(i,
              properties[Property] |
              (scripts[cp.script].num << scriptShift) |
              (categories[cp.category] << categoryShift))
          }
        }
        resolve(trie)
      })
  })
}

async function main() {
  const trie = await idna()
  await fs.promises.writeFile(
    path.join(__dirname, '..', 'lib', 'data.js'),
    trie.toModule({quot: "'", semi: ''})
  )

  const scriptA = []
  for (const [k, v] of Object.entries(scripts)) {
    if (v.count > 0) {
      scriptA.push([k, v.num, v.first, v.last])
    }
  }
  const data = {
    scripts: scriptA,
    categories: Object.keys(categories),
    properties: Object.keys(properties),
    categoryBits,
    scriptBits,
    propertyBits,
    categoryShift,
    scriptShift,
    propertyShift: 0,
    invalid: 1 << invalid,
    error: 1 << (invalid + 1),
  }
  await fs.promises.writeFile(
    path.join(DATA, 'data.json'),
    JSON.stringify(data)
  )
}

// eslint-disable-next-line no-console
main().catch(console.error)
