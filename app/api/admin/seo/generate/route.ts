import { NextRequest, NextResponse } from 'next/server';
import { generateSEOWithAI } from '@/lib/ai';

/**
 * POST /api/admin/seo/generate - Generate SEO suggestions with AI
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, type, imageUrl } = body;

        if (!name && !imageUrl) {
            return NextResponse.json(
                { error: 'Name or Image is required' },
                { status: 400 }
            );
        }

        const suggestion = await generateSEOWithAI(name, description, type, imageUrl);

        return NextResponse.json(suggestion);
    } catch (error: any) {
        console.error('SEO generation API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate SEO with AI' },
            { status: 500 }
        );
    }
}
