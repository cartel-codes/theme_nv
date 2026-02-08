'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
    images: { url: string; alt: string | null }[];
    productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    // Handle ESC key to close lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isZoomed) return;

            if (e.key === 'Escape') {
                setIsZoomed(false);
            } else if (e.key === 'ArrowLeft') {
                setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }
        };

        if (isZoomed) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when lightbox is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isZoomed, images.length]);

    if (!images || images.length === 0) {
        return (
            <div className="relative aspect-square overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#0f0f0f]">
                <div className="flex h-full items-center justify-center text-[#6b6560] text-sm tracking-[0.2em] uppercase">
                    No image
                </div>
            </div>
        );
    }

    const currentImage = images[selectedIndex];

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    return (
        <>
            <div className="space-y-4">
                {/* Main Image */}
                <div 
                    className="group relative aspect-square overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#0f0f0f] cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                    onMouseMove={handleMouseMove}
                >
                    <Image
                        src={currentImage.url}
                        alt={currentImage.alt || productName}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority={selectedIndex === 0}
                    />

                    {/* Zoom Indicator */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-sm">
                            <span className="text-[10px] tracking-[0.2em] text-white/80 uppercase flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                </svg>
                                Click to enlarge
                            </span>
                        </div>
                    </div>
                </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`
                relative aspect-square overflow-hidden border transition-all duration-300 group/thumb
                ${selectedIndex === index
                                    ? 'border-[#c9a96e] shadow-[0_0_12px_rgba(201,169,110,0.25)] ring-2 ring-[#c9a96e]/20'
                                    : 'border-[rgba(201,169,110,0.12)] hover:border-[rgba(201,169,110,0.4)]'
                                }
              `}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || `${productName} view ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                                sizes="150px"
                            />
                            {selectedIndex === index && (
                                <div className="absolute inset-0 border-2 border-[#c9a96e] pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Lightbox Zoom Modal */}
        {isZoomed && (
            <div 
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={() => setIsZoomed(false)}
            >
                <button 
                    onClick={() => setIsZoomed(false)}
                    className="absolute top-6 right-6 z-10 text-white/60 hover:text-white transition-colors p-2"
                    aria-label="Close"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative w-full max-w-6xl aspect-square" onClick={(e) => e.stopPropagation()}>
                    <Image
                        src={currentImage.url}
                        alt={currentImage.alt || productName}
                        fill
                        className="object-contain"
                        sizes="90vw"
                    />
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1)); }}
                            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                            aria-label="Previous image"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-white/80 text-sm tracking-widest">{selectedIndex + 1} / {images.length}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0)); }}
                            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                            aria-label="Next image"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Close hint */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-white/40 uppercase text-center">
                    <div>Press ESC or click outside to close</div>
                    {images.length > 1 && (
                        <div className="mt-1">Use ← → arrows to navigate</div>
                    )}
                </div>
            </div>
        )}
        </>
    );
}
