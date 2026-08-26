'use client';

import OrderRealtimeListener from './OrderRealtimeListener';
import type { OrderUpdatePayload } from '@/lib/supabase';

interface OrderPageClientProps {
  orderId: string;
}

export default function OrderPageClient({ orderId }: OrderPageClientProps) {
  const handleOrderUpdate = (payload: OrderUpdatePayload) => {
    console.log('Order updated via Realtime:', payload);
    // Additional logic if needed (e.g., show toast notification)
  };

  return <OrderRealtimeListener orderId={orderId} onDataChange={handleOrderUpdate} />;
}