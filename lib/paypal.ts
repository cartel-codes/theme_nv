const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal Access Token using Client ID and Secret
 */
export async function getPayPalAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error('PayPal credentials are missing');
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal Auth Error:', errorData);
        throw new Error('Failed to authenticate with PayPal');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Generic function to call PayPal API
 */
export async function callPayPalAPI(endpoint: string, method: 'POST' | 'GET' | 'PATCH' = 'GET', body?: any) {
    const token = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error(`PayPal API Error (${endpoint}):`, data);
        throw new Error(data.message || 'PayPal API request failed');
    }

    return data;
}
