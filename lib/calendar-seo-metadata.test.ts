import { describe, expect, it } from "vitest";
import { buildCalendarPageMetadata } from "./calendar-seo-metadata";

describe("buildCalendarPageMetadata list routes", () => {
  it("uses clean og:url for /list without session query", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: {},
    });
    expect(metadata.openGraph?.url).toBe("https://bilauitmcuti.com/list");
    expect(metadata.alternates?.canonical).toBe("https://bilauitmcuti.com/list");
  });

  it("includes session query in og:url for /list?B-20263", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: { "B-20263": "" },
    });
    expect(metadata.openGraph?.url).toBe("https://bilauitmcuti.com/list?B-20263");
    expect(metadata.alternates?.canonical).toBe("https://bilauitmcuti.com/list");
  });

  it("uses clean og:url for /diploma/list without session query", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/diploma/list",
      viewMode: "list",
      programSlug: "diploma",
      searchParams: {},
    });
    expect(metadata.openGraph?.url).toBe("https://bilauitmcuti.com/diploma/list");
  });

  it("includes session query in og:url for /diploma/list?B-20263&B-20264", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/diploma/list",
      viewMode: "list",
      programSlug: "diploma",
      searchParams: { "B-20263": "", "B-20264": "" },
    });
    expect(metadata.openGraph?.url).toBe(
      "https://bilauitmcuti.com/diploma/list?B-20263&B-20264"
    );
  });

  it("uses list cover image for list viewMode", () => {
    const metadata = buildCalendarPageMetadata({
      pathname: "/list",
      viewMode: "list",
      searchParams: {},
    });
    const images = metadata.openGraph?.images;
    const imageUrl = Array.isArray(images) ? images[0] : images;
    expect(typeof imageUrl === "object" && imageUrl !== null && "url" in imageUrl
      ? imageUrl.url
      : imageUrl).toContain("list-cover.png");
  });
});
