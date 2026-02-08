import { NextRequest, NextResponse } from 'next/server';
import { generateSEOWithAI } from '@/lib/ai';

/**
 * POST /api/admin/seo/generate - Generate SEO suggestions with AI
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, type, imageUrl } = body;

        console.log('\n==================== SEO GENERATION REQUEST ====================');
        console.log('📝 Request received:');
        console.log('   Name:', name?.slice(0, 50) || '(empty)');
        console.log('   Description:', description?.slice(0, 50) || '(empty)');
        console.log('   Type:', type);
        console.log('   Image URL:', imageUrl ? '✅ ' + imageUrl.slice(0, 80) + '...' : '❌ (none)');

        if (!name && !imageUrl) {
            console.warn('⚠️ Validation: Missing both name and image!');
            return NextResponse.json(
                { error: 'Name or Image is required' },
                { status: 400 }
            );
        }

        console.log('\n🚀 Calling generateSEOWithAI...');
        const suggestion = await generateSEOWithAI(name, description, type, imageUrl);
        
        console.log('\n✅ AI Generation successful!');
        console.log('   Generated name:', !!suggestion.generatedName);
        console.log('   Meta title:', suggestion.metaTitle?.slice(0, 40) || '(none)');
        console.log('   Keywords:', suggestion.keywords?.slice(0, 40) || '(none)');
        console.log('   Suggested category:', suggestion.suggestedCategory || '(none)');
        console.log('============================================================\n');

        return NextResponse.json({
            success: true,
            seo: suggestion
        });
    } catch (error: any) {
        console.error('\n❌ SEO generation API error:');
        console.error('   Message:', error?.message);
        console.error('   Code:', error?.code);
        console.error('============================================================\n');
        return NextResponse.json(
            { 
                success: false,
                error: error.message || 'Failed to generate SEO with AI' 
            },
            { status: 500 }
        );
    }
}
