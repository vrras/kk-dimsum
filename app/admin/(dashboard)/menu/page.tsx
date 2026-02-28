'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
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
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

type Category = { id: number, name: string };
type Menu = { 
  id: string; name: string; description: string; price: number; 
  imageUrl: string | null; isAvailable: boolean; categoryId: string; 
  category: Category;
  _count?: { orderItems: number };
};

export default function AdminMenuPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', imageUrl: '', categoryId: '', isAvailable: true
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        fetch('/api/admin/menu'),
        fetch('/api/admin/categories')
      ]);
      setMenus(await menuRes.json());
      setCategories(await catRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (menu?: Menu) => {
    if (menu) {
      setEditingId(menu.id);
      setFormData({
        name: menu.name,
        description: menu.description || '',
        price: menu.price.toString(),
        imageUrl: menu.imageUrl || '',
        categoryId: menu.categoryId.toString(),
        isAvailable: menu.isAvailable
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', imageUrl: '', categoryId: categories[0]?.id.toString() || '', isAvailable: true });
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
      const url = editingId ? `/api/admin/menu/${editingId}` : '/api/admin/menu';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Gagal menyimpan data');
      
      setSnackbar({ open: true, message: `Menu berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`, severity: 'success' });
      await fetchData();
      handleCloseModal();
    } catch {
      setSnackbar({ open: true, message: 'Terjadi kesalahan saat menyimpan data menu.', severity: 'error' });
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
      const res = await fetch(`/api/admin/menu/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus menu');
      
      setSnackbar({ open: true, message: 'Menu berhasil dihapus', severity: 'success' });
      await fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus menu';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
      setConfirmDelete({ open: false, id: null });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setFormData({ ...formData, categoryId: newCat.id.toString() });
        setNewCategoryName('');
        setSnackbar({ open: true, message: 'Kategori berhasil ditambahkan', severity: 'success' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary.dark" fontWeight={800} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Kelola Menu & Kategori
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
          fullWidth={isMobile}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Tambah Menu
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 2 }}>
        {isLoading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>Memuat data...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nama Menu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Harga</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">Belum ada data menu.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  menus.map(menu => (
                    <TableRow key={menu.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{menu.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={menu.category?.name || '-'} 
                          size="small"
                          sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(menu.price)}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={menu.isAvailable ? <Check size={14} /> : <X size={14} />}
                          label={menu.isAvailable ? 'Tersedia' : 'Habis'}
                          color={menu.isAvailable ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton onClick={() => handleOpenModal(menu)} size="small" color="primary">
                            <Edit size={18} />
                          </IconButton>
                          {(!menu._count || menu._count.orderItems === 0) && (
                            <IconButton onClick={() => handleDelete(menu.id as unknown as number)} size="small" color="error">
                              <Trash2 size={18} />
                            </IconButton>
                          )}
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

      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Menu' : 'Tambah Menu Baru'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={3}>
              <TextField 
                label="Nama Menu" 
                fullWidth 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
              
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Kategori *</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <MenuItem value="">-- Pilih Kategori --</MenuItem>
                    {categories.map(c => <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>)}
                  </TextField>
                </Stack>
                
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <TextField 
                    placeholder="Buat Kategori Baru" 
                    size="small" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button 
                    type="button"
                    variant="outlined" 
                    onClick={handleAddCategory} 
                    disabled={isAddingCategory || !newCategoryName}
                    size="small"
                  >
                    {isAddingCategory ? '...' : 'Tambah'}
                  </Button>
                </Stack>
              </Box>

              <TextField 
                label="Harga (Rp)" 
                type="number" 
                fullWidth 
                required 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
              />

              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>Gambar Menu (Opsional)</Typography>
                <Button 
                  component="label"
                  variant="outlined" 
                  disabled={isUploading}
                >
                  {isUploading ? 'Mengunggah...' : 'Pilih Gambar'}
                  <input 
                    type="file" 
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      
                      // Reset input value so same file can be picked again
                      e.target.value = '';
                      
                      try {
                        const data = new FormData();
                        data.append('file', file);
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          body: data,
                        });
                        if (!res.ok) {
                          const errorData = await res.json();
                          throw new Error(errorData.details || errorData.error || 'Upload failed');
                        }
                        const json = await res.json();
                        setFormData({ ...formData, imageUrl: json.url });
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
                        setSnackbar({ 
                          open: true, 
                          message: `Gagal: ${errorMessage}`, 
                          severity: 'error' 
                        });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                </Button>
                {formData.imageUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Box component="img" src={formData.imageUrl} alt="Preview" sx={{ maxWidth: '100%', maxHeight: 150, borderRadius: 2, display: 'block', mx: 'auto', mb: 1 }} />
                    <Button color="error" size="small" onClick={() => setFormData({...formData, imageUrl: ''})}>
                      Hapus Gambar
                    </Button>
                  </Box>
                )}
              </Box>

              <TextField 
                label="Deskripsi" 

                multiline 
                rows={3} 
                fullWidth 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />

              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.isAvailable} 
                    onChange={e => setFormData({...formData, isAvailable: e.target.checked})} 
                    color="primary"
                  />
                }
                label="Tersedia (Bisa dipesan)"
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
        title="Hapus Menu"
        message="Apakah Anda yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan."
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
