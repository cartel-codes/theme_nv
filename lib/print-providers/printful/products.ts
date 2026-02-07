import { prisma } from '@/lib/prisma';
import { PrintfulAPI } from './api';

const printfulAPI = new PrintfulAPI(process.env.PRINTFUL_API_KEY || '');

// Limit to 10 products for full detail sync
const LIMIT_PRODUCTS = 10;
const BATCH_SIZE = 2; // Smaller batches for detailed fetches

export async function syncPrintfulProducts() {
  try {
    console.log('Starting Printful product sync...');

    // Get all products from Printful catalog
    const allCatalogProducts = await printfulAPI.getProducts();
    console.log(`Printful catalog has ${allCatalogProducts.length} total products`);

    // Limit to first 10 for now
    const catalogProducts = allCatalogProducts.slice(0, LIMIT_PRODUCTS);
    console.log(`Syncing first ${catalogProducts.length} products with full details`);

    // Get or create PrintProvider record
    let provider = await prisma.printProvider.findFirst({
      where: { name: 'printful' }
    });

    if (!provider) {
      provider = await prisma.printProvider.create({
        data: {
          name: 'printful',
          apiKey: process.env.PRINTFUL_API_KEY || '',
          isActive: true,
        }
      });
    }

    console.log(`Provider ID: ${provider.id}`);
    const synced = [];
    let errors = 0;

    // Process products in smaller batches with full detail fetching
    for (let i = 0; i < catalogProducts.length; i += BATCH_SIZE) {
      const batch = catalogProducts.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(catalogProducts.length / BATCH_SIZE);
      console.log(`Processing batch ${batchNum}/${totalBatches}`);

      // Process batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(async (product: any) => {
          try {
            // Fetch detailed info including variants for each product
            console.log(`  Fetching details for product ${product.id}: ${product.title}`);
            const details = await printfulAPI.getProduct(product.id);

            // Prepare image URLs
            const mockupUrls: any = {
              main: product.image,
              variants: details.variants?.slice(0, 3).map((v: any) => v.image) || [],
            };

            // Prepare variants data with images
            const variantsData = details.variants?.map((v: any) => ({
              id: v.id,
              name: v.name,
              size: v.size,
              color: v.color,
              colorCode: v.color_code,
              image: v.image,
              price: v.price,
              inStock: v.in_stock,
              availability: v.availability_status,
            })) || [];

            // Store in database with full details
            const printProduct = await prisma.printProduct.upsert({
              where: {
                providerId_externalId: {
                  providerId: provider.id,
                  externalId: product.id.toString(),
                },
              },
              create: {
                providerId: provider.id,
                externalId: product.id.toString(),
                name: product.title || product.name,
                description: product.description || null,
                variants: variantsData,
                mockupUrls,
                syncedAt: new Date(),
                isPublished: false,
              },
              update: {
                name: product.title || product.name,
                description: product.description || null,
                variants: variantsData,
                mockupUrls,
                syncedAt: new Date(),
              },
            });

            console.log(`  ✓ Synced product ${product.id} with ${variantsData.length} variants`);
            return { success: true, product: printProduct };
          } catch (error: any) {
            console.error(`✗ Error syncing product ${product.id}:`, error.message);
            return { success: false, error: error.message };
          }
        })
      );

      // Process results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            synced.push(result.value.product);
          } else {
            errors++;
          }
        } else {
          errors++;
          console.error('Promise rejected:', result.reason);
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < catalogProducts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✓ Sync completed. Synced: ${synced.length}, Errors: ${errors}`);

    return {
      success: true,
      count: synced.length,
      total: LIMIT_PRODUCTS,
      totalAvailable: allCatalogProducts.length,
      errors,
      message: `Successfully synced ${synced.length}/${LIMIT_PRODUCTS} products with full details`,
    };
  } catch (error: any) {
    console.error('Failed to sync Printful products:', error);
    return {
      success: false,
      error: error.message,
      count: 0,
    };
  }
}

export async function getPrintfulProducts(page: number = 1, pageSize: number = 5) {
  try {
    const skip = (page - 1) * pageSize;

    // Get total count
    const total = await prisma.printProduct.count();;

    // Get paginated products
    const products = await prisma.printProduct.findMany({
      include: {
        provider: true,
      },
      orderBy: {
        syncedAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      products,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      products: [],
      pagination: {
        current: 1,
        pageSize: 5,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export async function createProductFromPrintful(
  externalId: string,
  localProductData: any
) {
  try {
    const printProduct = await prisma.printProduct.findFirst({
      where: { externalId },
    });

    if (!printProduct) {
      throw new Error('Print product not found. Sync catalog first.');
    }

    // 1. Fetch detailed variants from Printful
    const printfulAPI = new PrintfulAPI(process.env.PRINTFUL_API_KEY || '');
    const details = await printfulAPI.getProduct(parseInt(externalId));

    // Update print product with detailed variants
    await prisma.printProduct.update({
      where: { id: printProduct.id },
      data: {
        variants: details.variants || [],
      }
    });

    // 2. Filter Variants based on user selection
    const selectedIds = localProductData.selectedVariantIds; // Array of IDs
    const variantsToCreate = selectedIds && Array.isArray(selectedIds)
      ? details.variants.filter((v: any) => selectedIds.includes(v.id))
      : details.variants; // Default to all if none specified

    if (variantsToCreate.length === 0) {
      throw new Error('No variants selected for import.');
    }

    // 3. Generate SEO Data via AI
    const baseName = localProductData.name || printProduct.name;
    const baseDesc = localProductData.description || printProduct.description || '';
    const mainImage = printProduct.mockupUrls && typeof printProduct.mockupUrls === 'object' && 'main' in printProduct.mockupUrls
      ? (printProduct.mockupUrls as any).main
      : undefined;

    let seoData: any = {};
    try {
      const { generateSEOWithAI } = await import('@/lib/ai');
      seoData = await generateSEOWithAI(baseName, baseDesc, 'product', mainImage);
    } catch (e) {
      console.error('AI SEO Generation failed, falling back to basic data:', e);
      // Fallback if AI fails
      seoData = {
        metaTitle: baseName,
        metaDescription: baseDesc.substring(0, 160),
        suggestedSlug: baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        keywords: localProductData.keywords || ''
      };
    }

    // 3. Prepare Product Data
    const slug = localProductData.slug || seoData.suggestedSlug || baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    const finalPrice = localProductData.price ? parseFloat(localProductData.price) : 0; // 0 implies needs pricing

    // 4. Create Product with Variants and Inventory
    const product = await prisma.product.create({
      data: {
        name: baseName,
        slug: slug, // AI or generated slug
        description: baseDesc,
        price: finalPrice,
        imageUrl: mainImage,
        isPrintOnDemand: true,
        printProductId: printProduct.id,
        // Images (Gallery)
        images: {
          create: [
            // Create primary image
            ...(mainImage ? [{
              url: mainImage,
              alt: baseName,
              isPrimary: true,
              order: 0
            }] : []),
            // Create variant images from mockupUrls
            ...(
              (printProduct.mockupUrls as any)?.variants?.map((url: string, index: number) => ({
                url: url,
                alt: `${baseName} - Variant ${index + 1}`,
                isPrimary: false,
                order: index + 1
              })) || []
            )
          ]
        },
        // SEO Fields
        metaTitle: seoData.metaTitle || baseName,
        metaDescription: seoData.metaDescription || baseDesc.substring(0, 160),
        keywords: seoData.keywords || '',
        focusKeyword: seoData.focusKeyword || '',
        // Create Variants from Printful Data
        variants: {
          create: variantsToCreate?.map((v: any) => {
            // Determine structure
            const hasColor = v.color && v.color !== 'null';
            const hasSize = v.size && v.size !== 'null';

            let variantName = 'Option';
            let variantValue = 'Standard';

            if (hasColor && hasSize) {
              variantName = 'Color / Size';
              variantValue = `${v.color} / ${v.size}`;
            } else if (hasColor) {
              variantName = 'Color';
              variantValue = v.color;
            } else if (hasSize) {
              variantName = 'Size';
              variantValue = v.size;
            }

            return {
              name: variantName, // This defines the Option Keys (e.g. "Color / Size")
              value: variantValue, // This defines the values (e.g. "Red / XL")
              sku: `POD-${externalId}-${v.id}`,
              price: finalPrice,
            };
          }) || []
        }
      },
      include: {
        variants: true,
      }
    });

    // 5. Create Inventory for Variants
    // Map SKU to stock status from Printful details
    const stockMap = new Map();
    details.variants?.forEach((v: any) => {
      stockMap.set(`POD-${externalId}-${v.id}`, v.in_stock);
    });

    if (product.variants && product.variants.length > 0) {
      await Promise.all(product.variants.map(v => {
        const inStock = stockMap.get(v.sku);
        return prisma.inventory.create({
          data: {
            productId: product.id,
            variantId: v.id,
            quantity: inStock ? 999 : 0,
            reorderLevel: 0
          }
        });
      }));
    } else {
      // Fallback: Create generic inventory for product
      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: 999,
          reorderLevel: 0
        }
      });
    }

    // Mark as published in PrintProduct
    await prisma.printProduct.update({
      where: { id: printProduct.id },
      data: { isPublished: true }
    });

    return {
      success: true,
      product,
    };
  } catch (error: any) {
    console.error('Failed to publish POD product:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
