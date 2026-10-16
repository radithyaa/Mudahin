import { hashKey } from "../packages/api/src/cache";
import {
  buildExplainMessages,
  buildMindMapMessages,
  buildOcrFlashcardMessages,
  buildQuizMessages,
  buildSimplifyMessages,
} from "../packages/api/src/prompts";
import {
  explainInputSchema,
  ocrFlashcardResultSchema,
  ocrToFlashcardsInputSchema,
  quizInputSchema,
  rawExplainResponseSchema,
  rawMindMapResponseSchema,
  rawOcrFlashcardResponseSchema,
  rawQuizResponseSchema,
  rawSimplifyResponseSchema,
  simplifyInputSchema,
} from "../packages/api/src/schemas";

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log("  ok:", name);
  } else {
    fail += 1;
    console.log("  FAIL:", name);
  }
};

check(
  "simplify input valid",
  simplifyInputSchema.safeParse({ text: "Halo dunia" }).success
);
check(
  "simplify input rejects empty",
  !simplifyInputSchema.safeParse({ text: "" }).success
);
check(
  "simplify input rejects too long",
  !simplifyInputSchema.safeParse({ text: "a".repeat(8001) }).success
);
check(
  "quiz input default count",
  quizInputSchema.parse({ text: "x" }).count === 3
);
check(
  "quiz input rejects count>10",
  !quizInputSchema.safeParse({ text: "x", count: 11 }).success
);

check(
  "raw simplify ok",
  rawSimplifyResponseSchema.safeParse({ points: ["a", "b"] }).success
);
check(
  "raw simplify rejects non-array",
  !rawSimplifyResponseSchema.safeParse({ points: "a" }).success
);
check(
  "raw quiz ok",
  rawQuizResponseSchema.safeParse({
    questions: [
      { question: "q", options: ["a", "b"], answerIndex: 0, explanation: "e" },
    ],
  }).success
);
check(
  "raw quiz rejects missing answerIndex",
  !rawQuizResponseSchema.safeParse({
    questions: [{ question: "q", options: ["a", "b"], explanation: "e" }],
  }).success
);

const sm = buildSimplifyMessages({ text: "Materi", level: "sederhana" });
check(
  "simplify prompt has system+user",
  sm.length === 2 && sm[0].role === "system"
);
check("simplify prompt mentions JSON", sm[1].content.includes("points"));
const qm = buildQuizMessages({ text: "Materi", count: 3 });
check("quiz prompt mentions count", qm[1].content.includes("3 soal"));
check(
  "quiz prompt includes profile hint",
  buildQuizMessages({
    text: "M",
    count: 1,
    profile: "kendala-bahasa",
  })[1].content.includes("belum lancar")
);

const k1 = await hashKey("simplify", "v1", JSON.stringify({ text: "a" }));
const k2 = await hashKey("simplify", "v1", JSON.stringify({ text: "a" }));
const k3 = await hashKey("simplify", "v1", JSON.stringify({ text: "b" }));
check("hash deterministic", k1 === k2);
check("hash differs for different input", k1 !== k3);
check("hash is 64 hex chars", /^[0-9a-f]{64}$/.test(k1));

// Explain (FR-AI-03)
check(
  "explain input valid",
  explainInputSchema.safeParse({ text: "Energi adalah kemampuan" }).success
);
check(
  "explain input rejects empty",
  !explainInputSchema.safeParse({ text: "" }).success
);
check(
  "explain raw ok",
  rawExplainResponseSchema.safeParse({ explanation: "Sesuatu" }).success
);
check(
  "explain raw rejects missing field",
  !rawExplainResponseSchema.safeParse({}).success
);
const em = buildExplainMessages({ text: "Energi" });
check("explain prompt mentions JSON", em[1].content.includes("explanation"));
check(
  "explain prompt includes context when given",
  buildExplainMessages({
    context: "Konteks X",
    text: "Energi",
  })[1].content.includes("Konteks X")
);

// Mind map (FR-AI-04)
check(
  "raw mindmap ok",
  rawMindMapResponseSchema.safeParse({
    root: "Fotosintesis",
    branches: [{ label: "Bahan", leaves: ["Cahaya", "Air"] }],
  }).success
);
check(
  "raw mindmap rejects bad shape",
  !rawMindMapResponseSchema.safeParse({ root: "X", branches: "nope" }).success
);
const mm = buildMindMapMessages({ text: "Fotosintesis", level: "sederhana" });
check("mindmap prompt mentions branches", mm[1].content.includes("branches"));

// OCR tulisan tangan → flashcards (Future F3, Gemini vision)
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC";
check(
  "ocr input accepts data url",
  ocrToFlashcardsInputSchema.safeParse({ imageDataUrl: PNG_DATA_URL }).success
);
check(
  "ocr input rejects non-image data url",
  !ocrToFlashcardsInputSchema.safeParse({
    imageDataUrl: "data:text/plain;base64,aGVsbG8=",
  }).success
);
check(
  "ocr input rejects empty",
  !ocrToFlashcardsInputSchema.safeParse({ imageDataUrl: "" }).success
);
check(
  "ocr raw ok",
  rawOcrFlashcardResponseSchema.safeParse({
    extractedText: "Air mendidih pada 100 derajat.",
    deckTitle: "Suhu",
    cards: [{ term: "Mendidih", definition: "Air panas sampai bergelembung" }],
  }).success
);
check(
  "ocr raw rejects bad shape",
  !rawOcrFlashcardResponseSchema.safeParse({
    extractedText: "x",
    deckTitle: "y",
    cards: "nope",
  }).success
);
const om = buildOcrFlashcardMessages({ imageDataUrl: PNG_DATA_URL });
const ocrParts = om[1].content;
check(
  "ocr prompt embeds image part",
  Array.isArray(ocrParts) &&
    ocrParts.some(
      (part) => part.type === "image_url" && part.image_url.url === PNG_DATA_URL
    )
);
check(
  "ocr prompt asks for extractedText",
  Array.isArray(ocrParts) &&
    ocrParts.some(
      (part) => part.type === "text" && part.text.includes("extractedText")
    )
);
check(
  "ocr result schema requires extractedText",
  ocrFlashcardResultSchema.safeParse({
    deckTitle: "Suhu",
    cards: [{ id: "c1", term: "Mendidih", definition: "Air panas" }],
    extractedText: "Air mendidih.",
    cached: false,
  }).success
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
