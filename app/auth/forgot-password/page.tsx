'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setSuccess(true);
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
            Reset Password
          </h1>
          <p className="text-sm text-novraux-charcoal/60 mb-8">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {success ? (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded">
              <h3 className="font-medium text-green-900 mb-2">Check your email</h3>
              <p className="text-sm text-green-700">
                If an account exists with <strong>{email}</strong>, you&apos;ll receive a password reset link shortly. The link will expire in 1 hour.
              </p>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-novraux-charcoal text-white py-3 rounded-lg font-medium hover:bg-novraux-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-novraux-beige text-center text-sm">
            <p className="text-novraux-charcoal/60">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-novraux-terracotta font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
