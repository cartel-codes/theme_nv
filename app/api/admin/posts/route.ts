import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/posts - Fetch all blog posts
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status'); // 'published' or 'draft'

        const skip = (page - 1) * limit;

        const whereClause: any = {
            AND: [
                search ? {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { content: { contains: search, mode: 'insensitive' } },
                        { slug: { contains: search, mode: 'insensitive' } },
                    ],
                } : {},
                status === 'published' ? { publishedAt: { not: null } } : {},
                status === 'draft' ? { publishedAt: null } : {},
            ],
        };

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.post.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            data: posts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/posts - Create a new blog post
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            slug,
            content,
            excerpt,
            imageUrl,
            publishedAt,
            metaTitle,
            metaDescription,
            keywords,
            focusKeyword,
            ogImage
        } = body;

        // Validation
        if (!title || !slug || !content) {
            return NextResponse.json(
                { error: 'Title, slug, and content are required' },
                { status: 400 }
            );
        }

        // Check slug uniqueness
        const existingPost = await prisma.post.findUnique({
            where: { slug },
        });

        if (existingPost) {
            return NextResponse.json(
                { error: 'Slug already exists' },
                { status: 400 }
            );
        }

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content,
                excerpt,
                imageUrl,
                publishedAt: publishedAt ? new Date(publishedAt) : null,
                metaTitle,
                metaDescription,
                keywords,
                focusKeyword,
                ogImage,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Failed to create post:', error);
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}
