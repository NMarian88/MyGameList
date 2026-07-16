'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function GameViewTracker({ gameId, gameName }: { gameId: number; gameName: string }) {
    useEffect(() => {
        posthog.capture('game_viewed', { game_id: gameId, game_name: gameName })
    }, [gameId, gameName])

    return null
}
