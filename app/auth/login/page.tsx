'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OAuthButtonGroup } from '@/components/OAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Get redirect URL from query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Login successful - redirect to original destination or home
      const destination = redirectUrl || '/';
      window.dispatchEvent(new Event('auth-change'));
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-novraux-cream/30 py-20">
      <div className="container mx-auto max-w-md px-4">
        <div className="bg-white rounded-lg border border-novraux-beige p-8">
          <h1 className="text-3xl font-serif font-medium text-novraux-charcoal mb-2">Sign In</h1>
          <p className="text-sm text-novraux-charcoal/60 mb-8">
            {redirectUrl === '/checkout' ? 'Please sign in to complete your purchase' : 'Welcome back to Novraux'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-novraux-charcoal mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-novraux-charcoal">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-novraux-terracotta hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-novraux-charcoal text-white py-3 rounded-lg font-medium hover:bg-novraux-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* OAuth Sign In Options */}
          <div className="mt-8">
            <OAuthButtonGroup />
          </div>

          <div className="mt-8 pt-8 border-t border-novraux-beige text-center text-sm">
            <p className="text-novraux-charcoal/60 mb-4">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-novraux-terracotta font-medium hover:underline">
                Create one
              </Link>
            </p>
            <Link href="/" className="text-novraux-charcoal/60 hover:text-novraux-charcoal transition-colors">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
