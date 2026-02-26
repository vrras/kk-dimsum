'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, Clock, Plus, Trash2 } from 'lucide-react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import { useTheme } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function AdminSettingsPage() {
  useTheme();
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    isOpen: true,
    openHour: '08:00',
    closeHour: '22:00',
    closedDays: [] as number[],
    waNumber: '',
    bankAccounts: [] as { bankName: string; bankAccount: string; bankAccountName: string }[]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setFormData({
              storeName: data.storeName || '',
              storeDescription: data.storeDescription || '',
              isOpen: data.isOpen !== false, // default true
              openHour: data.openHour || '08:00',
              closeHour: data.closeHour || '22:00',
              closedDays: data.closedDays || [],
              waNumber: data.waNumber || '',
              bankAccounts: data.bankAccounts || []
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Gagal menyimpan');
      
      setSnackbar({ open: true, message: 'Pengaturan berhasil disimpan!', severity: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setSnackbar({ open: true, message: 'Terjadi kesalahan saat menyimpan pengaturan.', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (index: number, field: string, value: string) => {
    const newAccounts = [...formData.bankAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setFormData(prev => ({ ...prev, bankAccounts: newAccounts }));
  };

  const addBankAccount = () => {
    setFormData(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, { bankName: '', bankAccount: '', bankAccountName: '' }]
    }));
  };

  const removeBankAccount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Memuat pengaturan...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10, maxWidth: 900 }}>
      <Typography variant="h4" color="primary.dark" fontWeight={800} sx={{ mb: 4 }}>
        Pengaturan Toko
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Identitas Toko */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Store size={22} color="var(--pink-600)" />
                <Typography variant="h6" fontWeight={700}>Identitas & Info Toko</Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={3}>
                <TextField 
                  label="Nama Toko" 
                  name="storeName" 
                  fullWidth 
                  required 
                  value={formData.storeName} 
                  onChange={handleChange} 
                />
                <TextField 
                  label="Deskripsi Singkat" 
                  name="storeDescription" 
                  fullWidth 
                  multiline 
                  rows={2} 
                  value={formData.storeDescription} 
                  onChange={handleChange} 
                  placeholder="Slogan atau deskripsi singkat..."
                />
                <TextField 
                  label="Nomor WhatsApp Admin" 
                  name="waNumber" 
                  fullWidth 
                  value={formData.waNumber} 
                  onChange={handleChange} 
                  helperText="Nomor untuk menerima pesan dari customer (jika klik Hubungi Admin)."
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Jam Operasional */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Clock size={22} color="var(--pink-600)" />
                <Typography variant="h6" fontWeight={700}>Waktu Layanan</Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              
              <Stack spacing={3}>
                <Box sx={{ p: 2, bgcolor: formData.isOpen ? 'success.50' : 'error.50', borderRadius: 2, border: '1px solid', borderColor: formData.isOpen ? 'success.200' : 'error.200' }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.isOpen} 
                        onChange={(e) => setFormData(p => ({ ...p, isOpen: e.target.checked }))} 
                        color={formData.isOpen ? "success" : "error"}
                      />
                    }
                    label={
                      <Typography fontWeight={700} color={formData.isOpen ? "success.dark" : "error.dark"}>
                        {formData.isOpen ? "Toko Buka (Menerima Pesanan)" : "Toko Tutup (Tiba-tiba tidak jualan)"}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Gunakan tombol ini jika Anda ingin menutup toko mendadak tanpa mengubah jadwal.
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      label="Jam Buka" 
                      name="openHour" 
                      type="time"
                      fullWidth 
                      value={formData.openHour} 
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }} // 5 min
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      label="Jam Tutup" 
                      name="closeHour" 
                      type="time"
                      fullWidth 
                      value={formData.closeHour} 
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Hari Libur (Hari non-operasional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Toko akan otomatis berstatus Tutup penuh pada hari-hari yang Anda centang di bawah ini.
                  </Typography>
                  <FormGroup row>
                    {[
                      { label: 'Sen', value: 1 },
                      { label: 'Sel', value: 2 },
                      { label: 'Rab', value: 3 },
                      { label: 'Kam', value: 4 },
                      { label: 'Jum', value: 5 },
                      { label: 'Sab', value: 6 },
                      { label: 'Min', value: 0 },
                    ].map((day) => (
                      <FormControlLabel
                        key={day.value}
                        control={
                          <Checkbox 
                            checked={formData.closedDays.includes(day.value)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => {
                                const newDays = checked 
                                  ? [...prev.closedDays, day.value] 
                                  : prev.closedDays.filter(d => d !== day.value);
                                return { ...prev, closedDays: newDays };
                              });
                            }}
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Rekening Pembayaran */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CreditCard size={22} color="var(--pink-600)" />
                  <Typography variant="h6" fontWeight={700}>Rekening Bank</Typography>
                </Stack>
                <Button 
                  startIcon={<Plus size={18} />} 
                  onClick={addBankAccount}
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Tambah Rekening
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {formData.bankAccounts.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Belum ada rekening bank yang ditambahkan.</Typography>
                </Box>
              )}

              <Stack spacing={3}>
                {formData.bankAccounts.map((account, index) => (
                  <Paper 
                    key={index} 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      position: 'relative'
                    }}
                  >
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => removeBankAccount(index)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: 'primary.main' }}>
                      Rekening #{index + 1}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField 
                          label="Nama Bank" 
                          fullWidth 
                          size="small"
                          value={account.bankName} 
                          onChange={(e) => handleBankChange(index, 'bankName', e.target.value)} 
                          placeholder="Contoh: BCA"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField 
                          label="Nomor Rekening" 
                          fullWidth 
                          size="small"
                          value={account.bankAccount} 
                          onChange={(e) => handleBankChange(index, 'bankAccount', e.target.value)} 
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField 
                          label="Atas Nama" 
                          fullWidth 
                          size="small"
                          value={account.bankAccountName} 
                          onChange={(e) => handleBankChange(index, 'bankAccountName', e.target.value)} 
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Paper 
          elevation={4}
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24, 
            left: { xs: 24, md: 288 }, // Account for sidebar (264 + 24)
            p: 2, 
            borderRadius: 4, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            gap: 2,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSaving}
            size="large"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
            sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 700 }}
          >
            Simpan Pengaturan
          </Button>
        </Paper>
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
    </Box>
  );
}
