'use client';

import { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface ProductTabsProps {
    tabs: Tab[];
}

export default function ProductTabs({ tabs }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

    return (
        <div className="mt-16 border-t border-[#E8E8E8] pt-12">
            {/* Tab Headers */}
            <div className="flex gap-8 border-b border-[#E8E8E8]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              relative pb-4 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 font-medium
              ${activeTab === tab.id
                                ? 'text-[#2C2C2C] dark:text-novraux-cream'
                                : 'text-[#8B8B8B] dark:text-novraux-beige/60 hover:text-[#5D5D5D] dark:hover:text-novraux-cream'
                            }
            `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#B8926A]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`
              ${activeTab === tab.id ? 'block animate-fadeIn' : 'hidden'}
            `}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
