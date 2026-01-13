"use client";
import { useState, useEffect } from "react";
import GameCard from "./GameCard";
import ViewToggle from "./ViewToggle";

type ViewMode = "cards" | "details";

// Game type and reusable component
type Game = { 
    title: string; 
    image: string;
    reviewScore?: number;
    status?: "completed" | "playing" | "wishlist";
};

interface GamesViewProps {
    games: Game[];
    viewMode: ViewMode;
    showScore?: boolean;
    showStatus?: boolean;
}

const GamesView = ({ games, viewMode, showScore, showStatus }: GamesViewProps) => {
    const gameCards = games.map((g, idx) => (
        <GameCard
            key={idx}
            gameName={g.title}
            image={g.image}
            viewMode={viewMode}
            {...(showScore && { show_score: !!g.reviewScore, score: g.reviewScore })}
            {...(showStatus && { show_status: !!g.status, status: g.status })}
        />
    ));

    return viewMode === "details" ? (
        <div role="tabpanel" className="mt-4 flex flex-col space-y-3">
            {gameCards}
        </div>
    ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 place-items-center">
            {gameCards}
        </div>
    );
};

export default function TabbedPanels() {
    const tabs = ["All", "Completed", "Playing", "Wishlist"] as const;
    type Tab = (typeof tabs)[number];
    const [active, setActive] = useState<Tab>(tabs[0]);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return "cards";
    });
    const [allGames, setAllGames] = useState<Game[]>([]);

    useEffect(() => {
        fetch("/api/user/games")
            .then((r) => r.json())
            .then((data) => setAllGames(data.games || []))
            .catch(console.error);
    }, []);

    const gamesByTab: Record<Tab, Game[]> = {
        All: allGames,
        Completed: allGames.filter(g => g.status === "completed"),
        Playing: allGames.filter(g => g.status === "playing"),
        Wishlist: allGames.filter(g => g.status === "wishlist"),
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
                                className={`px-3 py-1 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    active === t
                                        ? "bg-purple-600 text-white"
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
                <GamesView games={currentGames} viewMode={viewMode} showScore={showScore} showStatus={showStatus} />
            </div>
        </div>
    );
}
