import fs from 'fs';
import path from 'path';

const WORKER_URL = process.env.BAILEYS_URL || 'http://wa-baileys:3001';

declare global {
  /* eslint-disable no-var */
  var baileysIsReady: boolean;
  var baileysQrCode: string | undefined;
  var baileysIsInitializing: boolean;
  /* eslint-enable no-var */
}

interface BaileysSession {
  sessionId: string;
  status: string;
  isReady: boolean;
  lastQR?: string;
  phoneNumber?: string;
}

// Global state will be updated via sync
globalThis.baileysIsReady = globalThis.baileysIsReady ?? false;
globalThis.baileysQrCode = globalThis.baileysQrCode ?? undefined;
globalThis.baileysIsInitializing = globalThis.baileysIsInitializing ?? false;

/**
 * Sinkronisasi status dari Worker ke internal state Next.js
 */
export const syncBaileysStatus = async () => {
  try {
    const res = await fetch(`${WORKER_URL}/status`, { 
      cache: 'no-store',
      headers: {
        'x-api-key': process.env.BAILEYS_API_KEY || ''
      }
    });
    if (!res.ok) throw new Error('Worker offline');
    
    const data = await res.json();
    
    // Baileys returns an array of sessions. We'll use the 'default' session for global status if available.
    // Or just check if any session is ready.
    const sessions = data.sessions || [] as BaileysSession[];
    const defaultSession = sessions.find((s: BaileysSession) => s.sessionId === 'default') || sessions[0];
    
    globalThis.baileysIsReady = sessions.some((s: BaileysSession) => s.isReady);
    globalThis.baileysQrCode = defaultSession?.lastQR || undefined; // Assuming the worker might change this key
    globalThis.baileysIsInitializing = sessions.some((s: BaileysSession) => s.status === 'INITIALIZING');
    
    return data;
  } catch (err) {
    console.error('❌ Failed to sync with Baileys:', (err as Error).message);
    globalThis.baileysIsReady = false;
    globalThis.baileysIsInitializing = false;
    return null;
  }
};;

export const initBaileys = async () => {
  try {
    await fetch(`${WORKER_URL}/initialize`, { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.BAILEYS_API_KEY || ''
      },
      body: JSON.stringify({ sessionId: 'default' })
    });
    return await syncBaileysStatus();
  } catch (err) {
    console.error('❌ Failed to trigger Baileys init:', (err as Error).message);
  }
};;

export const formatPhoneForBaileys = (phone: string) => {
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1);
  } else if (!formatted.startsWith('62')) {
    formatted = '62' + formatted;
  }
  return formatted;
};

export const sendMessage = async (phone: string, message: string) => {
  try {
    const formattedPhone = formatPhoneForBaileys(phone);
    
    const res = await fetch(`${WORKER_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.BAILEYS_API_KEY || ''
      },
      body: JSON.stringify({
        to: formattedPhone,
        text: message,
      }),
      cache: 'no-store'
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send message via wa-baileys');
    }

    console.log(`✅ Message sent via wa-baileys for ${formattedPhone}`);
    return true;
  } catch (err) {
    console.error('❌ Error sending message:', (err as Error).message);
    
    // Log to file for debugging
    try {
        const logMessage = `[${new Date().toISOString()}] To: ${phone}, Error: ${(err as Error).message}\n`;
        fs.appendFileSync(path.join(process.cwd(), 'wa-errors.log'), logMessage);
    } catch { /* ignore log error */ }
    
    return false;
  }
};;
