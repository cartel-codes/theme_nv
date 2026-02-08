
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from './api';
import { resolvePrintifyApiKey } from './auth';

// This is the token the user provided. 
// Ideally we store this via Admin UI, but for initial setup we hardcode/seed it or use it if provided.
// Since the user GAVE it to me, I'll update the DB record with it during sync.
const PROVIDED_API_KEY = process.env.PRINTIFY_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6IjFkYzJlNmNiMjQzNTMyZjUwYjQ4YzEzYjgyYzE5M2E2MmUxMWQ3M2U5YTJkY2EwZWM2OGUyMWRkODQ0ODViY2VhNDVjZDlhMDhhODdlZDg4IiwiaWF0IjoxNzcwNDQyNTAxLjMyMDgxNCwibmJmIjoxNzcwNDQyNTAxLjMyMDgxNSwiZXhwIjoxODAxOTc4NTAxLjMxMjU5MSwic3ViIjoiMjYzMDAwMTUiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.CnF8rZ7aBj4AdjeHRQ9zPaN0CV4q4J43rwCR7Qy-fB0-V2ppHLfWjwLuk4B5mNNDhbI9ifvFxY9ddHFLALRUQ1lLnQtetN_No03EWM3PSFgTjCYUYk4ly16NDTNt_h8L-Mns6DYRG8hwfJlVo80XtBmrLzNka0--k2lPd62YE_vtUFaiXeY-wyP5CrVb_sH6CPBkSKFNYI5gdfxyVGMyVVZ6fwsU6TYC03MBHDZL0ikFIfqBYCjGBNXW1dYGXrEGUfcDpTy_hifVZ3aPepz-PxcySi6bLIdt85FLtNOc2K5mZdq5_Av68_yaOCFQvmMaykOjVuzYrQAWhC1mBBD35osUM9YGf_dWjBrD6abtt-mJV77QEiYtzlN0jFGnmGshBCvk_7KVEsmFleaqGkW_r6beSUOq89W45TvK-Y9z5sA20Sp6EuK9BP4ACkUnJAATlSVo-p-BzN6bKbOnCx9eh4s45MZlsrqGjlLgVcitw_vnBCs7gKG7OZEUw_aEDAjA3VVx-8EakiI13scMJLi8778_IbPO0xxScs5NjlQxQxKVVtg29DejzV6cd9cMHGTJfqy6pof7DMkM4A1f0OKC60P9CzisT-JMPyjU6icGO2uWPeQ05Efmkc6urks967zu2W1RRJADR3Yr32aYJ9nWEecyNA7-d6c6sGXSxZtQUpM';

export async function syncPrintifyProducts() {
    try {
        console.log('Starting Printify Sync...');

        // 1. Get or Create Provider in DB
        let provider = await prisma.printProvider.findFirst({
            where: { name: 'printify' }
        });

        if (!provider) {
            provider = await prisma.printProvider.create({
                data: {
                    name: 'printify',
                    apiKey: PROVIDED_API_KEY,
                    isActive: true,
                }
            });
        } else if (provider.apiKey !== PROVIDED_API_KEY) {
            // Update key if different (user provided new one)
            provider = await prisma.printProvider.update({
                where: { id: provider.id },
                data: { apiKey: PROVIDED_API_KEY }
            });
        }

        const apiKey = resolvePrintifyApiKey(provider.apiKey);
        const api = new PrintifyAPI(apiKey);

        // 2. Get Shop ID
        let shopId = provider.shopId;
        if (!shopId) {
            const shops = await api.getShops();
            if (shops.length === 0) throw new Error('No Printify Shops found. Create a store in Printify first.');
            shopId = shops[0].id.toString(); // Printify shop IDs are numbers

            // Save shop ID preference
            await prisma.printProvider.update({
                where: { id: provider.id },
                data: { shopId }
            });
        }

        console.log(`Syncing from Shop ID: ${shopId}`);

        // 3. Fetch Products
        const result = await api.getProducts(shopId!);
        const products = result.data || result; // Handle both { data: [...] } and direct array responses

        console.log(`Found ${products.length} products.`);
        let syncedCount = 0;

        for (const p of products) {
            // Map Variants
            // Printify variants have "options" array [123, 456] mapping to p.options values

            const variantsData = p.variants.map((v: any) => {
                // Construct Name (e.g. "Black / L")
                const optionValues = v.options.map((optId: string) => {
                    // Find the option definition
                    for (const def of p.options) {
                        const val = def.values.find((val: any) => val.id === optId);
                        if (val) return val.title;
                    }
                    return '';
                }).filter(Boolean).join(' / ');

                return {
                    id: v.id.toString(),
                    name: optionValues || 'Default',
                    sku: v.sku,
                    price: v.price / 100, // Printify is in cents
                    inStock: v.is_available,
                    image: null, // Printify variants don't always have distinct images in the 'variants' array, usually at product level options. Keeping simple for now.
                };
            });

            // Find main image
            const mainImage = p.images.find((i: any) => i.is_default)?.src || p.images[0]?.src;

            // Upsert
            await prisma.printProduct.upsert({
                where: {
                    providerId_externalId: {
                        providerId: provider!.id,
                        externalId: p.id
                    }
                },
                create: {
                    providerId: provider!.id,
                    externalId: p.id,
                    name: p.title,
                    description: p.description,
                    mockupUrls: { main: mainImage, all: p.images.map((i: any) => i.src) },
                    variants: variantsData,
                    syncedAt: new Date(),
                    isPublished: p.visible,
                },
                update: {
                    name: p.title,
                    description: p.description,
                    mockupUrls: { main: mainImage, all: p.images.map((i: any) => i.src) },
                    variants: variantsData,
                    syncedAt: new Date(),
                    isPublished: p.visible
                }
            });
            syncedCount++;
        }

        return { success: true, count: syncedCount };

    } catch (error: any) {
        console.error('Printify Sync Failed:', error);
        return { success: false, error: error.message };
    }
}

