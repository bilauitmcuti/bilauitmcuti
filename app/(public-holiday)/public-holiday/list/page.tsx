import { PublicHolidayWrapper } from "@/components/public-holiday-wrapper";

export const runtime = "edge";

export default function PublicHolidayListPage() {
  return <PublicHolidayWrapper viewMode="list" routeKey="" />;
}
