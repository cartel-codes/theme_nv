'use client';

import { useState, useEffect } from 'react';

export default function ProviderSettings() {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<'loading' | 'configured' | 'not-configured'>('loading');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkConfig();
    }, []);

    const checkConfig = async () => {
        try {
            const res = await fetch('/api/admin/print-providers/config');
            const data = await res.json();
            setStatus(data.configured ? 'configured' : 'not-configured');
        } catch (error) {
            console.error('Failed to check config', error);
            setStatus('not-configured');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/print-providers/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey }),
            });

            if (!res.ok) throw new Error('Failed to save');

            setStatus('configured');
            setMessage('API Key saved successfully!');
            setApiKey(''); // Clear input for security
        } catch (error) {
            setMessage('Error saving configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'loading') return <div className="p-4 text-sm text-novraux-bone/60">Checking configuration...</div>;

    return (
        <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
            <h3 className="text-lg font-serif text-novraux-bone mb-4">Printify Configuration</h3>

            <div className="flex items-center gap-2 mb-6">
                <div className={`w-3 h-3 rounded-full ${status === 'configured' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-novraux-bone/80">
                    {status === 'configured' ? 'Connected' : 'Not Configured'}
                </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">
                        API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                        placeholder={status === 'configured' ? '••••••••••••••••' : 'Enter API Key'}
                    />
                    <p className="text-[10px] text-novraux-bone/40 mt-1">
                        Your key is encrypted before storage.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isSaving || !apiKey}
                    className="px-4 py-2 bg-novraux-bone/10 hover:bg-novraux-bone/20 text-novraux-bone text-xs uppercase tracking-novraux-medium rounded-sm transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>

                {message && (
                    <p className={`text-xs ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
