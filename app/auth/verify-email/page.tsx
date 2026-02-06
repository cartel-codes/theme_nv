'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/user/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="min-h-screen bg-novraux-cream/30 py-20">
      <div className="container mx-auto max-w-md px-4">
        <div className="bg-white rounded-lg border border-novraux-beige p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-serif font-medium text-novraux-charcoal mb-4">
              Email Verification
            </h1>

            {status === 'loading' && (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-novraux-charcoal mx-auto mb-4"></div>
                <p className="text-novraux-charcoal/60">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="p-6 bg-green-50 border border-green-200 rounded mb-6">
                <svg
                  className="w-16 h-16 text-green-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-medium text-green-900 mb-2">Success!</h2>
                <p className="text-green-700">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-6 bg-red-50 border border-red-200 rounded mb-6">
                <svg
                  className="w-16 h-16 text-red-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-medium text-red-900 mb-2">Verification Failed</h2>
                <p className="text-red-700">{message}</p>
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            {status === 'success' && (
              <Link
                href="/auth/login"
                className="block w-full bg-novraux-charcoal text-white py-3 rounded-lg font-medium hover:bg-novraux-charcoal/90 transition-colors"
              >
                Continue to Login
              </Link>
            )}

            {status === 'error' && (
              <Link
                href="/auth/login"
                className="block w-full bg-novraux-charcoal text-white py-3 rounded-lg font-medium hover:bg-novraux-charcoal/90 transition-colors"
              >
                Back to Login
              </Link>
            )}

            <Link
              href="/"
              className="block text-sm text-novraux-charcoal/60 hover:text-novraux-charcoal transition-colors"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
