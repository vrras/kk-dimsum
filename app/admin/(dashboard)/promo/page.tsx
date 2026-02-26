'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

type Promo = { id: number; code: string; discount: number; isActive: boolean; createdAt: string };

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ code: '', discount: '', isActive: true });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/promo');
      if (res.ok) {
        setPromos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleOpenModal = (promo?: Promo) => {
    if (promo) {
      setEditingId(promo.id);
      setFormData({
        code: promo.code,
        discount: promo.discount.toString(),
        isActive: promo.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ code: '', discount: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/admin/promo/${editingId}` : '/api/admin/promo';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Gagal menyimpan data');
      
      setSnackbar({ open: true, message: `Voucher berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`, severity: 'success' });
      await fetchPromos();
      handleCloseModal();
    } catch {
      setSnackbar({ open: true, message: 'Terjadi kesalahan saat menyimpan data promo.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/promo/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus promo');
      
      setSnackbar({ open: true, message: 'Voucher berhasil dihapus', severity: 'success' });
      await fetchPromos();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus promo';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
      setConfirmDelete({ open: false, id: null });
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary.dark" fontWeight={800}>
          Kelola Kode Promo
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Voucher Baru
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 2 }}>
        {isLoading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>Memuat data promo...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Kode Promo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nilai Diskon</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status Aktif</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dibuat Pada</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">Belum ada kode promo dibuat.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  promos.map(promo => (
                    <TableRow key={promo.id} hover>
                      <TableCell>
                        <Typography 
                          sx={{ 
                            fontWeight: 800, 
                            fontFamily: 'monospace', 
                            bgcolor: 'primary.light', 
                            color: 'primary.dark', 
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            letterSpacing: 1
                          }}
                        >
                          {promo.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} color="success.main">
                          - {formatCurrency(promo.discount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={promo.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          label={promo.isActive ? 'Aktif' : 'Nonaktif'}
                          color={promo.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                        {new Date(promo.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton onClick={() => handleOpenModal(promo)} size="small" color="primary">
                            <Edit size={18} />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(promo.id)} size="small" color="error">
                            <Trash2 size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Kode Promo' : 'Buat Voucher Promo'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={3}>
              <TextField 
                label="Kode Voucher" 
                fullWidth 
                required 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                placeholder="Contoh: DISKON10K"
                inputProps={{ style: { fontFamily: 'monospace', textTransform: 'uppercase' } }}
                helperText="Hanya gunakan huruf dan angka tanpa spasi."
              />

              <TextField 
                label="Nilai Potongan Harga (Rp)" 
                type="number" 
                fullWidth 
                required 
                value={formData.discount} 
                onChange={e => setFormData({...formData, discount: e.target.value})} 
                placeholder="Contoh: 10000" 
              />

              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    color="primary"
                  />
                }
                label="Tersedia & Bisa Digunakan"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Batal</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
            >
              Simpan
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        title="Hapus Promo"
        message="Apakah Anda yakin ingin menghapus kode promo ini secara permanen? Penggunaan promo yang sudah ada mungkin akan terpengaruh."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        confirmText="Hapus Sekarang"
        confirmColor="error"
        isLoading={isLoading}
      />

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
    </Box>
  );
}
