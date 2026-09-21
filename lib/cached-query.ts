/**
 * cachedQuery — in-memory cache dengan stale fallback (pure, tanpa dependency).
 *
 * Dipisah dari lib/cached-data.ts supaya bisa dites tanpa Prisma/DB
 * (lihat tests/cached-data.test.mjs).
 */

type CacheEntry = { data: unknown; fetchedAt: number }

// biome-ignore lint/suspicious/noExplicitAny: cache generik lintas tipe
const store = globalThis as unknown as { __kkCachedQueryStore?: Map<string, CacheEntry> }
store.__kkCachedQueryStore ??= new Map<string, CacheEntry>()
const cache = store.__kkCachedQueryStore

export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number,
  staleMs: number,
): Promise<T> {
  const now = Date.now()
  const entry = cache.get(key)

  // 1. Cache fresh → balikin tanpa query.
  if (entry && now - entry.fetchedAt < ttlMs) {
    return entry.data as T
  }

  // 2. Cache kadaluwarsa / belum ada → coba query.
  try {
    const data = await fn()
    cache.set(key, { data, fetchedAt: Date.now() })
    return data
  } catch (error) {
    // 3. Gagal + ada stale yang masih dalam window → JANGAN throw.
    if (entry && now - entry.fetchedAt < staleMs) {
      console.warn(
        `[cached-data] query '${key}' gagal, pakai data stale ` +
          `(usia ${Math.round((now - entry.fetchedAt) / 1000)}s):`,
        error instanceof Error ? error.message : error,
      )
      return entry.data as T
    }
    // 4. Gagal + tanpa payung → error asli naik.
    throw error
  }
}
