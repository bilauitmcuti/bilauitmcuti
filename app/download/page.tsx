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
    Open <strong>Safari</strong> and visit <strong>bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong>Share</strong> button (square with arrow up)
  </>,
  <>
    Tap <strong>&ldquo;Add Bookmark&rdquo;</strong>
  </>,
  <>
    Choose a folder (e.g. <strong>Favorites</strong>) and tap <strong>Save</strong>
  </>,
];

const androidBookmarkSteps: ReactNode[] = [
  <>
    Open <strong>Chrome</strong> and visit <strong>bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong>star</strong> icon in the address bar
  </>,
  <>Rename the bookmark if you like, then confirm</>,
  <>
    Tap <strong>Save</strong> or <strong>Done</strong>
  </>,
];

const desktopBookmarkSteps: ReactNode[] = [
  <>
    Press <kbd>Ctrl+D</kbd> (Windows) or <kbd>⌘D</kbd> (Mac), or click the <strong>star</strong> in
    the address bar, then save.
  </>,
  <>
    In Safari (macOS): Bookmarks menu → &ldquo;Add Bookmark&rdquo;, or press <kbd>⌘D</kbd>.
  </>,
  <>Add the bookmark to your bookmarks bar or Favorites for one-click access.</>,
];

function NumberedInstallList({ steps }: { steps: ReactNode[] }) {
  return (
    <ol>
      {steps.map((body, index) => (
        <li key={index}>{body}</li>
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
    <article className="typeset typeset-article">
      <h1>
        Install <BrandName />
      </h1>
      <p>{caption}</p>

      <h2>Why install</h2>
      <ul>
        {pwaBenefits.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {isInstalled ? (
        <>
          <h2>Already installed</h2>
          <p>
            <BrandName /> is already installed on this device.
          </p>
        </>
      ) : meta ? (
        <>
          <h2>{meta.title}</h2>
          <p>{meta.description}</p>
          <p>{meta.blurb}</p>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Button
              type="button"
              size="sm"
              variant="default"
              className={cn(drawerPrimaryButtonClassName, 'w-fit')}
              onClick={onInstallClick}
            >
              Install app
            </Button>
          </div>
        </>
      ) : null}
    </article>
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
    <article className="typeset typeset-article">
      <h1>
        Bookmark <BrandName />
      </h1>
      <p>
        Save this site in your browser bookmarks or favorites so you can return to the calendar and chat
        without searching again.
      </p>

      <h2>Why bookmark</h2>
      <ul>
        {bookmarkBenefits.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {bookmarkCard ? (
        <>
          <h2>{bookmarkCard.title}</h2>
          <p>{bookmarkCard.description}</p>
          <NumberedInstallList steps={bookmarkCard.steps} />
        </>
      ) : null}
    </article>
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
    meaning: 'Applies session B-20263 on Diploma, then the address bar cleans to /diploma.',
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
  return <code>{children}</code>;
}

function QueryTabContent() {
  return (
    <article className="typeset typeset-article">
      <h1>Shareable calendar links</h1>
      <p>
        Build a link with session and filter codes so anyone who opens it gets those choices applied
        automatically.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          While you browse, the address bar stays clean (path only). Session and filter codes are not
          kept visible there after you change settings.
        </li>
        <li>
          To share a view, build a full link yourself: page path + <QueryCode>?</QueryCode>, then
          session and filter codes joined with <QueryCode>&amp;</QueryCode>.
        </li>
        <li>
          When someone opens that link, the calendar applies the codes, then redirects to the clean page
          path. If filter codes are included, only those event types are shown; Countdown stays as saved
          on that device.
        </li>
      </ul>

      <h2>What&apos;s in the share link</h2>
      <p>Session codes come from the session picker; filter codes match the Settings toggles.</p>

      <h3>Session</h3>
      <p>
        Add the session code from the picker, e.g. <QueryCode>A-20264</QueryCode> or{' '}
        <QueryCode>B-20263</QueryCode>. Include more than one to open several sessions at once.
      </p>
      <p>
        Example: <QueryCode>/diploma?B-20263</QueryCode>
      </p>

      <h3>Settings filters</h3>
      <p>Each code turns on the matching Settings toggle. Codes not in the link stay off.</p>
      <ul>
        {filterQueryKeyRows.map((row) => (
          <li key={row.key}>
            <QueryCode>{row.key}</QueryCode> → {row.label}
          </li>
        ))}
      </ul>

      <h3>Examples</h3>
      {queryExamples.map((example) => (
        <p key={example.url}>
          <QueryCode>{example.url}</QueryCode>
          <br />
          {example.meaning}
        </p>
      ))}

      <p>
        Build a link with the session and filter codes above (for example{' '}
        <QueryCode>/diploma?B-20263&amp;lecture&amp;exam</QueryCode>), then share that full link. When
        someone opens it, the calendar applies those choices and the address bar cleans itself to the
        normal page path. The same idea works for <QueryCode>/diploma</QueryCode>,{' '}
        <QueryCode>/diploma/list</QueryCode>, and other calendar pages — only the part after{' '}
        <QueryCode>?</QueryCode> sets what is selected and visible before the clean redirect.
      </p>
    </article>
  );
}

function AboutSponsorSection() {
  return (
    <article className="typeset typeset-article">
      <h2>
        About <BrandName />
      </h2>
      <p>Learn what this project covers, how the calendar works, and where to send feedback.</p>
      <div className="not-typeset mt-[var(--typeset-flow)]">
        <Button
          render={<Link href="/about" />}
          nativeButton={false}
          variant="default"
          className="h-[38px] w-fit"
        >
          About
        </Button>
      </div>

      <h2>Become Our Sponsors</h2>
      <p>Support the project and help keep the calendar free for everyone.</p>
      <div className="not-typeset mt-[var(--typeset-flow)] flex flex-row flex-wrap items-center gap-2">
        <Button
          render={
            <a href="https://shahrulestar.com/sponsor" target="_blank" rel="noopener noreferrer" />
          }
          nativeButton={false}
          className="h-[38px] w-fit"
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
          className="h-[38px] w-fit"
        >
          Github Sponsor
        </Button>
      </div>
    </article>
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
        <div className="mx-auto flex w-full max-w-[600px] flex-col gap-12">
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

          <AboutSponsorSection />
        </div>
      </div>

      {platform === 'ios' ? (
        <PwaInstallOverlay open={installOpen} onOpenChange={setInstallOpen} />
      ) : null}
    </div>
  );
}
