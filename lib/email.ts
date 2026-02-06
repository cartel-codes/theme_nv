
import { Order, OrderItem, Product, ProductVariant } from '@prisma/client';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Novraux <noreply@novraux.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

type OrderWithItems = Order & {
    items: (OrderItem & {
        product: Product;
        variant: ProductVariant | null;
    })[];
};

/**
 * Generic email sending function via Resend with fallback to console
 */
async function sendEmail(config: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}) {
    const apiKey = process.env.RESEND_API_KEY;

    // Production mode with Resend
    if (apiKey) {
        try {
            console.log(`[Email] Sending "${config.subject}" to ${config.to}...`);

            const res = await fetch(RESEND_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    from: FROM_EMAIL,
                    to: config.to,
                    subject: config.subject,
                    html: config.html,
                    text: config.text,
                    reply_to: FROM_EMAIL,
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
            console.error('[Email] Failed to send via Resend:', error);
            // Fallback to console
        }
    }

    // Development/Fallback mode
    console.log('---------------------------------------------------');
    console.log(`[Email Dev Mode] To: ${config.to}`);
    console.log(`[Email Dev Mode] Subject: ${config.subject}`);
    console.log(`[Email Dev Mode] Body Preview:`);
    console.log(config.html.replace(/<[^>]*>?/gm, ' ').substring(0, 300) + '...');
    console.log('---------------------------------------------------');

    return { success: true, mock: true };
}

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

    return sendEmail({
        to: userEmail,
        subject,
        html,
    });
}

/**
 * Send password reset email with time-limited link
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${SITE_URL}/auth/reset-password?token=${resetToken}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Reset Your Password - Novraux</title>
    <!--[if mso]>
    <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <!-- Preheader text -->
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        Reset your Novraux password. Link expires in 1 hour.
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; letter-spacing: 3px; text-transform: uppercase; color: #1a1a1a; font-weight: normal;">NOVRAUX</h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">Reset your password</h2>
                            <p style="margin: 0 0 24px; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                                We received a request to reset your password for your Novraux account. Click the button below to create a new password:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 20px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #1a1a1a;">
                                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 0.5px;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Info Box -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf9f7; border-left: 4px solid #d4a574; border-radius: 4px;">
                                <tr>
      lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Verify Your Email - Novraux</title>
    <!--[if mso]>
    <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <!-- Preheader text -->
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        Welcome to Novraux! Please verify your email to get started.
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; letter-spacing: 3px; text-transform: uppercase; color: #1a1a1a; font-weight: normal;">NOVRAUX</h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 600; color: #1a1a1a;">Welcome, ${name}! 👋</h2>
                            <p style="margin: 0 0 24px; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                                Thank you for joining Novraux. We're excited to have you! To complete your registration and unlock all features, please verify your email address:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 20px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #1a1a1a;">
                                        <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 0.5px;">Verify Email Address</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Benefits Section -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 16px; font-size: 15px; color: #1a1a1a; font-weight: 600;">Once verified, you'll be able to:</p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #666666;">✓ Browse our exclusive collection</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #666666;">✓ Save items to your wishlist</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #666666;">✓ Complete secure checkout</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <p style="margin: 0; font-size: 14px; color: #666666;">✓ Track your orders</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Info Box -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf9f7; border-left: 4px solid #d4a574; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.5;">
                                            <strong style="color: #1a1a1a;">⏱️ This link will expire in 24 hours.</strong><br>
                                            If you didn't create an account with Novraux, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Fallback Link -->
                    <tr>
                        <td style="padding: 30px 40px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                                If the button above doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="${verifyUrl}" style="color: #666666; word-break: break-all; text-decoration: underline;">${verifyUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0 0 10px; font-size: 13px; color: #666666;">This email was sent to ${email}</p>
                            <p style="margin: 0 0 15px; font-size: 12px; color: #999999;">
                                Novraux &copy; ${new Date().getFullYear()}. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #999999;">
                                <a href="${SITE_URL}" style="color: #999999; text-decoration: underline;">Visit our website</a> | 
                                <a href="${SITE_URL}/contact" style="color: #999999; text-decoration: underline;">Contact support</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const text = `NOVRAUX - Welcome!

Hi ${name},

Thank you for joining Novraux! To complete your registration and unlock all features, please verify your email address by clicking the link below:

${verifyUrl}

Once verified, you'll be able to:
• Browse our exclusive collection
• Save items to your wishlist
• Complete secure checkout
• Track your orders

This link will expire in 24 hours. If you didn't create an account with Novraux, please ignore this email.

---
This email was sent to ${email}
Novraux © ${new Date().getFullYear()}. All rights reserved.
Visit our website: ${SITE_URL}
`;

    return sendEmail({
        to: email,
        subject: 'Welcome to Novraux - Verify Your Email',
        html,
        textxt = `NOVRAUX - Reset Your Password

We received a request to reset your password for your Novraux account.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

---
This email was sent to ${email}
Novraux © ${new Date().getFullYear()}. All rights reserved.
Visit our website: ${SITE_URL}
`;

    return sendEmail({
        to: email,
        subject: 'Reset Your Novraux Password',
        html,
        text,
    });
}

/**
 * Send email verification with confirmation link
 */
export async function sendVerificationEmail(email: string, firstName: string | null, verificationToken: string) {
    const verifyUrl = `${SITE_URL}/auth/verify-email?token=${verificationToken}`;
    const name = firstName || 'there';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 40px; padding-top: 20px;">
        <h1 style="font-family: 'Times New Roman', serif; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">NOVRAUX</h1>
    </div>

    <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: normal; margin-bottom: 10px;">Welcome, ${name}!</h2>
        <p style="color: #666;">Thank you for creating an account with Novraux. Please verify your email address to complete your registration:</p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 500; letter-spacing: 0.5px;">
            Verify Email Address
        </a>
    </div>

    <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #666;">
            This link will expire in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
        </p>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; margin: 0;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${verifyUrl}" style="color: #666; word-break: break-all;">${verifyUrl}</a>
        </p>
    </div>

    <div style="text-align: center; font-size: 12px; color: #999; margin-top: 40px;">
        <p>&copy; ${new Date().getFullYear()} Novraux. All rights reserved.</p>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        html,
    });
}
