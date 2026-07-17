import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

// Attach Clerk profile info (username + avatar) to a list of membership rows.
async function withUserInfo(
    rows: { user_id: string; role?: string; joined_at: string }[]
) {
    if (!rows || rows.length === 0) return [];
    const clerk = await clerkClient();
    return Promise.all(
        rows.map(async (member) => {
            try {
                const user = await clerk.users.getUser(member.user_id);
                return {
                    userId: member.user_id,
                    username: user.username || user.firstName || 'Unknown User',
                    imageUrl: user.imageUrl,
                    role: member.role,
                    joinedAt: member.joined_at,
                };
            } catch {
                return {
                    userId: member.user_id,
                    username: 'Unknown User',
                    imageUrl: null,
                    role: member.role,
                    joinedAt: member.joined_at,
                };
            }
        })
    );
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const type = new URL(request.url).searchParams.get('type');

    const { data: community } = await supabase
        .from('communities')
        .select('id, created_by')
        .eq('slug', slug)
        .single();

    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    if (community.created_by !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Member management view: active members + banned users.
    if (type === 'members') {
        const { data: rows } = await supabase
            .from('community_members')
            .select('user_id, role, status, joined_at')
            .eq('community_id', community.id)
            .in('status', ['active', 'banned'])
            .order('joined_at', { ascending: true });

        const active = (rows || []).filter((r) => r.status === 'active');
        const banned = (rows || []).filter((r) => r.status === 'banned');

        return NextResponse.json({
            members: await withUserInfo(active),
            banned: await withUserInfo(banned),
        });
    }

    // Default view: pending join requests.
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

type MemberAction = 'approve' | 'reject' | 'kick' | 'ban' | 'unban';
const VALID_ACTIONS: MemberAction[] = ['approve', 'reject', 'kick', 'ban', 'unban'];

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
    const { user_id, action } = body as { user_id: string; action: MemberAction };

    if (!user_id || !VALID_ACTIONS.includes(action)) {
        return NextResponse.json(
            { error: `user_id and action (${VALID_ACTIONS.join('|')}) are required` },
            { status: 400 }
        );
    }

    // The owner can never be moderated out of their own community.
    if (user_id === community.created_by && ['kick', 'ban', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Cannot moderate the community owner' }, { status: 400 });
    }

    if (action === 'approve') {
        const { error } = await supabaseServer
            .from('community_members')
            .update({ status: 'active' })
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'pending');

        if (error) return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
    } else if (action === 'reject') {
        await supabaseServer
            .from('community_members')
            .delete()
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'pending');
    } else if (action === 'kick') {
        // Remove the member entirely — they are free to rejoin later.
        const { error } = await supabaseServer
            .from('community_members')
            .delete()
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'active');

        if (error) return NextResponse.json({ error: 'Failed to kick member' }, { status: 500 });
    } else if (action === 'ban') {
        // Keep the row with status 'banned' so the user cannot rejoin.
        const { error } = await supabaseServer
            .from('community_members')
            .update({ status: 'banned' })
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'active');

        if (error) return NextResponse.json({ error: 'Failed to ban member' }, { status: 500 });
    } else if (action === 'unban') {
        // Removing the banned row lets the user request/join again.
        const { error } = await supabaseServer
            .from('community_members')
            .delete()
            .eq('community_id', community.id)
            .eq('user_id', user_id)
            .eq('status', 'banned');

        if (error) return NextResponse.json({ error: 'Failed to unban member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
