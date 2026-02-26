import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMessage } from '@/lib/whatsapp';
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
        finalPaymentProof = null; // Set null di database setelah file dihapus
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

    // Explicitly construct the response to avoid any weirdness
    const responseData = {
      ...updatedOrder
    };

    console.log('API DEBUG: updatedOrder result ->', JSON.stringify(responseData, null, 2));

    // Kirim notifikasi WhatsApp ke Customer jika status berubah
    let waNumber = currentOrder.customerWa.replace(/\D/g, '');
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
    }
    
    let messageToCustomer = '';

    // Jika admin menolak pembayaran (REJECTED)
    if (paymentStatus === 'REJECTED' && currentOrder.paymentStatus !== 'REJECTED') {
      messageToCustomer = `❌ *PEMBAYARAN DITOLAK*\n\nHalo kak ${currentOrder.customerName}, mohon maaf bukti pembayaran untuk pesanan *${currentOrder.orderNumber}* tidak dapat kami terima.\n\n*Alasan:* ${paymentRejectionReason || 'Bukti transfer tidak sesuai'}\n\nSilakan unggah kembali bukti pembayaran yang benar melalui link ini: ${process.env.NEXTAUTH_URL}/order/${currentOrder.id}\n\nTerima kasih! 🙏`;
    }
    // Jika admin mengubah status pesanan ke PROCESSING
    else if (orderStatus === 'PROCESSING' && currentOrder.orderStatus !== 'PROCESSING') {
      const paymentConfirm = currentOrder.paymentMethod === 'TRANSFER' ? 'Pembayaran kamu telah kami terima dan ' : '';
      messageToCustomer = `👨‍🍳 *PESANAN DIPROSES*\n\nHalo kak ${currentOrder.customerName}, ${paymentConfirm}pesanan *${currentOrder.orderNumber}* sedang kami siapkan.\n\nMohon ditunggu ya kak! 🥢`;
    }
    // Jika admin mengubah status pesanan ke READY (Siap diantar/diambil)
    else if (orderStatus === 'READY' && currentOrder.orderStatus !== 'READY') {
      messageToCustomer = `🛵 *PESANAN SIAP*\n\nHalo kak ${currentOrder.customerName}, pesanan *${currentOrder.orderNumber}* sudah siap dikirim/diambil.\n\nSelamat menikmati Jajanan KK Dimsum! 😋`;
    }
    // Jika pesanan batal
    else if (orderStatus === 'CANCELLED' && currentOrder.orderStatus !== 'CANCELLED') {
      messageToCustomer = `❌ *PESANAN DIBATALKAN*\n\nMohon maaf kak ${currentOrder.customerName}, pesanan *${currentOrder.orderNumber}* dibatalkan.\n\nUntuk info lebih lanjut, hubungi admin kami.`;
    }

    if (messageToCustomer) {
      await sendMessage(`${waNumber}@c.us`, messageToCustomer).catch(console.error);
    }

    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json({ error: 'Gagal mengubah pesanan' }, { status: 500 });
  }
}
