import { useState } from 'react';
import posthog from 'posthog-js';
import { getGameDetails } from '@/lib/rawg-api';
import { Game } from '@/lib/types';

export interface AddToCollectionOptions {
    reviewScore?: number;
    reviewText?: string;
}

export const useCollection = () => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isToastVisible, setIsToastVisible] = useState(false);


    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
        setTimeout(() => {
            setIsToastVisible(false);
            setToastMessage(null);
        }, 3000);
    };


    const addToCollection = async (
        game: Game,
        status: string = 'wishlist',
        options: AddToCollectionOptions = {}
    ) => {
        try {
            const fullGame = await getGameDetails(game.id);


            const gameResponse = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: fullGame.id,
                    rawg_id: fullGame.id,
                    name: fullGame.name,
                    slug: fullGame.slug || `game-${game.id}`,
                    description: fullGame.description,
                    background_image: fullGame.background_image || null,
                    released: fullGame.released ? new Date(fullGame.released).toISOString().split('T')[0] : null,
                    rating: fullGame.rating || 0,
                    rating_top: fullGame.rating_top || 0,
                    ratings_count: fullGame.ratings_count || 0,
                    metacritic: fullGame.metacritic || null,
                    playtime: fullGame.playtime || 0,
                    platforms: fullGame.platforms || [],
                    genres: fullGame.genres || [],
                    short_screenshots: game.short_screenshots || [],
                    metadata: fullGame
                }),
            });

            if (!gameResponse.ok && gameResponse.status !== 409) {
                console.error('Failed to save game to database');
                showToastMessage('Failed to process game details.');
                return;
            }

            const hasReview =
                options.reviewScore !== undefined || options.reviewText !== undefined;

            const userGameResponse = await fetch('/api/user/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: game.id,
                    status,
                    ...(status === 'completed' && { completedAt: new Date().toISOString() }),
                    ...(hasReview && {
                        reviews: [
                            {
                                reviewScore: options.reviewScore,
                                reviewText: options.reviewText,
                                reviewedAt: new Date().toISOString(),
                            },
                        ],
                    }),
                }),
            });

            if (userGameResponse.ok) {
                console.log('Game added to collection!');
                showToastMessage('Game added to collection!');
                posthog.capture('game_added_to_collection', {
                    game_id: game.id,
                    game_name: game.name,
                    status,
                });
                window.dispatchEvent(new CustomEvent('gameAdded'));
            } else {
                console.log('Failed to link game');
                showToastMessage('Failed to add game to collection.');
            }
        } catch (error) {
            console.error('Error adding game:', error);
            showToastMessage('Error adding game.');
        }
    };


    return {
        addToCollection,
        toastMessage,
        isToastVisible,
    };
};