import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, discount, isActive } = body;

    const updatedPromo = await prisma.promo.update({
      where: { id: params.id },
      data: {
        code: code ? code.toUpperCase() : undefined,
        discount: discount ? parseInt(discount) : undefined,
        isActive: isActive
      }
    });

    return NextResponse.json(updatedPromo);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengubah promo' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.promo.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus promo' }, { status: 500 });
  }
}
