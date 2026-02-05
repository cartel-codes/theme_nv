'use client';

import { calculateSEOScore, SEOCheckInput } from '@/lib/seo';

interface SEOHealthIndicatorProps {
    product: SEOCheckInput;
    compact?: boolean;
}

export default function SEOHealthIndicator({ product, compact = false }: SEOHealthIndicatorProps) {
    const { score, status, checks } = calculateSEOScore(product);

    const statusColors = {
        excellent: 'bg-green-500',
        good: 'bg-green-400',
        'needs-work': 'bg-yellow-500',
        poor: 'bg-red-500',
    };

    const statusLabels = {
        excellent: 'Excellent',
        good: 'Good',
        'needs-work': 'Needs Work',
        poor: 'Poor',
    };

    const statusTextColors = {
        excellent: 'text-green-600 dark:text-green-400',
        good: 'text-green-600 dark:text-green-400',
        'needs-work': 'text-yellow-600 dark:text-yellow-400',
        poor: 'text-red-600 dark:text-red-400',
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
                <span className={`text-sm font-medium ${statusTextColors[status]}`}>
                    SEO: {score}%
                </span>
            </div>
        );
    }

    return (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">
                    SEO Health
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                    <span className={`text-sm font-medium ${statusTextColors[status]}`}>
                        {statusLabels[status]} ({score}%)
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4 overflow-hidden">
                <div
                    className={`h-full ${statusColors[status]} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Checklist */}
            <div className="space-y-2">
                {checks.map((check) => (
                    <div key={check.id} className="flex items-start gap-2 text-sm">
                        <div className={`mt-0.5 flex-shrink-0 ${check.passed ? 'text-green-500' : 'text-neutral-300 dark:text-neutral-600'}`}>
                            {check.passed ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <span className={check.passed ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}>
                                {check.label}
                            </span>
                            <span className="text-neutral-400 dark:text-neutral-500 ml-1.5 text-xs">
                                — {check.message}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
