import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: { 
        category: true,
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(menus);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data menu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, imageUrl, isAvailable, categoryId } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: 'Nama, harga, dan kategori wajib diisi' }, { status: 400 });
    }

    const newMenu = await prisma.menu.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        isAvailable: isAvailable ?? true,
        categoryId: categoryId,
      }
    });

    return NextResponse.json(newMenu, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Gagal menambah menu' }, { status: 500 });
  }
}
