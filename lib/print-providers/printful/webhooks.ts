import { prisma } from '@/lib/prisma';

export async function handleWebhookEvent(event: any) {
    console.log('Received Printful webhook:', event.type);

    try {
        // Log raw event
        await prisma.printWebhookLog.create({
            data: {
                provider: 'printful',
                event: event.type,
                payload: event,
                processed: false
            }
        });

        switch (event.type) {
            case 'package_shipped':
                await handlePackageShipped(event.data.order);
                break;
            case 'order_canceled':
                await handleOrderCanceled(event.data.order);
                break;
            case 'order_failed':
                await handleOrderFailed(event.data.order);
                break;
            default:
                console.log('Unhandled event type:', event.type);
        }

        return { success: true };

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return { success: false, error: error.message };
    }
}

async function handlePackageShipped(data: any) {
    const printOrder = await prisma.printOrder.findFirst({
        where: { externalOrderId: data.id.toString() }
    });

    if (!printOrder) return;

    await prisma.printOrder.update({
        where: { id: printOrder.id },
        data: {
            status: 'shipped',
            trackingNumber: data.shipment.tracking_number,
            trackingUrl: data.shipment.tracking_url,
        }
    });

    // Update main order status if fully shipped
    await prisma.order.update({
        where: { id: printOrder.orderId },
        data: {
            status: 'shipped', // Or partial logic if mixed cart
            trackingNumber: data.shipment.tracking_number
        }
    });
}

async function handleOrderCanceled(data: any) {
    const printOrder = await prisma.printOrder.findFirst({
        where: { externalOrderId: data.id.toString() }
    });

    if (!printOrder) return;

    await prisma.printOrder.update({
        where: { id: printOrder.id },
        data: { status: 'cancelled' }
    });
}

async function handleOrderFailed(data: any) {
    const printOrder = await prisma.printOrder.findFirst({
        where: { externalOrderId: data.id.toString() }
    });

    if (!printOrder) return;

    await prisma.printOrder.update({
        where: { id: printOrder.id },
        data: {
            status: 'failed',
            statusMessage: 'Order failed processing at provider.'
        }
    });
}
