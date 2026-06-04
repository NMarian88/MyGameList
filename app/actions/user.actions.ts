'use server';

import {clerkClient} from "@clerk/nextjs/server";

export interface User {
    id: string;
    username: string;
    imageUrl: string;
}

export async function searchUsers(searchQuery: string): Promise<User[]> {
    if(!searchQuery){
        return [];
    }
    try{
        const client = await clerkClient();
        const response = await client.users.getUserList({
            query: searchQuery,
            limit: 10,
        });
        const users = response.data || response;
        return users.map((user) => {
            return {
                id: user.id,
                username: user.username || user.firstName || 'Unknown User',
                imageUrl: user.imageUrl,
            };
        });
    }catch(error){
        console.error('Failed to search Clerk users:', error);
        return [];
    }
}