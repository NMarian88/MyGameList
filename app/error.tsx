'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        posthog.captureException(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-gray-900 to-black text-white px-4">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
                <p className="text-gray-400 mb-6">The error has been reported. Please try again.</p>
                <button
                    onClick={reset}
                    className="px-6 py-3 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition font-semibold"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}
