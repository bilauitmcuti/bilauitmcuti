import { PublicHolidayWrapper } from "@/components/public-holiday-wrapper";

export const runtime = "edge";

export default function PublicHolidayFederalListPage() {
  return <PublicHolidayWrapper viewMode="list" routeKey="federal" />;
}
