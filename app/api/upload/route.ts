import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';
import sharp from 'sharp';

export const runtime = 'nodejs'; // Required for sharp

/**
 * POST /api/upload - Upload an image to R2
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Optimize image with sharp
        const optimizedBuffer = await sharp(buffer)
            .resize(1400, 1400, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 }) // Convert to WebP for better compression
            .toBuffer();

        // Generate filename
        const filename = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.webp`;

        // Upload to R2
        const url = await uploadToR2(optimizedBuffer, filename, 'image/webp');

        return NextResponse.json({
            url,
            filename,
            size: optimizedBuffer.length,
            originalSize: buffer.length,
            contentType: 'image/webp',
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}
