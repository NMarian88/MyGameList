import { notFound } from 'next/navigation';
import { getGameImages, getGameDetails } from "@/lib/rawg-api";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import NavBar from '../../components/navbar';
import { Calendar, Globe, Star, Clock, Users, Trophy, Gamepad2, ChevronRight, Play } from "lucide-react";
import AddToCollectionButton from '../../components/AddToCollection';
import GameViewTracker from '../../components/GameViewTracker';


const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400';
    if (score >= 60) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-red-400';
};

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const gameId = parseInt(id);
    if (isNaN(gameId)) {
        notFound();
    }

    try {
        const game = await getGameDetails(gameId);
        const screenshots = await getGameImages(gameId);
        const { userId } = await auth();


        return (
            <div className="min-h-screen bg-[#0a0a0f] text-slate-100 overflow-x-hidden">
                <GameViewTracker gameId={game.id} gameName={game.name} />
                <NavBar />


                <div className="fixed inset-0 z-0">
                    {game.background_image ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-3xl opacity-30 scale-110"
                                style={{ backgroundImage: `url(${game.background_image})` }}
                            />
                            <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]" />
                            <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0f] via-transparent to-[#0a0a0f]/50" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-900/20 via-[#0a0a0f] to-purple-900/20" />
                    )}
                </div>

                <div className="relative z-10 pt-20 pb-12">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                            <div className="lg:col-span-4 xl:col-span-3">
                                <div className="relative aspect-3/4 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group">
                                    {game.background_image ? (
                                        <Image
                                            src={game.background_image}
                                            alt={game.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            priority
                                            sizes="(max-width: 768px) 100vw, 400px"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                            <Gamepad2 size={64} className="text-slate-600" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </div>
                            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                                    <ChevronRight size={16} />
                                    <span className="text-slate-300 truncate">{game.name}</span>
                                </div>

                                <div>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight mb-4">
                                        {game.name}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        {game.released && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                                <Calendar size={14} className="text-indigo-400" />
                                                <span>{new Date(game.released).getFullYear()}</span>
                                            </div>
                                        )}

                                        {game.genres?.[0] && (
                                            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                                                {game.genres[0].name}
                                            </div>
                                        )}

                                        {game.playtime && game.playtime > 0 && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                                <Clock size={14} className="text-emerald-400" />
                                                <span>{game.playtime}h avg</span>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <div className="flex flex-wrap items-center gap-6">
                                    {game.rating && game.rating > 0 && (
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-16 h-16">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="rgba(255,255,255,0.1)"
                                                        strokeWidth="3"
                                                    />
                                                    <path
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="url(#ratingGradient)"
                                                        strokeWidth="3"
                                                        strokeDasharray={`${game.rating * 20}, 100`}
                                                        strokeLinecap="round"
                                                        className="transition-all duration-1000"
                                                    />
                                                    <defs>
                                                        <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#fbbf24" />
                                                            <stop offset="100%" stopColor="#f59e0b" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-amber-400">
                                                        {game.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            fill={i < Math.round(game.rating ?? 0) ? "currentColor" : "none"}
                                                            className={i < Math.round(game.rating ?? 0) ? "" : "text-slate-600"}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-500">{game.ratings_count?.toLocaleString()} ratings</p>
                                            </div>
                                        </div>
                                    )}

                                    {game.metacritic && (
                                        <div className={`relative px-6 py-3 rounded-xl bg-linear-to-br ${getScoreColor(game.metacritic)} bg-opacity-20 border border-white/10`}>
                                            <div className="flex items-center gap-2">
                                                <Trophy size={20} className="text-white" />
                                                <div>
                                                    <p className="text-2xl font-bold text-white leading-none">{game.metacritic}</p>
                                                    <p className="text-xs text-white/80 uppercase tracking-wider">Metacritic</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>


                                <div className="flex flex-wrap gap-4 pt-4">
                                    <AddToCollectionButton
                                        game={game}
                                        userId={userId}
                                        initialStatus="wishlist"
                                    />

                                    {game.website && (
                                        <Link
                                            href={game.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
                                        >
                                            <Globe size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                            <span>Official Site</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <main className="relative z-10 container mx-auto px-4 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {game.description && (
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <span className="w-1 h-8 bg-indigo-500 rounded-full" />
                                        About
                                    </h2>
                                    <div
                                        className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed [&_a]:text-indigo-400 [&_a]:hover:text-indigo-300 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1"
                                        dangerouslySetInnerHTML={{ __html: game.description }}
                                    />
                                </section>
                            )}
                            {screenshots.results && screenshots.results.length > 0 && (
                                <section className="space-y-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <span className="w-1 h-8 bg-purple-500 rounded-full" />
                                        Media
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {screenshots.results.slice(0, 6).map((screenshot: any, index: number) => (
                                            <Link
                                                key={screenshot.id}
                                                href={screenshot.image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-800/50 hover:border-indigo-500/50 transition-all duration-300"
                                            >
                                                <Image
                                                    src={screenshot.image}
                                                    alt={`${game.name} screenshot ${index + 1}`}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                    <Play size={32} className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Gamepad2 size={20} className="text-indigo-400" />
                                        Details
                                    </h3>

                                    {game.platforms && game.platforms.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Platforms</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {game.platforms.map((p: any) => (
                                                    <span
                                                        key={p.platform.id}
                                                        className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-sm text-slate-300 transition-colors cursor-default"
                                                    >
                                                        {p.platform.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {game.genres && game.genres.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Genres</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {game.genres.map((genre: any) => (
                                                    <span
                                                        key={genre.id}
                                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-sm transition-colors"
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {game.developers && game.developers.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Developers</h4>
                                            <div className="space-y-2">
                                                {game.developers.map((dev: any) => (
                                                    <div key={dev.id} className="text-sm text-slate-300 hover:text-white transition-colors">
                                                        {dev.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {game.publishers && game.publishers.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Publishers</h4>
                                            <div className="space-y-2">
                                                {game.publishers.map((pub: any) => (
                                                    <div key={pub.id} className="text-sm text-slate-300">
                                                        {pub.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Users size={20} className="text-purple-400" />
                                        Statistics
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-slate-400 text-sm">Release Date</span>
                                            <span className="text-slate-200 font-medium">
                                                {game.released ? new Date(game.released).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : 'TBA'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-slate-400 text-sm">Average Playtime</span>
                                            <span className="text-emerald-400 font-medium">
                                                {game.playtime && game.playtime > 0 ? `${game.playtime} hours` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-slate-400 text-sm">Total Ratings</span>
                                            <span className="text-slate-200 font-medium">
                                                {game.ratings_count?.toLocaleString() || '0'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-slate-400 text-sm">Metacritic</span>
                                            <span className={`font-bold ${game.metacritic ? 'text-white' : 'text-slate-500'}`}>
                                                {game.metacritic || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );

    } catch (err) {
        console.error(err);
        notFound();
    }
}