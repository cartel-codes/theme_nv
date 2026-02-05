'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageItem {
  id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order?: number;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  onImageUploadedForAI?: (imageUrl: string) => void; // Callback for AI generation
}

export default function ImageUploader({ images, onImagesChange, onImageUploadedForAI }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragZoneRef.current) {
      dragZoneRef.current.classList.add('bg-neutral-100');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragZoneRef.current) {
      dragZoneRef.current.classList.remove('bg-neutral-100');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragZoneRef.current) {
      dragZoneRef.current.classList.remove('bg-neutral-100');
    }

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);

    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please upload image files');
      setUploading(false);
      return;
    }

    try {
      // Upload images to R2
      const newImages: ImageItem[] = [];

      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const data = await response.json();
        newImages.push({
          url: data.url,
          alt: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: images.length === 0 && newImages.length === 0,
        });
      }

      const allImages = [...images, ...newImages];
      onImagesChange(allImages);
      
      // Trigger AI generation callback for the first newly uploaded image
      if (newImages.length > 0 && onImageUploadedForAI) {
        onImageUploadedForAI(newImages[0].url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Ensure primary is set
    if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    onImagesChange(newImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    // Update primary
    newImages.forEach((img, idx) => {
      img.isPrimary = idx === 0;
    });
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        ref={dragZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 dark:bg-neutral-800/50"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">Drop images here or click to upload</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Supported formats: PNG, JPG, WebP (Max 5MB)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-neutral-700">Uploaded Images ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full aspect-square bg-neutral-100 rounded overflow-hidden">
                  {image.url.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.url}
                      alt={image.alt || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={image.url}
                      alt={image.alt || `Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}

                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                </div>

                {/* Alt Text Input */}
                <input
                  type="text"
                  value={image.alt || ''}
                  onChange={(e) => {
                    const newImages = [...images];
                    newImages[index].alt = e.target.value;
                    onImagesChange(newImages);
                  }}
                  placeholder="Alt text"
                  className="w-full mt-2 px-2 py-1 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />

                {/* Actions */}
                <div className="absolute top-2 right-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => reorderImages(index, index - 1)}
                      className="inline-block p-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => reorderImages(index, index + 1)}
                      className="inline-block p-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-800"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="inline-block p-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm">
          Uploading images...
        </div>
      )}
    </div>
  );
}
