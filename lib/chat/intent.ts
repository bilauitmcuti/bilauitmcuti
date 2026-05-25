import { CHAT_LONG_MESSAGE_THRESHOLD_CHARS } from "@/lib/chat/limits";

const PUBLIC_HOLIDAY_KEYWORDS = [
  "public holiday",
  "cuti umum",
  "cuti awam",
  "cuti kebangsaan",
  "hari kelepasan",
  "kelepasan am",
  "cuti negeri",
];

const CALENDAR_STRONG_KEYWORDS = [
  "cuti",
  "semester",
  "peperiksaan",
  "exam",
  "tarikh",
  "date",
  "break",
  "kuliah",
  "lecture",
  "pendaftaran",
  "registration",
  "minggu ulangkaji",
  "revision",
  "gugur taraf",
  "group a",
  "group b",
  "kumpulan",
  "jadual",
  "schedule",
  "hari raya",
  "aidil",
  "short semester",
  "intersession classes",
  "penangguhan",
  "deferment",
  "tempoh",
  "permohonan",
];

const CALENDAR_AMBIGUOUS_KEYWORDS = [
  "class",
  "classes",
  "lectures",
  "yuran",
  "fee",
  "bila",
  "when",
  "mds",
];

const GENERAL_UITM_INFO_KEYWORDS = [
  "kampus",
  "campus",
  "fakulti",
  "faculty",
  "program",
  "course",
  "courses",
  "subjek",
  "subject",
  "subjects",
  "admission",
  "intake",
  "syarat",
  "requirement",
  "requirements",
  "scholarship",
  "biasiswa",
  "gred",
  "grade",
  "yuran pengajian",
  "yuran kolej",
  "bilik berdua",
  "bilik bertiga",
  "bilik berempat",
  "barang elektrik",
];

const UITM_SUPPLEMENT_KEYWORDS = [
  "gred",
  "grade",
  "lulus (lu)",
  "gagal (ga)",
  "yuran pengajian",
  "yuran kolej",
  "bilik berdua",
  "bilik bertiga",
  "bilik berempat",
  "barang elektrik",
  "senarai yuran",
  "yuran diploma",
  "yuran degree",
  "yuran ijazah",
  "tuition fee",
  "college fee",
  "hostel fee",
  "berapa yuran",
  "exam grade",
  "peperiksaan gred",
];

const CALENDAR_INTENT_HINTS = [
  "mula",
  "start",
  "akhir",
  "end",
  "next",
  "upcoming",
  "seterusnya",
  "akan datang",
  "lepas ni",
  "current",
  "sekarang",
  "tarikh",
  "date",
  "jadual",
  "schedule",
  "cuti",
  "semester",
  "exam",
  "peperiksaan",
  "registration",
  "pendaftaran",
  "bila",
  "when",
  "tempoh",
  "penangguhan",
  "deferment",
  "berkaitan",
  "related",
];

const SCHEDULE_DATE_PHRASES = /\b(bila|when|tarikh|date|tempoh|ada tarikh)\b/i;
const FEE_CALENDAR_PHRASES =
  /\b(yuran|fee|fees|bayaran|pembayaran|penangguhan|deferment|gt\b|rpgt)\b/i;

export function isPublicHolidayQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  if (PUBLIC_HOLIDAY_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  if (/\b(cuti|holiday)\b/.test(lower) && /\b(malaysia|negeri|state|umum|awam)\b/.test(lower)) {
    return true;
  }
  return false;
}

export function isCalendarQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  if (isPublicHolidayQuestion(message)) return true;
  if (CALENDAR_STRONG_KEYWORDS.some((kw) => lower.includes(kw))) return true;

  if (SCHEDULE_DATE_PHRASES.test(lower) && FEE_CALENDAR_PHRASES.test(lower)) {
    return true;
  }

  const hasAmbiguousKeyword = CALENDAR_AMBIGUOUS_KEYWORDS.some((kw) =>
    lower.includes(kw)
  );
  if (!hasAmbiguousKeyword) return false;

  const hasGeneralUitmIntent = GENERAL_UITM_INFO_KEYWORDS.some((kw) =>
    lower.includes(kw)
  );
  if (hasGeneralUitmIntent) return false;

  return CALENDAR_INTENT_HINTS.some((kw) => lower.includes(kw));
}

const COMPARE_KEYWORDS = [
  "compare",
  "comparison",
  "difference",
  "different",
  "vs",
  "versus",
  "bezakan",
  "beza",
  "perbandingan",
  "banding",
];

export function isComparisonQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return COMPARE_KEYWORDS.some((kw) => lower.includes(kw));
}

const TABLE_FORMAT_KEYWORDS = [
  "table",
  "jadual",
  "in table",
  "into table",
  "as table",
  "tabular",
  "format table",
  "write table",
  "list in table",
  "show in table",
  "bentuk jadual",
  "dalam jadual",
  "dalam bentuk jadual",
  "senarai jadual",
];

