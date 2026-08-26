'use client';

import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Clock, XCircle, CreditCard, User, Truck, Phone, Package } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import AdminOrdersRealtimeListener from '../AdminOrdersRealtimeListener';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import { useCallback } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerWa: string;
  customerAddress: string;
  notes?: string;
  totalAmount: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  paymentStatus: 'UNPAID' | 'PAID' | 'REJECTED';
  orderStatus: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  waThreadOpened: boolean;
  waThreadOpenedAt?: string | null;
  paymentProof?: string;
  paymentRejectionReason?: string;
  promoCode?: string | null;
  items: OrderItem[];
}

const getOrderStatusLabel = (status: Order['orderStatus']) => {
  if (status === 'PENDING') return 'Menunggu Diproses';
  return status;
};

const isWaConfirmedForDisplay = (order: Order) => {
  return order.waThreadOpened || order.orderStatus !== 'PENDING';
};

const getDisplayStatusLabel = (order: Order) => {
  if (order.orderStatus !== 'PENDING') {
    return getOrderStatusLabel(order.orderStatus);
  }

  return isWaConfirmedForDisplay(order) ? 'Menunggu Diproses' : 'Menunggu Konfirmasi WhatsApp';
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; data: Partial<Order> | null; message: string }>({
    open: false,
    data: null,
    message: ''
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const router = useRouter();

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      if (res.ok) {
        setOrder(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateStatus = (updateData: Partial<Order>, message?: string) => {
    setConfirmDialog({
      open: true,
      data: updateData,
      message: message || 'Apakah anda yakin mengubah status pesanan ini?'
    });
  };

  const executeUpdateStatus = async (updateData: Partial<Order>) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Status berhasil diperbarui', severity: 'success' });
        await fetchOrder();
        router.refresh();
      } else {
        throw new Error('Gagal update status');
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setIsUpdating(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleRejectPayment = () => {
    if (!rejectReason.trim()) {
      setSnackbar({ open: true, message: 'Alasan penolakan harus diisi', severity: 'warning' });
      return;
    }
    updateStatus({ 
      paymentStatus: 'REJECTED',
      paymentRejectionReason: rejectReason
    });
    setOpenRejectDialog(false);
    setRejectReason('');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">Pesanan tidak ditemukan.</Typography>
      </Box>
    );
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'UNPAID': return 'primary';
      default: return 'error';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton component={Link} href="/admin/orders" color="primary" sx={{ border: '1px solid', borderColor: 'primary.main' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary.dark" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Pesanan #{order.orderNumber}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Kolom Kiri - Info Pesanan */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Detail Pelanggan */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <User size={20} />
                  <Typography variant="h6" fontWeight="bold">Data Pelanggan</Typography>
                </Box>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 4, sm: 3 }}>
                    <Typography color="text.secondary">Konfirmasi WA</Typography>
                  </Grid>
                  <Grid size={{ xs: 8, sm: 9 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={isWaConfirmedForDisplay(order) ? 'Sudah Chat' : 'Belum Chat'}
                        size="small"
                        color={isWaConfirmedForDisplay(order) ? 'success' : 'warning'}
                        sx={{ fontWeight: 'bold' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {order.waThreadOpenedAt
                          ? `Inbound diterima ${new Date(order.waThreadOpenedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`
                          : order.orderStatus === 'PENDING'
                            ? 'Belum ada inbound webhook dari customer.'
                            : 'Diasumsikan terkonfirmasi untuk data lama.'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 4, sm: 3 }}>
                    <Typography color="text.secondary">Nama</Typography>
                  </Grid>
                  <Grid size={{ xs: 8, sm: 9 }}>
                    <Typography fontWeight="bold">{order.customerName}</Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 4, sm: 3 }}>
                    <Typography color="text.secondary">WhatsApp</Typography>
                  </Grid>
                  <Grid size={{ xs: 8, sm: 9 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone size={16} />
                      <Typography fontWeight="bold">{order.customerWa}</Typography>
                      <Button 
                        size="small"
                        variant="contained" 
                        color="success" 
                        href={`https://wa.me/${order.customerWa.replace(/\\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                      >
                        Chat WA
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 4, sm: 3 }}>
                    <Typography color="text.secondary">Alamat</Typography>
                  </Grid>
                  <Grid size={{ xs: 8, sm: 9 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Truck size={18} style={{ marginTop: '2px', color: '#db2777' }} /> 
                      <Typography>{order.customerAddress}</Typography>
                    </Box>
                  </Grid>
                  
                  {order.notes && (
                    <>
                      <Grid size={{ xs: 4, sm: 3 }}>
                        <Typography color="text.secondary">Catatan</Typography>
                      </Grid>
                      <Grid size={{ xs: 8, sm: 9 }}>
                        <Box sx={{ bgcolor: '#fdf2f8', p: 1.5, borderRadius: 1, borderLeft: '4px solid #db2777' }}>
                          <Typography fontWeight="bold">{order.notes}</Typography>
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Rincian Menu */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  Item Pesanan
                </Typography>
                
                <TableContainer component={Paper} elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Menu</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Harga</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{item.menu.name}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                  {(() => {
                    const subtotal = order.items?.reduce((sum: number, item) => sum + (item.price * item.quantity), 0) || 0;
                    const discount = subtotal - order.totalAmount;
                    
                    return (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography color="text.secondary">Subtotal</Typography>
                          <Typography fontWeight="bold">{formatCurrency(subtotal)}</Typography>
                        </Box>
                        {discount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                              Diskon {order.promoCode && <Chip size="small" label={order.promoCode} color="error" variant="outlined" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />}
                            </Typography>
                            <Typography color="error.main" fontWeight="bold">-{formatCurrency(discount)}</Typography>
                          </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color="text.secondary" fontWeight="bold">Total Tagihan</Typography>
                          <Typography variant="h5" color="primary.dark" fontWeight="bold">{formatCurrency(order.totalAmount)}</Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </CardContent>
            </Card>

          </Box>
        </Grid>

        {/* Kolom Kanan - Status & Pembayaran & Action */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Pembayaran */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <CreditCard size={20} />
                  <Typography variant="h6" fontWeight="bold">Pembayaran</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography color="text.secondary" gutterBottom>Metode</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {order.paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'Cash / COD'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography color="text.secondary" gutterBottom>Status Saat Ini</Typography>
                  <Chip 
                    label={order.paymentStatus} 
                    color={getPaymentStatusColor(order.paymentStatus) as 'success'|'primary'|'error'} 
                    sx={{ fontWeight: 'bold' }}
                  />
                  {order.paymentStatus === 'REJECTED' && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: '#fff1f2', borderRadius: 1, border: '1px solid', borderColor: '#fecdd3' }}>
                      <Typography variant="caption" color="error.main" fontWeight="bold">Alasan Penolakan:</Typography>
                      <Typography variant="body2" color="error.dark">{order.paymentRejectionReason}</Typography>
                    </Box>
                  )}
                </Box>

                {order.paymentMethod === 'TRANSFER' && order.paymentStatus !== 'PAID' && order.orderStatus !== 'CANCELLED' && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography color="text.secondary" fontWeight="bold" gutterBottom>Bukti Transfer:</Typography>
                    {order.paymentProof ? (
                      <Box>
                        <Box 
                          component="img"
                          src={order.paymentProof} 
                          alt="Bukti Transfer" 
                          sx={{ 
                            width: '100%', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            mb: 2, 
                            maxHeight: 300, 
                            objectFit: 'contain',
                            bgcolor: 'grey.200' 
                          }} 
                        />
                        {order.paymentStatus === 'UNPAID' && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button 
                              variant="contained"
                              color="success"
                              fullWidth
                              onClick={() => updateStatus({ paymentStatus: 'PAID' })}
                              disabled={isUpdating}
                              startIcon={<CheckCircle size={20} />}
                              sx={{ py: 1.5 }}
                            >
                              Konfirmasi Pembayaran Valid
                            </Button>
                            <Button 
                              variant="outlined"
                              color="error"
                              fullWidth
                              onClick={() => setOpenRejectDialog(true)}
                              disabled={isUpdating}
                              startIcon={<XCircle size={20} />}
                              sx={{ py: 1.5 }}
                            >
                              Tolak Pembayaran
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" fontStyle="italic" sx={{ py: 2, border: '1px dashed', borderColor: 'divider' }}>
                        Customer belum mengunggah bukti bayar.
                      </Typography>
                    )}
                  </Paper>
                )}
                
                {order.paymentMethod === 'CASH' && order.paymentStatus === 'UNPAID' && (
                  <Button 
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => updateStatus({ paymentStatus: 'PAID' })}
                    disabled={isUpdating}
                    startIcon={<CheckCircle size={20} />}
                    sx={{ py: 1.5, mt: 2 }}
                  >
                    Tandai Sudah Dibayar (Cash)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Aksi Pesanan */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight="bold">🛠 Aksi Pesanan</Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography color="text.secondary" gutterBottom>Status Pengerjaan</Typography>
                  <Chip 
                    label={getDisplayStatusLabel(order)} 
                    color={getOrderStatusColor(order.orderStatus) as 'success'|'primary'|'error'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {order.orderStatus === 'PENDING' && (
                    <Button 
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => updateStatus({ orderStatus: 'PROCESSING' })}
                      disabled={isUpdating}
                      startIcon={<Clock size={20} />}
                      sx={{ py: 1.5 }}
                    >
                      Mulai Proses (Masak)
                    </Button>
                  )}
                  
                  {order.orderStatus === 'PROCESSING' && (
                    <Button 
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => updateStatus({ orderStatus: 'READY' })}
                      disabled={isUpdating}
                      startIcon={<Package size={20} />}
                      sx={{ py: 1.5 }}
                    >
                      Pesanan Siap / Dipacking
                    </Button>
                  )}

                  {order.orderStatus === 'READY' && (
                    <Button 
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => updateStatus({ orderStatus: 'COMPLETED' })}
                      disabled={isUpdating}
                      startIcon={<CheckCircle size={20} />}
                      sx={{ py: 1.5 }}
                    >
                      Selesaikan Pesanan
                    </Button>
                  )}

                  {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
                    <Button 
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => updateStatus({ orderStatus: 'CANCELLED' })}
                      disabled={isUpdating}
                      startIcon={<XCircle size={20} />}
                      sx={{ py: 1.5, mt: 2 }}
                    >
                      Batalkan Pesanan
                    </Button>
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary" align="center" display="block" fontStyle="italic" sx={{ mt: 3 }}>
                  Notifikasi WA otomatis terkirim setiap perubahan status.
                </Typography>
              </CardContent>
            </Card>

          </Box>
        </Grid>
      </Grid>
      
      {/* Dialog Penolakan Pembayaran */}
      <Dialog open={openRejectDialog} onClose={() => { setOpenRejectDialog(false); setRejectReason(''); }} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Tolak Pembayaran</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Berikan alasan penolakan agar pelanggan bisa memperbaikinya.</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Contoh: Bukti transfer tidak jelas / Nominal kurang"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setOpenRejectDialog(false); setRejectReason(''); }} color="inherit">Batal</Button>
          <Button 
            onClick={handleRejectPayment} 
            variant="contained" 
            color="error"
            disabled={isUpdating}
          >
            Tolak Sekarang
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Konfirmasi Perubahan"
        message={confirmDialog.message}
        onConfirm={() => confirmDialog.data && executeUpdateStatus(confirmDialog.data)}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        isLoading={isUpdating}
        confirmColor={confirmDialog.data?.orderStatus === 'CANCELLED' || confirmDialog.data?.paymentStatus === 'REJECTED' ? 'error' : 'primary'}
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

      {/* Supabase Realtime: reload detail on order change */}
      <AdminOrdersRealtimeListener orderId={params.id} />
    </Box>
  );
}
