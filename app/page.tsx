// Export types for use in other components
export type ViewMode = 'list' | 'grid';

import { SharedCalendarLayout } from '@/components/shared-calendar-layout';

// Homepage: All programs, Grid view (default)
export default function Page() {
  return <SharedCalendarLayout viewMode="grid" programFromRoute="All" />;
}
