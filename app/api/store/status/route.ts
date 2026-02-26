import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isStoreOpen, StoreSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      return NextResponse.json({ 
        isOpen: false, 
        message: 'Pengaturan toko belum dikonfigurasi',
        currentTime: new Date().toISOString()
      }, { status: 404 });
    }

    const storeSettings: StoreSettings = {
      isOpen: settings.isOpen,
      openHour: settings.openHour,
      closeHour: settings.closeHour,
      closedDays: settings.closedDays || '[]',
    };

    const currentlyOpen = isStoreOpen(storeSettings);

    return NextResponse.json({
      isOpen: currentlyOpen,
      manualIsOpen: settings.isOpen,
      openHour: settings.openHour,
      closeHour: settings.closeHour,
      closedDays: storeSettings.closedDays,
      currentTime: new Date().toISOString(),
      storeName: settings.storeName || 'KK Dimsum',
      storeAddress: settings.storeAddress || ''
    });

  } catch (error) {
    console.error('API Store Status GET Error:', error);
    return NextResponse.json({ 
      error: 'Gagal mendapatkan status toko',
      isOpen: false,
      currentTime: new Date().toISOString()
    }, { status: 500 });
  }
}
