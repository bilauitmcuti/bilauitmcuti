'use client';

import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { purgeStaleOverlayPortals } from '@/lib/overlay-cleanup';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Route error:', error);
    }
    purgeStaleOverlayPortals();
  }, [error]);

  const handleReset = useCallback(() => {
    purgeStaleOverlayPortals();
    reset();
  }, [reset]);

  const handleReload = useCallback(() => {
    purgeStaleOverlayPortals();
    window.location.reload();
  }, []);

  return (
    <div className="relative z-[10001] min-h-[40vh] flex flex-col items-center justify-center px-4">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        An error occurred. Please try again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={handleReset} variant="outline">
          Try again
        </Button>
        <Button onClick={handleReload} variant="default">
          Reload page
        </Button>
      </div>
    </div>
  );
}
