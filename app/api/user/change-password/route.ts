import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, updateUserPassword, comparePassword, createUserSession, invalidateAllUserSessions, logUserAuditEvent } from '@/lib/user-auth';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/password-validation';
import { checkRateLimit, PASSWORD_CHANGE_RATE_LIMIT } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/change-password
 * Change user password with strength validation and session rotation
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

        // ── Rate limit password changes ──
        const rateCheck = checkRateLimit(`password:${session.userId}`, PASSWORD_CHANGE_RATE_LIMIT);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many password change attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current and new passwords are required' },
                { status: 400 }
            );
        }

        // ── Password strength validation ──
        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.valid) {
            return NextResponse.json(
                { error: passwordCheck.errors[0], errors: passwordCheck.errors },
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
            await logUserAuditEvent({
                userId: session.userId,
                email: user.email,
                action: 'PASSWORD_CHANGE',
                status: 'failed',
                errorMessage: 'Invalid current password',
                ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
                userAgent: req.headers.get('user-agent') || undefined,
            });

            return NextResponse.json(
                { error: 'Invalid current password' },
                { status: 400 }
            );
        }

        // Update password
        await updateUserPassword(session.userId, newPassword);

        // ── Session rotation: invalidate all old sessions, create fresh one ──
        await invalidateAllUserSessions(session.userId);
        const newSession = await createUserSession(
            session.userId,
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
            req.headers.get('user-agent') || undefined
        );

        await logUserAuditEvent({
            userId: session.userId,
            email: user.email,
            action: 'PASSWORD_CHANGE',
            status: 'success',
            ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
            userAgent: req.headers.get('user-agent') || undefined,
        });

        const response = NextResponse.json({
            message: 'Password updated successfully. All other sessions have been logged out.',
        });

        // Set new session cookie
        response.cookies.set({
            name: 'userSession',
            value: newSession.sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('[API] Change password error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
