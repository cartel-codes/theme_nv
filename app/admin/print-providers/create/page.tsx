'use client';

import { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PodCreatorPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    // Data
    const [blueprints, setBlueprints] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]);

    // Design State
    const [designPrompt, setDesignPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [seo, setSeo] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [generatorMode, setGeneratorMode] = useState<'openai' | 'standard'>('openai');

    // Selection
    const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);

    // Search & Treasury
    const [bpSearch, setBpSearch] = useState('');
    const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
    const [vaultImages, setVaultImages] = useState<{ key: string; url: string }[]>([]);
    const [showTreasury, setShowTreasury] = useState(false);
    const [vaultLoading, setVaultLoading] = useState(false);
    const [vaultError, setVaultError] = useState('');
    const [filterAvailable, setFilterAvailable] = useState(false);
    const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean>>({});
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityChecked, setAvailabilityChecked] = useState(0);

    // Transformation States
    const [designScale, setDesignScale] = useState(1);
    const [designX, setDesignX] = useState(0.5);
    const [designY, setDesignY] = useState(0.5);

    // Load blueprints, treasury, and check for draft from AI workflows
    useEffect(() => {
        fetch('/api/admin/print-providers/catalog?type=blueprints')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const sorted = (data.data || []).sort((a: any, b: any) => a.title.localeCompare(b.title));
                    setBlueprints(sorted);
                    setAvailabilityMap({});
                    setAvailabilityChecked(0);
                }
            });

        fetch('/api/admin/ai/designs')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSavedDesigns(data.designs);
            });

        // Check for draft from Auto-Listing or Collection Generator
        const draftData = sessionStorage.getItem('printifyDraft');
        if (draftData) {
            try {
                const draft = JSON.parse(draftData);
                console.log('📦 Loading draft from AI workflow:', draft);
                
                // Pre-fill form fields
                if (draft.imageUrl) setImageUrl(draft.imageUrl);
                if (draft.title) setTitle(draft.title);
                if (draft.description) setDescription(draft.description);
                if (draft.prompt) setDesignPrompt(draft.prompt);
                if (draft.tags || draft.suggestedProducts) {
                    const seoData: any = {};
                    if (draft.tags) seoData.tags = draft.tags;
                    if (draft.suggestedProducts) seoData.suggestedProducts = draft.suggestedProducts;
                    if (draft.price) seoData.suggestedPrice = draft.price;
                    setSeo(seoData);
                }
                
                // Clear the draft after loading
                sessionStorage.removeItem('printifyDraft');
            } catch (e) {
                console.error('Failed to parse draft:', e);
            }
        }
    }, []);

    const checkBlueprintAvailability = async (blueprintId: number) => {
        try {
            const providersRes = await fetch(`/api/admin/print-providers/catalog?type=providers&blueprint_id=${blueprintId}`);
            const providersData = await providersRes.json();
            const providersList = Array.isArray(providersData.data)
                ? providersData.data
                : (providersData.data?.data || []);

            if (providersList.length === 0) {
                return false;
            }

            const providerId = providersList[0].id;
            const variantsRes = await fetch(
                `/api/admin/print-providers/catalog?type=variants&blueprint_id=${blueprintId}&provider_id=${providerId}`
            );
            const variantsData = await variantsRes.json();
            const variantsList = variantsData.data?.variants || variantsData.data || [];

            return Array.isArray(variantsList)
                ? variantsList.some((v: any) => v.is_available !== false)
                : false;
        } catch {
            return false;
        }
    };

    const runAvailabilityCheck = async () => {
        setAvailabilityLoading(true);
        setAvailabilityChecked(0);
        const nextMap: Record<number, boolean> = {};
        const batchSize = 6;

        for (let i = 0; i < blueprints.length; i += batchSize) {
            const batch = blueprints.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (bp) => ({
                    id: bp.id,
                    available: await checkBlueprintAvailability(bp.id)
                }))
            );

            results.forEach(result => {
                nextMap[result.id] = result.available;
            });

            setAvailabilityMap(prev => ({ ...prev, ...nextMap }));
            setAvailabilityChecked(prev => prev + results.length);
        }

        setAvailabilityLoading(false);
    };

    const openVault = async () => {
        setVaultError('');
        setVaultLoading(true);
        try {
            const res = await fetch('/api/admin/r2?prefix=ai-generated/');
            const data = await res.json();
            if (data.success) {
                setVaultImages(data.files || []);
            } else {
                setVaultError(data.error || 'Failed to load vault images.');
            }
        } catch (e: any) {
            setVaultError(e.message || 'Failed to load vault images.');
        } finally {
            setVaultLoading(false);
            setShowTreasury(true);
        }
    };

    // Step 1: Blueprint
    const handleSelectBlueprint = async (bp: any) => {
        setSelectedBlueprint(bp);
        setStep(2);
    };

    // Step 2: Generate Design
    const handleGenerateDesign = async () => {
        if (!designPrompt.trim()) {
            setErrorMsg('Please describe the design vision you wish to materialize.');
            return;
        }

        setGenerating(true);
        setErrorMsg('');

        try {
            // Contextualize prompt with selected blueprint
            const contextualPrompt = selectedBlueprint
                ? `${designPrompt} (optimized for a ${selectedBlueprint.title})`
                : designPrompt;

            console.log('🎨 Materializing vision for product:', selectedBlueprint?.title);
            let nextImageUrl = '';

            if (generatorMode === 'openai') {
                const imageRes = await fetch('/api/admin/ai/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: contextualPrompt,
                        model: 'gpt-image-1',
                        quality: 'high',
                        size: '1024x1024',
                        n: 1,
                        saveToR2: true,
                    })
                });
                const imageData = await imageRes.json();

                if (!imageRes.ok) {
                    throw new Error(imageData.error || 'OpenAI generation failed');
                }

                nextImageUrl = imageData.data?.[0]?.url || '';
            } else {
                const imageRes = await fetch('/api/admin/print-providers/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: contextualPrompt })
                });
                const imageData = await imageRes.json();

                if (!imageData.success) throw new Error(imageData.error || 'Artistic generation failed');
                nextImageUrl = imageData.image;
            }

            if (!nextImageUrl) {
                throw new Error('Image generation returned no image');
            }

            setImageUrl(nextImageUrl);

            console.log('📖 Drafting luxury manifest...');
            const aiRes = await fetch('/api/admin/print-providers/generate-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: contextualPrompt })
            });
            const aiData = await aiRes.json();

            if (aiData.success) {
                setTitle(aiData.title);
                setDescription(aiData.description);
                setSeo(aiData.seo);

                // Auto-save to treasury
                try {
                    fetch('/api/admin/ai/designs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: designPrompt,
                            imageUrl: nextImageUrl,
                            revisedPrompt: aiData.revisedPrompt || '',
                            category: aiData.seo?.suggestedCategory || 'General',
                            title: aiData.title,
                            description: aiData.description,
                            seo: aiData.seo
                        })
                    }).then(res => res.json()).then(saveData => {
                        if (saveData.success) setSavedDesigns(prev => [saveData.design, ...prev]);
                    }).catch(e => console.error('Treasury save failed:', e));
                } catch (e) {
                    console.error('Silent treasury fail:', e);
                }
            } else {
                setTitle('Untitled Masterpiece');
                setDescription(designPrompt);
            }

            await loadProviders();
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const loadProviders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/print-providers/catalog?type=providers&blueprint_id=${selectedBlueprint.id}`);
            const data = await res.json();
            if (data.success) {
                const providerList = Array.isArray(data.data)
                    ? data.data
                    : (data.data?.data || []);
                setProviders(providerList);

                if (providerList.length === 0) {
                    setErrorMsg('No workshops returned for this blueprint. Try another product or verify Printify setup.');
                } else {
                    setStep(3);
                }
            } else {
                setErrorMsg(data.error || 'No artisan workshops found for this canvas.');
            }
        } catch (e: any) {
            setErrorMsg(e.message || 'Failed to fetch partners.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Provider
    const handleSelectProvider = async (provider: any) => {
        setSelectedProvider(provider);
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/print-providers/catalog?type=variants&blueprint_id=${selectedBlueprint.id}&provider_id=${provider.id}`
            );
            const data = await res.json();
            if (data.success) {
                const fetchedVariants = data.data.variants || [];
                setVariants(fetchedVariants);
                // Auto-select first few variants to unblock
                setSelectedVariants(fetchedVariants.slice(0, 10).map((v: any) => v.id));
                setStep(4);
            }
        } catch (e) {
            setErrorMsg('Failed to retrieve configurations.');
        } finally {
            setLoading(false);
        }
    };

    // Step 5: Final Creation
    const handleCreate = async () => {
        // Client-side validation first
        if (!title || title.trim() === '') {
            setErrorMsg('Title is required. Please provide a name for this masterpiece.');
            return;
        }
        if (!description || description.trim() === '') {
            setErrorMsg('Description is required. Please add an editorial narrative.');
            return;
        }
        if (!imageUrl) {
            setErrorMsg('No design image found. Please return to Step 2 to generate or select a design.');
            return;
        }
        if (!selectedVariants || selectedVariants.length === 0) {
            setErrorMsg('No variants selected. Please return to Step 4 to select at least one variant.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        try {
            const payload = {
                title,
                description,
                blueprintId: selectedBlueprint.id,
                providerId: selectedProvider.id,
                variantIds: selectedVariants,
                imageUrl,
                seo,
                designX,
                designY,
                designScale,
                tags: ['ai-generated', 'novraux-elite', selectedBlueprint.title.toLowerCase().replace(/\s+/g, '-')]
            };

            console.log('🚀 Sending manifest payload:', payload);

            const res = await fetch('/api/admin/print-providers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            console.log('📦 API Response:', data);

            if (data.success) {
                router.push(`/admin/print-providers/import/${data.product.id}`);
            } else {
                // Specific handling for 8150 or other Printify errors
                if (data.code === 8150) {
                    setErrorMsg('Infrastructure Validation Failed (8150). Some of the selected configurations are currently incompatible with this blueprint. Try adjusting the variants.');
                } else if (data.details && Array.isArray(data.details)) {
                    // Show detailed validation errors from backend
                    setErrorMsg(`Validation failed: ${data.details.join(', ')}`);
                } else {
                    setErrorMsg(data.error || 'Manifestation process failed');
                }
            }
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredBlueprints = blueprints
        .filter(bp => bp.title.toLowerCase().includes(bpSearch.toLowerCase()))
        .filter(bp => !filterAvailable || availabilityMap[bp.id]);

    const progressSteps = [
        { id: 1, name: 'Foundation' },
        { id: 2, name: 'Identity' },
        { id: 3, name: 'Workshop' },
        { id: 4, name: 'Aesthetics' },
        { id: 5, name: 'Manifest' }
    ];

    return (
        <div className="flex min-h-[calc(100vh-200px)] gap-12 max-w-7xl mx-auto py-10 px-6">

            {/* Left Sidebar: Progress */}
            <div className="w-64 flex-shrink-0">
                <div className="sticky top-10 space-y-8">
                    <div className="space-y-2">
                        <Link href="/admin/print-providers" className="text-[10px] uppercase tracking-[0.3em] text-novraux-bone/40 hover:text-novraux-bone transition-colors mb-6 block">
                            ← Abandon Flow
                        </Link>
                        <h1 className="text-3xl font-serif text-novraux-bone italic font-light">Atelier Creator</h1>
                    </div>

                    <div className="space-y-6 relative pt-4">
                        {/* Vertical Line */}
                        <div className="absolute left-[11px] top-6 bottom-6 w-[1px] bg-novraux-bone/10" />

                        {progressSteps.map((s) => (
                            <div key={s.id} className="flex items-center gap-4 group">
                                <div className={`relative z-10 w-6 h-6 rounded-full border text-[9px] flex items-center justify-center transition-all duration-700 ${step === s.id
                                    ? 'bg-novraux-bone border-novraux-bone text-novraux-obsidian scale-110 shadow-[0_0_20px_rgba(232,230,223,0.2)]'
                                    : step > s.id
                                        ? 'bg-novraux-bone/20 border-novraux-bone/20 text-novraux-bone'
                                        : 'bg-transparent border-novraux-bone/10 text-novraux-bone/30'
                                    }`}>
                                    {step > s.id ? '✓' : s.id}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${step === s.id ? 'text-novraux-bone font-medium' : 'text-novraux-bone/20'
                                        }`}>
                                        {s.name}
                                    </span>
                                    {step === s.id && <span className="text-[8px] text-novraux-bone/40 italic mt-1 animate-pulse">Current Phase</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Content */}
            <div className="flex-1 max-w-4xl">

                {/* STEP 1: FOUNDATION SELECTION */}
                {step === 1 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-5xl font-serif text-novraux-bone leading-tight font-light italic">The Canvas</h2>
                                    <p className="text-novraux-bone/50 text-base mt-6 max-w-md">Select the premium physical medium that will embody your artistic vision.</p>
                                </div>
                                <div className="flex-shrink-0 w-72 pb-2 space-y-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Refine catalog..."
                                            className="w-full bg-transparent border-b border-novraux-bone/10 py-3 text-xs text-novraux-bone focus:outline-none focus:border-novraux-bone transition-all placeholder:text-novraux-bone/20 font-light"
                                            value={bpSearch}
                                            onChange={(e) => setBpSearch(e.target.value)}
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-novraux-bone transition-all duration-700 group-focus-within:w-full" />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.4em] text-novraux-bone/40">
                                        <span>In Stock Only</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextValue = !filterAvailable;
                                                setFilterAvailable(nextValue);
                                                if (nextValue) {
                                                    runAvailabilityCheck();
                                                }
                                            }}
                                            className={`px-3 py-1 border transition-all ${filterAvailable
                                                ? 'bg-novraux-bone text-novraux-obsidian border-novraux-bone'
                                                : 'border-novraux-bone/20 text-novraux-bone/40 hover:text-novraux-bone'}
                                            `}
                                        >
                                            {filterAvailable ? 'On' : 'Off'}
                                        </button>
                                    </div>
                                    {filterAvailable && (
                                        <p className="text-[9px] text-novraux-bone/30 tracking-[0.3em]">
                                            {availabilityLoading ? `Checking ${availabilityChecked}/${blueprints.length}` : 'Availability ready'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 max-h-[650px] overflow-y-auto pr-6 custom-scrollbar pb-10">
                            {filterAvailable && availabilityLoading && filteredBlueprints.length === 0 && (
                                <div className="col-span-full text-[10px] uppercase tracking-[0.4em] text-novraux-bone/40">
                                    Filtering in-stock products...
                                </div>
                            )}
                            {filterAvailable && !availabilityLoading && filteredBlueprints.length === 0 && (
                                <div className="col-span-full text-[10px] uppercase tracking-[0.4em] text-novraux-bone/40">
                                    No in-stock products found. Try clearing the filter.
                                </div>
                            )}
                            {filteredBlueprints.map((bp) => (
                                <button
                                    key={bp.id}
                                    onClick={() => handleSelectBlueprint(bp)}
                                    className="group relative aspect-[3/4] bg-white/[0.02] border border-white/5 p-8 flex flex-col items-center justify-center gap-8 hover:border-novraux-bone/30 transition-all duration-700 hover:bg-white/[0.05] shadow-lg"
                                >
                                    <div className="relative w-full aspect-square filter grayscale brightness-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out">
                                        <img
                                            src={bp.images?.[0] || 'https://placehold.co/400x400?text=Premium+Base'}
                                            alt={bp.title}
                                            className="w-full h-full object-contain mix-blend-screen opacity-60 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <span className="text-[9px] uppercase tracking-[0.4em] text-novraux-bone/30 font-light group-hover:text-novraux-bone transition-colors">{bp.brand || 'Elite Series'}</span>
                                        <h3 className="text-[11px] font-serif text-novraux-bone tracking-[0.2em] line-clamp-1 uppercase font-light">{bp.title}</h3>
                                    </div>

                                    <div className="absolute inset-x-8 bottom-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700">
                                        <div className="w-full py-3 bg-novraux-bone text-novraux-obsidian text-[9px] uppercase tracking-[0.5em] font-bold shadow-2xl">Use Foundation</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: AI IDENTITY */}
                {step === 2 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-6">
                            <h2 className="text-5xl font-serif text-novraux-bone leading-tight">Define the <br /><span className="italic">extraordinary</span>.</h2>
                            <p className="text-novraux-bone/50 text-base max-w-xl leading-relaxed">
                                Our creative engine will interpret your vision for the <span className="text-novraux-bone font-medium italic">{selectedBlueprint?.title}</span>.
                            </p>
                        </div>

                        <div className="space-y-10 bg-white/[0.03] border border-white/5 p-12 rounded-sm backdrop-blur-sm shadow-2xl">
                            <div className="space-y-6">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-novraux-bone/40">The Artistic Vision</label>
                                <textarea
                                    className="w-full bg-transparent border-b border-novraux-bone/5 py-4 text-2xl font-serif text-novraux-bone focus:outline-none focus:border-novraux-bone/40 transition-all resize-none placeholder:text-novraux-bone/5 leading-relaxed"
                                    rows={3}
                                    value={designPrompt}
                                    onChange={(e) => setDesignPrompt(e.target.value)}
                                    placeholder="Describe your design masterpiece..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-novraux-bone/40">Generation Engine</label>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setGeneratorMode('openai')}
                                        className={`px-4 py-2 text-[10px] uppercase tracking-[0.4em] border transition-all ${generatorMode === 'openai'
                                            ? 'bg-novraux-bone text-novraux-obsidian border-novraux-bone'
                                            : 'bg-transparent text-novraux-bone/40 border-white/10 hover:border-novraux-bone/40'}
                                        `}
                                    >
                                        OpenAI
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGeneratorMode('standard')}
                                        className={`px-4 py-2 text-[10px] uppercase tracking-[0.4em] border transition-all ${generatorMode === 'standard'
                                            ? 'bg-novraux-bone text-novraux-obsidian border-novraux-bone'
                                            : 'bg-transparent text-novraux-bone/40 border-white/10 hover:border-novraux-bone/40'}
                                        `}
                                    >
                                        Standard
                                    </button>
                                </div>
                                <p className="text-[10px] text-novraux-bone/40 tracking-widest">
                                    OpenAI uses `gpt-image-1` and saves to R2. Standard uses the legacy generator.
                                </p>
                            </div>

                            {errorMsg && (
                                <div className="text-red-400 text-[10px] uppercase tracking-widest bg-red-400/5 p-6 border border-red-400/10">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="space-y-4">
                                <button
                                    onClick={handleGenerateDesign}
                                    disabled={generating || !designPrompt.trim()}
                                    className="w-full py-7 bg-novraux-bone text-novraux-obsidian text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-white transition-all disabled:opacity-20 flex items-center justify-center gap-6 shadow-xl"
                                >
                                    {generating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-novraux-obsidian/20 border-t-novraux-obsidian rounded-full animate-spin" />
                                            Materializing Masterpiece...
                                        </>
                                    ) : (
                                        'Commence Creation'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={openVault}
                                    className="w-full py-4 border border-white/10 text-[10px] uppercase tracking-[0.5em] text-novraux-bone/70 hover:text-novraux-bone hover:border-novraux-bone/50 transition-all"
                                >
                                    Open Vault (R2)
                                </button>
                                <p className="text-[10px] text-novraux-bone/30 tracking-widest text-center">
                                    {vaultImages.length} images available from R2.
                                </p>
                            </div>
                        </div>

                        {showTreasury && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                <div className="w-[min(1100px,92vw)] max-h-[85vh] overflow-hidden rounded-sm border border-white/10 bg-novraux-obsidian shadow-2xl">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                        <div className="space-y-1">
                                            <h3 className="text-[10px] uppercase tracking-[0.5em] text-novraux-bone/60">Design Vault</h3>
                                            <p className="text-[10px] text-novraux-bone/30 tracking-widest">Select an image from R2 to continue.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowTreasury(false)}
                                            className="text-[10px] uppercase tracking-[0.3em] text-novraux-bone/40 hover:text-novraux-bone transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>

                                    <div className="p-6 overflow-y-auto max-h-[70vh]">
                                        {vaultLoading && (
                                            <div className="text-[10px] text-novraux-bone/40 tracking-widest">Loading vault...</div>
                                        )}
                                        {!vaultLoading && vaultError && (
                                            <div className="text-[10px] text-red-400 tracking-widest">{vaultError}</div>
                                        )}
                                        {!vaultLoading && !vaultError && vaultImages.length === 0 && (
                                            <div className="text-[10px] text-novraux-bone/40 tracking-widest">No images found in the vault yet.</div>
                                        )}
                                        {!vaultLoading && vaultImages.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                                {vaultImages.map((img) => (
                                                    <button
                                                        key={img.key}
                                                        onClick={async () => {
                                                            setImageUrl(img.url);
                                                            if (!designPrompt) {
                                                                setDesignPrompt('Vault image');
                                                            }
                                                            if (!title) {
                                                                const name = img.key.split('/').pop() || 'Vault Image';
                                                                setTitle(name.replace(/\.[^/.]+$/, ''));
                                                            }
                                                            if (!description) {
                                                                setDescription('Selected from the R2 vault.');
                                                            }
                                                            setSeo(null);
                                                            setShowTreasury(false);
                                                            await loadProviders();
                                                        }}
                                                        className="group relative aspect-square bg-white/[0.02] border border-white/10 overflow-hidden hover:border-novraux-bone/40 transition-all rounded-sm"
                                                    >
                                                        <img src={img.url} className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute inset-0 bg-novraux-obsidian/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-[8px] uppercase tracking-widest text-novraux-bone">Select</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setStep(1)} className="text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all pt-4 block">← Back to Foundation</button>
                    </div>
                )}

                {/* STEP 3: WORKSHOP SELECTION */}
                {step === 3 && selectedBlueprint && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-6">
                            <h2 className="text-5xl font-serif text-novraux-bone leading-tight font-light">The <span className="italic">Atelier</span></h2>
                            <p className="text-novraux-bone/50 text-base mt-6 max-w-lg">Select an elite production workshop to facilitate the manifestation of {selectedBlueprint.title}.</p>
                        </div>

                        {providers.length === 0 ? (
                            <div className="border border-white/10 bg-white/[0.02] p-10 rounded-sm space-y-6">
                                <p className="text-[11px] uppercase tracking-[0.4em] text-novraux-bone/40">No Workshops Found</p>
                                <p className="text-sm text-novraux-bone/60">
                                    This blueprint returned no print providers. Try another product or verify your Printify setup.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={loadProviders}
                                        className="px-6 py-3 text-[10px] uppercase tracking-[0.4em] bg-novraux-bone text-novraux-obsidian hover:bg-white transition-all"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 text-[10px] uppercase tracking-[0.4em] border border-white/10 text-novraux-bone/60 hover:text-novraux-bone hover:border-novraux-bone/50 transition-all"
                                    >
                                        Choose Another Product
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {providers.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectProvider(p)}
                                        className="group bg-white/[0.03] border border-white/5 p-12 text-left hover:border-novraux-bone/30 transition-all duration-700 hover:bg-white/[0.06] shadow-2xl"
                                    >
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-2xl font-serif text-novraux-bone italic font-light tracking-widest leading-tight">{p.title}</h3>
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] uppercase tracking-[0.4em] text-novraux-bone/30 font-light">Origin</p>
                                                <p className="text-xs text-novraux-bone/70 tracking-wide font-light uppercase">{p.location?.address1 ? `${p.location.address1}, ` : ''}{p.location?.country}</p>
                                            </div>
                                            <div className="pt-6 border-t border-white/5 flex justify-between items-center group-hover:border-novraux-bone/20 transition-all">
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-novraux-bone/40 font-light">Certified Artisan</span>
                                                <span className="text-xl font-light group-hover:translate-x-3 transition-transform duration-700 opacity-40 group-hover:opacity-100">→</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button onClick={() => setStep(2)} className="text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all pt-4 block">← Back to Identity</button>
                    </div>
                )}

                {/* STEP 4: AESTHETICS & CONFIG */}
                {step === 4 && selectedBlueprint && selectedProvider && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-6">
                            <h2 className="text-5xl font-serif text-novraux-bone leading-tight font-light italic">Refinement</h2>
                            <p className="text-novraux-bone/50 text-base mt-6">Optimizing and configuring the aesthetics of {title}.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            {/* Artistic Preview - Interactive Canvas */}
                            <div
                                ref={canvasRef}
                                className="relative aspect-[4/5] bg-white overflow-hidden rounded-sm group shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10"
                            >
                                <img
                                    src={selectedBlueprint.images?.find((img: any) => img.is_default)?.src || selectedBlueprint.images?.[0]?.src || selectedBlueprint.images?.[0]}
                                    className="w-full h-full object-contain pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
                                    alt={selectedBlueprint.title}
                                />

                                {imageUrl && (
                                    <Rnd
                                        size={{
                                            width: designScale * 200,
                                            height: designScale * 200
                                        }}
                                        position={{
                                            x: (designX * (canvasRef.current?.offsetWidth || 400)) - (designScale * 100),
                                            y: (designY * (canvasRef.current?.offsetHeight || 500)) - (designScale * 100)
                                        }}
                                        onDragStop={(e, d) => {
                                            if (canvasRef.current) {
                                                const width = canvasRef.current.offsetWidth;
                                                const height = canvasRef.current.offsetHeight;
                                                const centerX = d.x + (designScale * 200) / 2;
                                                const centerY = d.y + (designScale * 200) / 2;
                                                setDesignX(centerX / width);
                                                setDesignY(centerY / height);
                                            }
                                        }}
                                        onResizeStop={(e, direction, ref, delta, position) => {
                                            const newWidth = parseInt(ref.style.width);
                                            setDesignScale(newWidth / 200);

                                            if (canvasRef.current) {
                                                const width = canvasRef.current.offsetWidth;
                                                const height = canvasRef.current.offsetHeight;
                                                const centerX = position.x + newWidth / 2;
                                                const centerY = position.y + newWidth / 2;
                                                setDesignX(centerX / width);
                                                setDesignY(centerY / height);
                                            }
                                        }}
                                        bounds="parent"
                                        lockAspectRatio
                                        className="flex items-center justify-center pointer-events-auto"
                                        enableResizing={{
                                            top: true,
                                            right: true,
                                            bottom: true,
                                            left: true,
                                            topRight: true,
                                            bottomRight: true,
                                            bottomLeft: true,
                                            topLeft: true,
                                        }}
                                    >
                                        <div className="w-full h-full p-2 relative cursor-move active:cursor-grabbing">
                                            <div className="absolute inset-0 border-2 border-novraux-bone/40 border-dashed rounded-sm" />
                                            <div className="absolute -top-6 left-0 text-[8px] uppercase tracking-[0.3em] bg-novraux-bone text-novraux-obsidian px-2 py-1 font-bold">Drag & Resize</div>
                                            <img
                                                src={imageUrl}
                                                className="w-full h-full object-contain drop-shadow-2xl mix-blend-multiply opacity-85 pointer-events-none"
                                                alt="Design"
                                            />
                                        </div>
                                    </Rnd>
                                )}

                                <div className="absolute bottom-8 left-8 text-[9px] uppercase tracking-[0.5em] bg-black/60 px-4 py-2 backdrop-blur-md text-white/50 font-medium">{selectedBlueprint.title}</div>
                                <div className="absolute top-8 left-8 text-[9px] uppercase tracking-[0.5em] bg-black/60 px-4 py-2 backdrop-blur-md text-white/50 font-medium">Interactive Canvas</div>
                            </div>

                            {/* Configuration Panel */}
                            <div className="space-y-10 py-4">
                                {/* Interactive Help */}
                                <div className="bg-white/[0.02] border border-white/5 p-8 space-y-6 rounded-sm">
                                    <h3 className="text-[10px] uppercase tracking-[0.5em] text-novraux-bone/40 border-b border-white/5 pb-4">Artistic Tailoring</h3>

                                    <div className="space-y-4">
                                        <p className="text-[10px] text-novraux-bone/50 tracking-widest leading-relaxed">
                                            Click and drag your design to reposition. Pull corner handles to resize while maintaining proportions.
                                        </p>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[9px] uppercase tracking-[0.3em] text-novraux-bone/30">Scale Fidelity</span>
                                            <span className="text-xs text-novraux-bone font-serif italic">{Math.round(designScale * 100)}%</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2">
                                            <p className="text-[8px] uppercase tracking-widest text-novraux-bone/20">Horizontal</p>
                                            <p className="text-[10px] text-novraux-bone font-mono tracking-tighter">{Math.round(designX * 100)}%</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2">
                                            <p className="text-[8px] uppercase tracking-widest text-novraux-bone/20">Vertical</p>
                                            <p className="text-[10px] text-novraux-bone font-mono tracking-tighter">{Math.round(designY * 100)}%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 border-b border-white/5 pb-8">
                                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-novraux-bone/30 font-light">Configurable Variations</h3>
                                    <div className="flex gap-8 pt-4">
                                        <button onClick={() => setSelectedVariants(variants.map(v => v.id))} className="text-[9px] uppercase tracking-[0.5em] text-novraux-bone/60 hover:text-novraux-bone transition-colors underline-offset-8 decoration-novraux-bone/20 underline">Manifest All</button>
                                        <button onClick={() => setSelectedVariants([])} className="text-[9px] uppercase tracking-[0.5em] text-novraux-bone/20 hover:text-novraux-bone transition-colors font-light">Clear Selection</button>
                                    </div>
                                </div>

                                <div className="max-h-[420px] overflow-y-auto pr-6 custom-scrollbar space-y-3">
                                    {variants.map((v) => (
                                        <label key={v.id} className={`flex items-center justify-between p-5 border transition-all duration-500 cursor-pointer group ${selectedVariants.includes(v.id)
                                            ? 'bg-novraux-bone/5 border-novraux-bone/30 shadow-[0_0_30px_rgba(232,230,223,0.05)]'
                                            : 'bg-transparent border-white/5 hover:border-white/10'
                                            }`}>
                                            <div className="flex items-center gap-6">
                                                <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-all ${selectedVariants.includes(v.id) ? 'bg-novraux-bone border-novraux-bone' : 'border-white/10'}`}>
                                                    {selectedVariants.includes(v.id) && <div className="w-1.5 h-1.5 bg-novraux-obsidian" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedVariants.includes(v.id)}
                                                    onChange={() => {
                                                        setSelectedVariants(prev =>
                                                            prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id]
                                                        );
                                                    }}
                                                />
                                                <span className={`text-xs tracking-[0.1em] transition-colors duration-500 font-light ${selectedVariants.includes(v.id) ? 'text-novraux-bone' : 'text-novraux-bone/40'}`}>{v.title}</span>
                                            </div>
                                            <span className="text-[10px] tabular-nums text-novraux-bone/20 font-mono tracking-widest">$2,000</span>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setStep(5)}
                                    className="w-full py-6 bg-novraux-bone text-novraux-obsidian text-[11px] uppercase tracking-[0.5em] font-bold hover:bg-white transition-all shadow-2xl disabled:opacity-20"
                                    disabled={selectedVariants.length === 0}
                                >
                                    Proceed to Manifest
                                </button>
                            </div>
                        </div>

                        <button onClick={() => setStep(3)} className="text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all pt-4 block">← Back to Workshop</button>
                    </div>
                )}

                {/* STEP 5: FINAL MANIFEST */}
                {step === 5 && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="space-y-6">
                            <h2 className="text-5xl font-serif text-novraux-bone leading-tight font-light italic text-center">Final Manifest</h2>
                            <p className="text-novraux-bone/50 text-base mt-8 text-center max-w-2xl mx-auto">Review the complete identity and configuration before facilitating the official production of this masterpiece.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                            <div className="space-y-12">
                                <div className="space-y-10 bg-white/[0.02] p-10 border border-white/5 rounded-sm shadow-2xl">
                                    <div className="space-y-4 border-b border-white/5 pb-4">
                                        <label className="text-[10px] uppercase tracking-[0.5em] text-novraux-bone/30 font-light">Title of Identity</label>
                                        <input
                                            type="text"
                                            className="w-full bg-transparent text-2xl font-serif text-novraux-bone focus:outline-none focus:text-white transition-all italic font-light"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-4 border-b border-white/5 pb-4">
                                        <label className="text-[10px] uppercase tracking-[0.5em] text-novraux-bone/30 font-light">Editorial Narrative</label>
                                        <textarea
                                            className="w-full bg-transparent text-[13px] text-novraux-bone/70 focus:outline-none focus:text-novraux-bone resize-none leading-relaxed font-light min-h-[140px]"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    {seo && (
                                        <div className="pt-4 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] uppercase tracking-[0.4em] text-novraux-bone/20 font-light">Focus Architecture (SEO)</label>
                                                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm space-y-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase tracking-[0.3em] text-novraux-bone/30 italic">Meta Title</p>
                                                        <p className="text-[11px] text-novraux-bone/60 leading-tight">{seo?.metaTitle}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase tracking-[0.3em] text-novraux-bone/30 italic">Keywords</p>
                                                        <p className="text-[10px] text-novraux-bone/60 tracking-widest">{seo?.keywords}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-12 px-2">
                                    <div className="space-y-3">
                                        <p className="text-[9px] uppercase tracking-[0.5em] text-novraux-bone/20 font-light">Infrastructure</p>
                                        <p className="text-sm text-novraux-bone tracking-widest font-serif italic">{selectedProvider?.title || 'Elite Workshop'}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] uppercase tracking-[0.5em] text-novraux-bone/20 font-light">Configured Units</p>
                                        <p className="text-sm text-novraux-bone tracking-widest font-light uppercase">{selectedVariants?.length || 0} Variants</p>
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="bg-red-950/20 border border-red-900/40 p-10 text-red-500 rounded-sm shadow-2xl animate-pulse">
                                        <p className="text-[11px] uppercase tracking-[0.5em] font-bold mb-4 flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                            Manifestation Blocked
                                        </p>
                                        <p className="text-xs leading-relaxed text-red-300 font-light">{errorMsg}</p>
                                        {errorMsg.includes('8150') && (
                                            <div className="mt-8 p-4 bg-white/5 border border-white/5 text-[9px] text-novraux-bone/40 uppercase tracking-widest leading-relaxed">
                                                Tip: Try selecting fewer variants or checking if the specific product combination is currently available at the atelier.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-6">
                                    <button
                                        onClick={handleCreate}
                                        disabled={loading}
                                        className="flex-1 py-7 bg-novraux-bone text-novraux-obsidian text-[11px] uppercase tracking-[0.6em] font-bold hover:bg-white transition-all shadow-[0_30px_60px_rgba(232,230,223,0.15)] disabled:opacity-20 flex items-center justify-center gap-6"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-novraux-obsidian/20 border-t-novraux-obsidian rounded-full animate-spin" />
                                                Facilitating...
                                            </>
                                        ) : (
                                            'Commence Manifest'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/[0.01] p-2 border border-white/5 rounded-sm shadow-2xl relative group">
                                <div className="aspect-[4/5] relative bg-white overflow-hidden rounded-sm p-4">
                                    <img src={selectedBlueprint.images?.[0]} className="w-full h-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" />
                                    <div className="absolute inset-0 flex items-center justify-center p-[20%] opacity-90 mix-blend-multiply transition-all duration-1000">
                                        <img
                                            src={imageUrl}
                                            className="w-full h-full object-contain drop-shadow-2xl"
                                            style={{ transform: `translate(${(designX - 0.5) * 100}%, ${(designY - 0.5) * 100}%) scale(${designScale})` }}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 p-8 text-center border-t border-white/5">
                                    <p className="text-[9px] uppercase tracking-[0.5em] text-novraux-bone/20 italic font-light">Materialization Preview Confirmation</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setStep(4)} className="text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all pt-8 mx-auto block">← Return to Aesthetics</button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.01);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(232,230,223,0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(232,230,223,0.1);
                }
            `}</style>
        </div>
    );
}
