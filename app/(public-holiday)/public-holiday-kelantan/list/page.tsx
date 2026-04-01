import { PublicHolidayWrapper } from '@/components/public-holiday-wrapper';

export const runtime = 'edge';

export default function PublicHolidayStateListPage() {
  return <PublicHolidayWrapper viewMode='list' routeKey='kelantan' />;
}

