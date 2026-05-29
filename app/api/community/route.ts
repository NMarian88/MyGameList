import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let dbQuery = supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data, error } = await dbQuery.limit(20);

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
    }

    return NextResponse.json({ communities: data || [] });
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const body = await request.json();
    const { name, description, is_private } = body;

    if (!name?.trim() || !description?.trim()) {
        return NextResponse.json({ error: 'name and description are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: existing } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ error: 'A community with that name already exists' }, { status: 409 });
    }

    const { data: community, error } = await supabaseServer
        .from('communities')
        .insert({
            name: name.trim(),
            slug,
            description: description.trim(),
            is_private: is_private || false,
            created_by: userId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating community:', error);
        return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
    }

    await supabaseServer.from('community_members').insert({
        community_id: community.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
    });

    return NextResponse.json({ community });
}
