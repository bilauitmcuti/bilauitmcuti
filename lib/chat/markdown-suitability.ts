import { isMarkdownTableSeparator, isPipeTableRow } from "@/lib/format-ai-table";

const HEADING_RE = /^#{1,6}\s/m;
const BULLET_RE = /^\s*[-*+]\s/m;
const ORDERED_RE = /^\s*\d+[.)]\s/m;
const TABLE_TAG_RE = /\[TABLE\]/i;

/** Detects a GitHub-style pipe table (header row followed by a separator row). */
function hasPipeTable(content: string): boolean {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i + 1 < lines.length; i++) {
    if (isPipeTableRow(lines[i]) && isMarkdownTableSeparator(lines[i + 1])) {
      return true;
    }
  }
  return false;
}

/**
 * Whether an assistant reply contains markdown structure (headings, lists, or
 * tables) worth rendering with the MarkdownRenderer. Plain 1-3 sentence prose
 * answers return false and are shown as plain text.
 */
export function shouldUseMarkdownRenderer(content: string): boolean {
  return (
    TABLE_TAG_RE.test(content) ||
    HEADING_RE.test(content) ||
    BULLET_RE.test(content) ||
    ORDERED_RE.test(content) ||
    hasPipeTable(content)
  );
}

/** Unwrap server-side [TABLE]...[/TABLE] blocks into plain GFM pipe tables. */
export function contentToMarkdown(content: string): string {
  return content.replace(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/gi, (_, body) =>
    String(body).trim()
  );
}
