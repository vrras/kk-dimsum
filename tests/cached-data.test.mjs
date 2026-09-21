// Test lib/cached-query.ts — pure helper, no DB needed.
// Jalankan: node --experimental-strip-types --test tests/cached-data.test.mjs
// (pattern import *.ts relative: proven di tests/ firsaas-website)
import assert from 'node:assert/strict'
import test from 'node:test'
import { cachedQuery } from '../lib/cached-query.ts'

// helper: waktu virtual biar test ga nunggu TTL beneran
const realNow = Date.now
const setTime = (t) => {
  Date.now = () => t
}
const restoreTime = () => {
  Date.now = realNow
}

const KEY = 'test-key'
const resetCache = () => {
  globalThis.__kkCachedQueryStore?.clear()
}

test('fresh cache: fn dipanggil 1x untuk 2 request berturut', async () => {
  resetCache()
  setTime(1_000_000)
  let calls = 0
  const fn = async () => {
    calls++
    return ['menu-a']
  }

  const r1 = await cachedQuery(KEY, fn, 30_000, 300_000)
  setTime(1_010_000) // +10s, masih fresh (TTL 30s)
  const r2 = await cachedQuery(KEY, fn, 30_000, 300_000)

  assert.equal(calls, 1)
  assert.deepEqual(r1, ['menu-a'])
  assert.deepEqual(r2, ['menu-a'])
  restoreTime()
})

test('expired + fn sukses: data baru, cache ter-update', async () => {
  resetCache()
  setTime(2_000_000)
  let calls = 0
  const fn = async () => {
    calls++
    return calls === 1 ? ['data-lama'] : ['data-baru']
  }

  const r1 = await cachedQuery(KEY, fn, 30_000, 300_000)
  assert.deepEqual(r1, ['data-lama'])

  setTime(2_031_000) // +31s: expired (TTL 30s)
  const r2 = await cachedQuery(KEY, fn, 30_000, 300_000)

  assert.equal(calls, 2)
  assert.deepEqual(r2, ['data-baru'])
  restoreTime()
})

test('expired + fn throw + ada stale: return stale, tanpa throw', async () => {
  resetCache()
  setTime(3_000_000)
  let calls = 0
  const fn = async () => {
    calls++
    if (calls === 1) return ['menu-stale']
    throw new Error("P1001: Can't reach database")
  }

  await cachedQuery(KEY, fn, 30_000, 300_000) // seed: fetch sukses pertama
  setTime(3_031_000) // expired, tapi masih < 300s window stale

  const r = await cachedQuery(KEY, fn, 30_000, 300_000)

  assert.equal(calls, 2)
  assert.deepEqual(r, ['menu-stale'])
  restoreTime()
})

test('expired + fn throw + tanpa cache: rethrow error asli', async () => {
  resetCache()
  setTime(4_000_000)
  const fn = async () => {
    throw new Error("P1001: Can't reach database")
  }

  await assert.rejects(
    () => cachedQuery(KEY, fn, 30_000, 300_000),
    (err) => {
      assert.match(String(err?.message), /P1001/)
      return true
    },
  )
  restoreTime()
})
