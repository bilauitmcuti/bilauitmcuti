import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILD_ACK_KEY,
  evaluateVersionCheck,
  getDocumentLoadedBuildId,
  getVersionSnapshot,
  notifyNewBuildForTests,
  resetVersionStoreForTests,
} from "@/lib/version-store";

describe("version-store", () => {
  afterEach(() => {
    resetVersionStoreForTests();
    vi.unstubAllGlobals();
  });

  describe("evaluateVersionCheck", () => {
    it("returns skip when loaded or server build id is missing", () => {
      expect(
        evaluateVersionCheck({
          loadedBuildId: "",
          serverBuildId: "123",
          ackBuildId: null,
        })
      ).toBe("skip");
      expect(
        evaluateVersionCheck({
          loadedBuildId: "123",
          serverBuildId: "",
          ackBuildId: null,
        })
      ).toBe("skip");
    });

    it("returns same when build ids match", () => {
      expect(
        evaluateVersionCheck({
          loadedBuildId: "build-a",
          serverBuildId: "build-a",
          ackBuildId: null,
        })
      ).toBe("same");
    });

    it("returns acknowledged when session ack matches server build", () => {
      expect(
        evaluateVersionCheck({
          loadedBuildId: "build-a",
          serverBuildId: "build-b",
          ackBuildId: "build-b",
        })
      ).toBe("acknowledged");
    });

    it("returns new when server build differs from loaded build", () => {
      expect(
        evaluateVersionCheck({
          loadedBuildId: "build-a",
          serverBuildId: "build-b",
          ackBuildId: null,
        })
      ).toBe("new");
    });
  });

  describe("getDocumentLoadedBuildId", () => {
    let metaContent = "build-a";

    beforeEach(() => {
      resetVersionStoreForTests();
      metaContent = "build-a";
      vi.stubGlobal("document", {
        querySelector: (selector: string) => {
          if (selector !== 'meta[name="app-build-id"]') return null;
          return {
            getAttribute: (name: string) => (name === "content" ? metaContent : null),
          };
        },
      });
    });

    it("reads meta tag once and caches the value for the page session", () => {
      expect(getDocumentLoadedBuildId()).toBe("build-a");

      metaContent = "build-b";
      expect(getDocumentLoadedBuildId()).toBe("build-a");
    });
  });

  describe("notifyNewBuild", () => {
    beforeEach(() => {
      resetVersionStoreForTests();
    });

    it("shows banner and resets countdown when a new build is detected", () => {
      notifyNewBuildForTests("build-b");

      expect(getVersionSnapshot()).toEqual({
        isVisible: true,
        countdown: 5,
      });
    });

    it("does not duplicate banner state for the same pending build", () => {
      notifyNewBuildForTests("build-b");
      notifyNewBuildForTests("build-b");

      expect(getVersionSnapshot()).toEqual({
        isVisible: true,
        countdown: 5,
      });
    });
  });

  it("exports stable session storage key", () => {
    expect(BUILD_ACK_KEY).toBe("app-build-ack");
  });
});
