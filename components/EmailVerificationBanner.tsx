'use client';

import { useState } from 'react';

export default function EmailVerificationBanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/user/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Verification email sent!');
      } else {
        setMessage(data.error || 'Failed to send email');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Verify your email address</h3>
          <p className="mt-1 text-sm text-yellow-700">
            Please check your inbox and click the verification link we sent you. This helps keep your account secure.
          </p>
          {message && (
            <p className={`mt-2 text-sm font-medium ${message.includes('error') || message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
          <div className="mt-3 flex items-center space-x-4">
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Resend verification email'}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-sm text-yellow-700 hover:text-yellow-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
