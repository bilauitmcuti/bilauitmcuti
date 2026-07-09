import type { MatchedActivity } from "@/lib/chat/activity-match";
import type { ChatToolName } from "@/lib/chat/agent/types";
import { detectUserLanguage, type UserLanguageMode } from "@/lib/chat-language";
import type { ChatTopic } from "@/lib/chat/topic-router";

export const MIN_REASONING_WORDS = 15;
export const MAX_REASONING_WORDS = 40;

const FORBIDDEN_STATUS_TERMS =
  /\b(function calling|tool calls?|rag\b|embeddings?|vector search|loading data|internal apis?|composing answer|chain of thought|reasoning process|prefetch|prompts?)\b/i;

export type ReasoningPhase = "start" | "progress" | "final" | "retry";
export type LangBucket = "en" | "malay";

function langBucket(mode: UserLanguageMode): LangBucket {
  return mode === "malay" ? "malay" : "en";
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickProgressPhrase(pool: readonly string[], seed: string): string {
  if (pool.length === 0) return "";
  if (pool.length === 1) return pool[0]!;
  return pool[hashSeed(seed) % pool.length]!;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

function clampWords(text: string, min = MIN_REASONING_WORDS, max = MAX_REASONING_WORDS): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length <= max && words.length >= min) return cleaned;
  if (words.length > max) {
    const trimmed = words.slice(0, max).join(" ");
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }
  return cleaned;
}

function isValidParagraph(text: string): boolean {
  const words = wordCount(text);
  return (
    words >= MIN_REASONING_WORDS &&
    words <= MAX_REASONING_WORDS &&
    !FORBIDDEN_STATUS_TERMS.test(text)
  );
}

function isStudentFocusedMessage(message: string): boolean {
  return /\b(pelajar|student|yuran|fee|fees|daftar|register|kampus|campus|asrama|hostel|biasiswa|scholarship|pendaftaran|semester intake)\b/i.test(
    message
  );
}

type TopicFocus =
  | "matched_activity"
  | "lecture_weeks"
  | "public_holiday"
  | "uitm_only"
  | "uitm_calendar"
  | "multi_session"
  | "student"
  | "academic_calendar";

function resolveTopicFocus(input: {
  message: string;
  topics: ChatTopic[];
  hasMatchedActivity: boolean;
  sessionCount: number;
}): TopicFocus {
  if (input.hasMatchedActivity) return "matched_activity";
  if (isStudentFocusedMessage(input.message) && input.topics.includes("uitm_general")) {
    return "student";
  }
  if (input.topics.includes("lecture_weeks")) return "lecture_weeks";
  if (input.topics.includes("public_holiday")) return "public_holiday";
  if (input.topics.includes("uitm_general") && !input.topics.includes("academic_calendar")) {
    return "uitm_only";
  }
  if (input.topics.includes("uitm_general")) return "uitm_calendar";
  if (input.sessionCount > 1) return "multi_session";
  return "academic_calendar";
}

function programPhrase(programLabel: string, lang: LangBucket): string {
  if (programLabel === "All") {
    return lang === "malay" ? "semua program" : "all programmes";
  }
  return lang === "malay" ? `program ${programLabel}` : `the ${programLabel} programme`;
}

function sessionPhrase(sessionCount: number, lang: LangBucket): string {
  if (lang === "malay") return `${sessionCount} sesi`;
  return sessionCount === 1 ? "one session" : `${sessionCount} sessions`;
}

const PARAGRAPH_POOLS: Record<
  ReasoningPhase,
  Record<TopicFocus, Record<LangBucket, readonly string[]>>
