"use client";
import { useState, useEffect } from "react";
import { UserGameData, Game } from "@/lib/types";
import GameCard from "./GameCard";
import ViewToggle from "./ViewToggle";
import GameModal from "./GameModal";

type ViewMode = "cards" | "details";

type UserGameWithDetails = UserGameData & {
    game: Game;
};

interface GamesViewProps {
    games: UserGameWithDetails[];
    viewMode: ViewMode;
    showScore?: boolean;
    showStatus?: boolean;
    onGameClick: (game: UserGameWithDetails) => void;
}

const GamesView = ({ games, viewMode, showScore, showStatus, onGameClick }: GamesViewProps) => {
    const gameCards = games.map((g, idx) => {
        const latestReview = g.reviews?.[g.reviews.length - 1];
        const genres = Array.isArray(g.game.genres) 
            ? g.game.genres.map(genre => genre.name).join(', ') 
            : '';
        const platforms = Array.isArray(g.game.platforms)
            ? g.game.platforms.map(plat => plat.platform?.name).filter(Boolean).join(', ')
            : '';
        
        return (
            <GameCard
                key={idx}
                gameName={g.game.name}
                image={g.game.background_image || "https://media.rawg.io/media/screenshots/df3/df397a86c8d5b4023fe13fa6dd7f140f.jpeg"}
                genres={genres}
                platforms={platforms}
                description={g.game.description || ""}
                viewMode={viewMode}
                onClick={() => onGameClick(g)}
                {...(showScore && latestReview?.reviewScore && { 
                    show_score: true, 
                    score: latestReview.reviewScore 
                })}
                {...(showStatus && { show_status: true, status: g.status })}
            />
        );
    });

    return viewMode === "details" ? (
        <div role="tabpanel" className="mt-4 flex flex-col space-y-3">
            {gameCards}
        </div>
    ) : (
        <div className="mt-4 grid gap-6 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(256px, 256px))' }}>
            {gameCards}
        </div>
    );
};

export default function TabbedPanels() {
    const tabs = ["All", "Completed", "Playing", "Wishlist", "Dropped"] as const;
    type Tab = (typeof tabs)[number];
    
    const [active, setActive] = useState<Tab>(tabs[0]);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return "cards";
    });
    const [allGames, setAllGames] = useState<UserGameWithDetails[]>([]);
    const [selectedGame, setSelectedGame] = useState<UserGameWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGameClick = (game: UserGameWithDetails) => {
        setSelectedGame(game);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedGame(null);
    };

    useEffect(() => {
        fetch("/api/user/games")
            .then(r => r.json())
            .then(async (userData) => {
                const userGames = userData.games || [];
                
                // Fetch game details for each user game
                const gamesWithDetails = await Promise.all(
                    userGames.map(async (userGame: UserGameData) => {
                        try {
                            const response = await fetch(`/api/games?id=${userGame.gameId}`);
                            if (!response.ok) {
                                console.error(`Failed to fetch game ${userGame.gameId}`);
                                return null;
                            }
                            const game = await response.json();
                            const combined = {
                                ...userGame,
                                game
                            };
                            return combined;
                        } catch (error) {
                            console.error(`Error fetching game ${userGame.gameId}:`, error);
                            return null;
                        }
                    })
                );

                // Filter out null values (failed fetches)
                const validGames = gamesWithDetails.filter((g): g is UserGameWithDetails => g !== null);
                setAllGames(validGames);
            })
            .catch(console.error);
    }, []);

    const refreshGames = async () => {
        try {
            const response = await fetch("/api/user/games");
            const userData = await response.json();
            const userGames = userData.games || [];
            
            const gamesWithDetails = await Promise.all(
                userGames.map(async (userGame: UserGameData) => {
                    try {
                        const response = await fetch(`/api/games?id=${userGame.gameId}`);
                        if (!response.ok) return null;
                        const game = await response.json();
                        return { ...userGame, game };
                    } catch (error) {
                        console.error(`Error fetching game ${userGame.gameId}:`, error);
                        return null;
                    }
                })
            );
            
            const validGames = gamesWithDetails.filter((g): g is UserGameWithDetails => g !== null);
            setAllGames(validGames);
        } catch (error) {
            console.error('Error refreshing games:', error);
        }
    };

    useEffect(() => {
        const handleGameAdded = () => {
            refreshGames();
        };

        window.addEventListener('gameAdded', handleGameAdded);

        return () => {
            window.removeEventListener('gameAdded', handleGameAdded);
        };
    }, []);

    const gamesByTab: Record<Tab, UserGameWithDetails[]> = {
        All: allGames,
        Completed: allGames.filter(g => g.status === "completed"),
        Playing: allGames.filter(g => g.status === "playing"),
        Wishlist: allGames.filter(g => g.status === "wishlist"),
        Dropped: allGames.filter(g => g.status === "dropped"),
    };

    const currentGames = gamesByTab[active];
    const showScore = active === "Completed" || active === "All";
    const showStatus = active === "All";

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700 w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Library</h3>
                <div className="flex items-center space-x-4">
                    <div
                        role="tablist"
                        aria-label="Game categories"
                        className="flex space-x-2"
                    >
                        {tabs.map((t) => (
                            <button
                                key={t}
                                role="tab"
                                aria-selected={active === t}
                                onClick={() => setActive(t)}
                                className={`px-3 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    active === t
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>
            </div>
            <div>
                <GamesView games={currentGames} viewMode={viewMode} showScore={showScore} showStatus={showStatus} onGameClick={handleGameClick} />
            </div>
            
            {/* Game Modal */}
            {selectedGame && (
                <GameModal 
                    game={selectedGame.game}
                    userGameData={selectedGame}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onStatusChange={refreshGames}
                />
            )}
        </div>
    );
}
