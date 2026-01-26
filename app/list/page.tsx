import { SharedCalendarLayout } from '@/components/shared-calendar-layout';

// All programs, List view
export default function ListPage() {
  return <SharedCalendarLayout viewMode="list" programFromRoute="All" />;
}
