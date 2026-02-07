import { prisma } from '@/lib/prisma';
import { printfulAPI } from './api';
import { PODOrder, PODOrderItem } from '../types';

export async function createPrintfulOrder(orderId: string) {
    try {
        // 1. Fetch local order with items and address
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                user: true,
            },
        });

        if (!order) throw new Error('Order not found');
        if (!order.shippingAddress) throw new Error('Shipping address missing');

        const address = JSON.parse(order.shippingAddress);

        // 2. Filter for POD items
        const podItems = order.items.filter(item => item.isPrintOnDemand && item.printVariantId);

        if (podItems.length === 0) {
            console.log('No POD items in order');
            return { success: false, message: 'No POD items found' };
        }

        // 3. Prepare Printful payload
        const printfulItems: PODOrderItem[] = podItems.map(item => ({
            variant_id: item.printVariantId!, // External ID from Printful
            quantity: item.quantity,
            retail_price: item.priceAtPurchase.toString(),
            name: item.productName || 'Custom Product',
            files: item.designFileUrl ? [{
                url: item.designFileUrl
            }] : []
        }));

        const payload: PODOrder = {
            external_id: order.id,
            status: 'draft', // Always create as draft first for safety
            recipient: {
                name: address.fullName,
                address1: address.addressLine1,
                address2: address.addressLine2,
                city: address.city,
                state_code: address.state, // Ensure this matches ISO code if needed
                country_code: address.country, // Ensure ISO 3166-1 alpha-2
                zip: address.postalCode,
                phone: address.phone,
                email: order.user?.email
            },
            items: printfulItems
        };

        console.log('Creating Printful order:', JSON.stringify(payload, null, 2));

        // 4. Send to Printful
        const result = await printfulAPI.createOrder(payload);

        // 5. Save PrintOrder record
        await prisma.printOrder.create({
            data: {
                orderId: order.id,
                providerId: (await getProviderId()),
                externalOrderId: result.id.toString(),
                externalOrderNumber: result.id.toString(),
                status: result.status,
                items: result.items,
                shippingAddress: result.recipient,
                shippingCost: result.costs.shipping,
                productionCost: result.costs.subtotal, // Approximation
            }
        });

        return { success: true, order: result };

    } catch (error: any) {
        console.error('Failed to create Printful order:', error);
        // Log error but don't crash standard flow
        return { success: false, error: error.message || 'Unknown error' };
    }
}

export async function confirmPrintfulOrder(orderId: string) {
    try {
        const printOrder = await prisma.printOrder.findFirst({
            where: { orderId }
        });

        if (!printOrder || !printOrder.externalOrderId) {
            throw new Error('Print order not found');
        }

        const result = await printfulAPI.confirmOrder(printOrder.externalOrderId);

        await prisma.printOrder.update({
            where: { id: printOrder.id },
            data: {
                status: result.status
            }
        });

        return { success: true, order: result };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function getProviderId() {
    const provider = await prisma.printProvider.findFirst({
        where: { name: 'printful' }
    });
    return provider?.id!;
}
