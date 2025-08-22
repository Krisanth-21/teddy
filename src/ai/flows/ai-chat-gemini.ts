// Implemented Gemini-powered AI chat flow.

'use server';

/**
 * @fileOverview A Gemini-powered AI chat flow for the TeddyTalk AI app.
 * 
 * - aiChatGemini - A function that handles the AI chat process with Gemini.
 * - AIChatGeminiInput - The input type for the aiChatGemini function.
 * - AIChatGeminiOutput - The return type for the aiChatGemini function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatGeminiInputSchema = z.object({
  prompt: z.string().describe('The prompt to send to the Gemini API.'),
});
export type AIChatGeminiInput = z.infer<typeof AIChatGeminiInputSchema>;

const AIChatGeminiOutputSchema = z.object({
  response: z.string().describe('The response from the Gemini API.'),
});
export type AIChatGeminiOutput = z.infer<typeof AIChatGeminiOutputSchema>;

export async function aiChatGemini(input: AIChatGeminiInput): Promise<AIChatGeminiOutput> {
  return aiChatGeminiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatGeminiPrompt',
  input: {schema: AIChatGeminiInputSchema},
  output: {schema: AIChatGeminiOutputSchema},
  prompt: `You are an AI-powered teddy bear. A user is chatting with you, and you should respond in a friendly and engaging manner.\n\nUser's Prompt: {{{prompt}}}`,
});

const aiChatGeminiFlow = ai.defineFlow(
  {
    name: 'aiChatGeminiFlow',
    inputSchema: AIChatGeminiInputSchema,
    outputSchema: AIChatGeminiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
