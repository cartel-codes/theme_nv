import { cookies } from 'next/headers';
import { getSessionByToken, createTrackedSession, invalidateSession, updateSessionActivity, isSessionValid } from './session-tracking';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface SessionData {
  id: string;
  email: string;
  username?: string;
  role: string;
}

/**
 * Create a DB-backed session and set cookie
 */
export async function createSession(
  userData: SessionData,
  metadata?: { ip?: string; userAgent?: string }
) {
  const sessionToken = crypto.randomUUID();
  const cookieStore = await cookies();

  await createTrackedSession({
    userId: userData.id,
    sessionToken,
    ip: metadata?.ip,
    userAgent: metadata?.userAgent,
    expiresIn: SESSION_DURATION,
  });

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

/**
 * Get current session from cookie + DB validation
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const isValid = await isSessionValid(token);
  if (!isValid) return null;

  const dbSession = await getSessionByToken(token);
  if (!dbSession || dbSession.expiresAt < new Date()) return null;

  // Update last activity (fire and forget)
  updateSessionActivity(token).catch(() => { });

  const user = dbSession.user as any;

  return {
    id: user.id,
    email: user.email,
    username: user.username ?? undefined,
    role: user.role,
  };
}

/**
 * Destroy session (logout) - invalidate in DB and clear cookie
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await invalidateSession(token).catch(() => { });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
