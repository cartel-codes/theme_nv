'use client';

import { useState } from 'react';

interface AIArticleAssistantProps {
    onSelectTopic: (title: string) => void;
    onUpdateContent: (content: string) => void;
    onUpdateImage: (url: string) => void;
    currentTitle: string;
    currentExcerpt: string;
}

export default function AIArticleAssistant({
    onSelectTopic,
    onUpdateContent,
    onUpdateImage,
    currentTitle,
    currentExcerpt
}: AIArticleAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'ideas' | 'write' | 'image'>('ideas');

    // Ideas State
    const [niche, setNiche] = useState('luxury fashion trends');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState<string | null>(null);

    // Writer State
    const [loadingWrite, setLoadingWrite] = useState(false);

    // Image State
    const [imagePrompt, setImagePrompt] = useState('');
    const [loadingImage, setLoadingImage] = useState(false);

    // Success messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const fetchIdeas = async () => {
        setLoadingIdeas(true);
        setIdeas([]);
        try {
            const res = await fetch('/api/admin/ai/article-ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche }),
            });
            const data = await res.json();
            if (data.topics) {
                setIdeas(data.topics);
                showSuccess(`Generated ${data.topics.length} ideas!`);
            } else {
                throw new Error(data.error || 'Failed to generate ideas');
            }
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to generate ideas');
        } finally {
            setLoadingIdeas(false);
        }
    };

    const handleSelectIdea = (idea: string) => {
        setSelectedIdea(idea);
        onSelectTopic(idea);
        showSuccess('Title applied! Ready to write.');
        // Auto-switch to writer tab after 1 second
        setTimeout(() => setActiveTab('write'), 1000);
    };

    const generateWrite = async () => {
        if (!currentTitle) return alert('Please set a title first.');
        setLoadingWrite(true);
        try {
            const res = await fetch('/api/admin/ai/generate-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: currentTitle, excerpt: currentExcerpt }),
            });
            const data = await res.json();
            if (data.content) {
                onUpdateContent(data.content);
                showSuccess('Article generated successfully!');
                // Optionally close the assistant after success
                setTimeout(() => setIsOpen(false), 2000);
            } else {
                throw new Error(data.error || 'Failed to write article');
            }
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to write article');
        } finally {
            setLoadingWrite(false);
        }
    };

    const generateImage = async () => {
        const prompt = imagePrompt || currentTitle;
        if (!prompt) return alert('Please enter a prompt or set a title.');

        setLoadingImage(true);
        try {
            const res = await fetch('/api/admin/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            if (data.url) {
                onUpdateImage(data.url);
                showSuccess('Image generated and uploaded!');
            } else {
                throw new Error(data.error || 'Failed to generate image');
            }
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to generate image');
        } finally {
            setLoadingImage(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-gradient-to-r from-novraux-gold to-yellow-600 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center gap-3 font-medium"
            >
                <span className="text-2xl">✨</span>
                <span>AI Assistant</span>
            </button>
        );
    }

    const isLoading = loadingIdeas || loadingWrite || loadingImage;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-neutral-700">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-gradient-to-r from-novraux-charcoal to-neutral-800 text-white">
                <h3 className="font-serif text-lg flex items-center gap-2">
                    ✨ AI Studio
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/70 hover:text-white text-xl px-2"
                    disabled={isLoading}
                >
                    ✕
                </button>
            </div>

            {/* Success Banner */}
            {successMessage && (
                <div className="bg-green-500 text-white px-4 py-3 text-sm font-medium flex items-center gap-2">
                    <span>✓</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 px-6 py-4 rounded-lg shadow-xl flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-novraux-gold"></div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {loadingIdeas && 'Generating ideas...'}
                            {loadingWrite && 'Writing article...'}
                            {loadingImage && 'Creating image...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-700">
                {[
                    { id: 'ideas', label: '💡 Ideas' },
                    { id: 'write', label: '✍️ Writer' },
                    { id: 'image', label: '🎨 Art' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        disabled={isLoading}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-novraux-gold border-b-2 border-novraux-gold bg-neutral-50 dark:bg-neutral-800'
                                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* IDEAS TAB */}
                {activeTab === 'ideas' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium uppercase text-neutral-500 mb-2 block">Niche / Topic</label>
                            <input
                                type="text"
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                placeholder="e.g., sustainable luxury"
                                className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-novraux-gold focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={fetchIdeas}
                            disabled={loadingIdeas || !niche}
                            className="w-full py-3 bg-gradient-to-r from-novraux-gold to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingIdeas ? 'Thinking...' : '✨ Inspire Me'}
                        </button>

                        <div className="space-y-2 mt-6">
                            {ideas.length === 0 && !loadingIdeas && (
                                <p className="text-center text-neutral-400 text-sm py-8">
                                    Generate ideas to get started
                                </p>
                            )}
                            {ideas.map((idea, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelectIdea(idea)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedIdea === idea
                                            ? 'border-novraux-gold bg-yellow-50 dark:bg-yellow-900/20'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:border-novraux-gold'
                                        } text-sm dark:text-neutral-300`}
                                >
                                    <span className="text-novraux-gold mr-2">{i + 1}.</span>
                                    {idea}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* WRITER TAB */}
                {activeTab === 'write' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
                            <p className="text-xs font-medium uppercase text-neutral-500 mb-2">Current Title</p>
                            <p className="text-sm font-semibold dark:text-white">
                                {currentTitle || '(No title set - go to Ideas tab)'}
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-900 dark:text-blue-300">
                                <strong>✍️ Magic Write</strong> will generate a full 600-800 word editorial article based on your title.
                            </p>
                        </div>

                        <button
                            onClick={generateWrite}
                            disabled={!currentTitle || loadingWrite}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingWrite ? 'Writing...' : '✨ Magic Write'}
                        </button>
                    </div>
                )}

                {/* IMAGE TAB */}
                {activeTab === 'image' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium uppercase text-neutral-500 mb-2 block">Image Description</label>
                            <textarea
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                placeholder={currentTitle || "Describe your vision..."}
                                rows={4}
                                className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Leave empty to use your article title</p>
                        </div>

                        <button
                            onClick={generateImage}
                            disabled={loadingImage}
                            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loadingImage ? 'Creating...' : '🎨 Generate Image'}
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-neutral-400">Powered by Hugging Face • Stable Diffusion XL</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
