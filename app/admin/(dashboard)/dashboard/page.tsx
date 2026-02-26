import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, TrendingUp, Package, Utensils } from 'lucide-react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Ambil tanggal hari ini (mulai dari jam 00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ambil semua orders
  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Hitung statistik
  const todayOrders = allOrders.filter((o: { createdAt: Date }) => new Date(o.createdAt) >= today);
  const revenueToday = todayOrders
    .filter((o: { paymentStatus: string }) => o.paymentStatus === 'PAID')
    .reduce((sum: number, order: { totalAmount: number }) => sum + order.totalAmount, 0);
  
  const pendingOrders = allOrders.filter(
    (o: { orderStatus: string; paymentMethod: string; paymentStatus: string; paymentProof: string | null }) => o.orderStatus === 'PENDING' || (o.paymentMethod === 'TRANSFER' && o.paymentStatus === 'UNPAID' && o.paymentProof)
  );
  const activeOrders = allOrders.filter(
    (o: { orderStatus: string }) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'READY'
  );

  const totalMenusCount = await prisma.menu.count();

  // Ambil pesanan terbaru (5 terakhir)
  const recentOrders = allOrders.slice(0, 5);

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" fontWeight={800} gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4, mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Pendapatan Hari Ini" 
            value={formatCurrency(revenueToday)} 
            icon={<TrendingUp size={24} color="var(--primary)" />} 
            iconColor="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Pesanan Baru" 
            value={pendingOrders.length.toString()} 
            icon={<ShoppingBag size={24} color="var(--primary)" />} 
            iconColor="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Diproses" 
            value={activeOrders.length.toString()} 
            icon={<Package size={24} color="var(--primary)" />} 
            iconColor="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Total Menu" 
            value={totalMenusCount.toString()} 
            icon={<Utensils size={24} color="var(--primary)" />} 
            iconColor="secondary"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>Pesanan Terbaru</Typography>
            <Button component={Link} href="/admin/orders" variant="outlined" color="primary" size="small">
              Lihat Semua
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nomor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nama Pelanggan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status Pembayaran</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status Pesanan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Belum ada pesanan
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order: { id: string; orderNumber: string; customerName: string; totalAmount: number; paymentStatus: string; orderStatus: string }) => (
                    <TableRow key={order.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.paymentStatus} 
                          color={order.paymentStatus === 'PAID' ? 'success' : 'error'} 
                          size="small" 
                          sx={{ fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.orderStatus} 
                          color={order.orderStatus === 'COMPLETED' ? 'success' : 'primary'} 
                          size="small" 
                          sx={{ fontWeight: 'bold' }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

function StatCard({ title, value, icon, iconColor }: { title: string, value: string, icon: React.ReactNode, iconColor: 'primary' | 'secondary' }) {
  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: 3, 
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
      border: '1px solid', 
      borderColor: 'divider',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: iconColor === 'primary' ? 'primary.light' : 'secondary.light',
            color: iconColor === 'primary' ? 'primary.main' : 'secondary.main',
            flexShrink: 0
          }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ 
              textTransform: 'uppercase', 
              letterSpacing: 0.5, 
              display: 'block', 
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {title}
            </Typography>
            <Typography variant="h5" color="text.primary" fontWeight={800} sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
