'use client';

import { Button } from '@/components/ui/button';
import { PawPrint } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-8">
      <div className="flex flex-col items-center text-center max-w-2xl">
        <div className="p-4 bg-primary/10 rounded-full mb-6 animate-bob">
          <PawPrint className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Welcome to TeddyTalk AI
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your interactive, AI-powered friend is ready to chat, learn, and play. Teach it your voice and start a conversation like no other.
        </p>
        <Link href="/start" passHref>
          <Button size="lg">
            Get Started
          </Button>
        </Link>
        <div className="mt-16 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Teddy Bear collage" 
                width={1200} 
                height={400} 
                className="rounded-lg shadow-2xl object-cover"
                data-ai-hint="teddy bear friendly"
            />
        </div>
      </div>
    </div>
  );
}
