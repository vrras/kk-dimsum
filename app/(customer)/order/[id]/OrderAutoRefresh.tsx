'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AutoRefreshProps {
  intervalMs?: number;
}

/**
 * Auto-refresh halaman order setiap interval tertentu.
 * Berguna untuk memperbarui status order secara real-time
 * tanpa perlu user melakukan refresh manual.
 */
export default function OrderAutoRefresh({ intervalMs = 60000 }: AutoRefreshProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Tampilkan indikator refreshing sebentar
      setVisible(true);
      router.refresh();

      // Hilangkan indikator setelah delay kecil
      setTimeout(() => setVisible(false), 1500);
    }, intervalMs);

    // Cleanup saat komponen di-unmount
    return () => clearInterval(intervalId);
  }, [router, intervalMs]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      Memperbarui status pesanan...
    </div>
  );
}