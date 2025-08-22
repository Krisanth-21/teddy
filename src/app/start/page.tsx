'use client';

import { cloneVoice } from '@/ai/flows/clone-voice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Upload, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function StartPage() {
  const [isCloning, setIsCloning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();
  const router = useRouter();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const audioDataUri = e.target?.result as string;
        setAudioUrl(audioDataUri);
        // Automatically proceed to clone after selection
        handleCloneVoice(audioDataUri);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioDataUri = URL.createObjectURL(audioBlob);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const audioDataUriForCloning = e.target?.result as string;
          setAudioUrl(audioDataUriForCloning);
          handleCloneVoice(audioDataUriForCloning);
        };
        reader.readAsDataURL(audioBlob);

      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording started!' });
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        variant: 'destructive',
        title: 'Microphone access denied',
        description: 'Please allow microphone access in your browser settings.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording stopped!' });
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
      // In a real app, we'd pass this to the chat page
      localStorage.setItem('clonedVoiceId', voiceId);
      toast({
        title: 'Voice Cloned!',
        description: `Your voice has been successfully cloned.`,
      });
      // Delay navigation to allow user to see the toast
      setTimeout(() => {
        router.push('/chat');
      }, 1000);
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
    <div className="flex items-center justify-center min-h-screen bg-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Your Voice</CardTitle>
          <CardDescription>
            Give your teddy bear a voice! Upload an audio file or record your own voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5"/>
                    Upload Audio
                </CardTitle>
                <CardDescription>Select an existing audio file from your device.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={handleUploadClick} disabled={isCloning || isRecording}>
                  {isCloning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isCloning ? 'Cloning...' : 'Upload Audio File'}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5"/>
                    Record Audio
                </CardTitle>
                <CardDescription>Record your voice directly in the browser.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    className="w-full" 
                    onClick={isRecording ? handleStopRecording : handleStartRecording} 
                    disabled={isCloning}
                    variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            </CardContent>
          </Card>

          {audioUrl && !isCloning && (
             <div className="flex flex-col items-center gap-4">
                <audio src={audioUrl} controls className="w-full" />
                <Button onClick={() => router.push('/chat')} variant="outline">
                    Proceed to Chat <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
