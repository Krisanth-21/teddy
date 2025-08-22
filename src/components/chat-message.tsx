"use client"

import { TeddyBearIcon } from '@/components/icons/teddy-bear-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Loader2, User } from 'lucide-react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex items-start gap-4 animate-in fade-in',
        !isAssistant && 'flex-row-reverse'
      )}
    >
      <Avatar className={cn('h-10 w-10 border flex-shrink-0', isAssistant ? 'bg-primary/10' : 'bg-accent')}>
          {isAssistant ? (
            <TeddyBearIcon className="h-10 w-10 p-1.5 text-primary animate-bob" />
          ) : (
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          )}
      </Avatar>
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-3 text-sm shadow-sm',
          isAssistant ? 'bg-white' : 'bg-primary text-primary-foreground'
        )}
      >
        {message.content === "..." ? (
            <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin"/>
            </div>
        ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
}
