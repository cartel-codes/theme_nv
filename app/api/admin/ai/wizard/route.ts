import { NextRequest, NextResponse } from 'next/server';
import {
    generateArticleTopics,
    generateArticleAngles,
    generateFullArticle,
    generateArticleImage,
    generateArticleSEO
} from '@/lib/ai';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
    try {
        const { step, data } = await request.json();

        switch (step) {
            case 1: // Generate trending titles
                const { niche } = data;
                if (!niche) {
                    return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
                }
                const titles = await generateArticleTopics(niche);
                return NextResponse.json({ titles });

            case 2: // Generate article angles based on selected title
                const { title } = data;
                if (!title) {
                    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
                }
                const angles = await generateArticleAngles(title);
                return NextResponse.json({ angles });

            case 3: // Generate full article content
                const { selectedTitle, selectedAngle } = data;
                if (!selectedTitle) {
                    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
                }

                // Use angle as excerpt/context for article generation
                const content = await generateFullArticle(selectedTitle, selectedAngle);

                // Generate excerpt from first paragraph
                const excerpt = content
                    .split('\n\n')[0]
                    .replace(/^#+\s*/, '') // Remove markdown headers
                    .slice(0, 200) + '...';

                return NextResponse.json({ content, excerpt });

            case 4: // Generate image and SEO in parallel
                const { finalTitle, finalContent } = data;
                if (!finalTitle || !finalContent) {
                    return NextResponse.json({
                        error: 'Title and content are required'
                    }, { status: 400 });
                }

                // Run image and SEO generation in parallel
                const [imageBuffer, seoData] = await Promise.all([
                    generateArticleImage(finalTitle).catch(err => {
                        console.error('Image generation failed:', err);
                        return null; // Make image optional
                    }),
                    generateArticleSEO(finalTitle, finalContent)
                ]);

                let imageUrl = '';
                if (imageBuffer) {
                    // Upload to R2
                    const timestamp = Date.now();
                    const filename = `ai-gen-${timestamp}.png`;
                    imageUrl = await uploadToR2(
                        Buffer.from(imageBuffer),
                        filename,
                        'image/png'
                    );
                }

                return NextResponse.json({
                    imageUrl,
                    seo: seoData
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid step' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Wizard step failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Wizard failed: ${errorMessage}` },
            { status: 500 }
        );
    }
}
