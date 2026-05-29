'use client'
import { useState, useEffect } from 'react';
import NavBar from '@/app/components/navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, CornerDownRight } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';

interface Thread {
    id: string;
    title: string;
    content: string;
    author_name: string;
    author_image: string | null;
    created_at: string;
}

interface Comment {
    id: string;
    content: string;
    author_name: string;
    author_image: string | null;
    parent_comment_id: string | null;
    created_at: string;
    user_id: string;
}

function AuthorAvatar({ image, name, size = 24 }: { image: string | null; name: string; size?: number }) {
    if (image) {
        return <Image src={image} alt={name} width={size} height={size} className="rounded-full shrink-0" />;
    }
    return (
        <div
            className="rounded-full bg-gray-600 shrink-0 flex items-center justify-center text-xs font-bold text-gray-300"
            style={{ width: size, height: size }}
        >
            {name[0]?.toUpperCase()}
        </div>
    );
}

interface CommentItemProps {
    comment: Comment;
    allComments: Comment[];
    userId: string | null | undefined;
    isSubmitting: boolean;
    onSubmit: (content: string, parentId: string) => Promise<void>;
    depth: number;
}

function CommentItem({ comment, allComments, userId, isSubmitting, onSubmit, depth }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const replies = allComments.filter(c => c.parent_comment_id === comment.id);
    const MAX_INDENT = 4;

    const handleReply = async () => {
        if (!replyText.trim()) return;
        await onSubmit(replyText, comment.id);
        setReplyText('');
        setIsReplying(false);
    };

    return (
        <div>
            <div className={`border rounded-xl p-4 ${depth === 0 ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/60 border-gray-700/60'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <AuthorAvatar image={comment.author_image} name={comment.author_name} size={depth === 0 ? 24 : 20} />
                    <span className="font-semibold text-sm">{comment.author_name}</span>
                    <span className="text-gray-500 text-xs">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                {userId && (
                    <button
                        onClick={() => setIsReplying(v => !v)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400 transition mt-3"
                    >
                        <CornerDownRight size={12} /> Reply
                    </button>
                )}
                {isReplying && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-600">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 resize-none text-sm mb-2"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsReplying(false); setReplyText(''); }}
                                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={!replyText.trim() || isSubmitting}
                                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition font-semibold"
                            >
                                Reply
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {replies.length > 0 && (
                <div className={`${depth < MAX_INDENT ? 'ml-8' : 'ml-2'} mt-2 space-y-2`}>
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            allComments={allComments}
                            userId={userId}
                            isSubmitting={isSubmitting}
                            onSubmit={onSubmit}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ThreadPage() {
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const { userId } = useAuth();
    const [thread, setThread] = useState<Thread | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id || !slug) return;
        fetchThread();
    }, [id, slug]);

    const fetchThread = async () => {
        try {
            const res = await fetch(`/api/community/${slug}/threads/${id}`);
            if (!res.ok) return;
            const data = await res.json();
            setThread(data.thread);
            setComments(data.comments);
        } finally {
            setIsLoading(false);
        }
    };

    const submitComment = async (content: string, parentId: string | null = null): Promise<void> => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/community/${slug}/threads/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, parent_comment_id: parentId }),
            });
            if (res.ok) {
                const data = await res.json();
                setComments(cs => [...cs, data.comment]);
                if (!parentId) setCommentText('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const rootComments = comments.filter(c => !c.parent_comment_id);

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

    if (!thread) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
                <NavBar />
                <div className="text-center py-24 text-gray-400">Thread not found.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <NavBar />
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <Link
                    href={`/community/${slug}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 w-fit"
                >
                    <ArrowLeft size={16} /> Back to community
                </Link>

                {/* Thread Post */}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
                    <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">{thread.content}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 pt-4 border-t border-gray-700">
                        <AuthorAvatar image={thread.author_image} name={thread.author_name} size={24} />
                        <span>{thread.author_name}</span>
                        <span>·</span>
                        <span>
                            {new Date(thread.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                        </span>
                    </div>
                </div>

                {/* Add Top-level Comment */}
                {userId && (
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-8">
                        <h3 className="font-semibold mb-3 text-gray-200">Leave a comment</h3>
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 resize-none mb-3"
                        />
                        <button
                            onClick={() => submitComment(commentText)}
                            disabled={!commentText.trim() || isSubmitting}
                            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 rounded-xl font-semibold transition text-sm"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                )}

                {/* Comments */}
                <h3 className="font-semibold text-gray-300 mb-4">
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </h3>
                <div className="space-y-4">
                    {rootComments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No comments yet. {userId ? 'Be the first!' : 'Join the community to comment.'}
                        </div>
                    ) : (
                        rootComments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                allComments={comments}
                                userId={userId}
                                isSubmitting={isSubmitting}
                                onSubmit={submitComment}
                                depth={0}
                            />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
