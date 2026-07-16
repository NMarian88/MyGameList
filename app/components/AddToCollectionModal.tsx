'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';

export interface CollectionSelection {
    status: 'playing' | 'completed' | 'wishlist' | 'dropped';
    reviewScore?: number;
    reviewText?: string;
}

interface AddToCollectionModalProps {
    isOpen: boolean;
    gameName: string;
    isSubmitting?: boolean;
    onClose: () => void;
    onConfirm: (selection: CollectionSelection) => void;
}

const statusOptions: Array<{
    value: CollectionSelection['status'];
    label: string;
    color: string;
}> = [
    { value: 'wishlist', label: 'Wishlist', color: 'bg-purple-600' },
    { value: 'playing', label: 'Playing', color: 'bg-blue-600' },
    { value: 'completed', label: 'Completed', color: 'bg-green-600' },
    { value: 'dropped', label: 'Dropped', color: 'bg-red-600' },
];

export default function AddToCollectionModal({
    isOpen,
    gameName,
    isSubmitting = false,
    onClose,
    onConfirm,
}: AddToCollectionModalProps) {
    const [status, setStatus] = useState<CollectionSelection['status']>('wishlist');
    const [score, setScore] = useState<number | undefined>(undefined);
    const [review, setReview] = useState('');


    useEffect(() => {
        if (isOpen) {
            setStatus('wishlist');
            setScore(undefined);
            setReview('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const buildSelection = (): CollectionSelection => {
        const trimmedReview = review.trim();
        return {
            status,
            reviewScore: score,
            reviewText: trimmedReview === '' ? undefined : trimmedReview,
        };
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 shadow-2xl my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Add to Collection</h2>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{gameName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">
                            Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setStatus(option.value)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                        status === option.value
                                            ? 'border-white/60 bg-gray-800'
                                            : 'border-gray-700 bg-gray-800/40 hover:bg-gray-800'
                                    }`}
                                >
                                    <span className={`w-3 h-3 rounded-full ${option.color}`} />
                                    <span className="text-white">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Score */}
                    <div>
                        <label
                            htmlFor="atc-score"
                            className="block text-sm font-semibold text-gray-300 mb-3"
                        >
                            Your Score{' '}
                            <span className="text-gray-500 font-normal">(optional, 0–10)</span>
                        </label>
                        <input
                            id="atc-score"
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={score ?? ''}
                            onChange={(e) =>
                                setScore(
                                    e.target.value === ''
                                        ? undefined
                                        : Math.max(0, Math.min(10, Number(e.target.value)))
                                )
                            }
                            placeholder="No score"
                            className="w-32 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Review */}
                    <div>
                        <label
                            htmlFor="atc-review"
                            className="block text-sm font-semibold text-gray-300 mb-3"
                        >
                            Review{' '}
                            <span className="text-gray-500 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="atc-review"
                            rows={4}
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Share your thoughts about this game..."
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(buildSelection())}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Adding...' : 'Add to Collection'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
