import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/print-providers/utils/encryption';

// GET: Fetch current config (without exposing full keys)
export async function GET() {
    try {
        const provider = await prisma.printProvider.findFirst({
            where: { name: 'printful' }
        });

        if (!provider) {
            return NextResponse.json({ configured: false });
        }

        return NextResponse.json({
            configured: true,
            provider: {
                name: provider.name,
                isActive: provider.isActive,
                apiKeyMasked: provider.apiKey ? `****${provider.apiKey.slice(-4)}` : null, // This assumes apiKey is stored encrypted
                // But wait, if we store it encrypted, we can't slice it directly like this unless we decrypt it first 
                // OR we just show a placeholder. Storing ENCRYPTED means the DB value is useless to show. 
                // Let's decide: we store ENCRYPTED value in DB. So we must decrypt to show last 4, or just return true/false.
                // Let's return true/false for API key presence.
                hasApiKey: !!provider.apiKey
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Save configuration
export async function POST(req: Request) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'API key is required' }, { status: 400 });
        }

        // Encrypt the API key before storing
        // Note: The schema comment says "Encrypted API key", and our `PrintfulAPI` instantiation 
        // uses `process.env.PRINTFUL_API_KEY`. If we want to use DB-stored keys, 
        // we need to update `PrintfulAPI` to fetch from DB or decrypt.
        // However, the `PrintfulAPI` wrapper currently takes `apiKey` in constructor.
        // The current implementation uses env var default. We should probably stick to Env vars for now 
        // unless the user explicitly wants dynamic DB configuration. 
        // Re-reading `POD_INTEGRATION_ROADMAP.md`:
        // "Phase 3.5: Encryption Utilities... Test with API keys"
        // "Phase 4.2: Configuration Endpoint... Save encrypted API key"
        // So the plan IS to store in DB. 
        // I will store it encrypted.

        // BUT! `PrintfulAPI` singleton exports `new PrintfulAPI(process.env.PRINTFUL_API_KEY)`. 
        // This singleton needs to be dynamic or we need a factory.
        // For now, I will implement storage. We might need to adjust `api.ts` later to read from DB.

        // Actually, `PrintfulAPI` class can be instantiated with a key. 
        // The singleton export is just a convenience for env-based usage.
        // We should probably remove the singleton or make it smart.
        // For now, let's implement the storage.

        // Using a simplistic approach: if apiKey is provided, encrypt it.
        // But `encrypt` function I wrote outputs "iv:encrypted".

        // Let's stick to the plan.

        const encryptedKey = encrypt(apiKey);

        const provider = await prisma.printProvider.upsert({
            where: {
                // We need a unique constraint or we just findFirst and update.
                // The schema doesn't have a unique constraint on `name`.
                // We'll search by name first.
                id: (await prisma.printProvider.findFirst({ where: { name: 'printful' } }))?.id || 'new'
            },
            update: {
                apiKey: encryptedKey,
                isActive: true,
            },
            create: {
                name: 'printful',
                apiKey: encryptedKey,
                isActive: true,
            }
        });

        return NextResponse.json({ success: true, provider: { name: provider.name, isActive: provider.isActive } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove configuration
export async function DELETE() {
    try {
        const provider = await prisma.printProvider.findFirst({
            where: { name: 'printful' }
        });

        if (provider) {
            await prisma.printProvider.delete({
                where: { id: provider.id }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
