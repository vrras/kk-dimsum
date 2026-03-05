import fs from 'fs';
import path from 'path';

const WORKER_URL = process.env.CONNEKTHUB_URL || 'http://localhost:3001';

declare global {
  /* eslint-disable no-var */
  var chIsReady: boolean;
  var chQrCode: string | undefined;
  var chIsInitializing: boolean;
  /* eslint-enable no-var */
}

interface ConnektHubSession {
  sessionId: string;
  status: string;
  isReady: boolean;
  lastQR?: string;
  phoneNumber?: string;
}

// Global state will be updated via sync
globalThis.chIsReady = globalThis.chIsReady ?? false;
globalThis.chQrCode = globalThis.chQrCode ?? undefined;
globalThis.chIsInitializing = globalThis.chIsInitializing ?? false;

/**
 * Sinkronisasi status dari Worker ke internal state Next.js
 */
export const syncConnektHubStatus = async () => {
  try {
    const res = await fetch(`${WORKER_URL}/status`, { 
      cache: 'no-store',
      headers: {
        'x-api-key': process.env.CONNEKTHUB_API_KEY || ''
      }
    });
    if (!res.ok) throw new Error('Worker offline');
    
    const data = await res.json();
    
    // ConnektHub returns an array of sessions. We'll use the 'default' session for global status if available.
    // Or just check if any session is ready.
    const sessions = data.sessions || [] as ConnektHubSession[];
    const defaultSession = sessions.find((s: ConnektHubSession) => s.sessionId === 'default') || sessions[0];
    
    globalThis.chIsReady = sessions.some((s: ConnektHubSession) => s.isReady);
    globalThis.chQrCode = defaultSession?.lastQR || undefined; // Assuming the worker might change this key
    globalThis.chIsInitializing = sessions.some((s: ConnektHubSession) => s.status === 'INITIALIZING');
    
    return data;
  } catch (err) {
    console.error('❌ Failed to sync with ConnektHub:', (err as Error).message);
    globalThis.chIsReady = false;
    globalThis.chIsInitializing = false;
    return null;
  }
};;

export const initConnektHub = async () => {
  try {
    await fetch(`${WORKER_URL}/initialize`, { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.CONNEKTHUB_API_KEY || ''
      },
      body: JSON.stringify({ sessionId: 'default' })
    });
    return await syncConnektHubStatus();
  } catch (err) {
    console.error('❌ Failed to trigger ConnektHub init:', (err as Error).message);
  }
};;

export const formatPhoneForCH = (phone: string) => {
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1);
  } else if (!formatted.startsWith('62')) {
    formatted = '62' + formatted;
  }
  return formatted;
};

interface SendMessageOptions {
  delayMs?: number;
}

export const sendMessage = async (phone: string, message: string, options?: SendMessageOptions) => {
  try {
    const formattedPhone = formatPhoneForCH(phone);
    
    const res = await fetch(`${WORKER_URL}/send-message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.CONNEKTHUB_API_KEY || ''
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        message,
        ...(options?.delayMs !== undefined ? { delayMs: options.delayMs } : {}),
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send message via ConnektHub');
    }

    console.log(`✅ Message added to ConnektHub queue for ${formattedPhone}`);
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
