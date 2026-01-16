'use client'
import { useState, useEffect,useRef } from 'react';
import {searchGames, getPopularGames, getTopRatedGames, type Game } from '@/lib/rawg-api';
import Link from 'next/link';
import { Gamepad2, Search, Star,Calendar, Plus} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export default function HomePage() {
    const[searchQuery, setSearchQuery] = useState('');
    const[searchResult, setSearchResult] = useState<Game[]>([]);
    const[popularGames, setPopularGames] = useState<Game[]>([]);
    const[topRatedGames, setTopRatedGames] = useState<Game[]>([]);
    const[selectedFilter, setSelectedFilter] = useState<'popular' | 'top-rated'>('popular');
    const[currentPage, setCurrentPage] = useState(1);
    const[isSearching, setIsSearching] = useState(false);
    const[isLoading, setIsLoading] = useState(false);
    const[showSearch, setShowSearch] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResult([]);
            setShowSearch(false);
            return;
        }
        setIsSearching(true);
        setShowSearch(true);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchGames(searchQuery);
                setSearchResult(results.results.slice(0, 5));
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

   return(
       <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex  justify-between gap-4">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                                <Gamepad2 size={28}/>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">MYGAME<span className="text-purple-400">List</span></h1>
                                <p className="text-gray-400 text-sm font-bold">Track your gaming collection</p>
                            </div>
                        </Link>
                        <div className="relative flex-1 max-w-2xl mx-auto">
                            <div className="relative">
                                <Search className="absolute  left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for games..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition placeholder-gray-500"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 bottom-1 transform -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {showSearch  && searchResult.length > 0 &&(
                                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                                    {searchResult.map((game) => (
                                        <div key={game.id} className="p-4 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {game.background_image && (
                                                        <div className={"w-12 h-12 rounded-lg overflow-hidden shrink-0"}>
                                                            <img src={game.background_image} alt="game.name" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold">{game.name}</h3>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                                                            <span className="flex items-center">
                                                                <Star size={12} className="mr-1 text-yellow-500"></Star>
                                                                {game.metacritic}
                                                            </span>
                                                            {game.released && (
                                                                <span className="flex items-center">
                                                                    <Calendar size={12} className="mr-1"></Calendar>
                                                                    {new Date(game.released).getFullYear()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition opacity-0 group-hover:opacity-100" title="Add to collection">
                                                    <Plus size={20}></Plus>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition font-semibold whitespace-nowrap">
                                Dashboard
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </nav>
       </div>
   )
}