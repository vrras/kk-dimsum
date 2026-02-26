import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { sendMessage } from '@/lib/whatsapp';
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

    // Hapus bukti transfer lama jika ada (agar tidak menumpuk di server)
    if (order.paymentProof) {
      try {
        // Gunakan .substring(1) untuk menghapus leading slash agar path.join bekerja benar
        const cleanPath = order.paymentProof.startsWith('/') ? order.paymentProof.substring(1) : order.paymentProof;
        const oldFilePath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch {
        // Log error tapi lanjutkan proses upload agar tidak mengganggu transaksi
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
    
    // Pastikan folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);

    // Tulis ke disk
    fs.writeFileSync(filePath, buffer);

    // Simpan path ke DB
    const relativePath = `/uploads/${fileName}`;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProof: relativePath,
        paymentStatus: 'UNPAID', // Tetap UNPAID sampai admin konfirmasi
      }
    });

    // Kirim Notifikasi ke Admin (Opsional)
    const adminWaInfo = process.env.ADMIN_WA_NUMBER;
    if (adminWaInfo) {
      const adminMsg = `💳 *BUKTI TRANSFER DIUNGGAH*\n\nNomor: *${order.orderNumber}*\nNama: ${order.customerName}\nTotal: *${formatCurrency(order.totalAmount)}*\n\nCustomer telah mengunggah bukti pembayaran.\nSilakan cek di dashboard admin untuk verifikasi atau tolak pesanan.\n${process.env.NEXTAUTH_URL}/admin/orders/${order.id}`;
      await sendMessage(`${adminWaInfo}@c.us`, adminMsg);
    }

    return NextResponse.json({ success: true, paymentProof: relativePath }, { status: 200 });

  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return NextResponse.json({ error: 'Gagal memproses unggahan' }, { status: 500 });
  }
}
