/**
 * Proper JWT signing & verification using the `jose` library.
 * Uses HS256 (HMAC-SHA256) with a server-side secret.
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.PAYPAL_CLIENT_SECRET || 'novraux-fallback-secret-change-me';
const secret = new TextEncoder().encode(JWT_SECRET);

const DEFAULT_EXPIRATION = '24h';

/**
 * Sign a payload into a JWT string.
 */
export async function jwtEncode(
  payload: Record<string, unknown>,
  expiresIn: string = DEFAULT_EXPIRATION
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('novraux')
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verify and decode a JWT string. Throws if invalid or expired.
 */
export async function jwtDecode<T extends JWTPayload = JWTPayload>(
  token: string
): Promise<T> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: 'novraux',
  });
  return payload as T;
}

/**
 * Verify a JWT without throwing — returns null if invalid.
 */
export async function jwtVerifySafe<T extends JWTPayload = JWTPayload>(
  token: string
): Promise<T | null> {
  try {
    return await jwtDecode<T>(token);
  } catch {
    return null;
  }
}
