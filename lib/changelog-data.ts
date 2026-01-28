export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  details: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    date: '2026-01-28',
    title: 'Calendar Layout & State Management Refactor',
    details: [
      'Replaced SharedCalendarLayout with CalendarWrapper across multiple pages for better modularity.',
      'Enhanced filter state management by synchronizing localStorage and cookies for SSR consistency.',
      'Updated MiniCalendar component to accept initialCurrentDate for accurate date handling.',
      'Improved date filtering logic to include additional criteria for examination activities.',
      'Adjusted styles in calendar controls and select components for better alignment and visibility.'
    ]
  },
  {
    date: '2026-01-27',
    title: 'Theme Switching & UI Consistency Improvements',
    details: [
      'Disabled transitions for instant theme changes across all components.',
      'Updated CSS variables for dark and light themes to ensure proper color application.',
      'Refactored layout and component styles to use theme-aware classes.',
      'Improved hydration handling to prevent flickering during theme changes.',
      'Added theme toggle functionality in the calendar controls.',
      'Implemented routing based on program and calendar view.',
      'Fixed color inconsistencies between light and dark themes.'
    ]
  },
  {
    date: '2026-01-24',
    title: 'Calendar Grid Fix & Product Hunt Launch',
    details: [
      'Fixed calendar grid not displaying the full break range correctly.',
      'Added month indicators for Group A and B so users can see the accurate start and end break timeline.',
      'Published on Product Hunt: https://www.producthunt.com/products/bila-uitm-cuti'
    ]
  },
  {
    date: '2026-01-23',
    title: 'Initial Web App Release',
    details: [
      'Published the web app.',
      'Added program-based filtering.',
      'Added calendar layouts: 2×2 grid on desktop, vertical view on mobile, and list view.',
      'Implemented settings panel to filter events.',
      'Added regional holiday flag filter.',
      'Improved PWA background styling.',
      'Fixed UI padding for calendar and list views.',
      'Fixed settings button styling.'
    ]
  }
];
