'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogoutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/admin/login');
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors text-xs uppercase tracking-wider rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Signing out...' : 'Sign out'}
        </button>
    );
}
