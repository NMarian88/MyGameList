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
                </div>
            </main>
        </div>
    );
}