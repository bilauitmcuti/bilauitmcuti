import { SharedCalendarLayout } from '@/components/shared-calendar-layout';
import { notFound } from 'next/navigation';
import { isValidProgramRoute } from '@/lib/route-utils';

interface ProgramPageProps {
  params: Promise<{
    program: string;
  }>;
}

// Program-specific Grid views
export default async function ProgramPage({ params }: ProgramPageProps) {
  const { program } = await params;
  
  // Validate route
  if (!isValidProgramRoute(program)) {
    notFound();
  }
  
  return <SharedCalendarLayout viewMode="grid" programFromRoute={program} />;
}
