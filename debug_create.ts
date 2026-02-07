
import { prisma } from './lib/prisma';
import { PrintifyAPI } from './lib/print-providers/printify/api';

async function main() {
    console.log('--- Debugging Creation ---');

    // 1. Check Provider Config
    const provider = await prisma.printProvider.findFirst({ where: { name: 'printify' } });
    if (!provider) { console.error('Provider not found in DB'); return; }

    console.log(`Provider Found. Shop ID: ${provider.shopId}`);
    if (!provider.shopId) {
        console.error('ERROR: Shop ID is missing. Please run Sync Catalog first to populate it.');
        // Try to fetch it manually to unblock testing
        const apiInit = new PrintifyAPI(provider.apiKey);
        const shops = await apiInit.getShops();
        if (shops.length > 0) {
            console.log(`Found Shop manually: ${shops[0].id}. Using it.`);
            provider.shopId = shops[0].id.toString();
        } else {
            return;
        }
    }

    const api = new PrintifyAPI(provider.apiKey);

    // 2. Test Image Upload
    const imageUrl = 'https://placehold.co/600x600.png'; // Simple valid image
    console.log(`Uploading Image: ${imageUrl}`);

    let imageId;
    try {
        const uploadRes = await api.uploadImage(imageUrl, 'debug_image.png');
        console.log('Upload Success:', uploadRes);
        imageId = uploadRes.id;
    } catch (e: any) {
        console.error('Upload Failed:', e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
        return;
    }

    // 3. Test Create Product
    // Use a known successful blueprint if possible, or fetch one
    const blueprintId = 5; // Unisex Cotton Crew Tee
    const providerId = 41; // Duplium
    // Need valid variants for this combo.
    console.log('Fetching variants for Blueprint 3, Provider 29...');

    try {
        const variantsData = await api.getBlueprintVariants(blueprintId, providerId);
        const firstVariantId = variantsData.variants[0].id;
        console.log(`Using Variant ID: ${firstVariantId}`);

        const payload = {
            title: 'Debug Create Product',
            description: 'Created via Debug Script',
            blueprint_id: blueprintId,
            print_provider_id: providerId,
            variants: [
                { id: firstVariantId, price: 2000, is_enabled: true }
            ],
            print_areas: [
                {
                    variant_ids: [firstVariantId],
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

        console.log('Sending Create Request...');
        const result = await api.createProduct(provider.shopId!, payload);
        console.log('Create Success!', result.id);

    } catch (e: any) {
        console.error('Create Failed:', e.message);
        if (e.response) console.error('Details:', JSON.stringify(e.response.data, null, 2));
    }
}

main();
