'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BrandName } from '@/components/brand-name';

const programsText =
  'Foundation/Professional, Pre-Diploma, Diploma, Diploma (Part-Time), Bachelor, Bachelor (Part-Time), Master, and PhD.';

const featuresText =
  'Grid and list views, activity filters, Group A and Group B sessions, KKT regional dates, countdown to the next activity, light and dark themes, PWA install, and AI chat.';

export default function AboutPage() {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

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
      <div className="chat-top-fade pointer-events-none absolute left-0 right-0 top-0 z-[9]" />

      <div
        className={`chat-header absolute left-0 right-0 top-0 z-10 px-4 md:px-0 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pb-3 pt-8">
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
        className="flex-1 overflow-y-auto px-4 pb-6 pt-24 md:px-0"
      >
        <article className="typeset typeset-article mx-auto w-full max-w-[600px]">
          <h1>
            About <BrandName />
          </h1>
          <p>
            A student-focused web app for checking UiTM academic calendar timelines — registration, lectures,
            examinations, and semester breaks — in one place.
          </p>

          <h2>What&apos;s included</h2>
          <p>Built for phones, tablets, and desktop — same experience across grid and list views.</p>
          <h3>Programs</h3>
          <p>{programsText}</p>
          <h3>Features</h3>
          <p>{featuresText}</p>
          <p>
            For feedback, bug reports, or suggestions, send them through the{' '}
            <Link href="/feedback">feedback page</Link>.
          </p>

          <h2>AI assistant</h2>
          <p>Ask about dates, breaks, exams, and program context.</p>
          <div className="not-typeset mt-[var(--typeset-flow)] flex flex-wrap gap-2">
            <Badge variant="secondary">English</Badge>
            <Badge variant="secondary">Malay</Badge>
            <Badge variant="outline">Cloudflare Workers AI</Badge>
          </div>
          <p>
            The chat assistant explains schedule context based on your selected program and can answer general UiTM
            questions. Answers may be incomplete or outdated.
          </p>
          <p>
            Always confirm critical dates and deadlines with official UiTM announcements before making academic
            decisions.
          </p>

          <h2>Terms and conditions</h2>
          <div className="not-typeset mt-[var(--typeset-flow)] flex flex-wrap gap-2">
            <Badge variant="outline">Best effort</Badge>
            <Badge variant="outline">Educational use</Badge>
          </div>
          <p>
            By using <BrandName />, you agree that all information is provided on a best-effort basis for educational
            and informational use only. We do not guarantee completeness, accuracy, or uninterrupted availability at
            all times.
          </p>
          <p>
            You are responsible for verifying any date, deadline, or academic requirement with official UiTM channels
            before taking action. The app owner is not liable for direct or indirect loss caused by reliance on
            unofficial or outdated schedule information.
          </p>
          <p>
            We may update features, content, and terms without prior notice. Continued use after updates indicates
            acceptance of the revised terms.
          </p>

          <h2>Disclaimer</h2>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Badge variant="destructive">Not affiliated with UiTM</Badge>
          </div>
          <p>
            This app is not affiliated with Universiti Teknologi MARA (UiTM). It is created for educational and
            informational purposes only. Please verify important dates directly with official UiTM sources.
          </p>
        </article>
      </div>
    </div>
  );
}
