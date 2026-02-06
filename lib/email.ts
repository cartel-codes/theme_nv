
import { Order, OrderItem, Product, ProductVariant } from '@prisma/client';

type OrderWithItems = Order & {
    items: (OrderItem & {
        product: Product;
        variant: ProductVariant | null;
    })[];
};

/**
 * Generates a clean, luxury-styled HTML email for order confirmation.
 */
function generateOrderConfirmationHtml(order: OrderWithItems) {
    const { id, total, subtotal, shipping, tax, items } = order;
    const date = new Date(order.createdAt).toLocaleDateString();

    // Parse shipping address safely
    let address = { firstName: '', lastName: '', street: '', city: '', state: '', zipCode: '', country: '' };
    try {
        if (typeof order.shippingAddress === 'string') {
            address = JSON.parse(order.shippingAddress);
        }
    } catch (e) { }

    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 16px 0;">
                <div style="font-weight: 500; color: #1a1a1a;">${item.product.name}</div>
                ${item.variant ? `<div style="font-size: 12px; color: #666;">${item.variant.name}</div>` : ''}
            </td>
            <td style="padding: 16px 0; text-align: center;">${item.quantity}</td>
            <td style="padding: 16px 0; text-align: right; font-family: monospace;">$${item.priceAtPurchase}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 40px; padding-top: 20px;">
        <h1 style="font-family: 'Times New Roman', serif; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">NOVRAUX</h1>
    </div>

    <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: normal; margin-bottom: 10px;">Thank you for your order.</h2>
        <p style="color: #666;">We are pleased to confirm your order #${id.slice(-8).toUpperCase()}.</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
            <tr style="border-bottom: 2px solid #1a1a1a;">
                <th style="text-align: left; padding-bottom: 10px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Item</th>
                <th style="text-align: center; padding-bottom: 10px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Qty</th>
                <th style="text-align: right; padding-bottom: 10px; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Price</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
        </tbody>
    </table>

    <div style="margin-bottom: 40px; background: #f9f9f9; padding: 20px; border-radius: 4px;">
        <table style="width: 100%;">
            <tr>
                <td style="padding-bottom: 8px; color: #666;">Subtotal</td>
                <td style="text-align: right;">$${subtotal}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #666;">Shipping</td>
                <td style="text-align: right;">$${shipping}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 8px; color: #666;">Tax</td>
                <td style="text-align: right;">$${tax}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd;">
                <td style="padding-top: 8px; font-weight: bold;">Total</td>
                <td style="padding-top: 8px; text-align: right; font-weight: bold;">$${total}</td>
            </tr>
        </table>
    </div>

    <div style="margin-bottom: 40px;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Shipping to:</h3>
        <p style="color: #666; font-size: 14px; margin: 0;">
            ${address.firstName} ${address.lastName}<br>
            ${address.street}<br>
            ${address.city}, ${address.state} ${address.zipCode}<br>
            ${address.country}
        </p>
    </div>

    <div style="text-align: center; font-size: 12px; color: #999; margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px;">
        <p>&copy; ${new Date().getFullYear()} Novraux. All rights reserved.</p>
    </div>
</body>
</html>
    `;
}

/**
 * Sends an order confirmation email via Resend (if configured) or logs to console.
 */
export async function sendOrderConfirmation(order: OrderWithItems, userEmail: string) {
    const html = generateOrderConfirmationHtml(order);
    const subject = `Order Confirmation #${order.id.slice(-8).toUpperCase()}`;
    const apiKey = process.env.RESEND_API_KEY;

    // 1. Production/Resend Mode
    if (apiKey) {
        try {
            console.log(`[Email] Sending confirmation for ${order.id} to ${userEmail} via Resend...`);

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    from: 'Novraux <orders@novraux.com>', // Update this with your verified domain
                    to: userEmail,
                    subject: subject,
                    html: html,
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Resend API Error: ${errorText}`);
            }

            const data = await res.json();
            console.log(`[Email] Sent successfully. ID: ${data.id}`);
            return { success: true, id: data.id };

        } catch (error) {
            console.error('[Email] Failed to send email via Resend:', error);
            // Fallback to console log on error
        }
    }

    // 2. Development/Fallback Mode
    console.log('---------------------------------------------------');
    console.log(`[Email Dev Mode] To: ${userEmail}`);
    console.log(`[Email Dev Mode] Subject: ${subject}`);
    console.log(`[Email Dev Mode] Body Preview:`);
    console.log(html.replace(/<[^>]*>?/gm, ' ').substring(0, 200) + '...');
    console.log('---------------------------------------------------');

    return { success: true, mock: true };
}
