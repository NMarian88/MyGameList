import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const { userId } = await auth();
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const verifyParams = new URLSearchParams();
        for (const [key, value] of searchParams.entries()) {
            verifyParams.append(key, value);
        }
        verifyParams.set('openid.mode', 'check_authentication');


        const steamVerify = await fetch('https://steamcommunity.com/openid/login', {
            method: 'POST',
            body: verifyParams
        });

        const verificationText = await steamVerify.text();

        if (verificationText.includes('is_valid:true')) {
            const claimedId = searchParams.get('openid.claimed_id') || '';
            const steamId = claimedId.split('/').pop();

            if (!steamId) console.error("Steam linking error: Could not extract Steam ID");

            const client = await clerkClient();
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    steamId: steamId
                }
            });


            return NextResponse.redirect(new URL('/dashboard', request.url));

        } else {
            console.error("Steam rejected the verification");


            return NextResponse.redirect(new URL('/dashboard?error=steam_failed', request.url));
        }
    } catch (error) {
        console.error("Steam linking error:", error);


        return NextResponse.redirect(new URL('/dashboard?error=server_error', request.url));
    }
}