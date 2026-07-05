import { describe, it, expect } from "vitest";
import {
  shouldUseMarkdownRenderer,
  contentToMarkdown,
} from "@/lib/chat/markdown-suitability";

describe("shouldUseMarkdownRenderer", () => {
  it("returns false for short prose answers", () => {
    expect(
      shouldUseMarkdownRenderer("Peperiksaan Akhir bermula pada 15-10-2025.")
    ).toBe(false);
  });

  it("returns false for multi-sentence prose without markers", () => {
    expect(
      shouldUseMarkdownRenderer(
        "Minggu ulangkaji bermula minggu depan. Ia membantu pelajar bersedia sebelum peperiksaan."
      )
    ).toBe(false);
  });

  it("detects headings", () => {
    expect(
      shouldUseMarkdownRenderer("## Kenapa penting\nIa membantu ulangkaji.")
    ).toBe(true);
  });

  it("detects bullet lists", () => {
    expect(
      shouldUseMarkdownRenderer("Tips:\n- Fokus subjek berat\n- Rehat cukup")
    ).toBe(true);
  });

  it("detects numbered lists", () => {
    expect(
      shouldUseMarkdownRenderer("Langkah:\n1. Daftar dulu\n2. Bayar yuran")
    ).toBe(true);
  });

  it("detects [TABLE] blocks", () => {
    expect(
      shouldUseMarkdownRenderer(
        "[TABLE]\n| Activity | Date |\n| --- | --- |\n| Cuti | 01-01-2026 |\n[/TABLE]"
      )
    ).toBe(true);
  });

  it("detects raw pipe tables without the tag", () => {
    expect(
      shouldUseMarkdownRenderer(
        "| Activity | Date |\n| --- | --- |\n| Cuti | 01-01-2026 |"
      )
    ).toBe(true);
  });
});

describe("contentToMarkdown", () => {
  it("unwraps [TABLE] blocks into plain GFM tables", () => {
    const input =
      "Senarai cuti:\n[TABLE]\n| Activity | Date |\n| --- | --- |\n| Cuti | 01-01-2026 |\n[/TABLE]";
    const out = contentToMarkdown(input);
    expect(out).not.toContain("[TABLE]");
    expect(out).not.toContain("[/TABLE]");
    expect(out).toContain("| Activity | Date |");
    expect(out).toContain("| Cuti | 01-01-2026 |");
  });

  it("leaves plain content unchanged", () => {
    const input = "Peperiksaan bermula 15-10-2025.";
    expect(contentToMarkdown(input)).toBe(input);
  });
});
