'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { drawerPrimaryButtonClassName } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface PwaInstallButtonProps {
  isInstalled: boolean;
  className?: string;
}

export function PwaInstallButton({ isInstalled, className }: PwaInstallButtonProps) {
  const router = useRouter();

  if (isInstalled) return null;

  return (
    <Button
      size="sm"
      variant="default"
      onMouseEnter={() => router.prefetch('/download')}
      onClick={() => router.push('/download')}
      className={cn(drawerPrimaryButtonClassName, className)}
    >
      Download
    </Button>
  );
}
