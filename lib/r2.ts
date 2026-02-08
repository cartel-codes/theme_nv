import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * R2 Configuration and Client initialization
 * Using a function to allow environment variables to be loaded/mocked properly
 */
function getR2Config() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
        console.warn('R2 configuration is incomplete. Check your environment variables.');
    }

    return {
        endpoint,
        accessKeyId,
        secretAccessKey,
        bucketName,
        publicUrl: publicUrl?.replace(/\/$/, ''), // Remove trailing slash if present
    };
}

let clientInstance: S3Client | null = null;

function getR2Client() {
    if (clientInstance) return clientInstance;

    const config = getR2Config();
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
        throw new Error('R2 client cannot be initialized: Missing credentials or endpoint.');
    }

    clientInstance = new S3Client({
        region: 'auto',
        endpoint: config.endpoint,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    return clientInstance;
}

/**
 * Upload a file buffer to R2
 * @param buffer - File buffer to upload
 * @param filename - Filename or full path (e.g., "ai-generated/gpt-image-1/1234.png")
 * @param contentType - MIME type of the file
 * @param folder - Optional folder prefix (defaults to "products", ignored if filename contains "/")
 */
export async function uploadToR2(
    buffer: Buffer,
    filename: string,
    contentType: string,
    folder: string = 'products'
): Promise<string> {
    const config = getR2Config();
    const client = getR2Client();

    if (!config.bucketName || !config.publicUrl) {
        throw new Error('R2 upload failed: Missing bucket name or public URL configuration.');
    }

    // If filename already includes a path separator, use it as-is (full path provided)
    // Otherwise, prepend the folder and timestamp
    const key = filename.includes('/')
        ? filename
        : `${folder}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await client.send(command);

    // ✅ Use proxy URL for UI (works locally and on production)
    // The proxy endpoint /api/images/[...key] handles R2 access
    // ✅ Use relative path for proxy URL
    // This ensures it works on both localhost and production without hardcoding the domain
    const proxyUrl = `/api/images/${key}`;
    console.log('📸 Uploaded to R2:', { key, proxyUrl });
    return proxyUrl;
}

/**
 * Delete a file from R2
 * Handles both direct R2 URLs and proxy URLs (/api/images/...)
 */
export async function deleteFromR2(url: string): Promise<void> {
    const config = getR2Config();
    const client = getR2Client();

    if (!config.bucketName) {
        throw new Error('R2 delete failed: Missing bucket name configuration.');
    }

    // Extract the key from different URL formats
    let key: string;

    // Handle proxy URLs like http://localhost:3001/api/images/products/...
    if (url.includes('/api/images/')) {
        const match = url.match(/\/api\/images\/(.+)$/);
        key = match ? match[1] : '';
    }
    // Handle direct R2 public URLs
    else if (config.publicUrl && url.includes(config.publicUrl)) {
        key = url.replace(`${config.publicUrl}/`, '');
    }
    // Handle full URLs with just the key path
    else {
        key = url.replace(/^https?:\/\/[^\/]+\//, '');
    }

    if (!key) {
        console.warn('Could not extract R2 key from URL:', url);
        return;
    }

    console.log('🗑️ Deleting from R2:', { url: url.slice(0, 60), key });

    const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    await client.send(command);
    console.log('✅ Deleted from R2:', key);
}

/**
 * Generate a presigned URL for direct upload from browser
 */
export async function getPresignedUploadUrl(
    filename: string,
    contentType: string
): Promise<{ url: string; key: string }> {
    const config = getR2Config();
    const client = getR2Client();

    if (!config.bucketName) {
        throw new Error('R2 presigned URL failed: Missing bucket name configuration.');
    }

    const key = `products/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour

    return { url, key };
}

/**
 * List files in R2 bucket with an optional prefix
 */
export async function listR2Files(prefix: string = ''): Promise<{ key: string, url: string, lastModified?: Date }[]> {
    const config = getR2Config();
    const client = getR2Client();

    if (!config.bucketName) {
        throw new Error('R2 list failed: Missing bucket name configuration.');
    }

    const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
    });

    const response = await client.send(command);

    return (response.Contents || [])
        .filter(obj => obj.Key && (obj.Key.endsWith('.png') || obj.Key.endsWith('.jpg') || obj.Key.endsWith('.webp')))
        .map(obj => ({
            key: obj.Key!,
            url: `/api/images/${obj.Key}`,
            lastModified: obj.LastModified
        }))
        .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
}

/**
 * Helper to reset client (useful for testing)
 */
export function resetR2Client() {
    clientInstance = null;
}
