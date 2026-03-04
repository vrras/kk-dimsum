'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/components/CartProvider';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Tag, User, Phone, CreditCard, Wallet, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Jika cart kosong redirect ke depan
  useEffect(() => {
    if (mounted && totalItems === 0 && !isSubmitting) {
      router.push('/');
    }
  }, [totalItems, router, mounted, isSubmitting]);

  if (!mounted || totalItems === 0) return null;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setIsCheckingPromo(true);
    setPromoMessage('');
    
    try {
      const res = await fetch('/api/promo/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      
      if (res.ok) {
        const data = await res.json();
        setDiscount(data.discount);
        setPromoMessage('Kode promo berhasil diterapkan!');
      } else {
        const err = await res.json();
        setDiscount(0);
        setPromoMessage(err.error || 'Kode promo tidak valid');
      }
    } catch {
      setPromoMessage('Gagal mengecek promo');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setDiscount(0);
    setPromoMessage('');
  };

  const finalPrice = Math.max(0, totalPrice - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        paymentMethod,
        promoCode: discount > 0 ? promoCode : undefined,
        items: items.map(i => ({ menuId: i.menuId, quantity: i.quantity }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memproses pesanan');
      }

      const orderData = await res.json();
      
      // Kosongkan cart lalu arahkan ke halaman detail order.
      clearCart();
      router.push(`/order/${orderData.id}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memproses pesanan';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton 
          component={Link} 
          href="/cart" 
          sx={{ 
            bgcolor: '#ffffff', 
            color: 'primary.main', 
            boxShadow: 1,
            '&:hover': { bgcolor: 'secondary.light' }
          }}
        >
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 900, color: 'primary.dark' }}>
          Checkout
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container rowSpacing={4} columnSpacing={{ xs: 0, md: 4 }}>
          {/* Kolom Kiri - Formulir */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={4}>
              {/* Informasi Pengiriman */}
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={20} /> Informasi Pengiriman
                </Typography>
                
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5 }}>
                    <TextField
                      fullWidth
                      label="Nama Lengkap"
                      name="name"
                      required
                      placeholder="Masukkan nama Anda"
                      value={formData.name}
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Nomor WhatsApp"
                      name="whatsapp"
                      required
                      placeholder="081234567890"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone size={18} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Kami akan mengirimkan notifikasi"
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="Alamat Lengkap"
                    name="address"
                    required
                    multiline
                    rows={3}
                    placeholder="Nama jalan, RT/RW, Patokan (Maksimal radius 10km)"
                    value={formData.address}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="Catatan Pesanan (Opsional)"
                    name="notes"
                    multiline
                    rows={2}
                    placeholder="Contoh: Saus dimsum dipisah, jangan terlalu pedas"
                    value={formData.notes}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Stack>
              </Paper>

              {/* Metode Pembayaran */}
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCard size={20} /> Metode Pembayaran
                </Typography>
                
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'TRANSFER')}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          border: '2px solid', 
                          borderColor: paymentMethod === 'TRANSFER' ? 'primary.main' : 'divider',
                          borderRadius: 3,
                          bgcolor: paymentMethod === 'TRANSFER' ? 'secondary.light' : 'transparent',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPaymentMethod('TRANSFER')}
                      >
                        <FormControlLabel 
                          value="TRANSFER" 
                          control={<Radio size="small" />} 
                          label={
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CreditCard size={20} /> 
                              <Box>
                                <Typography sx={{ fontWeight: 800 }}>Transfer Bank</Typography>
                                <Typography variant="caption" color="text.secondary">Verifikasi manual by Admin</Typography>
                              </Box>
                            </Box>
                          } 
                          sx={{ m: 0, width: '100%', alignItems: 'center' }}
                        />
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          border: '2px solid', 
                          borderColor: paymentMethod === 'CASH' ? 'primary.main' : 'divider',
                          borderRadius: 3,
                          bgcolor: paymentMethod === 'CASH' ? 'secondary.light' : 'transparent',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPaymentMethod('CASH')}
                      >
                        <FormControlLabel 
                          value="CASH" 
                          control={<Radio size="small" />} 
                          label={
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Wallet size={20} /> 
                              <Box>
                                <Typography sx={{ fontWeight: 800 }}>Bayar Tunai (COD)</Typography>
                                <Typography variant="caption" color="text.secondary">Bayar langsung ke kurir</Typography>
                              </Box>
                            </Box>
                          } 
                          sx={{ m: 0, width: '100%', alignItems: 'center' }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                </RadioGroup>
              </Paper>
            </Stack>
          </Grid>

          {/* Kolom Kanan - Ringkasan */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3} sx={{ position: 'sticky', top: '2rem' }}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingBag size={20} /> Ringkasan Pesanan
                </Typography>
                
                <Stack spacing={2} sx={{ mb: 3, maxHeight: '30vh', overflowY: 'auto', pr: 1 }}>
                  {items.map(item => (
                    <Box key={item.menuId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          <Box component="span" sx={{ color: 'primary.main', mr: 1 }}>{item.quantity}x</Box>
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

                {/* Promo Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Kode Promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={discount > 0}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Tag size={16} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    {discount > 0 ? (
                      <Button 
                        variant="contained" 
                        color="error"
                        onClick={handleRemovePromo}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        Batal
                      </Button>
                    ) : (
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={handleApplyPromo}
                        disabled={isCheckingPromo || !promoCode}
                        sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
                      >
                        {isCheckingPromo ? <CircularProgress size={20} color="inherit" /> : 'Pakai'}
                      </Button>
                    )}
                  </Box>
                  {promoMessage && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 1, 
                        display: 'block', 
                        color: discount > 0 ? 'success.main' : 'error.main',
                        fontWeight: 600
                      }}
                    >
                      {promoMessage}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

                <Stack spacing={1.5} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal Barang</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(totalPrice)}</Typography>
                  </Box>
                  {discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main">Diskon Promo</Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>-{formatCurrency(discount)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ pt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Total Tagihan</Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900 }}>
                      {formatCurrency(finalPrice)}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
                  sx={{ 
                    borderRadius: 3, 
                    py: 1.5, 
                    fontWeight: 900, 
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 16px rgba(219, 39, 119, 0.25)'
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle2 size={24} /> Buat Pesanan Sekarang
                    </Box>
                  )}
                </Button>
                
                <Typography variant="caption" component="p" sx={{ mt: 2, textAlign: 'center', opacity: 0.7 }}>
                  *Dengan menekan tombol di atas, Anda menyetujui pesanan ini.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </form>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', fontWeight: 'bold' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
