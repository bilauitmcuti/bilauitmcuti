'use client';

import { ReactLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';

interface LenisProviderProps {
  children: React.ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const pathname = usePathname();
  const isChatRoute = pathname?.startsWith('/chat');

  if (isChatRoute) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{ lerp: 0.1, duration: 1.2, smoothWheel: true, syncTouch: true }}
    >
      {children}
    </ReactLenis>
  );
}
