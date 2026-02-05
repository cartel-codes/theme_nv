import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, updateUserSessionActivity, updateUserProfile } from '@/lib/user-auth';

/**
 * GET /api/user/profile
 * Get current user profile
 */
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get session and user
    const session = await getUserSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Update activity
    await updateUserSessionActivity(sessionToken);

    return NextResponse.json({
      user: session.user,
      session: {
        id: session.id,
        ip: session.ip,
        userAgent: session.userAgent,
        deviceName: session.deviceName,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update user profile
 */
export async function PUT(req: NextRequest) {
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

    // Get update data
    const { firstName, lastName, phone, avatar } = await req.json();

    // Update profile
    const updatedUser = await updateUserProfile(session.userId, {
      firstName,
      lastName,
      phone,
      avatar,
    });

    // Update activity
    await updateUserSessionActivity(sessionToken);

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
