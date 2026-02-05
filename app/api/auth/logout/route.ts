import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/audit';

function getClientIP(req: NextRequest): string | undefined {
    return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function getUserAgent(req: NextRequest): string | undefined {
    return req.headers.get('user-agent') || undefined;
}

export async function POST(req: NextRequest) {
    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);

    try {
        // Get current session before destroying (invalidates DB session + clears cookie)
        const session = await getSession();

        await destroySession();

        // Log logout event
        if (session) {
            await logAuditEvent({
                userId: session.id,
                email: session.email,
                action: 'LOGOUT',
                ip,
                userAgent,
                status: 'success',
                metadata: {
                    userName: session.name,
                },
            });
        }
        
        return NextResponse.json(
            { success: true, message: 'Logged out successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Logout error:', error);

        // Log error
        await logAuditEvent({
            action: 'LOGOUT',
            ip,
            userAgent,
            status: 'failed',
            errorMessage: 'Error during logout',
        });

        return NextResponse.json(
            { error: 'An error occurred during logout' },
            { status: 500 }
        );
    }
}
