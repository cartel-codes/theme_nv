import { NextRequest, NextResponse } from 'next/server';
import { generateFullArticle } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const { title, excerpt } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const content = await generateFullArticle(title, excerpt);
        return NextResponse.json({ content });
    } catch (error) {
        console.error('Failed to generate full article:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to generate article: ${errorMessage}` },
            { status: 500 }
        );
    }
}
