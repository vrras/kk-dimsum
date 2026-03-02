'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { formatCurrency } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import MenuDetailModal from './MenuDetailModal';
import DOMPurify from 'isomorphic-dompurify';
import 'react-quill/dist/quill.snow.css';

interface MenuCardProps {
  menu: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    category?: { name: string } | null;
  };
  storeName: string;
}

export default function MenuCard({ menu, storeName }: MenuCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  let rawDesc = menu.description || 'Sajian dimsum lezat siap menemani.';
  
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(rawDesc);
  if (!hasHtmlTags) {
    rawDesc = rawDesc.replace(/\n/g, '<br />');
  }

  const sanitizedDescription = DOMPurify.sanitize(rawDesc);

  return (
    <>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: { xs: 4, sm: 5 },
          border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          bgcolor: 'white',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 20px 40px rgba(219, 39, 119, 0.12)'
          }
        }}
        onClick={() => setIsModalOpen(true)}
      >
        <Box sx={{ position: 'relative', pt: '65%', overflow: 'hidden' }}>
          {menu.imageUrl ? (
            <CardMedia
              component="img"
              image={menu.imageUrl}
              alt={menu.name}
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s ease',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
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
              <Typography color="primary.light" variant="button" fontWeight={900} sx={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {storeName.toUpperCase()}
              </Typography>
            </Box>
          )}
          
          {/* Price Label Overlay */}
          <Box sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            color: 'primary.main',
            px: 1.5,
            py: 0.5,
            borderRadius: 3,
            fontWeight: 800,
            fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            {formatCurrency(menu.price)}
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 800, lineHeight: 1.3, mb: 0.5, color: 'text.primary', fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              {menu.name}
            </Typography>
            
            {menu.category && (
              <Chip 
                label={menu.category.name} 
                size="small" 
                sx={{ 
                  mb: 1.5, 
                  bgcolor: '#fdf2f8', 
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  height: 20,
                  border: '1px solid #fbcfe8'
                }} 
              />
            )}
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              component="div"
              className="ql-editor"
              sx={{ 
                padding: 0, // Reset default ql-editor padding
                overflow: 'hidden', 
                lineHeight: 1.5, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                maxHeight: '4.5em', // Mencegah teks overlap dengan tombol (kira-kira 3 baris)
                position: 'relative',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                '& p': { margin: 0 },
                '& ul, & ol': { mt: 0, mb: 0, pl: '1.2rem' },
                '& li': { mb: 0 }
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </Box>
          
          {/* Stop propagation so clicking button doesn't open modal */}
          <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }} onClick={(e) => e.stopPropagation()}>
            <AddToCartButton menu={menu} />
          </Box>
        </CardContent>
      </Card>

      <MenuDetailModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        menu={menu} 
      />
    </>
  );
}