export async function createProductFromPrintify(
    externalId: string,
    localProductData: any
) {
    try {
        const printProduct = await prisma.printProduct.findFirst({
            where: { externalId },
            include: { provider: true }
        });

        if (!printProduct) {
            throw new Error('Print product not found. Sync catalog first.');
        }

        // 1. Fetch detailed variants from Printify if needed
        // (Printify variants are already synced in syncPrintifyProducts, 
        // but we can ensure they are fresh if necessary. For now we use synced variants)
        const variantsToSync: any[] = Array.isArray(printProduct.variants) ? printProduct.variants as any[] : [];

        // 2. Filter Variants based on user selection
        const selectedIds = localProductData.selectedVariantIds; // Array of IDs (strings in Printify)
        const variantsToCreate = selectedIds && Array.isArray(selectedIds)
            ? variantsToSync.filter((v: any) => selectedIds.includes(v.id))
            : variantsToSync;

        if (variantsToCreate.length === 0) {
            throw new Error('No variants selected for import.');
        }

        // 3. Prepare SEO and Metadata
        const baseName = localProductData.name || printProduct.name;
        const baseDesc = localProductData.description || printProduct.description || '';
        const mainImage = (printProduct.mockupUrls as any)?.main;

        // Reuse AI SEO if present in request, else generate
        let seoData = localProductData.seo || {};
        if (!seoData.metaTitle) {
            try {
                const { generateSEOWithAI } = await import('@/lib/ai');
                seoData = await generateSEOWithAI(baseName, baseDesc, 'product', mainImage);
            } catch (e) {
                console.error('AI SEO Generation failed:', e);
                seoData = {
                    metaTitle: baseName,
                    metaDescription: baseDesc.substring(0, 160),
                    suggestedSlug: baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                };
            }
        }

        const slug = localProductData.slug || seoData.suggestedSlug || baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
        const finalPrice = localProductData.price ? parseFloat(localProductData.price) : 0;

        // 4. Create Product
        const product = await prisma.product.create({
            data: {
                name: baseName,
                slug: slug,
                description: baseDesc,
                price: finalPrice,
                imageUrl: mainImage,
                isPrintOnDemand: true,
                isPublished: localProductData.isPublished === true,
                printProductId: printProduct.id,
                // SEO
                metaTitle: seoData.metaTitle || baseName,
                metaDescription: seoData.metaDescription || baseDesc.substring(0, 160),
                keywords: seoData.keywords || '',
                focusKeyword: seoData.focusKeyword || '',
                // Variants
                variants: {
                    create: variantsToCreate.map((v: any) => ({
                        name: 'Variant',
                        value: v.name || 'Default',
                        sku: v.sku || `PRTY-${externalId}-${v.id}`,
                        price: finalPrice, // Usually price is set per product in our simple model
                    }))
                },
                // Images
                images: {
                    create: (printProduct.mockupUrls as any)?.all?.map((url: string, index: number) => ({
                        url,
                        alt: `${baseName} - View ${index + 1}`,
                        isPrimary: index === 0,
                        order: index
                    })) || []
                }
            },
            include: { variants: true }
        });

        // 5. Inventory
        if (product.variants && product.variants.length > 0) {
            await Promise.all(product.variants.map(v => {
                return prisma.inventory.create({
                    data: {
                        productId: product.id,
                        variantId: v.id,
                        quantity: 999, // POD typically has high "virtual" stock
                        reorderLevel: 0
                    }
                });
            }));
        }

        // 6. Mark as published
        await prisma.printProduct.update({
            where: { id: printProduct.id },
            data: { isPublished: true }
        });

        return { success: true, product };

    } catch (error: any) {
        console.error('Failed to publish Printify product:', error);
        return { success: false, error: error.message };
    }
}
