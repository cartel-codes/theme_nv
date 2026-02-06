import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/user-auth';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getUserSession(sessionToken);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId: session.userId },
      select: {
        provider: true,
        email: true,
        name: true,
        picture: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(oauthAccounts);
  } catch (error) {
    console.error('Error fetching linked accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch linked accounts' },
      { status: 500 }
    );
  }
}