> = {
  start: {
    academic_calendar: {
      en: [
        "I'm checking the official UiTM academic calendar for {program} to find the correct semester and confirm the dates before preparing your answer.",
        "I'm reviewing the official UiTM academic calendar for {program} students to locate the right semester and verify the dates before I answer.",
        "Let me look through the official UiTM academic calendar for {program} to identify the correct semester and double-check the dates for you.",
      ],
      malay: [
        "Saya sedang menyemak kalendar akademik rasmi UiTM untuk {program} bagi mencari semester yang betul dan mengesahkan tarikh sebelum menyediakan jawapan anda.",
        "Saya meneliti kalendar akademik rasmi UiTM untuk pelajar {program} bagi mencari semester yang tepat dan mengesahkan tarikh sebelum menjawab.",
        "Izinkan saya menyemak kalendar akademik rasmi UiTM untuk {program} bagi mengenal pasti semester yang betul dan memastikan tarikhnya tepat untuk anda.",
      ],
    },
    lecture_weeks: {
      en: [
        "I'm checking the official lecture week schedule for {program} to find the right week and confirm the dates before preparing your answer.",
        "I'm reviewing the UiTM lecture week calendar for {program} students so I can identify the correct week and verify the dates for you.",
        "Let me look through the official lecture week dates for {program} to make sure I point you to the right week before answering.",
      ],
      malay: [
        "Saya sedang menyemak jadual minggu kuliah rasmi untuk {program} bagi mencari minggu yang betul dan mengesahkan tarikh sebelum menyediakan jawapan anda.",
        "Saya meneliti kalendar minggu kuliah UiTM untuk pelajar {program} supaya minggu yang tepat dapat dikenal pasti dan tarikhnya disahkan.",
        "Izinkan saya menyemak tarikh minggu kuliah rasmi untuk {program} bagi memastikan minggu yang betul dikenal pasti sebelum saya menjawab.",
      ],
    },
    public_holiday: {
      en: [
        "I'm checking the official public holiday dates that apply to UiTM and your {program} calendar, so I can confirm what's correct before answering.",
        "I'm reviewing the public holiday schedule for UiTM and {program} students to make sure the dates I share match the official calendar.",
        "Let me verify the public holiday dates relevant to UiTM and {program}, so I can confirm the right days before preparing your answer.",
      ],
      malay: [
        "Saya sedang menyemak tarikh cuti umum rasmi yang berkaitan dengan UiTM dan kalendar {program} anda, supaya perkara yang betul dapat disahkan sebelum saya menjawab.",
        "Saya meneliti jadual cuti umum untuk pelajar UiTM dan {program} bagi memastikan tarikh yang dikongsi sepadan dengan kalendar rasmi.",
        "Izinkan saya mengesahkan tarikh cuti umum yang relevan untuk UiTM dan {program}, supaya hari yang betul dapat dipastikan sebelum jawapan disediakan.",
      ],
    },
    uitm_only: {
      en: [
        "I'm looking up reliable UiTM information on campuses, fees, and student services that fits your question, so I can answer clearly and accurately.",
        "I'm reviewing trusted UiTM details about campuses, student life, and official policies, so what I share is easy to understand and accurate.",
        "Let me gather the UiTM information that best matches your question about student services and official details before I prepare the answer.",
      ],
      malay: [
        "Saya sedang mencari maklumat UiTM yang boleh dipercayai tentang kampus, yuran, dan perkhidmatan pelajar yang sepadan dengan soalan anda, supaya jawapan jelas dan tepat.",
        "Saya meneliti butiran UiTM tentang kampus, kehidupan pelajar, dan polisi rasmi, supaya perkongsian saya mudah difahami dan tepat.",
        "Izinkan saya mengumpulkan maklumat UiTM yang paling relevan tentang perkhidmatan pelajar dan butiran rasmi sebelum jawapan disediakan.",
      ],
    },
    uitm_calendar: {
      en: [
        "I'm cross-checking the official UiTM academic calendar and student information for {program}, so I can confirm the right dates and details before answering.",
        "I'm reviewing both the academic calendar and UiTM information for {program} students to make sure the dates and context line up before I respond.",
        "Let me compare the official calendar with relevant UiTM details for {program}, so I can verify the dates and share a clear answer.",
      ],
      malay: [
        "Saya sedang membandingkan kalendar akademik rasmi UiTM dan maklumat pelajar untuk {program}, supaya tarikh dan butiran yang betul dapat disahkan sebelum saya menjawab.",
        "Saya meneliti kalendar akademik serta maklumat UiTM untuk pelajar {program} bagi memastikan tarikh dan konteks adalah selari sebelum jawapan diberi.",
        "Izinkan saya memadankan kalendar rasmi dengan butiran UiTM yang relevan untuk {program}, supaya tarikh disahkan dan jawapan yang jelas dapat dikongsi.",
      ],
    },
    student: {
      en: [
        "I'm reviewing official UiTM information that matters to students, including fees, campuses, and academic dates, so I can answer your question clearly and confidently.",
        "I'm checking trusted UiTM student information across fees, registration, and campus details, so what I share is accurate and easy to follow.",
        "Let me gather the UiTM student details that fit your question, including official dates and programme information, before I prepare the answer.",
      ],
      malay: [
        "Saya sedang meneliti maklumat rasmi UiTM yang penting untuk pelajar, termasuk yuran, kampus, dan tarikh akademik, supaya soalan anda dapat dijawab dengan jelas dan yakin.",
        "Saya menyemak maklumat pelajar UiTM yang dipercayai merangkumi yuran, pendaftaran, dan butiran kampus, supaya perkongsian saya tepat dan mudah difahami.",
        "Izinkan saya mengumpulkan butiran pelajar UiTM yang relevan dengan soalan anda, termasuk tarikh rasmi dan maklumat program, sebelum jawapan disediakan.",
      ],
    },
    multi_session: {
      en: [
        "You've selected {sessions}, so I'm comparing the official UiTM academic calendar across them to make sure the dates line up before answering.",
        "Because you chose {sessions}, I'm reviewing the academic calendar for each one to confirm the right semester dates before preparing your answer.",
        "I'm checking {sessions} against the official UiTM calendar to verify the semester dates match before I share a clear answer with you.",
      ],
      malay: [
        "Anda telah memilih {sessions}, jadi saya membandingkan kalendar akademik rasmi UiTM bagi setiap satu supaya tarikh adalah selari sebelum saya menjawab.",
        "Memandangkan anda memilih {sessions}, saya meneliti kalendar akademik untuk setiap sesi bagi mengesahkan tarikh semester yang betul sebelum jawapan disediakan.",
        "Saya sedang menyemak {sessions} berdasarkan kalendar rasmi UiTM untuk memastikan tarikh semester sepadan sebelum jawapan yang jelas dikongsi.",
      ],
    },
    matched_activity: {
      en: [
        "I found {activity} on the academic calendar. I'm confirming the official dates so what I share matches the published UiTM schedule before answering.",
        "I can see {activity} in the calendar. I'm double-checking the official dates for {program} so your answer reflects the latest published information.",
        "I've spotted {activity} on the UiTM calendar and I'm verifying the official dates for {program} before preparing a clear answer for you.",
      ],
      malay: [
        "Saya menjumpai {activity} dalam kalendar akademik. Saya mengesahkan tarikh rasmi supaya perkongsian saya sepadan dengan jadual UiTM yang diterbitkan sebelum menjawab.",
        "Saya dapat melihat {activity} dalam kalendar. Saya menyemak semula tarikh rasmi untuk {program} supaya jawapan anda mencerminkan maklumat terkini.",
        "Saya telah mengenal pasti {activity} dalam kalendar UiTM dan sedang mengesahkan tarikh rasmi untuk {program} sebelum jawapan yang jelas disediakan.",
      ],
    },
  },
  progress: {
    academic_calendar: {
      en: [
        "The relevant semester has been identified. I'm verifying the dates to ensure the information matches the latest official academic calendar.",
        "I've narrowed down the right semester. Now I'm cross-checking the dates against the official UiTM academic calendar before finishing your answer.",
        "The semester looks clear now. I'm confirming each date against the official academic calendar so the details I share are reliable.",
      ],
      malay: [
        "Semester yang relevan telah dikenal pasti. Saya mengesahkan tarikh supaya maklumat sepadan dengan kalendar akademik rasmi yang terkini.",
        "Saya telah mengecilkan kepada semester yang betul. Kini tarikh sedang dibandingkan dengan kalendar akademik rasmi UiTM sebelum jawapan disiapkan.",
        "Semester kelihatan jelas sekarang. Saya mengesahkan setiap tarikh berdasarkan kalendar akademik rasmi supaya butiran yang dikongsi boleh dipercayai.",
      ],
    },
    lecture_weeks: {
      en: [
        "The relevant lecture week is coming into focus. I'm verifying the dates against the official schedule so the week I mention is accurate.",
        "I've identified the likely week. Now I'm confirming the dates on the official UiTM lecture week calendar before preparing your answer.",
        "The week looks clearer now. I'm double-checking the official lecture week dates for {program} so what I share is reliable.",
      ],
      malay: [
        "Minggu kuliah yang relevan semakin jelas. Saya mengesahkan tarikh berdasarkan jadual rasmi supaya minggu yang disebut adalah tepat.",
        "Saya telah mengenal pasti minggu yang berkemungkinan. Kini tarikh sedang disahkan pada kalendar minggu kuliah rasmi UiTM sebelum jawapan disediakan.",
        "Minggu tersebut kelihatan lebih jelas. Saya menyemak semula tarikh minggu kuliah rasmi untuk {program} supaya perkongsian saya boleh dipercayai.",
      ],
    },
    public_holiday: {
      en: [
        "The relevant holidays are coming into view. I'm verifying each date against the official public holiday calendar before I answer.",
        "I've identified the holidays that apply. Now I'm confirming the dates match the official UiTM and national holiday schedule.",
        "The holiday dates look clearer now. I'm double-checking them against the official calendar so what I share is accurate.",
      ],
      malay: [
        "Cuti yang relevan semakin jelas. Saya mengesahkan setiap tarikh berdasarkan kalendar cuti umum rasmi sebelum saya menjawab.",
        "Saya telah mengenal pasti cuti yang berkenaan. Kini tarikh sedang disahkan supaya ia sepadan dengan jadual cuti UiTM dan kebangsaan.",
        "Tarikh cuti kelihatan lebih jelas. Saya menyemak semula tarikh tersebut berdasarkan kalendar rasmi supaya perkongsian saya tepat.",
      ],
    },
    uitm_only: {
      en: [
        "The most relevant UiTM details are coming together. I'm confirming campuses, fees, and student information so your answer is accurate.",
        "I've found the UiTM information that fits your question. Now I'm reviewing it carefully so what I share is clear and trustworthy.",
        "The key UiTM student details are clearer now. I'm verifying them before I put your answer together.",
      ],
      malay: [
        "Butiran UiTM yang paling relevan semakin lengkap. Saya mengesahkan kampus, yuran, dan maklumat pelajar supaya jawapan anda tepat.",
        "Saya telah menemui maklumat UiTM yang sepadan dengan soalan anda. Kini ia disemak dengan teliti supaya perkongsian saya jelas dan boleh dipercayai.",
        "Butiran pelajar UiTM utama kelihatan lebih jelas. Saya mengesahkannya sebelum jawapan anda disediakan.",
      ],
    },
    uitm_calendar: {
      en: [
        "The calendar dates and UiTM details are lining up. I'm verifying both so the semester information and student context are accurate.",
        "I've matched the academic dates with the relevant UiTM information. Now I'm confirming everything before preparing your answer.",
        "The dates and UiTM details look consistent now. I'm double-checking them so your answer reflects the latest official information.",
      ],
      malay: [
        "Tarikh kalendar dan butiran UiTM semakin selari. Saya mengesahkan kedua-duanya supaya maklumat semester dan konteks pelajar adalah tepat.",
        "Saya telah memadankan tarikh akademik dengan maklumat UiTM yang relevan. Kini semuanya disahkan sebelum jawapan anda disediakan.",
        "Tarikh dan butiran UiTM kelihatan konsisten. Saya menyemak semula supaya jawapan anda mencerminkan maklumat rasmi terkini.",
      ],
    },
    student: {
      en: [
        "The student information that matters is coming together. I'm verifying fees, campuses, and official dates so your answer is reliable.",
        "I've found the UiTM details most relevant to students. Now I'm confirming them carefully before I finish your answer.",
        "The key details for students look clearer now. I'm double-checking official UiTM information so what I share is accurate.",
      ],
      malay: [
        "Maklumat pelajar yang penting semakin lengkap. Saya mengesahkan yuran, kampus, dan tarikh rasmi supaya jawapan anda boleh dipercayai.",
        "Saya telah menemui butiran UiTM yang paling relevan untuk pelajar. Kini ia disahkan dengan teliti sebelum jawapan disiapkan.",
        "Butiran utama untuk pelajar kelihatan lebih jelas. Saya menyemak semula maklumat rasmi UiTM supaya perkongsian saya tepat.",
      ],
    },
    multi_session: {
      en: [
        "The sessions you selected are lining up. I'm verifying the semester dates across each one so the comparison I share is accurate.",
        "I've compared the calendars for your selected sessions. Now I'm confirming the dates match the official UiTM schedule.",
        "The session dates look clearer now. I'm double-checking each semester against the official calendar before answering.",
      ],
      malay: [
        "Sesi yang anda pilih semakin selari. Saya mengesahkan tarikh semester bagi setiap satu supaya perbandingan yang dikongsi adalah tepat.",
        "Saya telah membandingkan kalendar untuk sesi terpilih. Kini tarikh disahkan supaya ia sepadan dengan jadual rasmi UiTM.",
        "Tarikh sesi kelihatan lebih jelas. Saya menyemak semula setiap semester berdasarkan kalendar rasmi sebelum menjawab.",
      ],
    },
    matched_activity: {
      en: [
        "I've confirmed where {activity} sits on the calendar. I'm verifying the official dates for {program} so your answer reflects the published schedule.",
        "The event dates are coming into focus. I'm double-checking {activity} against the official UiTM calendar before preparing your answer.",
        "I've matched {activity} to the right period. Now I'm confirming the official dates so what I share is accurate and up to date.",
      ],
      malay: [
        "Saya telah mengesahkan kedudukan {activity} dalam kalendar. Saya menyemak tarikh rasmi untuk {program} supaya jawapan mencerminkan jadual diterbitkan.",
        "Tarikh acara semakin jelas. Saya menyemak semula {activity} berdasarkan kalendar rasmi UiTM sebelum jawapan disediakan.",
        "Saya telah memadankan {activity} dengan tempoh yang betul. Kini tarikh rasmi disahkan supaya perkongsian saya tepat dan terkini.",
      ],
    },
  },
  final: {
    academic_calendar: {
      en: [
        "Everything has been verified. I'm preparing a clear and accurate answer based on the latest official information.",
        "The dates check out. I'm putting together a clear answer you can rely on from the official academic calendar.",
        "All the key details are confirmed. I'm preparing a straightforward answer based on the latest official UiTM calendar.",
      ],
      malay: [
        "Semuanya telah disahkan. Saya sedang menyediakan jawapan yang jelas dan tepat berdasarkan maklumat rasmi terkini.",
        "Tarikh tersebut tepat. Saya menyusun jawapan yang jelas yang boleh anda rujuk daripada kalendar akademik rasmi.",
        "Semua butiran penting telah disahkan. Saya menyediakan jawapan yang mudah difahami berdasarkan kalendar rasmi UiTM terkini.",
      ],
    },
    lecture_weeks: {
      en: [
        "The lecture week dates are verified. I'm preparing a clear answer based on the official UiTM schedule.",
        "Everything checks out for your week. I'm putting together a straightforward answer you can trust.",
        "The week and dates are confirmed. I'm preparing a clear response from the official lecture week calendar.",
      ],
      malay: [
        "Tarikh minggu kuliah telah disahkan. Saya sedang menyediakan jawapan yang jelas berdasarkan jadual rasmi UiTM.",
        "Semuanya tepat untuk minggu anda. Saya menyusun jawapan yang mudah difahami dan boleh dipercayai.",
        "Minggu dan tarikh telah disahkan. Saya menyediakan jawapan yang jelas daripada kalendar minggu kuliah rasmi.",
      ],
    },
    public_holiday: {
      en: [
        "The holiday dates are verified. I'm preparing a clear answer based on the official public holiday calendar.",
        "Everything checks out. I'm putting together a straightforward answer about the public holidays that apply.",
        "The dates are confirmed. I'm preparing a clear response you can rely on from the official holiday schedule.",
      ],
      malay: [
        "Tarikh cuti telah disahkan. Saya sedang menyediakan jawapan yang jelas berdasarkan kalendar cuti umum rasmi.",
        "Semuanya tepat. Saya menyusun jawapan yang mudah difahami tentang cuti umum yang berkenaan.",
        "Tarikh telah disahkan. Saya menyediakan jawapan yang jelas daripada jadual cuti rasmi yang boleh dipercayai.",
      ],
    },
    uitm_only: {
      en: [
        "The UiTM information is verified. I'm preparing a clear and helpful answer based on official student details.",
        "Everything looks consistent. I'm putting together a straightforward answer about UiTM that you can trust.",
        "The details are confirmed. I'm preparing a clear response based on reliable UiTM information for students.",
      ],
      malay: [
        "Maklumat UiTM telah disahkan. Saya sedang menyediakan jawapan yang jelas dan membantu berdasarkan butiran rasmi pelajar.",
        "Semuanya kelihatan konsisten. Saya menyusun jawapan yang mudah difahami tentang UiTM yang boleh anda percayai.",
        "Butiran telah disahkan. Saya menyediakan jawapan yang jelas berdasarkan maklumat UiTM yang boleh dipercayai untuk pelajar.",
      ],
    },
    uitm_calendar: {
      en: [
        "The calendar and UiTM details are verified. I'm preparing a clear answer based on the latest official information.",
        "Everything lines up. I'm putting together a straightforward answer that combines the dates and UiTM context you need.",
        "All the key details are confirmed. I'm preparing a clear response you can rely on from official UiTM sources.",
      ],
      malay: [
        "Kalendar dan butiran UiTM telah disahkan. Saya sedang menyediakan jawapan yang jelas berdasarkan maklumat rasmi terkini.",
        "Semuanya selari. Saya menyusun jawapan yang mudah difahami yang menggabungkan tarikh dan konteks UiTM yang anda perlukan.",
        "Semua butiran penting telah disahkan. Saya menyediakan jawapan yang jelas daripada sumber rasmi UiTM yang boleh dipercayai.",
      ],
    },
    student: {
      en: [
        "The student details are verified. I'm preparing a clear answer based on official UiTM information you can trust.",
        "Everything checks out. I'm putting together a helpful answer about fees, campuses, and dates for UiTM students.",
        "The information is confirmed. I'm preparing a clear and accurate response tailored to what students need to know.",
      ],
      malay: [
        "Butiran pelajar telah disahkan. Saya sedang menyediakan jawapan yang jelas berdasarkan maklumat rasmi UiTM yang boleh dipercayai.",
        "Semuanya tepat. Saya menyusun jawapan yang membantu tentang yuran, kampus, dan tarikh untuk pelajar UiTM.",
        "Maklumat telah disahkan. Saya menyediakan jawapan yang jelas dan tepat mengikut apa yang pelajar perlu tahu.",
      ],
    },
    multi_session: {
      en: [
        "The session dates are verified across your selection. I'm preparing a clear answer that compares them accurately.",
        "Everything lines up between the sessions. I'm putting together a straightforward comparison you can rely on.",
        "All selected sessions are confirmed. I'm preparing a clear answer based on the official academic calendar.",
      ],
      malay: [
        "Tarikh sesi telah disahkan merentas pilihan anda. Saya sedang menyediakan jawapan yang jelas untuk perbandingan yang tepat.",
        "Semuanya selari antara sesi. Saya menyusun perbandingan yang mudah difahami dan boleh dipercayai.",
        "Semua sesi terpilih telah disahkan. Saya menyediakan jawapan yang jelas berdasarkan kalendar akademik rasmi.",
      ],
    },
    matched_activity: {
      en: [
        "The dates for {activity} are verified. I'm preparing a clear answer based on the official UiTM calendar.",
        "Everything checks out for {activity}. I'm putting together a straightforward answer you can rely on.",
        "The event details are confirmed. I'm preparing a clear response about {activity} from the official schedule.",
      ],
      malay: [
        "Tarikh untuk {activity} telah disahkan. Saya sedang menyediakan jawapan yang jelas berdasarkan kalendar rasmi UiTM.",
        "Semuanya tepat untuk {activity}. Saya menyusun jawapan yang mudah difahami dan boleh dipercayai.",
        "Butiran acara telah disahkan. Saya menyediakan jawapan yang jelas tentang {activity} daripada jadual rasmi.",
      ],
    },
  },
  retry: {
    academic_calendar: {
      en: [
        "I want to be sure about the dates, so I'm double-checking them against the official academic calendar before finishing your answer.",
        "The dates deserve another look. I'm verifying them once more against the official UiTM calendar so your answer is accurate.",
      ],
      malay: [
        "Saya mahu memastikan tarikh adalah tepat, jadi saya menyemak semula berdasarkan kalendar akademik rasmi sebelum menyiapkan jawapan anda.",
        "Tarikh perlu disemak sekali lagi. Saya mengesahkannya berdasarkan kalendar rasmi UiTM supaya jawapan anda tepat.",
      ],
    },
    lecture_weeks: {
      en: [
        "I want to be sure about the week and dates, so I'm verifying them again against the official lecture week calendar.",
        "The week deserves another check. I'm confirming the dates once more before finishing your answer.",
      ],
      malay: [
        "Saya mahu memastikan minggu dan tarikh adalah tepat, jadi saya mengesahkannya sekali lagi berdasarkan kalendar minggu kuliah rasmi.",
        "Minggu tersebut perlu disemak semula. Saya mengesahkan tarikh sekali lagi sebelum menyiapkan jawapan anda.",
      ],
    },
    public_holiday: {
      en: [
        "I want to be sure about the holiday dates, so I'm verifying them again against the official public holiday calendar.",
        "The holidays deserve another look. I'm confirming the dates once more before finishing your answer.",
      ],
      malay: [
        "Saya mahu memastikan tarikh cuti adalah tepat, jadi saya mengesahkannya sekali lagi berdasarkan kalendar cuti umum rasmi.",
        "Cuti tersebut perlu disemak semula. Saya mengesahkan tarikh sekali lagi sebelum menyiapkan jawapan anda.",
      ],
    },
    uitm_only: {
      en: [
        "I want to be sure the UiTM details are right, so I'm reviewing the official student information once more before answering.",
        "The information deserves another check. I'm confirming the UiTM details before finishing your answer.",
      ],
      malay: [
        "Saya mahu memastikan butiran UiTM adalah betul, jadi saya meneliti maklumat pelajar rasmi sekali lagi sebelum menjawab.",
        "Maklumat tersebut perlu disemak semula. Saya mengesahkan butiran UiTM sebelum menyiapkan jawapan anda.",
      ],
    },
    uitm_calendar: {
      en: [
        "I want to be sure the dates and UiTM details match, so I'm reviewing them once more before finishing your answer.",
        "The calendar and student details deserve another check. I'm confirming everything before I respond.",
      ],
      malay: [
        "Saya mahu memastikan tarikh dan butiran UiTM sepadan, jadi saya menelitinya sekali lagi sebelum menyiapkan jawapan anda.",
        "Kalendar dan butiran pelajar perlu disemak semula. Saya mengesahkan semuanya sebelum menjawab.",
      ],
    },
    student: {
      en: [
        "I want to be sure the student information is accurate, so I'm reviewing the official UiTM details once more before answering.",
        "The student details deserve another look. I'm confirming fees, campuses, and dates before finishing your answer.",
      ],
      malay: [
        "Saya mahu memastikan maklumat pelajar adalah tepat, jadi saya meneliti butiran rasmi UiTM sekali lagi sebelum menjawab.",
        "Butiran pelajar perlu disemak semula. Saya mengesahkan yuran, kampus, dan tarikh sebelum menyiapkan jawapan anda.",
      ],
    },
    multi_session: {
      en: [
        "I want to be sure the session dates line up, so I'm comparing them once more against the official academic calendar.",
        "The sessions deserve another check. I'm verifying the semester dates again before finishing your answer.",
      ],
      malay: [
        "Saya mahu memastikan tarikh sesi adalah selari, jadi saya membandingkannya sekali lagi berdasarkan kalendar akademik rasmi.",
        "Sesi tersebut perlu disemak semula. Saya mengesahkan tarikh semester sekali lagi sebelum menyiapkan jawapan anda.",
      ],
    },
    matched_activity: {
      en: [
        "I want to be sure about the dates for {activity}, so I'm verifying them again against the official UiTM calendar.",
        "The event deserves another check. I'm confirming {activity} once more before finishing your answer.",
      ],
      malay: [
        "Saya mahu memastikan tarikh untuk {activity} adalah tepat, jadi saya mengesahkannya sekali lagi berdasarkan kalendar rasmi UiTM.",
        "Acara tersebut perlu disemak semula. Saya mengesahkan {activity} sekali lagi sebelum menyiapkan jawapan anda.",
      ],
    },
  },
};

