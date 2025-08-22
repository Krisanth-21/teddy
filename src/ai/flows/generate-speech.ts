'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating speech using the All-Voice-Lab API with a cloned voice.
 *
 * - generateSpeech - A function that generates speech from text using a cloned voice.
 * - GenerateSpeechInput - The input type for the generateSpeech function.
 * - GenerateSpeechOutput - The return type for the generateSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateSpeechInputSchema = z.object({
  voiceId: z.string().describe('The ID of the cloned voice to use.'),
  text: z.string().describe('The text to convert to speech.'),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;

const GenerateSpeechOutputSchema = z.object({
  media: z.string().describe('The audio data as a data URI.'),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;

export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  return generateSpeechFlow(input);
}

const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: GenerateSpeechInputSchema,
    outputSchema: GenerateSpeechOutputSchema,
  },
  async input => {
    const apiKey = process.env.ALL_VOICE_LAB_API_KEY;
    if (!apiKey) {
      throw new Error('ALL_VOICE_LAB_API_KEY is not set in environment variables.');
    }

    const response = await fetch('https://api.allvoicelab.com/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        voiceId: input.voiceId,
        text: input.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Text-to-speech failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.audio) {
      throw new Error(`Text-to-speech failed: No audio returned`);
    }
    return {media: data.audio};
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
