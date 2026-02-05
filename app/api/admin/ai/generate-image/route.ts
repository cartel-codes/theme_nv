import { NextRequest, NextResponse } from 'next/server';
import { generateArticleImage } from '@/lib/ai';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 1. Generate Image (ArrayBuffer)
        const imageBuffer = await generateArticleImage(prompt);

        // 2. Upload to R2
        // We convert ArrayBuffer to Buffer for R2 upload
        const buffer = Buffer.from(imageBuffer);
        const filename = `ai-gen-${Date.now()}.png`; // HF usually returns JPEG or PNG, defaulting to PNG/JPEG handling

        // Note: HF Stable Diffusion usually returns JPEG, but we can treat as binary. 
        // Ideally we detect mime type but 'image/jpeg' or 'image/png' is fine.
        // SDXL usually output JPEG by default unless specified.

        const url = await uploadToR2(buffer, filename, 'image/jpeg');

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Failed to generate image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to generate image: ${errorMessage}` },
            { status: 500 }
        );
    }
}