export interface ReasoningParagraphInput {
  message: string;
  phase: ReasoningPhase;
  topics: ChatTopic[];
  programLabel: string;
  sessionCount: number;
  hasMatchedActivity: boolean;
  activityMatches?: MatchedActivity[];
  toolName?: ChatToolName;
  retryReason?: "dates" | "incomplete";
}

export interface ReasoningOpenerInput {
  message: string;
  topics: ChatTopic[];
  hasMatchedActivity: boolean;
  activityMatches: MatchedActivity[];
  programLabel: string;
  sessionCount: number;
}

function templateVars(input: ReasoningParagraphInput, lang: LangBucket): Record<string, string> {
  const activity =
    input.activityMatches?.[0]?.activity.name?.trim() ||
    (lang === "malay" ? "acara ini" : "this event");
  return {
    program: programPhrase(input.programLabel, lang),
    activity,
    sessions: sessionPhrase(input.sessionCount, lang),
  };
}

export function buildReasoningParagraph(input: ReasoningParagraphInput): string {
  const lang = langBucket(detectUserLanguage(input.message));
  const focus = resolveTopicFocus({
    message: input.message,
    topics: input.topics,
    hasMatchedActivity: input.hasMatchedActivity,
    sessionCount: input.sessionCount,
  });
  const vars = templateVars(input, lang);
  const pool =
    PARAGRAPH_POOLS[input.phase]?.[focus]?.[lang] ??
    PARAGRAPH_POOLS[input.phase].academic_calendar[lang];
  const seed = `${input.message}:${input.phase}:${focus}:${input.toolName ?? ""}:${input.retryReason ?? ""}`;
  const template = pickProgressPhrase(pool, seed);
  const paragraph = clampWords(fillTemplate(template, vars));
  if (!isValidParagraph(paragraph)) {
    const fallback = clampWords(
      fillTemplate(PARAGRAPH_POOLS[input.phase].academic_calendar[lang][0]!, vars)
    );
    return isValidParagraph(fallback) ? fallback : paragraph;
  }
  return paragraph;
}

