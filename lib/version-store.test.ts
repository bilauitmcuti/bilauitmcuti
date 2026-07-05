import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUILD_ACK_KEY,
  evaluateVersionCheck,
  getDocumentLoadedBuildId,
  getVersionSnapshot,
  notifyNewBuildForTests,
  resetVersionStoreForTests,
  startVersionPolling,
  stopVersionPolling,
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

    it("prefers client bundle over meta when they differ (direct /chat vs cached HTML)", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, NEXT_PUBLIC_BUILD_ID: "build-client" },
      });

      expect(getDocumentLoadedBuildId()).toBe("build-client");
    });

    it("freezes the first resolved build id for the page session", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, NEXT_PUBLIC_BUILD_ID: "build-a" },
      });

      expect(getDocumentLoadedBuildId()).toBe("build-a");

      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, NEXT_PUBLIC_BUILD_ID: "build-b" },
      });
      metaContent = "build-b";
      expect(getDocumentLoadedBuildId()).toBe("build-a");
    });

    it("falls back to meta tag when client bundle and bootstrap are empty", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, NEXT_PUBLIC_BUILD_ID: "" },
      });
      vi.stubGlobal("window", { __APP_BUILD_ID__: "" });

      expect(getDocumentLoadedBuildId()).toBe("build-a");
    });

    it("falls back to window bootstrap before meta", () => {
      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, NEXT_PUBLIC_BUILD_ID: "" },
      });
      vi.stubGlobal("window", { __APP_BUILD_ID__: "build-bootstrap" });

      expect(getDocumentLoadedBuildId()).toBe("build-bootstrap");
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

  describe("startVersionPolling", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    beforeEach(() => {
      resetVersionStoreForTests();
      vi.stubGlobal("process", {
        ...process,
        env: { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_BUILD_ID: "build-a" },
      });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ buildId: "build-a" }),
      }));
      vi.stubGlobal("document", {
        visibilityState: "visible",
        addEventListener,
        removeEventListener,
        querySelector: () => ({
          getAttribute: () => "build-a",
        }),
      });
    });

    it("registers visibility listener only once across repeated calls", () => {
      startVersionPolling();
      startVersionPolling();

      expect(addEventListener).toHaveBeenCalledTimes(1);
      expect(addEventListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    });

    it("stopVersionPolling clears listener and hides banner", () => {
      startVersionPolling();
      notifyNewBuildForTests("build-b");

      expect(getVersionSnapshot().isVisible).toBe(true);

      stopVersionPolling();

      expect(getVersionSnapshot().isVisible).toBe(false);
      expect(removeEventListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    });
  });
});
