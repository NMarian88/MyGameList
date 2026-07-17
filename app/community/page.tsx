'use client'
import React, { useState, useEffect } from 'react';
import NavBar from '@/app/components/navbar';
import Link from 'next/link';
import { Users, Search, Plus, Lock, Globe } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    is_private: boolean;
    created_by: string;
    created_at: string;
}

export default function CommunityHubPage() {
    const { userId } = useAuth();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', description: '', is_private: false });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void fetchCommunities();
    }, []);

    const fetchCommunities = async (q?: string) => {
        setIsLoading(true);
        try {
            const url = q ? `/api/community?q=${encodeURIComponent(q)}` : '/api/community';
            const res = await fetch(url);
            const data = await res.json();
            setCommunities(data.communities || []);
        } catch {
            setError('Failed to load communities');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        void fetchCommunities(q || undefined);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError(null);
        try {
            const res = await fetch('/api/community', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to create community');
                return;
            }
            setShowCreateModal(false);
            setCreateForm({ name: '', description: '', is_private: false });
            await fetchCommunities();
        } catch {
            setError('Failed to create community');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-900 to-black text-white">
            <NavBar />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold mb-3">
                        Community <span className="text-purple-400">Hub</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Join communities, share threads, and connect with gamers</p>
                </div>

                <div className="flex items-center gap-4 mb-8 flex-wrap">

                    <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="Search communities..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                        />
                    </div>
                    {userId && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold transition whitespace-nowrap"
                        >
                            <Plus size={18} />
                            Create Community
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                ) : communities.length === 0 ? (
                    <div className="text-center py-24 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No communities found. Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communities.map((c) => (
                            <Link key={c.id} href={`/community/${c.slug}`}>
                                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-purple-500 transition-all hover:scale-[1.02] cursor-pointer h-full flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                                                {c.name[0].toUpperCase()}
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
                                        </div>
                                        {c.is_private ? (
                                            <Lock size={15} className="text-gray-500 mt-1 shrink-0" />
                                        ) : (
                                            <Globe size={15} className="text-gray-500 mt-1 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2">{c.description}</p>
                                    <p className="text-xs text-gray-600 mt-auto">
                                        {c.is_private ? 'Private · Approval required' : 'Public · Open to all'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Community Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-6">Create a Community</h2>
                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Community Name</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. RPG Lovers"
                                    maxLength={50}
                                    required
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="What is this community about?"
                                    rows={3}
                                    maxLength={300}
                                    required
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 resize-none"
                                />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createForm.is_private}
                                    onChange={(e) => setCreateForm(f => ({ ...f, is_private: e.target.checked }))}
                                    className="w-4 h-4 accent-purple-500"
                                />
                                <span className="text-sm text-gray-300">Private community (requires approval to join)</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setError(null); setCreateForm({ name: '', description: '', is_private: false }); }}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 rounded-xl transition font-semibold"
                                >
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