export function isTableFormatRequested(message: string): boolean {
  const lower = message.toLowerCase();
  return TABLE_FORMAT_KEYWORDS.some((kw) => lower.includes(kw));
}

export const TABLE_OUTPUT_RULE =
  "\n\nTABLE OUTPUT RULE (MANDATORY): The user asked for a table. Put the schedule or comparison inside a [TABLE]...[/TABLE] block only. Format:\n[TABLE]\n| Activity | Date |\n| --- | --- |\n| (event name) | (date or range) |\n[/TABLE]\nRules: First row inside [TABLE] MUST be real column headers (e.g. Activity, Date)—NOT a group title. Put group/program title as ONE plain-text line immediately BEFORE [TABLE]. Use pipe | between columns. Do NOT output raw markdown tables outside [TABLE]. For session comparisons, first column = session id + label. Sort data rows by date ascending (earliest first) unless the user asked for latest first.";

export function isSimpleCalendarQuestion(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const simpleHints = [
    "when",
    "bila",
    "tarikh",
    "date",
    "next",
    "seterusnya",
    "mula",
    "start",
    "end",
    "akhir",
    "cuti",
    "break",
    "exam",
    "peperiksaan",
  ];
  const hasSimpleHint = simpleHints.some((kw) => lower.includes(kw));
  return hasSimpleHint && lower.length <= 120;
}

/** Long user input — allow a larger completion budget. */
export function messageIsLong(message: string): boolean {
  return message.trim().length > CHAT_LONG_MESSAGE_THRESHOLD_CHARS;
}

export function messageAsksDetail(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("explain") ||
    lower.includes("why") ||
    lower.includes("how") ||
    lower.includes("detail") ||
    lower.includes("huraikan") ||
    lower.includes("jelaskan") ||
    lower.includes("full") ||
    lower.includes("complete") ||
    lower.includes("lengkap") ||
    lower.includes("semua") ||
    lower.includes("list all") ||
    lower.includes("senarai")
  );
}

/** User explicitly asks about the other academic group (A vs B). */
export function needsSecondaryGroupContext(
  message: string,
  primaryGroup: "A" | "B"
): boolean {
  const lower = message.toLowerCase();
  if (lower.includes("group a") || lower.includes("kumpulan a")) return true;
  if (lower.includes("group b") || lower.includes("kumpulan b")) return true;
  const other = primaryGroup === "A" ? "b" : "a";
  if (lower.includes(`group ${other}`) || lower.includes(`kumpulan ${other}`)) return true;
  if (
    primaryGroup === "A" &&
    (lower.includes("march") ||
      lower.includes("ogos") ||
      lower.includes("august") ||
      lower.includes("pre-diploma") ||
      lower.includes("diploma"))
  ) {
    return true;
  }
  if (
    primaryGroup === "B" &&
    (lower.includes("december") ||
      lower.includes("disember") ||
      lower.includes("foundation") ||
      lower.includes("professional"))
  ) {
    return true;
  }
  return isComparisonQuestion(message);
}

/** Force uitm-info.json into calendar prompts for grades and study-fee questions. */
export function needsUitmKnowledgeSupplement(message: string): boolean {
  const lower = message.toLowerCase();
  return UITM_SUPPLEMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Per-turn hints so the model maps synonyms (e.g. Fee Deferment ↔ penangguhan yuran). */
export function getCalendarUnderstandingDirective(message: string): string {
  const lower = message.toLowerCase();
  const feeRelated =
    /\b(yuran|fee|deferment|penangguhan|gt\b|gt2|rpgt|bayaran|pembayaran)\b/.test(
      lower
    );
  if (!feeRelated) return "";

  const wantsList =
    lower.includes("berkaitan") ||
    lower.includes("related") ||
    lower.includes("semua") ||
    lower.includes("list") ||
    lower.includes("senarai") ||
    lower.includes("tempoh") ||
    lower.includes("permohonan");

  let directive =
    "\n\nTHIS TURN — FEE/DEFERMENT: Treat Online Fee Deferment, fee deferment, and penangguhan pembayaran yuran as the same topic. Use every matching row in the calendar context (including Tarikh Akhir … Penangguhan …, keputusan, diluluskan penangguhan, GT/RPGT yuran lines). Do not say data is unavailable if any such row appears in context.";

  if (wantsList) {
    directive +=
      " List each related activity with its date (and end date if present), oldest to newest.";
  } else {
    directive += " Answer the specific deadline or tempoh asked; if only tarikh akhir exists, state those dates clearly.";
  }

  return directive;
}

export function getCompletionInstruction(
  isSimple: boolean,
  asksDetail: boolean
): string {
  if (isSimple) {
    return "\n\nKeep the reply to 1–3 sentences with the date. No planning or checklists in the output.";
  }
  if (asksDetail) {
    return "\n\nIMPORTANT: Finish every sentence and paragraph completely—never stop mid-thought or mid-list. Use enough length to answer fully without truncating.";
  }
  return "\n\nIMPORTANT: Be concise but complete. Finish every sentence; avoid filler and unrelated calendar items.";
}
