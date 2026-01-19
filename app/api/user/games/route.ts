import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserGameData } from "../../../../lib/types";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized - user not authenticated" },
                { status: 401 }
            );
        }

        // Fetch user games with reviews from Supabase
        const { data: userGames, error } = await supabaseServer
            .from('user_games')
            .select(`
                *,
                reviews(
                    review_score,
                    review_text,
                    reviewed_at
                )
            `)
            .eq('user_id', userId);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to fetch user data" },
                { status: 500 }
            );
        }

        // Calculate stats
        const games = userGames || [];
        const stats = {
            totalGames: games.length,
            playing: games.filter(g => g.status === "playing").length,
            completed: games.filter(g => g.status === "completed").length,
            wishlist: games.filter(g => g.status === "wishlist").length,
            dropped: games.filter(g => g.status === "dropped").length
        };

        return NextResponse.json({ 
            games: games.map(g => ({
                gameId: g.game_id,
                status: g.status,
                reviews: (g.reviews || []).map((r: any) => ({
                    reviewScore: r.review_score,
                    reviewText: r.review_text,
                    reviewedAt: r.reviewed_at
                })),
                completedAt: g.completed_at
            })),
            stats
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return NextResponse.json(
            { error: "Failed to fetch user data" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized - user not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { gameId, status, reviews, completedAt } = body as Partial<UserGameData>;

        if (!gameId || !status) {
            return NextResponse.json(
                { error: "gameId and status are required" },
                { status: 400 }
            );
        }

        if (!["playing", "completed", "wishlist", "dropped"].includes(status)) {
            return NextResponse.json(
                { error: "status must be one of: playing, completed, wishlist, dropped" },
                { status: 400 }
            );
        }

        // Fetch the game details to get both ID and slug
        let gameDetails;
        try {
            const response = await fetch(`${request.url.split('/api')[0]}/api/games?id=${gameId}`);
            if (response.ok) {
                gameDetails = await response.json();
            }
        } catch (error) {
            console.warn("Could not fetch game details:", error);
        }

        // Use numeric ID if available, otherwise use provided gameId
        const finalGameId = gameDetails ? String(gameDetails.id) : gameId;

        // Check if user already has this game
        const { data: existingGame } = await supabaseServer
            .from('user_games')
            .select('id')
            .eq('user_id', userId)
            .eq('game_id', finalGameId)
            .maybeSingle();

        const gameData = {
            user_id: userId,
            game_id: finalGameId,
            status,
            completed_at: status === "completed" ? (completedAt || new Date().toISOString()) : null
        };

        let userGameId;
        if (existingGame) {
            // Update existing entry
            const result = await supabaseServer
                .from('user_games')
                .update(gameData)
                .eq('user_id', userId)
                .eq('game_id', finalGameId)
                .select('id')
                .single();
            
            if (result.error) {
                console.error("Database error:", result.error);
                return NextResponse.json(
                    { error: "Failed to update user data" },
                    { status: 500 }
                );
            }
            userGameId = result.data.id;
        } else {
            // Insert new entry
            const result = await supabaseServer
                .from('user_games')
                .insert(gameData)
                .select('id')
                .single();
            
            if (result.error) {
                console.error("Database error:", result.error);
                return NextResponse.json(
                    { error: "Failed to insert user data" },
                    { status: 500 }
                );
            }
            userGameId = result.data.id;
        }

        // Handle review update (single review, not array)
        if (reviews && Array.isArray(reviews) && reviews.length > 0) {
            // Get the latest review from the request
            const latestReview = reviews[reviews.length - 1];
            
            // Check if there's an existing review for this user_game
            const { data: existingReviews } = await supabaseServer
                .from('reviews')
                .select('id')
                .eq('user_game_id', userGameId)
                .order('reviewed_at', { ascending: false })
                .limit(1);

            const reviewData = {
                user_game_id: userGameId,
                review_score: latestReview.reviewScore,
                review_text: latestReview.reviewText,
                reviewed_at: latestReview.reviewedAt || new Date().toISOString()
            };

            let reviewError;
            if (existingReviews && existingReviews.length > 0) {
                // Update existing review
                const result = await supabaseServer
                    .from('reviews')
                    .update(reviewData)
                    .eq('id', existingReviews[0].id);
                reviewError = result.error;
            } else {
                // Insert new review
                const result = await supabaseServer
                    .from('reviews')
                    .insert(reviewData);
                reviewError = result.error;
            }

            if (reviewError) {
                console.error("Review operation error:", reviewError);
                // Don't fail the request if reviews fail, just log it
            }
        }

        // Calculate updated stats
        const { data: allUserGames } = await supabaseServer
            .from('user_games')
            .select('status')
            .eq('user_id', userId);

        const stats = {
            totalGames: allUserGames?.length || 0,
            playing: allUserGames?.filter(g => g.status === "playing").length || 0,
            completed: allUserGames?.filter(g => g.status === "completed").length || 0,
            wishlist: allUserGames?.filter(g => g.status === "wishlist").length || 0,
            dropped: allUserGames?.filter(g => g.status === "dropped").length || 0
        };

        return NextResponse.json({ 
            success: true, 
            message: `Game ${existingGame ? 'updated' : 'added'} with status: ${status}`,
            gameId: finalGameId,
            userId,
            stats
        });

    } catch (error) {
        console.error("Error updating user data:", error);
        return NextResponse.json(
            { error: "Failed to update user data" },
            { status: 500 }
        );
    }
}
