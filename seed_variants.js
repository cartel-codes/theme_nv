
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding variants for products...");

    const products = await prisma.product.findMany();

    if (products.length === 0) {
        console.log("No products found to seed.");
        return;
    }

    const colors = ['Obsidian', 'Gold', 'Bone'];
    const sizes = ['S', 'M', 'L'];

    // Ensure default warehouse exists
    let warehouse = await prisma.warehouse.findFirst({ where: { name: 'Main Warehouse' } });
    if (!warehouse) {
        warehouse = await prisma.warehouse.create({
            data: {
                name: 'Main Warehouse',
                country: 'US',
                isActive: true
            }
        });
        console.log('Created default warehouse.');
    }

    for (const product of products) {
        console.log(`Processing ${product.name}...`);

        // Check if variants exist
        const count = await prisma.productVariant.count({
            where: { productId: product.id }
        });

        if (count > 0) {
            console.log(`  - Already has variants. Skipping.`);
            continue;
        }

        // Create variants
        console.log(`  - Creating variants...`);

        const variants = [];

        for (const color of colors) {
            for (const size of sizes) {
                variants.push({
                    productId: product.id,
                    name: "Color / Size",
                    value: `${color} / ${size}`,
                    sku: `${product.slug}-${color.substring(0, 3)}-${size}`.toUpperCase().substring(0, 30),
                    price: product.price,
                    inventory: {
                        create: {
                            quantity: Math.floor(Math.random() * 20),
                            product: { connect: { id: product.id } },
                            warehouse: { connect: { id: warehouse.id } }
                        }
                    }
                });
            }
        }

        for (const v of variants) {
            try {
                await prisma.productVariant.create({
                    data: v
                });
            } catch (e) {
                console.error(`Failed to create variant ${v.sku}:`, e.message);
            }
        }
        console.log(`  - Added ${variants.length} variants.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
