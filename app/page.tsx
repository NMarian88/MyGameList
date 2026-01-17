'use client'
import {searchGames, getPopularGames, getTopRatedGames} from '@/lib/rawg-api';
import { useState, useEffect,useRef } from 'react';
import NavBar from './components/navbar';
import { Game } from '@/lib/types';

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
    
    return(
       <div className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
            <NavBar />
       </div>
   )
}