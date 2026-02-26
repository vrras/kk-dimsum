'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { RefreshCw, QrCode as QrIcon, CheckCircle2, AlertCircle } from 'lucide-react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function WASetupPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [waSession, setWaSession] = useState<{ isReady: boolean; qrCode: string | null; message: string }>({
    isReady: false,
    qrCode: null,
    message: 'Checking...'
  });
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/wa-session');
      const data = await res.json();
      setWaSession(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reInit = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/wa-session', { method: 'POST' });
      await checkSession();
    } catch (err) {
      console.error(err);
    }
  };

  // Auto refresh tiap 3 detik jika belum ready
  useEffect(() => {
    checkSession();
    const interval = setInterval(() => {
      if (!waSession.isReady) {
        checkSession();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [waSession.isReady]);

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Card sx={{ borderRadius: 3, textAlign: 'center', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', py: 3, color: 'white' }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
            <QrIcon size={32} />
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>WhatsApp Notification Setup</Typography>
          </Stack>
        </Box>
        
        <CardContent sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Scan QR Code di bawah menggunakan aplikasi WhatsApp Anda (di menu <b>Perangkat Tertaut</b>) untuk mengaktifkan notifikasi otomatis bagi pelanggan dan admin.
          </Typography>

          {loading ? (
            <Box sx={{ py: 6 }}>
              <CircularProgress size={60} thickness={4} />
              <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>
                Memuat sesi WhatsApp...
              </Typography>
            </Box>
          ) : (
            <Box>
              {waSession.isReady ? (
                <Stack 
                  spacing={2} 
                  alignItems="center" 
                  sx={{ 
                    py: 6, 
                    px: 3, 
                    bgcolor: 'success.light', 
                    color: 'success.dark', 
                    borderRadius: 3,
                  }}
                >
                  <CheckCircle2 size={72} />
                  <Box>
                    <Typography variant="h5" fontWeight={800} gutterBottom>WhatsApp Terhubung!</Typography>
                    <Typography variant="body1">
                      Sistem sudah siap mengirimkan notifikasi invoice pesanan otomatis.
                    </Typography>
                  </Box>
                </Stack>
              ) : waSession.qrCode ? (
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 3, 
                    bgcolor: 'background.default',
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 4
                  }}
                >
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <QRCode value={waSession.qrCode} size={isMobile ? 200 : 256} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Scan QR Code</Typography>
                    <Typography variant="body2" color="text.secondary">
                      QR code akan berubah secara berkala.
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <Stack 
                  spacing={3} 
                  sx={{ 
                    p: 4, 
                    bgcolor: 'primary.light', 
                    color: 'primary.dark', 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <AlertCircle size={56} style={{ alignSelf: 'center' }} />
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Menginisialisasi Sistem...</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Jika proses ini memakan waktu terlalu lama, silakan tekan tombol di bawah.
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={reInit}
                    startIcon={<RefreshCw size={18} />}
                    sx={{ borderRadius: 2, bgcolor: 'white' }}
                  >
                    Inisialisasi Ulang
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
