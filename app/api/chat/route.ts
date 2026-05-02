import {google} from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: google('gemini-2.5-flash'),
        temperature: 0.5,
        presencePenalty: 0,
        frequencyPenalty: 0,
        system:'You are an elite, friendly gaming companion for MYGAMELIST. Your job is to help users with their requests by providing information or links for that information. Keep your answers concise, practical, and highly strategic. Always offer the most information possible so the user does not have any confusions. Do not answer any questions that are not relating to the gaming ecosystem',
        messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
}