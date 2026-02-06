import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/audit';
import { checkRateLimit, resetRateLimit, getAttemptCount, LOGIN_RATE_LIMIT, LOGIN_IP_RATE_LIMIT, ACCOUNT_LOCKOUT_CONFIG } from '@/lib/rate-limit';

function getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}

function getUserAgent(req: NextRequest): string | undefined {
    return req.headers.get('user-agent') || undefined;
}

export async function POST(req: NextRequest) {
    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);

    try {
        // ── IP-level rate limit ──
        const ipLimit = checkRateLimit(`admin:login:ip:${ip}`, LOGIN_IP_RATE_LIMIT);
        if (!ipLimit.allowed) {
            const retryAfterSec = Math.ceil(ipLimit.retryAfterMs / 1000);
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.', retryAfter: retryAfterSec },
                { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
            );
        }

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

        // ── Account-level lockout (per email) ──
        const emailKey = `admin:login:email:${email.toLowerCase()}`;
        const failedAttempts = getAttemptCount(emailKey, ACCOUNT_LOCKOUT_CONFIG.windowMs);
        if (failedAttempts >= ACCOUNT_LOCKOUT_CONFIG.maxAttempts) {
            return NextResponse.json(
                { error: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.' },
                { status: 429 }
            );
        }

        const user = await authenticateAdminUser(email, password);

        if (!user) {
            // Record failed attempt against email
            checkRateLimit(emailKey, ACCOUNT_LOCKOUT_CONFIG);

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

        // ── Success: clear lockout ──
        resetRateLimit(emailKey);

        // Create DB-backed session and set cookie
        await createSession(
            {
                id: user.id,
                email: user.email,
                username: (user as any).username || undefined,
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
                userName: (user as any).username,
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
