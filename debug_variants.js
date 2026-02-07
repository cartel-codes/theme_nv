
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching products with variants...");
    const products = await prisma.product.findMany({
        take: 5,
        include: {
            variants: true
        }
    });

    if (products.length === 0) {
        console.log("No products found.");
    } else {
        products.forEach(p => {
            console.log(`Product: ${p.name} (ID: ${p.id})`);
            if (p.variants.length === 0) {
                console.log("  - No variants found.");
            } else {
                p.variants.forEach(v => {
                    console.log(`  - Variant: Name='${v.name}', Value='${v.value}', SKU='${v.sku}'`);
                });
            }
        });
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
