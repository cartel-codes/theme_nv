import { decrypt } from '@/lib/print-providers/utils/encryption';

export function resolvePrintifyApiKey(apiKey?: string | null): string {
    if (!apiKey) {
        throw new Error('Printify API key is missing. Configure it in admin settings.');
    }

    if (!apiKey.includes(':')) {
        return apiKey;
    }

    try {
        return decrypt(apiKey);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to decrypt Printify API key. ${message}`);
    }
}
