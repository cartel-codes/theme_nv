import { POST } from '../route';
import { uploadToR2 } from '@/lib/r2';
import sharp from 'sharp';

// Mock lib/r2
jest.mock('@/lib/r2', () => ({
    uploadToR2: jest.fn(),
}));

// Mock sharp
jest.mock('sharp', () => {
    const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image')),
    };
    return jest.fn(() => mockSharp);
});

describe('POST /api/upload', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createMockRequest = (formData: FormData | null) => {
        return {
            formData: jest.fn().mockResolvedValue(formData),
        } as any;
    };

    it('uploads an image successfully', async () => {
        const fileContent = 'fake-image-content';
        const file = {
            type: 'image/jpeg',
            size: 1024,
            name: 'test.jpg',
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
        };

        const mockFormData = {
            get: jest.fn().mockReturnValue(file),
        };

        (uploadToR2 as jest.Mock).mockResolvedValue('https://cdn.com/test.webp');

        const request = createMockRequest(mockFormData as any);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.url).toBe('https://cdn.com/test.webp');
        expect(sharp).toHaveBeenCalled();
        expect(uploadToR2).toHaveBeenCalled();
    });

    it('returns 400 if no file is provided', async () => {
        const mockFormData = {
            get: jest.fn().mockReturnValue(null),
        };
        const request = createMockRequest(mockFormData as any);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('No file provided');
    });

    it('returns 400 for invalid file types', async () => {
        const file = {
            type: 'text/plain',
            size: 1024,
        };
        const mockFormData = {
            get: jest.fn().mockReturnValue(file),
        };
        const request = createMockRequest(mockFormData as any);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid file type');
    });

    it('returns 400 for files exceeding 5MB', async () => {
        const file = {
            type: 'image/jpeg',
            size: 6 * 1024 * 1024, // 6MB
        };
        const mockFormData = {
            get: jest.fn().mockReturnValue(file),
        };
        const request = createMockRequest(mockFormData as any);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('File too large');
    });
});
