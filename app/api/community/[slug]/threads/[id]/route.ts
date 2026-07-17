import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string }> }
) {
    const { id } = await params;

    const { data: thread, error } = await supabase
        .from('threads')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

    const { data: comments } = await supabase
        .from('thread_comments')
        .select('*')
        .eq('thread_id', id)
        .order('created_at', { ascending: true });

    return NextResponse.json({ thread, comments: comments || [] });
}

// Delete a thread. Allowed for the community owner or the thread's author.
// Comments are removed automatically via the ON DELETE CASCADE foreign key.
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string }> }
) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id } = await params;

    const { data: thread } = await supabase
        .from('threads')
        .select('id, user_id, community_id')
        .eq('id', id)
        .single();

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

    const { data: community } = await supabase
        .from('communities')
        .select('id, created_by')
        .eq('slug', slug)
        .single();

    if (!community || community.id !== thread.community_id) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const isOwner = community.created_by === userId;
    const isAuthor = thread.user_id === userId;
    if (!isOwner && !isAuthor) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseServer.from('threads').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });

    return NextResponse.json({ success: true });
}
