import { uploadToR2, deleteFromR2, resetR2Client } from '../r2';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Mock the S3Client
jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn().mockImplementation(() => ({
            send: jest.fn().mockResolvedValue({}),
        })),
        PutObjectCommand: jest.fn().mockImplementation((args) => args),
        DeleteObjectCommand: jest.fn().mockImplementation((args) => args),
    };
});

describe('R2 Utility Library', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        resetR2Client(); // Ensure client is re-initialized with new env
        process.env = {
            ...originalEnv,
            R2_ENDPOINT: 'https://test-endpoint.com',
            R2_ACCESS_KEY_ID: 'test-access-key',
            R2_SECRET_ACCESS_KEY: 'test-secret-key',
            R2_BUCKET_NAME: 'test-bucket',
            NEXT_PUBLIC_R2_PUBLIC_URL: 'https://test-public-url.com',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should upload a file and return the public URL', async () => {
        const buffer = Buffer.from('test content');
        const filename = 'test.jpg';
        const contentType = 'image/jpeg';

        const url = await uploadToR2(buffer, filename, contentType);

        expect(url).toContain('https://test-public-url.com/products/');
        expect(url).toContain(filename);
        expect(PutObjectCommand).toHaveBeenCalled();
    });

    it('should delete a file from R2', async () => {
        const url = 'https://test-public-url.com/products/test-key.jpg';

        await deleteFromR2(url);

        expect(DeleteObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'products/test-key.jpg',
        }));
    });

    it('should throw error if config is missing', async () => {
        process.env.R2_ENDPOINT = '';
        resetR2Client();

        await expect(uploadToR2(Buffer.from(''), 'test.jpg', 'image/jpeg'))
            .rejects.toThrow('R2 client cannot be initialized');
    });
});
