import { SharedCalendarLayout } from '@/components/shared-calendar-layout';
import { notFound } from 'next/navigation';
import { isValidProgramRoute } from '@/lib/route-utils';

interface ProgramListPageProps {
  params: Promise<{
    program: string;
  }>;
}

// Program-specific List views
export default async function ProgramListPage({ params }: ProgramListPageProps) {
  const { program } = await params;
  
  // Validate route
  if (!isValidProgramRoute(program)) {
    notFound();
  }
  
  return <SharedCalendarLayout viewMode="list" programFromRoute={program} />;
}
