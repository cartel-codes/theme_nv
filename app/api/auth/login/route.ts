import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
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
        const { email, password } = await req.json();

        if (!email || !password) {
            // Log failed attempt - missing credentials
            await logAuditEvent({
                email,
                action: 'LOGIN_FAILED',
                ip,
                userAgent,
                status: 'failed',
                errorMessage: 'Missing email or password',
            });

            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await authenticateAdminUser(email, password);

        if (!user) {
            // Log failed login attempt
            await logAuditEvent({
                email,
                action: 'LOGIN_FAILED',
                ip,
                userAgent,
                status: 'failed',
                errorMessage: 'Invalid credentials',
            });

            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Create DB-backed session and set cookie
        await createSession(
            {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                role: user.role,
            },
            { ip, userAgent }
        );

        // Log successful login
        await logAuditEvent({
            userId: user.id,
            email: user.email,
            action: 'LOGIN_SUCCESS',
            ip,
            userAgent,
            status: 'success',
            metadata: {
                userName: user.name,
                userRole: user.role,
            },
        });

        return NextResponse.json(
            { success: true, message: 'Logged in successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);

        // Log server error
        await logAuditEvent({
            email: (error as any)?.email,
            action: 'LOGIN_FAILED',
            ip,
            userAgent,
            status: 'failed',
            errorMessage: 'Server error during login',
        });

        return NextResponse.json(
            { error: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
