import { NextResponse } from 'next/server';
import { handleWebhookEvent } from '@/lib/print-providers/printful/webhooks';

// POST: Printful Webhook
export async function POST(req: Request) {
    try {
        // Printful doesn't sign requests by default unless configured, but for security 
        // we should ideally check a secret query param or header if we set one up.
        // For now, we'll just process the body.

        const body = await req.json();

        // Verify event structure
        if (!body.type || !body.data || !body.created) {
            return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
        }

        const result = await handleWebhookEvent(body);

        if (!result.success) {
            // We might want to return 200 anyway to prevent Printful from retrying indefinitely 
            // for logic errors, but return 500 for transient errors.
            console.error('Webhook processing failed:', result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
