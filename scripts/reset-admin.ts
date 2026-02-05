import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@novraux.com';
    const newPassword = 'admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`Resetting password for ${email}...`);

    try {
        const user = await prisma.adminUser.update({
            where: { email },
            data: {
                password: hashedPassword,
                isActive: true
            },
        });
        console.log('Password reset successfully.');
        console.log('New credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
