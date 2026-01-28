// Export types for use in other components
export type ViewMode = 'list' | 'grid';

import { CalendarWrapper } from '@/components/calendar-wrapper';

// Homepage: All programs, Grid view (default)
export default function Page() {
  return <CalendarWrapper viewMode="grid" programFromRoute="All" />;
}
