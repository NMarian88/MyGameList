'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddToCollectionButtonProps {
    gameId: number;
    gameName: string;
    userId: string | null;
    initialStatus?: string;
}

export default function AddToCollectionButton({
                                                  gameId,
                                                  gameName,
                                                  userId,
                                                  initialStatus = 'wishlist'
                                              }: AddToCollectionButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const router = useRouter();

    const handleAdd = async () => {
        if (!userId) {
            router.push('/sign-in');
            return;
        }

        setIsAdding(true);
        try {
            const response = await fetch('/api/user/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: gameId,
                    status: initialStatus
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add game');
            }

            setIsAdded(true);
            toast.success(`"${gameName}" added to your collection!`);


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
        <button
            onClick={handleAdd}
            disabled={isAdding}
            className={`px-8 py-4 w-fit rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center gap-3 ${
                isAdded
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
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
    );
}