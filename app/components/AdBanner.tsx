'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function AdBanner() {
    const { isLoaded, has } = useAuth();


    const adLoaded = useRef(false);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') return;

        if (!adLoaded.current) {
            try {

                (window.adsbygoogle = window.adsbygoogle || []).push({});


                adLoaded.current = true;
            } catch (err) {
                console.error('AdSense error:', err);
            }
        }
    }, []);

    if (!isLoaded) return null;
    const isPro = has({ plan: 'premium' });
    if (isPro) return null;

    return (
        <div className="w-full max-w-4xl mx-auto my-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">

            <div className="absolute top-1 right-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Advertisement</span>
            </div>

            <div className="w-full flex justify-center mb-2 overflow-hidden min-h-[90px]">

                {process.env.NODE_ENV === 'development' ? (
                    <div className="w-full max-w-[728px] h-[90px] bg-slate-800 flex items-center justify-center border border-dashed border-slate-600 rounded">
                        <span className="text-slate-500 font-mono text-sm">AdSense Placeholder (728x90)</span>
                    </div>
                ) : (
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'block', width: '100%' }}
                        data-ad-client="ca-pub-2023886611050610"
                        data-ad-slot="8683274562"
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    />
                )}
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