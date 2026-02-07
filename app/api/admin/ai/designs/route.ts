
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List saved designs
export async function GET() {
    try {
        const designs = await prisma.aIDesign.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return NextResponse.json({ success: true, designs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Save a new design
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, imageUrl, revisedPrompt, category, tags } = body;

        if (!prompt || !imageUrl) {
            return NextResponse.json({ success: false, error: 'Prompt and Image URL are required' }, { status: 400 });
        }

        const design = await prisma.aIDesign.create({
            data: {
                prompt,
                imageUrl,
                revisedPrompt,
                category: category || 'General',
                tags: tags || []
            }
        });

        return NextResponse.json({ success: true, design });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: Toggle favorite or update tags
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, isFavorite, tags } = body;

        if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

        const updateData: any = {};
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
        if (tags !== undefined) updateData.tags = tags;

        const design = await prisma.aIDesign.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, design });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
