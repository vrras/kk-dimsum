import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMessage } from '@/lib/connekthub';
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
    const settings = await prisma.settings.findFirst();
    const storeName = settings?.storeName || 'Nama Toko';
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

    // --- Notifikasi WhatsApp ke Customer (Spintax Enhanced) ---
    let messageToCustomer = '';

    // Jika admin menolak pembayaran (REJECTED)
    if (paymentStatus === 'REJECTED' && currentOrder.paymentStatus !== 'REJECTED') {
      messageToCustomer = `{❌|⚠️} *PEMBAYARAN DITOLAK*\n\n{Halo|Hai} kak ${currentOrder.customerName}, {mohon maaf|maaf banget} bukti pembayaran untuk pesanan *${currentOrder.orderNumber}* tidak dapat kami terima.\n\n*Alasan:* ${paymentRejectionReason || 'Bukti transfer tidak sesuai'}\n\nSilakan {unggah kembali|upload ulang} bukti pembayaran yang benar melalui link ini: ${process.env.NEXTAUTH_URL}/order/${currentOrder.id}\n\n{Terima kasih|Ditunggu ya}! 🙏`;
    }
    // Jika admin mengubah status pesanan ke PROCESSING
    else if (orderStatus === 'PROCESSING' && currentOrder.orderStatus !== 'PROCESSING') {
      const paymentConfirm = currentOrder.paymentMethod === 'TRANSFER' ? 'pembayaran kamu telah kami {terima|verifikasi} dan ' : '';
      messageToCustomer = `{👨‍🍳|🍳} *PESANAN DIPROSES*\n\n{Halo|Hai} kak ${currentOrder.customerName}, ${paymentConfirm}pesanan *${currentOrder.orderNumber}* sedang kami {siapkan|buatkan}.\n\n{Mohon ditunggu ya kak!|Ditunggu ya!|Sabar ya, sebentar lagi siap!} 🥢`;
    }
    // Jika pesanan batal
    else if (orderStatus === 'CANCELLED' && currentOrder.orderStatus !== 'CANCELLED') {
      messageToCustomer = `{❌|🚫} *PESANAN DIBATALKAN*\n\n{Mohon maaf|Maaf} kak ${currentOrder.customerName}, pesanan *${currentOrder.orderNumber}* dibatalkan.\n\nUntuk info lebih lanjut, {hubungi admin kami|silakan chat admin}.`;
    }

    if (messageToCustomer) {
      // sendMessage will format phone number correctly
      await sendMessage(currentOrder.customerWa, messageToCustomer).catch(console.error);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Gagal mengubah pesanan' }, { status: 500 });
  }
}
