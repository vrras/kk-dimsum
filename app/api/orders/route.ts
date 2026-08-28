import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOrderNumber, formatCurrency } from '@/lib/utils';
import { isStoreOpen, StoreSettings } from '@/lib/store';
import { buildAdminWaLink } from '@/lib/order-whatsapp';
import { sendMessage } from '@/lib/baileys';

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
      console.warn("Nomor WA Admin belum diatur di Pengaturan Toko.");
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

    const adminWaLink = adminWA
      ? buildAdminWaLink(adminWA, {
          orderNumber: newOrder.orderNumber,
        })
      : null;

    // Notifikasi WA otomatis ke nomor notif (ADMIN_NOTIFY_WA) saat ada pesanan baru
    const notifyWa = process.env.ADMIN_NOTIFY_WA;
    if (notifyWa) {
      const itemsList = newOrder.items
        .map((i) => `- ${i.quantity}x ${i.menu.name}`)
        .join('\n');
      const notifMsg = `PESANAN BARU MASUK\n\nNo. Pesanan: ${newOrder.orderNumber}\nNama: ${newOrder.customerName}\nTotal: ${formatCurrency(newOrder.totalAmount)}\nMetode: ${newOrder.paymentMethod}\n\nDetail:\n${itemsList}\n\nSilakan cek dashboard admin untuk detail lengkap: ${process.env.NEXTAUTH_URL}/admin/orders/${newOrder.id}`;
      setImmediate(() => {
        sendMessage(notifyWa, notifMsg).catch((err) =>
          console.error('Gagal kirim notif pesanan baru:', err)
        );
      });
    }

    return NextResponse.json({ ...newOrder, adminWaLink }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}