import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';

// POST /api/admin/printify/upload - Upload image to Printify
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl, fileName } = body;

    if (!imageUrl || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, fileName' },
        { status: 400 }
      );
    }

    // Get Printify provider config
    const provider = await prisma.printProvider.findFirst({
      where: { name: 'printify' }
    });

    if (!provider || !provider.apiKey) {
      return NextResponse.json(
        { error: 'Printify not configured' },
        { status: 400 }
      );
    }

    // Convert relative URL to absolute if needed
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      fullImageUrl = `${baseUrl}${imageUrl}`;
    }

    const api = new PrintifyAPI(provider.apiKey);
    const uploadResponse = await api.uploadImage(fullImageUrl, fileName);

    // Extract image ID from response
    const imageId = uploadResponse.id || uploadResponse.data?.id;

    if (!imageId) {
      throw new Error('Failed to get image ID from Printify upload response');
    }

    return NextResponse.json({ 
      success: true,
      imageId,
      response: uploadResponse 
    });
  } catch (error: any) {
    console.error('Error uploading to Printify:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
