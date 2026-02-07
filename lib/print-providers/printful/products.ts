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

    // Fetch detailed variants only when creating a product
    const printfulAPI = new PrintfulAPI(process.env.PRINTFUL_API_KEY || '');
    const details = await printfulAPI.getProduct(parseInt(externalId));
    
    // Update print product with detailed variants
    await prisma.printProduct.update({
      where: { id: printProduct.id },
      data: {
        variants: details.variants || [],
      }
    });

    const product = await prisma.product.create({
      data: {
        ...localProductData,
        isPrintOnDemand: true,
        printProductId: printProduct.id,
      },
    });

    return {
      success: true,
      product,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
