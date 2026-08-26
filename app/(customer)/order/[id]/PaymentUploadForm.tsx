'use client';

import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { uploadPaymentProofAction } from '@/lib/upload-actions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

export default function PaymentUploadForm({ orderId, existingProof, paymentStatus }: { orderId: string, existingProof: string | null, paymentStatus: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(!!existingProof && paymentStatus !== 'REJECTED');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      
      // Validasi file (Maks 10MB sesuai config)
      if (selected.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        setFile(null);
        return;
      }
      
      // Validasi tipe gambar
      if (!selected.type.startsWith('image/')) {
        setError('Format file harus berupa gambar (JPG, PNG)');
        setFile(null);
        return;
      }

      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use Server Action instead of Route Handler
      const result = await uploadPaymentProofAction(orderId, formData);

      if (!result.success) {
        throw new Error(result.error || 'Gagal mengunggah bukti pembayaran');
      }

      setSuccess(true);
      setFile(null);
      router.refresh();
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengunggah bukti pembayaran';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (success && !file) {
    return (
      <Alert
        severity="success"
        icon={<CheckCircle2 size={24} />}
        sx={{
          borderRadius: 3,
          bgcolor: '#f0fdf4',
          border: '1px solid',
          borderColor: 'success.light',
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Bukti Pembayaran Tersimpan</Typography>
        <Typography variant="caption">Menunggu verifikasi admin kami.</Typography>
      </Alert>
    );
  }

  // Jika sudah ada bukti dan status bukan REJECTED, tampilkan alert sukses
  // (Ini menangani kasus saat halaman refresh setelah upload)
  if (existingProof && paymentStatus !== 'REJECTED') {
    return (
      <Alert
        severity="success"
        icon={<CheckCircle2 size={24} />}
        sx={{
          borderRadius: 3,
          bgcolor: '#f0fdf4',
          border: '1px solid',
          borderColor: 'success.light',
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Bukti Pembayaran Tersimpan</Typography>
        <Typography variant="caption">Menunggu verifikasi admin kami.</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, border: '2px dashed', borderColor: 'primary.light', borderRadius: 4, textAlign: 'center', bgcolor: 'white' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'primary.dark' }}>
        Unggah Bukti Transfer
      </Typography>

      {error && (
        <Alert severity="error" icon={<AlertCircle size={18} />} sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}

      <input 
        type="file" 
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="payment-proof"
      />
      
      <Stack spacing={2}>
        <Button
          component="label"
          htmlFor="payment-proof"
          variant="outlined"
          fullWidth
          startIcon={<UploadCloud size={18} />}
          sx={{ 
            borderRadius: 3, 
            py: 1.5, 
            borderStyle: 'dashed',
            textTransform: 'none',
            fontWeight: 700,
            color: file ? 'success.main' : 'primary.main',
            borderColor: file ? 'success.light' : 'primary.light',
            '&:hover': {
              borderColor: file ? 'success.main' : 'primary.main',
              bgcolor: 'secondary.light'
            }
          }}
        >
          {file ? `Pilihan: ${file.name}` : 'Pilih File Bukti Bayar'}
        </Button>

        {file && (
          <Button 
            onClick={handleUpload}
            disabled={isUploading || success}
            variant="contained"
            fullWidth
            sx={{ 
              borderRadius: 3, 
              py: 1.5, 
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(219, 39, 119, 0.2)'
            }}
          >
            {isUploading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} color="inherit" />
                <Typography variant="body2" sx={{ fontWeight: 800 }}>Mengunggah...</Typography>
              </Stack>
            ) : (
              'Unggah Sekarang'
            )}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
