'use client';

import { useAuth } from '@clerk/nextjs';
import { Crown } from 'lucide-react';
import Link from 'next/link';

export default function PremiumBadge() {
    const { has, isLoaded, userId } = useAuth();
    if (!isLoaded || !userId) return null;
    const isPro = has({ plan: 'premium' });
    return isPro ? (
        <div
            className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 shadow-sm cursor-default"
            title="Premium Member"
        >
            <Crown size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold tracking-wide">PRO</span>
        </div>
    ) : (
        <Link
            href="/pricing"
            className="text-sm font-bold text-white bg-linear-to-r from-purple-600 to-blue-600 px-4 py-1.5 rounded-full hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
        >
            Upgrade
        </Link>
    );
}