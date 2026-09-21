import prisma from '@/lib/prisma'
import { cachedQuery } from '@/lib/cached-query'

export { cachedQuery }

/**
 * In-memory cache + stale fallback untuk data publik KK Dimsum.
 *
 * Latar belakang: Supabase (DB eksternal) intermiten saat jam rush
 * (Prisma P1001 "Can't reach database") → homepage yang query tiap
 * request bisa 500. Menu yang basi 30 detik tidak berdampak
 * operasional untuk resto, 500 = customer hilang.
 *
 * Disimpan di globalThis supaya aman terhadap HMR di dev.
 */

const TTL_MS = 30_000 // data dianggap segar selama 30 detik
const STALE_MS = 300_000 // boleh jadi fallback hingga 5 menit sejak fetch sukses terakhir

export async function getSiteSettings() {
  return cachedQuery('settings', () => prisma.settings.findFirst(), TTL_MS, STALE_MS)
}

export async function getMenuList() {
  return cachedQuery(
    'menu',
    () =>
      prisma.menu.findMany({
        where: { isAvailable: true },
        include: { category: true },
        orderBy: { categoryId: 'asc' as const },
      }),
    TTL_MS,
    STALE_MS,
  )
}

export async function getCategoryList() {
  return cachedQuery(
    'categories',
    () =>
      prisma.category.findMany({
        where: { menus: { some: { isAvailable: true } } },
        orderBy: { name: 'asc' as const },
      }),
    TTL_MS,
    STALE_MS,
  )
}
