'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PodCreatorPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data
    const [blueprints, setBlueprints] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]);

    // Selection
    const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);

    // Design State
    const [designMode, setDesignMode] = useState<'upload' | 'ai'>('upload');
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetch('/api/admin/print-providers/catalog?type=blueprints')
            .then(res => res.json())
            .then(data => {
                if (data.success) setBlueprints(data.data);
            });
    }, []);

    const fetchProviders = async (bpId: number) => {
        setLoading(true);
        const res = await fetch(`/api/admin/print-providers/catalog?type=providers&blueprint_id=${bpId}`);
        const data = await res.json();
        if (data.success) setProviders(data.data);
        setLoading(false);
    };

    const fetchVariants = async (bpId: number, pId: number) => {
        setLoading(true);
        const res = await fetch(`/api/admin/print-providers/catalog?type=variants&blueprint_id=${bpId}&provider_id=${pId}`);
        const data = await res.json();
        if (data.success) {
            setVariants(data.data.variants);
            // Auto Select first 40 to avoid 100 limit (Printify restriction)
            // Ideally we should let user choose, but for now we cap it.
            const safeVariants = data.data.variants.slice(0, 40);
            setSelectedVariants(safeVariants.map((v: any) => v.id));
        }
        setLoading(false);
    };

    const handleGenerateImage = async () => {
        if (!prompt) return;
        setGenerating(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/admin/print-providers/generate-image', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            if (data.success) {
                setImageUrl(data.image);
            } else {
                setErrorMsg('AI Generation Failed: ' + data.error);
            }
        } catch (e: any) {
            setErrorMsg('Network Error: ' + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedBlueprint || !selectedProvider || !imageUrl || !title) return;
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/admin/print-providers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    blueprintId: selectedBlueprint.id,
                    providerId: selectedProvider.id,
                    variantIds: selectedVariants,
                    imageUrl // Can be URL or Base64 URI
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Product Created and Synced!');
                router.push('/admin/print-providers');
            } else {
                setErrorMsg('Creation Failed: ' + (data.error || 'Unknown Error') + (data.details ? ' - ' + JSON.stringify(data.details) : ''));
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg('System Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <Link href="/admin/print-providers" className="text-xs text-novraux-bone/40 uppercase hover:text-novraux-bone mb-2 block">&larr; Back</Link>
                    <h1 className="text-3xl font-serif text-novraux-bone">Create Product</h1>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex gap-4 border-b border-novraux-bone/10 pb-4 text-xs uppercase tracking-widest text-novraux-bone/40">
                <span className={step >= 1 ? 'text-novraux-bone' : ''}>1. Product</span>
                <span>&rarr;</span>
                <span className={step >= 2 ? 'text-novraux-bone' : ''}>2. Provider</span>
                <span>&rarr;</span>
                <span className={step >= 3 ? 'text-novraux-bone' : ''}>3. Design</span>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {blueprints.map(bp => (
                        <button
                            key={bp.id}
                            onClick={() => {
                                setSelectedBlueprint(bp);
                                fetchProviders(bp.id);
                                setStep(2);
                            }}
                            className="bg-novraux-bone/5 border border-novraux-bone/10 p-4 rounded-sm text-left hover:border-novraux-bone/40 transition-colors flex flex-col items-center gap-2 group"
                        >
                            <div className="w-24 h-24 relative bg-white/5 rounded-full overflow-hidden mb-2">
                                <Image src={bp.images[0]} alt={bp.title} fill className="object-contain" />
                            </div>
                            <span className="text-novraux-bone font-medium text-center text-sm">{bp.title}</span>
                        </button>
                    ))}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <h3 className="text-novraux-bone">Select a Print Provider for {selectedBlueprint?.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {providers.map(p => (
                            <button
                                key={p.id}
                                onClick={async () => {
                                    setSelectedProvider(p);
                                    await fetchVariants(selectedBlueprint.id, p.id);
                                    setStep(3);
                                }}
                                className="bg-novraux-bone/5 border border-novraux-bone/10 p-6 rounded-sm text-left hover:border-novraux-bone/40 transition-colors"
                            >
                                <span className="text-novraux-bone font-medium text-lg block mb-1">{p.title}</span>
                                <span className="text-novraux-bone/60 text-xs">{p.location?.address1}, {p.location?.country}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 max-w-xl">
                    <h3 className="text-novraux-bone">Customize Design</h3>

                    <div className="space-y-2">
                        <label className="text-xs text-novraux-bone/60 uppercase">Product Title</label>
                        <input
                            type="text"
                            className="w-full bg-novraux-bone/5 border border-novraux-bone/10 p-3 text-novraux-bone focus:outline-none focus:border-novraux-bone"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. My Cool T-Shirt"
                        />
                    </div>

                    {/* Design Source Tabs */}
                    <div className="flex gap-4 border-b border-novraux-bone/10">
                        <button
                            onClick={() => setDesignMode('upload')}
                            className={`pb-2 text-xs uppercase tracking-widest ${designMode === 'upload' ? 'text-novraux-bone border-b border-novraux-bone' : 'text-novraux-bone/40'}`}
                        >
                            Upload URL
                        </button>
                        <button
                            onClick={() => setDesignMode('ai')}
                            className={`pb-2 text-xs uppercase tracking-widest ${designMode === 'ai' ? 'text-novraux-bone border-b border-novraux-bone' : 'text-novraux-bone/40'}`}
                        >
                            Generate with AI
                        </button>
                    </div>

                    {designMode === 'upload' ? (
                        <div className="space-y-2">
                            <label className="text-xs text-novraux-bone/60 uppercase">Image URL (Direct Link)</label>
                            <input
                                type="text"
                                className="w-full bg-novraux-bone/5 border border-novraux-bone/10 p-3 text-novraux-bone focus:outline-none focus:border-novraux-bone"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/my-design.png"
                            />
                            <p className="text-[10px] text-novraux-bone/40">Ideally a PNG with transparent background.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-novraux-bone/60 uppercase">AI Prompt</label>
                                <textarea
                                    className="w-full bg-novraux-bone/5 border border-novraux-bone/10 p-3 text-novraux-bone focus:outline-none focus:border-novraux-bone h-24 resize-none"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g. A cyberpunk cat with neon glasses, vector art style"
                                />
                            </div>
                            <button
                                onClick={handleGenerateImage}
                                disabled={generating || !prompt}
                                className="px-4 py-2 bg-novraux-bone/10 text-novraux-bone hover:bg-novraux-bone hover:text-novraux-obsidian text-xs uppercase tracking-widest rounded-sm transition-colors w-full"
                            >
                                {generating ? 'Generating...' : 'Generate Design'}
                            </button>
                        </div>
                    )}

                    {/* Preview */}
                    {imageUrl && (
                        <div className="bg-white/5 p-4 rounded-sm flex justify-center">
                            <img src={imageUrl} alt="Design Preview" className="max-h-48 object-contain" />
                        </div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={loading || !title || !imageUrl || selectedVariants.length === 0}
                        className="w-full py-4 bg-novraux-bone text-novraux-obsidian uppercase tracking-widest font-bold hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating Product...' : 'Create & Publish'}
                    </button>
                    {selectedVariants.length === 0 && !loading && (
                        <p className="text-red-500 text-xs text-center">No variants loaded. Please wait or try again.</p>
                    )}
                    {selectedVariants.length > 0 && (
                        <p className="text-novraux-bone/40 text-[10px] text-center mt-2">
                            Creating with {selectedVariants.length} variants (capped at 40 to prevent API limits).
                        </p>
                    )}
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-xs rounded-sm break-all">
                            {errorMsg}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
