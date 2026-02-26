import { Client, LocalAuth } from 'whatsapp-web.js';
import fs from 'fs';

const waClientSingleton = () => {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'kk-dimsum-admin',
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    }
  });

  return client;
}

declare global {
  /* eslint-disable no-var */
  var waClientGlobal: undefined | ReturnType<typeof waClientSingleton>
  var waQrCode: string | undefined
  var waIsReady: boolean
  /* eslint-enable no-var */
}

export const waClient = globalThis.waClientGlobal ?? waClientSingleton();
globalThis.waIsReady = globalThis.waIsReady ?? false;
globalThis.waQrCode = globalThis.waQrCode ?? undefined;

if (process.env.NODE_ENV !== 'production') {
  globalThis.waClientGlobal = waClient;
}

// Hanya inisialisasi jika belum pernah atau sedang tidak berjalan
let isInitializing = false;

export const initWhatsApp = async () => {
  if (globalThis.waIsReady || isInitializing) return;
  
  isInitializing = true;
  console.log('🔄 Initializing WhatsApp Client...');

  waClient.on('qr', (qr) => {
    console.log('📌 QR RECEIVED');
    globalThis.waQrCode = qr;
    globalThis.waIsReady = false;
  });

  waClient.on('ready', () => {
    console.log('✅ WhatsApp Client is Ready!');
    globalThis.waIsReady = true;
    globalThis.waQrCode = undefined;
  });

  waClient.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated!');
  });

  waClient.on('auth_failure', () => {
    console.error('❌ WhatsApp Auth Failure!');
    globalThis.waIsReady = false;
    globalThis.waQrCode = undefined;
  });

  waClient.on('disconnected', () => {
    console.error('❌ WhatsApp Disconnected!');
    globalThis.waIsReady = false;
    globalThis.waQrCode = undefined;
    
    // Automatically try to re-initialize
    setTimeout(() => {
      waClient.initialize().catch(console.error);
    }, 5000);
  });

  try {
    await waClient.initialize();
  } catch (error) {
    console.error('Gagal inisialisasi WhatsApp:', error);
  } finally {
    isInitializing = false;
  }
};

export const formatPhoneForWA = (phone: string) => {
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1);
  }
  return formatted + '@c.us';
};

export const sendMessage = async (phone: string, message: string) => {
  try {
    if (!globalThis.waIsReady) {
      console.error('⚠️ WhatsApp is not ready. Message not sent.');
      return false;
    }
    const waId = formatPhoneForWA(phone);
    
    // Fallback: check if the number is registered to avoid "No LID for user" crash
    const numberId = await waClient.getNumberId(waId);
    if (!numberId) {
      console.error(`❌ Number ${phone} is not registered on WhatsApp.`);
      return false;
    }

    await waClient.sendMessage(numberId._serialized, message);
    return true;
  } catch (error: unknown) {
    console.error('❌ Failed to send WhatsApp message:', error);
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      fs.writeFileSync('/tmp/wa-error.log', errorMessage + '\n' + (errorStack || ''));
    } catch {}
    return false;
  }
};
