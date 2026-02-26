'use client';

import { useCart } from '@/components/CartProvider';
import { formatCurrency } from '@/lib/utils';
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import StoreStatusBanner from '@/components/StoreStatusBanner';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, isStoreOpen } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton 
          component={Link} 
          href="/" 
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
          Keranjang
        </Typography>
      </Box>

      <StoreStatusBanner />

      {items.length === 0 ? (
        <Paper elevation={0} sx={{ 
          textAlign: 'center', 
          py: 10, 
          px: 3, 
          borderRadius: 4, 
          border: '2px dashed', 
          borderColor: 'primary.light',
          bgcolor: 'transparent'
        }}>
          <Box sx={{ color: 'primary.light', mb: 2 }}>
            <ShoppingCart size={80} strokeWidth={1.5} />
          </Box>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            Keranjang Anda masih kosong
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sepertinya Anda belum memilih jajanan apapun.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/"
            size="large"
            sx={{ borderRadius: 50, px: 4, py: 1.5, fontWeight: 700 }}
          >
            Lihat Menu Jajanan
          </Button>
        </Paper>
      ) : (
        <Grid container rowSpacing={4} columnSpacing={{ xs: 0, md: 4 }}>
          {/* Cart Items List */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              {items.map((item) => (
                <Paper key={item.menuId} elevation={0} sx={{ 
                  p: { xs: 2, sm: 2.5 }, 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: { xs: 2.5, sm: 2 },
                  width: '100%'
                }}>
                  {/* Left part: Name & Single Price */}
                  <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.1rem' }, lineHeight: 1.2, mb: 0.5, wordBreak: 'break-word', pr: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ color: 'primary.main', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                      {formatCurrency(item.price)} <Typography component="span" sx={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 500 }}>/ porsi</Typography>
                    </Typography>
                  </Box>
                  
                  {/* Right part: Subtotal & Controls */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: { xs: '100%', sm: 'auto' },
                    gap: { xs: 1.5, sm: 3 }
                  }}>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Quantity */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, sm: 1.5 }, 
                        bgcolor: '#fdf2f8', 
                        p: 0.5, 
                        borderRadius: 2,
                        border: '1px solid #fbcfe8'
                      }}>
                        <IconButton 
                          size="small"
                          disabled={!isStoreOpen}
                          onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                          sx={{ bgcolor: '#fff', boxShadow: '0 2px 4px rgba(236,72,153,0.1)', color: 'primary.main', width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 }, '&.Mui-disabled': { opacity: 0.5 } }}
                        >
                          <Minus size={14} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, minWidth: { xs: 20, sm: 24 }, textAlign: 'center', fontSize: { xs: '0.9rem', sm: '1rem' }, color: 'primary.dark' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton 
                          size="small"
                          disabled={!isStoreOpen}
                          onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                          sx={{ bgcolor: '#fff', boxShadow: '0 2px 4px rgba(236,72,153,0.1)', color: 'primary.main', width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 }, '&.Mui-disabled': { opacity: 0.5 } }}
                        >
                          <Plus size={14} />
                        </IconButton>
                      </Box>
                      
                      {/* Trash */}
                      <IconButton 
                        onClick={() => removeItem(item.menuId)}
                        sx={{ color: 'error.main', p: { xs: 0.5, sm: 1 }, ml: { xs: 0, sm: 0.5 }, '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}
                        size="small"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>

                    {/* Subtotal */}
                    <Typography sx={{ fontWeight: 900, textAlign: 'right', color: 'primary.dark', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>

                  </Box>
                </Paper>
              ))}
            </Stack>
          </Grid>

          {/* Cart Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 4, 
              position: 'sticky', 
              top: '2rem',
              bgcolor: 'primary.main',
              color: 'white',
              boxShadow: '0 8px 32px rgba(219, 39, 119, 0.25)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 900 }}>
                Ringkasan Pesanan
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ opacity: 0.8 }}>Total Item</Typography>
                <Typography sx={{ fontWeight: 700 }}>{totalItems} jajanan</Typography>
              </Box>
              
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h6">Total Harga</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {formatCurrency(totalPrice)}
                </Typography>
              </Box>

              {isStoreOpen ? (
                <Button 
                  component={Link} 
                  href="/checkout" 
                  variant="contained" 
                  fullWidth
                  size="large"
                  endIcon={<ArrowRight size={20} />}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    py: 1.5,
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'secondary.light',
                    }
                  }}
                >
                  Checkout
                </Button>
              ) : (
                <Button 
                  disabled
                  variant="contained" 
                  fullWidth
                  size="large"
                  sx={{ 
                    bgcolor: 'action.disabledBackground', 
                    color: 'action.disabled',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    py: 1.5,
                    borderRadius: 3
                  }}
                >
                  Toko Tutup
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
