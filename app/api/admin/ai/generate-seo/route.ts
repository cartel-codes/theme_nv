import { NextRequest, NextResponse } from 'next/server';
import { generateArticleSEO } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const seoData = await generateArticleSEO(title, content);

        return NextResponse.json(seoData);
    } catch (error) {
        console.error('Failed to generate SEO:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to generate SEO: ${errorMessage}` },
            { status: 500 }
        );
    }
}
