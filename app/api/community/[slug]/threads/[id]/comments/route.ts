import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string }> }
) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id: threadId } = await params;

    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    const { data: membership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', community.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'Must be a member to comment' }, { status: 403 });

    const body = await request.json();
    const { content, parent_comment_id } = body;

    if (!content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 });

    const user = await currentUser();
    const authorName = user?.username || user?.firstName || 'Anonymous';
    const authorImage = user?.imageUrl || null;

    const { data: comment, error } = await supabaseServer
        .from('thread_comments')
        .insert({
            thread_id: threadId,
            user_id: userId,
            content: content.trim(),
            parent_comment_id: parent_comment_id || null,
            author_name: authorName,
            author_image: authorImage,
        })
        .select()
        .single();

    if (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
}
