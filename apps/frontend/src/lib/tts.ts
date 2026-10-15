/**
 * Utilitas Text-to-Speech (FR-AUD-01..03) — bagian murni tanpa DOM.
 *
 * Web Speech API (`SpeechSynthesis`) melaporkan posisi baca lewat `onboundary`
 * dengan indeks karakter. Helper di sini memetakan indeks karakter tersebut ke
 * indeks kata agar UI dapat menyorot kata yang sedang dibaca.
 */

/** Memecah teks menjadi kata + offset karakter untuk memetakan boundary→kata. */
export function tokenizeWords(
  text: string
): { index: number; start: number; word: string }[] {
  const tokens: { index: number; start: number; word: string }[] = [];
  const regex = /\S+/g;
  let match = regex.exec(text);
  let index = 0;
  while (match !== null) {
    tokens.push({ index, start: match.index, word: match[0] });
    index += 1;
    match = regex.exec(text);
  }
  return tokens;
}

/** Memetakan `charIndex` dari `onboundary` ke indeks kata terdekat. */
export function wordIndexFromChar(
  tokens: { index: number; start: number }[],
  charIndex: number,
  fallback: number
): number {
  if (tokens.length === 0) {
    return fallback;
  }
  let current = tokens[0]?.index ?? fallback;
  for (const token of tokens) {
    if (token.start <= charIndex) {
      current = token.index;
    } else {
      break;
    }
  }
  return current;
}
