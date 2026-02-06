'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import SEOPreview from '@/components/SEOPreview';
import SEOHealthIndicator from '@/components/SEOHealthIndicator';

interface PostFormProps {
    postId?: string;
    initialData?: any;
}

export default function PostForm({ postId, initialData }: PostFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [seoLoading, setSeoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        imageUrl: '',
        publishedAt: null as string | null,
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        focusKeyword: '',
        ogImage: '',
        images: [] as any[], // Helper for ImageUploader
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                slug: initialData.slug || '',
                excerpt: initialData.excerpt || '',
                content: initialData.content || '',
                imageUrl: initialData.imageUrl || '',
                publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt).toISOString().slice(0, 16) : null,
                metaTitle: initialData.metaTitle || '',
                metaDescription: initialData.metaDescription || '',
                keywords: initialData.keywords || '',
                focusKeyword: initialData.focusKeyword || '',
                ogImage: initialData.ogImage || '',
                images: initialData.imageUrl ? [{ url: initialData.imageUrl, isPrimary: true }] : [],
            });
        }
    }, [initialData]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!postId && formData.title && !formData.slug) {
            setFormData(prev => ({
                ...prev,
                slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));
        }
    }, [formData.title, formData.slug, postId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpdate = (images: any[]) => {
        // We only take the first image for blog posts
        const mainImage = images.length > 0 ? images[0].url : '';
        setFormData(prev => ({
            ...prev,
            images,
            imageUrl: mainImage
        }));
    };

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                // If draft, clear publishedAt. If publish, set to now (or keep existing)
                publishedAt: isDraft ? null : (formData.publishedAt || new Date().toISOString()),
            };

            const method = postId ? 'PUT' : 'POST';
            const endpoint = postId ? `/api/admin/posts/${postId}` : '/api/admin/posts';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save post');
            }

            // If publishing (not draft), open the new article in a new window
            if (!isDraft) {
                const articleUrl = `/blog/${formData.slug}`;
                window.open(articleUrl, '_blank');
            }

            router.push('/admin/posts');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    const getCharCountColor = (length: number, min: number, max: number) => {
        if (length === 0) return 'text-neutral-400';
        if (length >= min && length <= max) return 'text-green-600 dark:text-green-400';
        if (length < min) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const handleGenerateSEO = async () => {
        if (!formData.title || !formData.content) {
            setError('Title and content are required to generate SEO');
            return;
        }

        setSeoLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/ai/generate-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate SEO');
            }

            // Update form data with generated SEO
            setFormData(prev => ({
                ...prev,
                metaTitle: data.metaTitle || prev.metaTitle,
                metaDescription: data.metaDescription || prev.metaDescription,
                keywords: data.keywords || prev.keywords,
                focusKeyword: data.focusKeyword || prev.focusKeyword
            }));

        } catch (err: any) {
            console.error('SEO generation failed:', err);
            setError(err.message || 'Failed to generate SEO');
        } finally {
            setSeoLoading(false);
        }
    };

    return (
        <form className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-sm text-sm font-light transition-colors">
                    {error}
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Editor Card */}
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite p-8 space-y-6 transition-colors">
                        <div>
                            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 text-lg border-b border-novraux-ash/20 dark:border-novraux-graphite focus:border-novraux-gold dark:focus:border-novraux-gold focus:outline-none bg-transparent placeholder-novraux-ash dark:placeholder-novraux-bone/50 text-novraux-obsidian dark:text-novraux-bone transition-colors"
                                placeholder="Article Title..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Slug</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 text-sm border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm bg-white dark:bg-novraux-obsidian text-novraux-ash dark:text-novraux-bone/70 focus:outline-none focus:ring-2 focus:ring-novraux-gold transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Content (Markdown)</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                rows={20}
                                className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-base font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian resize-y transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                placeholder="# Write your article here..."
                            />
                            <p className="text-xs text-novraux-ash dark:text-novraux-bone/70 mt-2 text-right font-light transition-colors">Markdown supported</p>
                        </div>
                    </div>

                    {/* SEO Section */}
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite p-8 space-y-6 transition-colors">
                        <div className="flex items-center justify-between">
                            <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">SEO Settings</h2>
                            <button
                                type="button"
                                onClick={handleGenerateSEO}
                                disabled={seoLoading || !formData.title || !formData.content}
                                className="px-4 py-2 bg-novraux-gold text-novraux-obsidian text-sm rounded-sm hover:bg-novraux-gold/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-novraux-medium font-medium"
                            >
                                {seoLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-novraux-obsidian"></div>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>Generate SEO</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Meta Title
                                        <span className={`ml-2 text-xs ${getCharCountColor(formData.metaTitle.length, 50, 60)}`}>
                                            ({formData.metaTitle.length}/60)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="metaTitle"
                                        value={formData.metaTitle}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:outline-none focus:ring-2 focus:ring-novraux-gold placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Meta Description
                                        <span className={`ml-2 text-xs ${getCharCountColor(formData.metaDescription.length, 120, 160)}`}>
                                            ({formData.metaDescription.length}/160)
                                        </span>
                                    </label>
                                    <textarea
                                        name="metaDescription"
                                        value={formData.metaDescription}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:outline-none focus:ring-2 focus:ring-novraux-gold placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Keywords (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="keywords"
                                        value={formData.keywords}
                                        onChange={handleInputChange}
                                        placeholder="luxury fashion, style, trends"
                                        className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:outline-none focus:ring-2 focus:ring-novraux-gold placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Focus Keyword</label>
                                    <input
                                        type="text"
                                        name="focusKeyword"
                                        value={formData.focusKeyword}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:outline-none focus:ring-2 focus:ring-novraux-gold placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <SEOPreview
                                    title={formData.metaTitle || formData.title}
                                    description={formData.metaDescription || formData.excerpt || formData.content.slice(0, 150)}
                                    url={`blog/${formData.slug}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Publish Action */}
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite p-6 space-y-4 transition-colors">
                        <h3 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Publishing</h3>

                        <div>
                            <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Publish Date</label>
                            <input
                                type="datetime-local"
                                name="publishedAt"
                                value={formData.publishedAt || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:outline-none focus:ring-2 focus:ring-novraux-gold"
                            />
                            <p className="text-xs text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">Leave empty to keep as Draft</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={loading}
                                className="flex-1 px-4 py-3 border border-novraux-ash/30 dark:border-novraux-graphite text-novraux-obsidian dark:text-novraux-bone rounded-sm text-sm font-medium uppercase tracking-novraux-medium hover:bg-novraux-ash/10 dark:hover:bg-novraux-graphite/50 transition-colors"
                            >
                                Save Draft
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, false)}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian rounded-sm text-sm font-medium uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors"
                            >
                                Publish
                            </button>
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite p-6 space-y-4 transition-colors">
                        <h3 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Featured Image</h3>
                        <ImageUploader
                            images={formData.images}
                            onImagesChange={handleImageUpdate}
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite p-6 space-y-4 transition-colors">
                        <h3 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Excerpt</h3>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                            placeholder="Short summary for list views..."
                        />
                    </div>
                </div>
            </div>
        </form>
    );

}
