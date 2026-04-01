import { PublicHolidayWrapper } from '@/components/public-holiday-wrapper';

export const runtime = 'edge';

export default function PublicHolidayStatePage() {
  return <PublicHolidayWrapper viewMode='grid' routeKey='selangor' />;
}

