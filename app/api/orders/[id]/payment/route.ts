import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { sendMessage } from '@/lib/baileys';
import { formatCurrency } from '@/lib/utils';
import { parseRandomText } from '@/lib/order-whatsapp';
import { uploadFile } from '@/lib/storage';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Pastikan order ada
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (!order.waThreadOpened) {
      return NextResponse.json(
        { error: 'Kirim konfirmasi WhatsApp ke admin terlebih dulu sebelum upload bukti transfer' },
        { status: 400 }
      );
    }

    // Hapus bukti transfer lama jika ada
    if (order.paymentProof) {
      try {
        const cleanPath = order.paymentProof.startsWith('/') ? order.paymentProof.substring(1) : order.paymentProof;
        const oldFilePath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch {
        console.error('Gagal menghapus file bukti pembayaran lama');
      }
    }

    // Gunakan abstraksi storage untuk kompresi dan dukungan HEIC
    const relativePath = await uploadFile(file, order.orderNumber);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProof: relativePath,
        paymentStatus: 'UNPAID',
      }
    });

    // Kirim Notifikasi ke Admin (nomor notif via ADMIN_NOTIFY_WA)
    const adminWaInfo = process.env.ADMIN_NOTIFY_WA || '';

    if (adminWaInfo) {
      const adminMsg = parseRandomText(`{💳|💰} *BUKTI TRANSFER DIUNGGAH*\n\nNomor: *${order.orderNumber}*\nNama: ${order.customerName}\nTotal: *${formatCurrency(order.totalAmount)}*\n\n{Customer|Pelanggan} telah mengunggah bukti pembayaran.\nSilakan cek di dashboard admin untuk verifikasi.\n${process.env.NEXTAUTH_URL}/admin/orders/${order.id}`);
      // sendMessage automatically formats the number now
      await sendMessage(adminWaInfo, adminMsg);
    } else {
      console.warn("⚠️ Notifikasi admin dilewati: ADMIN_NOTIFY_WA belum diatur.");
    }

    return NextResponse.json({ success: true, paymentProof: relativePath }, { status: 200 });

  } catch (error) {
    console.error('Error uploading payment proof:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
    return NextResponse.json({ 
      error: 'Gagal memproses unggahan', 
      details: errorMessage
    }, { status: 500 });
  }
}
