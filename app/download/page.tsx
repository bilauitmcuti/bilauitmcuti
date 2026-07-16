'use client';

import { Suspense, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { PwaInstallOverlay } from '@/components/download/pwa-install-overlay';
import { BrandName } from '@/components/brand-name';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  drawerPrimaryButtonClassName,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePwaInstalled } from '@/hooks/use-pwa-installed';
import { usePwaInstallPrompt } from '@/hooks/use-pwa-install-prompt';
import {
  getPwaSharedCaption,
  isIosSafari,
  usePwaInstallPlatform,
  type PwaInstallPlatform,
} from '@/lib/pwa-platform';
import { cn } from '@/lib/utils';

const pwaBenefits = [
  'Open the app from your home screen in one tap.',
  'Keep the UiTM academic calendar close at hand.',
  'Use the in-app chat assistant without installing from an app store.',
];

const bookmarkBenefits = [
  'Open bilauitmcuti.com from your browser bookmarks in one click.',
  'Keep the UiTM academic calendar easy to find on any device.',
  'No install required — works in Safari, Chrome, Edge, Firefox, and more.',
];

const iosBookmarkSteps: ReactNode[] = [
  <>
    Open <strong className="font-semibold text-foreground">Safari</strong> and visit{' '}
    <strong className="font-semibold text-foreground">bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong className="font-semibold text-foreground">Share</strong> button (square with arrow up)
  </>,
  <>
    Tap <strong className="font-semibold text-foreground">&ldquo;Add Bookmark&rdquo;</strong>
  </>,
  <>
    Choose a folder (e.g. <strong className="font-semibold text-foreground">Favorites</strong>) and tap{' '}
    <strong className="font-semibold text-foreground">Save</strong>
  </>,
];

const androidBookmarkSteps: ReactNode[] = [
  <>
    Open <strong className="font-semibold text-foreground">Chrome</strong> and visit{' '}
    <strong className="font-semibold text-foreground">bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong className="font-semibold text-foreground">star</strong> icon in the address bar
  </>,
  <>Rename the bookmark if you like, then confirm</>,
  <>
    Tap <strong className="font-semibold text-foreground">Save</strong> or{' '}
    <strong className="font-semibold text-foreground">Done</strong>
  </>,
];

const desktopBookmarkSteps: ReactNode[] = [
  <>
    Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl+D</kbd>{' '}
    (Windows) or <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">⌘D</kbd>{' '}
    (Mac), or click the <strong className="font-semibold">star</strong> in the address bar, then save.
  </>,
  <>
    In Safari (macOS): Bookmarks menu → &ldquo;Add Bookmark&rdquo;, or press{' '}
    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">⌘D</kbd>.
  </>,
  <>Add the bookmark to your bookmarks bar or Favorites for one-click access.</>,
];

