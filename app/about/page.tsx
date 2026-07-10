'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const programsText =
  'Foundation/Professional, Pre-Diploma, Diploma, Diploma (Part-Time), Bachelor, Bachelor (Part-Time), Master, and PhD.';

const featuresText =
  'Grid and list views, activity filters, Group A and Group B sessions, KKT regional dates, countdown to the next activity, light and dark themes, PWA install, and AI chat.';

function AboutBody({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground">{children}</p>;
}

function TextSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {children}
    </div>
  );
}

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
        <div className="mx-auto w-full max-w-[600px]">
          <Card className="gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
              <div>
                <CardTitle render={<h1 />} className="text-2xl font-semibold">
                  About Bila UiTM Cuti
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-foreground">
                  A student-focused web app for checking UiTM academic calendar timelines — registration, lectures,
                  examinations, and semester breaks — in one place.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
              <CardTitle className="text-xl font-semibold">What&apos;s included</CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">
                Built for phones, tablets, and desktop — same experience across grid and list views.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-3 pt-0 sm:px-6">
              <TextSection label="Programs">
                <AboutBody>{programsText}</AboutBody>
              </TextSection>
              <TextSection label="Features">
                <AboutBody>{featuresText}</AboutBody>
              </TextSection>
              <AboutBody>
                For feedback, bug reports, or suggestions, send them through the{' '}
                <Link href="/feedback" className="text-primary underline-offset-4 hover:underline">
                  feedback page
                </Link>
                .
              </AboutBody>
            </CardContent>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
              <CardTitle className="text-xl font-semibold">AI assistant</CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">
                Ask about dates, breaks, exams, and program context.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-3 pt-0 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">English</Badge>
                <Badge variant="secondary">Malay</Badge>
                <Badge variant="outline">Cloudflare Workers AI</Badge>
              </div>
              <AboutBody>
                The chat assistant explains schedule context based on your selected program and can answer general UiTM
                questions. Answers may be incomplete or outdated.
              </AboutBody>
              <AboutBody>
                Always confirm critical dates and deadlines with official UiTM announcements before making academic
                decisions.
              </AboutBody>
            </CardContent>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
              <CardTitle className="text-xl font-semibold">Terms and conditions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-3 pt-0 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Best effort</Badge>
                <Badge variant="outline">Educational use</Badge>
              </div>
              <AboutBody>
                By using Bila UiTM Cuti, you agree that all information is provided on a best-effort basis for
                educational and informational use only. We do not guarantee completeness, accuracy, or uninterrupted
                availability at all times.
              </AboutBody>
              <AboutBody>
                You are responsible for verifying any date, deadline, or academic requirement with official UiTM
                channels before taking action. The app owner is not liable for direct or indirect loss caused by
                reliance on unofficial or outdated schedule information.
              </AboutBody>
              <AboutBody>
                We may update features, content, and terms without prior notice. Continued use after updates indicates
                acceptance of the revised terms.
              </AboutBody>
            </CardContent>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 px-3 pb-4 sm:px-6">
              <CardTitle className="text-xl font-semibold">Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-3 pt-0 sm:px-6">
              <Badge variant="destructive">Not affiliated with UiTM</Badge>
              <AboutBody>
                This app is not affiliated with Universiti Teknologi MARA (UiTM). It is created for educational and
                informational purposes only. Please verify important dates directly with official UiTM sources.
              </AboutBody>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
