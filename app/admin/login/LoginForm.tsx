'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            router.push('/admin');
            router.refresh();
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-novraux-bone dark:bg-novraux-obsidian flex items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="font-serif text-4xl tracking-widest uppercase text-novraux-obsidian dark:text-novraux-bone hover:text-novraux-gold dark:hover:text-novraux-gold transition-colors">
                        Novraux
                    </Link>
                    <p className="text-novraux-ash dark:text-novraux-bone/70 mt-3 uppercase tracking-novraux-medium text-xs font-normal transition-colors">Admin Access</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-lg border border-novraux-ash/10 dark:border-novraux-graphite p-10 space-y-6 transition-colors">
                    <h1 className="font-serif text-3xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Sign In</h1>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm text-sm font-light transition-colors">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold disabled:opacity-50 transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite bg-white dark:bg-novraux-obsidian text-novraux-obsidian dark:text-novraux-bone rounded-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:focus:ring-novraux-gold disabled:opacity-50 transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-8 py-4 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-normal rounded-sm"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="text-center text-sm text-novraux-grey">
                        Don&apos;t have an account?{' '}
                        <Link href="/admin/signup" className="text-novraux-charcoal hover:underline font-medium">
                            Sign up here
                        </Link>
                    </div>
                </form>

                {/* Footer */}
                <div className="text-center mt-8">
                    <Link href="/" className="text-sm text-novraux-grey hover:text-novraux-charcoal transition-colors">
                        ← Back to Store
                    </Link>
                </div>
            </div>
        </div>
    );
}
