import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { Gamepad2, Trophy, Star, Users } from 'lucide-react';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex">
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-b from-purple-900/20 to-blue-900/20 p-12 flex-col justify-between border-r border-gray-800">
                <div>
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl group-hover:scale-110 transition-transform ">
                            <Gamepad2 size={28} />
                        </div>
                        <div >
                            <h1 className="text-3xl font-bold tracking-tight">MYGAME<span className="text-purple-400">List</span><sup className="text-xs text-gray-400 ml-1">™</sup></h1>
                            <p className="text-gray-400 text-sm font-bold">Track your gaming collection</p>
                        </div>
                    </Link>
                </div>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Join Our Gaming Community</h2>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-gray-800 hover:border-purple-500/50 transition">
                                <div className="p-2 bg-purple-900/50 rounded-lg">
                                    <Trophy className="text-purple-400" size={24}/>
                                </div>
                                <div>
                                    <h3 className="font font-semibold">Track your progress</h3>
                                    <p className="text-sm text-gray-400">Monitor completion rates and achievements</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-gray-800 hover:border-blue-500/50 transition">
                                <div className="p-2 bg-blue-900/50 rounded-lg">
                                    <Star className="text-blue-400" size={24}/>
                                </div>
                                <div>
                                    <h3 className="font font-semibold">Rate & Review</h3>
                                    <p className="text-sm text-gray-400">Share your thoughts on every game</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-gray-800 hover:border-green-500/50 transition">
                                <div className="p-2 bg-green-900/50 rounded-lg">
                                    <Users className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Connect with gamers</h3>
                                    <p className="text-sm text-gray-400">Discover what your friends are playing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-black/30 rounded-lg">
                            <h1 className="text-2xl font-bold text-purple-400">50k</h1>
                            <h2 className="text-xs text-gray-400">Games Tracked</h2>
                        </div>
                        <div className="text-center p-4 bg-black/30 rounded-lg">
                            <h1 className="text-2xl font-bold text-blue-400">10k</h1>
                            <h2 className="text-xs text-gray-400">Active Users</h2>
                        </div>
                        <div className="text-center p-4 bg-black/30 rounded-lg">
                            <h1 className="text-2xl font-bold text-green-400">1M+</h1>
                            <h2 className="text-xs text-gray-400">Reviews</h2>
                        </div>
                    </div>
                </div>
                <div className="text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} MYGAMEList™. All rights reserved.</p>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-10 text-center">



                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 shadow-2xl shadow-purple-900/20 flex flex-col items-center justify-center">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl mb-4 border border-purple-700/50">
                                <Gamepad2 size={28} />
                            </div>
                            <h2 className="text-2xl fond-bold">Sign in</h2>
                            <p className=" text-gray-400">Enter your credentials to continue</p>
                        </div>
                        <SignIn
                            appearance={{
                                elements: {
                                    rootbox:"w-full",
                                    card: "bg-transparent shadow-none p-0",
                                    headerTitle: "hidden",
                                    headerSubTitle: "hidden",
                                    socialButtonsBlockButton:
                                        "bg-gray-800 border-gray-700 hover:bg-gray-700 text-white",

                                    formFieldLabel: "mb-2",
                                    formFieldInput:
                                        "bg-gray-800 border-gray-700 text-white placeholder-gray-500 " +
                                        "focus:ring-2 focus:ring-purple-500 focus:border-transparent " +
                                        "rounded-lg transition",
                                    formButtonPrimary:
                                        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 " +
                                        "text-white font-semibold py-3 rounded-lg transition-all " +
                                        "shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50",
                                    footerActionLink:
                                        "text-purple-400 hover:text-purple-300 font-medium",
                                    identityPreviewEditButton: "text-purple-400",
                                    footer: "border-t border-gray-800 pt-6",
                                    formFieldAction: "text-purple-400 hover:text-purple-300",
                                },
                                layout:{
                                    shimmer:true,
                                },
                                variables: {
                                    colorPrimary: "#8B5CF6",
                                    colorText: "#ffffff",
                                    colorTextSecondary: "#9CA3AF",
                                    colorBackground: "#111827",
                                    colorInputBackground: "#1F2937",
                                    colorInputText: "#ffffff",
                                    colorNeutral: "#ffffff",
                                },


                            }}
                            routing="path"
                            path="/sign-in"
                            signUpUrl="/sign-up"
                            redirectUrl="/dashboard"
                        />
                        <div className="mt-8 pt-6 border-t border-gray-800">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <Link href="/" className="flex items-center hover:text-gray-300 transition gap-1">
                                    ←  Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}