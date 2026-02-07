
import { NextResponse } from 'next/server';
import { generateProductDesign } from '@/lib/ai';

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const imageBuffer = await generateProductDesign(prompt);

        // Convert to Base64
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const dataUri = `data:image/png;base64,${base64}`;

        return NextResponse.json({ success: true, image: dataUri });

    } catch (error: any) {
        console.error('Image Gen Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
