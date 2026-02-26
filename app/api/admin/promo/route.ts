import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(promos);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data promo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, discount, isActive } = body;

    if (!code || !discount) {
      return NextResponse.json({ error: 'Kode promo dan diskon wajib diisi' }, { status: 400 });
    }

    const newPromo = await prisma.promo.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(newPromo, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Gagal menambah promo' }, { status: 500 });
  }
}
