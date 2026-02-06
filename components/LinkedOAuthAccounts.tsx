'use client';

import { useState, useEffect } from 'react';
import { OAuthButton } from './OAuthButton';

interface LinkedAccount {
  provider: string;
  email?: string;
  name?: string;
  picture?: string;
  createdAt: string;
}

interface LinkedOAuthAccountsProps {
  userId: string;
  currentEmail?: string;
  hasPassword: boolean;
}

export function LinkedOAuthAccounts({ userId, currentEmail, hasPassword }: LinkedOAuthAccountsProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkedAccounts();
  }, [userId]);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch(`/api/auth/user/linked-accounts`);
      if (response.ok) {
        const data = await response.json();
        setLinkedAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching linked accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async (provider: string) => {
    if (!confirm(`Are you sure you want to unlink ${provider}?`)) {
      return;
    }

    try {
      setUnlinkingProvider(provider);
      const response = await fetch(`/api/auth/user/unlink-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      if (response.ok) {
        setLinkedAccounts(linkedAccounts.filter(acc => acc.provider !== provider));
        alert(data.message);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unlink account');
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const getProviderDisplay = (provider: string) => {
    switch (provider) {
      case 'google':
        return { name: 'Google', icon: '🔵', color: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'twitter':
        return { name: 'Twitter (X)', icon: '🐦', color: 'bg-black/5 dark:bg-white/5' };
      case 'facebook':
        return { name: 'Facebook', icon: '📘', color: 'bg-blue-50 dark:bg-blue-900/20' };
      default:
        return { name: provider, icon: '🔗', color: 'bg-gray-50 dark:bg-gray-800' };
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Linked Accounts */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Connected Accounts
        </h3>

        {linkedAccounts.length > 0 ? (
          <div className="space-y-3">
            {linkedAccounts.map(account => {
              const config = getProviderDisplay(account.provider);
              const connectedAt = new Date(account.createdAt).toLocaleDateString();

              return (
                <div
                  key={account.provider}
                  className={`${config.color} rounded-lg p-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{config.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {account.email || `Connected on ${connectedAt}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnlink(account.provider)}
                    disabled={unlinkingProvider === account.provider || (linkedAccounts.length === 1 && !hasPassword)}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    title={linkedAccounts.length === 1 && !hasPassword ? 'Cannot unlink your only login method' : ''}
                  >
                    {unlinkingProvider === account.provider ? 'Unlinking...' : 'Unlink'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No connected accounts yet. Link your social providers for easier sign-in.
          </p>
        )}
      </div>

      {/* Add More Accounts */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Link More Accounts
        </h3>

        <div className="space-y-2">
          {(['google', 'twitter', 'facebook'] as const).map(provider => {
            const isLinked = linkedAccounts.some(acc => acc.provider === provider);

            if (isLinked) return null;

            return <OAuthButton key={provider} provider={provider} isDark={true} />;
          })}

          {linkedAccounts.length === 3 && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              All available providers are connected
            </p>
          )}
        </div>
      </div>

      {/* Security Note */}
      {linkedAccounts.length === 1 && !hasPassword && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ You cannot unlink your only authentication method. Please set a password first or link another account.
        </div>
      )}
    </div>
  );
}
