import { describe, expect, it } from "vitest";
import {
  getProgramFromRoute,
  getRoutePath,
  isProgramValue,
  resolveProgramFromPathAndProps,
} from "@/lib/route-utils";

describe("route-utils", () => {
  it("maps route slugs to program values", () => {
    expect(getProgramFromRoute("diploma")).toBe("Diploma");
    expect(getProgramFromRoute("foundation-professional")).toBe("Foundation/Professional");
    expect(getProgramFromRoute(null)).toBe("All");
  });

  it("validates program values", () => {
    expect(isProgramValue("Diploma")).toBe(true);
    expect(isProgramValue("NotAProgram")).toBe(false);
  });

  it("builds grid and list paths for every program slug", () => {
    const cases: Array<[string, string, string]> = [
      ["foundation-professional", "/foundation-professional", "/foundation-professional/list"],
      ["pre-diploma", "/pre-diploma", "/pre-diploma/list"],
      ["diploma", "/diploma", "/diploma/list"],
      ["diploma-part-time", "/diploma-part-time", "/diploma-part-time/list"],
      ["bachelor", "/bachelor", "/bachelor/list"],
      ["bachelor-part-time", "/bachelor-part-time", "/bachelor-part-time/list"],
      ["master", "/master", "/master/list"],
      ["phd", "/phd", "/phd/list"],
    ];

    for (const [slug, gridPath, listPath] of cases) {
      const program = getProgramFromRoute(slug);
      expect(getRoutePath(program, "grid")).toBe(gridPath);
      expect(getRoutePath(program, "list")).toBe(listPath);
    }

    expect(getRoutePath("All", "grid")).toBe("/");
    expect(getRoutePath("All", "list")).toBe("/list");
  });

  it("resolves program from pathname with route prop fallback", () => {
    expect(resolveProgramFromPathAndProps("/master/list", "diploma")).toBe("Master");
    expect(resolveProgramFromPathAndProps("/", "bachelor")).toBe("Bachelor");
    expect(resolveProgramFromPathAndProps("/list", "phd")).toBe("PhD");
  });
});
