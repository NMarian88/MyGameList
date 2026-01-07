import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default async function DashboardPage() {
    const { userId } = await auth();

    // Redirect if not signed in
    if (!userId) {
        redirect('/sign-in');
    }

    const user = await currentUser();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Navigation */}
            <nav className="border-b border-gray-800">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
                        <span className="text-2xl">🎮</span>
                        <h1 className="text-2xl font-bold">MyGameList</h1>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 mb-8 border border-purple-700/30">
                        <h1 className="text-3xl font-bold mb-2">
                            Welcome back, <span className="text-purple-300">{user?.lastName}</span>! 🎮
                        </h1>
                        <p className="text-gray-300">
                            Your personal game tracking dashboard
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Total Games</h3>
                            <p className="text-3xl font-bold">0</p>
                            <p className="text-gray-400 text-sm mt-2">Start adding games!</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
                            <p className="text-3xl font-bold">0</p>
                            <p className="text-gray-400 text-sm mt-2">What are you playing?</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h3 className="text-gray-400 text-sm mb-2">Avg. Rating</h3>
                            <p className="text-3xl font-bold">-</p>
                            <p className="text-gray-400 text-sm mt-2">Rate your games</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                                ➕ Add New Game
                            </button>
                            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                                🔍 Search Games
                            </button>
                            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                                📊 View Stats
                            </button>
                            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                                ⭐ Rate Games
                            </button>
                        </div>
                    </div>

                    {/* User Info (for debugging) */}
                    <div className="mt-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
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