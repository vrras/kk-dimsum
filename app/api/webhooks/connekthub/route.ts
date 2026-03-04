import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatPhoneForCH, sendMessage } from '@/lib/connekthub';
import { buildWaThreadOpenedReply, extractOrderNumberFromMessage } from '@/lib/order-whatsapp';

type ConnektHubInboundPayload = {
  event?: string;
  from?: string;
  message?: string;
  timestamp?: string;
};

const findOrderByInboundMessage = async (from: string, message: string) => {
  const normalizedSender = formatPhoneForCH(from);
  const extractedOrderNumber = extractOrderNumberFromMessage(message);

  if (extractedOrderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber: extractedOrderNumber },
    });

    if (order && formatPhoneForCH(order.customerWa) === normalizedSender) {
      return order;
    }
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

  const exactMatches = candidates.filter((candidate) => formatPhoneForCH(candidate.customerWa) === normalizedSender);

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  return null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ConnektHubInboundPayload;

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
    console.error('ConnektHub webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
