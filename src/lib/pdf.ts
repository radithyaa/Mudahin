/**
 * Ekstraksi teks dari berkas PDF di sisi klien.
 *
 * Dipakai halaman Beranda agar pengguna dapat mengunggah **PDF sungguhan**
 * (bukan nama berkas contoh): isi teksnya dibaca dengan pdf.js, lalu dikirim
 * ke Teman AI sebagai materi. Worker pdf.js dimuat dari bundel (bukan CDN) agar
 * tetap bekerja luring dan tanpa permintaan jaringan tambahan.
 *
 * Bila PDF hanya berisi gambar pindai (tanpa lapisan teks), hasilnya kosong dan
 * pemanggil menampilkan pesan jujur — pengguna disarankan mengunggah fotonya.
 */
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Worker dibundel Vite sebagai URL aset; tidak ada permintaan ke CDN.
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

/** Jumlah halaman maksimum yang dibaca, agar unggahan besar tidak menggantung. */
const MAX_PAGES = 20;

/**
 * Membaca seluruh teks pada berkas PDF.
 *
 * @param file Berkas PDF dari input pengguna.
 * @returns Teks gabungan antar halaman (dipisah baris kosong).
 * @throws Error dengan pesan Bahasa Indonesia bila berkas tidak dapat dibaca.
 */
export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });

  try {
    const doc = await loadingTask.promise;
    const pageCount = Math.min(doc.numPages, MAX_PAGES);
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      // Berurutan agar urutan teks tetap benar & hemat memori di ponsel.
      // biome-ignore lint/performance/noAwaitInLoops: urutan halaman wajib terjaga.
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) {
        pages.push(text);
      }
      page.cleanup();
    }

    return pages.join("\n\n");
  } catch (error) {
    throw new Error("Berkas PDF tidak dapat dibaca. Coba berkas lain ya.", {
      cause: error,
    });
  } finally {
    await loadingTask.destroy();
  }
}
