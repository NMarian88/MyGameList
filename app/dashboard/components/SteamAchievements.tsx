"use client";
import { useState, useEffect } from 'react';

interface SteamAchievementsProps {
    steamId: string;
    rawgId: number;
}

interface Achievement {
    id: string;
    displayName: string;
    description: string;
    icon: string;
    isUnlocked: boolean;
}

export default function SteamAchievements({ steamId, rawgId }: SteamAchievementsProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/steam/achievements?steamId=${steamId}&rawgId=${rawgId}`);

                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                setAchievements(data);
            } catch (err) {
                setError('Could not load achievements. Profile might be private or the user might not own the game');
            } finally {
                setLoading(false);
            }
        };

        if (steamId && rawgId) {
            void fetchAchievements();
        }
    }, [steamId, rawgId]);

    if (loading) return <p className="text-gray-400 text-sm animate-pulse">Syncing with Steam...</p>;
    if (error) return <p className="text-gray-500 text-sm italic">{error}</p>;
    if (achievements.length === 0) return null;

    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const progressPercentage = Math.round((unlockedCount / achievements.length) * 100);

    return (
        <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-semibold text-white">
                    Steam Achievements
                </h3>
                <span className="text-gray-400 text-sm">
                    {unlockedCount} / {achievements.length} ({progressPercentage}%)
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 h-2 rounded-full mb-6 overflow-hidden">
                <div
                    className="bg-[#66c0f4] h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Achievement Grid */}
            <div className="flex flex-wrap gap-3">
                {achievements.map((ach) => (
                    <div key={ach.id} className="relative group cursor-help">
                        {/*Icon */}

                        <img
                            src={ach.icon}
                            alt={ach.displayName}
                            className={`w-12 h-12 rounded shadow-sm transition-all duration-200 
                                ${ach.isUnlocked
                                ? 'opacity-100 ring-2 ring-[#66c0f4]/50 group-hover:ring-[#66c0f4]'
                                : 'opacity-40 grayscale group-hover:opacity-60'
                            }
                            `}
                        />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 border border-gray-700 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                            <h4 className="text-sm font-bold text-white mb-1">{ach.displayName}</h4>
                            <p className="text-xs text-gray-400 leading-tight">
                                {ach.description}
                            </p>
                            {!ach.isUnlocked && (
                                <p className="text-[10px] text-red-400 mt-2 font-semibold tracking-wider uppercase">
                                    Locked
                                </p>
                            )}
                        </div>


                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border-4 border-transparent border-t-gray-900 z-50 pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
    );
}