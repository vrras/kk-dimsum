'use server';

import { uploadFile } from './storage';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { sendMessage } from './connekthub';
import { formatCurrency } from './utils';
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

    // Send Notification to Admin
    const settings = await prisma.settings.findFirst();
    const adminWaInfo = settings?.waNumber;
    
    if (adminWaInfo) {
      const adminMsg = `{💳|💰} *BUKTI TRANSFER DIUNGGAH*\n\nNomor: *${order.orderNumber}*\nNama: ${order.customerName}\nTotal: *${formatCurrency(order.totalAmount)}*\n\n{Customer|Pelanggan} telah mengunggah bukti pembayaran.\nSilakan cek di dashboard admin untuk verifikasi.\n${process.env.NEXTAUTH_URL}/admin/orders/${order.id}`;
      await sendMessage(adminWaInfo, adminMsg);
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
