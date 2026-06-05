'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function AdBanner() {
    const { isLoaded, has } = useAuth();
    if (!isLoaded) return null;
    const isPro = has({ plan: 'premium' });
    if (isPro) return null;

    return (
        <div className="w-full max-w-4xl mx-auto my-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">

            <div className="absolute top-1 right-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Advertisement</span>
            </div>


            <div className="w-full h-[90px] flex items-center justify-center bg-slate-800/50 rounded-lg border border-slate-700/50 mb-2">
                <span className="text-slate-500">Ad Space (728x90)</span>
            </div>


            <Link
                href="/pricing"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
                Remove ads with Premium 👑
            </Link>
        </div>
    );
}