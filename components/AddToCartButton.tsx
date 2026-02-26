'use client';

import { useCart } from './CartProvider';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Fab from '@mui/material/Fab';
import Link from 'next/link';

export function AddToCartButton({ menu }: { menu: { id: string, name: string, price: number } }) {
  const { items, addItem, updateQuantity, isStoreOpen } = useCart();
  
  // If store is closed, show disabled button
  if (!isStoreOpen) {
    return (
      <Button 
        fullWidth
        disabled
        variant="contained"
        sx={{ 
          borderRadius: { xs: 2, sm: 3 },
          py: { xs: 0.5, sm: 1 },
          textTransform: 'none',
          fontWeight: 700,
          fontSize: { xs: '0.8rem', sm: '1rem' },
          bgcolor: 'action.disabledBackground',
          p: { xs: 0.5, sm: 1 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <span>Tutup</span>
        </Box>
      </Button>
    );
  }

  const cartItem = items.find(i => i.menuId === menu.id);
  
  if (cartItem) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%', 
        bgcolor: 'secondary.light', 
        p: { xs: 0.25, sm: 0.5 }, 
        borderRadius: { xs: 2, sm: 2 }, 
        border: '1px solid',
        borderColor: 'primary.light'
      }}>
        <IconButton 
          size="small"
          onClick={() => updateQuantity(menu.id, cartItem.quantity - 1)}
          sx={{ 
            bgcolor: '#ffffff', 
            color: 'primary.main',
            boxShadow: 1,
            p: { xs: 0.5, sm: 1 },
            '&:hover': { bgcolor: 'primary.light' }
          }}
        >
          <Minus size={16} />
        </IconButton>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.1rem' }, color: 'primary.main' }}>
          {cartItem.quantity}
        </Typography>
        <IconButton 
          size="small"
          onClick={() => updateQuantity(menu.id, cartItem.quantity + 1)}
          sx={{ 
            bgcolor: '#ffffff', 
            color: 'primary.main',
            boxShadow: 1,
            p: { xs: 0.5, sm: 1 },
            '&:hover': { bgcolor: 'primary.light' }
          }}
        >
          <Plus size={16} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Button 
      fullWidth
      variant="contained"
      color="primary"
      onClick={() => addItem({ menuId: menu.id, name: menu.name, price: menu.price })}
      sx={{ 
        borderRadius: { xs: 2, sm: 3 },
        py: { xs: 0.5, sm: 1 },
        textTransform: 'none',
        fontWeight: 700,
        fontSize: { xs: '0.8rem', sm: '1rem' },
        boxShadow: '0 4px 14px 0 rgba(219, 39, 119, 0.39)',
        p: { xs: 0.5, sm: 1 }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
        <ShoppingCart size={16} />
        <span>Tambah</span>
      </Box>
    </Button>
  );
}

export function FloatingCart() {
  const { totalItems } = useCart();
  
  if (totalItems === 0) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      bottom: { xs: 24, sm: 24 }, 
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1100, // Higher than most elements
      width: 'max-content',
    }}>
      <Badge 
        badgeContent={totalItems} 
        color="secondary"
        sx={{ 
          '& .MuiBadge-badge': { 
            right: { xs: 10, sm: 15 }, 
            top: { xs: 10, sm: 15 }, 
            border: `2px solid #fff`, 
            padding: '0 4px',
            fontWeight: 'bold' 
          } 
        }}
      >
        <Fab
          variant="extended"
          color="primary"
          component={Link}
          href="/cart"
          sx={{ 
            px: { xs: 3, sm: 4 },
            height: { xs: 48, sm: 60 },
            boxShadow: '0 8px 32px rgba(219, 39, 119, 0.4)',
            textTransform: 'none',
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 800,
            whiteSpace: 'nowrap',
            minWidth: 'max-content',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            // Fix for the translate transform
            '@keyframes pop': {
               '0%': { transform: 'scale(1)' },
               '50%': { transform: 'scale(1.1)' },
               '100%': { transform: 'scale(1)' }
            }
          }}
        >
          <ShoppingCart style={{ marginRight: 8 }} /> Lihat Keranjang
        </Fab>
      </Badge>
    </Box>
  );
}
