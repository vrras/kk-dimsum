import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { sendMessage } from '@/lib/connekthub';
import { formatCurrency } from '@/lib/utils';

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

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik
    const fileExtension = path.extname(file.name) || '.jpg';
    const fileName = `${order.orderNumber}-${Date.now()}${fileExtension}`;
    
    // Path penyimpanan: public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/${fileName}`;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProof: relativePath,
        paymentStatus: 'UNPAID',
      }
    });

    // Kirim Notifikasi ke Admin
    const settings = await prisma.settings.findFirst();
    const adminWaInfo = settings?.waNumber;
    
    if (adminWaInfo) {
      const adminMsg = `{💳|💰} *BUKTI TRANSFER DIUNGGAH*\n\nNomor: *${order.orderNumber}*\nNama: ${order.customerName}\nTotal: *${formatCurrency(order.totalAmount)}*\n\n{Customer|Pelanggan} telah mengunggah bukti pembayaran.\nSilakan cek di dashboard admin untuk verifikasi.\n${process.env.NEXTAUTH_URL}/admin/orders/${order.id}`;
      // sendMessage automatically formats the number now
      await sendMessage(adminWaInfo, adminMsg);
    } else {
      console.warn("⚠️ Notifikasi admin dilewati: Nomor WA Admin belum diatur di Pengaturan Toko.");
    }

    return NextResponse.json({ success: true, paymentProof: relativePath }, { status: 200 });

  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json({ error: 'Gagal memproses unggahan' }, { status: 500 });
  }
}
