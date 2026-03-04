import { formatCurrency } from '@/lib/utils';

interface OrderWhatsAppPayload {
  customerName: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  totalAmount: number;
}

export const buildOrderDetailUrl = (orderId: string) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/order/${orderId}`;
};

export const buildAdminOrderPrefillText = (order: Pick<OrderWhatsAppPayload, 'orderNumber'>) => {
  return [
    'Halo admin, saya sudah checkout ya.',
    `Order ID: ${order.orderNumber}`,
    'Mohon dibantu proses pesanan saya. Terima kasih.',
  ].join('\n');
};

export const buildAdminWaLink = (
  adminWa: string,
  order: Pick<OrderWhatsAppPayload, 'orderNumber'>
) => {
  const normalizedAdminWa = adminWa.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${normalizedAdminWa}?text=${encodeURIComponent(buildAdminOrderPrefillText(order))}`;
};

export const extractOrderNumberFromMessage = (message: string) => {
  const match = message.match(/\bKK-\d{6,}\b/i);
  return match?.[0]?.toUpperCase() || null;
};

export const buildWaThreadOpenedReply = (order: OrderWhatsAppPayload) => {
  const detailUrl = buildOrderDetailUrl(order.orderId);

  if (order.paymentMethod === 'TRANSFER') {
    return [
      `{Halo|Hai|Halo Kak} ${order.customerName}, {terima kasih|makasih|thanks} telah memesan di *KK Dimsum*! 🧾`,
      `*No. Pesanan: ${order.orderNumber}*`,
      `💰 *Total Tagihan: ${formatCurrency(order.totalAmount)}*`,
      '💳 *Metode Bayar: Transfer Bank*',
      `Silakan lakukan transfer dan *unggah bukti pembayaran* melalui link di bawah ini agar pesanan dapat {segera kami proses|langsung kami buatkan|cepat kami siapkan}:`,
      detailUrl,
      '{Terima kasih|Ditunggu ya|Kami tunggu konfirmasinya}! 🥟💕',
    ].join('\n\n');
  }

  return [
    `{Hai|Halo|Halo Kak} ${order.customerName}, pesanan kamu (*${order.orderNumber}*) telah kami {terima|proses}! 🧾`,
    `*No. Pesanan: ${order.orderNumber}*`,
    `💰 *Total Tagihan: ${formatCurrency(order.totalAmount)}*`,
    '💳 *Metode Bayar: COD / Bayar Tunai*',
    'Mohon siapkan pembayaran saat pesanan tiba ya kak.',
    'Cek detail pesanan kamu di sini:',
    detailUrl,
    `{Ditunggu pesanannya|Terima kasih sudah pesan|Sampai jumpa di pesananmu} di *KK Dimsum*! 🥟💕`,
  ].join('\n\n');
};
