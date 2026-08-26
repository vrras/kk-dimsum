'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { OrderUpdatePayload } from '@/lib/supabase';

interface OrderRealtimeListenerProps {
  orderId: string;
  onDataChange?: (payload: OrderUpdatePayload) => void;
}

export default function OrderRealtimeListener({ orderId, onDataChange }: OrderRealtimeListenerProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    let mounted = true;
    let retryTimer: NodeJS.Timeout | null = null;
    let currentChannel: RealtimeChannel | null = null;

    const connect = async () => {
      if (!mounted) return;

      try {
        const channelName = `order_${orderId}`;

        const newChannel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true },
              presence: { key: orderId },
            },
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'Order',
              filter: `id=eq.${orderId}`,
            },
            (payload: OrderUpdatePayload) => {
              if (onDataChange) {
                onDataChange(payload);
              }
              if (mounted) {
                window.location.reload();
              }
            }
          )
          .subscribe((subscriptionStatus) => {
            if (mounted) {
              if (subscriptionStatus === 'SUBSCRIBED') {
                setStatus('connected');
              } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
                setStatus('error');
                if (!retryTimer) {
                  retryTimer = setTimeout(() => {
                    retryTimer = null;
                    connect();
                  }, 5000);
                }
              }
            }
          });

        if (mounted) {
          currentChannel = newChannel;
        }
      } catch (err) {
        console.error('Failed to connect to Supabase Realtime:', err);
        if (mounted) {
          setStatus('error');
        }
      }
    };

    connect();

    return () => {
      mounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }
    };
  }, [orderId, onDataChange]);

  // Debug indicator (dev only)
  if (process.env.NODE_ENV === 'development' && status !== 'connecting') {
    const color = status === 'connected' ? '#22c55e' : '#ef4444';
    const text = status === 'connected' ? 'Realtime Connected' : 'Connection Error';

    return (
      <div style={{
        position: 'fixed' as const,
        bottom: 10,
        right: 10,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: color,
        color: 'white',
        zIndex: 9999,
      }}>
        {status === 'connected' ? '🟢' : '🔴'} {text}
      </div>
    );
  }

  return null;
}