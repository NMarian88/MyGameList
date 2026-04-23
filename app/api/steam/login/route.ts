import {NextResponse} from "next/server";


export async function GET (request:Request){
    const host = request.headers.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const returnTo = `${protocol}://${host}/api/steam/return`;

    const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': returnTo,
        'openid.realm': `${protocol}://${host}`,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })
    return NextResponse.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`);
}