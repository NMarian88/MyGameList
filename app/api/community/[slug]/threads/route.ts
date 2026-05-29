import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    const { data: threads, error } = await supabase
        .from('threads')
        .select('*')
        .eq('community_id', community.id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });

    return NextResponse.json({ threads: threads || [] });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;

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

    if (!membership) return NextResponse.json({ error: 'Must be a member to post' }, { status: 403 });

    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const user = await currentUser();
    const authorName = user?.username || user?.firstName || 'Anonymous';
    const authorImage = user?.imageUrl || null;

    const { data: thread, error } = await supabaseServer
        .from('threads')
        .insert({
            community_id: community.id,
            user_id: userId,
            title: title.trim(),
            content: content.trim(),
            author_name: authorName,
            author_image: authorImage,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating thread:', error);
        return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    return NextResponse.json({ thread });
}
