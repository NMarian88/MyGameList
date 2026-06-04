
import { notFound } from 'next/navigation';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase';
import NavBar from '../../components/navbar';
import quips from "@/app/dashboard/data/quip.json";
import { calculateGenreStats, calculateGenreStatsByScore } from "@/lib/utils";
import { GenreTrackerWrapper } from "@/app/dashboard/components/GenreTrackerWrapper";
import TabbedPanels from "@/app/dashboard/components/TabbedPanels";

const quip = quips[Math.floor(Math.random() * quips.length)];

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = await params;

    let user;
    try {
        const client = await clerkClient();
        user = await client.users.getUser(userId);
    } catch (error) {
        notFound();
    }

    const username = user.username || user.firstName || 'Unknown User';

    const { data: rawUserGames, error: dbError } = await supabaseServer
        .from('user_games')
        .select(`
            id,
            game_id,
            status,
            completed_at,
            games (
                *
            ),
            reviews (
                review_score,
                review_text,
                reviewed_at
            )
        `)
        .eq('user_id', userId);

    if (dbError) {
        console.error("Database error:", dbError);
    }

    const safeRawGames = rawUserGames || [];

    const userGames = safeRawGames.map(row => {
        const gameData = row.games;
        const game = Array.isArray(gameData) ? gameData[0] : gameData;

        return {
            gameId: row.game_id,
            status: row.status,
            reviews: row.reviews?.map((r: any) => ({
                reviewScore: r.review_score,
                reviewText: r.review_text,
                reviewedAt: r.reviewed_at
            })) || [],
            completedAt: row.completed_at,
            game: game
        };
    });

    const userGameDetails = userGames.map(ug => ug.game).filter(Boolean);

    const stats = {
        totalGames: userGames.length,
        playing: userGames.filter(g => g.status === "playing").length,
        completed: userGames.filter(g => g.status === "completed").length,
        wishlist: userGames.filter(g => g.status === "wishlist").length,
        dropped: userGames.filter(g => g.status === "dropped").length
    };

    const genreStats = calculateGenreStats(userGameDetails);
    const genreStatsByScore = calculateGenreStatsByScore(userGameDetails, userGames);

    const totalGames = stats.totalGames;
    const playingCount = stats.playing;
    const completedCount = stats.completed;

    const allReviews = userGames.flatMap(g => g.reviews || []);
    const reviewScores = allReviews
        .map(r => r.reviewScore)
        .filter((score): score is number => score !== undefined && score !== null);

    const avgRating = reviewScores.length > 0
        ? (reviewScores.reduce((sum, score) => sum + score, 0) / reviewScores.length).toFixed(1)
        : '-';

    const completionRate = totalGames > 0
        ? Math.round((completedCount / totalGames) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
            {/* Navigation */}
            <NavBar />

            {/* Dashboard Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-linear-to-r from-purple-900/50 to-blue-900/50 p-8 mb-8 border border-purple-700/30">
                        <h1 className="text-3xl font-bold mb-2">
                            Welcome to <span className="text-purple-300">{username}'s</span> Profile!
                        </h1>
                        <p className="text-gray-300 italic mt-2">{quip}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:auto-rows-fr">
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Total Games</h3>
                            <p className="text-3xl font-bold">{totalGames}</p>
                            <p className="text-gray-400 text-sm mt-2">{totalGames === 0 ? 'No games yet' : 'In library'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
                            <p className="text-3xl font-bold">{playingCount}</p>
                            <p className="text-gray-400 text-sm mt-2">{playingCount === 0 ? 'Nothing right now' : 'Active games'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700 md:row-span-2 flex flex-col">
                            <GenreTrackerWrapper countStats={genreStats} scoreStats={genreStatsByScore} />
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Avg. Rating</h3>
                            <p className="text-3xl font-bold">{avgRating}</p>
                            <p className="text-gray-400 text-sm mt-2">{avgRating === '-' ? 'No ratings' : 'Average score'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Completion Rate</h3>
                            <p className="text-3xl font-bold">{completionRate}%</p>
                            <p className="text-gray-400 text-sm mt-2">{completedCount} of {totalGames} completed</p>
                        </div>
                    </div>

                    {/* Panel Container (tabbed) */}
                    <div className="mb-8 w-full">
                        <TabbedPanels
                            initialGames={userGames}
                            isReadOnly={true}
                        />
                    </div>

                    {/* User Info (for debugging) */}
                    <div className="mt-2 p-6 bg-gray-900/50 border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4">Profile Info</h3>
                        <div className="text-sm text-gray-300 space-y-2">
                            <p>User ID: {userId}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}