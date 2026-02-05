import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, updateUserSessionActivity, updateUserPassword, comparePassword } from '@/lib/user-auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/change-password
 * Change user password
 */
export async function POST(req: NextRequest) {
    try {
        const sessionToken = req.cookies.get('userSession')?.value;

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get session
        const session = await getUserSession(sessionToken);
        if (!session) {
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current and new passwords are required' },
                { status: 400 }
            );
        }

        // Get full user with password for comparison
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid current password' },
                { status: 400 }
            );
        }

        // Update password
        await updateUserPassword(session.userId, newPassword);

        // Update activity
        await updateUserSessionActivity(sessionToken);

        return NextResponse.json({
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('[API] Change password error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
