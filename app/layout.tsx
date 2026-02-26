import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import ThemeWrapper from '@/components/ThemeWrapper'
import prisma from '@/lib/prisma'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.settings.findFirst()
  const storeName = settings?.storeName || 'Nama Toko'
  
  return {
    title: `${storeName} - Jajanan Enak & Praktis`,
    description: 'Pesan jajanan dimsum favoritmu secara online sekarang juga!',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <AppRouterCacheProvider>
          <ThemeWrapper>
            <CartProvider>
              <main>
                {children}
              </main>
            </CartProvider>
          </ThemeWrapper>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
