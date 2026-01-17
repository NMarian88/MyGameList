"use client";

import { useState } from "react";
import { GenreTracker } from "./GenreTracker";

type GenreData = {
    name: string;
    value: number;
};

interface GenreTrackerWrapperProps {
    countStats: GenreData[];
    scoreStats: GenreData[];
}

export function GenreTrackerWrapper({ countStats, scoreStats }: GenreTrackerWrapperProps) {
    const [mode, setMode] = useState<"count" | "score">("count");

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Genre Distribution</h3>
                <div className="flex gap-1 bg-gray-900/50 rounded p-1">
                    <button
                        onClick={() => setMode("count")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            mode === "count"
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        Count
                    </button>
                    <button
                        onClick={() => setMode("score")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            mode === "score"
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        Rating
                    </button>
                </div>
            </div>
            <div className="flex-1">
                <GenreTracker genres={mode === "count" ? countStats : scoreStats} />
            </div>
        </>
    );
}
