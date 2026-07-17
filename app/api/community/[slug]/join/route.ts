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
        .select('id, is_private')
        .eq('slug', slug)
        .single();

    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    const { data: existing } = await supabase
        .from('community_members')
        .select('id, status')
        .eq('community_id', community.id)
        .eq('user_id', userId)
        .maybeSingle();

    if (existing?.status === 'banned') {
        return NextResponse.json({ error: 'You are banned from this community' }, { status: 403 });
    }

    if (existing) {
        return NextResponse.json({ error: 'Already a member or request pending' }, { status: 409 });
    }

    const status = community.is_private ? 'pending' : 'active';

    const { error } = await supabaseServer.from('community_members').insert({
        community_id: community.id,
        user_id: userId,
        role: 'member',
        status,
    });

    if (error) return NextResponse.json({ error: 'Failed to join community' }, { status: 500 });

    return NextResponse.json({ status });
}
