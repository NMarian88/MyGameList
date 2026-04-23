'use client'
import { useState, useEffect,useRef } from 'react';
import {searchGames, getPopularGames, getTopRatedGames, getGameDetails} from '@/lib/rawg-api';
import {searchUsers} from "@/app/actions/user.actions";
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Search, Star,Calendar, Plus, Users, ChevronDown} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Game } from '@/lib/types';
import {User} from  '@/app/actions/user.actions';
type SearchType = 'games' | 'users';
export default function NavBar() {
    const { isSignedIn } = useUser();
    const[searchQuery, setSearchQuery] = useState('');
    const[searchResult, setSearchResult] = useState<Game[] | User[]>([]);
    const[popularGames, setPopularGames] = useState<Game[]>([]);
    const[topRatedGames, setTopRatedGames] = useState<Game[]>([]);
    const[selectedFilter, setSelectedFilter] = useState<'popular' | 'top-rated'>('popular');
    const[currentPage, setCurrentPage] = useState(1);
    const[isSearching, setIsSearching] = useState(false);
    const[isLoading, setIsLoading] = useState(false);
    const[showSearch, setShowSearch] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchType, setSearchType] = useState<'games' | 'users'>('games');
    const searchContainerHide = useRef<HTMLDivElement>(null);
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
                if (searchType === 'games') {
                    const gameData = await searchGames(searchQuery);
                    setSearchResult(gameData.results.slice(0, 5));
                }else{
                    const userData = await searchUsers(searchQuery);
                    setSearchResult(userData.slice(0, 5));
                }

            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 800);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, searchType]);
    useEffect(() => {
        const HandleClick = (event: MouseEvent) => {
            if(
                searchContainerHide.current && !searchContainerHide.current.contains(event.target as Node)
            ){
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', HandleClick);
        return () => {
            document.removeEventListener('mousedown', HandleClick);
        };
    }, []);
    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setIsToastVisible(true);
        setTimeout(() => {
            setIsToastVisible(false);
            setToastMessage(null);
        }, 3000);
    };

    const addToCollection = async (game: Game, status: string = 'wishlist') => {
        try {
            const fullGame = await getGameDetails(game.id);
            const gameResponse = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: fullGame.id,
                    rawg_id: fullGame.id,
                    name: fullGame.name,
                    slug: fullGame.slug || `game-${game.id}`,
                    description: fullGame.description,
                    background_image: fullGame.background_image || null,
                    released: fullGame.released ? new Date(fullGame.released).toISOString().split('T')[0] : null,
                    rating: fullGame.rating || 0,
                    rating_top: fullGame.rating_top || 0,
                    ratings_count: fullGame.ratings_count || 0,
                    metacritic: fullGame.metacritic || null,
                    playtime:fullGame.playtime || 0,
                    platforms: fullGame.platforms || [],
                    genres: fullGame.genres || [],
                    short_screenshots: game.short_screenshots || [],
                    metadata:fullGame
                }),
            });


            if (!gameResponse.ok && gameResponse.status !== 409) {
                console.error('Failed to save game to database');
                showToastMessage('Failed to process game details.');
                return;
            }


            const userGameResponse = await fetch('/api/user/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameId: game.id, status }),
            });

            if (userGameResponse.ok) {
                console.log('Game added to collection!');
                showToastMessage('Game added to collection!');

                window.dispatchEvent(new CustomEvent('gameAdded'));
            } else {
                console.log('Failed to link game');
                showToastMessage('Failed to add game to collection.');
            }
        } catch (error) {
            console.error('Error adding game:', error);
            showToastMessage('Error adding game.');
        }
    };

   return(
       <div>
            <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex  justify-between gap-4">

                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="p-2 bg-linear-to-br from-purple-600 to-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                                <Gamepad2 size={28}/>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">MYGAME<span className="text-purple-400">List</span></h1>
                                <p className="text-gray-400 text-sm font-bold">Track your gaming collection</p>
                            </div>
                        </Link>
                        <div ref={searchContainerHide} className="relative flex-1 max-w-2xl mx-auto">
                            <div className="relative flex">
                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={()=> setShowDropdown(!showDropdown)} className="flex items-center space-x-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-l-xl hover:bg-gray-700 transition">
                                        {searchType === 'games' ? (<Gamepad2 size={18}/>) : (<Users size={18}/>) }
                                        <span className="capitalize">{searchType}</span>
                                        <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showDropdown && (
                                        <div className="absolute top-full left-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                            <button onClick={() =>{
                                                setSearchType('games');
                                                setShowDropdown(false);
                                                setSearchQuery('');
                                                setSearchResult([]);
                                                setShowSearch(false);
                                            }} className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center space-x-2 ${searchType === 'games' ? 'bg-gray-700 text-purple-400' : ''}`}>
                                                <Gamepad2 size={16}/>
                                                <span>Games</span>
                                            </button>
                                            <button onClick={() =>{
                                                setSearchType('users');
                                                setShowDropdown(false);
                                                setSearchQuery('');
                                                setSearchResult([]);
                                                setShowSearch(false);
                                            }} className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center space-x-2 ${searchType === 'users' ? 'bg-gray-700 text-purple-400' : ''}`}>
                                                <Users size={16}/>
                                                <span>Users</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="relative flex-1">
                                    <Search className="absolute  left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => {if(searchQuery.trim() !== '') setShowSearch(true)}}
                                        placeholder={searchType === 'games' ? 'Search for games...' : 'Search for users...'}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 border-l-0 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition placeholder-gray-500"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-4 bottom-1 transform -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}

                                </div>

                            </div>

                            {showSearch  && searchResult.length > 0 &&(
                                <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                                    {searchResult.map((item) => {
                                        if(searchType === 'games'){
                                            const game = item as Game;
                                            return(
                                                <Link href={`/game/${game.id}`} key={game.id}>
                                                    <div key={game.id} className="p-4 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition group">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                {game.background_image && (
                                                                    <div className={"w-12 h-12 rounded-lg overflow-hidden shrink-0"}>
                                                                        <Image src={game.background_image} alt="game.name" className="w-full h-full object-cover" width={256} height={256} />
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
                                                            <button onClick={(e) =>{ e.preventDefault(); addToCollection(game) }} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition opacity-0 group-hover:opacity-100" title="Add to collection">
                                                                <Plus size={20}></Plus>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        }
                                        if(searchType === 'users'){
                                            const user = item as User;
                                            return(
                                                <Link href={`/profile/${user.id}`} key={user.id}>
                                                    <div className="p-4 hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition group">
                                                        <div className="flex items-center space-x-3">
                                                            {user.imageUrl && (
                                                                // Made the user image rounded-full (a circle) to differentiate from games
                                                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                                                                    <Image src={user.imageUrl} alt={user.username} className="w-full h-full object-cover" width={256} height={256} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h3 className="font-semibold">{user.username}</h3>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition font-semibold whitespace-nowrap">
                                Dashboard
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Toast Notification */}
            {isToastVisible && toastMessage && (
                <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-lg max-w-sm">
                        <p className="text-white text-sm">{toastMessage}</p>
                    </div>
                </div>
            )}
       </div>
   )
}