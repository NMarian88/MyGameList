import { notFound } from 'next/navigation';
import {getGameImages, getGameDetails} from "@/lib/rawg-api";
import {auth} from "@clerk/nextjs/server";
import {UserButton} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import NavBar from '../../components/navbar';
import {Calendar, Star} from "lucide-react";
import AddToCollectionButton from '../../components/AddToCollection';
import {useIntersection} from "next/dist/client/use-intersection";
interface GameProps {
    params: {
        id: string;
    };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const gameId = parseInt(id);
    if(isNaN(gameId)) {
        notFound();
    }

    try{
        const game = await getGameDetails(gameId);
        const screenshots = await getGameImages(gameId);

        const {userId} = await auth();
        return(
            <div className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
                <NavBar />
                <div className="relative h-[60vh] min-h-125 w-full">
                    {game.background_image && (
                        <div className="absolute inset-0">
                            <img src={game.background_image} alt={game.name} className="w-full h-full object-cover object-top"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
                        </div>

                    )}
                    <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-12">
                        <div className="flex flex-col justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-bold mb-4">{game.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    {game.released && (
                                        <div className="flex items-center gap-1 text-gray-300">
                                            <Calendar size={16}/>
                                            {new Date(game.released).getFullYear()}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Star size={16}/>
                                        {game.rating ? game.rating.toFixed(1) : 'N/A'}
                                        <span className="text-gray-400 text-xs">/5</span>
                                    </div>
                                    {game.metacritic && (
                                        <div className={`px-2 py-1 rounded ${
                                            game.metacritic >= 75 ? 'bg-green-500/20 text-green-400' :
                                                game.metacritic >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                                                    'bg-red-500/20 text-red-400'
                                        }`}>
                                            Metacritic: {game.metacritic}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <AddToCollectionButton
                                gameId={game.id}
                                gameName={game.name}
                                userId={userId}
                                initialStatus="wishlist"
                            />
                        </div>
                    </div>
                </div>
                <main className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-8">
                            {game.description && (
                                <div className="bg-gray-800/30 backdrop-blur-2xl border border-gray-700 p-6">
                                    <h2 className="text-2xl font-bold mb-4">About</h2>
                                    <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: game.description }}></div>
                                </div>
                            )}
                            {screenshots.results && screenshots.results.length > 0 && (
                                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                                    <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {screenshots.results.slice(0, 6).map((screenshot: any)=>(
                                            <Link key={screenshot.id} href={screenshot.image} target="_blank" rel="noopener noreferrer" className="group relative aspect-video overflow-hidden rounded-lg border border-gray-700 hover:border-purple-500 transition">
                                                <img src={screenshot.image} alt={`${game.name} screenshot`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        )


    }catch(err){
        console.error(err);
    }
}
