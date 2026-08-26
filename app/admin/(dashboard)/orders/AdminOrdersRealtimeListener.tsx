'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Global realtime listener for the Order table.
 * Reloads the page whenever any order is INSERTed or UPDATEd.
 * Optionally filters by a single order id.
 */
export default function AdminOrdersRealtimeListener({ orderId }: { orderId?: string }) {
  useEffect(() => {
    let mounted = true;
    let retryTimer: NodeJS.Timeout | null = null;
    let currentChannel: RealtimeChannel | null = null;

    const connect = async () => {
      if (!mounted) return;

      try {
        const channelName = orderId ? `admin_order_${orderId}` : 'admin_orders_all';

        const config: Record<string, unknown> = {};
        if (orderId) {
          config.presence = { key: orderId };
        }

        let newChannel = supabase.channel(channelName, { config: config as never }).on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Order',
            ...(orderId ? { filter: `id=eq.${orderId}` } : {}),
          },
          () => {
            if (mounted) {
              window.location.reload();
            }
          }
        );

        newChannel = newChannel.subscribe((subscriptionStatus) => {
          if (mounted && (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT')) {
            if (!retryTimer) {
              retryTimer = setTimeout(() => {
                retryTimer = null;
                connect();
              }, 5000);
            }
          }
        });

        if (mounted) {
          currentChannel = newChannel;
        }
      } catch (err) {
        console.error('Failed to connect admin realtime:', err);
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
  }, [orderId]);

  return null;
}