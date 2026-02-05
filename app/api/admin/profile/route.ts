import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateAdminUserProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email } = body;

    if (email) {
      const existing = await prisma.adminUser.findFirst({
        where: { email, NOT: { id: session.id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    const user = await updateAdminUserProfile(session.id, { name, email });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
