
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';
import { syncPrintifyProducts } from '@/lib/print-providers/printify/products';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, blueprintId, providerId, variantIds, imageUrl } = body;

        console.log('� === BACKEND RECEIVED ===');
        console.log('Full body:', body);
        console.log('Fields:');
        console.log('  - title:', title, '(exists:', !!title + ')');
        console.log('  - description:', description, '(exists:', !!description + ')');
        console.log('  - blueprintId:', blueprintId, '(exists:', !!blueprintId + ')');
        console.log('  - providerId:', providerId, '(exists:', !!providerId + ')');
        console.log('  - variantIds:', variantIds, '(length:', variantIds?.length + ')');
        console.log('  - imageUrl:', imageUrl ? 'YES (length: ' + imageUrl.substring(0, 50) + '...)' : 'NO');

        // Comprehensive Validation
        const errors = [];

        if (!title || title.trim() === '') {
            errors.push('title is required and cannot be empty');
        }
        if (!description || description.trim() === '') {
            errors.push('description is required and cannot be empty');
        }
        if (!blueprintId) {
            errors.push('blueprintId is required');
        }
        if (!providerId) {
            errors.push('providerId is required');
        }
        if (!imageUrl) {
            errors.push('imageUrl is required');
        }
        if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
            errors.push('variantIds must be a non-empty array');
        }

        if (errors.length > 0) {
            console.error('❌ Validation errors:', errors);
            return NextResponse.json({
                error: 'Validation failed: ' + errors.join('; '),
                details: errors,
                status: 'validation_error'
            }, { status: 400 });
        }

        // Get Credentials
        const provider = await prisma.printProvider.findFirst({ where: { name: 'printify' } });
        if (!provider || !provider.apiKey || !provider.shopId) {
            return NextResponse.json({ error: 'Printify not configured or Shop ID missing. Run a sync first.' }, { status: 400 });
        }

        const api = new PrintifyAPI(provider.apiKey);

        // 1. Upload Image to Printify
        console.log('🖼️ Uploading image to Printify...');
        const uploadRes = await api.uploadImage(imageUrl, 'design.png');
        console.log('Upload response:', uploadRes);

        // Printify returns { id, ... } or { data: { id, ... } }
        const imageId = uploadRes.id || uploadRes.data?.id;

        if (!imageId) {
            throw new Error(`Failed to upload image to Printify. Response: ${JSON.stringify(uploadRes)}`);
        }

        console.log('✓ Image uploaded with ID:', imageId);

        // 2. Create Product Payload
        // Ensure variant IDs are numbers as expected by Printify
        const variantIdsAsNumbers = variantIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));

        if (variantIdsAsNumbers.length === 0) {
            throw new Error('No valid variant IDs provided after conversion');
        }

        console.log('✓ Converted variant IDs:', variantIdsAsNumbers);

        // Build product payload with all required Printify fields
        const productPayload: any = {
            title: title.trim(),
            description: description.trim(),
            blueprint_id: Number(blueprintId),
            print_provider_id: Number(providerId),
            variants: variantIdsAsNumbers.map((id: number) => ({
                id: id,
                price: 2000, // $20.00 in cents
                is_enabled: true
            })),
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
            ],
            // MANDATORY: Even if empty, these are often required by the validation schema
            tags: body.tags && body.tags.length > 0 ? body.tags : ['novraux-exclusive', 'ai-designed'],
            images: [], // Explicitly empty array for product-level images (we use print_areas)
        };

        // Add optional SEO if present
        if (body.seo) {
            productPayload.seo = body.seo;
        }

        console.log('📦 PRE-FLIGHT CHECK:');
        console.log('  - Blueprint ID:', productPayload.blueprint_id, `(type: ${typeof productPayload.blueprint_id})`);
        console.log('  - Provider ID:', productPayload.print_provider_id, `(type: ${typeof productPayload.print_provider_id})`);
        console.log('  - Variants Count:', productPayload.variants.length);
        console.log('  - First Variant ID:', productPayload.variants[0]?.id);

        console.log('📦 Final Robust Payload for Printify:', JSON.stringify(productPayload, null, 2));

        const createdProduct = await api.createProduct(provider.shopId, productPayload);

        console.log('✓ Product successfully created on Printify. ID:', createdProduct.id);

        // 3. Publish
        console.log('📤 Publishing product...');
        try {
            await api.publishProduct(provider.shopId, createdProduct.id);
            console.log('✓ Product published');
        } catch (publishErr: any) {
            console.warn('⚠️ Product created but publication failed:', publishErr.message);
            // We don't fail the whole request if publish fails, since product is created
        }

        // 4. Sync locally
        console.log('🔄 Syncing products locally...');
        try {
            await syncPrintifyProducts();
        } catch (syncErr: any) {
            console.warn('⚠️ Sync failed but product exists on Printify:', syncErr.message);
        }

        return NextResponse.json({ success: true, product: createdProduct });

    } catch (error: any) {
        console.error('❌ Create Product Process Failed');

        // Extract Printify error details if available
        const printifyError = error.response?.data;
        const errorMessage = printifyError?.message || error.message || 'Unknown error occurred';
        const errorDetails = printifyError?.errors || null;

        console.error('Error Message:', errorMessage);
        if (errorDetails) {
            console.error('Detailed Errors:', JSON.stringify(errorDetails, null, 2));
        }

        // Return a structured error response that the UI can swallow and explain
        return NextResponse.json({
            error: errorMessage,
            details: errorDetails,
            code: printifyError?.code || (errorMessage.includes('8150') ? 8150 : 500),
            status: 'error'
        }, { status: 500 });
    }
}
