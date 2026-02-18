import { notFound } from 'next/navigation';
import {getGameImages, getGameDetails} from "@/lib/rawg-api";
import {auth} from "@clerk/nextjs/server";
import {UserButton} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

interface GameProps {
    params: {
        gameId: string;
    };
}

export default async function GamePage({params}: GameProps) {
    const gameId = parseInt(params.gameId);
    if(isNaN(gameId)) {
        notFound();
    }

    try{
        const game = await getGameDetails(gameId);
        const screenshots = await getGameImages(gameId);

        const {userId} = await auth();

    }catch(err){
        console.error(err);
    }
}
