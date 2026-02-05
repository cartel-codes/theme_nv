import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function getR2Client() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('R2 configuration is incomplete');
    }

    return new S3Client({
        region: 'auto',
        endpoint: endpoint,
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });
}

/**
 * GET /api/images/[...key] - Proxy images from R2
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key: keyArray } = await params;
        const key = keyArray.join('/');
        const bucketName = process.env.R2_BUCKET_NAME;

        if (!bucketName) {
            return NextResponse.json({ error: 'Bucket name not configured' }, { status: 500 });
        }

        const client = getR2Client();
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const response = await client.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // Stream the response body
        // Note: response.Body is a ReadableStream in this environment
        const data = response.Body as any;

        return new NextResponse(data, {
            headers: {
                'Content-Type': response.ContentType || 'image/webp',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Length': response.ContentLength?.toString() || '',
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}
