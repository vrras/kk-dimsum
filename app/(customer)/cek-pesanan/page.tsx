'use client';

import { Search, PackageSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(searchQuery)}`);
      
      if (!res.ok) {
        throw new Error('Pesanan tidak ditemukan. Cek kembali Nomor Pesanan Anda.');
      }

      const data = await res.json();
      
      if (data && data.id) {
        router.push(`/order/${data.id}`);
      } else {
        throw new Error('Pesanan tidak ditemukan.');
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal melacak pesanan';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8, pb: 12 }}>
      <Paper elevation={0} sx={{ 
        p: { xs: 4, md: 6 }, 
        borderRadius: 4, 
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 12px 40px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ color: 'primary.main', mb: 3, display: 'flex', justifyContent: 'center' }}>
          <PackageSearch size={80} strokeWidth={1.5} />
        </Box>
        
        <Typography variant="h4" component="h1" sx={{ fontWeight: 900, color: 'primary.dark', mb: 2 }}>
          Lacak Pesanan
        </Typography>
        
        <Typography color="text.secondary" sx={{ mb: 4, px: 2 }}>
          Masukkan Nomor Pesanan untuk melihat detail dan status pesanan Anda saat ini.
        </Typography>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="CONTOH: KKD-20231025-0001"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="gray" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 3, 
                bgcolor: '#f8f9fa',
                fontWeight: 700,
                textAlign: 'center',
                '& input': { textAlign: 'center', letterSpacing: 1 }
              }
            }}
          />

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Button 
            type="submit" 
            variant="contained" 
            size="large"
            disabled={isLoading || !searchQuery}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Search size={22} />}
            sx={{ 
              borderRadius: 3, 
              py: 2, 
              fontWeight: 900, 
              fontSize: '1.1rem',
              boxShadow: '0 8px 20px rgba(219, 39, 119, 0.25)'
            }}
          >
            {isLoading ? 'Mencari...' : 'Lacak Sekarang'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
