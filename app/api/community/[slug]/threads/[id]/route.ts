import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
