import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMessage } from '@/lib/baileys';
import fs from 'fs';
import path from 'path';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil detail pesanan' }, { status: 500 });
  }
}


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderStatus, paymentStatus, paymentRejectionReason } = body;

    const currentOrder = await prisma.order.findUnique({ where: { id: params.id }, include: { items: { include: { menu: true } } } });
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Logika Penghapusan Bukti Transfer setelah Verifikasi (PAID) atau Batal (CANCELLED)
    let finalPaymentProof = currentOrder.paymentProof;
    if ((paymentStatus === 'PAID' || orderStatus === 'CANCELLED') && currentOrder.paymentProof) {
      try {
        const cleanPath = currentOrder.paymentProof.startsWith('/') ? currentOrder.paymentProof.substring(1) : currentOrder.paymentProof;
        const filePath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        finalPaymentProof = null;
      } catch (error) {
        console.error('Gagal menghapus file bukti pembayaran:', error);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        orderStatus: orderStatus !== undefined ? orderStatus : currentOrder.orderStatus,
        paymentStatus: paymentStatus !== undefined ? paymentStatus : currentOrder.paymentStatus,
        paymentRejectionReason: paymentRejectionReason !== undefined ? paymentRejectionReason : currentOrder.paymentRejectionReason,
        paymentProof: finalPaymentProof,
      }
    });

    const responseData = { ...updatedOrder };

    // --- Notifikasi WhatsApp ke Customer (Simplified, No Emojis or Bold Formatting) ---
    // Jalankan notifikasi di background tanpa memblokir response
    let messageToCustomer = '';

    if (paymentStatus === 'REJECTED' && currentOrder.paymentStatus !== 'REJECTED') {
      messageToCustomer = `Halo kak ${currentOrder.customerName}, mohon maaf bukti pembayaran untuk pesanan ${currentOrder.orderNumber} tidak dapat kami terima.\n\nAlasan: ${paymentRejectionReason || 'Bukti transfer tidak sesuai'}\n\nSilakan upload ulang bukti pembayaran yang benar melalui link ini: ${process.env.NEXTAUTH_URL}/order/${currentOrder.id}\n\nTerima kasih!`;
    } else if (orderStatus === 'PROCESSING' && currentOrder.orderStatus !== 'PROCESSING') {
      const paymentConfirm = currentOrder.paymentMethod === 'TRANSFER' ? 'pembayaran kamu telah kami terima dan ' : '';
      messageToCustomer = `Halo kak ${currentOrder.customerName}, ${paymentConfirm}pesanan ${currentOrder.orderNumber} sedang kami siapkan.\n\nMohon ditunggu ya kak!`;
    } else if (orderStatus === 'CANCELLED' && currentOrder.orderStatus !== 'CANCELLED') {
      messageToCustomer = `Mohon maaf kak ${currentOrder.customerName}, pesanan ${currentOrder.orderNumber} dibatalkan.\n\nUntuk info lebih lanjut, silakan chat admin.`;
    }

    // Send WhatsApp notification in background - do not await
    if (messageToCustomer) {
      setImmediate(() => {
        sendMessage(currentOrder.customerWa, messageToCustomer).catch((err) => {
          console.error('Gagal mengirim notifikasi WhatsApp ke customer:', err);
        });
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Gagal mengubah pesanan' }, { status: 500 });
  }
}