import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const { userId } = await auth();

    const { data: community, error } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !community) {
        return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const { count: memberCount } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)
        .eq('status', 'active');

    let membership = null;
    if (userId) {
        const { data } = await supabase
            .from('community_members')
            .select('role, status')
            .eq('community_id', community.id)
            .eq('user_id', userId)
            .maybeSingle();
        membership = data;
    }

    return NextResponse.json({ community, memberCount: memberCount || 0, membership });
}
