'use client';

import { useRouter } from 'next/navigation';
import PostForm from '@/components/PostForm';

export default function NewPostPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-serif text-3xl text-novraux-charcoal dark:text-white">Write New Article</h1>
                <button
                    onClick={() => router.back()}
                    className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                    ← Back to Articles
                </button>
            </div>

            <PostForm />
        </div>
    );
}
