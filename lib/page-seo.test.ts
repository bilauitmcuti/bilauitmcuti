import { describe, expect, it } from "vitest";
import {
  buildSiteNavigationSchemaElements,
  CHAT_SEO_DESCRIPTION,
  CHAT_SEO_TITLE,
  HOMEPAGE_SEO_DESCRIPTION,
  SITE_ORIGIN,
} from "./page-seo";

describe("buildSiteNavigationSchemaElements", () => {
  it("includes homepage, all program grid routes, and chat with Malay descriptions", () => {
    const parts = buildSiteNavigationSchemaElements();
    const urls = parts.map((p) => p.url);
    expect(urls[0]).toBe(SITE_ORIGIN);
    expect(urls).toContain(`${SITE_ORIGIN}/chat`);
    expect(urls).toContain(`${SITE_ORIGIN}/bachelor`);

    const home = parts.find((p) => p.url === SITE_ORIGIN);
    expect(home?.description).toBe(HOMEPAGE_SEO_DESCRIPTION);

    const chat = parts.find((p) => p.url === `${SITE_ORIGIN}/chat`);
    expect(chat?.name).toBe(CHAT_SEO_TITLE);
    expect(chat?.description).toBe(CHAT_SEO_DESCRIPTION);
  });
});
