'use client';

import { aiChatGemini } from '@/ai/flows/ai-chat-gemini';
import { cloneVoice } from '@/ai/flows/clone-voice';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { ChatMessage } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, PawPrint, Send, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);

  const { toast } = useToast();
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
      description: 'Please wait while we clone your voice...',
    });
    try {
      const { voiceId } = await cloneVoice({ audioDataUri });
      setClonedVoiceId(voiceId);
      toast({
        title: 'Voice Cloned!',
        description: `Your voice has been successfully cloned. The teddy bear will now use your voice. (ID: ${voiceId})`,
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
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-center p-4 border-b">
        <PawPrint className="w-8 h-8 mr-2 text-primary" />
        <h1 className="text-2xl font-bold font-headline">TeddyTalk AI</h1>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 overflow-hidden">
        <div className="w-full max-w-2xl flex flex-col h-full">
          <ScrollArea className="flex-1 w-full p-4 rounded-lg border bg-muted/50" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && !isThinking && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <PawPrint className="w-16 h-16 mb-4" />
                    <p className="text-lg">Start a conversation with your Teddy!</p>
                    <p className="text-sm">You can even clone your voice for the teddy to use.</p>
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

          <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" onClick={handleUploadClick} disabled={isCloning}>
              {isCloning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />

            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isThinking || isCloning}
            />
            <Button type="submit" size="icon" disabled={isThinking || isCloning}>
              {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </main>
       <audio ref={audioPlayer} className="hidden" />
    </div>
  );
}
