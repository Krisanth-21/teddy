'use client';

import { aiChatGemini } from '@/ai/flows/ai-chat-gemini';
import { cloneVoice } from '@/ai/flows/clone-voice';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { ChatMessage } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PawPrint, Send, Upload, User, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);

  const { toast } = useToast();
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const { response } = await aiChatGemini({ prompt: input });
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      const { media } = await generateSpeech({ text: response, voiceId: clonedVoiceId ?? undefined });
      if (audioPlayer.current) {
        audioPlayer.current.src = media;
        audioPlayer.current.play();
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the AI.',
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const audioDataUri = e.target?.result as string;
        handleCloneVoice(audioDataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloneVoice = async (audioDataUri: string) => {
    setIsCloning(true);
    toast({
      title: 'Cloning Voice',
      description: 'Please wait while we clone your voice... This might take a moment.',
    });
    try {
      const { voiceId } = await cloneVoice({ audioDataUri });
      setClonedVoiceId(voiceId);
      toast({
        title: 'Voice Cloned!',
        description: `Your voice has been successfully cloned. The teddy bear will now use a new voice!`,
      });
    } catch (error) {
      console.error('Error cloning voice:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clone your voice.',
      });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <header className="flex items-center justify-center p-4 border-b bg-background shadow-sm">
        <PawPrint className="w-8 h-8 mr-2 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">TeddyTalk AI</h1>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <Card className="flex flex-col h-[75vh]">
             <CardHeader>
                <CardTitle>Chat with your Teddy</CardTitle>
             </CardHeader>
             <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              <ScrollArea className="flex-1 w-full p-4 rounded-lg border bg-muted/50" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.length === 0 && !isThinking && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <PawPrint className="w-20 h-20 mb-4 text-primary/10" />
                        <p className="text-lg font-medium">Start a conversation!</p>
                        <p className="text-sm">Type a message below to chat with your AI-powered teddy bear.</p>
                     </div>
                  )}
                  {messages.map((m, i) => (
                    <ChatMessage key={i} message={m} />
                  ))}
                  {isThinking && (
                    <ChatMessage message={{ role: 'assistant', content: "..." }} />
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Say something to your teddy..."
                  className="flex-1"
                  disabled={isThinking || isCloning}
                />
                <Button type="submit" size="icon" disabled={isThinking || isCloning}>
                  {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
             </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Teddy Bear</CardTitle>
              <CardDescription>This is your interactive friend. You can even teach it to speak in your voice!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Image src="https://placehold.co/500x500.png" alt="Teddy Bear" width={200} height={200} className="rounded-full aspect-square object-cover" data-ai-hint="teddy bear" />
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-primary"/>
                            Voice Cloning
                        </CardTitle>
                        <CardDescription>
                            Upload a short audio clip of your voice, and the teddy bear will use it to talk back to you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={handleUploadClick} disabled={isCloning}>
                          {isCloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {isCloning ? 'Cloning Voice...' : 'Upload Your Voice'}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />
                        {clonedVoiceId && (
                            <div className="mt-4 text-sm text-center p-2 bg-green-100 text-green-800 rounded-md">
                                <p>Voice successfully cloned! Your teddy will now use a new voice.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
          </Card>
        </div>
      </main>
      <audio ref={audioPlayer} className="hidden" />
    </div>
  );
}
