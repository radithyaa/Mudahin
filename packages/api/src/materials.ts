import { z } from "zod";

/**
 * Kontrak materi pelajaran (FR-PRF-04).
 * Dipakai bersama client & server via prosedur tRPC `materials`.
 */
export const materialSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  summary: z.string(),
  /** Estimasi waktu baca dalam menit. */
  readingMinutes: z.number(),
  /** Paragraf isi materi. */
  paragraphs: z.array(z.string()),
});
export type Material = z.infer<typeof materialSchema>;

/**
 * Materi contoh pra-muat untuk demo. Disajikan dari server agar client & server
 * memakai sumber yang sama (dulu hanya di web; kini jadi kontrak `materials`).
 */
export const SEED_MATERIALS: Material[] = [
  {
    id: "fotosintesis",
    title: "Fotosintesis pada Tumbuhan",
    subject: "IPA",
    gradeLevel: "SD Kelas 5",
    summary: "Bagaimana tumbuhan membuat makanan dari cahaya matahari.",
    readingMinutes: 4,
    paragraphs: [
      "Tumbuhan hijau dapat membuat makanan sendiri. Proses ini disebut fotosintesis. Fotosintesis terjadi di daun.",
      "Tumbuhan membutuhkan tiga hal. Pertama, cahaya matahari. Kedua, air dari dalam tanah. Ketiga, karbon dioksida dari udara.",
      "Di dalam daun terdapat klorofil. Klorofil adalah zat hijau pada daun. Zat ini menangkap cahaya matahari.",
      "Hasil fotosintesis adalah glukosa dan oksigen. Glukosa menjadi makanan tumbuhan. Oksigen dilepas ke udara.",
      "Oksigen yang dilepas berguna bagi manusia dan hewan. Kita bernapas menggunakan oksigen tersebut.",
    ],
  },
  {
    id: "siklus-air",
    title: "Siklus Air di Bumi",
    subject: "IPA",
    gradeLevel: "SD Kelas 5",
    summary: "Perjalanan air dari laut ke langit lalu kembali ke tanah.",
    readingMinutes: 3,
    paragraphs: [
      "Air di bumi selalu bergerak. Perjalanan ini disebut siklus air. Siklus air tidak pernah berhenti.",
      "Matahari memanaskan air di laut dan danau. Air berubah menjadi uap. Proses ini disebut evaporasi.",
      "Uap air naik ke langit. Di sana uap menjadi dingin. Uap berubah menjadi titik air. Proses ini disebut kondensasi.",
      "Titik air berkumpul membentuk awan. Jika awan penuh, air turun sebagai hujan. Proses ini disebut presipitasi.",
      "Air hujan meresap ke tanah. Sebagian mengalir ke sungai. Sungai membawa air kembali ke laut.",
    ],
  },
  {
    id: "pecahan",
    title: "Mengenal Pecahan Sederhana",
    subject: "Matematika",
    gradeLevel: "SD Kelas 4",
    summary: "Cara memahami pecahan dengan benda sehari-hari.",
    readingMinutes: 3,
    paragraphs: [
      "Pecahan menunjukkan bagian dari sesuatu yang utuh. Misalnya, satu kue dipotong dua bagian sama besar.",
      "Setiap potongan disebut satu per dua. Kita menulisnya sebagai 1/2.",
      "Angka di atas garis disebut pembilang. Angka di bawah garis disebut penyebut.",
      "Pembilang menunjukkan berapa bagian yang diambil. Penyebut menunjukkan jumlah seluruh bagian.",
      "Jika dua potong digabungkan kembali, kue menjadi utuh lagi. Dua per dua sama dengan satu.",
    ],
  },
  {
    id: "pancasila",
    title: "Makna Sila dalam Pancasila",
    subject: "PPKn",
    gradeLevel: "SD Kelas 5",
    summary: "Arti lima sila dasar negara Indonesia.",
    readingMinutes: 4,
    paragraphs: [
      "Pancasila adalah dasar negara Indonesia. Pancasila memiliki lima sila.",
      "Sila pertama berbunyi Ketuhanan Yang Maha Esa. Kita wajib beriman dan bertakwa.",
      "Sila kedua berbunyi Kemanusiaan yang Adil dan Beradab. Kita harus menghormati sesama manusia.",
      "Sila ketiga berbunyi Persatuan Indonesia. Kita harus menjaga persatuan bangsa.",
      "Sila keempat berbunyi Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan. Kita menyelesaikan masalah dengan musyawarah.",
      "Sila kelima berbunyi Keadilan Sosial bagi Seluruh Rakyat Indonesia. Kita harus bersikap adil.",
    ],
  },
  {
    id: "energi",
    title: "Bentuk-Bentuk Energi",
    subject: "IPA",
    gradeLevel: "SD Kelas 4",
    summary: "Jenis energi di sekitar kita dan contohnya.",
    readingMinutes: 3,
    paragraphs: [
      "Energi adalah kemampuan melakukan usaha. Energi tidak dapat dibuat, tetapi dapat diubah.",
      "Energi listrik membantu kita menyalakan lampu. Energi listrik juga menyalakan alat elektronik.",
      "Energi panas berasal dari matahari dan api. Energi panas membuat tubuh hangat.",
      "Energi gerak dimiliki benda yang bergerak. Mobil dan sepeda memiliki energi gerak.",
      "Energi cahaya berasal dari matahari. Energi ini membantu tumbuhan dan menerangi bumi.",
    ],
  },
  {
    id: "peta",
    title: "Membaca Peta dan Arah Mata Angin",
    subject: "IPS",
    gradeLevel: "SD Kelas 4",
    summary: "Cara menemukan arah tempat menggunakan peta.",
    readingMinutes: 3,
    paragraphs: [
      "Peta adalah gambar permukaan bumi. Peta membantu kita menemukan tempat.",
      "Ada empat arah mata angin. Arah itu adalah utara, timur, selatan, dan barat.",
      "Matahari terbit di sebelah timur. Matahari tenggelam di sebelah barat.",
      "Pada peta, arah utara biasanya berada di atas. Arah selatan berada di bawah.",
      "Peta memakai skala. Skala menunjukkan jarak sebenarnya di lapangan.",
    ],
  },
];

export function getSeedMaterialById(id: string): Material | undefined {
  return SEED_MATERIALS.find((material) => material.id === id);
}

/** Menggabungkan paragraf materi menjadi satu teks untuk dikirim ke AI. */
export function materialToText(material: Material): string {
  return material.paragraphs.join("\n\n");
}
