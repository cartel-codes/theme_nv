import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserSessions, getSessionStats, cleanupExpiredSessions } from '@/lib/session-tracking';

export async function GET(req: NextRequest) {
    try {
        // Check if user is authenticated
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const action = searchParams.get('action');

        if (action === 'cleanup') {
            // Cleanup expired sessions
            const cleaned = await cleanupExpiredSessions();
            return NextResponse.json({
                message: 'Expired sessions cleaned up',
                count: cleaned,
            });
        }

        // Get current user's sessions
        const userSessions = await getUserSessions(session.id);

        // Get overall session statistics
        const stats = await getSessionStats();

        return NextResponse.json({
            currentSessions: userSessions,
            statistics: stats,
            currentSession: {
                userId: session.id,
                email: session.email,
                name: session.name,
            },
        });
    } catch (error) {
        console.error('Sessions error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve session information' },
            { status: 500 }
        );
    }
}
