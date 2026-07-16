'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AddToCollectionModal, { CollectionSelection } from './AddToCollectionModal';

interface AddToCollectionButtonProps {
    game: any;
    userId: string | null;
    initialStatus?: string;
}

export default function AddToCollectionButton({
                                                  game,
                                                  userId,
                                              }: AddToCollectionButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleOpen = () => {
        if (!userId) {
            router.push('/sign-in');
            return;
        }
        setIsModalOpen(true);
    };

    const handleConfirm = async (selection: CollectionSelection) => {
        setIsAdding(true);
        try {
            const gameResponse = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: game.id,
                    rawg_id: game.id,
                    name: game.name,
                    slug: game.slug || `game-${game.id}`,
                    description: game.description,
                    background_image: game.background_image || null,
                    released: game.released ? new Date(game.released).toISOString().split('T')[0] : null,
                    rating: game.rating || 0,
                    rating_top: game.rating_top || 0,
                    ratings_count: game.ratings_count || 0,
                    metacritic: game.metacritic || null,
                    playtime: game.playtime || 0,
                    platforms: game.platforms || [],
                    genres: game.genres || [],
                    short_screenshots: game.short_screenshots || [],
                    metadata: game
                }),
            });

            if (!gameResponse.ok && gameResponse.status !== 409) {
                console.error('Failed to process game details.');
            }


            const hasReview =
                selection.reviewScore !== undefined || selection.reviewText !== undefined;

            const userGameResponse = await fetch('/api/user/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: game.id,
                    status: selection.status,
                    ...(selection.status === 'completed' && {
                        completedAt: new Date().toISOString(),
                    }),
                    ...(hasReview && {
                        reviews: [
                            {
                                reviewScore: selection.reviewScore,
                                reviewText: selection.reviewText,
                                reviewedAt: new Date().toISOString(),
                            },
                        ],
                    }),
                }),
            });

            const data = await userGameResponse.json();

            if (!userGameResponse.ok) {
                console.error(data.message || 'Failed to add game to collection.');
            }

            setIsModalOpen(false);
            setIsAdded(true);
            toast.success(`"${game.name}" added to your collection!`);

            window.dispatchEvent(new CustomEvent('gameAdded'));

            setTimeout(() => setIsAdded(false), 3000);
        } catch (error: any) {
            console.error('Error adding game:', error);
            toast.error(error.message || 'Failed to add game');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                disabled={isAdding}
                className={`px-8 py-4 w-fit rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center gap-3 ${
                    isAdded
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                }`}
            >
                {isAdding ? (
                    <Loader2 className="animate-spin" size={24} />
                ) : isAdded ? (
                    <Check size={24} />
                ) : (
                    <Plus size={24} />
                )}
                {isAdding ? 'Adding...' : isAdded ? 'Added!' : 'Add to Collection'}
            </button>

            <AddToCollectionModal
                isOpen={isModalOpen}
                gameName={game.name}
                isSubmitting={isAdding}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
            />
        </>
    );
}