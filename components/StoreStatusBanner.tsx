'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/components/CartProvider';

interface StoreStatus {
  isOpen: boolean;
  manualIsOpen: boolean;
  openHour: string;
  closeHour: string;
  closedDays: number[];
  currentTime: string;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function StoreStatusBanner({ variant = 'cart' }: { variant?: 'hero' | 'cart' }) {
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [realtime, setRealtime] = useState<Date | null>(null);
  const { setStoreOpen } = useCart();

  // Initial fetch
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/store/status', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // parse closedDays and current time
          const parsedClosedDays = typeof data.closedDays === 'string' ? JSON.parse(data.closedDays || '[]') : data.closedDays;
          
          setStatus({
            ...data,
            closedDays: parsedClosedDays
          });
          setStoreOpen(data.isOpen);

          // Initialize local realtime clock loosely based on server time
          if (data.currentTime) {
            setRealtime(new Date(data.currentTime));
          } else {
            setRealtime(new Date());
          }
        }
      } catch (e) {
        console.error("Failed to fetch store status", e);
      }
    };

    fetchStatus();
    
    // Refresh status from server every 5 minutes in case admin changes it
    const statusInterval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(statusInterval);
  }, [setStoreOpen]);

  // Tick local clock every second
  useEffect(() => {
    if (!realtime) return;

    const timer = setInterval(() => {
      setRealtime(prev => {
        if (!prev) return new Date();
        const newTime = new Date(prev.getTime() + 1000);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [realtime]);

  if (!status || !realtime) return null;

  const timeString = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta' // Force WIB
  }).format(realtime) + ' WIB';

  // Format closed days string nicely
  let closedDaysStr = '';
  if (status.closedDays && status.closedDays.length > 0) {
    if (status.closedDays.length === 7) {
      closedDaysStr = 'Tutup Tiap Hari';
    } else {
      closedDaysStr = 'Tutup setiap: ' + status.closedDays.map(d => dayNames[d]).join(', ');
    }
  }

  const isHero = variant === 'hero';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: { xs: 1, sm: 1.5 }, 
      justifyContent: isHero ? 'center' : 'flex-start',
      mb: isHero ? 4 : 3,
      mt: isHero ? 3 : 0,
    }}>
      {/* Status Badge */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        px: 2, 
        py: { xs: 0.75, sm: 1 }, 
        borderRadius: 50, 
        fontWeight: 800, 
        fontSize: { xs: '0.75rem', sm: '0.85rem' },
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        bgcolor: status.isOpen ? (isHero ? 'rgba(255, 255, 255, 0.95)' : '#dcfce7') : (isHero ? 'rgba(255, 255, 255, 0.95)' : '#fee2e2'),
        color: status.isOpen ? (isHero ? 'success.dark' : '#166534') : (isHero ? 'error.main' : '#991b1b'),
        boxShadow: isHero ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
      }}>
        {status.isOpen ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        {status.isOpen ? 'Toko Buka' : 'Toko Tutup'}
      </Box>

      {/* Schedule Badge */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        px: 2, 
        py: { xs: 0.75, sm: 1 }, 
        borderRadius: 50, 
        fontSize: { xs: '0.75rem', sm: '0.85rem' }, 
        fontWeight: 700, 
        bgcolor: isHero ? 'rgba(255,255,255,0.2)' : '#f3f4f6', 
        color: isHero ? 'white' : 'text.secondary',
        border: isHero ? '1px solid rgba(255,255,255,0.4)' : 'none',
        backdropFilter: isHero ? 'blur(8px)' : 'none'
      }}>
        <Clock size={16} />
        {status.openHour} - {status.closeHour} {closedDaysStr && ` | ${closedDaysStr}`}
      </Box>

      {/* Realtime Badge */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: 2, 
        py: { xs: 0.75, sm: 1 }, 
        borderRadius: 50, 
        fontSize: { xs: '0.75rem', sm: '0.85rem' }, 
        fontWeight: 800, 
        fontFamily: 'monospace',
        bgcolor: isHero ? 'rgba(0,0,0,0.15)' : '#f3f4f6', 
        color: isHero ? 'white' : 'text.primary',
        border: isHero ? '1px solid rgba(0,0,0,0.1)' : 'none'
      }}>
        {timeString}
      </Box>
    </Box>
  );
}
