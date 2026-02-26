import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage } from '@/lib/whatsapp';
import { formatCurrency } from '@/lib/utils';
import { generateOrderNumber } from '@/lib/utils';
import { isStoreOpen, StoreSettings } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, whatsapp, address, notes, items, paymentMethod, promoCode } = body as {
      name: string;
      whatsapp: string;
      address: string;
      notes?: string;
      items: { menuId: string; quantity: number }[];
      paymentMethod: string;
      promoCode?: string;
    };

    if (!name || !whatsapp || !address || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data pesanan tidak lengkap' }, { status: 400 });
    }

    // Dapatkan nomor WA Admin dari Settings (atau fallback template)
    const settings = await prisma.settings.findFirst();
    const adminWA = settings?.waNumber || process.env.ADMIN_WHATSAPP;

    // Validasi Toko Buka / Tutup
    let currentlyOpen = true;
    if (settings) {
      const storeSettings: StoreSettings = {
        isOpen: settings.isOpen,
        openHour: settings.openHour,
        closeHour: settings.closeHour,
        closedDays: settings.closedDays || '[]',
      };
      currentlyOpen = isStoreOpen(storeSettings);
    }
    
    if (!currentlyOpen) {
      return NextResponse.json({ error: 'Maaf, toko sedang tutup. Silakan pesan kembali saat jam operasional.' }, { status: 403 });
    }

    // Hitung total dari DB untuk keamanan
    const menuIds = items.map(i => i.menuId);
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } }
    });

    let subtotal = 0;
    const orderItems = items.map(item => {
      const menu = menus.find(m => m.id === item.menuId);
      if (!menu) throw new Error(`Menu dengan ID ${item.menuId} tidak ditemukan`);
      
      const itemSubtotal = menu.price * item.quantity;
      subtotal += itemSubtotal;
      
      return {
        menuId: menu.id,
        quantity: item.quantity,
        price: menu.price
      };
    });

    let discount = 0;
    
    // Validasi Promo jika ada
    if (promoCode) {
      const promo = await prisma.promo.findFirst({
        where: { code: promoCode.toUpperCase(), isActive: true }
      });
      if (promo) {
        discount = promo.discount;
      }
    }

    const totalAmount = Math.max(0, subtotal - discount);

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: name,
        customerWa: whatsapp,
        customerAddress: address,
        notes: notes || '',
        totalAmount,
        paymentMethod: paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'CASH',
        items: {
          create: orderItems
        }
      },
      include: {
        items: { include: { menu: true } }
      }
    });

    // --- Notifikasi WhatsApp ke Customer ---
    let custWaFormat = whatsapp.replace(/\D/g, '');
    if (custWaFormat.startsWith('0')) custWaFormat = '62' + custWaFormat.substring(1);

    let messageToCustomer = '';

    const storeName = settings?.storeName || 'Nama Toko';

    if (newOrder.paymentMethod === 'TRANSFER') {
      messageToCustomer = `Halo *${name}*, terima kasih telah memesan di ${storeName}! 🧾

*No. Pesanan: ${newOrder.orderNumber}*
💰 *Total Tagihan: ${formatCurrency(totalAmount)}*
💳 *Metode Bayar: Transfer Bank*

Silakan lakukan transfer dan *unggah bukti pembayaran* melalui link di bawah ini agar pesanan dapat segera kami proses:
${process.env.NEXTAUTH_URL}/order/${newOrder.id}

Terima kasih! 🥟💕`;
    } else {
      messageToCustomer = `Halo *${name}*, pesanan kamu (*${newOrder.orderNumber}*) telah kami terima! 🧾

*No. Pesanan: ${newOrder.orderNumber}*
💰 *Total Tagihan: ${formatCurrency(totalAmount)}*
💳 *Metode Bayar: COD / Bayar Tunai*

Mohon siapkan pembayaran saat pesanan tiba ya kak.
Cek detail pesanan kamu di sini:
${process.env.NEXTAUTH_URL}/order/${newOrder.id}

Terima kasih telah memesan di *${storeName}*! 🥟💕`;
    }

    // --- Notifikasi WhatsApp ke Admin ---
    const messageToAdmin = `🚨 *PESANAN BARU MASUK!* 🚨

👤 Oleh: ${name} (${whatsapp})
🧾 No: ${newOrder.orderNumber}
💰 Total: ${formatCurrency(totalAmount)}
📍 Alamat: ${address}
📝 Catatan: ${notes || '-'}

Silakan cek dashboard admin untuk proses lebih lanjut!`;

    // Kirim notifikasi secara asynchronous tapi tetap ditunggu agar proses tidak di-kill oleh Next.js serverless
    const waPromises = [sendMessage(`${custWaFormat}@c.us`, messageToCustomer)];
    
    if (adminWA) {
      let adminWaFormat = adminWA.replace(/\D/g, '');
      if (adminWaFormat.startsWith('0')) adminWaFormat = '62' + adminWaFormat.substring(1);
      waPromises.push(sendMessage(`${adminWaFormat}@c.us`, messageToAdmin));
    }

    await Promise.allSettled(waPromises);

    return NextResponse.json(newOrder, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}
