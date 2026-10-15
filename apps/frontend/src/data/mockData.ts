import { LearningModule, DailyMission } from '../types';

export const initialMissions: DailyMission[] = [
  {
    id: 'm1',
    title: 'Bacaan Fokus (Fotosintesis)',
    description: 'Selesai • Berhasil dapat +20 XP',
    rewardXp: 20,
    completed: true,
    type: 'reading',
    targetModuleId: 'fotosintesis',
  },
  {
    id: 'm2',
    title: 'Kuis Santai Adaptif (3 Soal)',
    description: 'Siap Dikerjakan • Hadiah +30 XP',
    rewardXp: 30,
    completed: false,
    type: 'quiz',
    targetModuleId: 'fotosintesis',
  },
];

export const initialModules: LearningModule[] = [
  {
    id: 'fotosintesis',
    title: 'Fotosintesis & Tumbuhan Hijau',
    category: 'Sains',
    subjectBadge: 'Sains Biologi',
    sourceBadge: 'Biologi • Dibuat dari 2 Foto Catatan',
    iconName: 'forest',
    iconBg: '#E8F8F0',
    iconColor: '#006C49',
    description:
      'Bagaimana daun menangkap cahaya matahari dan mengubah air menjadi sari makanan dengan tenang tanpa ribet rumus panjang.',
    readTime: '3 Menit Baca',
    badges: ['3 Menit Baca', 'Font Ramah Mata', 'Ada Audio'],
    hasAudio: true,
    hasSummary: true,
    masteryPercentage: 65,
    isRecentCompleted: true,
    isFeatured: true,
    lastProgressText: 'Sedang di Paragraf 4 • Bagian Klorofil & Energi Sinar',
    paragraphs: [
      {
        id: 1,
        heading: '1. Dapur Rahasia di Helai Daun',
        content:
          'Pernahkah kamu penasaran mengapa tumbuhan tidak perlu berjalan mencari makanan seperti hewan atau manusia? Jawabannya ada pada keajaiban fotosintesis. Tumbuhan memiliki kemampuan luar biasa untuk memasak makanannya sendiri langsung di dalam sel-sel daun mereka.',
        simplified:
          'Tumbuhan bisa masak makanannya sendiri di dalam daun tanpa harus bergerak mencari makanan.',
        keywords: ['Fotosintesis', 'Membuat makanan sendiri'],
      },
      {
        id: 2,
        heading: '2. Tiga Bahan Dasar yang Dibutuhkan',
        content:
          'Untuk memasak sari makanan, tumbuhan hanya butuh tiga bahan alami: air (H2O) yang diserap akar dari tanah, karbon dioksida (CO2) yang dihirup daun lewat pori-pori kecil bernama stomata, serta cahaya matahari sebagai kompor bertenaganya.',
        simplified:
          'Bahan masaknya cuma 3: air dari akar, udara (CO2) dari daun, dan sinar matahari sebagai energi panasnya.',
        keywords: ['Air', 'Karbon Dioksida', 'Cahaya Matahari', 'Stomata'],
      },
      {
        id: 3,
        heading: '3. Peran Klorofil: Si Panel Surya Alami',
        content:
          'Warna hijau pada daun berasal dari zat bernama klorofil. Klorofil berada di dalam organel yang disebut kloroplas. Fungsinya mirip panel surya modern: menangkap gelombang cahaya matahari lalu mengubahnya menjadi energi kimia yang siap meramu bahan masakan.',
        simplified:
          'Klorofil itu zat hijau daun. Kerjanya persis panel surya: menyerap sinar matahari untuk menyalakan proses memasak.',
        keywords: ['Klorofil', 'Kloroplas', 'Panel Surya Alami'],
      },
      {
        id: 4,
        heading: '4. Hasil Akhir yang Menyegarkan Seluruh Bumi',
        content:
          'Setelah proses masak selesai, tumbuhan menghasilkan dua hal hebat: glukosa (gula alami yang jadi makanan tumbuhan untuk tumbuh besar) dan oksigen bersih (O2) yang dilepaskan ke udara agar kita dan seluruh hewan bisa bernapas lega.',
        simplified:
          'Hasil akhirnya adalah gula (makanan bagi tumbuhan) dan gas oksigen bersih yang kita hirup setiap hari.',
        keywords: ['Glukosa', 'Oksigen (O2)', 'Napas Bersih'],
      },
    ],
    flashcards: [
      {
        id: 1,
        question: 'Apa itu klorofil?',
        answer: 'Zat pigmen hijau pada daun yang bertugas menangkap energi cahaya matahari.',
        hint: 'Mirip panel surya alami di helai daun.',
        category: 'Konsep Inti',
      },
      {
        id: 2,
        question: 'Apa fungsi dari stomata pada daun?',
        answer: 'Mulut daun kecil tempat pertukaran udara: menghirup karbon dioksida dan melepas oksigen.',
        hint: 'Pori-pori pernapasan tanaman.',
        category: 'Struktur Daun',
      },
      {
        id: 3,
        question: 'Dua zat apa yang dihasilkan dari fotosintesis?',
        answer: 'Glukosa (energi makanan tumbuhan) dan Oksigen (O2) untuk makhluk hidup bernapas.',
        hint: 'Satu manis untuk pohon, satu segar untuk paru-paru.',
        category: 'Hasil Proses',
      },
      {
        id: 4,
        question: 'Dari mana tumbuhan mendapatkan air untuk fotosintesis?',
        answer: 'Diserap oleh akar dari dalam tanah lalu dialirkan ke daun melalui pembuluh xilem.',
        hint: 'Akar di dalam tanah.',
        category: 'Bahan Baku',
      },
      {
        id: 5,
        question: 'Di organel sel apa fotosintesis berlangsung?',
        answer: 'Di dalam kloroplas, yaitu tempat khusus yang menyimpan klorofil.',
        hint: 'Dapur utama sel tumbuhan.',
        category: 'Sel Tumbuhan',
      },
      {
        id: 6,
        question: 'Gas apa yang diserap daun dari udara sekitar?',
        answer: 'Gas Karbon Dioksida (CO2).',
        hint: 'Gas yang dikeluarkan manusia saat mengembuskan napas.',
        category: 'Bahan Baku',
      },
      {
        id: 7,
        question: 'Apa yang dimaksud dengan pembuluh Xilem?',
        answer: 'Jaringan pipa pengangkut yang membawa air dan mineral dari akar ke daun.',
        hint: 'Mengalirkan air ke atas.',
        category: 'Transportasi',
      },
      {
        id: 8,
        question: 'Apa yang dimaksud dengan pembuluh Floem?',
        answer: 'Jaringan pipa yang mengedarkan hasil masakan fotosintesis (glukosa) ke seluruh tubuh tanaman.',
        hint: 'Membagikan makanan ke buah, batang, dan akar.',
        category: 'Transportasi',
      },
      {
        id: 9,
        question: 'Apa perbedaan Reaksi Terang dan Reaksi Gelap?',
        answer: 'Reaksi terang butuh cahaya matahari langsung; reaksi gelap membentuk gula tanpa perlu sinar langsung.',
        hint: 'Satu pakai lampu surya, satu meramu gula.',
        category: 'Tahapan Kimia',
      },
      {
        id: 10,
        question: 'Mengapa daun biasanya gugur atau menguning di musim kering?',
        answer: 'Tumbuhan mengurangi klorofil dan penguapan air demi menghemat energi saat air tanah menipis.',
        hint: 'Mode hemat daya alami.',
        category: 'Adaptasi',
      },
      {
        id: 11,
        question: 'Mengapa udara di bawah pohon terasa sejuk di siang hari?',
        answer: 'Karena pohon menyerap panas matahari, melepas oksigen segar, dan mengeluarkan uap air sejuk.',
        hint: 'Oksigen baru + peneduh alami.',
        category: 'Fakta Keren',
      },
      {
        id: 12,
        question: 'Bagaimana rumus kimia santai fotosintesis?',
        answer: 'Air + Karbon Dioksida + Cahaya Matahari = Glukosa + Oksigen.',
        hint: 'Bahan alami jadi makanan & udara segar.',
        category: 'Rumus Mudah',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'Apa tugas utama zat klorofil pada daun tanaman hijau?',
        options: [
          'Menangkap dan menyerap energi sinar matahari',
          'Mengusir hama serangga pengganggu',
          'Menyimpan cadangan air tanah saat hujan',
          'Membuat daun mengeluarkan wangi bunga',
        ],
        correctIndex: 0,
        explanation:
          'Klorofil bekerja mirip panel surya alami, menangkap partikel cahaya matahari untuk memulai proses pembuatan makanan.',
      },
      {
        id: 2,
        question: 'Gas segar apa yang dilepaskan tumbuhan ke udara sebagai hasil fotosintesis?',
        options: [
          'Karbon Monoksida (CO)',
          'Oksigen Segar (O2)',
          'Gas Nitrogen Bebas',
          'Uap Asam Belerang',
        ],
        correctIndex: 1,
        explanation:
          'Tepat sekali! Tumbuhan menyerap CO2 dan melepaskan O2 bersih yang sangat kita perlukan untuk bernapas.',
      },
      {
        id: 3,
        question: 'Bagian lubang pori kecil pada daun tempat pertukaran udara disebut...',
        options: ['Stomata', 'Kloroplas', 'Nukleus', 'Kromosom'],
        correctIndex: 0,
        explanation:
          'Stomata adalah pori-pori kecil di permukaan daun yang berfungsi seperti hidung kecil tempat keluar masuknya udara.',
      },
    ],
    voicePrompt: {
      question:
        'Coba ceritakan dengan santai: Kenapa daun pohon di sekitarmu biasanya berwarna hijau dan apa yang sedang mereka lakukan saat terkena sinar matahari?',
      expectedKeywords: ['hijau', 'klorofil', 'cahaya', 'makanan', 'matahari', 'fotosintesis', 'oksigen'],
      sampleGoodAnswer:
        'Daun berwarna hijau karena punya zat klorofil. Waktu kena sinar matahari, klorofil menangkap cahaya untuk memasak air dan udara jadi glukosa dan oksigen.',
      tip: 'Santai saja, ceritakan seolah kamu lagi menjelaskan ke teman sebangku!',
    },
  },
  {
    id: 'siklus-air',
    title: 'Siklus Air & Hujan di Bumi',
    category: 'Sains',
    subjectBadge: 'Geografi',
    sourceBadge: 'Geografi • Dibuat dari File PDF Modul',
    iconName: 'water_drop',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    description:
      'Perjalanan uap air dari samudra hangat menuju awan mendung hingga turun menyirami bumi dalam bahasa cerita yang mengalir.',
    readTime: '4 Menit Baca',
    badges: ['Ringkasan Poin', 'Suara Alami'],
    hasAudio: true,
    hasSummary: true,
    masteryPercentage: 75,
    lastProgressText: '8 Kartu Tanya Jawab • 1 Kuis Adaptif • Narasi Suara Siap',
    paragraphs: [
      {
        id: 1,
        heading: '1. Air di Bumi Tidak Pernah Habis',
        content:
          'Air yang kita minum hari ini mungkin adalah air yang sama yang pernah diminum oleh dinosaurus jutaan tahun lalu! Ini karena air di bumi terus berputar dalam lingkaran tanpa henti yang disebut siklus hidrologi.',
        simplified:
          'Jumlah air di bumi selalu sama karena terus berputar dalam siklus abadi yang tidak pernah berhenti.',
        keywords: ['Siklus Hidrologi', 'Perputaran Air'],
      },
      {
        id: 2,
        heading: '2. Menguap Naik ke Langit (Evaporasi)',
        content:
          'Saat matahari menyinari laut, sungai, dan danau, air menjadi hangat lalu berubah wujud menjadi uap air yang tak kasat mata. Proses ini dinamai evaporasi. Tumbuhan juga ikut mengeluarkan uap air lewat daunnya (transpirasi).',
        simplified:
          'Panas matahari membuat air laut dan sungai menguap naik ke langit menjadi uap air.',
        keywords: ['Evaporasi', 'Transpirasi', 'Uap Air'],
      },
      {
        id: 3,
        heading: '3. Menjadi Awan (Kondensasi) & Hujan (Presipitasi)',
        content:
          'Makin tinggi naik, udara makin dingin. Uap air yang dingin itu berkumpul menjadi butiran air kecil membentuk awan (kondensasi). Ketika awan sudah terlalu berat menampung air, butiran itu jatuh kembali ke tanah sebagai hujan (presipitasi).',
        simplified:
          'Uap air mendingin jadi awan mendung, lalu saat berat turun kembali sebagai titik-titik air hujan.',
        keywords: ['Kondensasi', 'Awan', 'Presipitasi', 'Hujan'],
      },
    ],
    flashcards: [
      {
        id: 1,
        question: 'Apa itu proses Evaporasi?',
        answer: 'Perubahan air dari wujud cair di permukaan bumi menjadi uap air karena panas matahari.',
        hint: 'Air menguap ke atas langit.',
        category: 'Siklus Air',
      },
      {
        id: 2,
        question: 'Apa itu proses Kondensasi?',
        answer: 'Uap air yang mendingin di angkasa dan mengembun menjadi butiran air pembentuk awan.',
        hint: 'Uap jadi gumpalan awan.',
        category: 'Siklus Air',
      },
      {
        id: 3,
        question: 'Apa istilah ilmiah untuk terjadinya hujan?',
        answer: 'Presipitasi, yaitu jatuhnya air dari awan ke permukaan bumi (bisa berupa hujan cair, salju, atau es).',
        hint: 'Titik air jatuh dari awan.',
        category: 'Siklus Air',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'Penguapan air dari permukaan laut akibat panas matahari disebut...',
        options: ['Evaporasi', 'Infiltrasi', 'Presipitasi', 'Kondensasi'],
        correctIndex: 0,
        explanation: 'Evaporasi adalah istilah penguapan air permukaan karena energi panas matahari.',
      },
      {
        id: 2,
        question: 'Ketika butiran air di awan sudah terlalu padat dan jatuh ke bumi, proses ini dinamakan...',
        options: ['Presipitasi (Hujan)', 'Transpirasi', 'Sublimasi', 'Erosi'],
        correctIndex: 0,
        explanation: 'Presipitasi adalah peristiwa turunnya air dari atmosfer ke bumi dalam bentuk hujan atau salju.',
      },
    ],
    voicePrompt: {
      question: 'Ceritakan bagaimana air di laut bisa menjadi air hujan yang membasahi genting rumahmu!',
      expectedKeywords: ['panas', 'menguap', 'awan', 'hujan', 'dingin'],
      sampleGoodAnswer: 'Air laut menguap karena matahari, lalu naik mendingin jadi awan, dan saat awan penuh turunlah hujan.',
      tip: 'Gunakan alur: laut -> uap -> awan -> hujan!',
    },
  },
  {
    id: 'tata-surya',
    title: 'Tata Surya & Planet Kita',
    category: 'Sains',
    subjectBadge: 'Sains Antariksa',
    sourceBadge: 'Sains Antariksa • Dibuat dari Tanya AI',
    iconName: 'rocket_launch',
    iconBg: '#F3E8FF',
    iconColor: '#7E22CE',
    description:
      'Mengenal 8 planet sahabat bumi dengan kartu ilustrasi santai dan fakta unik yang gampang diingat saat ujian sekolah.',
    readTime: '3 Menit Baca',
    badges: ['Kartu Gambar', 'Kuis Ringan'],
    hasAudio: true,
    hasSummary: true,
    masteryPercentage: 0,
    lastProgressText: '6 Kartu Siap Latih • Ringkasan visual orbit & gaya gravitasi',
    paragraphs: [
      {
        id: 1,
        heading: '1. Matahari: Pusat Kehangatan Kita',
        content:
          'Tata surya kita adalah keluarga besar yang berpusat pada Matahari, sebuah bintang raksasa yang menyala terang. Gravitasi matahari yang sangat kuat menjaga 8 planet tetap berputar teratur di lintasannya masing-masing tanpa tabrakan.',
        simplified:
          'Semua planet berputar mengelilingi Matahari yang punya gaya gravitasi sangat kuat.',
        keywords: ['Matahari', 'Bintang', 'Gravitasi', 'Orbit'],
      },
      {
        id: 2,
        heading: '2. Urutan 8 Planet Tetangga Bumi',
        content:
          'Ada cara seru menghafal urutan planet dari yang terdekat: Merkurius (si kecil lincah), Venus (si bintang fajar yang panas), Bumi (rumah kita), Mars (planet merah berdebu), Yupiter (raksasa terbesar), Saturnus (bercincin megah), Uranus (planet es miring), dan Neptunus (si biru berangin kencang).',
        simplified:
          'Urutannya: Merkurius, Venus, Bumi, Mars, Yupiter, Saturnus, Uranus, Neptunus.',
        keywords: ['Merkurius', 'Venus', 'Bumi', 'Mars', 'Yupiter', 'Saturnus'],
      },
    ],
    flashcards: [
      {
        id: 1,
        question: 'Planet apa yang paling dekat dengan Matahari?',
        answer: 'Merkurius. Planet terkecil yang suhunya sangat ekstrem antara siang dan malam.',
        hint: 'Huruf depannya M.',
        category: 'Planet',
      },
      {
        id: 2,
        question: 'Planet terbesar di tata surya kita adalah...',
        answer: 'Yupiter! Memiliki badai bintik merah raksasa yang lebih besar dari bumi.',
        hint: 'Raksasa gas dengan cincin tipis.',
        category: 'Planet',
      },
      {
        id: 3,
        question: 'Planet mana yang terkenal dengan cincin indahnya yang terbuat dari es dan batu?',
        answer: 'Saturnus.',
        hint: 'Planet keenam dari matahari.',
        category: 'Planet',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'Planet terdekat dengan Matahari dalam tata surya adalah...',
        options: ['Merkurius', 'Venus', 'Mars', 'Bumi'],
        correctIndex: 0,
        explanation: 'Merkurius adalah planet urutan pertama yang paling dekat dengan matahari.',
      },
      {
        id: 2,
        question: 'Planet yang dikenal memiliki cincin es megah yang melingkarinya adalah...',
        options: ['Saturnus', 'Mars', 'Merkurius', 'Venus'],
        correctIndex: 0,
        explanation: 'Saturnus memiliki cincin spektakuler yang tersusun dari miliaran bongkahan es dan debu angkasa.',
      },
    ],
    voicePrompt: {
      question: 'Sebutkan minimal 4 nama planet di tata surya yang kamu ingat!',
      expectedKeywords: ['merkurius', 'venus', 'bumi', 'mars', 'yupiter', 'saturnus', 'uranus', 'neptunus'],
      sampleGoodAnswer: 'Bumi, Mars, Yupiter, dan Saturnus yang punya cincin cantik!',
      tip: 'Bisa sebutkan bumi dan planet favoritmu!',
    },
  },
];
