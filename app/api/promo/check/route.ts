import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Kode promo kosong' }, { status: 400 });
    }

    const promo = await prisma.promo.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true
      }
    });

    if (!promo) {
      return NextResponse.json({ error: 'Kode promo tidak valid atau sudah kadaluarsa' }, { status: 404 });
    }

    return NextResponse.json(promo);
  } catch {
    return NextResponse.json({ error: 'Gagal mengecek promo' }, { status: 500 });
  }
}
