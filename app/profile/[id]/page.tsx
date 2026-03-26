import Image from 'next/image';
import { notFound } from 'next/navigation';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase';
import NavBar from '../../components/navbar';
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


    const { data: userGames, error: dbError } = await supabaseServer
        .from('user_games')
        .select(`
            id,
            status,
            games (
                name,
                background_image,
                genres,
                metacritic
            )
        `)
        .eq('user_id', userId);

    if (dbError) {
        console.error("Failed to load games:", dbError);

    }

    return (

        <div className="in-h-screen bg-[#0a0a0f] text-slate-100 overflow-x-hidden">
            <NavBar/>

            <div className="flex items-center space-x-6 p-6 bg-gray-800 rounded-2xl border border-gray-700">
                <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-purple-500">
                    <Image
                        src={user.imageUrl}
                        alt={username}
                        width={256}
                        height={256}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{username}'s Profile</h1>
                    <p className="text-gray-400">
                        {userGames?.length || 0} Games in Collection
                    </p>
                </div>
            </div>


            <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">Collection</h2>

                {userGames?.length === 0 ? (
                    <p className="text-gray-400">This user hasn't added any games yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {userGames?.map((item) => {
                            const gameData = item.games;
                            const game = Array.isArray(gameData) ? gameData[0] : gameData;
                            if (!game) return null;

                            return (
                                <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                                    {game.background_image && (
                                        <div className="aspect-video w-full relative">
                                            <Image
                                                src={game.background_image}
                                                alt={game.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg text-white truncate">{game.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">Status: {item.status}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}