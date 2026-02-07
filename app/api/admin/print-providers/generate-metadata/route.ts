import { NextRequest, NextResponse } from 'next/server';
import { generateSEOWithAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        console.log('📝 Generating luxury metadata for design prompt:', prompt);

        // Use the sophisticated AI utility for luxury-branded content
        // We pass prompt as both name and description to trigger high-quality generation
        const aiResponse = await generateSEOWithAI(
            `Design: ${prompt}`,
            `A luxury product featuring: ${prompt}`,
            'product'
        );

        const title = aiResponse.generatedName || aiResponse.metaTitle || 'Novraux Elite Collection';
        const description = aiResponse.generatedDescription || aiResponse.metaDescription || '';

        console.log('✓ AI Generated title:', title);
        console.log('✓ AI Generated description:', description);

        return NextResponse.json({
            success: true,
            title: title,
            description: description,
            seo: {
                metaTitle: aiResponse.metaTitle,
                metaDescription: aiResponse.metaDescription,
                keywords: aiResponse.keywords,
                focusKeyword: aiResponse.focusKeyword
            }
        });
    } catch (error: any) {
        console.error('❌ Metadata generation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate metadata' },
            { status: 500 }
        );
    }
}
