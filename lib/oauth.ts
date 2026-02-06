/**
 * OAuth utilities for Google, Twitter, and Facebook authentication
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type OAuthProvider = 'google' | 'twitter' | 'facebook';

const OAUTH_CONFIG = {
  google: {
    name: 'Google',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  twitter: {
    name: 'Twitter (X)',
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://token.twitter.com/2/oauth2/token',
    userUrl: 'https://api.twitter.com/2/users/me',
    scope: 'tweet.read users.read follows.read follows.write',
  },
  facebook: {
    name: 'Facebook',
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userUrl: 'https://graph.facebook.com/me',
    scope: 'email public_profile',
  },
};

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): string {
  const config = OAUTH_CONFIG[provider];
  if (!config.clientId) {
    throw new Error(`${provider} OAuth not configured`);
  }

  const state = crypto.randomBytes(32).toString('hex');
  // Store state in a way that can be verified later (you'd typically use sessions/cookies)
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  // Provider-specific parameters
  if (provider === 'google') {
    params.append('access_type', 'offline');
    params.append('prompt', 'consent');
  }

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 */
async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<any> {
  const config = OAUTH_CONFIG[provider];

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider} OAuth not configured`);
  }

  const params = {
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
  };

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get user info from OAuth provider
 */
async function getUserInfo(provider: OAuthProvider, accessToken: string): Promise<any> {
  const config = OAUTH_CONFIG[provider];
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
  };

  // Twitter needs specific headers
  if (provider === 'twitter') {
    headers['User-Agent'] = 'Novraux App';
  }

  const userUrl = provider === 'facebook' 
    ? `${config.userUrl}?fields=id,name,email,picture&access_token=${accessToken}`
    : config.userUrl;

  const response = await fetch(userUrl, { headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`User info fetch failed: ${error}`);
  }

  return response.json();
}

/**
 * Map OAuth provider user data to standard format
 */
function mapUserData(
  provider: OAuthProvider,
  data: any
): {
  providerId: string;
  email?: string;
  name?: string;
  picture?: string;
} {
  switch (provider) {
    case 'google':
      return {
        providerId: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };

    case 'twitter':
      return {
        providerId: data.data?.id,
        name: data.data?.name,
        email: undefined, // Twitter OAuth doesn't provide email by default
        picture: data.data?.profile_image_url,
      };

    case 'facebook':
      return {
        providerId: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture?.data?.url,
      };

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Handle OAuth callback and sign in or link account
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  userId?: string
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
}> {
  try {
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(provider, code, redirectUri);
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    // Get user info
    const userData = await getUserInfo(provider, accessToken);
    const mappedData = mapUserData(provider, userData);

    // Check if OAuth account already exists
    const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: mappedData.providerId,
        },
      },
      include: { user: true },
    });

    if (existingOAuthAccount) {
      // OAuth account already linked - sign in
      return {
        success: true,
        user: existingOAuthAccount.user,
        message: 'Signed in successfully',
      };
    }

    // Check if user with this email already exists
    let user = null;
    if (mappedData.email) {
      user = await prisma.user.findUnique({
        where: { email: mappedData.email },
      });
    }

    if (userId) {
      // Link OAuth account to existing user account
      user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          error: 'User account not found',
        };
      }

      // Check if this user already has this provider linked
      const existingLink = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerId: {
            provider,
            providerId: mappedData.providerId,
          },
        },
      });

      if (existingLink) {
        return {
          success: false,
          error: `This ${provider} account is already linked to another Novraux account`,
        };
      }

      // Link the OAuth account
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerId: mappedData.providerId,
          name: mappedData.name,
          email: mappedData.email,
          picture: mappedData.picture,
          accessToken,
          refreshToken,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        },
      });

      return {
        success: true,
        user,
        message: `${OAUTH_CONFIG[provider].name} account linked successfully`,
      };
    } else if (user) {
      // User exists with same email - link OAuth account
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerId: mappedData.providerId,
          name: mappedData.name,
          email: mappedData.email,
          picture: mappedData.picture,
          accessToken,
          refreshToken,
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        },
      });

      return {
        success: true,
        user,
        message: 'Account created and linked successfully',
      };
    } else {
      // Create new user account
      user = await prisma.user.create({
        data: {
          email: mappedData.email || null,
          firstName: mappedData.name?.split(' ')[0],
          lastName: mappedData.name?.split(' ').slice(1).join(' '),
          avatar: mappedData.picture,
          emailVerified: !!mappedData.email, // OAuth providers give verified emails
          oauthAccounts: {
            create: {
              provider,
              providerId: mappedData.providerId,
              name: mappedData.name,
              email: mappedData.email,
              picture: mappedData.picture,
              accessToken,
              refreshToken,
              expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
            },
          },
        },
        include: { oauthAccounts: true },
      });

      return {
        success: true,
        user,
        message: 'Account created successfully',
      };
    }
  } catch (error) {
    console.error(`OAuth error for ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth authentication failed',
    };
  }
}

/**
 * Unlink OAuth account from user
 */
export async function unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if user has other ways to sign in
    const hasPassword = !!user.password;
    const oauthAccounts = user.oauthAccounts;
    const otherOAuthProviders = oauthAccounts.filter(acc => acc.provider !== provider).length;

    if (!hasPassword && otherOAuthProviders === 0) {
      return {
        success: false,
        error: 'Cannot unlink the last authentication method',
      };
    }

    // Remove the OAuth account
    await prisma.oAuthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    return {
      success: true,
      message: `${OAUTH_CONFIG[provider].name} account unlinked successfully`,
    };
  } catch (error) {
    console.error(`Unlink OAuth error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unlink account',
    };
  }
}

/**
 * Get user's linked OAuth accounts
 */
export async function getLinkedOAuthAccounts(userId: string) {
  try {
    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        provider: true,
        email: true,
        name: true,
        picture: true,
        createdAt: true,
      },
    });

    return oauthAccounts;
  } catch (error) {
    console.error('Error fetching OAuth accounts:', error);
    return [];
  }
}
