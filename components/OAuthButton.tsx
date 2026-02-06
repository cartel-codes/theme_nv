'use client';

import { useState } from 'react';

interface OAuthButtonProps {
  provider: 'google' | 'twitter' | 'facebook';
  isDark?: boolean;
}

export function OAuthButton({ provider, isDark = false }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getConfig = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          icon: '🔵',
          color: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
          darkColor: 'dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700',
        };
      case 'twitter':
        return {
          name: 'Twitter (X)',
          icon: '🐦',
          color: 'bg-black text-white hover:bg-gray-900',
          darkColor: 'dark:bg-gray-900 dark:hover:bg-gray-800',
        };
      case 'facebook':
        return {
          name: 'Facebook',
          icon: 'f',
          color: 'bg-blue-600 text-white hover:bg-blue-700',
          darkColor: 'dark:bg-blue-700 dark:hover:bg-blue-800',
        };
    }
  };

  const config = getConfig();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);

      // Get the OAuth authorization URL
      const response = await fetch(`/api/auth/oauth-signin?provider=${provider}`);
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert(error instanceof Error ? error.message : 'OAuth sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2.5
        ${config.color} ${isDark ? config.darkColor : ''} 
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="text-xl">{config.icon}</span>
      {isLoading ? `Connecting to ${config.name}...` : `Sign in with ${config.name}`}
    </button>
  );
}

export function OAuthButtonGroup() {
  return (
    <div className="space-y-3">
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
      </div>

      <OAuthButton provider="google" />
      <OAuthButton provider="twitter" />
      <OAuthButton provider="facebook" />
    </div>
  );
}
