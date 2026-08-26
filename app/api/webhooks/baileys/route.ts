import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatPhoneForBaileys, sendMessage } from '@/lib/baileys';
import { buildWaThreadOpenedReply, extractOrderNumberFromMessage } from '@/lib/order-whatsapp';

type BaileysInboundPayload = {
  event?: string;
  from?: string;
  message?: string;
  timestamp?: string;
};

const getInboundReplyDelayMs = () => {
  const raw = process.env.BAILEYS_INBOUND_REPLY_DELAY_MS;
  if (!raw) return 60_000;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 60_000;

  return Math.floor(parsed);
};

// Verify webhook secret token
const verifyWebhookAuth = (req: Request): boolean => {
  const webhookSecret = process.env.WEBHOOK_SECRET_KEY;
  if (!webhookSecret) return true; // Skip if not configured

  const token = req.headers.get('x-api-key') || req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return token === webhookSecret;
};

const findOrderByInboundMessage = async (from: string, message: string) => {
  const normalizedSender = formatPhoneForBaileys(from);
  const extractedOrderNumber = extractOrderNumberFromMessage(message);

  if (extractedOrderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber: extractedOrderNumber },
    });

    // The customer sends the confirmation to the admin number, so the
    // inbound sender is the admin/bot JID, not the customer's checkout number.
    // The order number is the authoritative match.
    if (order) return order;
  }

  const phoneTail = normalizedSender.slice(-8);
  const candidates = await prisma.order.findMany({
    where: {
      customerWa: {
        contains: phoneTail,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  const exactMatches = candidates.filter((candidate) => formatPhoneForBaileys(candidate.customerWa) === normalizedSender);

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  return null;
};

export async function POST(req: Request) {
  // Verify webhook auth
  if (!verifyWebhookAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as BaileysInboundPayload;

    if (body.event !== 'message.received' || !body.from || !body.message) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const matchedOrder = await findOrderByInboundMessage(body.from, body.message);

    if (!matchedOrder) {
      return NextResponse.json({ ok: true, matched: false });
    }

    const wasAlreadyOpened = matchedOrder.waThreadOpened;
    const inboundAt = body.timestamp ? new Date(body.timestamp) : new Date();
    const waThreadOpenedAt = Number.isNaN(inboundAt.getTime()) ? new Date() : inboundAt;

    await prisma.order.update({
      where: { id: matchedOrder.id },
      data: {
        waThreadOpened: true,
        waThreadOpenedAt: wasAlreadyOpened ? matchedOrder.waThreadOpenedAt : waThreadOpenedAt,
      },
    });

    if (!wasAlreadyOpened) {
      const delayMs = getInboundReplyDelayMs();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await sendMessage(
        matchedOrder.customerWa,
        buildWaThreadOpenedReply({
          customerName: matchedOrder.customerName,
          orderId: matchedOrder.id,
          orderNumber: matchedOrder.orderNumber,
          paymentMethod: matchedOrder.paymentMethod,
          totalAmount: matchedOrder.totalAmount,
        })
      );
    }

    return NextResponse.json({ ok: true, matched: true, orderId: matchedOrder.id });
  } catch (error) {
    console.error('Order webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}