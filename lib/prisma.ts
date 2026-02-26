import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import path from 'path';

const prismaClientSingleton = () => {
  // Gunakan absolute path agar Next.js runtime dan Prisma CLI membaca file database yang sama di folder prisma/
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const dbUrl = `file:${dbPath}`;
  const adapter = new PrismaBetterSqlite3({ url: dbUrl } as any);
  return new PrismaClient({ adapter })
}

declare global {
  /* eslint-disable no-var */
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
  /* eslint-enable no-var */
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