function NumberedInstallList({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
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

function platformCardMeta(platform: PwaInstallPlatform): {
  title: string;
  description: string;
  blurb: string;
} {
  if (platform === 'ios') {
    const safari = isIosSafari();
    return {
      title: 'iPhone & iPad',
      description: safari ? 'Safari' : 'Open in Safari to install',
      blurb: safari
        ? 'Install Bila UiTM Cuti to your Home Screen from Safari.'
        : 'Use Safari to add this app to your Home Screen.',
    };
  }
  if (platform === 'android') {
    return {
      title: 'Android',
      description: 'Chrome (recommended)',
      blurb: 'Install Bila UiTM Cuti to your Home screen for quicker access.',
    };
  }
  return {
    title: 'Desktop & laptop',
    description: 'Chrome or Edge',
    blurb: 'Install the app on your computer so it opens in its own window.',
  };
}

function PwaTabContent({
  isInstalled,
  platform,
  onInstallClick,
}: {
  isInstalled: boolean;
  platform: PwaInstallPlatform | null;
  onInstallClick: () => void;
}) {
  const caption = platform ? getPwaSharedCaption(platform) : getPwaSharedCaption('desktop');
  const meta = platform ? platformCardMeta(platform) : null;

  return (
    <>
      <Card className="gap-0 rounded-[10px] shadow-none">
        <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
          <div>
            <CardTitle render={<h2 />} className="text-2xl font-semibold">
              Install <BrandName />
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-foreground">{caption}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <p className="mb-3 text-sm font-semibold">Why install</p>
          <ul className="list-inside list-disc text-sm text-foreground">
            {pwaBenefits.map((line) => (
              <li key={line} className="mt-2 first:mt-0">
                {line}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isInstalled ? (
        <Card className="mt-4 gap-0 rounded-[10px] shadow-none" role="status">
          <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
            <CardTitle className="text-xl font-semibold">Already installed</CardTitle>
            <CardDescription className="mt-1 text-sm text-foreground">
              <BrandName /> is already installed on this device.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : meta ? (
        <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
          <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
            <CardTitle className="text-xl font-semibold">{meta.title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-foreground">
              {meta.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-3 pt-0 sm:px-6">
            <p className="text-sm leading-relaxed text-foreground">{meta.blurb}</p>
            <Button
              type="button"
              size="sm"
              variant="default"
              className={cn(drawerPrimaryButtonClassName, "w-fit")}
              onClick={onInstallClick}
            >
              Install app
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function BookmarkTabContent({ platform }: { platform: PwaInstallPlatform | null }) {
  const bookmarkCard =
    platform === 'ios'
      ? {
          title: 'iPhone & iPad',
          description: 'Safari',
          steps: iosBookmarkSteps,
        }
      : platform === 'android'
        ? {
            title: 'Android',
            description: 'Chrome (recommended)',
            steps: androidBookmarkSteps,
          }
        : platform === 'desktop'
          ? {
              title: 'Desktop & laptop',
              description: 'Chrome, Edge, Safari, or Firefox',
              steps: desktopBookmarkSteps,
            }
          : null;

  return (
    <>
      <Card className="gap-0 rounded-[10px] shadow-none">
        <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
          <div>
            <CardTitle render={<h2 />} className="text-2xl font-semibold">
              Bookmark <BrandName />
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-foreground">
              Save this site in your browser bookmarks or favorites so you can return to the calendar and
              chat without searching again.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <p className="mb-3 text-sm font-semibold">Why bookmark</p>
          <ul className="list-inside list-disc text-sm text-foreground">
            {bookmarkBenefits.map((line) => (
              <li key={line} className="mt-2 first:mt-0">
                {line}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {bookmarkCard ? (
        <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
          <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
            <CardTitle className="text-xl font-semibold">{bookmarkCard.title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-foreground">
              {bookmarkCard.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pt-0 sm:px-6">
            <NumberedInstallList steps={bookmarkCard.steps} />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

const filterQueryKeyRows: { key: string; label: string }[] = [
  { key: 'registration', label: 'Registration' },
  { key: 'lecture', label: 'Lecture' },
  { key: 'short-sem', label: 'Short Semester' },
  { key: 'intersession', label: 'Intersession Classes' },
  { key: 'exam', label: 'Examination' },
  { key: 'other-exam', label: 'Others Exams' },
  { key: 'break', label: 'Break' },
  { key: 'states', label: 'Kedah, Kelantan & Terengganu holidays' },
];

const queryExamples: { url: string; meaning: string }[] = [
  {
    url: '/diploma?B-20263',
    meaning:
      'Applies session B-20263 on Diploma, then the address bar cleans to /diploma.',
  },
  {
    url: '/diploma?B-20263&lecture&exam',
    meaning:
      'Same session, with only Lecture and Examination on; then redirects to the clean Diploma path.',
  },
  {
    url: '/?B-20263&B-20264&break&states',
    meaning:
      'Applies two sessions plus Break and Kedah/Kelantan/Terengganu holidays, then cleans the URL.',
  },
];

function QueryCode({ children }: { children: string }) {
  return (
    <code className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  );
}

function QueryTabContent() {
  return (
    <>
      <Card className="gap-0 rounded-[10px] shadow-none">
        <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
          <div>
            <CardTitle render={<h2 />} className="text-2xl font-semibold">
              Shareable calendar links
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-foreground">
              Build a link with session and filter codes so anyone who opens it gets those choices
              applied automatically.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <p className="mb-3 text-sm font-semibold">How it works</p>
          <ul className="list-inside list-disc text-sm text-foreground">
            <li className="mt-2 first:mt-0">
              While you browse, the address bar stays clean (path only). Session and filter codes are
              not kept visible there after you change settings.
            </li>
            <li className="mt-2">
              To share a view, build a full link yourself: page path + <QueryCode>?</QueryCode>, then
              session and filter codes joined with <QueryCode>&amp;</QueryCode>.
            </li>
            <li className="mt-2">
              When someone opens that link, the calendar applies the codes, then redirects to the clean
              page path. If filter codes are included, only those event types are shown; Countdown stays
              as saved on that device.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
        <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
          <CardTitle className="text-xl font-semibold">What&apos;s in the share link</CardTitle>
          <CardDescription className="mt-1 text-sm text-foreground">
            Session codes come from the session picker; filter codes match the Settings toggles.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-3 pt-0 sm:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Session</p>
            <p className="text-sm leading-relaxed text-foreground">
              Add the session code from the picker, e.g. <QueryCode>A-20264</QueryCode> or{' '}
              <QueryCode>B-20263</QueryCode>. Include more than one to open several sessions at once.
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              Example: <QueryCode>/diploma?B-20263</QueryCode>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Settings filters</p>
            <p className="text-sm leading-relaxed text-foreground">
              Each code turns on the matching Settings toggle. Codes not in the link stay off.
            </p>
            <ul className="flex flex-col gap-2 text-sm text-foreground">
              {filterQueryKeyRows.map((row) => (
                <li key={row.key} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <QueryCode>{row.key}</QueryCode>
                  <span className="text-muted-foreground">→</span>
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Examples</p>
            {queryExamples.map((example) => (
              <div key={example.url} className="flex flex-col gap-1">
                <QueryCode>{example.url}</QueryCode>
                <p className="text-sm leading-relaxed text-foreground">{example.meaning}</p>
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-foreground">
            Build a link with the session and filter codes above (for example{' '}
            <QueryCode>/diploma?B-20263&amp;lecture&amp;exam</QueryCode>), then share that full link.
            When someone opens it, the calendar applies those choices and the address bar cleans itself
            to the normal page path. The same idea works for <QueryCode>/diploma</QueryCode>,{' '}
            <QueryCode>/diploma/list</QueryCode>, and other calendar pages — only the part after{' '}
            <QueryCode>?</QueryCode> sets what is selected and visible before the clean redirect.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={null}>
      <DownloadPageContent />
    </Suspense>
  );
}

type DownloadTab = 'pwa' | 'bookmark' | 'share-link';

const DOWNLOAD_TABS = new Set<string>(['pwa', 'bookmark', 'share-link']);

function parseDownloadTabValue(value: string): DownloadTab | null {
  if (DOWNLOAD_TABS.has(value)) return value as DownloadTab;
  return null;
}

function parseDownloadTab(searchParams: URLSearchParams): DownloadTab {
  if (searchParams.has('share-link')) return 'share-link';
  if (searchParams.has('bookmark')) return 'bookmark';
  if (searchParams.has('pwa')) return 'pwa';

  const legacy = searchParams.get('tab');
  if (legacy === 'bookmark') return 'bookmark';
  if (legacy === 'query' || legacy === 'share-link') return 'share-link';
  return 'pwa';
}

function hasDownloadTabParam(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has('pwa') ||
    searchParams.has('bookmark') ||
    searchParams.has('share-link')
  );
}

function downloadTabHref(tab: DownloadTab): string {
  return `/download?${tab}`;
}

function DownloadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [installOpen, setInstallOpen] = useState(false);
  const isInstalled = usePwaInstalled();
  const platform = usePwaInstallPlatform();
  const { promptInstall } = usePwaInstallPrompt();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const activeTab = parseDownloadTab(searchParams);

  useEffect(() => {
    if (hasDownloadTabParam(searchParams)) return;
    router.replace(downloadTabHref(activeTab), { scroll: false });
  }, [activeTab, router, searchParams]);

  const handleTabChange = useCallback(
    (value: string | number | null) => {
      const tab = typeof value === 'string' ? parseDownloadTabValue(value) : null;
      if (!tab) return;
      router.replace(downloadTabHref(tab), { scroll: false });
    },
    [router]
  );

  const handleInstallClick = useCallback(async () => {
    // iOS has no beforeinstallprompt — show Share / Safari instructions drawer.
    if (platform === 'ios') {
      setInstallOpen(true);
      return;
    }

    // Windows + Android: native browser Install app dialog only (no custom dialog).
    const outcome = await promptInstall();
    if (outcome === 'unavailable') {
      toast.message('Install unavailable', {
        description:
          'Use your browser menu and choose Install app or Add to Home screen.',
      });
    }
  }, [platform, promptInstall]);

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
      <div className="chat-top-fade pointer-events-none absolute top-0 right-0 left-0 z-[9]" />

      <div
        className={`chat-header absolute top-0 right-0 left-0 z-10 px-4 md:px-0 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pt-8 pb-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:opacity-80"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-24 pb-6 md:px-0"
      >
        <div className="mx-auto w-full max-w-[600px]">
          <h1 className="sr-only">Download <BrandName /></h1>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex flex-col gap-4"
          >
            <TabsList className="grid h-10 w-full grid-cols-3">
              <TabsTrigger value="pwa">PWA</TabsTrigger>
              <TabsTrigger value="bookmark">Bookmark</TabsTrigger>
              <TabsTrigger value="share-link">Share link</TabsTrigger>
            </TabsList>

            <TabsContent value="pwa" className="mt-0">
              <PwaTabContent
                isInstalled={isInstalled}
                platform={platform}
                onInstallClick={handleInstallClick}
              />
            </TabsContent>

            <TabsContent value="bookmark" className="mt-0">
              <BookmarkTabContent platform={platform} />
            </TabsContent>

            <TabsContent value="share-link" className="mt-0">
              <QueryTabContent />
            </TabsContent>
          </Tabs>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
              <CardTitle className="text-xl font-semibold">About <BrandName /></CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">
                Learn what this project covers, how the calendar works, and where to send feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-3 pt-0 sm:px-6">
              <Button
                render={<Link href="/about" />}
                nativeButton={false}
                variant="default"
                className="h-[38px] w-fit"
              >
                About
              </Button>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-foreground">Become Our Sponsors</h3>
                <p className="text-sm text-foreground">
                  Support the project and help keep the calendar free for everyone.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    render={
                      <a
                        href="https://shahrulestar.com/sponsor"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                    className="h-[38px] w-full sm:w-auto"
                  >
                    Sponsor
                  </Button>
                  <Button
                    variant="outline"
                    render={
                      <a
                        href="https://github.com/sponsors/shahrulestar"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                    className="h-[38px] w-full sm:w-auto"
                  >
                    Github Sponsor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {platform === 'ios' ? (
        <PwaInstallOverlay open={installOpen} onOpenChange={setInstallOpen} />
      ) : null}
    </div>
  );
}
