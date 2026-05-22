'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const benefits = [
  'Open the app from your home screen in one tap.',
  'Keep the UiTM academic calendar close at hand.',
  'Use the in-app chat assistant without installing from an app store.',
];

const iosInstallSteps: React.ReactNode[] = [
  <>
    Open <strong className="font-semibold text-foreground">Safari</strong> and visit{' '}
    <strong className="font-semibold text-foreground">bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong className="font-semibold text-foreground">Share</strong> button (square with arrow up)
  </>,
  <>
    Choose <strong className="font-semibold text-foreground">&ldquo;Add to Home Screen&rdquo;</strong>
  </>,
  <>
    Tap <strong className="font-semibold text-foreground">Add</strong> to finish
  </>,
];

const androidInstallSteps: React.ReactNode[] = [
  <>
    Open <strong className="font-semibold text-foreground">Chrome</strong> and visit{' '}
    <strong className="font-semibold text-foreground">bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong className="font-semibold text-foreground">menu</strong> (three dots)
  </>,
  <>
    Select <strong className="font-semibold text-foreground">&ldquo;Install app&rdquo;</strong> or{' '}
    <strong className="font-semibold text-foreground">&ldquo;Add to Home Screen&rdquo;</strong>
  </>,
  <>Confirm when prompted</>,
];

function NumberedInstallList({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((body, index) => (
        <li key={index} className="flex gap-3">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            aria-hidden
          >
            {index + 1}
          </span>
          <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-foreground">{body}</span>
        </li>
      ))}
    </ol>
  );
}

export default function PWAPage() {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMinimalUI = (window.navigator as { standalone?: boolean }).standalone === true;

    if (isStandalone || isMinimalUI) {
      setIsInstalled(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const currentScrollTop = el.scrollTop;
    if (currentScrollTop <= 10 || currentScrollTop < lastScrollTop.current) {
      setHeaderVisible(true);
    } else if (currentScrollTop > lastScrollTop.current) {
      setHeaderVisible(false);
    }
    lastScrollTop.current = currentScrollTop;
  }, []);

  return (
    <div className="relative flex h-dvh flex-col bg-background text-foreground">
      <div className="chat-top-fade absolute left-0 right-0 top-0 z-[9] pointer-events-none" />

      <div
        className={`chat-header absolute left-0 right-0 top-0 z-10 px-4 transition-transform md:px-0 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pt-8 pb-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 dark:bg-[#2A2A2A] dark:hover:bg-[#333]"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pb-6 pt-24 md:px-0"
      >
        <div className="mx-auto w-full max-w-[600px]">
          <Card className="gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
              <div>
                <CardTitle asChild className="text-2xl font-semibold">
                  <h1>Install Bila UiTM Cuti</h1>
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-foreground">
                  Progressive Web App — add this site to your home screen for quick access to the calendar and chat. No
                  app store install is required.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <p className="mb-3 text-sm font-semibold">Why install</p>
              <ul className="list-inside list-disc space-y-2 text-sm text-foreground">
                {benefits.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {isInstalled ? (
            <Card className="mt-4 gap-0 rounded-[10px] shadow-none" role="status">
              <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
                <CardTitle className="text-xl font-semibold">Installed app</CardTitle>
                <CardDescription className="mt-1 text-sm text-foreground">
                  You are running Bila UiTM Cuti in standalone mode. You can return here from the main site if you need
                  these steps on another device.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
              <CardTitle className="text-xl font-semibold">iPhone & iPad</CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">Safari</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <NumberedInstallList steps={iosInstallSteps} />
            </CardContent>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
              <CardTitle className="text-xl font-semibold">Android</CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">Chrome (recommended)</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <NumberedInstallList steps={androidInstallSteps} />
            </CardContent>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
              <CardTitle className="text-xl font-semibold">Desktop & laptop</CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">
                Chrome, Edge, or Safari — use{' '}
                <span className="font-medium">bilauitmcuti.com</span> in a supported browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <ul className="space-y-4 text-sm leading-relaxed text-foreground">
                <li>
                  <strong className="font-semibold">Chrome / Edge:</strong> Use the install icon in the address bar, or
                  open the menu and choose &ldquo;Install app&rdquo; / &ldquo;Install Bila UiTM Cuti&rdquo;.
                </li>
                <li>
                  <strong className="font-semibold">Safari (macOS):</strong> File or Share menu → &ldquo;Add to
                  Dock&rdquo; (wording may vary by macOS version).
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
