import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Attempting to connect to database...');
        const products = await prisma.product.findMany({ take: 1 });
        console.log('Success! Found products:', products.length);
    } catch (e) {
        console.error('Error connecting to database:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

