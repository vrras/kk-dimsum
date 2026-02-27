import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage } from '@/lib/connekthub';
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
    const adminWA = settings?.waNumber;

    if (!adminWA) {
      console.warn("⚠️ Notifikasi admin dilewati: Nomor WA Admin belum diatur di Pengaturan Toko.");
    }

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

    // --- Notifikasi WhatsApp ke Customer (Spintax Enchanced) ---
    let messageToCustomer = '';
    const storeName = settings?.storeName || 'Nama Toko';

    if (newOrder.paymentMethod === 'TRANSFER') {
      messageToCustomer = `{Halo|Hai|Halo Kak} *${name}*, {terima kasih|makasih|thanks} telah memesan di *${storeName}*! 🧾\n\n*No. Pesanan: ${newOrder.orderNumber}*\n💰 *Total Tagihan: ${formatCurrency(totalAmount)}*\n💳 *Metode Bayar: Transfer Bank*\n\nSilakan lakukan transfer dan *unggah bukti pembayaran* melalui link di bawah ini agar pesanan dapat {segera kami proses|langsung kami buatkan}:\n${process.env.NEXTAUTH_URL}/order/${newOrder.id}\n\n{Terima kasih|Ditunggu ya}! 🥟💕`;
    } else {
      messageToCustomer = `{Halo|Hai|Halo Kak} *${name}*, pesanan kamu (*${newOrder.orderNumber}*) telah kami {terima|proses}! 🧾\n\n*No. Pesanan: ${newOrder.orderNumber}*\n💰 *Total Tagihan: ${formatCurrency(totalAmount)}*\n💳 *Metode Bayar: COD / Bayar Tunai*\n\nMohon siapkan pembayaran saat pesanan tiba ya kak.\nCek detail pesanan kamu di sini:\n${process.env.NEXTAUTH_URL}/order/${newOrder.id}\n\n{Terima kasih telah memesan|Ditunggu pesanannya} di *${storeName}*! 🥟💕`;
    }

    // --- Notifikasi WhatsApp ke Admin ---
    const messageToAdmin = `🚨 *PESANAN BARU MASUK!* 🚨\n\n👤 Oleh: ${name} (${whatsapp})\n🧾 No: ${newOrder.orderNumber}\n💰 Total: ${formatCurrency(totalAmount)}\n📍 Alamat: ${address}\n📝 Catatan: ${notes || '-'}\n\nSilakan cek dashboard admin untuk proses lebih lanjut!`;

    // Kirim notifikasi secara asynchronous
    const waPromises = [sendMessage(whatsapp, messageToCustomer)];
    
    if (adminWA) {
      waPromises.push(sendMessage(adminWA, messageToAdmin));
    }

    await Promise.allSettled(waPromises);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}
