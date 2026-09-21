// Test lib/cached-query.ts — pure helper, no DB needed.
// Jalankan: node --experimental-strip-types --test tests/cached-data.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import { cachedQuery } from '../lib/cached-query.ts'

// waktu virtual biar test ga nunggu TTL/retry beneran
const realNow = Date.now
let vtime = 1_000_000
const setTime = (t) => {
  vtime = t
  Date.now = () => vtime
}
const restoreTime = () => {
  Date.now = realNow
}

const KEY = 'test-key'
const resetCache = () => {
  const s = globalThis.__kkCachedQueryStore
  if (s) {
    s.entries.clear()
    s.inFlight.clear()
  }
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

test('expired + fn sukses: data stale dibalikin instan, refresh di background', async () => {
  resetCache()
  setTime(2_000_000)
  let resolveFirst
  const first = new Promise((resolve) => {
    resolveFirst = resolve
  })
  let calls = 0
  const fn = async () => {
    calls++
    if (calls === 1) return 'v1'
    await first // tahan refresh pertama biar kita bisa ukur latency
    return 'v2'
  }

  await cachedQuery(KEY, fn, 30_000, 300_000) // seed: langsung sukses (v1)
  setTime(2_031_000) // expired

  const t0 = vtime
  const r2 = await cachedQuery(KEY, fn, 30_000, 300_000)
  assert.equal(r2, 'v1') // stale instan, ga nunggu refresh
  assert.equal(calls, 2) // refresh sudah distart di background
  assert.ok(vtime === t0) // ga ada sleep/await ke fn

  resolveFirst()
  await new Promise((r) => setTimeout(r, 10))
  const r3 = await cachedQuery(KEY, fn, 30_000, 300_000)
  assert.equal(r3, 'v2') // cache sudah ter-refresh
  restoreTime()
})

test('expired + refresh gagal: stale tetap dipakai, tanpa throw', async () => {
  resetCache()
  setTime(3_000_000)
  let calls = 0
  const fn = async () => {
    calls++
    if (calls === 1) return ['menu-stale']
    throw new Error("P1001: Can't reach database")
  }

  await cachedQuery(KEY, fn, 30_000, 300_000) // seed sukses
  setTime(3_031_000) // expired, masih < 300s window

  const r = await cachedQuery(KEY, fn, 30_000, 300_000)
  assert.deepEqual(r, ['menu-stale'])

  // beri kesempatan revalidate promise (ditelan) settle
  await new Promise((r2) => setTimeout(r2, 10))
  restoreTime()
})

test('cold + fn gagal 1x lalu sukses (retry): data masuk cache', async () => {
  resetCache()
  setTime(4_000_000)
  let calls = 0
  const fn = async () => {
    calls++
    if (calls === 1) throw new Error('blip')
    return ['menu-retry']
  }

  const r = await cachedQuery(KEY, fn, 30_000, 300_000)
  assert.deepEqual(r, ['menu-retry'])

  // fresh setelah sukses: ga ada query tambahan
  setTime(4_010_000)
  const r2 = await cachedQuery(KEY, fn, 30_000, 300_000)
  assert.deepEqual(r2, ['menu-retry'])
  assert.equal(calls, 2)
  restoreTime()
})

test('cold + fn gagal 2x: rethrow error asli', async () => {
  resetCache()
  setTime(5_000_000)
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
