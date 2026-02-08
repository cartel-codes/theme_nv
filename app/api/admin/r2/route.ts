import { NextResponse } from 'next/server';
import { listR2Files } from '@/lib/r2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const prefix = searchParams.get('prefix') || 'ai-generated/';

        const files = await listR2Files(prefix);

        return NextResponse.json({ success: true, files });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}