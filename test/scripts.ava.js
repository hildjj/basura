import {Scripts} from '../lib/scripts.js'
import test from 'ava'

test('create', t => {
  const s = Scripts.instance()
  t.truthy(s)
  t.is(s, Scripts.instance())

  t.throws(() => new Scripts())
})

test('get', t => {
  const s = Scripts.instance()
  t.throws(() => s.get())
  t.throws(() => s.get(null))
  t.throws(() => s.get('null')) // Prevent regression
})

test('filter', t => {
  const s = Scripts.instance()
  const all = s.get('Latin')
  const pvalid = s.get('Latin', true)
  t.true(pvalid.length < all.length)
  t.is(s.get('Latin', false).length, all.length)

  const lower = s.get('Latin', ['Ll'])
  t.true(lower.length > 0)
  t.true(lower.every(({category}) => category === 'Ll'))
})

test('trie error', t => {
  const s = Scripts.instance()
  t.is(s.chars.get(), null)
  t.throws(() => s.chars.get(Number.MAX_SAFE_INTEGER))
})
