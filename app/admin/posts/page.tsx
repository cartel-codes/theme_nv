'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Post {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    publishedAt: string | null;
    createdAt: string;
    status?: string; // Derived from publishedAt
}

export default function AdminPostsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    async function fetchPosts(search = '') {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/posts?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(searchTerm);
    };

    const openDeleteModal = (post: Post) => {
        setPostToDelete(post);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setPostToDelete(null);
    };

    const handleDelete = async () => {
        if (!postToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/posts/${postToDelete.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
                closeDeleteModal();
                router.refresh();
            } else {
                alert('Failed to delete post');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete post');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="font-serif text-3xl text-novraux-charcoal dark:text-white">Blog Articles</h1>
                <div className="flex gap-3">
                    <Link
                        href="/admin/posts/ai-wizard"
                        className="px-6 py-2.5 bg-gradient-to-r from-novraux-gold to-yellow-600 text-white text-sm uppercase tracking-wider hover:shadow-lg transition-all rounded font-semibold flex items-center gap-2"
                    >
                        <span>✨</span>
                        <span>AI Wizard</span>
                    </Link>
                    <Link
                        href="/admin/posts/new"
                        className="px-6 py-2.5 bg-novraux-charcoal dark:bg-white text-white dark:text-neutral-900 text-sm uppercase tracking-wider hover:bg-black dark:hover:bg-neutral-100 transition-colors rounded"
                    >
                        + Write New Post
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search articles..."
                    className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded text-sm hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                    Search
                </button>
            </form>

            {/* Posts Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                        <div className="inline-block w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
                        <p>Loading articles...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 text-xs uppercase tracking-wider text-novraux-grey dark:text-neutral-400">
                                <tr>
                                    <th className="p-4">Image</th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Published Date</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {posts.map((post) => {
                                    const isPublished = !!post.publishedAt;
                                    return (
                                        <tr key={post.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="p-4 w-20">
                                                <div className="relative w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                                                    {post.imageUrl ? (
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                            📄
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-novraux-charcoal dark:text-white block">{post.title}</span>
                                                <span className="text-xs text-neutral-400 font-mono">/{post.slug}</span>
                                            </td>
                                            <td className="p-4">
                                                {isPublished ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-neutral-500 dark:text-neutral-400">
                                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/posts/${post.id}`}
                                                        className="px-3 py-1.5 text-xs font-medium text-novraux-navy dark:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(post)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {posts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-novraux-grey dark:text-neutral-400">
                                            No blog posts yet. Write your first one!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && postToDelete && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Delete Article</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Are you sure you want to delete <strong>&quot;{postToDelete.title}&quot;</strong>? This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
