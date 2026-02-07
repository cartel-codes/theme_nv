'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConnectionResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface ConfigStatus {
  configured: boolean;
  details: {
    apiKey: string;
    webhookSecret: string;
    encryptionKey: string;
  };
  provider: string;
}

export default function PrintProvidersPage() {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  async function checkConfiguration() {
    try {
      const res = await fetch('/api/admin/print-providers/test');
      const data = await res.json();
      setConfigStatus(data);
    } catch (error) {
      console.error('Failed to check configuration:', error);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/print-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'printful', 
          apiKey: apiKey || undefined
        }),
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        // Refresh config status
        await checkConfiguration();
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-light text-novraux-obsidian dark:text-novraux-bone mb-2">
          Print-on-Demand Configuration
        </h1>
        <p className="text-novraux-ash dark:text-novraux-bone/70">
          Configure and test your Printful integration
        </p>
      </div>

      {/* Configuration Status */}
      {!loadingConfig && configStatus && (
        <div className="mb-8 p-6 bg-white dark:bg-novraux-graphite rounded-lg shadow-md border border-neutral-200 dark:border-novraux-graphite">
          <h2 className="text-xl font-semibold mb-4 text-novraux-obsidian dark:text-novraux-bone">
            Current Configuration
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">API Key:</span>
              <span className={`text-sm font-medium ${
                configStatus.details.apiKey.includes('✓') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {configStatus.details.apiKey}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Webhook Secret:</span>
              <span className={`text-sm font-medium ${
                configStatus.details.webhookSecret.includes('✓') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {configStatus.details.webhookSecret}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Encryption Key:</span>
              <span className={`text-sm font-medium ${
                configStatus.details.encryptionKey.includes('✓') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {configStatus.details.encryptionKey}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Provider:</span>
              <span className="text-sm font-bold text-novraux-obsidian dark:text-novraux-gold uppercase">
                {configStatus.provider}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Connection */}
      <div className="bg-white dark:bg-novraux-graphite rounded-lg shadow-md border border-neutral-200 dark:border-novraux-graphite p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-light text-novraux-obsidian dark:text-novraux-bone mb-2">
            Test Connection
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Verify your Printful API key is working correctly
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Printful API Key (Optional - uses env variable if empty)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Leave empty to use configured key..."
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-novraux-gold focus:border-transparent dark:bg-novraux-obsidian dark:text-novraux-bone transition-all text-sm"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Get your API key from: <a href="https://www.printful.com/dashboard/settings" target="_blank" rel="noopener noreferrer" className="text-novraux-gold hover:underline">Printful Dashboard → Store Settings → API</a>
          </p>
        </div>

        <button
          onClick={testConnection}
          disabled={testing}
          className="w-full px-6 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian rounded-lg hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium uppercase tracking-wide text-sm"
        >
          {testing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Testing Connection...
            </span>
          ) : (
            '🔌 Test Connection'
          )}
        </button>

        {result && (
          <div className={`p-6 rounded-lg border-2 ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h3 className={`font-bold mb-3 text-lg ${
              result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {result.success ? '✅ Connection Successful!' : '❌ Connection Failed'}
            </h3>
            
            {result.success && result.data && (
              <div className="space-y-2">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your Printful store is connected and ready to use!
                </p>
                {result.data.name && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Store:</strong> {result.data.name}
                  </p>
                )}
              </div>
            )}
            
            {result.error && (
              <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                {result.error}
              </p>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
                View raw response
              </summary>
              <pre className="mt-2 text-xs overflow-auto bg-neutral-900 dark:bg-black text-green-400 p-3 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {result?.success && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              Next Steps
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li>
                <Link href="/admin/print-providers/sync" className="underline hover:text-blue-600">
                  Sync product catalog from Printful
                </Link>
              </li>
              <li>Set up webhook endpoint</li>
              <li>Create your first print-on-demand product</li>
              <li>Test order creation flow</li>
            </ol>
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2 flex items-center gap-2">
          <span className="text-xl">📚</span>
          Documentation
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-3">
          Complete implementation guide available in your project:
        </p>
        <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
          <li><code className="bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">PRINT_ON_DEMAND_INTEGRATION_RESEARCH.md</code></li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">PRINTFUL_VS_PRINTIFY_DECISION.md</code></li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">POD_INTEGRATION_ROADMAP.md</code></li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">QUICK_START_POD.ts</code></li>
        </ul>
      </div>
    </div>
  );
}
