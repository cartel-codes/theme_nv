'use client';

import Link from 'next/link';
import { useState } from 'react';

type UtilityCard = {
    id: string;
    title: string;
    description: string;
    icon: string;
    link: string;
    status: 'ready' | 'coming-soon' | 'beta';
    features: string[];
};

const utilities: UtilityCard[] = [
    {
        id: 'product-studio',
        title: 'Product Studio',
        description: 'Complete 4-step workflow: Prompt → Generate → Optimize → Publish to Printify',
        icon: '🚀',
        link: '/admin/ai-tools/product-studio',
        status: 'ready',
        features: [
            'AI-enhanced prompts',
            'GPT Image 1 / DALL-E 3',
            'Vision QA + SEO generation',
            'One-click Printify publish'
        ]
    },
];

export default function AiToolsPage() {
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'ready' | 'beta' | 'coming-soon'>('all');

    const filteredUtilities = utilities.filter(util => {
        if (selectedFilter === 'all') return true;
        return util.status === selectedFilter;
    });

    const statusColors = {
        ready: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
        'coming-soon': 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30',
        beta: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30'
    };

    const statusLabels = {
        ready: 'Ready',
        'coming-soon': 'Coming Soon',
        beta: 'Beta'
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif tracking-widest text-novraux-obsidian dark:text-novraux-bone mb-2">
                    AI Tools
                </h1>
                <p className="text-novraux-obsidian/60 dark:text-novraux-bone/60">
                    Powerful AI utilities using your OpenAI API Key.
                </p>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-novraux-obsidian/50 border border-novraux-obsidian/10 dark:border-novraux-bone/10 p-4 rounded">
                    <p className="text-xs uppercase tracking-novraux-medium text-novraux-obsidian/60 dark:text-novraux-bone/60 mb-1">
                        Ready to Use
                    </p>
                    <p className="text-2xl font-serif text-novraux-obsidian dark:text-novraux-bone">
                        {utilities.filter(u => u.status === 'ready').length}
                    </p>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'ready'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-4 py-2 rounded text-xs uppercase tracking-novraux-medium font-normal transition-colors ${selectedFilter === filter
                            ? 'bg-novraux-obsidian dark:bg-novraux-bone text-novraux-bone dark:text-novraux-obsidian'
                            : 'bg-novraux-obsidian/10 dark:bg-novraux-bone/10 text-novraux-obsidian dark:text-novraux-bone hover:bg-novraux-obsidian/20 dark:hover:bg-novraux-bone/20'
                            }`}
                    >
                        {filter === 'all' ? 'All Tools' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>

            {/* Utilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUtilities.map(utility => (
                    <Link
                        href={utility.link}
                        key={utility.id}
                        className={`block p-6 rounded border transition-all ${utility.status === 'coming-soon'
                            ? 'bg-white dark:bg-novraux-obsidian/30 border-novraux-obsidian/10 dark:border-novraux-bone/10 opacity-75 cursor-default'
                            : 'bg-white dark:bg-novraux-obsidian/50 border-novraux-obsidian/10 dark:border-novraux-bone/10 hover:border-novraux-obsidian/30 dark:hover:border-novraux-bone/30 hover:shadow-lg dark:hover:shadow-lg/20'
                            } ${utility.status === 'coming-soon' ? 'pointer-events-none' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-4xl">{utility.icon}</span>
                            <span className={`text-xs px-2 py-1 rounded border font-normal ${statusColors[utility.status]}`}>
                                {statusLabels[utility.status]}
                            </span>
                        </div>
                        <h3 className="text-lg font-serif text-novraux-obsidian dark:text-novraux-bone mb-2">
                            {utility.title}
                        </h3>
                        <p className="text-sm text-novraux-obsidian/70 dark:text-novraux-bone/60 mb-4">
                            {utility.description}
                        </p>
                        <ul className="space-y-1 text-xs text-novraux-obsidian/60 dark:text-novraux-bone/60">
                            {utility.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx}>✓ {feature}</li>
                            ))}
                        </ul>
                    </Link>
                ))}
            </div>
        </div>
    );
}
