import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@/lib/session';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        // Authentication check
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { prompt, model, quality, size, n = 1 } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Map frontend model names to OpenAI model names if necessary
        // Frontend uses: 'gpt-image-1.5', 'gpt-image-1', 'dall-e-3', 'dall-e-2', 'flux-pro'
        // We will map known ones to DALL-E-3/2 and fallback others to DALL-E-3 for now
        let aiModel = 'dall-e-3';
        if (model === 'dall-e-2') aiModel = 'dall-e-2';


        const response = await openai.images.generate({
            model: aiModel,
            prompt: prompt,
            n: n,
            size: size || "1024x1024",
            quality: quality === 'hd' ? 'hd' : 'standard', // DALL-E 3 supports 'hd'
            response_format: 'url',
        });

        return NextResponse.json({
            data: response.data
        });

    } catch (error: any) {
        console.error('AI Image Generation Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
