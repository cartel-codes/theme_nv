import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAuditLogs, getAuditLogStats, getFailedLoginAttempts } from '@/lib/audit';

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

        // Parse query parameters
        const searchParams = req.nextUrl.searchParams;
        const action = searchParams.get('action') || undefined;
        const status = (searchParams.get('status') as 'success' | 'failed') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const days = parseInt(searchParams.get('days') || '7');

        // Get audit logs
        const logs = await getAuditLogs({
            action: action as any,
            status,
            limit,
            offset,
        });

        // Get statistics
        const stats = await getAuditLogStats(days);

        // Get recent failed login attempts
        const failedLogins = await getFailedLoginAttempts({
            minutes: 60,
            limit: 10,
        });

        return NextResponse.json({
            logs,
            stats,
            recentFailedLogins: failedLogins,
        });
    } catch (error) {
        console.error('Audit logs error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve audit logs' },
            { status: 500 }
        );
    }
}
