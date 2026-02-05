import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getFailedLoginAttempts } from '@/lib/audit';

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
        const minutes = parseInt(searchParams.get('minutes') || '60');
        const email = searchParams.get('email');

        // Get failed login attempts
        const failedAttempts = await getFailedLoginAttempts({ minutes, email: email || undefined });

        // Group by email for summary
        const summary: Record<string, number> = {};
        for (const attempt of failedAttempts) {
            const attemptEmail = attempt.email || 'unknown';
            summary[attemptEmail] = (summary[attemptEmail] || 0) + 1;
        }

        // Flag accounts with suspicious activity
        const suspiciousAccounts = Object.entries(summary)
            .filter(([_, count]) => count >= 5) // 5+ failed attempts
            .map(([email, count]) => ({ email, failedAttempts: count }));

        return NextResponse.json({
            failedAttempts,
            summary,
            suspiciousAccounts,
            timeWindowMinutes: minutes,
            totalFailedAttempts: failedAttempts.length,
        });
    } catch (error) {
        console.error('Failed login attempts error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve failed login attempts' },
            { status: 500 }
        );
    }
}
