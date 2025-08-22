'use client';

import { aiChatGemini } from '@/ai/flows/ai-chat-gemini';
import { cloneVoice } from '@/ai/flows/clone-voice';
import { generateSpeech } from '@/ai/flows/generate-speech';
import { ChatMessage } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const { toast } = useToast();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

      if (voiceId) {
        const { media } = await generateSpeech({ voiceId, text: response });
        const audio = new Audio(media);
        audio.play();
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

  const processAudio = async (audioBlob: Blob) => {
    setIsCloning(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const { voiceId } = await cloneVoice({ audioDataUri: base64Audio });
        setVoiceId(voiceId);
        toast({
          title: 'Voice Cloned!',
          description: "Your voice has been successfully cloned. The teddy bear will now use your voice.",
        });
      };
    } catch (error) {
      console.error('Error cloning voice:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clone voice. Please try again.',
      });
    } finally {
      setIsCloning(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = event => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      toast({ title: 'Recording started...' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not start recording. Please check microphone permissions.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped. Cloning voice...' });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processAudio(file);
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
          {!voiceId && !isCloning && (
             <Card className="mb-4 shadow-md">
              <CardHeader>
                <CardTitle className="text-center">Clone Your Voice</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={isCloning}>
                  {isRecording ? (
                    <>
                      <X className="mr-2" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2" /> Record Voice
                    </>
                  )}
                </Button>
                <Button onClick={handleUploadClick} variant="outline" disabled={isCloning}>
                  <Upload className="mr-2" /> Upload Voice
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="hidden"
                />
              </CardContent>
            </Card>
          )}

          {(isCloning) && (
            <div className="flex items-center justify-center p-8 mb-4 bg-muted rounded-lg">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p className="text-lg">Cloning your voice, please wait...</p>
            </div>
          )}
          
          <ScrollArea className="flex-1 w-full p-4 rounded-lg border bg-muted/50" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && !isThinking && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <PawPrint className="w-16 h-16 mb-4" />
                    <p className="text-lg">Start a conversation with your Teddy!</p>
                    <p className="text-sm">{voiceId ? "I'm ready to talk with your voice!" : "Clone a voice to hear me speak."}</p>
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
