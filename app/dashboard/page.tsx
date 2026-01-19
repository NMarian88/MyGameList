import { auth, currentUser } from '@clerk/nextjs/server';
import { UserGameData } from '@/lib/types';
import { redirect } from 'next/navigation';
import { calculateGenreStats, calculateGenreStatsByScore } from '@/lib/utils';
import { GenreTrackerWrapper } from './components/GenreTrackerWrapper';
import TabbedPanels from './components/TabbedPanels';
import quips from './data/quip.json';
import { headers } from 'next/headers';
import NavBar from '../components/navbar';

const quip = quips[Math.floor(Math.random() * quips.length)];

export default async function DashboardPage() {
    const { userId } = await auth();

    // Redirect if not signed in
    if (!userId) {
        redirect('/sign-in');
    }

    // Fetch user data from API
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    const response = await fetch(`${protocol}://${host}/api/user/games`, {
        headers: {
            Cookie: headersList.get('cookie') || '',
        },
        cache: 'no-store',
    });

    let userGames: UserGameData[] = [];
    let stats = {
        totalGames: 0,
        playing: 0,
        completed: 0,
        wishlist: 0,
        dropped: 0
    };

    if (response.ok) {
        const data = await response.json();
        userGames = data.games || [];
        stats = data.stats || stats;
    }

    // Get users display name
    const user = await currentUser();
    const displayName =
    user?.firstName ??
    user?.lastName ??
    user?.fullName ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    'Player';

    // Fetch game details from API for each user game
    const userGameDetails = await Promise.all(
        userGames.map(async (ug) => {
            try {
                const gameResponse = await fetch(`${protocol}://${host}/api/games?id=${ug.gameId}`, {
                    headers: {
                        Cookie: headersList.get('cookie') || '',
                    },
                    cache: 'no-store',
                });
                if (gameResponse.ok) {
                    return await gameResponse.json();
                }
                return null;
            } catch (error) {
                console.error(`Failed to fetch game ${ug.gameId}:`, error);
                return null;
            }
        })
    ).then(games => games.filter(Boolean));

    const genreStats = calculateGenreStats(userGameDetails);
    const genreStatsByScore = calculateGenreStatsByScore(userGameDetails, userGames);

    // Get stats from user data
    const totalGames = stats.totalGames || 0;
    const playingCount = stats.playing || 0;
    const completedCount = stats.completed || 0;
    
    // Calculate average rating from all reviews
    const allReviews = userGames.flatMap(g => g.reviews || []);
    const reviewScores = allReviews
        .map(r => r.reviewScore)
        .filter((score): score is number => score !== undefined && score !== null);
    const avgRating = reviewScores.length > 0 
        ? (reviewScores.reduce((sum, score) => sum + score, 0) / reviewScores.length).toFixed(1)
        : '-';
    
    // Calculate completion rate (completed / total)
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
                    <div className="bg-linear-to-r from-purple-900/50 to-blue-900/50  p-8 mb-8 border border-purple-700/30">
                        <h1 className="text-3xl font-bold mb-2">
                            Welcome back, <span className="text-purple-300">{displayName}</span>!
                        </h1>
                        <p className="text-gray-300 italic mt-2">{quip}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 md:auto-rows-fr">
                        <div className="bg-gray-800/50 backdrop-blur-sm  p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Total Games</h3>
                            <p className="text-3xl font-bold">{totalGames}</p>
                            <p className="text-gray-400 text-sm mt-2">{totalGames === 0 ? 'Start adding games!' : 'In your library'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm  p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
                            <p className="text-3xl font-bold">{playingCount}</p>
                            <p className="text-gray-400 text-sm mt-2">{playingCount === 0 ? 'What are you playing?' : 'Active games'}</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm  p-6 border border-gray-700 md:row-span-2 flex flex-col">
                            <GenreTrackerWrapper countStats={genreStats} scoreStats={genreStatsByScore} />
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm  p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Avg. Rating</h3>
                            <p className="text-3xl font-bold">{avgRating}</p>
                            <p className="text-gray-400 text-sm mt-2">{avgRating === '-' ? 'Rate your games' : 'Your average score'}</p>
                        </div>                        
                        <div className="bg-gray-800/50 backdrop-blur-sm  p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Completion Rate</h3>
                            <p className="text-3xl font-bold">{completionRate}%</p>
                            <p className="text-gray-400 text-sm mt-2">{completedCount} of {totalGames} completed</p>
                        </div>
                    </div>

                    {/* Panel Container (tabbed) */}
                    <div className="mb-8 w-full">
                        <TabbedPanels />
                    </div>

                    {/* User Info (for debugging) */}
                    <div className="mt-2 p-6 bg-gray-900/50  border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4">Your Profile Info</h3>
                        <div className="text-sm text-gray-300 space-y-2">
                            <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
                            <p>User ID: {userId}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}