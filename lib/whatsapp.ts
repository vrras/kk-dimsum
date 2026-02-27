import { Client, LocalAuth } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const waClientSingleton = () => {
  const dataPath = path.join(process.cwd(), '.wwebjs_auth');

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'kk-dimsum-admin',
      dataPath: dataPath
    }),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: true,
      // User Agent is critical to avoid "Can't link device" errors on Linux
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });

  return client;
}

declare global {
  /* eslint-disable no-var */
  var waClientGlobal: undefined | ReturnType<typeof waClientSingleton>
  var waQrCode: string | undefined
  var waIsReady: boolean
  var waIsInitializing: boolean
  var waListenersAttached: boolean
  var waHasTriedCleanup: boolean
  /* eslint-enable no-var */
}

export const waClient = globalThis.waClientGlobal ?? waClientSingleton();
globalThis.waClientGlobal = waClient; // Always store in globalThis
globalThis.waIsReady = globalThis.waIsReady ?? false;
globalThis.waQrCode = globalThis.waQrCode ?? undefined;
globalThis.waIsInitializing = globalThis.waIsInitializing ?? false;
globalThis.waListenersAttached = globalThis.waListenersAttached ?? false;
globalThis.waHasTriedCleanup = globalThis.waHasTriedCleanup ?? false;

export const initWhatsApp = async () => {
  if (globalThis.waIsReady || globalThis.waIsInitializing) return;
  
  globalThis.waIsInitializing = true;
  
  // Attach listeners only once
  if (!globalThis.waListenersAttached) {
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
      
      // Automatically try to re-initialize using the guarded function
      setTimeout(() => {
        initWhatsApp().catch(console.error);
      }, 5000);
    });

    globalThis.waListenersAttached = true;
  }

  console.log('🔄 Initializing WhatsApp Client...');
  
  // --- START CLEANUP ---
  // Hanya lakukan cleanup pkill SEKALI saja saat aplikasi pertama kali jalan (cold start)
  // Agar tidak membunuh process yang sedang inisialisasi / sudah jalan
  if (!globalThis.waHasTriedCleanup) {
    const sessionId = 'kk-dimsum-admin';
    
    console.log('🧹 Cleaning up stale sessions for first start...');
    // 1. Kill any ghost processes first so they release the lock
    try {
        execSync(`pkill -f "session-${sessionId}"`);
        console.log(`✅ Killed ghost processes for session-${sessionId}`);
    } catch { /* No process found, that's fine */ }

    // 2. Delete ALL lock files recursively
    try {
      const authDir = path.join(process.cwd(), '.wwebjs_auth');
      if (fs.existsSync(authDir)) {
        const deleteSingletonFiles = (dir: string) => {
          const files = fs.readdirSync(dir, { withFileTypes: true });
          for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
              deleteSingletonFiles(fullPath);
            } else if (file.name.toLowerCase().startsWith('singleton')) {
              try {
                fs.unlinkSync(fullPath);
                console.log(`✅ Deleted lock file: ${fullPath}`);
              } catch (err) {
                console.error(`❌ Could not delete ${fullPath}:`, (err as Error).message);
              }
            }
          }
        };
        deleteSingletonFiles(authDir);
      }
    } catch (err) {
      console.error('❌ Error during recursive lock cleanup:', (err as Error).message);
    }
    
    globalThis.waHasTriedCleanup = true;
  }
  // --- END CLEANUP ---

  try {
    await waClient.initialize();
  } catch (error) {
    console.error('Gagal inisialisasi WhatsApp:', error);
  } finally {
    globalThis.waIsInitializing = false;
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

// -------------------------------------------------------
// Graceful Shutdown: tutup Chrome dengan bersih saat
// PM2 stop/restart agar SingletonLock tidak tertinggal
// -------------------------------------------------------
const handleShutdown = async (signal: string) => {
  console.log(`⚙️ Menangkap sinyal ${signal}. Menutup WhatsApp Client...`);
  try {
    if (globalThis.waIsReady || globalThis.waIsInitializing) {
      await waClient.destroy();
      console.log('✅ WhatsApp Client berhasil ditutup.');
    }
  } catch (err) {
    console.error('❌ Gagal menutup WhatsApp Client secara bersih:', err);
  } finally {
    globalThis.waIsReady = false;
    globalThis.waIsInitializing = false;
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
