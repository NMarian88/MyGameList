export interface Game{
    id: number;
    name: string;
    description?: string;
    released?: string;
    background_image?: string;
    rating?: number;
    rating_top?: number;
    ratings_count?: number;
    metacritic?: number | null;
    playtime?: number;
    platforms?: {
        platform: {
            id:number;
            name: string;
        };
    }[];
    genres?: {
        id:number;
        name: string;
    }[];
    short_screenshots?: {
        id:number;
        image: string;
    }[];
    [key: string]: unknown; // Allow additional RAWG API fields
}

export interface UserData {
    games: UserGameData[];
    stats: {
        totalGames: number;
        playing: number;
        completed: number;
        wishlist?: number;
        dropped?: number;
    };
}

export interface UserGameData{
    gameId: string;
    status: "playing" | "completed" | "wishlist" | "dropped";
    reviews?: {
        reviewScore?: number;
        reviewText?: string;
        reviewedAt?: string;
    }[];
    completedAt?: string;
}