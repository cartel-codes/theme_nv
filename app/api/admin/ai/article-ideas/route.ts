import { NextRequest, NextResponse } from 'next/server';
import { generateArticleTopics } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const { niche } = await request.json();
        const topics = await generateArticleTopics(niche);
        return NextResponse.json({ topics });
    } catch (error) {
        console.error('Failed to generate topics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to generate topics: ${errorMessage}` },
            { status: 500 }
        );
    }
}
