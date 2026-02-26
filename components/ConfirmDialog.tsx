'use client';

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  confirmColor = 'primary',
  isLoading = false
}: ConfirmDialogProps) {
  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          bgcolor: confirmColor === 'error' ? '#fef2f2' : (confirmColor === 'warning' ? '#fffbeb' : '#f0f9ff'), 
          p: 1, 
          borderRadius: '50%' 
        }}>
          <AlertTriangle 
            size={24} 
            color={
              confirmColor === 'error' ? '#dc2626' : (confirmColor === 'warning' ? '#f59e0b' : '#0284c7')
            } 
          />
        </Box>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onCancel} 
          color="inherit"
          variant="text"
          sx={{ fontWeight: 700, borderRadius: 2 }}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={confirmColor} 
          variant="contained"
          sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
          autoFocus
          disabled={isLoading}
        >
          {isLoading ? 'Memproses...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
