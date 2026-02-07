'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Model = 'dall-e-3' | 'dall-e-2';
type Quality = 'standard' | 'hd';
type Size = '1024x1024' | '1792x1024' | '1024x1792';

interface GeneratedImage {
    id: string;
    prompt: string;
    model: Model;
    quality: Quality;
    imageUrl: string;
    timestamp: number;
}

const MODELS: { label: string; value: Model; description: string; quality: Quality[] }[] = [
    {
        label: 'DALL-E 3',
        value: 'dall-e-3',
        description: 'OpenAI DALL-E 3 - High quality, follows prompts precisely',
        quality: ['standard', 'hd']
    },
    {
        label: 'DALL-E 2',
        value: 'dall-e-2',
        description: 'OpenAI DALL-E 2 - Faster generation, standard quality',
        quality: ['standard']
    }
];

export default function ImageGenerationPage() {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState<Model>('dall-e-3');
    const [selectedQuality, setSelectedQuality] = useState<Quality>('standard');
    const [selectedSize, setSelectedSize] = useState<Size>('1024x1024');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [error, setError] = useState('');
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const currentModelConfig = MODELS.find(m => m.value === selectedModel);
    const availableQualities = currentModelConfig?.quality || ['standard'];

    const generateImage = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/ai/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    model: selectedModel,
                    quality: selectedQuality,
                    size: selectedSize,
                    n: 1
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate image');
            }

            if (data.data && data.data.length > 0) {
                const imageUrl = data.data[0].url;
                const newImage: GeneratedImage = {
                    id: `img_${Date.now()}`,
                    prompt,
                    model: selectedModel,
                    quality: selectedQuality,
                    imageUrl,
                    timestamp: Date.now()
                };

                setGeneratedImages(prev => [newImage, ...prev]);
                setPrompt('');

                // Scroll to generated image
                setTimeout(() => {
                    imageContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err: any) {
            console.error('Image generation error:', err);
            setError(err?.message || 'Failed to generate image.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadImage = async (imageUrl: string, imageName: string) => {
        try {
            // Fetch image through proxy to avoid CORS if necessary, or direct download
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${imageName}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            // Fallback: open in new tab
            window.open(imageUrl, '_blank');
        }
    };

    const deleteImage = (id: string) => {
        setGeneratedImages(prev => prev.filter(img => img.id !== id));
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/admin/ai-tools" className="text-novraux-obsidian/60 dark:text-novraux-bone/60 hover:text-novraux-obsidian dark:hover:text-novraux-bone text-sm">
                        ← All AI Tools
                    </Link>
                </div>
                <h1 className="text-3xl font-serif tracking-widest text-novraux-obsidian dark:text-novraux-bone mb-2">
                    AI Image Generation
                </h1>
                <p className="text-novraux-obsidian/60 dark:text-novraux-bone/60">
                    Generate high-quality images using OpenAI DALL-E models.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-novraux-obsidian/50 border border-novraux-obsidian/10 dark:border-novraux-bone/10 p-6 rounded space-y-4">
                        {/* Prompt Input */}
                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 font-normal">
                                Image Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to generate..."
                                className="w-full h-32 p-3 border border-novraux-obsidian/10 dark:border-novraux-bone/10 rounded bg-white dark:bg-novraux-obsidian/30 text-novraux-obsidian dark:text-novraux-bone placeholder-novraux-obsidian/40 dark:placeholder-novraux-bone/40 focus:outline-none focus:border-novraux-obsidian dark:focus:border-novraux-bone focus:ring-1 focus:ring-novraux-obsidian dark:focus:ring-novraux-bone/50 resize-none"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-novraux-obsidian/50 dark:text-novraux-bone/50 mt-1">
                                {prompt.length} characters
                            </p>
                        </div>

                        {/* Model Select */}
                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 font-normal">
                                Model
                            </label>
                            <select
                                value={selectedModel}
                                onChange={(e) => {
                                    const newModel = e.target.value as Model;
                                    setSelectedModel(newModel);
                                    // Auto-select first available quality for new model
                                    const modelConfig = MODELS.find(m => m.value === newModel);
                                    if (modelConfig && !modelConfig.quality.includes(selectedQuality)) {
                                        setSelectedQuality(modelConfig.quality[0]);
                                    }
                                }}
                                className="w-full p-2 border border-novraux-obsidian/10 dark:border-novraux-bone/10 rounded bg-white dark:bg-novraux-obsidian/30 text-novraux-obsidian dark:text-novraux-bone text-sm focus:outline-none focus:border-novraux-obsidian dark:focus:border-novraux-bone"
                                disabled={isLoading}
                            >
                                {MODELS.map(model => (
                                    <option key={model.value} value={model.value}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-novraux-obsidian/60 dark:text-novraux-bone/60 mt-1">
                                {currentModelConfig?.description}
                            </p>
                        </div>

                        {/* Quality Select */}
                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 font-normal">
                                Quality
                            </label>
                            <select
                                value={selectedQuality}
                                onChange={(e) => setSelectedQuality(e.target.value as Quality)}
                                className="w-full p-2 border border-novraux-obsidian/10 dark:border-novraux-bone/10 rounded bg-white dark:bg-novraux-obsidian/30 text-novraux-obsidian dark:text-novraux-bone text-sm focus:outline-none focus:border-novraux-obsidian dark:focus:border-novraux-bone"
                                disabled={isLoading}
                            >
                                {availableQualities.map(quality => (
                                    <option key={quality} value={quality}>
                                        {quality.charAt(0).toUpperCase() + quality.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Size Select */}
                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 font-normal">
                                Size
                            </label>
                            <select
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value as Size)}
                                className="w-full p-2 border border-novraux-obsidian/10 dark:border-novraux-bone/10 rounded bg-white dark:bg-novraux-obsidian/30 text-novraux-obsidian dark:text-novraux-bone text-sm focus:outline-none focus:border-novraux-obsidian dark:focus:border-novraux-bone"
                                disabled={isLoading}
                            >
                                <option value="1024x1024">Square (1024x1024)</option>
                                <option value="1792x1024">Landscape (1792x1024)</option>
                                <option value="1024x1792">Portrait (1024x1792)</option>
                            </select>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3 rounded text-xs text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={generateImage}
                            disabled={isLoading || !prompt.trim()}
                            className={`w-full py-3 rounded text-xs uppercase tracking-novraux-medium font-normal transition-colors ${isLoading || !prompt.trim()
                                    ? 'bg-novraux-obsidian/50 dark:bg-novraux-bone/50 text-novraux-obsidian/50 dark:text-novraux-bone/50 cursor-not-allowed'
                                    : 'bg-novraux-obsidian dark:bg-novraux-bone text-novraux-bone dark:text-novraux-obsidian hover:bg-novraux-obsidian/90 dark:hover:bg-novraux-bone/90'
                                }`}
                        >
                            {isLoading ? '⏳ Generating...' : '✨ Generate Image'}
                        </button>


                    </div>
                </div>

                {/* Generated Images Gallery */}
                <div className="lg:col-span-2 space-y-4">
                    {generatedImages.length === 0 ? (
                        <div ref={imageContainerRef} className="bg-white dark:bg-novraux-obsidian/50 border border-novraux-obsidian/10 dark:border-novraux-bone/10 p-12 rounded text-center">
                            <p className="text-4xl mb-3">🖼️</p>
                            <p className="text-novraux-obsidian/60 dark:text-novraux-bone/60">
                                No images generated yet. Create one to get started!
                            </p>
                        </div>
                    ) : (
                        <div ref={imageContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedImages.map(image => (
                                <div
                                    key={image.id}
                                    className="bg-white dark:bg-novraux-obsidian/50 border border-novraux-obsidian/10 dark:border-novraux-bone/10 rounded overflow-hidden group"
                                >
                                    <div className="aspect-square bg-novraux-obsidian/5 dark:bg-novraux-bone/5 flex items-center justify-center overflow-hidden relative">
                                        <img
                                            src={image.imageUrl}
                                            alt={image.prompt}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-novraux-medium text-novraux-obsidian/60 dark:text-novraux-bone/60 mb-1">
                                                Prompt
                                            </p>
                                            <p className="text-sm text-novraux-obsidian dark:text-novraux-bone line-clamp-2">
                                                {image.prompt}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-novraux-obsidian/60 dark:text-novraux-bone/60 uppercase tracking-novraux-medium mb-0.5">Model</p>
                                                <p className="text-novraux-obsidian dark:text-novraux-bone font-normal">{image.model}</p>
                                            </div>
                                            <div>
                                                <p className="text-novraux-obsidian/60 dark:text-novraux-bone/60 uppercase tracking-novraux-medium mb-0.5">Quality</p>
                                                <p className="text-novraux-obsidian dark:text-novraux-bone font-normal">{image.quality}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => downloadImage(image.imageUrl, `ai-gen-${image.id}`)}
                                                className="flex-1 py-2 px-3 bg-green-500/10 dark:bg-green-950/20 hover:bg-green-500/20 border border-green-500/30 rounded text-xs uppercase tracking-novraux-medium text-green-700 dark:text-green-300 transition-colors"
                                            >
                                                ⬇️ Download
                                            </button>
                                            <button
                                                onClick={() => deleteImage(image.id)}
                                                className="flex-1 py-2 px-3 bg-red-500/10 dark:bg-red-950/20 hover:bg-red-500/20 border border-red-500/30 rounded text-xs uppercase tracking-novraux-medium text-red-700 dark:text-red-300 transition-colors"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
