export const runtime = 'edge';

import { CalendarWrapper } from '@/components/calendar-wrapper';
import { notFound } from 'next/navigation';
import { isValidProgramRoute, getProgramDisplayName } from '@/lib/route-utils';
import { getProgramCanonicalUrl, getProgramPageTitle, getProgramSeoDescription } from '@/lib/program-seo';
import { SITE_ORIGIN } from '@/lib/page-seo';
import { buildCalendarPageMetadata } from '@/lib/calendar-seo-metadata';
import { PageSeoBlock } from '@/components/page-seo-block';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';


interface ProgramPageProps {
  params: Promise<{
    program: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Generate metadata for program pages
export async function generateMetadata({ params, searchParams }: ProgramPageProps): Promise<Metadata> {
  const { program } = await params;
  
  if (!isValidProgramRoute(program)) {
    return {};
  }

  const sp = await searchParams;
  return buildCalendarPageMetadata({
    pathname: `/${program}`,
    viewMode: 'grid',
    programSlug: program,
    searchParams: sp,
  });
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { program } = await params;
  
  if (!isValidProgramRoute(program)) {
    notFound();
  }

  const programName = getProgramDisplayName(program);
  const canonical = getProgramCanonicalUrl(program);
  const description = getProgramSeoDescription(program);
  const heading = getProgramPageTitle(program);

  return (
    <>
      <PageSeoBlock
        heading={heading}
        description={description}
        url={canonical}
        breadcrumbs={[
          { name: 'Home', item: SITE_ORIGIN },
          { name: programName, item: canonical },
        ]}
      />
      <CalendarWrapper viewMode="grid" programFromRoute={program} />
    </>
  );
}

