
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';
import { syncPrintifyProducts } from '@/lib/print-providers/printify/products';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, blueprintId, providerId, variantIds, imageUrl } = body;

        // Validation
        if (!title || !blueprintId || !providerId || !variantIds || !imageUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get Credentials
        const provider = await prisma.printProvider.findFirst({ where: { name: 'printify' } });
        if (!provider || !provider.apiKey || !provider.shopId) {
            return NextResponse.json({ error: 'Printify not configured or Shop ID missing. Run a sync first.' }, { status: 400 });
        }

        const api = new PrintifyAPI(provider.apiKey);

        // 1. Upload Image to Printify
        console.log('Uploading image to Printify...');
        const uploadRes = await api.uploadImage(imageUrl, 'design.png');
        console.log('Upload response:', uploadRes);
        
        // Printify returns { id, ... } or { data: { id, ... } }
        const imageId = uploadRes.id || uploadRes.data?.id;

        if (!imageId) {
            throw new Error(`Failed to upload image to Printify. Response: ${JSON.stringify(uploadRes)}`);
        }

        // 2. Create Product Payload
        // We put the image on the "front" print area by default for simplicity.
        // We select all chosen variants.
        // Ensure variant IDs are numbers as expected by Printify
        const variantIdsAsNumbers = variantIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
        
        if (variantIdsAsNumbers.length === 0) {
            throw new Error('No valid variant IDs provided');
        }

        const productPayload = {
            title: title,
            description: description || 'Custom Product',
            blueprint_id: Number(blueprintId),
            print_provider_id: Number(providerId),
            variants: variantIdsAsNumbers.map((id: number) => ({ id: id, price: 2000, is_enabled: true })), // Default price 20.00, can adjust later
            print_areas: [
                {
                    variant_ids: variantIdsAsNumbers,
                    placeholders: [
                        {
                            position: "front",
                            images: [
                                {
                                    id: imageId,
                                    x: 0.5,
                                    y: 0.5,
                                    scale: 1,
                                    angle: 0
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        console.log('Creating product on Printify...');
        const createdProduct = await api.createProduct(provider.shopId, productPayload);

        // 3. Publish (Optional, or user does it manually. Let's publish immediately)
        console.log('Publishing product...');
        await api.publishProduct(provider.shopId, createdProduct.id);

        // 4. Sync locally so it appears in our DB immediately
        await syncPrintifyProducts();

        return NextResponse.json({ success: true, product: createdProduct });

    } catch (error: any) {
        console.error('Create Product Error:', error.response?.data || error);
        return NextResponse.json({ error: error.message, details: error.response?.data }, { status: 500 });
    }
}
