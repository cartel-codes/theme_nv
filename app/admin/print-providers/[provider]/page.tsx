'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PodProductList from '@/components/admin/pod/PodProductList';
import SyncStatus from '@/components/admin/pod/SyncStatus';

export default function ProviderDashboardPage() {
    const params = useParams();
    const router = useRouter();
    // validate provider
    const provider = params.provider as string;
    const isValid = ['printify'].includes(provider);

    useEffect(() => {
        if (!isValid) router.push('/admin/print-providers');
    }, [isValid, router]);

    const [syncing, setSyncing] = useState(false);
    const [key, setKey] = useState(0);

    if (!isValid) return null;

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch('/api/admin/print-providers/sync', {
                method: 'POST',
                body: JSON.stringify({ provider })
            });
            setKey(prev => prev + 1);
        } catch (error) {
            console.error('Sync failed', error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <Link href="/admin/print-providers" className="text-xs text-novraux-bone/40 uppercase hover:text-novraux-bone mb-2 block">&larr; Back to Providers</Link>
                    <h1 className="text-3xl font-serif text-novraux-bone mb-2 capitalize">{provider} Integration</h1>
                    <p className="text-novraux-bone/60 text-sm max-w-2xl">
                        Manage your Printify products and settings.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-novraux-bone text-novraux-obsidian hover:bg-white text-xs uppercase tracking-novraux-medium rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {syncing ? (
                            <>
                                <span className="w-3 h-3 border-2 border-novraux-obsidian border-t-transparent rounded-full animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Sync Catalog
                            </>
                        )}
                    </button>
                    {provider === 'printify' && (
                        <Link
                            href="/admin/print-providers/create"
                            className="px-4 py-2 bg-novraux-bone text-novraux-obsidian hover:bg-white text-xs uppercase tracking-novraux-medium rounded-sm transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Product
                        </Link>
                    )}
                    <Link
                        href="/admin/print-providers/config"
                        className="px-4 py-2 border border-novraux-bone/20 text-novraux-bone hover:border-novraux-bone hover:text-white text-xs uppercase tracking-novraux-medium rounded-sm transition-colors"
                    >
                        Settings
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-2">
                    <PodProductList key={key} provider="printify" />
                </div>

                {/* Status/logs */}
                <div>
                    <SyncStatus provider={provider} />
                </div>
            </div>
        </div>
    );
}
