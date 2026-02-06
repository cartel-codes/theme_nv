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
                <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Articles</h1>
                <div className="flex gap-3">
                    <Link
                        href="/admin/posts/ai-wizard"
                        className="px-8 py-4 bg-novraux-gold text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-bone hover:text-novraux-obsidian transition-all rounded-sm font-normal flex items-center gap-2"
                    >
                        <span>✨</span>
                        <span>AI Wizard</span>
                    </Link>
                    <Link
                        href="/admin/posts/new"
                        className="px-8 py-4 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors rounded-sm font-normal"
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
                    className="flex-1 px-4 py-2 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-graphite dark:text-novraux-bone bg-novraux-bone text-novraux-obsidian placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50 transition-colors"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-novraux-obsidian dark:bg-novraux-graphite text-novraux-bone dark:text-novraux-bone rounded-sm text-sm hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-gold dark:hover:text-novraux-obsidian transition-colors font-normal uppercase tracking-novraux-medium"
                >
                    Search
                </button>
            </form>

            {/* Posts Table */}
            <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-sm border border-novraux-ash/10 dark:border-novraux-graphite overflow-hidden transition-colors">
                {loading ? (
                    <div className="p-8 text-center text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                        <div className="inline-block w-6 h-6 border-2 border-novraux-gold border-t-novraux-obsidian rounded-full animate-spin mb-2"></div>
                        <p className="font-light">Loading articles...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-novraux-obsidian/5 dark:bg-novraux-obsidian/20 border-b border-novraux-ash/20 dark:border-novraux-graphite text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                                <tr>
                                    <th className="p-4 font-normal">Image</th>
                                    <th className="p-4 font-normal">Title</th>
                                    <th className="p-4 font-normal">Status</th>
                                    <th className="p-4 font-normal">Published Date</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-novraux-ash/10 dark:divide-novraux-graphite transition-colors">
                                {posts.map((post) => {
                                    const isPublished = !!post.publishedAt;
                                    return (
                                        <tr key={post.id} className="hover:bg-novraux-obsidian/5 dark:hover:bg-novraux-obsidian/30 transition-colors">
                                            <td className="p-4 w-20">
                                                <div className="relative w-12 h-12 bg-novraux-graphite dark:bg-novraux-obsidian rounded-sm overflow-hidden">
                                                    {post.imageUrl ? (
                                                        <Image
                                                            src={post.imageUrl}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-novraux-ash/30 dark:text-novraux-bone/30">
                                                            📄
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-novraux-obsidian dark:text-novraux-bone block transition-colors">{post.title}</span>
                                                <span className="text-xs text-novraux-ash dark:text-novraux-bone/60 font-mono font-light transition-colors">/{post.slug}</span>
                                            </td>
                                            <td className="p-4">
                                                {isPublished ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-normal bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 transition-colors">
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-normal bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 transition-colors">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/posts/${post.id}`}
                                                        className="px-3 py-1.5 text-xs font-normal text-novraux-gold dark:text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-obsidian rounded-sm transition-colors uppercase tracking-novraux-medium"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(post)}
                                                        className="px-3 py-1.5 text-xs font-normal text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors uppercase tracking-novraux-medium"
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
                                        <td colSpan={5} className="p-8 text-center text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
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
                <div className="fixed inset-0 bg-novraux-obsidian/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors">
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-xl max-w-md w-full p-6 space-y-4 transition-colors">
                        <h3 className="text-lg font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">Delete Article</h3>
                        <p className="text-sm text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                            Are you sure you want to delete <strong>&quot;{postToDelete.title}&quot;</strong>? This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-normal text-novraux-obsidian dark:text-novraux-bone hover:bg-novraux-ash/10 dark:hover:bg-novraux-obsidian rounded-sm transition-colors uppercase tracking-novraux-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-normal bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors uppercase tracking-novraux-medium flex items-center gap-2"
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
