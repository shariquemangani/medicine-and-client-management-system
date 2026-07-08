'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  loading?: boolean;
}

export function BackButton({ onClick, label, loading = false }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 rounded-xl border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5"
      onClick={handleClick}
      disabled={loading}
      aria-label={label || "Go back"}
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <ArrowLeft className="h-5 w-5" />
      )}
    </Button>
  );
}
