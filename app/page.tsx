'use client'
import {searchGames, getPopularGames, getTopRatedGames} from '@/lib/rawg-api';

import { useState, useEffect,useRef } from 'react';
import NavBar from './components/navbar';
import { Gamepad2, Search, Star,Calendar, Plus,Users,ArrowLeft,ArrowRight} from 'lucide-react';
import { UserButton , useAuth} from '@clerk/nextjs';
import { Game } from '@/lib/types';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isToastVisible, setIsToastVisible] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const {userId} = useAuth();
    useEffect(() => {
        fetchGames();
    }, [selectedFilter,currentPage]);
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
    const fetchGames = async () => {
        setIsLoading(true);
        try {
            if (selectedFilter === 'popular') {
                const results = await getPopularGames(currentPage);
                setPopularGames(results.results);
            }else{
                const results = await getTopRatedGames(currentPage);
                setTopRatedGames(results.results);
            }
        }catch(error) {
            console.error('Search failed:', error);
        }finally{
            setIsLoading(false);
        }
    };
    const PrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    const NextPage = () => {
        setCurrentPage(currentPage + 1);
    }
    const displayedGames = selectedFilter === 'popular' ? popularGames : topRatedGames;

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
        setTimeout(() => {
            setIsToastVisible(false);
            setToastMessage(null);
        }, 3000); // Hide after 3 seconds
    };
    const addToCollection = async (gameId: number, status: string = 'wishlist') => {
        try {
            const response = await fetch('/api/user/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameId, status }),
            });
            if (response.ok) {
                console.log('Game added to collection!');
                showToastMessage('Game added to collection!');
                window.dispatchEvent(new CustomEvent('gameAdded'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                console.log('Failed to add game');
                showToastMessage('Failed to add game!');
            }
        } catch (error) {
            console.error('Error adding game:', error);
            console.log('Error adding game');
        }
    };
    return(
       <div className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
            <NavBar />
           <main className="container mx-auto px-4 py-8">
               <div className="mb-12 text-center">
                   <h1 className="text-4xl font-bold mb-4">
                       Discover And Track Your Favourite <span className="text-purple-400">Games</span>
                   </h1>
                   <p className="text-xl text-gray-300 max-w-3xl mx-auto font-semibold">
                       Browse thousands of games and add them to your personal collection
                   </p>
               </div>
               <div className="flex items-center justify-between mb-8 gap-4">
                   <div className="inline-flex rounded-lg bg-gray-800 p-1">
                       <button onClick={() => {
                           setSelectedFilter('popular');
                           setCurrentPage(1);
                       }}
                               className={`px-6 py-3 rounded-lg transition fond-semibold ${selectedFilter === 'popular' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'hover:bg-gray-700'}`}>
                           <div className="flex items-center space-x-2">
                               <Users size={20}></Users>
                               <span>Most Popular</span>
                           </div>
                       </button>
                       <button onClick={() => {
                           setSelectedFilter('top-rated');
                           setCurrentPage(1);
                       }}
                               className={`px-6 py-3 rounded-lg transition fond-semibold ${selectedFilter === 'top-rated' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'hover:bg-gray-700'}`}>
                           <div className="flex items-center space-x-2">
                               <Star size={20}></Star>
                               <span>Top-Rated</span>
                           </div>
                       </button>
                   </div>
                   <div className="flex items-center space-x-4">
                       <button onClick={PrevPage} disabled={currentPage === 1 || isLoading}
                               className={`p-2 rounded-lg transition ${currentPage === 1 || isLoading ? `bg-gray-800 text-gray-600 cursor-not-allowed` : `bg-gray-800 hover:bg-gray-700`}`}>
                           <ArrowLeft size={20}/>
                       </button>
                       <span className="text-gray-300 font-medium">
                           Page <span className="text-purple-400">{currentPage}</span>
                       </span>
                       <button onClick={NextPage} disabled={isLoading}
                               className={`p-2 rounded-lg transition ${isLoading ? `bg-gray-800 text-gray-600 cursor-not-allowed` : `bg-gray-800 hover:bg-gray-700`}`}>
                           <ArrowRight size={20}/>
                       </button>
                   </div>
               </div>
               {isLoading ? (
                   <div className="flex items-center justify-center h-96">
                       <div className="text-center">
                           <div
                               className="w-16 h-16 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                           <p className="text-gray-400">Loading Games</p>
                       </div>
                   </div>
               ) : (
                   <>
                       <div className="relative">
                           <div ref={scrollContainerRef}
                                className="flex overflow-x-auto scrollbar-hide space-x-6 pb-6 scroll-smooth"
                                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                               <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 min-w-full">
                                   {displayedGames.map((game) => (
                                       <div key={game.id}
                                            className="bg-gray-800 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden group hover:border-purple-500 transition-all hover:scale-[1.02]">
                                           <div className="relative h-48 overflow:hidden">
                                               {game.background_image ? (
                                                   <img src={game.background_image} alt={game.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                               ) : (
                                                   <div
                                                       className="bg-linear-to-br from-purple-800 to-blue-900 items-center justify-center">No
                                                       background image found</div>
                                               )}
                                               <div
                                                   className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ">
                                                   <button
                                                       onClick={() => addToCollection(game.id)}
                                                       className="absolute bottom-0 right-0 m-2 p-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-lg transition transform:scale-110">
                                                       <Plus size={20}/>
                                                   </button>
                                               </div>
                                           </div>
                                           <div className="p-4">
                                               <h3 className="font-bold text-lg mb-2 truncate">{game.name}</h3>
                                               <div className="flex items-center justify-between mb-2 text-sm">
                                                   <div className="flex items-center space-x-2">
                                                       <div className="flex items-center ">
                                                           <Star size={20} className="text-yellow-400 mr-1"/>
                                                           <span>{game.rating.toFixed(1)}</span>
                                                       </div>
                                                       {game.metacritic && (
                                                           <div
                                                               className={`px-2 py-1 rounded ${game.metacritic >= 75 ? "bg-green-800 text-green-400" : game.metacritic >= 50 ? `bg-yellow-500/50 text-yellow-400` : `bg-red-600/50 text-red-400`}`}>
                                                               {game.metacritic}
                                                           </div>
                                                       )}
                                                   </div>
                                                   {game.released && (
                                                       <span
                                                           className="text-gray-400">{new Date(game.released).getFullYear()}</span>
                                                   )}
                                               </div>
                                               <div className="flex flex-wrap gap-2">
                                                   {game.genres.slice(0, 2).map((genre) => (
                                                       <span key={genre.id}
                                                             className="px-2 py-1 text-xs text-gray-300">
                                                            {genre.name}
                                                        </span>
                                                   ))}
                                               </div>
                                               {game.platforms.slice(0, 3).map((platform, index) => (
                                                   <span key={index} className="px-2 py-1 text-xs text-gray-300">
                                                        {platform.platform.name}
                                                    </span>
                                               ))}

                                           </div>
                                       </div>

                                   ))}
                               </div>
                           </div>
                       </div>
                   </>
               )
               }
           </main>
           <footer className="border-t border-gray-800 mt-16 py-8">
               <div className="container mx-auto px-4 text-gray-500 text-sm">
                   <p>{new Date().getFullYear()} MYGAMEList™. All rights reserved.</p>
                   <p className="mt-2">Powered by RAWG Video Games Database API</p>
               </div>
           </footer>
           {isToastVisible && toastMessage && (
               <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
                   <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-lg max-w-sm ">
                       <p className="text-white text-sm">{toastMessage}</p>
                   </div>
               </div>
           )}
       </div>
    )

}
