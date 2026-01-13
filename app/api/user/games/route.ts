import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import userData from "../../../dashboard/data/user_data.json";
import games from "../../../dashboard/data/games.json";
import { getGameDetails } from "../../../../lib/rawg-api";

type Game = {
    rawg_slug?: string;
    title?: string;
    gameName?: string;
    name?: string;
    image?: string;
    last_updated_at?: string;
    [k: string]: unknown;
};

type UserGame = { 
    gameId: string; 
    status: "playing" | "completed" | "wishlist";
    [k: string]: unknown;
};

type UserData = {
    games?: UserGame[];
    [k: string]: unknown;
};

export async function GET() {
    const userGames = ((userData as UserData).games || []) as UserGame[];
    const gamesById = { ...games } as Record<string, Game>;

    const allGameIds = userGames
        .map((u) => u.gameId)
        .filter((id): id is string => typeof id === "string");

    // Find missing game IDs
    const missingIds = allGameIds.filter(id => !gamesById[id]);

    // Fetch missing games from RAWG API
    if (missingIds.length > 0) {
        const gamesPath = path.join(process.cwd(), "app/dashboard/data/games.json");
        
        for (const id of missingIds) {
            try {
                const rawgGame = await getGameDetails(parseInt(id));
                const gameData = {
                    title: rawgGame.name,
                    rawg_slug: rawgGame.name.toLowerCase().replace(/\s+/g, '-'),
                    image: rawgGame.background_image,
                    last_updated_at: new Date().toISOString()
                };
                gamesById[id] = gameData;
            } catch (error) {
                console.error(`Failed to fetch game ${id} from RAWG:`, error);
            }
        }

        // Save updated games.json with newly fetched games
        try {
            await fs.writeFile(gamesPath, JSON.stringify(gamesById, null, 2));
        } catch (error) {
            console.error("Failed to update games.json:", error);
        }
    }

    const merged = userGames.map((u) => {
        const g = gamesById[u.gameId] || {};
        return { ...u, ...g };
    });

    return NextResponse.json({ games: merged });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gameId, status, ...data } = body;

        if (!gameId || !status) {
            return NextResponse.json(
                { error: "gameId and status are required" },
                { status: 400 }
            );
        }

        if (!["playing", "completed", "wishlist"].includes(status)) {
            return NextResponse.json(
                { error: "status must be one of: playing, completed, wishlist" },
                { status: 400 }
            );
        }

        // Read current user data
        const userDataPath = path.join(process.cwd(), "app/dashboard/data/user_data.json");
        const fileContent = await fs.readFile(userDataPath, "utf-8");
        const currentUserData = JSON.parse(fileContent) as UserData;

        // Initialize games array if it doesn't exist
        if (!currentUserData.games) {
            currentUserData.games = [];
        }

        // Find existing game or create new entry
        const existingIndex = currentUserData.games.findIndex((g: UserGame) => g.gameId === gameId);
        
        const gameData = {
            gameId,
            status,
            ...data,
            ...(status === "completed" && !data.completedAt && { completedAt: new Date().toISOString() })
        };

        if (existingIndex >= 0) {
            // Update existing entry
            currentUserData.games[existingIndex] = gameData;
        } else {
            // Add new entry
            currentUserData.games.push(gameData);
        }

        // Write updated data back to file
        await fs.writeFile(userDataPath, JSON.stringify(currentUserData, null, 2));

        return NextResponse.json({ 
            success: true, 
            message: `Game added with status: ${status}`,
            gameId 
        });

    } catch (error) {
        console.error("Error updating user data:", error);
        return NextResponse.json(
            { error: "Failed to update user data" },
            { status: 500 }
        );
    }
}
