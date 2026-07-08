'use client';

import { useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIChatbot } from './ai-chatbot';

export function AIChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
      >
        <div className="relative">
          <MessageCircle className="h-5 w-5" />
          <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-background">
            <Sparkles className="absolute inset-0 h-2.5 w-2.5 text-white p-0.5 animate-spin [animation-duration:3s]" />
          </div>
        </div>
        <span className="sr-only">Open AI Assistant</span>
      </Button>

      {isOpen && <AIChatbot isOpen={isOpen} setIsOpen={setIsOpen} />}
    </>
  );
}
