import { NextRequest, NextResponse } from 'next/server';
import { createAdminUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
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
        const { email, password, name } = await req.json();

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

        const user = await createAdminUser(email, password, name);

        // Create session
        await createSession({
            id: user.id,
            email: user.email,
            name: user.name || undefined,
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
                userName: user.name,
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
