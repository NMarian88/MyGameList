"use client";
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronDown,Trash2 } from 'lucide-react';
import { Game, UserGameData } from '@/lib/types';

interface GameModalProps {
    game: Game;
    userGameData?: UserGameData;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: () => void;
}

export default function GameModal({ game, userGameData, isOpen, onClose, onStatusChange }: GameModalProps) {
    // Status editing state
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [currentStatusValue, setCurrentStatusValue] = useState(userGameData?.status);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDeleting,setIsDeleting] = useState(false);
    // Score editing state
    const [isEditingScore, setIsEditingScore] = useState(false);
    const [isUpdatingScore, setIsUpdatingScore] = useState(false);
    const [scoreInput, setScoreInput] = useState<number | undefined>(userGameData?.reviews?.[userGameData.reviews.length - 1]?.reviewScore);
    const [localLatestReview, setLocalLatestReview] = useState(userGameData?.reviews?.[userGameData.reviews.length - 1]);

    // Review editing state
    const [isEditingReview, setIsEditingReview] = useState(false);
    const [isUpdatingReview, setIsUpdatingReview] = useState(false);
    const [reviewInput, setReviewInput] = useState<string | undefined>(userGameData?.reviews?.[userGameData.reviews.length - 1]?.reviewText);
    const reviewRef = useRef<HTMLTextAreaElement | null>(null);

    // Sync local latest review, score input and review input when incoming prop changes
    useEffect(() => {
        const latest = userGameData?.reviews?.[userGameData.reviews.length - 1];
        setLocalLatestReview(latest);
        setScoreInput(latest?.reviewScore);
        setReviewInput(latest?.reviewText);
    }, [userGameData?.reviews]);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditingReview && reviewRef.current) {
            try {
                reviewRef.current.focus();
                reviewRef.current.select?.();
            } catch {}
        }
    }, [isEditingReview]);

    const inputRef = useRef<HTMLInputElement | null>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditingScore && inputRef.current) {
            try {
                inputRef.current.focus();
                inputRef.current.select?.();
            } catch {}
        }
    }, [isEditingScore]);

    const handleSaveScore = async (newScore: number) => {
        // If there's no change, just close editor
        if (localLatestReview?.reviewScore === newScore) {
            setIsEditingScore(false);
            return;
        }

        setIsUpdatingScore(true);
        try {
            const now = new Date().toISOString();
            // Create updated review (keep existing text if any)
            const updatedReview = {
                reviewScore: newScore,
                reviewText: localLatestReview?.reviewText,
                reviewedAt: now
            };

            const response = await fetch('/api/user/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: String(game.id),
                    status: userGameData?.status || 'completed',
                    reviews: [updatedReview] // Send single review
                }),
            });

            if (!response.ok) throw new Error('Failed to update score');

            // Optimistically update local state for immediate UI feedback
            setLocalLatestReview(updatedReview);
            if (onStatusChange) onStatusChange();
            setIsEditingScore(false);
        } catch (error) {
            console.error('Error updating score:', error);
            alert('Failed to update score. Please try again.');
        } finally {
            setIsUpdatingScore(false);
        }
    };

    // Cancel editing and revert input to last known score
    const handleCancelEditing = () => {
        setIsEditingScore(false);
        setScoreInput(localLatestReview?.reviewScore);
    };

    // Called on blur to either cancel (if empty) or save changes
    const handleBlurSave = () => {
        if (scoreInput === undefined) {
            handleCancelEditing();
            return;
        }
        // If unchanged, simply close the editor
        if (localLatestReview?.reviewScore === scoreInput) {
            setIsEditingScore(false);
            return;
        }

        if (!isUpdatingScore) {
            handleSaveScore(Math.max(0, Math.min(10, Math.round(scoreInput))));
        }
    };

    // Review handlers
    const handleCancelReviewEditing = () => {
        setIsEditingReview(false);
        setReviewInput(localLatestReview?.reviewText);
    };

    const handleSaveReview = async (newText: string) => {
        // If unchanged, just close editor
        if (localLatestReview?.reviewText === newText) {
            setIsEditingReview(false);
            return;
        }

        setIsUpdatingReview(true);
        try {
            const now = new Date().toISOString();
            // Create updated review (keep existing score if any)
            const updatedReview = {
                reviewScore: localLatestReview?.reviewScore,
                reviewText: newText,
                reviewedAt: now
            };

            const response = await fetch('/api/user/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: String(game.id),
                    status: userGameData?.status || 'completed',
                    reviews: [updatedReview] // Send single review
                }),
            });

            if (!response.ok) throw new Error('Failed to update review');

            setLocalLatestReview(updatedReview);
            if (onStatusChange) onStatusChange();
            setIsEditingReview(false);
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review. Please try again.');
        } finally {
            setIsUpdatingReview(false);
        }
    };

    const handleBlurSaveReview = () => {
        const trimmed = reviewInput?.trim() ?? '';
        if (trimmed === '') {
            handleCancelReviewEditing();
            return;
        }
        if (localLatestReview?.reviewText === trimmed) {
            setIsEditingReview(false);
            return;
        }
        if (!isUpdatingReview) {
            handleSaveReview(trimmed);
        }
    };

    // Update local status when userGameData changes
    useEffect(() => {
        setCurrentStatusValue(userGameData?.status);
    }, [userGameData?.status]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };

        if (isStatusDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusDropdownOpen]);

    // Close modal on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isStatusDropdownOpen) {
                    setIsStatusDropdownOpen(false);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, isStatusDropdownOpen]);

    if (!isOpen) return null;

    const handleStatusChange = async (newStatus: "playing" | "completed" | "wishlist" | "dropped") => {
        if (!userGameData || newStatus === currentStatusValue) {
            setIsStatusDropdownOpen(false);
            return;
        }

        setIsUpdatingStatus(true);
        try {
            const response = await fetch('/api/user/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: String(game.id),
                    status: newStatus,
                    ...(newStatus === 'completed' && { completedAt: new Date().toISOString() })
                }),
            });

            if (!response.ok) throw new Error('Failed to update status');

            // Update local state immediately for visual feedback
            setCurrentStatusValue(newStatus);

            // Call the refresh callback if provided
            if (onStatusChange) {
                onStatusChange();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        } finally {
            setIsUpdatingStatus(false);
            setIsStatusDropdownOpen(false);
        }
    };

    const statusOptions: Array<{ value: "playing" | "completed" | "wishlist" | "dropped"; label: string; color: string }> = [
        { value: "playing", label: "Playing", color: "bg-blue-600" },
        { value: "completed", label: "Completed", color: "bg-green-600" },
        { value: "wishlist", label: "Wishlist", color: "bg-purple-600" },
        { value: "dropped", label: "Dropped", color: "bg-red-600" },
    ];

    const currentStatus = statusOptions.find(opt => opt.value === currentStatusValue) || statusOptions[0];

    const getScoreClass = (score?: number) => {
        if (score == null) return 'bg-black/50';
        if (score >= 8) return 'bg-green-600/50';
        if (score >= 5) return 'bg-yellow-500/50';
        return 'bg-red-600/50';
    };

    const genres = game.genres?.map(g => g.name).join(', ') || 'N/A';
    const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'N/A';

    const deleteFromCollection = async() => {
        if (!confirm("Are you sure you want to remove this game from your collection? This cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {

            const response = await fetch(`/api/user/games?gameId=${game.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete');
            }

            // Successfully deleted
            if (onStatusChange) onStatusChange(); // Refresh the parent list
            onClose(); // Close the modal
        } catch (error) {
            console.error("Error deleting game:", error);
            alert("Failed to remove game from collection.");
        } finally {
            setIsDeleting(false);
        }
    };
    const modalContent = (
        <div 
            className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Image */}
                <div className="relative h-64 w-full">
                    <Image 
                        src={game.background_image || "https://media.rawg.io/media/screenshots/df3/df397a86c8d5b4023fe13fa6dd7f140f.jpeg"}
                        alt={game.name}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent" />
                    
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-gray-900/80 hover:bg-gray-800 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h2 className="text-3xl font-bold text-white mb-2">{game.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                            {game.released && (
                                <span>{new Date(game.released).getFullYear()}</span>
                            )}
                            {game.metacritic !== undefined && game.metacritic !== null && game.metacritic !== 0 && (
                                <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400">
                                    Metacritic: {game.metacritic}
                                </span>
                            )}
                            {game.rating !== undefined && game.rating !== null && game.rating !== 0 && (
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400">
                                    Rating: {game.rating}/5
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* User Status & Score */}
                    {userGameData && (
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Status:</span>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                        disabled={isUpdatingStatus}
                                        className={`px-3 py-1 ${currentStatus.color} text-white rounded text-sm font-medium capitalize flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isUpdatingStatus ? 'Updating...' : currentStatus.label}
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Status Dropdown */}
                                    {isStatusDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 min-w-30">
                                            {statusOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleStatusChange(option.value)}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors capitalize ${
                                                        option.value === currentStatusValue ? 'text-white font-medium' : 'text-gray-300'
                                                    }`}
                                                >
                                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${option.color}`} />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Your Score:</span>
                                { (localLatestReview?.reviewScore !== undefined && localLatestReview?.reviewScore !== null) || isEditingScore ? (
                                    <>
                                        {/* Display mode */}
                                        {!isEditingScore && localLatestReview?.reviewScore !== undefined && (
                                            <div className="flex items-center gap-2">
                                                <span
                                                    onClick={() => setIsEditingScore(true)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsEditingScore(true); e.preventDefault(); } }}
                                                    className={`px-3 py-1 ${getScoreClass(localLatestReview.reviewScore)} text-white rounded text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                >
                                                    {localLatestReview.reviewScore}/10
                                                </span>
                                                <button
                                                    onClick={() => setIsEditingScore(true)}
                                                    className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded bg-gray-800/40 border border-gray-700"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}

                                        {/* Edit mode */}
                                        {isEditingScore && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={inputRef}
                                                    type="number"
                                                    min={0}
                                                    max={10}
                                                    step={1}
                                                    value={scoreInput ?? ''}
                                                    onChange={(e) => setScoreInput(e.target.value === '' ? undefined : Number(e.target.value))}
                                                    onBlur={() => {
                                                        if (scoreInput === undefined) {
                                                            handleCancelEditing();
                                                        } else {
                                                            handleBlurSave();
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if ((e.key === 'Enter' || e.key === 'NumpadEnter') && scoreInput !== undefined) {
                                                            handleSaveScore(Math.max(0, Math.min(10, Math.round(scoreInput))))
                                                        } else if (e.key === 'Escape') {
                                                            handleCancelEditing();
                                                        }
                                                    }}
                                                    disabled={isUpdatingScore}
                                                    className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-sm"
                                                    aria-label="Edit score"
                                                />
                                                {isUpdatingScore && (
                                                    <span className="text-sm text-gray-300">Saving...</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditingScore(true)} className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded bg-gray-800/40 border border-gray-700">
                                        Add Score
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Genres & Platforms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">Genres</h3>
                            <p className="text-white">{genres}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">Platforms</h3>
                            <p className="text-white">{platforms}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {game.description && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                            <div 
                                className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: game.description }}
                            />
                        </div>
                    )}

                    {/* Screenshots */}
                    {game.short_screenshots && game.short_screenshots.length > 1 && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Screenshots</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {game.short_screenshots.slice(1, 7).map((screenshot) => (
                                    <div key={screenshot.id} className="relative h-32 rounded overflow-hidden">
                                        <Image 
                                            src={screenshot.image}
                                            alt="Game screenshot"
                                            fill
                                            className="object-cover hover:scale-105 transition-transform"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Review */}
                    <div className="pt-4 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white mb-3">Your Review</h3>
                            {userGameData && (
                                <button
                                    onClick={deleteFromCollection}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/30 border border-red-800 text-red-200 hover:bg-red-900/50 hover:text-white transition-colors text-sm disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isDeleting ? "Removing..." : "Remove from Collection"}
                                </button>
                            )}
                            {!isEditingReview && localLatestReview?.reviewText && (
                                <button
                                    onClick={() => { setIsEditingReview(true); setReviewInput(localLatestReview?.reviewText ?? ''); }}
                                    className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded bg-gray-800/40 border border-gray-700"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {localLatestReview?.reviewText || isEditingReview ? (
                            <>
                                {!isEditingReview && localLatestReview?.reviewText && (
                                    <p
                                        className="text-gray-300 italic cursor-pointer"
                                        onClick={() => { setIsEditingReview(true); setReviewInput(localLatestReview.reviewText ?? ''); }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsEditingReview(true); setReviewInput(localLatestReview.reviewText ?? ''); } }}
                                    >
                                        &quot;{localLatestReview.reviewText}&quot;
                                    </p>
                                )}

                                {isEditingReview && (
                                    <div>
                                        <textarea
                                            ref={reviewRef}
                                            rows={6}
                                            value={reviewInput ?? ''}
                                            onChange={(e) => setReviewInput(e.target.value)}
                                            onBlur={() => {
                                                const trimmed = reviewInput?.trim() ?? '';
                                                if (trimmed === '') {
                                                    handleCancelReviewEditing();
                                                } else {
                                                    handleBlurSaveReview();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                    const trimmed = reviewInput?.trim() ?? '';
                                                    if (trimmed !== '') handleSaveReview(trimmed);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelReviewEditing();
                                                }
                                            }}
                                            disabled={isUpdatingReview}
                                            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm resize-y"
                                            aria-label="Edit review"
                                        />
                                        <div className="mt-2 flex items-center gap-2">
                                            {isUpdatingReview && <span className="text-sm text-gray-300">Saving...</span>}
                                            <span className="text-sm text-gray-500">Press Ctrl/Cmd+Enter to save, Esc to cancel</span>
                                        </div>

                                    </div>
                                )}
                                {localLatestReview?.reviewedAt && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Reviewed on {new Date(localLatestReview.reviewedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </>
                        ) : (

                                <button onClick={() => setIsEditingReview(true)} className="text-sm text-gray-300 hover:text-white px-2 py-1 rounded bg-gray-800/40 border border-gray-700">
                                    Add Review
                                </button>




                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
