'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                setError(responseData.error || 'Failed to change password');
                return;
            }

            setSuccess('Password changed successfully! Redirecting...');
            setTimeout(() => {
                router.push('/account');
            }, 2000);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-novraux-cream/30 py-20">
            <div className="container mx-auto max-w-md px-4">
                <div className="bg-white rounded-lg border border-novraux-beige p-8 shadow-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-serif font-medium text-novraux-charcoal mb-2">Change Password</h1>
                        <p className="text-sm text-novraux-charcoal/60">Update your account credentials</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-600">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-novraux-charcoal mb-2">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                name="currentPassword"
                                required
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30 transition-all font-sans"
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-novraux-charcoal mb-2">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                name="newPassword"
                                required
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30 transition-all font-sans"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-novraux-charcoal mb-2">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-novraux-beige rounded-lg focus:outline-none focus:border-novraux-terracotta focus:ring-1 focus:ring-novraux-terracotta/30 transition-all font-sans"
                            />
                        </div>

                        <div className="flex flex-col gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-novraux-charcoal text-white rounded-lg font-medium hover:bg-novraux-charcoal/90 disabled:bg-novraux-charcoal/50 transition-colors"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                            <Link
                                href="/account"
                                className="text-center text-sm text-novraux-charcoal/60 hover:text-novraux-charcoal transition-colors"
                            >
                                Cancel and return to account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
