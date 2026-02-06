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
        <div className="min-h-screen bg-gradient-to-br from-novraux-bone to-white dark:from-novraux-obsidian dark:to-novraux-graphite p-8 transition-colors">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone mb-2 tracking-wide transition-colors">
                            ✨ AI Article Wizard
                        </h1>
                        <p className="text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                            Create a complete article in 5 automated steps
                        </p>
                    </div>
                    <Link
                        href="/admin/posts"
                        className="px-4 py-3 text-sm text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone border border-novraux-ash/30 dark:border-novraux-graphite rounded-sm hover:bg-novraux-ash/10 dark:hover:bg-novraux-graphite/50 transition-all uppercase tracking-novraux-medium"
                    >
                        ← Back to Posts
                    </Link>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        {[1, 2, 3, 4, 5].map(step => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                                    step < currentStep
                                        ? 'bg-green-600 dark:bg-green-500 text-white'
                                        : step === currentStep
                                            ? 'bg-novraux-gold text-novraux-obsidian'
                                            : 'bg-novraux-ash/30 dark:bg-novraux-graphite text-novraux-ash dark:text-novraux-bone/50'
                                }`}>
                                    {step < currentStep ? '✓' : step}
                                </div>
                                {step < 5 && (
                                    <div className={`w-24 h-1 transition-colors ${
                                        step < currentStep ? 'bg-green-600 dark:bg-green-500' : 'bg-novraux-ash/30 dark:bg-novraux-graphite'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-novraux-ash/20 dark:bg-novraux-graphite rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-novraux-gold to-yellow-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm text-red-800 dark:text-red-300 font-light transition-colors">
                        {error}
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm shadow-2xl flex flex-col items-center gap-4 transition-colors">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-novraux-gold"></div>
                            <p className="text-lg font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                {currentStep === 1 && 'Generating trending titles...'}
                                {currentStep === 2 && 'Finding article angles...'}
                                {currentStep === 3 && 'Writing your article...'}
                                {currentStep === 4 && 'Creating image & SEO...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-lg p-8 border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">

                    {/* STEP 1: Niche/Title Input */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                Step 1: Choose Your Starting Point
                            </h2>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setUseCustomTitle(false)}
                                    className={`flex-1 p-4 border-2 rounded-sm transition-all ${
                                        !useCustomTitle
                                            ? 'border-novraux-gold bg-novraux-gold/10 dark:bg-novraux-gold/20'
                                            : 'border-novraux-ash/30 dark:border-novraux-graphite'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">💡</div>
                                    <div className="font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">Generate Ideas</div>
                                    <div className="text-sm text-novraux-ash dark:text-novraux-bone/70 transition-colors">Let AI suggest titles</div>
                                </button>
                                <button
                                    onClick={() => setUseCustomTitle(true)}
                                    className={`flex-1 p-4 border-2 rounded-sm transition-all ${
                                        useCustomTitle
                                            ? 'border-novraux-gold bg-novraux-gold/10 dark:bg-novraux-gold/20'
                                            : 'border-novraux-ash/30 dark:border-novraux-graphite'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">✍️</div>
                                    <div className="font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">Custom Title</div>
                                    <div className="text-sm text-novraux-ash dark:text-novraux-bone/70 transition-colors">I have my own</div>
                                </button>
                            </div>

                            {!useCustomTitle ? (
                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Enter your niche or topic
                                    </label>
                                    <input
                                        type="text"
                                        value={niche}
                                        onChange={(e) => setNiche(e.target.value)}
                                        placeholder="e.g., sustainable luxury fashion"
                                        className="w-full p-4 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-lg dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian focus:ring-2 focus:ring-novraux-gold transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                    />
                                    {titles.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <p className="text-sm font-medium text-novraux-ash dark:text-novraux-bone/70 uppercase tracking-novraux-medium transition-colors">
                                                Select a title:
                                            </p>
                                            {titles.map((title, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleTitleSelect(title)}
                                                    className="w-full text-left p-4 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm hover:border-novraux-gold hover:bg-novraux-gold/5 dark:hover:bg-novraux-gold/10 transition-all text-novraux-obsidian dark:text-novraux-bone"
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
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Enter your article title
                                    </label>
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        placeholder="e.g., The Art of Minimalist Luxury"
                                        className="w-full p-4 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-lg dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian focus:ring-2 focus:ring-novraux-gold transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleStep1}
                                disabled={loading || (!niche && !customTitle)}
                                className="w-full py-4 bg-gradient-to-r from-novraux-gold to-yellow-600 text-novraux-obsidian rounded-sm font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 uppercase tracking-novraux-medium"
                            >
                                {useCustomTitle ? 'Continue' : 'Generate Titles'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Angle Selection */}
                    {currentStep === 2 && angles.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                Step 2: Choose Your Angle
                            </h2>
                            <div className="p-4 bg-novraux-ash/10 dark:bg-novraux-obsidian rounded-sm transition-colors">
                                <p className="text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 mb-1 transition-colors">Selected Title:</p>
                                <p className="font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">{selectedTitle}</p>
                            </div>
                            <div className="space-y-3">
                                {angles.map((angle, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAngleSelect(angle)}
                                        className="w-full text-left p-4 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm hover:border-novraux-gold hover:bg-novraux-gold/5 dark:hover:bg-novraux-gold/10 transition-all text-novraux-obsidian dark:text-novraux-bone"
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
                            <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                Step 3: Article Generated
                            </h2>
                            <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">✓</span>
                                    <span className="font-medium text-green-900 dark:text-green-300 transition-colors">
                                        Article content generated successfully!
                                    </span>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-400 font-light transition-colors">
                                    {content.split(' ').length} words written
                                </p>
                            </div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={12}
                                className="w-full p-4 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm font-mono text-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:ring-2 focus:ring-novraux-gold"
                            />
                        </div>
                    )}

                    {/* STEP 4: Image & SEO Generation (Auto) */}
                    {currentStep === 4 && seo.metaTitle && (
                        <div className="space-y-6">
                            <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                Step 4: Media & SEO Generated
                            </h2>

                            {imageUrl && (
                                <div>
                                    <p className="text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 mb-2 transition-colors">
                                        Featured Image:
                                    </p>
                                    <img
                                        src={imageUrl}
                                        alt="Generated"
                                        className="w-full rounded-sm border border-novraux-ash/20 dark:border-novraux-graphite transition-colors"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={seo.metaTitle}
                                        onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                                        className="w-full p-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:ring-2 focus:ring-novraux-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={seo.metaDescription}
                                        onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                                        rows={3}
                                        className="w-full p-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors focus:ring-2 focus:ring-novraux-gold"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep(5)}
                                className="w-full py-4 bg-gradient-to-r from-novraux-gold to-yellow-600 text-novraux-obsidian rounded-sm font-semibold text-lg hover:shadow-lg transition-all uppercase tracking-novraux-medium"
                            >
                                Review & Save
                            </button>
                        </div>
                    )}

                    {/* STEP 5: Review & Save */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                Step 5: Review & Save
                            </h2>

                            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-sm transition-colors">
                                <h3 className="font-bold text-lg mb-2 text-novraux-obsidian dark:text-novraux-bone transition-colors">🎉 Your Article is Ready!</h3>
                                <ul className="text-sm space-y-1 text-novraux-obsidian dark:text-novraux-bone font-light transition-colors">
                                    <li>✓ Title: {selectedTitle}</li>
                                    <li>✓ Content: {content.split(' ').length} words</li>
                                    <li>✓ Featured Image: {imageUrl ? 'Generated' : 'Skipped'}</li>
                                    <li>✓ SEO Metadata: Complete</li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="flex-1 py-4 border-2 border-novraux-ash/30 dark:border-novraux-graphite text-novraux-obsidian dark:text-novraux-bone rounded-sm font-semibold text-lg hover:bg-novraux-ash/10 dark:hover:bg-novraux-graphite/50 transition-all uppercase tracking-novraux-medium"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-sm font-semibold text-lg hover:shadow-lg transition-all uppercase tracking-novraux-medium"
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
                                className="w-full py-3 text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors uppercase tracking-novraux-medium text-sm"
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
