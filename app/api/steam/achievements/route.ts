import {NextResponse} from 'next/server';

interface SteamPlayerAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
}

interface SteamSchemaAchievement {
    name: string;
    displayName: string;
    description?: string;
    icon: string;
    icongray: string;
}

export async function GET(request: Request) {
    try {
        const {searchParams} = new URL(request.url);
        const steamId = searchParams.get('steamId');
        const rawgId = searchParams.get('rawgId');

        if (!steamId || !rawgId) {
            return NextResponse.json({error: "Missing parameters"}, {status: 400});
        }

        const rawgApiKey = (process.env.RAWG_API_KEY || process.env.NEXT_PUBLIC_RAWG_API_KEY || '').trim();
        const storeRes = await fetch(`https://api.rawg.io/api/games/${rawgId}/stores?key=${rawgApiKey}`);
        const storeData = await storeRes.json();
        const steamStore = storeData.results?.find((s: any) => s.store_id === 1);

        if (!steamStore || !steamStore.url) {
            return NextResponse.json({error: "No Steam store found"}, {status: 404});
        }

        const match = steamStore.url.match(/\/app\/(\d+)/);
        const appId = match ? match[1] : null;

        if (!appId) {
            return NextResponse.json({error: "Could not extract Steam App ID from URL"}, {status: 404});
        }

        const apiKey = (process.env.STEAM_API_KEY || '').trim();

        const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${appId}&key=${apiKey}`;
        const schemaRes = await fetch(schemaUrl);

        if (!schemaRes.ok) {
            return NextResponse.json({error: "Game not found on Steam"}, {status: 400});
        }

        const schemaData = await schemaRes.json();
        const availableAchievements = schemaData.game?.availableGameStats?.achievements || [];

        const statsUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${apiKey}&steamid=${steamId}`;
        const statsRes = await fetch(statsUrl);

        let playerAchievements: SteamPlayerAchievement[] = [];
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            playerAchievements = statsData.playerstats?.achievements || [];
        }

        const mergedAchievements = availableAchievements.map((schemaAch: SteamSchemaAchievement) => {
            const playerAch = playerAchievements.find(p => p.apiname === schemaAch.name);
            const isUnlocked = playerAch ? playerAch.achieved === 1 : false;

            return {
                id: schemaAch.name,
                displayName: schemaAch.displayName,
                description: schemaAch.description || 'Hidden achievement',
                icon: isUnlocked ? schemaAch.icon : schemaAch.icongray,
                isUnlocked: isUnlocked,
                unlockTime: playerAch?.unlocktime || 0
            };
        });

        mergedAchievements.sort((a: any, b: any) => {
            if (a.isUnlocked && !b.isUnlocked) return -1;
            if (!a.isUnlocked && b.isUnlocked) return 1;
            return 0;
        });

        return NextResponse.json(mergedAchievements);
    } catch (error) {
        console.error("Steam API Error:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}