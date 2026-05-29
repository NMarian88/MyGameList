import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;

    const { data: community } = await supabase
        .from('communities')
        .select('id, created_by')
        .eq('slug', slug)
        .single();

    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    if (community.created_by === userId) {
        return NextResponse.json({ error: 'Owner cannot leave community' }, { status: 400 });
    }

    await supabaseServer
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', userId);

    return NextResponse.json({ success: true });
}