/** @deprecated Use buildReasoningParagraph with phase "start". */
export function buildReasoningOpener(input: ReasoningOpenerInput): string {
  return buildReasoningParagraph({ ...input, phase: "start" });
}

/** @deprecated Use buildReasoningParagraph with phase "progress". */
export function buildToolReasoningLine(
  toolName: ChatToolName,
  ctx: { message: string; topics?: ChatTopic[]; programLabel?: string }
): string {
  return buildReasoningParagraph({
    message: ctx.message,
    phase: "progress",
    topics: ctx.topics ?? ["academic_calendar"],
    programLabel: ctx.programLabel ?? "All",
    sessionCount: 1,
    hasMatchedActivity: false,
    toolName,
  });
}

/** @deprecated Use buildReasoningParagraph with phase "retry". */
export function buildRetryReasoningLine(
  reason: "dates" | "incomplete",
  message: string
): string {
  return buildReasoningParagraph({
    message,
    phase: "retry",
    topics: ["academic_calendar"],
    programLabel: "All",
    sessionCount: 1,
    hasMatchedActivity: false,
    retryReason: reason,
  });
}

/** Replace the visible reasoning paragraph (never append). */
export function replaceReasoningParagraph(current: string, next: string): string {
  const paragraph = next.trim();
  if (!paragraph) return current;
  if (current.trim() === paragraph) return current;
  return paragraph;
}

// Kept for compatibility with older tests/callers that trim snippets elsewhere.
export function truncateForReasoning(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  const max = 72;
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}
