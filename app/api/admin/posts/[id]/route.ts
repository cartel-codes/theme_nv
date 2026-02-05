import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/posts/[id] - Fetch single post
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Failed to fetch post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/posts/[id] - Update post
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const existingPost = await prisma.post.findUnique({
            where: { id },
        });

        if (!existingPost) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check slug uniqueness if changed
        if (slug && slug !== existingPost.slug) {
            const duplicateSlug = await prisma.post.findUnique({
                where: { slug },
            });

            if (duplicateSlug) {
                return NextResponse.json(
                    { error: 'Slug already exists' },
                    { status: 400 }
                );
            }
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                slug,
                content,
                excerpt,
                imageUrl,
                publishedAt: publishedAt === null ? null : (publishedAt ? new Date(publishedAt) : undefined),
                metaTitle,
                metaDescription,
                keywords,
                focusKeyword,
                ogImage,
            },
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error('Failed to update post:', error);
        return NextResponse.json(
            { error: 'Failed to update post' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/posts/[id] - Delete post and cleanup images
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Clean up featured image from R2 if it exists
        if (post.imageUrl) {
            try {
                const { deleteFromR2 } = await import('@/lib/r2');
                console.log('🗑️ Cleaning up post image:', post.imageUrl);
                await deleteFromR2(post.imageUrl);
            } catch (err) {
                console.warn('⚠️ Failed to clean up R2 image for post:', err);
            }
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        );
    }
}
