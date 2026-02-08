'use client';

import Link from 'next/link';

export default function PrintProvidersPortal() {
  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-serif text-novraux-bone mb-2">Print Providers</h1>
        <p className="text-novraux-bone/60 text-sm max-w-2xl">
          Select a provider to manage products and integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Printify Card */}
        <Link
          href="/admin/print-providers/printify"
          className="group relative overflow-hidden bg-novraux-bone/5 border border-novraux-bone/10 p-8 rounded-sm hover:border-novraux-bone/40 transition-all hover:bg-novraux-bone/10"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.42 12.44a7.97 7.97 0 0 0-1.86-9.8 7.97 7.97 0 0 0-11 0 7.98 7.98 0 0 0-1.78 10l-1.6 2.5a1 1 0 0 0 .84 1.53h15.96a1 1 0 0 0 .84-1.53l-1.4-2.2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-novraux-bone mb-2">Printify</h2>
          <p className="text-novraux-bone/60 text-sm mb-6">
            Global network of print providers. Best for variety and competitive pricing.
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-xs uppercase tracking-widest text-novraux-bone border-b border-novraux-bone/20 pb-1 group-hover:border-novraux-bone transition-colors">
              Manage Integration &rarr;
            </span>
            <span className="text-[10px] bg-novraux-bone text-novraux-obsidian px-2 py-0.5 rounded-full font-bold">
              AI CREATOR
            </span>
          </div>
        </Link>

        {/* Settings Card */}
        <Link
          href="/admin/print-providers/config"
          className="group relative overflow-hidden bg-novraux-bone/5 border border-novraux-bone/10 p-6 rounded-sm hover:border-novraux-bone/40 transition-all flex items-center justify-between md:col-span-2"
        >
          <div>
            <h3 className="text-lg font-serif text-novraux-bone">Global Configuration</h3>
            <p className="text-novraux-bone/60 text-xs">Manage API Keys and General Settings</p>
          </div>
          <span className="text-xs uppercase tracking-widest text-novraux-bone/60 group-hover:text-novraux-bone transition-colors">
            Configure &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
