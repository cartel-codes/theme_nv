'use client';

interface SEOPreviewProps {
    title: string;
    description: string;
    url: string;
    siteName?: string;
    type?: 'product' | 'collection' | 'blog' | 'page';
}

export default function SEOPreview({
    title,
    description,
    url,
    siteName = 'novraux.com',
    type = 'product',
}: SEOPreviewProps) {
    // Truncate title to ~60 chars for Google
    const displayTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;

    // Truncate description to ~160 chars for Google
    const displayDescription = description.length > 160
        ? `${description.slice(0, 157)}...`
        : description;

    // Format URL for display
    const typePath = {
        product: 'products',
        collection: 'collections',
        blog: 'blog',
        page: '',
    }[type];

    const displayUrl = url
        ? `${siteName} › ${typePath ? `${typePath} › ` : ''}${url}`
        : `${siteName}${typePath ? ` › ${typePath}` : ''}`;

    return (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-900">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 font-medium">
                Google Search Preview
            </div>

            <div className="space-y-1">
                {/* URL */}
                <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px]">
                        N
                    </span>
                    <span>{displayUrl}</span>
                </div>

                {/* Title */}
                <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg leading-snug hover:underline cursor-pointer">
                    {displayTitle || 'Page Title | Novraux'}
                </div>

                {/* Description */}
                <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {displayDescription || 'Add a meta description to show how your page will appear in search results.'}
                </div>
            </div>

            {/* Character counts */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500">Title:</span>
                    <span className={
                        title.length === 0 ? 'text-neutral-400' :
                            title.length <= 60 ? 'text-green-600 dark:text-green-400' :
                                'text-red-600 dark:text-red-400'
                    }>
                        {title.length}/60
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500">Description:</span>
                    <span className={
                        description.length === 0 ? 'text-neutral-400' :
                            description.length >= 120 && description.length <= 160 ? 'text-green-600 dark:text-green-400' :
                                description.length < 120 ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                    }>
                        {description.length}/160
                    </span>
                </div>
            </div>
        </div>
    );
}
