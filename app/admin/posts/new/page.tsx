'use client';

import { useRouter } from 'next/navigation';
import PostForm from '@/components/PostForm';

export default function NewPostPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone tracking-wide transition-colors">Write New Article</h1>
                <button
                    onClick={() => router.back()}
                    className="text-sm text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors uppercase tracking-novraux-medium"
                >
                    ← Back to Articles
                </button>
            </div>

            <PostForm />
        </div>
    );
}
