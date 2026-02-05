import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

/**
 * Create a new admin user
 */
export async function createAdminUser(
    email: string,
    password: string,
    username: string
) {
    const hashedPassword = await hashPassword(password);

    return prisma.adminUser.create({
        data: {
            email,
            password: hashedPassword,
            username,
        } as any,
    });
}

/**
 * Authenticate admin user with email and password
 */
export async function authenticateAdminUser(email: string, password: string) {
    const user = await prisma.adminUser.findUnique({
        where: { email },
    });

    if (!user || !user.isActive) {
        return null;
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
        return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Get admin user by ID
 */
export async function getAdminUserById(id: string) {
    const user = await prisma.adminUser.findUnique({
        where: { id },
    });

    if (!user) {
        return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Update admin user password
 */
export async function updateAdminUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);

    return prisma.adminUser.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
}

/**
 * Update admin user profile (name, email)
 */
export async function updateAdminUserProfile(
    userId: string,
    data: { username?: string; email?: string }
) {
    const updateData: { username?: string; email?: string } = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;

    if (Object.keys(updateData).length === 0) {
        return getAdminUserById(userId);
    }

    const user = await prisma.adminUser.update({
        where: { id: userId },
        data: updateData,
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
