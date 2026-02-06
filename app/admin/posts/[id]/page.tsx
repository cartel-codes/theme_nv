'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PostForm from '@/components/PostForm';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPost() {
            try {
                const res = await fetch(`/api/admin/posts/${id}`);
                if (!res.ok) throw new Error('Failed to fetch post');
                const data = await res.json();
                setPost(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchPost();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-novraux-obsidian dark:border-novraux-bone"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 dark:text-red-400 mb-4 font-light transition-colors">{error || 'Post not found'}</p>
                <button
                    onClick={() => router.back()}
                    className="text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors underline uppercase tracking-novraux-medium text-sm"
                >
                    Back to Articles
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone tracking-wide transition-colors">Edit Article</h1>
                <button
                    onClick={() => router.back()}
                    className="text-sm text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors uppercase tracking-novraux-medium"
                >
                    ← Back to Articles
                </button>
            </div>

            <PostForm postId={id} initialData={post} />
        </div>
    );
}
