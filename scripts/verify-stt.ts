import { matchOptionIndex } from "../apps/web/src/routes/materi/hooks/use-speech-recognition";

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

const options = ["Cahaya matahari", "Air dari tanah", "Oksigen", "Glukosa"];

// Pencocokan label lisan (A/B/C/D).
check("label 'a' → opsi 0", matchOptionIndex("a", options) === 0);
check("label 'b' → opsi 1", matchOptionIndex("b", options) === 1);
check("label 'd' → opsi 3", matchOptionIndex("d", options) === 3);
check("label huruf besar", matchOptionIndex("C", options) === 2);

// Pencocokan kata kunci saat label tidak diucapkan.
check(
  "kata kunci 'matahari' → opsi 0",
  matchOptionIndex("jawabannya cahaya matahari", options) === 0
);
check(
  "kata kunci 'glukosa' → opsi 3",
  matchOptionIndex("menurut saya glukosa", options) === 3
);
check(
  "kata kunci 'tanah' → opsi 1",
  matchOptionIndex("air dari tanah", options) === 1
);

// Kasus tanpa kecocokan.
check("kosong → -1", matchOptionIndex("", options) === -1);
check("tidak relevan → -1", matchOptionIndex("xyz tidak ada", options) === -1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
