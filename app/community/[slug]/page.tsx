'use client'
import { useState, useEffect } from 'react';
import NavBar from '@/app/components/navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, Lock, Globe, Plus, MessageSquare, ArrowLeft, Bell, Check, X, Trash2, Ban, UserMinus, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    is_private: boolean;
    created_by: string;
}

interface Thread {
    id: string;
    title: string;
    content: string;
    user_id: string;
    author_name: string;
    author_image: string | null;
    created_at: string;
}

interface Membership {
    role: string;
    status: string;
}

interface JoinRequest {
    userId: string;
    username: string;
    imageUrl: string | null;
    requestedAt: string;
}

interface Member {
    userId: string;
    username: string;
    imageUrl: string | null;
    role: string;
    joinedAt: string;
}

export default function CommunityPage() {
    const { slug } = useParams<{ slug: string }>();
    const { userId } = useAuth();
    const [community, setCommunity] = useState<Community | null>(null);
    const [memberCount, setMemberCount] = useState(0);
    const [membership, setMembership] = useState<Membership | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewThread, setShowNewThread] = useState(false);
    const [threadForm, setThreadForm] = useState({ title: '', content: '' });
    const [isPosting, setIsPosting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [threadError, setThreadError] = useState<string | null>(null);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [showRequests, setShowRequests] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [bannedMembers, setBannedMembers] = useState<Member[]>([]);
    const [showMembers, setShowMembers] = useState(false);

    const isOwner = !!community && community.created_by === userId;

    useEffect(() => {
        if (!slug) return;
        fetchCommunity();
        fetchThreads();
    }, [slug]);

    useEffect(() => {
        if (isOwner) {
            fetchJoinRequests();
            fetchMembers();
        }
    }, [isOwner]);

    const fetchCommunity = async () => {
        try {
            const res = await fetch(`/api/community/${slug}`);
            if (!res.ok) return;
            const data = await res.json();
            setCommunity(data.community);
            setMemberCount(data.memberCount);
            setMembership(data.membership);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJoinRequests = async () => {
        try {
            const res = await fetch(`/api/community/${slug}/members`);
            if (res.ok) {
                const data = await res.json();
                setJoinRequests(data.requests || []);
            }
        } catch {}
    };

    const handleRequest = async (targetUserId: string, action: 'approve' | 'reject') => {
        await fetch(`/api/community/${slug}/members`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: targetUserId, action }),
        });
        setJoinRequests(rs => rs.filter(r => r.userId !== targetUserId));
        if (action === 'approve') {
            setMemberCount(c => c + 1);
            fetchMembers();
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/community/${slug}/members?type=members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
                setBannedMembers(data.banned || []);
            }
        } catch {}
    };

    const handleModerate = async (targetUserId: string, action: 'kick' | 'ban' | 'unban') => {
        const res = await fetch(`/api/community/${slug}/members`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: targetUserId, action }),
        });
        if (!res.ok) return;

        if (action === 'kick') {
            setMembers(ms => ms.filter(m => m.userId !== targetUserId));
            setMemberCount(c => Math.max(0, c - 1));
        } else if (action === 'ban') {
            const banned = members.find(m => m.userId === targetUserId);
            setMembers(ms => ms.filter(m => m.userId !== targetUserId));
            if (banned) {
                setBannedMembers(bs =>
                    bs.some(b => b.userId === targetUserId) ? bs : [...bs, banned]
                );
            }
            setMemberCount(c => Math.max(0, c - 1));
        } else if (action === 'unban') {
            setBannedMembers(bs => bs.filter(m => m.userId !== targetUserId));
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        if (!confirm('Delete this thread? This cannot be undone.')) return;
        const res = await fetch(`/api/community/${slug}/threads/${threadId}`, { method: 'DELETE' });
        if (res.ok) {
            setThreads(ts => ts.filter(t => t.id !== threadId));
        }
    };

    const fetchThreads = async () => {
        try {
            const res = await fetch(`/api/community/${slug}/threads`);
            const data = await res.json();
            setThreads(data.threads || []);
        } catch {}
    };

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            const res = await fetch(`/api/community/${slug}/join`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setMembership({ role: 'member', status: data.status });
                if (data.status === 'active') setMemberCount(c => c + 1);
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeave = async () => {
        await fetch(`/api/community/${slug}/leave`, { method: 'POST' });
        setMembership(null);
        setMemberCount(c => Math.max(0, c - 1));
    };

    const handlePostThread = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        setThreadError(null);
        try {
            const res = await fetch(`/api/community/${slug}/threads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(threadForm),
            });
            const data = await res.json();
            if (!res.ok) {
                setThreadError(data.error);
                return;
            }
            setThreads(ts => [data.thread, ...ts]);
            setShowNewThread(false);
            setThreadForm({ title: '', content: '' });
        } catch {
            setThreadError('Failed to post thread');
        } finally {
            setIsPosting(false);
        }
    };

    const isMember = membership?.status === 'active';
    const isPending = membership?.status === 'pending';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <NavBar />
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!community) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <NavBar />
                <div className="text-center py-24 text-gray-400">Community not found.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <NavBar />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Link href="/community" className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 w-fit">
                    <ArrowLeft size={16} /> Back to communities
                </Link>

                {/* Community Header */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold shrink-0">
                                {community.name[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold">{community.name}</h1>
                                    {community.is_private ? (
                                        <Lock size={16} className="text-gray-400" />
                                    ) : (
                                        <Globe size={16} className="text-gray-400" />
                                    )}
                                </div>
                                <p className="text-gray-400 mt-1 max-w-xl">{community.description}</p>
                                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                                    <Users size={14} />
                                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {membership?.role === 'owner' && (
                                <span className="px-3 py-1 bg-purple-900/50 border border-purple-700 rounded-full text-purple-400 text-xs font-semibold">
                                    Owner
                                </span>
                            )}
                            {userId && !isMember && !isPending && (
                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining}
                                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold transition disabled:opacity-50"
                                >
                                    {isJoining ? 'Joining...' : community.is_private ? 'Request to Join' : 'Join'}
                                </button>
                            )}
                            {isPending && (
                                <span className="px-5 py-2 bg-gray-700 rounded-xl text-gray-400 font-semibold text-sm">
                                    Request Pending
                                </span>
                            )}
                            {isMember && membership?.role !== 'owner' && (
                                <button
                                    onClick={handleLeave}
                                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition text-sm"
                                >
                                    Leave
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pending Join Requests — owner only */}
                {membership?.role === 'owner' && community.is_private && (
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl mb-8 overflow-hidden">
                        <button
                            onClick={() => setShowRequests(v => !v)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-750 transition"
                        >
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-purple-400" />
                                <span className="font-semibold">Join Requests</span>
                                {joinRequests.length > 0 && (
                                    <span className="px-2 py-0.5 bg-purple-600 rounded-full text-xs font-bold">
                                        {joinRequests.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-gray-500 text-sm">{showRequests ? 'Hide' : 'Show'}</span>
                        </button>
                        {showRequests && (
                            <div className="border-t border-gray-700">
                                {joinRequests.length === 0 ? (
                                    <p className="px-6 py-4 text-gray-500 text-sm">No pending requests.</p>
                                ) : (
                                    joinRequests.map((req) => (
                                        <div key={req.userId} className="flex items-center justify-between px-6 py-3 border-b border-gray-700 last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                {req.imageUrl ? (
                                                    <Image src={req.imageUrl} alt={req.username} width={36} height={36} className="rounded-full" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">
                                                        {req.username[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm">{req.username}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Requested {new Date(req.requestedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRequest(req.userId, 'approve')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg transition text-sm font-semibold"
                                                >
                                                    <Check size={14} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRequest(req.userId, 'reject')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-red-700 rounded-lg transition text-sm font-semibold"
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Member Management — owner only */}
                {isOwner && (
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl mb-8 overflow-hidden">
                        <button
                            onClick={() => setShowMembers(v => !v)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-750 transition"
                        >
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={18} className="text-purple-400" />
                                <span className="font-semibold">Manage Members</span>
                                <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs font-bold">
                                    {members.length}
                                </span>
                                {bannedMembers.length > 0 && (
                                    <span className="px-2 py-0.5 bg-red-900/60 border border-red-800 text-red-300 rounded-full text-xs font-bold">
                                        {bannedMembers.length} banned
                                    </span>
                                )}
                            </div>
                            <span className="text-gray-500 text-sm">{showMembers ? 'Hide' : 'Show'}</span>
                        </button>
                        {showMembers && (
                            <div className="border-t border-gray-700">
                                {members.map((m) => (
                                    <div key={m.userId} className="flex items-center justify-between px-6 py-3 border-b border-gray-700 last:border-b-0">
                                        <div className="flex items-center gap-3">
                                            {m.imageUrl ? (
                                                <Image src={m.imageUrl} alt={m.username} width={36} height={36} className="rounded-full" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">
                                                    {m.username[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-sm flex items-center gap-2">
                                                    {m.username}
                                                    {m.role === 'owner' && (
                                                        <span className="px-2 py-0.5 bg-purple-900/50 border border-purple-700 rounded-full text-purple-400 text-[10px] font-semibold">
                                                            Owner
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Joined {new Date(m.joinedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {m.role !== 'owner' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleModerate(m.userId, 'kick')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm font-semibold"
                                                    title="Remove from community (can rejoin)"
                                                >
                                                    <UserMinus size={14} /> Kick
                                                </button>
                                                <button
                                                    onClick={() => handleModerate(m.userId, 'ban')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-900/60 hover:bg-red-700 text-red-200 rounded-lg transition text-sm font-semibold"
                                                    title="Ban from community (cannot rejoin)"
                                                >
                                                    <Ban size={14} /> Ban
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {bannedMembers.length > 0 && (
                                    <div className="px-6 py-3 bg-gray-900/40">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Banned</p>
                                        <div className="space-y-2">
                                            {bannedMembers.map((m) => (
                                                <div key={m.userId} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {m.imageUrl ? (
                                                            <Image src={m.imageUrl} alt={m.username} width={28} height={28} className="rounded-full grayscale" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
                                                                {m.username[0]?.toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="text-sm text-gray-400">{m.username}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleModerate(m.userId, 'unban')}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-green-700 rounded-lg transition text-sm font-semibold"
                                                        title="Lift the ban"
                                                    >
                                                        <RotateCcw size={14} /> Unban
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Threads Section */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">Threads</h2>
                    {isMember && (
                        <button
                            onClick={() => setShowNewThread(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold transition text-sm"
                        >
                            <Plus size={16} /> New Thread
                        </button>
                    )}
                </div>

                {threads.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                        <p>{isMember ? 'No threads yet. Start the conversation!' : 'No threads yet. Join to post!'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {threads.map((thread) => (
                            <div key={thread.id} className="relative group">
                                <Link href={`/community/${slug}/thread/${thread.id}`}>
                                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-purple-500 transition cursor-pointer">
                                        <h3 className="font-semibold text-lg mb-1 pr-8">{thread.title}</h3>
                                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{thread.content}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            {thread.author_image ? (
                                                <Image
                                                    src={thread.author_image}
                                                    alt={thread.author_name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gray-600" />
                                            )}
                                            <span>{thread.author_name}</span>
                                            <span>·</span>
                                            <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                                {(isOwner || thread.user_id === userId) && (
                                    <button
                                        onClick={() => handleDeleteThread(thread.id)}
                                        className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition opacity-0 group-hover:opacity-100"
                                        title="Delete thread"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* New Thread Modal */}
            {showNewThread && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold mb-6">Create Thread</h2>
                        {threadError && <p className="text-red-400 text-sm mb-4">{threadError}</p>}
                        <form onSubmit={handlePostThread} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={threadForm.title}
                                    onChange={(e) => setThreadForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Thread title"
                                    required
                                    maxLength={150}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Content</label>
                                <textarea
                                    value={threadForm.content}
                                    onChange={(e) => setThreadForm(f => ({ ...f, content: e.target.value }))}
                                    placeholder="What's on your mind?"
                                    rows={5}
                                    required
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowNewThread(false); setThreadError(null); }}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPosting}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 rounded-xl transition font-semibold"
                                >
                                    {isPosting ? 'Posting...' : 'Post Thread'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
