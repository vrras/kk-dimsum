'use client';

import * as React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Eye, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { useCallback } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerWa: string;
  customerAddress: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  waThreadOpened: boolean;
  waThreadOpenedAt?: string | null;
  paymentProof?: string;
  createdAt: string;
}

const getOrderStatusLabel = (status: string) => {
  if (status === 'PENDING') return 'Menunggu Diproses';
  return status;
};

const getDisplayStatusLabel = (order: Order) => {
  if (order.orderStatus !== 'PENDING') {
    return getOrderStatusLabel(order.orderStatus);
  }

  return isWaConfirmedForDisplay(order) ? 'Menunggu Diproses' : 'Menunggu Konfirmasi WhatsApp';
};

const isWaConfirmedForDisplay = (order: Order) => {
  return order.waThreadOpened || order.orderStatus !== 'PENDING';
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [waFilter, setWaFilter] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toUpperCase().includes(search.toUpperCase()) || 
                         o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchesWa =
      waFilter === 'ALL' ||
      (waFilter === 'OPENED' && o.waThreadOpened) ||
      (waFilter === 'PENDING' && !o.waThreadOpened);

    return matchesSearch && matchesStatus && matchesWa;
  });

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" fontWeight={800} gutterBottom>
        Kelola Pesanan
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <TextField
              placeholder="Cari No. Pesanan atau Nama"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Filter size={18} />
                  </InputAdornment>
                }
              >
                <MenuItem value="ALL">Semua Status</MenuItem>
                <MenuItem value="PENDING">Menunggu Konfirmasi WhatsApp</MenuItem>
                <MenuItem value="PROCESSING">Diproses</MenuItem>
                <MenuItem value="READY">Siap Dikirim / Diambil</MenuItem>
                <MenuItem value="COMPLETED">Selesai</MenuItem>
                <MenuItem value="CANCELLED">Dibatalkan</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={waFilter}
                onChange={(e) => setWaFilter(e.target.value)}
              >
                <MenuItem value="ALL">Semua WA</MenuItem>
                <MenuItem value="PENDING">Belum Chat</MenuItem>
                <MenuItem value="OPENED">Sudah Chat</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        {isLoading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Memuat data pesanan...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Tanggal</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nomor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pelanggan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>WA Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pembayaran</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1" color="text.secondary">Tidak ada pesanan ditemukan.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.dark' }}>{order.orderNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{order.customerWa}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Chip
                            label={isWaConfirmedForDisplay(order) ? 'Sudah Chat' : 'Belum Chat'}
                            size="small"
                            color={isWaConfirmedForDisplay(order) ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {order.waThreadOpenedAt
                              ? new Date(order.waThreadOpenedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                              : order.orderStatus === 'PENDING'
                                ? 'Menunggu inbound webhook'
                                : '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Chip 
                            label={order.paymentStatus} 
                            size="small"
                            color={order.paymentStatus === 'PAID' ? 'success' : (order.paymentStatus === 'UNPAID' ? 'primary' : 'error')}
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">{order.paymentMethod}</Typography>
                          {order.paymentMethod === 'TRANSFER' && order.paymentProof && order.paymentStatus === 'UNPAID' && (
                            <Chip label="Bukti Uploaded" size="small" variant="outlined" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getDisplayStatusLabel(order)}
                          color={order.orderStatus === 'COMPLETED' ? 'success' : (order.orderStatus === 'CANCELLED' ? 'error' : 'secondary')}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="left">
                        <Button 
                          component={Link} 
                          href={`/admin/orders/${order.id}`} 
                          variant="outlined" 
                          size="small"
                          startIcon={<Eye size={16} />}
                          sx={{ borderRadius: 2 }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
