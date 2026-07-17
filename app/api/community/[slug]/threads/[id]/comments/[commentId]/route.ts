import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

// Delete a comment. Allowed for the community owner or the comment's author.
// Child replies are removed automatically via the ON DELETE CASCADE foreign key.
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string; id: string; commentId: string }> }
) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug, id: threadId, commentId } = await params;

    const { data: comment } = await supabase
        .from('thread_comments')
        .select('id, user_id, thread_id')
        .eq('id', commentId)
        .single();

    if (!comment || comment.thread_id !== threadId) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const { data: community } = await supabase
        .from('communities')
        .select('created_by')
        .eq('slug', slug)
        .single();

    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    const isOwner = community.created_by === userId;
    const isAuthor = comment.user_id === userId;
    if (!isOwner && !isAuthor) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseServer.from('thread_comments').delete().eq('id', commentId);
    if (error) return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });

    return NextResponse.json({ success: true });
}
