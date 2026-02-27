import { NextResponse } from 'next/server';
import { initWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Memastikan inisialisasi WA instance saat API ini diakses
    await initWhatsApp();
    
    return NextResponse.json({
      isReady: globalThis.waIsReady === true,
      qrCode: globalThis.waQrCode || null,
      message: globalThis.waIsReady ? 'WhatsApp client is ready' : (globalThis.waQrCode ? 'Scan QR Code' : 'Initializing / disconnected')
    });
  } catch (error) {
    console.error('API WA Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    let body = {};
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        // Ignore parsing errors
      }
    }
    
    // API manual trigger untuk mengirim pesan jika ada payload
    const bodyData = body as { phone?: string; message?: string };
    if (bodyData.phone && bodyData.message) {
      const { sendMessage } = await import('@/lib/whatsapp');
      const success = await sendMessage(bodyData.phone, bodyData.message);
      return NextResponse.json({ success, message: success ? 'Message sent' : 'Failed to send message' });
    }

    // API manual trigger untuk init ulang jika stack atau gagal
    if (!globalThis.waIsReady) {
      await initWhatsApp();
      return NextResponse.json({ message: 'Initialization triggered' });
    }
    return NextResponse.json({ message: 'WhatsApp already ready' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
