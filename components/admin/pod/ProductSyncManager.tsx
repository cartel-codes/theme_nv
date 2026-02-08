'use client';

import { useState } from 'react';

export default function ProductSyncManager() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin/print-providers/sync', {
                method: 'POST',
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Failed to sync' });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-serif text-novraux-bone">Catalog Sync</h3>
                    <p className="text-xs text-novraux-bone/60 mt-1">
                        Fetch latest products and variants from Printify.
                    </p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-novraux-bone text-novraux-obsidian hover:bg-white text-xs uppercase tracking-novraux-medium rounded-sm transition-colors disabled:opacity-50"
                >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>

            {result && (
                <div className={`mt-4 p-4 rounded-sm text-xs ${result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {result.success ? (
                        <div>
                            <p className="font-bold mb-1">✅ Sync Completed!</p>
                            <p>{result.message}</p>
                            <p className="mt-1 opacity-80">Synced: {result.count}/{result.total} | Total available: {result.totalAvailable}</p>
                        </div>
                    ) : (
                        <p>❌ Error: {result.error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
