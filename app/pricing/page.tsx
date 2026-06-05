import { PricingTable } from '@clerk/nextjs';
import NavBar from '@/app/components/navbar';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
            <NavBar />
            <main className="container mx-auto px-4 py-20 flex flex-col items-center">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Upgrade to Premium
                </h1>
                <p className="text-slate-400 mb-12">Unlock advanced gaming analytics and an ad-free experience.</p>

                {/* This single component renders your plans and handles Stripe checkouts! */}
                <div className="w-full max-w-4xl">
                    <PricingTable />
                </div>
            </main>
        </div>
    );
}