'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
    images: { url: string; alt: string | null }[];
    productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

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

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="group relative aspect-square overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#0f0f0f]">
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
                        <span className="text-[10px] tracking-[0.2em] text-white/80 uppercase">Hover to zoom</span>
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
                relative aspect-square overflow-hidden border transition-all duration-300
                ${selectedIndex === index
                                    ? 'border-[#c9a96e] shadow-[0_0_12px_rgba(201,169,110,0.25)]'
                                    : 'border-[rgba(201,169,110,0.12)] hover:border-[rgba(201,169,110,0.4)]'
                                }
              `}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || `${productName} view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="150px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
