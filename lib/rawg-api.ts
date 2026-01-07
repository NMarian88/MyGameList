const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

export interface Game{
    id: number;
    name: string;
    released: string;
    background_image: string;
    rating: number;
    rating_top: number;
    ratings_count: number;
    metacritic: number;
    playtime: number;
    platforms:{
        platform: {
            id:number;
            name: string;
        };
    }[];
    genres:{
        id:number;
        name: string;
    }[];
    short_screenshots:{
        id:number;
        image: string;
    }[];
}

export interface ApiResponse{
    count: number;
    next: string | null;
    previous: string | null;
    results:Game[];
}

export async function searchGames(query: string, page=1): Promise<ApiResponse> {
    const response = await fetch(
        `${BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page=${page}&page_size=20`,
    );
    if(!response.ok){
        throw new Error('Failed to search games.');
    }
    return response.json();
}
export async function getPopularGames(page = 1): Promise<ApiResponse> {
    const response = await fetch(
        `${BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-added&page=${page}&page_size=16`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch popular games');
    }

    return response.json();
}

export async function getTopRatedGames(page=1):Promise<ApiResponse>{
    const response = await fetch(
        `${BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-metacritic&page=${page}&page_size=16`
    );
    if(!response.ok){
        throw new Error('Failed to fetch top rated games.');
    }
    return response.json();
}

export async function getGameDetails(id:number):Promise<Game>{
    const response = await fetch(
        `${BASE_URL}/games/${id}?key=${RAWG_API_KEY}`
    );
    if(!response.ok){
        throw new Error('Failed to fetch game');
    }
    return response.json();
}