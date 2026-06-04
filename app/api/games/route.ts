import { NextResponse } from "next/server";
import { Game } from "@/lib/types";
import { getGameDetails } from "@/lib/rawg-api";
import { supabase, supabaseServer } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("id");
    const gameSlug = searchParams.get("slug");
    
    const identifier = gameId || gameSlug;

    if (identifier) {
        const isNumeric = /^\d+$/.test(identifier);
        

        const { data: game, error } = await supabase
            .from('games')
            .select('*')
            .or(isNumeric ? `rawg_id.eq.${identifier}` : `slug.eq.${identifier}`)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
        
        if (game) {

            const formattedGame = {
                id: game.rawg_id,
                name: game.name,
                slug: game.slug,
                description: game.metadata?.description || game.description,
                released: game.released,
                background_image: game.background_image,
                rating: game.rating,
                rating_top: game.rating_top,
                ratings_count: game.metadata?.ratings_count,
                metacritic: game.metacritic,
                playtime: game.playtime,
                platforms: game.platforms || [],
                genres: game.genres || [],
                short_screenshots: game.metadata?.short_screenshots || [],
                ...game.metadata
            };
            console.log('this came from the database')
            return NextResponse.json(formattedGame);
        }
        

        try {
            const gameFromApi = await getGameDetails(isNumeric ? Number(identifier) : identifier);
            

            const gameRecord = {
                rawg_id: gameFromApi.id,
                name: gameFromApi.name,
                slug: gameFromApi.slug,
                released: gameFromApi.released,
                rating: gameFromApi.rating,
                rating_top: gameFromApi.rating_top,
                metacritic: gameFromApi.metacritic,
                playtime: gameFromApi.playtime,
                platforms: gameFromApi.platforms,
                genres: gameFromApi.genres,
                background_image: gameFromApi.background_image,
                metadata: gameFromApi
            };
            
            const { error: upsertError } = await supabaseServer
                .from('games')
                .upsert(gameRecord, { onConflict: 'id' });
            
            if (upsertError) {
                console.warn("Could not save game to database:", upsertError);
            }
            console.log('this came from rawg')
            return NextResponse.json(gameFromApi);
        } catch (error) {
            console.error("Error fetching game from RAWG API:", error);
            const errorMessage = error instanceof Error ? error.message : "Game not found";
            return NextResponse.json(
                { error: errorMessage },
                { status: 404 }
            );
        }
    }


    const { data: allGames, error } = await supabase
        .from('games')
        .select('*');
    
    if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ games: allGames || [], total: allGames?.length || 0 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, ...gameData } = body as { id: number } & Partial<Game>;

        if (!id || !gameData.name) {
            return NextResponse.json(
                { error: "id and name are required" },
                { status: 400 }
            );
        }


        const { data: existingGame } = await supabase
            .from('games')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (existingGame) {
            return NextResponse.json(
                { error: "Game with this ID already exists. Use PUT to update." },
                { status: 409 }
            );
        }


        const newGame: Game = {
            id,
            name: gameData.name,
            ...gameData
        };

        const { data, error } = await supabaseServer
            .from('games')
            .insert([newGame])
            .select()
            .single();

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to add game" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Game added successfully",
            game: data
        });

    } catch (error) {
        console.error("Error adding game:", error);
        return NextResponse.json(
            { error: "Failed to add game" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body as { id: number } & Partial<Game>;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }


        const { data, error } = await supabaseServer
            .from('games')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: "Game not found" },
                    { status: 404 }
                );
            }
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to update game" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Game updated successfully",
            game: data
        });

    } catch (error) {
        console.error("Error updating game:", error);
        return NextResponse.json(
            { error: "Failed to update game" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }


        const { error } = await supabaseServer
            .from('games')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to delete game" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Game deleted successfully",
            id
        });

    } catch (error) {
        console.error("Error deleting game:", error);
        return NextResponse.json(
            { error: "Failed to delete game" },
            { status: 500 }
        );
    }
}
