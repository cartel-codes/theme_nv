import { NextRequest, NextResponse } from 'next/server';
import { createAdminUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { checkRateLimit, SIGNUP_RATE_LIMIT } from '@/lib/rate-limit';
import { validatePassword } from '@/lib/password-validation';

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
        const ipLimit = checkRateLimit(`admin:signup:ip:${ip}`, SIGNUP_RATE_LIMIT);
        if (!ipLimit.allowed) {
            const retryAfterSec = Math.ceil(ipLimit.retryAfterMs / 1000);
            return NextResponse.json(
                { error: 'Too many signup attempts. Please try again later.', retryAfter: retryAfterSec },
                { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
            );
        }

        const { email, password, username } = await req.json();

        if (!email || !password) {
            // Log failed signup attempt
            await logAuditEvent({
                email,
                action: 'SIGNUP_FAILED',
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

        // ── Password strength validation ──
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            await logAuditEvent({
                email,
                action: 'SIGNUP_FAILED',
                ip,
                userAgent,
                status: 'failed',
                errorMessage: 'Password too weak',
            });

            return NextResponse.json(
                { error: passwordCheck.errors[0], errors: passwordCheck.errors },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Log signup attempt for existing user
            await logAuditEvent({
                email,
                action: 'SIGNUP_FAILED',
                ip,
                userAgent,
                status: 'failed',
                errorMessage: 'User already exists',
            });

            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        const user = await createAdminUser(email, password, username || email.split('@')[0]);

        // Create session
        await createSession({
            id: user.id,
            email: user.email,
            username: (user as any).username || undefined,
            role: user.role,
        });

        // Log successful signup
        await logAuditEvent({
            userId: user.id,
            email: user.email,
            action: 'SIGNUP_SUCCESS',
            ip,
            userAgent,
            status: 'success',
            metadata: {
                userName: (user as any).username,
                userRole: user.role,
            },
        });

        return NextResponse.json(
            { success: true, message: 'Account created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);

        // Log server error
        await logAuditEvent({
            action: 'SIGNUP_FAILED',
            ip,
            userAgent,
            status: 'failed',
            errorMessage: 'Server error during signup',
        });

        return NextResponse.json(
            { error: 'An error occurred during signup' },
            { status: 500 }
        );
    }
}
