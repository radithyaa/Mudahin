/**
 * Util Mode Fokus: memecah teks materi menjadi blok-blok pendek agar dapat
 * dibaca satu per satu tanpa distraksi (Fitur Should: fokus ramah ADHD).
 *
 * Blok dibentuk dari kalimat utuh bila kalimatnya sudah pendek; kalimat panjang
 * dipecah lagi menjadi potongan `wordsPerBlock` kata sehingga setiap tampilan
 * tetap ringkas.
 */

export interface FocusBlock {
  /** Indeks paragraf asal — dipakai untuk menyorot paragraf saat TTS berjalan. */
  paragraphIndex: number;
  text: string;
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const WORD_SPLIT = /\s+/;

export function buildFocusBlocks(
  paragraphs: string[],
  wordsPerBlock: number
): FocusBlock[] {
  const size = Math.max(1, Math.floor(wordsPerBlock));
  const blocks: FocusBlock[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const sentences = paragraph
      .split(SENTENCE_SPLIT)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    for (const sentence of sentences) {
      const words = sentence.split(WORD_SPLIT).filter(Boolean);
      if (words.length <= size) {
        blocks.push({ paragraphIndex, text: sentence });
        continue;
      }
      for (let start = 0; start < words.length; start += size) {
        blocks.push({
          paragraphIndex,
          text: words.slice(start, start + size).join(" "),
        });
      }
    }
  });

  return blocks;
}

/**
 * Indeks blok pertama milik paragraf tertentu. Dipakai untuk mengikuti posisi
 * TTS pada mode fokus. Mengembalikan -1 bila paragraf tidak ada di daftar blok.
 */
export function firstBlockIndexOfParagraph(
  blocks: FocusBlock[],
  paragraphIndex: number
): number {
  return blocks.findIndex((block) => block.paragraphIndex === paragraphIndex);
}
