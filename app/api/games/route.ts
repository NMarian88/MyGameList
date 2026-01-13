import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import games from "../../dashboard/data/games.json";

type Game = {
    rawg_slug?: string;
    title: string;
    image?: string;
    last_updated_at?: string;
    [k: string]: unknown;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("id");

    if (gameId) {
        // Return a specific game by ID
        const game = (games as Record<string, Game>)[gameId];
        if (!game) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ id: gameId, ...game });
    }

    // Return all games
    const allGames = Object.entries(games).map(([id, game]) => ({
        id,
        ...game
    }));

    return NextResponse.json({ games: allGames, total: allGames.length });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, title, rawg_slug, image, ...otherData } = body;

        if (!id || !title) {
            return NextResponse.json(
                { error: "id and title are required" },
                { status: 400 }
            );
        }

        // Read current games data
        const gamesPath = path.join(process.cwd(), "app/dashboard/data/games.json");
        const fileContent = await fs.readFile(gamesPath, "utf-8");
        const currentGames = JSON.parse(fileContent);

        // Check if game already exists
        if (currentGames[id]) {
            return NextResponse.json(
                { error: "Game with this ID already exists. Use PUT to update." },
                { status: 409 }
            );
        }

        // Add new game
        currentGames[id] = {
            title,
            rawg_slug,
            image,
            last_updated_at: new Date().toISOString(),
            ...otherData
        };

        // Write updated data back to file
        await fs.writeFile(gamesPath, JSON.stringify(currentGames, null, 2));

        return NextResponse.json({
            success: true,
            message: "Game added successfully",
            game: { id, ...currentGames[id] }
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
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        // Read current games data
        const gamesPath = path.join(process.cwd(), "app/dashboard/data/games.json");
        const fileContent = await fs.readFile(gamesPath, "utf-8");
        const currentGames = JSON.parse(fileContent);

        // Check if game exists
        if (!currentGames[id]) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 }
            );
        }

        // Update game
        currentGames[id] = {
            ...currentGames[id],
            ...updateData,
            last_updated_at: new Date().toISOString()
        };

        // Write updated data back to file
        await fs.writeFile(gamesPath, JSON.stringify(currentGames, null, 2));

        return NextResponse.json({
            success: true,
            message: "Game updated successfully",
            game: { id, ...currentGames[id] }
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

        // Read current games data
        const gamesPath = path.join(process.cwd(), "app/dashboard/data/games.json");
        const fileContent = await fs.readFile(gamesPath, "utf-8");
        const currentGames = JSON.parse(fileContent);

        // Check if game exists
        if (!currentGames[id]) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 }
            );
        }

        // Delete game
        delete currentGames[id];

        // Write updated data back to file
        await fs.writeFile(gamesPath, JSON.stringify(currentGames, null, 2));

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
