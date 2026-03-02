'use client';

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import Chip from '@mui/material/Chip';
import DOMPurify from 'isomorphic-dompurify';
import 'react-quill/dist/quill.snow.css';

interface MenuDetailModalProps {
  open: boolean;
  onClose: () => void;
  menu: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    category?: { name: string } | null;
  } | null;
}

export default function MenuDetailModal({ open, onClose, menu }: MenuDetailModalProps) {
  if (!menu) return null;

  // Render deskripsi aman dari XSS, dan support untuk data plain text lama
  let rawDesc = menu.description || 'Sajian dimsum lezat siap menemani.';
  
  // Jika deskripsi tidak mengandung tag HTML, berarti ini plain text lama,
  // maka kita ubah newline (\n) menjadi <br /> agar ter-render ke baris baru.
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(rawDesc);
  if (!hasHtmlTags) {
    rawDesc = rawDesc.replace(/\n/g, '<br />');
  }

  const sanitizedDescription = DOMPurify.sanitize(rawDesc);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { 
          borderRadius: { xs: 4, sm: 6 }, 
          m: { xs: 1.5, sm: 2 }, 
          maxHeight: { xs: '90vh', sm: '85vh' },
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
          }}
        >
          <X size={20} />
        </IconButton>

        <Box sx={{ position: 'relative', pt: '65%', overflow: 'hidden', flexShrink: 0 }}>
          {menu.imageUrl ? (
            <Box
              component="img"
              src={menu.imageUrl}
              alt={menu.name}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="h5" color="primary.light" fontWeight={900} sx={{ opacity: 0.5, letterSpacing: 2 }}>
                KK DIMSUM
              </Typography>
            </Box>
          )}
        </Box>

        <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, overflowY: 'auto' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 900, mb: 1, color: 'text.primary', lineHeight: 1.2 }}>
              {menu.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 900 }}>
                {formatCurrency(menu.price)}
              </Typography>
              {menu.category && (
                <Chip 
                  label={menu.category.name} 
                  size="small"
                  sx={{ 
                    bgcolor: '#fdf2f8', 
                    color: 'primary.main', 
                    fontWeight: 700,
                    border: '1px solid #fbcfe8'
                  }}
                />
              )}
            </Box>

            <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 800, mb: 1, display: 'block' }}>
              Deskripsi Menu
            </Typography>
            
            <Box 
              className="ql-editor"
              sx={{ 
                color: 'text.secondary', 
                lineHeight: 1.7,
                fontSize: '0.95rem',
                padding: 0, // Reset default ql-editor padding
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </Box>
        </DialogContent>

        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
          <AddToCartButton menu={menu} />
        </Box>
      </Box>
    </Dialog>
  );
}
