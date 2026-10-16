import {
  combineSpeechResults,
  matchOptionIndex,
} from "../apps/frontend/src/lib/speech-recognition";
import { shouldPreferServerStt } from "../apps/frontend/src/lib/speech-stt";

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

// --- Akumulasi transkrip (combineSpeechResults) ---
// Event dari Web Speech hanya memuat hasil sejak `resultIndex`; hasil final
// harus dikumpulkan agar tidak hilang saat event berikutnya melompat maju.
interface ResultLike {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

const mkEvent = (
  resultIndex: number,
  results: { isFinal: boolean; transcript: string }[]
) => {
  const mapped: ResultLike[] = results.map((r) => ({
    0: { transcript: r.transcript },
    isFinal: r.isFinal,
    length: 1,
  }));
  return {
    resultIndex,
    results: Object.assign(mapped, {
      length: mapped.length,
    }) as ResultLike[] & {
      length: number;
    },
  };
};

{
  // Satu event interim → tampil interim, belum ada final.
  const out = combineSpeechResults(
    mkEvent(0, [{ isFinal: false, transcript: "air dari" }]),
    ""
  );
  check("interim tampil apa adanya", out.transcript === "air dari");
  check("interim tidak menambah final", out.final === "");
}

{
  // Final lalu interim berikutnya → gabungan final + interim.
  const first = combineSpeechResults(
    mkEvent(0, [{ isFinal: true, transcript: "air dari " }]),
    ""
  );
  const second = combineSpeechResults(
    mkEvent(0, [{ isFinal: false, transcript: "tanah" }]),
    first.final
  );
  check(
    "final + interim berikutnya tergabung",
    second.transcript === "air dari tanah"
  );
  check("final dipertahankan", second.final === "air dari ");
}

{
  // Dua event final berurutan → akumulasi (tidak saling menimpa).
  // `results` bersifat kumulatif seperti Web Speech asli; event kedua membawa
  // dua hasil dan `resultIndex` menunjuk hasil final baru (indeks 1).
  const first = combineSpeechResults(
    mkEvent(0, [{ isFinal: true, transcript: "jawaban " }]),
    ""
  );
  const second = combineSpeechResults(
    mkEvent(1, [
      { isFinal: true, transcript: "jawaban " },
      { isFinal: true, transcript: "nya b" },
    ]),
    first.final
  );
  check(
    "dua final berurutan terakumulasi",
    second.transcript === "jawaban nya b"
  );
}

// --- Pilihan jalur STT (perangkat vs server) ---------------------------------
// Di luar peramban (Bun), tidak ada UA Android → mesin perangkat dipilih.
check("tanpa UA Android: tidak memaksa jalur server", !shouldPreferServerStt());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
