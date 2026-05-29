import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function GET(
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
    if (community.created_by !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: pending } = await supabase
        .from('community_members')
        .select('user_id, joined_at')
        .eq('community_id', community.id)
        .eq('status', 'pending');

    if (!pending || pending.length === 0) {
        return NextResponse.json({ requests: [] });
    }

    const clerk = await clerkClient();
    const requests = await Promise.all(
        pending.map(async (member) => {
            try {
                const user = await clerk.users.getUser(member.user_id);
                return {
                    userId: member.user_id,
                    username: user.username || user.firstName || 'Unknown User',
                    imageUrl: user.imageUrl,
                    requestedAt: member.joined_at,
                };
            } catch {
                return {
                    userId: member.user_id,
                    username: 'Unknown User',
                    imageUrl: null,
                    requestedAt: member.joined_at,
                };
            }
        })
    );

    return NextResponse.json({ requests });
}

export async function PATCH(
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
    if (community.created_by !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { user_id, action } = body as { user_id: string; action: 'approve' | 'reject' };

    if (!user_id || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'user_id and action (approve|reject) are required' }, { status: 400 });
    }

    if (action === 'approve') {
        const { error } = await supabaseServer
            .from('community_members')
            .update({ status: 'active' })
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'pending');

        if (error) return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
    } else {
        await supabaseServer
            .from('community_members')
            .delete()
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'pending');
    }

    return NextResponse.json({ success: true });
}
