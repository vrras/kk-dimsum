/**
 * cachedQuery — in-memory cache dengan stale-while-revalidate (pure, tanpa dependency).
 *
 * Dipisah dari lib/cached-data.ts supaya bisa dites tanpa Prisma/DB
 * (lihat tests/cached-data.test.mjs).
 *
 * Perilaku:
 *  1. Cache fresh (< ttl)  → balikin tanpa query.
 *  2. Cache kadaluwarsa    → balikin data lama LANGSUNG, refresh di background
 *                            (stale-while-revalidate; 1 refresh in-flight per key).
 *  3. Belum ada cache sama sekali (cold, mis. baru boot) → coba fn();
 *                            gagal → retry 1x setelah 400ms; gagal lagi → throw.
 */

type CacheEntry = { data: unknown; fetchedAt: number }

type CacheState = {
  entries: Map<string, CacheEntry>
  inFlight: Map<string, Promise<unknown>>
}

// biome-ignore lint/suspicious/noExplicitAny: cache generik lintas tipe
const store = globalThis as unknown as { __kkCachedQueryStore?: CacheState }
store.__kkCachedQueryStore ??= { entries: new Map(), inFlight: new Map() }
const state = store.__kkCachedQueryStore

const COLD_RETRY_DELAY_MS = 400

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Refresh di background; error ditelan (data stale tetap sah). */
function revalidate<T>(key: string, fn: () => Promise<T>): Promise<unknown> {
  const existing = state.inFlight.get(key)
  if (existing) return existing

  const p = fn()
    .then((data) => {
      state.entries.set(key, { data, fetchedAt: Date.now() })
    })
    .catch((error) => {
      console.warn(
        `[cached-data] revalidate '${key}' gagal, stale tetap dipakai:`,
        error instanceof Error ? error.message : error,
      )
    })
    .finally(() => {
      state.inFlight.delete(key)
    })

  state.inFlight.set(key, p)
  return p
}

export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number,
  staleMs: number,
): Promise<T> {
  const now = Date.now()
  const entry = state.entries.get(key)

  // 1. Fresh → langsung.
  if (entry && now - entry.fetchedAt < ttlMs) {
    return entry.data as T
  }

  // 2. Ada data lama → stale-while-revalidate: balikin instan, refresh di belakang.
  //    (staleMs dipakai sebagai umur maksimal data lama yang boleh disajikan
  //    saat revalidate terus gagal; lewat itu → perlakukan sebagai cold.)
  if (entry && now - entry.fetchedAt < staleMs) {
    void revalidate(key, fn)
    return entry.data as T
  }

  // 3. Cold (belum ada cache / stale basi) → query langsung + retry 1x.
  try {
    const data = await fn()
    state.entries.set(key, { data, fetchedAt: Date.now() })
    return data
  } catch (firstError) {
    await sleep(COLD_RETRY_DELAY_MS)
    try {
      const data = await fn()
      state.entries.set(key, { data, fetchedAt: Date.now() })
      return data
    } catch {
      throw firstError
    }
  }
}
