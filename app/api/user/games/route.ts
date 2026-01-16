import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@clerk/nextjs/server";
import { UserData, UserGameData } from "../../../../lib/types";

type MultiUserData = {
    [userId: string]: UserData;
};

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized - user not authenticated" },
                { status: 401 }
            );
        }

        // Read user data file
        const userDataPath = path.join(process.cwd(), "app/dashboard/data/user_data.json");
        const fileContent = await fs.readFile(userDataPath, "utf-8");
        const allUserData = JSON.parse(fileContent) as MultiUserData;

        // Get or initialize user data
        const userData = allUserData[userId] || { games: [], stats: { totalGames: 0, playing: 0, completed: 0, wishlist: 0, dropped: 0 } };

        return NextResponse.json({ 
            games: userData.games || [],
            stats: userData.stats
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

        // Read current user data
        const userDataPath = path.join(process.cwd(), "app/dashboard/data/user_data.json");
        const fileContent = await fs.readFile(userDataPath, "utf-8");
        const allUserData = JSON.parse(fileContent) as MultiUserData;

        // Get or initialize user data for this specific user
        if (!allUserData[userId]) {
            allUserData[userId] = {
                games: [],
                stats: { totalGames: 0, playing: 0, completed: 0, wishlist: 0, dropped: 0 }
            };
        }

        const currentUserData = allUserData[userId];

        // Initialize games array if it doesn't exist
        if (!currentUserData.games) {
            currentUserData.games = [];
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

        // Find existing game by gameId, or by matching ID/slug if we have game details
        let existingIndex = currentUserData.games.findIndex((g) => g.gameId === gameId);
        
        if (existingIndex < 0 && gameDetails) {
            // Check if we have the same game stored with a different identifier (ID vs slug)
            existingIndex = currentUserData.games.findIndex((g) => 
                g.gameId === String(gameDetails.id) || 
                g.gameId === gameDetails.slug ||
                String(g.gameId) === String(gameDetails.id)
            );
        }
        
        const gameData: UserGameData = {
            gameId: gameDetails ? String(gameDetails.id) : gameId, // Always use numeric ID if available
            status,
            ...(reviews && { reviews }),
            ...(status === "completed" && { completedAt: completedAt || new Date().toISOString() })
        };

        if (existingIndex >= 0) {
            // Update existing entry (use the numeric ID if we have it)
            currentUserData.games[existingIndex] = gameData;
        } else {
            // Add new entry
            currentUserData.games.push(gameData);
        }

        // Update stats
        currentUserData.stats = {
            totalGames: currentUserData.games.length,
            playing: currentUserData.games.filter(g => g.status === "playing").length,
            completed: currentUserData.games.filter(g => g.status === "completed").length,
            wishlist: currentUserData.games.filter(g => g.status === "wishlist").length,
            dropped: currentUserData.games.filter(g => g.status === "dropped").length
        };

        // Update the user's data in the multi-user structure
        allUserData[userId] = currentUserData;

        // Write updated data back to file
        await fs.writeFile(userDataPath, JSON.stringify(allUserData, null, 2));

        return NextResponse.json({ 
            success: true, 
            message: `Game ${existingIndex >= 0 ? 'updated' : 'added'} with status: ${status}`,
            gameId,
            userId,
            stats: currentUserData.stats
        });

    } catch (error) {
        console.error("Error updating user data:", error);
        return NextResponse.json(
            { error: "Failed to update user data" },
            { status: 500 }
        );
    }
}
