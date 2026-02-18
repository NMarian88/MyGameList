import { Game } from "./types";

const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

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

export async function getGameDetails(idOrSlug: number | string): Promise<Game> {
    const response = await fetch(
        `${BASE_URL}/games/${idOrSlug}?key=${RAWG_API_KEY}`
    );
    if(!response.ok){
        const errorText = await response.text();
        throw new Error(`Failed to fetch game: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const text = await response.text();
    if (!text) {
        throw new Error('Empty response from RAWG API');
    }
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Invalid JSON response from RAWG API: ${text.substring(0, 100)}`);
    }
}

export async function getGameImages(id: number){
    const response = await fetch(
        `${BASE_URL}/games/${id}/screenshots?key=${RAWG_API_KEY}`
    );
    if(!response.ok){
        throw new Error('Failed to fetch game images');
    }
    return response.json();
}