'use server';

/**
 * @fileOverview Voice cloning flow using All-Voice-Lab API.
 *
 * - cloneVoice - A function that handles the voice cloning process.
 * - CloneVoiceInput - The input type for the cloneVoice function.
 * - CloneVoiceOutput - The return type for the cloneVoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CloneVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording of the user's voice as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CloneVoiceInput = z.infer<typeof CloneVoiceInputSchema>;

const CloneVoiceOutputSchema = z.object({
  voiceId: z.string().describe('The ID of the cloned voice from All-Voice-Lab API.'),
});
export type CloneVoiceOutput = z.infer<typeof CloneVoiceOutputSchema>;

export async function cloneVoice(input: CloneVoiceInput): Promise<CloneVoiceOutput> {
  return cloneVoiceFlow(input);
}

const cloneVoiceFlow = ai.defineFlow(
  {
    name: 'cloneVoiceFlow',
    inputSchema: CloneVoiceInputSchema,
    outputSchema: CloneVoiceOutputSchema,
  },
  async input => {
    // Call All-Voice-Lab API to clone the voice.
    // Replace with actual API endpoint and authentication.
    const apiKey = process.env.ALL_VOICE_LAB_API_KEY;
    if (!apiKey) {
      throw new Error('ALL_VOICE_LAB_API_KEY is not set in environment variables.');
    }

    const response = await fetch('https://api.allvoicelab.com/clone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({audio: input.audioDataUri}),
    });

    if (!response.ok) {
      throw new Error(`Voice cloning failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.voiceId) {
      throw new Error(`Voice cloning failed: No voiceId returned`);
    }
    return {voiceId: data.voiceId};
  }
);

