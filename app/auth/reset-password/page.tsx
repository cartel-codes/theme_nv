'use client';

import { FormEvent, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
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
          <h1 className="text-3xl font-serif font-medium text-novraux-charcoal mb-2">
            Set New Password
          </h1>
          <p className="text-sm text-novraux-charcoal/60 mb-8">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {success ? (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded">
              <h3 className="font-medium text-green-900 mb-2">Password reset successful!</h3>
              <p className="text-sm text-green-700">
                Redirecting to login page...
              </p>
            </div>
          ) : token ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-novraux-charcoal mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                  placeholder="••••••••"
                />
                <p className="text-xs text-novraux-charcoal/60 mt-1">
                  Min 8 characters, with uppercase, lowercase, and a number
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-novraux-charcoal mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          ) : null}

          <div className="mt-8 pt-8 border-t border-novraux-beige text-center text-sm">
            <Link href="/auth/login" className="text-novraux-charcoal/60 hover:text-novraux-charcoal transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
