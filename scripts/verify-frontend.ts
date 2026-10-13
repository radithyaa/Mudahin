import {
  tokenizeWords,
  wordIndexFromChar,
} from "../apps/web/src/routes/materi/hooks/use-text-to-speech";
import { scoreOf } from "../apps/web/src/routes/materi/stores/quiz-store";

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

// Tokenizer
const tokens = tokenizeWords("Halo dunia belajar");
check("tokenize counts words", tokens.length === 3);
check("tokenize first word", tokens[0]?.word === "Halo");
check("tokenize start offset", tokens[1]?.start === 5);

// Word index mapping (boundary charIndex → word index)
check("wordIndex at char 0", wordIndexFromChar(tokens, 0, -1) === 0);
check(
  "wordIndex at char 5 (start of 2nd)",
  wordIndexFromChar(tokens, 5, -1) === 1
);
check(
  "wordIndex at char 11 (3rd word)",
  wordIndexFromChar(tokens, 11, -1) === 2
);
check(
  "wordIndex empty tokens returns fallback",
  wordIndexFromChar([], 3, 42) === 42
);

// Quiz scoring
const q = (answerIndex: number) => ({
  id: "q",
  question: "?",
  options: ["a", "b", "c", "d"],
  answerIndex,
  explanation: "e",
});
check(
  "score all correct = 100",
  scoreOf([
    { answerIndex: 0, question: q(0) },
    { answerIndex: 1, question: q(1) },
  ]) === 100
);
check(
  "score half = 50",
  scoreOf([
    { answerIndex: 0, question: q(0) },
    { answerIndex: 0, question: q(1) },
  ]) === 50
);
check("score empty = 0", scoreOf([]) === 0);
check(
  "score unanswered counts wrong",
  scoreOf([{ answerIndex: null, question: q(0) }]) === 0
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
