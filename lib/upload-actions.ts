'use server';

import { uploadFile } from './storage';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { sendMessage } from './baileys';
import { formatCurrency } from './utils';
import { parseRandomText } from './order-whatsapp';
import fs from 'fs';
import path from 'path';

/**
 * Generic Server Action for image upload (e.g. Menu images, etc.)
 */
export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const prefix = formData.get('prefix') as string | undefined;

    if (!file) {
      throw new Error('Tidak ada file yang diunggah');
    }

    // Call unified storage logic
    const fileUrl = await uploadFile(file, prefix);
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error('Error in uploadFileAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Gagal mengunggah gambar' 
    };
  }
}


/**
 * Server Action for Payment Proof upload (includes DB update & notification)
 */
export async function uploadPaymentProofAction(orderId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new Error('Tidak ada file yang diunggah');
    }

    // Ensure order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Pesanan tidak ditemukan');
    }

    if (!order.waThreadOpened) {
      throw new Error('Kirim konfirmasi WhatsApp ke admin terlebih dulu sebelum upload bukti transfer');
    }

    // Delete old proof if exists
    if (order.paymentProof) {
      try {
        const cleanPath = order.paymentProof.startsWith('/') ? order.paymentProof.substring(1) : order.paymentProof;
        const oldFilePath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        console.error('Gagal menghapus file bukti pembayaran lama:', err);
      }
    }

    // Upload using storage logic (compression, HEIC support, etc.)
    const relativePath = await uploadFile(file, order.orderNumber);

    // Update DB
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProof: relativePath,
        paymentStatus: 'UNPAID', // Reset to unpaid for re-verification
      }
    });

    // Send Notification to Admin (via ADMIN_NOTIFY_WA)
    const adminWaInfo = process.env.ADMIN_NOTIFY_WA || '';

    if (adminWaInfo) {
      const adminMsg = parseRandomText(`{💳|💰} *BUKTI TRANSFER DIUNGGAH*\n\nNomor: *${order.orderNumber}*\nNama: ${order.customerName}\nTotal: *${formatCurrency(order.totalAmount)}*\n\n{Customer|Pelanggan} telah mengunggah bukti pembayaran.\nSilakan cek di dashboard admin untuk verifikasi.\n${process.env.NEXTAUTH_URL}/admin/orders/${order.id}`);
      // Notification should not block the payment-proof upload itself.
      // Baileys/network failures are logged, while the proof remains saved.
      await Promise.race([
        sendMessage(adminWaInfo, adminMsg),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10_000)),
      ]).catch((notificationError) => {
        console.error('Gagal mengirim notifikasi bukti pembayaran via Baileys:', notificationError);
      });
    }

    revalidatePath(`/order/${orderId}`);
    return { success: true, url: relativePath };

  } catch (error) {
    console.error('Error in uploadPaymentProofAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Gagal memproses bukti pembayaran' 
    };
  }
}
