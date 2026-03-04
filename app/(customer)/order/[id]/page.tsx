import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, XCircle, FileIcon, MessageCircle, Package, MapPin, CreditCard, Phone, User, Notebook } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import PaymentUploadForm from './PaymentUploadForm';
import { redirect } from 'next/navigation';
import { buildAdminWaLink } from '@/lib/order-whatsapp';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export const dynamic = 'force-dynamic';

const getPendingStatusLabel = (waThreadOpened: boolean, orderStatus: string, paymentStatus: string) => {
  if (orderStatus !== 'PENDING') {
    return paymentStatus === 'REJECTED' ? 'PEMBAYARAN DITOLAK' : orderStatus;
  }

  return waThreadOpened ? 'MENUNGGU DIPROSES' : 'MENUNGGU KONFIRMASI WHATSAPP';
};

// Karena menggunakan { params }, ini Server Component
export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    }),
    prisma.settings.findFirst()
  ]);

  const storeName = settings?.storeName || 'Nama Toko';

  if (!order) {
    redirect('/'); // Order tak ditemukan
  }
  
  // Parse bank accounts
  let bankAccounts: { bankName: string; bankAccount: string; bankAccountName: string }[] = [];
  if (settings?.bankAccounts) {
    try {
      bankAccounts = JSON.parse(settings.bankAccounts);
    } catch {
      bankAccounts = [];
    }
  }

  // Default fallback if everything is empty
  if (bankAccounts.length === 0) {
    bankAccounts = [{
      bankName: 'BCA',
      bankAccount: '1234567890',
      bankAccountName: storeName
    }];
  }

  const waAdmin = settings?.waNumber || '6281234567890';
  const adminWaLink = buildAdminWaLink(waAdmin, {
    orderNumber: order.orderNumber,
  });

  let statusBg = '#6b7280';
  if (order.orderStatus === 'PROCESSING') { statusBg = '#db2777'; }
  if (order.orderStatus === 'READY') { statusBg = '#b86b00'; }
  if (order.orderStatus === 'COMPLETED') { statusBg = '#16a34a'; }
  if (order.orderStatus === 'CANCELLED') { statusBg = '#dc2626'; }

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton 
          component={Link} 
          href="/" 
          sx={{ 
            bgcolor: '#ffffff', 
            color: 'primary.main', 
            boxShadow: 1,
            '&:hover': { bgcolor: 'secondary.light' }
          }}
        >
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 900, color: 'primary.dark' }}>
          Detail Pesanan
        </Typography>
      </Box>

      {/* Hero Status */}
      {!order.waThreadOpened ? (
        <Alert
          icon={<InfoOutlined />}
          severity="warning"
          sx={{ mb: 4, borderRadius: 4, bgcolor: '#fff7ed', border: '1px solid', borderColor: '#fdba74' }}
        >
          <AlertTitle sx={{ fontWeight: 900 }}>Konfirmasi WhatsApp Belum Dikirim</AlertTitle>
          Pesanan belum masuk ke antrean proses. Klik tombol <strong>Hubungi Admin via WhatsApp</strong> di bawah, lalu kirim pesan yang sudah terisi agar admin bisa memproses pesanan ini.
        </Alert>
      ) : order.orderStatus === 'COMPLETED' ? (
        <Paper elevation={0} sx={{ 
          p: 4, 
          borderRadius: 4, 
          mb: 4, 
          textAlign: 'center', 
          border: '1px solid', 
          borderColor: 'success.light',
          bgcolor: '#f0fdf4'
        }}>
          <CheckCircle2 size={64} color="#16a34a" style={{ marginBottom: '1rem' }} />
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: '#166534' }}>Pesanan Selesai!</Typography>
          <Typography color="text.secondary">Terima kasih telah berbelanja di {storeName}. Semoga harimu menyenangkan!</Typography>
        </Paper>
      ) : order.orderStatus === 'CANCELLED' ? (
        <Paper elevation={0} sx={{ 
          p: 4, 
          borderRadius: 4, 
          mb: 4, 
          textAlign: 'center', 
          border: '1px solid', 
          borderColor: 'error.light',
          bgcolor: '#fef2f2'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: '#991b1b' }}>Pesanan Dibatalkan</Typography>
          <Typography color="text.secondary">Mohon maaf, pesanan ini telah dibatalkan.</Typography>
        </Paper>
      ) : order.paymentStatus === 'REJECTED' ? (
        <Alert 
          severity="error" 
          variant="filled" 
          icon={<XCircle size={24} />}
          sx={{ mb: 4, borderRadius: 4, bgcolor: '#dc2626' }}
        >
          <AlertTitle sx={{ fontWeight: 900 }}>Pembayaran Ditolak</AlertTitle>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Alasan: {order.paymentRejectionReason}</Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.9 }}>
            Mohon unggah kembali bukti pembayaran yang benar di bawah ini.
          </Typography>
        </Alert>
      ) : null}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', md: 'none' } }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: !order.waThreadOpened ? '#fdba74' : 'divider',
              bgcolor: !order.waThreadOpened ? '#fff7ed' : 'white',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
              {!order.waThreadOpened ? 'Langkah Berikutnya' : 'Butuh Bantuan?'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500, lineHeight: 1.6 }}>
              {!order.waThreadOpened
                ? 'Kirim pesan WhatsApp ke admin sekarang agar pesanan masuk ke antrean proses. Gunakan pesan yang sudah terisi supaya Order ID terbaca otomatis.'
                : 'Kalau ada perubahan atau pertanyaan soal pesanan, kamu bisa lanjut chat admin lewat tombol ini.'}
            </Typography>
            {!order.waThreadOpened && (
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 2, color: 'warning.dark', fontWeight: 700, lineHeight: 1.6 }}
              >
                Gunakan nomor WhatsApp yang sama dengan nomor yang kamu isi saat checkout. Jika berbeda, konfirmasi otomatis tidak akan terbaca sistem.
              </Typography>
            )}
            <Button
              component="a"
              href={adminWaLink}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              fullWidth
              startIcon={<MessageCircle size={20} />}
              sx={{ 
                borderRadius: 3, 
                py: 1.5, 
                fontWeight: 800,
                borderColor: !order.waThreadOpened ? 'warning.main' : 'primary.light',
                color: !order.waThreadOpened ? 'white' : 'primary.main',
                bgcolor: !order.waThreadOpened ? 'warning.main' : 'transparent',
                '&:hover': { bgcolor: 'secondary.light', borderColor: 'primary.main' }
              }}
            >
              {!order.waThreadOpened ? 'Kirim Konfirmasi via WhatsApp' : 'Hubungi Admin via WhatsApp'}
            </Button>
          </Paper>
        </Grid>

        {/* Order Details Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Nomor Pesanan</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.dark' }}>{order.orderNumber}</Typography>
              </Box>
              <Chip 
                label={getPendingStatusLabel(order.waThreadOpened, order.orderStatus, order.paymentStatus)}
                sx={{ 
                  bgcolor: order.paymentStatus === 'REJECTED' ? '#dc2626' : statusBg, 
                  color: 'white', 
                  fontWeight: 900, 
                  px: 1,
                  fontSize: '0.75rem'
                }} 
              />
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Package size={20} color="#db2777" /> Item Pesanan
            </Typography>

            <Stack spacing={2}>
              {order.items.map((item: { id: string; quantity: number; price: number; menu: { name: string } }) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      <Box component="span" sx={{ color: 'primary.main', fontWeight: 900, mr: 1 }}>{item.quantity}x</Box>
                      {item.menu.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{formatCurrency(item.price)} per item</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>{formatCurrency(item.price * item.quantity)}</Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 1 }} />
              
              {(() => {
                const subtotal = order.items?.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0) || 0;
                const discount = subtotal - order.totalAmount;
                
                return (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>Subtotal</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{formatCurrency(subtotal)}</Typography>
                    </Box>
                    {discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography color="error.main" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                          Diskon {order.promoCode && <Chip size="small" label={order.promoCode} color="error" variant="outlined" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />}
                        </Typography>
                        <Typography color="error.main" sx={{ fontWeight: 800 }}>-{formatCurrency(discount)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: discount > 0 ? 1 : 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Total Tagihan</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                    </Box>
                  </>
                );
              })()}
            </Stack>
          </Paper>

          {/* Payment Section */}
          {order.paymentMethod === 'TRANSFER' && 
           (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'REJECTED') && 
           order.orderStatus !== 'CANCELLED' && (
            <Paper elevation={0} sx={{ 
              p: 3, 
              borderRadius: 4, 
              mb: 4, 
              border: '2px solid', 
              borderColor: 'primary.main',
              bgcolor: 'secondary.light'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard size={20} /> Menunggu Pembayaran
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                Silahkan transfer senilai <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatCurrency(order.totalAmount)}</Box> ke salah satu rekening berikut:
              </Typography>
              
              <Stack spacing={2} sx={{ mb: 3 }}>
                {bankAccounts.map((account, index) => (
                  <Paper key={index} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'primary.light', bgcolor: 'white' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{account.bankName}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: 1, my: 0.5 }}>{account.bankAccount}</Typography>
                    <Typography variant="body2" color="text.secondary">atas nama <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{account.bankAccountName}</Box></Typography>
                  </Paper>
                ))}
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, fontStyle: 'italic' }}>
                Setelah transfer, mohon unggah bukti pembayaran agar pesanan Anda dapat segera kami proses.
              </Typography>

              {order.waThreadOpened ? (
                <PaymentUploadForm orderId={order.id} existingProof={null} />
              ) : (
                <Alert severity="warning" sx={{ borderRadius: 3, bgcolor: '#fff7ed', border: '1px solid', borderColor: '#fdba74' }}>
                  Kirim konfirmasi WhatsApp ke admin terlebih dulu. Upload bukti transfer akan aktif setelah chat kamu diterima sistem.
                </Alert>
              )}
            </Paper>
          )}

          {/* Payment Proof Processing */}
          {order.paymentMethod === 'TRANSFER' && order.paymentProof && order.paymentStatus === 'UNPAID' && order.orderStatus !== 'CANCELLED' && (
            <Alert icon={<FileIcon size={24} />} severity="info" sx={{ mb: 4, borderRadius: 4, bgcolor: '#f0f9ff', border: '1px solid', borderColor: '#bae6fd' }}>
              <AlertTitle sx={{ fontWeight: 900 }}>Bukti Pembayaran Diunggah</AlertTitle>
              Admin kami sedang memverifikasi pembayaran Anda. Mohon tunggu sebentar.
            </Alert>
          )}

          {/* Paid Status */}
          {order.paymentStatus === 'PAID' && (
            <Alert icon={<CheckCircle2 size={24} />} severity="success" sx={{ mb: 4, borderRadius: 4 }}>
              <AlertTitle sx={{ fontWeight: 900 }}>Pesanan Lunas</AlertTitle>
              Pembayaran telah diverifikasi.
            </Alert>
          )}

          {/* COD Notice */}
          {order.paymentMethod === 'CASH' && order.paymentStatus === 'UNPAID' && order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 4, mb: 4, borderLeft: '6px solid #b86b00', bgcolor: '#fffcf0' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip label="COD / Bayar Tunai" size="small" sx={{ fontWeight: 800, bgcolor: '#b86b00', color: 'white' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Mohon siapkan <Box component="span" sx={{ color: 'primary.main' }}>{formatCurrency(order.totalAmount)}</Box> saat pesanan tiba.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Grid>

        {/* Info Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Delivery Info */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapPin size={20} color="#db2777" /> Data Pengiriman
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                    <User size={14} /> PENERIMA
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.customerName}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                    <Phone size={14} /> WHATSAPP
                  </Typography>
                  <Typography variant="body2">{order.customerWa}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                    <MapPin size={14} /> ALAMAT
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{order.customerAddress}</Typography>
                </Box>

                {order.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                      <Notebook size={14} /> CATATAN
                    </Typography>
                    <Typography variant="body2">{order.notes}</Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: !order.waThreadOpened ? '#fdba74' : 'divider',
                bgcolor: !order.waThreadOpened ? '#fff7ed' : 'white',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
                {!order.waThreadOpened ? 'Langkah Berikutnya' : 'Butuh Bantuan?'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500, lineHeight: 1.6 }}>
                {!order.waThreadOpened
                  ? 'Kirim pesan WhatsApp ke admin sekarang agar pesanan masuk ke antrean proses. Gunakan pesan yang sudah terisi supaya Order ID terbaca otomatis.'
                  : 'Kalau ada perubahan atau pertanyaan soal pesanan, kamu bisa lanjut chat admin lewat tombol ini.'}
              </Typography>
              {!order.waThreadOpened && (
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mb: 2, color: 'warning.dark', fontWeight: 700, lineHeight: 1.6 }}
                >
                  Gunakan nomor WhatsApp yang sama dengan nomor yang kamu isi saat checkout. Jika berbeda, konfirmasi otomatis tidak akan terbaca sistem.
                </Typography>
              )}
              <Button
                component="a"
                href={adminWaLink}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                fullWidth
                startIcon={<MessageCircle size={20} />}
                sx={{ 
                  borderRadius: 3, 
                  py: 1.5, 
                  fontWeight: 800,
                  borderColor: !order.waThreadOpened ? 'warning.main' : 'primary.light',
                  color: !order.waThreadOpened ? 'white' : 'primary.main',
                  bgcolor: !order.waThreadOpened ? 'warning.main' : 'transparent',
                  '&:hover': { bgcolor: 'secondary.light', borderColor: 'primary.main' }
                }}
              >
                {!order.waThreadOpened ? 'Kirim Konfirmasi via WhatsApp' : 'Hubungi Admin via WhatsApp'}
              </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
