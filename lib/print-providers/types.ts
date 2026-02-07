export interface PODProvider {
    name: string;
    apiKey: string;
}

export interface PODProduct {
    id: string;
    external_id: string;
    name: string;
    variants: PODVariant[];
}

export interface PODVariant {
    id: string;
    external_id: string;
    product_id: string;
    name: string;
    size?: string;
    color?: string;
    image?: string;
    price: number;
    in_stock: boolean;
}

export interface PODOrder {
    external_id: string;
    status: string;
    recipient: {
        name: string;
        address1: string;
        address2?: string;
        city: string;
        state_code?: string;
        country_code: string;
        zip: string;
        phone?: string;
        email?: string;
    };
    items: PODOrderItem[];
}

export interface PODOrderItem {
    variant_id: string; // The provider's variant ID
    quantity: number;
    retail_price?: string; // Optional, for packing slip
    files?: {
        type?: string;
        url: string;
        filename?: string;
    }[];
}

export interface PODWebhookEvent {
    type: string;
    created: number;
    data: any;
}

export type OrderStatus = 'draft' | 'pending' | 'failed' | 'canceled' | 'fulfilled';
