import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import NavBar from '../components/navbar';
import { calculateGenreStats, calculateGenreStatsByScore } from '@/lib/utils';
import { GenreTrackerWrapper } from './components/GenreTrackerWrapper';
import TabbedPanels from './components/TabbedPanels';
import quips from './data/quip.json';

const quip = quips[Math.floor(Math.random() * quips.length)];

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const user = await currentUser();

    const steamId = user?.publicMetadata?.steamId as string | undefined;
    const displayName = user?.firstName ?? user?.username ?? 'Player';

    const { data: rawUserGames, error: dbError } = await supabaseServer
        .from('user_games')
        .select(`
            id,
            game_id,
            status,
            completed_at,
            games (*),
            reviews (review_score, review_text, reviewed_at)
        `)
        .eq('user_id', userId);

    if (dbError) {
        console.error("Database error:", dbError);
    }

    const safeRawGames = rawUserGames || [];
    const combinedGames = safeRawGames.map(row => {
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

    const userGameDetails = combinedGames.map(ug => ug.game).filter(Boolean);

    const stats = {
        totalGames: combinedGames.length,
        playing: combinedGames.filter(g => g.status === "playing").length,
        completed: combinedGames.filter(g => g.status === "completed").length,
        wishlist: combinedGames.filter(g => g.status === "wishlist").length,
        dropped: combinedGames.filter(g => g.status === "dropped").length
    };

    const genreStats = calculateGenreStats(userGameDetails);
    const genreStatsByScore = calculateGenreStatsByScore(userGameDetails, combinedGames);

    const totalGames = stats.totalGames;
    const playingCount = stats.playing;
    const completedCount = stats.completed;


    const allReviews = combinedGames.flatMap(g => g.reviews || []);
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
            <NavBar />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-linear-to-r from-purple-900/50 to-blue-900/50 p-8 mb-8 border border-purple-700/30">
                        <h1 className="text-3xl font-bold mb-2">
                            Welcome back, <span className="text-purple-300">{displayName}</span>!
                        </h1>
                        <p className="text-gray-300 italic mt-2">{quip}</p>
                    </div>
                    {steamId ? (
                        <p></p>
                    ) : (
                        <a
                            href="/api/steam/login"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#171a21] hover:bg-[#2a475e] text-white font-medium rounded shadow transition-colors border border-[#66c0f4]/30"
                        >

                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M11.979 0C5.353 0 0 5.373 0 12c0 2.247.625 4.35 1.746 6.19l5.248-7.391a3.585 3.585 0 01-1.391-2.736c0-1.986 1.616-3.602 3.602-3.602 1.986 0 3.602 1.616 3.602 3.602 0 1.696-1.178 3.12-2.766 3.496l-3.327 4.686c.646.128 1.314.195 2.001.195 6.626 0 12-5.373 12-12S18.605 0 11.979 0zm-2.775 10.803c0-1.071.872-1.943 1.943-1.943 1.071 0 1.943.872 1.943 1.943 0 1.071-.872 1.943-1.943 1.943-1.071 0-1.943-.872-1.943-1.943zm-2.164 4.542l2.366-3.332a3.565 3.565 0 001.815.492l1.644 4.743c-1.378-.344-2.585-1.106-3.486-2.146-.076-.089-.15-.18-.223-.272l-2.116-.547z" />
                            </svg>
                            Link Steam Account
                        </a>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:auto-rows-fr">
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Total Games</h3>
                            <p className="text-3xl font-bold">{totalGames}</p>
                            <p className="text-gray-400 text-sm mt-2">{totalGames === 0 ? 'Start adding games!' : 'In your library'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
                            <p className="text-3xl font-bold">{playingCount}</p>
                            <p className="text-gray-400 text-sm mt-2">{playingCount === 0 ? 'What are you playing?' : 'Active games'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700 md:row-span-2 flex flex-col">
                            <GenreTrackerWrapper countStats={genreStats} scoreStats={genreStatsByScore} />
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Avg. Rating</h3>
                            <p className="text-3xl font-bold">{avgRating}</p>
                            <p className="text-gray-400 text-sm mt-2">{avgRating === '-' ? 'Rate your games' : 'Your average score'}</p>
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
                            initialGames={combinedGames}
                            isReadOnly={false}
                        />
                    </div>
                    {/* User Info (for debugging) */}
                    <div className="mt-2 p-6 bg-gray-900/50  border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4">Your Profile Info</h3>
                        <div className="text-sm text-gray-300 space-y-2">
                            <p>User ID: {userId}</p>

                            {/* Check if they have a Steam ID, and display it! */}
                            {steamId ? (
                                <p className="text-green-400">Linked Steam ID: {steamId}</p>
                            ) : (
                                <p className="text-gray-500 italic">No Steam account linked yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}