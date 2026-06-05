import {google} from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage ,stepCountIs} from 'ai';
import {auth} from '@clerk/nextjs/server';
import {NextResponse} from "next/server";
import { supabaseServer } from '@/lib/supabase';
import { z } from 'zod';
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
    const { userId, has } = await auth();
    if(!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const isPro = has({ plan: 'premium' });
    const MAX_CHATS = isPro ? 10 : 5;
    const today = new Date().toISOString().split('T')[0];

    const { data: usageData } = await supabaseServer
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', userId)
        .single();
    let currentCount = usageData?.chat_count || 0;
    const lastDate = usageData?.last_chat_date;

    if (lastDate !== today) {
        currentCount = 0;
    }

    if (currentCount >= MAX_CHATS) {
        return NextResponse.json(
            { error: `Daily limit reached. ${isPro ? 'Check back tomorrow!' : 'Upgrade to Pro for more chats!'}` },
            { status: 429 } // 429 means "Too Many Requests"
        );
    }
    await supabaseServer
        .from('user_ai_usage')
        .upsert({
            user_id: userId,
            chat_count: currentCount + 1,
            last_chat_date: today
        });

    const libraryContext = await buildLibraryContext(userId);

    const result = streamText({
        model: google('gemini-2.5-flash'),
        temperature: 0.2,
        presencePenalty: 0,
        frequencyPenalty: 0,
        system: `You are an elite, friendly gaming companion for MYGAMELIST. Your job is to help users with their requests by providing information or links for that information. Make sure your answers contain enough information so that the users does not get confused and requires more queries. Do not answer any questions that are not relating to the gaming ecosystem.  CRITICAL: If asked about specific achievements, walkthroughs, or lore, use the webSearch tool to find the accurate information before answering. Never guess achievement unlock requirements. Create a complete guide of achievements or walkthroughs

${libraryContext}`,
        messages: await convertToModelMessages(messages),
        tools: {
            webSearch: {
                description: 'Search the web for video game achievements, guides, and specific gaming facts.',
                inputSchema: z.object({
                    query: z.string().describe('The search query, e.g., "How to get Pacifist achievement in Hollow Knight"'),
                }),
                execute: async ({ query }: { query: string }) => {
                    try {
                        const response = await fetch('https://api.tavily.com/search', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
                            },
                            body: JSON.stringify({
                                query: query,
                                search_depth: "basic"
                            })
                        });

                        if (!response.ok) {
                            console.error(`Search Tool Error: Search failed with status: ${response.status}`);
                            return { results: "Error: Could not access the internet to verify the information." };
                        }

                        const data = await response.json();

                        return {
                            results: data.results.map((r: any) => ({
                                title: r.title,
                                content: r.content
                            }))
                        };

                    } catch (error) {
                        console.error("Search Tool Error:", error);
                        return { results: "Error: Could not access the internet to verify the information." };
                    }
                },
            },
        },

        stopWhen: stepCountIs(3),
    });


    return result.toUIMessageStreamResponse();
}