import {google} from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import {auth} from '@clerk/nextjs/server';
import {NextResponse} from "next/server";
import { supabaseServer } from '@/lib/supabase';

export const maxDuration = 30;

async function buildLibraryContext(userId: string): Promise<string> {
    const { data: userGames, error } = await supabaseServer
        .from('user_games')
        .select(`*, reviews(review_score, review_text)`)
        .eq('user_id', userId);

    if (error || !userGames || userGames.length === 0) {
        return 'The user has no games in their library yet.';
    }

    const gameIds = userGames.map(g => g.game_id);
    const { data: gamesData } = await supabaseServer
        .from('games')
        .select('rawg_id, name')
        .in('rawg_id', gameIds);

    const nameMap: Record<string, string> = {};
    for (const g of gamesData || []) {
        nameMap[String(g.rawg_id)] = g.name;
    }

    const stats = {
        total: userGames.length,
        playing: userGames.filter(g => g.status === 'playing').length,
        completed: userGames.filter(g => g.status === 'completed').length,
        wishlist: userGames.filter(g => g.status === 'wishlist').length,
        dropped: userGames.filter(g => g.status === 'dropped').length,
    };

    const lines = userGames.map(g => {
        const name = nameMap[String(g.game_id)] || `Game #${g.game_id}`;
        const review = g.reviews?.[0];
        const score = review?.review_score != null ? `${review.review_score}/10` : 'not rated';
        const text = review?.review_text ? ` | Review: "${review.review_text}"` : '';
        return `- ${name} | Status: ${g.status} | Score: ${score}${text}`;
    });

    return [
        `User's game library (${stats.total} games — ${stats.playing} playing, ${stats.completed} completed, ${stats.wishlist} wishlist, ${stats.dropped} dropped):`,
        ...lines,
    ].join('\n');
}

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const { userId } = await auth();
    if(!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const libraryContext = await buildLibraryContext(userId);

    const result = streamText({
        model: google('gemini-2.5-flash'),
        temperature: 0.5,
        presencePenalty: 0,
        frequencyPenalty: 0,
        system: `You are an elite, friendly gaming companion for MYGAMELIST. Your job is to help users with their requests by providing information or links for that information. Keep your answers concise, practical, and highly strategic. Always offer the most information possible so the user does not have any confusions. Do not answer any questions that are not relating to the gaming ecosystem.

${libraryContext}`,
        messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}