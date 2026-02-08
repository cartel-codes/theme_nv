import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@/lib/session';
import { uploadToR2 } from '@/lib/r2';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI Image Models with their capabilities
const MODEL_CONFIG = {
    'gpt-image-1': {
        name: 'gpt-image-1',
        sizes: ['1024x1024', '1024x1536', '1536x1024', 'auto'],
        qualities: ['low', 'medium', 'high'],
        maxN: 1,
        supportsTransparency: true,
    },
    'dall-e-3': {
        name: 'dall-e-3',
        sizes: ['1024x1024', '1792x1024', '1024x1792'],
        qualities: ['standard', 'hd'],
        maxN: 1,
        supportsTransparency: false,
    },
    'dall-e-2': {
        name: 'dall-e-2',
        sizes: ['256x256', '512x512', '1024x1024'],
        qualities: ['standard'],
        maxN: 10,
        supportsTransparency: false,
    },
} as const;

type ModelKey = keyof typeof MODEL_CONFIG;

/**
 * Download image from URL and upload to R2 for permanent storage
 */
async function saveImageToR2(imageUrl: string, model: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to download image');
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const timestamp = Date.now();
        const filename = `ai-generated/${model}/${timestamp}.png`;
        
        const r2Url = await uploadToR2(buffer, filename, 'image/png');
        console.log(`✅ Image saved to R2: ${r2Url}`);
        return r2Url;
    } catch (error) {
        console.error('Failed to save image to R2:', error);
        // Return original URL if R2 upload fails (temporary OpenAI URL)
        return imageUrl;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authentication check
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { prompt, model, quality, size, n = 1, background, saveToR2 = true } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Validate and get model config
        const modelKey = (model && model in MODEL_CONFIG) ? model as ModelKey : 'dall-e-3';
        const config = MODEL_CONFIG[modelKey];

        // Build generation options based on model
        const generateOptions: OpenAI.Images.ImageGenerateParams = {
            model: config.name,
            prompt: prompt,
            n: Math.min(n, config.maxN),
            size: (config.sizes.includes(size) ? size : config.sizes[0]) as any,
        };

        // gpt-image-1 doesn't support response_format, returns base64 by default
        // DALL-E models support response_format: 'url'
        if (modelKey !== 'gpt-image-1') {
            generateOptions.response_format = 'url';
        }

        // Add quality parameter based on model
        if (modelKey === 'gpt-image-1') {
            generateOptions.quality = quality === 'high' ? 'high' : quality === 'medium' ? 'medium' : 'low';
            // Add background for transparent images (gpt-image-1 only)
            if (background === 'transparent') {
                (generateOptions as any).background = 'transparent';
            }
        } else if (modelKey === 'dall-e-3') {
            generateOptions.quality = quality === 'hd' ? 'hd' : 'standard';
        }

        console.log(`🎨 Generating image with ${modelKey}:`, { prompt: prompt.slice(0, 50), size, quality });

        const response = await openai.images.generate(generateOptions);

        // Process results and optionally save to R2
        const results = await Promise.all(
            (response.data || []).map(async (img) => {
                let imageUrl: string;
                
                // gpt-image-1 returns base64, DALL-E returns URL
                if (modelKey === 'gpt-image-1' && img.b64_json) {
                    // Convert base64 to buffer and upload to R2
                    const buffer = Buffer.from(img.b64_json, 'base64');
                    const timestamp = Date.now();
                    const filename = `ai-generated/${modelKey}/${timestamp}.png`;
                    const r2Url = await uploadToR2(buffer, filename, 'image/png');
                    console.log(`✅ GPT Image saved to R2: ${r2Url}`);
                    return {
                        url: r2Url,
                        revised_prompt: img.revised_prompt,
                        savedToR2: true,
                    };
                } else {
                    // DALL-E models return URL
                    const originalUrl = img.url!;
                    if (saveToR2 && originalUrl) {
                        const r2Url = await saveImageToR2(originalUrl, modelKey);
                        return {
                            url: r2Url,
                            originalUrl: originalUrl,
                            revised_prompt: img.revised_prompt,
                            savedToR2: r2Url !== originalUrl,
                        };
                    }
                    return {
                        url: originalUrl,
                        revised_prompt: img.revised_prompt,
                        savedToR2: false,
                    };
                }
            })
        );

        return NextResponse.json({
            data: results,
            model: modelKey,
            modelConfig: config,
        });

    } catch (error: any) {
        console.error('AI Image Generation Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}

// GET endpoint to list available models
export async function GET() {
    return NextResponse.json({
        models: Object.entries(MODEL_CONFIG).map(([key, config]) => ({
            id: key,
            name: config.name,
            sizes: config.sizes,
            qualities: config.qualities,
            maxN: config.maxN,
            supportsTransparency: config.supportsTransparency,
        })),
    });
}
