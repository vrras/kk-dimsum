import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteFile } from '@/lib/storage';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, imageUrl, isAvailable, categoryId } = body;

    const existingMenu = await prisma.menu.findUnique({
      where: { id: params.id },
      select: { imageUrl: true }
    });

    const updatedMenu = await prisma.menu.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        imageUrl,
        isAvailable,
        categoryId: categoryId ? categoryId : undefined,
      }
    });

    if (existingMenu?.imageUrl && existingMenu.imageUrl !== imageUrl) {
      await deleteFile(existingMenu.imageUrl);
    }

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengubah menu' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id: params.id },
      select: { imageUrl: true }
    });

    await prisma.menu.delete({
      where: { id: params.id }
    });

    if (menu?.imageUrl) {
      await deleteFile(menu.imageUrl);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus menu' }, { status: 500 });
  }
}
