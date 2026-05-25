export const SUGGESTIONS_GROUP_A = [
  "Bila kuliah bermula untuk Group A semester ini?",
  "Lecture 1 Group A — bila mula?",
  "Bilakah Lecture 2 bermula untuk Group A?",
  "Lecture 3 Group A bermula bila?",
  "Minggu kuliah terakhir Group A bila?",
  "Ujian Pertengahan Semester Group A bila?",
  "Cuti Pertengahan Semester Group A bila?",
  "Cuti Khas Aidil Fitri untuk Group A bila?",
  "Minggu Ulangkaji Group A bila?",
  "Peperiksaan Akhir Group A bila?",
  "Peperiksaan minggu akhir Group A bila?",
  "Bila boleh cetak slip menduduki peperiksaan Group A?",
  "Cuti Semester Group A bermula bila?",
  "Cuti semester panjang Group A bila?",
  "Proses Entrance Survey Group A bila?",
  "Exit Survey Group A bila?",
  "SuFO Group A — bila perlu siap?",
  "Program MDS Group A bila?",
  "Pendaftaran online Asasi UiTM Group A bila?",
  "Pendaftaran fizikal pelajar baharu Group A bila?",
  "Pendaftaran kursus pelajar baharu dan lama Group A bila?",
  "Validasi kursus berdaftar semester ini Group A bila?",
  "Bila akhir bayar yuran Group A?",
  "Ada tarikh berkaitan penangguhan yuran Group A?",
  "Serahan dokumen pelajar baharu Asasi Group A bila?",
  "Persetujuan tawaran UiTM Asasi Group A bila?",
  "Muat naik gambar kad pelajar iStudent Group A — bila akhir?",
  "Gugur Taraf (GT) Group A bila berlaku?",
  "Permohonan RPGT Group A bila?",
  "Gugur Taraf Muktamad Group A bila?",
];

export const SUGGESTIONS_GROUP_B = [
  "Kuliah Group B semester ini bermula bila?",
  "Lecture 1 Group B bila?",
  "Bila mula Lecture 2 untuk Group B?",
  "Bilakah Lecture 3 untuk Group B?",
  "Minggu kuliah terakhir Group B bila?",
  "Ujian Pertengahan Semester Group B bila?",
  "Cuti Pertengahan Semester atau cuti perayaan Group B bila?",
  "Minggu Ulangkaji Group B bila?",
  "EET Speaking Group B bila?",
  "Peperiksaan Akhir atau EET Bertulis Group B bila?",
  "Peperiksaan minggu akhir Group B bila?",
  "Slip menduduki peperiksaan Group B — bila boleh cetak?",
  "Short Semester Group B bila?",
  "Kuliah intersesi atau peperiksaan Short Semester Group B bila?",
  "Cuti Semester Group B bermula bila?",
  "Cuti Krismas atau tahun baharu Group B bila?",
  "Entrance Survey Group B bila?",
  "MDS dan Edu 5.0@UiTM Group B bila?",
  "Program PDS Group B bila?",
  "Pendaftaran online pelajar sepenuh masa Group B bila?",
  "Pendaftaran fizikal & serahan dokumen pelajar baharu Group B bila?",
  "Pendaftaran kursus ePJJ atau PLK Group B bila?",
  "Validasi kursus berdaftar Group B bila?",
  "Akhir bayar yuran Group B bila?",
  "Tarikh berkaitan penangguhan yuran Group B?",
  "Pendaftaran kolej penginapan pelajar baharu Group B bila?",
  "Persetujuan tawaran UiTM online Group B bila?",
  "Gambar kad pelajar iStudent Group B — tarikh akhir?",
  "GT Group B bila berlaku?",
  "Gugur Taraf Muktamad Group B bila?",
];

/** General UiTM calendar questions — mixed into carousel for Group A and Group B. */
export const SUGGESTIONS_GENERAL = [
  "Apa beza Group A dan Group B dalam kalendar UiTM?",
  "Sesi, semester, atau penggal — apa bezanya pada kalendar UiTM?",
  "Macam mana nak baca jadual pendaftaran, kuliah, peperiksaan, dan cuti?",
  "Cuti umum Malaysia ada dalam kalendar UiTM tak?",
  "Program mana guna Group A dan Group B?",
  "Cuti atau peperiksaan seterusnya bila pada kalendar semester ini?",
  "Minggu Ulangkaji dan Peperiksaan Akhir — maksudnya apa dalam kalendar?",
  "Penangguhan yuran (Fee Deferment) — tarikh apa dalam kalendar?",
];

const DISPLAY_COUNT = 8;
const GROUP_PICK_COUNT = 4;
const GENERAL_PICK_COUNT = DISPLAY_COUNT - GROUP_PICK_COUNT;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function pickFromPool(pool: string[], count: number, exclude: string[]): string[] {
  const available = pool.filter((s) => !exclude.includes(s));
  const source = available.length >= count ? available : pool;
  return shuffle(source).slice(0, count);
}

export function getRandomSuggestions(group: "A" | "B", exclude: string[]): string[] {
  const groupPool = group === "A" ? SUGGESTIONS_GROUP_A : SUGGESTIONS_GROUP_B;
  const groupPicks = pickFromPool(groupPool, GROUP_PICK_COUNT, exclude);
  const generalPicks = pickFromPool(SUGGESTIONS_GENERAL, GENERAL_PICK_COUNT, [
    ...exclude,
    ...groupPicks,
  ]);
  const picks = shuffle([...groupPicks, ...generalPicks]);
  if (picks.length >= DISPLAY_COUNT) return picks;

  const fallback = [...groupPool, ...SUGGESTIONS_GENERAL].filter(
    (s) => !exclude.includes(s)
  );
  const pool = fallback.length >= DISPLAY_COUNT ? fallback : [...groupPool, ...SUGGESTIONS_GENERAL];
  return shuffle(pool).slice(0, DISPLAY_COUNT);
}
