'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
}

export function LoadingScreen({
  message = 'Loading admin portal...',
  subtitle = 'MediFlow',
}: LoadingScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 8;
        return next >= 100 ? 100 : next;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full bg-blue-500/10 animate-pulse" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">{subtitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        <div className="w-64 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
