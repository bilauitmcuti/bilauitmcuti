import { cookies } from 'next/headers';
import { SharedCalendarLayout } from './shared-calendar-layout';
import { parseFiltersFromCookie } from '@/lib/cookie-utils';
import { loadInitialCalendarSnapshot } from '@/lib/calendar-initial-server';
import type { ViewMode } from '@/app/page';

interface CalendarWrapperProps {
  viewMode: ViewMode;
  programFromRoute: string;
}

/**
 * Get current date in Malaysia timezone (Asia/Kuala_Lumpur)
 * Returns date string in YYYY-MM-DD format
 */
function getMalaysiaCurrentDate(): string {
  try {
    const now = new Date();
    // Convert to Malaysia time (UTC+8)
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const year = malaysiaTime.getFullYear();
    const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
    const day = String(malaysiaTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    // Fallback to UTC if timezone conversion fails
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Server component wrapper that reads filter states from cookies
 * and passes them to SharedCalendarLayout for SSR consistency
 */
export async function CalendarWrapper({ viewMode, programFromRoute }: CalendarWrapperProps) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.get('calendar-filters')?.value || null;
  const initialFilters = parseFiltersFromCookie(cookieString);
  const initialCurrentDate = getMalaysiaCurrentDate();
  const initialCalendar = await loadInitialCalendarSnapshot({
    programFromRoute,
    cookieValue: cookieString,
    currentDateStr: initialCurrentDate,
  });

  return (
    <SharedCalendarLayout 
      viewMode={viewMode} 
      programFromRoute={programFromRoute}
      initialFilters={initialFilters}
      initialCurrentDate={initialCurrentDate}
      initialCalendarSnapshot={initialCalendar.snapshot}
      initialCalendarHydration={
        initialCalendar.programUsed != null && initialCalendar.hydrateKey != null
          ? {
              programUsed: initialCalendar.programUsed,
              hydrateKey: initialCalendar.hydrateKey,
            }
          : null
      }
    />
  );
}
