'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up the user
      const signupResponse = await fetch('/api/auth/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (!signupResponse.ok) {
        const data = await signupResponse.json();
        setError(data.error || 'Signup failed');
        return;
      }

      // Sign in the user automatically
      const loginResponse = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        setError('Account created but login failed. Please try logging in manually.');
        router.push('/auth/login');
        return;
      }

      // Signup and login successful
      router.push('/');
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
          <h1 className="text-3xl font-serif font-medium text-novraux-charcoal mb-2">Create Account</h1>
          <p className="text-sm text-novraux-charcoal/60 mb-8">Join Novraux and start shopping</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-novraux-charcoal mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-novraux-charcoal mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-novraux-charcoal mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-novraux-charcoal mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                placeholder="••••••••"
              />
              <p className="text-xs text-novraux-charcoal/60 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-novraux-charcoal mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-novraux-charcoal text-white py-3 rounded-lg font-medium hover:bg-novraux-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-novraux-beige text-center text-sm">
            <p className="text-novraux-charcoal/60 mb-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-novraux-terracotta font-medium hover:underline">
                Sign in
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
