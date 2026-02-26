import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'Parameter pencarian tidak valid' }, { status: 400 });
    }

    // Cari berdasarkan nomor pesanan (case insensitive)
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: q.toUpperCase()
      },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
