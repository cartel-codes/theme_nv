'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
    niche: string;
    selectedTitle: string;
    selectedAngle: string;
    content: string;
    excerpt: string;
    imageUrl: string;
    seo: {
        metaTitle: string;
        metaDescription: string;
        keywords: string;
        focusKeyword: string;
    };
}

export default function AIArticleWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step data
    const [niche, setNiche] = useState('');
    const [useCustomTitle, setUseCustomTitle] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [titles, setTitles] = useState<string[]>([]);
    const [selectedTitle, setSelectedTitle] = useState('');

    const [angles, setAngles] = useState<string[]>([]);
    const [selectedAngle, setSelectedAngle] = useState('');

    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');

    const [imageUrl, setImageUrl] = useState('');
    const [seo, setSeo] = useState({
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        focusKeyword: ''
    });

    const [showPreview, setShowPreview] = useState(false);

    const callWizardAPI = async (step: number, data: any) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/ai/wizard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step, data }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Request failed');

            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleStep1 = async () => {
        if (useCustomTitle) {
            if (!customTitle) return setError('Please enter a title');
            setSelectedTitle(customTitle);
            setCurrentStep(2);
            // Generate angles immediately with the title
            setTimeout(() => handleStep2(customTitle), 500);
        } else {
            if (!niche) return setError('Please enter a niche');
            const result = await callWizardAPI(1, { niche });
            setTitles(result.titles);
        }
    };

    const handleTitleSelect = (title: string) => {
        setSelectedTitle(title);
        setCurrentStep(2);
        // Auto-generate angles with the title
        setTimeout(() => handleStep2(title), 500);
    };

    const handleStep2 = async (title?: string) => {
        const titleToUse = title || selectedTitle;
        const result = await callWizardAPI(2, { title: titleToUse });
        setAngles(result.angles);
    };

    const handleAngleSelect = async (angle: string) => {
        setSelectedAngle(angle);
        setCurrentStep(3);
        // Auto-generate content with the angle
        setTimeout(() => handleStep3(angle), 500);
    };

    const handleStep3 = async (angle?: string) => {
        const angleToUse = angle || selectedAngle;
        const result = await callWizardAPI(3, {
            selectedTitle,
            selectedAngle: angleToUse
        });
        setContent(result.content);
        setExcerpt(result.excerpt);
        setCurrentStep(4);
        // Auto-generate media & SEO with content
        setTimeout(() => handleStep4(result.content), 500);
    };

    const handleStep4 = async (articleContent?: string) => {
        const contentToUse = articleContent || content;
        const result = await callWizardAPI(4, {
            finalTitle: selectedTitle,
            finalContent: contentToUse
        });
        setImageUrl(result.imageUrl);
        setSeo(result.seo);
        setCurrentStep(5);
    };

    const handleSave = async (isDraft: boolean) => {
        try {
            const slug = selectedTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const payload = {
                title: selectedTitle,
                slug,
                content,
                excerpt,
                imageUrl,
                metaTitle: seo.metaTitle,
                metaDescription: seo.metaDescription,
                keywords: seo.keywords,
                focusKeyword: seo.focusKeyword,
                publishedAt: isDraft ? null : new Date().toISOString(),
            };

            const res = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save post');

            const post = await res.json();
            router.push(`/admin/posts/${post.id}`);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const progressPercent = (currentStep / 5) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white mb-2">
                            ✨ AI Article Wizard
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Create a complete article in 5 automated steps
                        </p>
                    </div>
                    <Link
                        href="/admin/posts"
                        className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                    >
                        ← Back to Posts
                    </Link>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        {[1, 2, 3, 4, 5].map(step => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step < currentStep
                                    ? 'bg-green-500 text-white'
                                    : step === currentStep
                                        ? 'bg-novraux-gold text-white'
                                        : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500'
                                    }`}>
                                    {step < currentStep ? '✓' : step}
                                </div>
                                {step < 5 && (
                                    <div className={`w-24 h-1 ${step < currentStep ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-novraux-gold to-yellow-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-novraux-gold"></div>
                            <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
                                {currentStep === 1 && 'Generating trending titles...'}
                                {currentStep === 2 && 'Finding article angles...'}
                                {currentStep === 3 && 'Writing your article...'}
                                {currentStep === 4 && 'Creating image & SEO...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-700">

                    {/* STEP 1: Niche/Title Input */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                Step 1: Choose Your Starting Point
                            </h2>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setUseCustomTitle(false)}
                                    className={`flex-1 p-4 border-2 rounded-lg transition-all ${!useCustomTitle
                                        ? 'border-novraux-gold bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'border-neutral-300 dark:border-neutral-600'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">💡</div>
                                    <div className="font-semibold">Generate Ideas</div>
                                    <div className="text-sm text-neutral-500">Let AI suggest titles</div>
                                </button>
                                <button
                                    onClick={() => setUseCustomTitle(true)}
                                    className={`flex-1 p-4 border-2 rounded-lg transition-all ${useCustomTitle
                                        ? 'border-novraux-gold bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'border-neutral-300 dark:border-neutral-600'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">✍️</div>
                                    <div className="font-semibold">Custom Title</div>
                                    <div className="text-sm text-neutral-500">I have my own</div>
                                </button>
                            </div>

                            {!useCustomTitle ? (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Enter your niche or topic
                                    </label>
                                    <input
                                        type="text"
                                        value={niche}
                                        onChange={(e) => setNiche(e.target.value)}
                                        placeholder="e.g., sustainable luxury fashion"
                                        className="w-full p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg text-lg dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-novraux-gold"
                                    />
                                    {titles.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                                Select a title:
                                            </p>
                                            {titles.map((title, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleTitleSelect(title)}
                                                    className="w-full text-left p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-novraux-gold hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all"
                                                >
                                                    <span className="text-novraux-gold font-bold mr-2">{i + 1}.</span>
                                                    {title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Enter your article title
                                    </label>
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        placeholder="e.g., The Art of Minimalist Luxury"
                                        className="w-full p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg text-lg dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-novraux-gold"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleStep1}
                                disabled={loading || (!niche && !customTitle)}
                                className="w-full py-4 bg-gradient-to-r from-novraux-gold to-yellow-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {useCustomTitle ? 'Continue' : 'Generate Titles'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Angle Selection */}
                    {currentStep === 2 && angles.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                Step 2: Choose Your Angle
                            </h2>
                            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                <p className="text-sm text-neutral-500">Selected Title:</p>
                                <p className="font-semibold text-neutral-900 dark:text-white">{selectedTitle}</p>
                            </div>
                            <div className="space-y-3">
                                {angles.map((angle, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAngleSelect(angle)}
                                        className="w-full text-left p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-novraux-gold hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all"
                                    >
                                        <span className="text-novraux-gold font-bold mr-2">{i + 1}.</span>
                                        {angle}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Content Generation (Auto) */}
                    {currentStep === 3 && content && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                Step 3: Article Generated
                            </h2>
                            <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">✓</span>
                                    <span className="font-semibold text-green-900 dark:text-green-300">
                                        Article content generated successfully!
                                    </span>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    {content.split(' ').length} words written
                                </p>
                            </div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={12}
                                className="w-full p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg font-mono text-sm dark:bg-neutral-800 dark:text-white"
                            />
                        </div>
                    )}

                    {/* STEP 4: Image & SEO Generation (Auto) */}
                    {currentStep === 4 && seo.metaTitle && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                Step 4: Media & SEO Generated
                            </h2>

                            {imageUrl && (
                                <div>
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                        Featured Image:
                                    </p>
                                    <img
                                        src={imageUrl}
                                        alt="Generated"
                                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={seo.metaTitle}
                                        onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                                        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={seo.metaDescription}
                                        onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                                        rows={3}
                                        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-full py-4 bg-gradient-to-r from-novraux-gold to-yellow-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
                            >
                                Review & Save
                            </button>
                        </div>
                    )}

                    {/* STEP 5: Review & Save */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                Step 5: Review & Save
                            </h2>

                            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <h3 className="font-bold text-lg mb-2">🎉 Your Article is Ready!</h3>
                                <ul className="text-sm space-y-1 text-neutral-700 dark:text-neutral-300">
                                    <li>✓ Title: {selectedTitle}</li>
                                    <li>✓ Content: {content.split(' ').length} words</li>
                                    <li>✓ Featured Image: {imageUrl ? 'Generated' : 'Skipped'}</li>
                                    <li>✓ SEO Metadata: Complete</li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="flex-1 py-4 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg font-semibold text-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
                                >
                                    Publish Now
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setCurrentStep(1);
                                    setNiche('');
                                    setTitles([]);
                                    setSelectedTitle('');
                                    setAngles([]);
                                    setContent('');
                                }}
                                className="w-full py-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                ← Start Over
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
