
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resource inventory...');

    // Update all inventory items to have at least 100 quantity
    const update = await prisma.inventory.updateMany({
        data: {
            quantity: 100
        }
    });

    console.log(`Updated ${update.count} inventory records to quantity 100.`);

    // Also check if any products are missing inventory records and create them
    const products = await prisma.product.findMany({
        include: {
            variants: true,
            inventory: true
        }
    });

    for (const product of products) {
        // Check main product inventory
        if (product.variants.length === 0) {
            const inv = await prisma.inventory.findFirst({
                where: { productId: product.id, variantId: null }
            });

            if (!inv) {
                console.log(`Creating inventory for product: ${product.name}`);
                await prisma.inventory.create({
                    data: {
                        productId: product.id,
                        quantity: 100
                    }
                });
            }
        }

        // Check variants
        for (const variant of product.variants) {
            const inv = await prisma.inventory.findFirst({
                where: { productId: product.id, variantId: variant.id }
            });

            if (!inv) {
                console.log(`Creating inventory for variant: ${product.name} - ${variant.name}`);
                await prisma.inventory.create({
                    data: {
                        productId: product.id,
                        variantId: variant.id,
                        quantity: 100
                    }
                });
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
