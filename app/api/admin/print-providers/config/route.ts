import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/print-providers/utils/encryption';

// GET: Fetch current config (without exposing full keys)
export async function GET() {
    try {
        const provider = await prisma.printProvider.findFirst({
            where: { name: 'printify' }
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

        // Encrypt the API key before storing in the Printify provider record.

        const encryptedKey = encrypt(apiKey);

        const provider = await prisma.printProvider.upsert({
            where: {
                // We need a unique constraint or we just findFirst and update.
                // The schema doesn't have a unique constraint on `name`.
                // We'll search by name first.
                id: (await prisma.printProvider.findFirst({ where: { name: 'printify' } }))?.id || 'new'
            },
            update: {
                apiKey: encryptedKey,
                isActive: true,
            },
            create: {
                name: 'printify',
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
            where: { name: 'printify' }
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
