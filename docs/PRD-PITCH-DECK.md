# Classync — Pitch Deck Blueprint & Product Requirements Document (PRD)
**Kompetisi:** IFest 2026 Hackathon (Universitas Padjadjaran)  
**Tema:** *Tech for Human Connections* — **Sub-tema:** *Receiver & Provider*  
**Tim Pengembang:** BudakGPT (Erik Wilbert, Helven Marcia, Malik Alifan Kareem, Haekal Handrian)  
**Tujuan Dokumen:** Panduan lengkap perancangan slide presentasi (PowerPoint / Canva) dan skrip pitching live demo.

---

## 1. Brand Kit & Panduan Visual Slide

Gunakan panduan warna dan tipografi resmi Classync agar slide presentasi konsisten dan selaras dengan aplikasi:

| Elemen | Nilai / Kode Warna | Penggunaan pada Slide |
|---|---|---|
| **Sync Blue** (Primary) | `#136AFB` | Warna dominan tombol, highlight angka statistik, garis aksen, dan judul utama. |
| **Navy** (Dark Neutral) | `#0E2343` | Warna teks judul besar, background gelap (pada slide cover / intro), dan footer. |
| **Sky Blue** (Secondary) | `#60A4FC` | Warna sub-judul, grafik garis, badge aksen, dan panah diagram. |
| **Ice Blue** (Light Tint) | `#EDF4FF` | Background kartu informasi, container fitur, dan latar tabel perbandingan. |
| **Mist Blue** (Border) | `#C9DDFC` | Garis tepi (*borders*) pada mock-up kartu dan diagram alur. |
| **Soft White** (Canvas) | `#FDFDFD` | Latar belakang dasar slide presentasi agar bersih, modern, dan mudah dibaca. |
| **Font Utama** | *Plus Jakarta Sans* / *Inter* | Bold untuk judul (28–36pt), Regular/Medium untuk body text (14–18pt). |
| **Logo Asset** | `apps/web/public/logo.png` & `mark.png` | Gunakan di sudut kiri/kanan atas seluruh slide dan tengah cover. |

---

## 2. Blueprint 12 Slide Presentasi Pitch Deck

Berikut adalah rancangan detail slide-by-slide lengkap dengan konten teks slide, konsep visual, dan skrip presenter:

---

### Slide 1: Cover / Title Slide
* **Visual:** Background gradien halus (Ice Blue `#EDF4FF` ke Soft White `#FDFDFD`), Logo Classync horizontal di tengah, badge tema IFest 2026.
* **Judul Utama:** **Classync**
* **Tagline:** *Tech for Human Connections: Menghubungkan Bantuan Akademik Tanpa Rasa Malu.*
* **Sub-keterangan:** Sistem Peringatan Dini Akademik & Kolaborasi Kelas Terpadu (Discord Bot + Web Dashboard).
* **Footer:** Tim BudakGPT · Universitas Indonesia · IFest 2026 Hackathon.
* **Speaker Script (15 detik):**
  > *"Selamat pagi/siang Dewan Juri yang terhormat. Berapa banyak dari kita yang pernah merasa stuck saat mengerjakan tugas kuliah, tapi terlalu malu untuk bertanya di grup kelas? Kami dari Tim BudakGPT mempersembahkan Classync: teknologi penghubung bantuan akademik yang mengubah budaya diam menjadi kolaborasi proaktif tanpa rasa takut dihakimi."*

---

### Slide 2: The Problem — The Silent Struggle
* **Visual:** Split layout. Sisi kiri berupa angka statistik besar (47.9%), sisi kanan ilustrasi obrolan grup Discord yang ramai (*chat noise*) dan pesan tugas tertimbun.
* **Poin Kunci di Slide:**
  * **47.9% Mahasiswa Malu Bertanya:** Riset akademik membuktikan hambatan terbesar mencari bantuan bukanlah tidak ada materi, melainkan rasa malu dan takut dicap bodoh (Alotaibi et al., 2026).
  * **Hanya Mengandalkan Teman Dekat:** Mahasiswa hanya bertanya pada *circle* terdekat (Qayyum, 2018). Mahasiswa baru, pendiam, atau tanpa teman akhirnya tertinggal sendirian (*the silent struggle*).
  * **Pengumuman Tugas Tertimbun:** Notifikasi tugas di Discord kelas sering tenggelam dalam obrolan harian.
  * **TA Burnout:** Asisten Dosen menjawab pertanyaan yang persis sama berkali-kali di berbagai jalur pesan pribadi (DM).
* **Speaker Script (20 detik):**
  > *"Kenyataannya, hampir separuh mahasiswa memilih diam saat tidak paham materi karena takut dihakimi. Mereka yang punya teman dekat mungkin bisa bertanya lewat pesan pribadi, tapi bagaimana dengan mereka yang tidak punya teman di kelas? Di sisi lain, asisten dosen kelelahan menjawab pertanyaan yang sama berulang kali di DM, sementara deadline tugas sering terlewat karena tenggelam oleh percakapan grup."*

---

### Slide 3: Existing Solutions & Why They Fall Short
* **Visual:** Tabel matriks perbandingan 4 kolom (LMS Moodle/Canvas, Grup WhatsApp/Discord, Ticket Bot, dan Classync).
* **Konten Tabel:**

| Fitur / Parameter | LMS Konvensional | Grup Chat Biasa | Ticket Bot Support | Classync |
|---|:---:|:---:|:---:|:---:|
| **Pelaporan Kesulitan Privat** | ❌ Tidak Ada | ❌ Publik / Malu | ⚠️ Tiket Individual | ✅ **Anonim & Privat** |
| **Agregasi Konsep Bersama** | ❌ Tidak Ada | ❌ Acak | ❌ Per User | ✅ **Clustering Konsep** |
| **Ambang Privasi (*Privacy Floor*)** | ❌ Tidak Ada | ❌ Tidak Ada | ❌ Tidak Ada | ✅ **Aktif saat $\ge 5$ Orang** |
| **Koneksi Teman Sejawat (*Peer*)** | ❌ Kaku | ⚠️ Terbatas Circle | ❌ Tidak Ada | ✅ **Receiver & Provider** |
| **Otomasi Onboarding & Roster** | ⚠️ Butuh Admin Kampus | ❌ Manual | ❌ Manual | ✅ **AI Excel Importer** |

* **Speaker Script (15 detik):**
  > *"LMS kampus terlalu kaku dan jarang dibuka. Grup chat umum membuat mahasiswa enggan bertanya secara terbuka. Ticket bot biasa hanya menangani masalah secara terpisah tanpa mengelompokkan konsep. Di sinilah Classync hadir mengisi celah: menghubungkan mahasiswa dan pengajar secara tepat sasaran."*

---

### Slide 4: The Solution — Ekosistem Classync
* **Visual:** Ilustrasi ekosistem 3 pilar yang saling terhubung:
  1. **Discord Bot:** Antarmuka mahasiswa (checklist privat `/tasks`, verifikasi identitas, dan ruang diskusi).
  2. **Core Services & Prisma:** Mesin privasi, clustering kendala, dan peer matching.
  3. **TA Web Dashboard (Next.js 15):** Antarmuka pengajar (analitik heatmap, difficulty ranking, dan quick answer).
* **Poin Kunci di Slide:**
  * **Zero Friction:** Berjalan di Discord yang sudah digunakan sehari-hari oleh mahasiswa.
  * **Safe & Private:** Privasi adalah pondasi utama, bukan fitur tambahan.
  * **Answer Once, Help Everyone:** Asisten dosen menjawab 1 kali, solusi langsung terdistribusi ke seluruh mahasiswa yang membutuhkan.
* **Speaker Script (20 detik):**
  > *"Classync menghadirkan ekosistem terpadu: bot Discord yang ramah di sisi mahasiswa, dan web dashboard analitik yang powerful di sisi asisten dosen. Mahasiswa tidak perlu menginstal aplikasi baru, dan dosen tidak perlu mengubah kurikulum."*

---

### Slide 5: Onboarding Cerdas & Gerbang Verifikasi (1 NPM = 1 Akun)
* **Visual:** Alur 3 langkah dari Excel $\rightarrow$ Web Dashboard $\rightarrow$ Discord Role & Nickname.
* **Poin Kunci di Slide:**
  * **AI-Powered Roster Import:** Cukup unggah spreadsheet kelas (.xlsx/.csv), AI otomatis mengenali kolom NPM, Nama, dan Kelas tanpa template yang kaku.
  * **Idempotent Automated Setup:** `/setup auto` secara instan membuat channel akademik, kategori per kelas (`📁 KELAS A`, `📁 KELAS B`), dan role tanpa duplikasi.
  * **Gerbang Verifikasi 1 NPM = 1 Discord:** Mahasiswa baru masuk ke `#verifikasi`, menginput NPM, dan seketika mendapatkan role `@Verified`, role kelas, serta nama server diubah menjadi `NPM - Nama Lengkap`.
  * **Database Protection:** Penataan ulang server aman 100% tanpa menghapus data database mahasiswa dan tugas.
* **Speaker Script (20 detik):**
  > *"Sebelum kelas dimulai, asisten cukup mengunggah data kelas di web. Dengan bantuan AI, format spreadsheet apa pun langsung terbaca. Saat mahasiswa masuk ke server Discord, bot mengunci akses sampai mahasiswa memverifikasi NPM mereka. Dalam sekejap, nama, role, dan channel kelas mereka terkonfigurasi secara otomatis."*

---

### Slide 6: Private Task Tracking & The "Silent Stuck"
* **Visual:** Mockup antarmuka `/tasks` di Discord (tampilan ephemeral) yang menunjukkan tombol status dan notifikasi *Stuck*.
* **Poin Kunci di Slide:**
  * **Ephemeral & Personal:** Menu `/tasks` hanya bisa dilihat oleh mahasiswa itu sendiri.
  * **4 Status Sederhana:** `NONE` (⚪), `IN_PROGRESS` (🔵), `DONE` (✅), `STUCK` (🔴).
  * **Konsep Berbasis Tagging:** Mahasiswa memilih atau mengetik topik kendala (contoh: *Docker*, *CORS Error*, *Recursion*).
  * **Privacy Floor ($\ge 5$ Pelapor):** Jika $< 5$ orang, bot hanya menjawab *"Tersimpan secara privat"*. Ketika $\ge 5$ orang melaporkan kendala serupa, muncul pesan: *"🔴 5 mahasiswa lain juga kesulitan di topik ini. Kamu tidak sendirian."*
  * **Zero-Grading Risk:** Data ini terisolasi dari penilaian dosen sehingga mahasiswa bebas berekspresi tanpa takut nilai anjlok.
* **Speaker Script (20 detik):**
  > *"Ketika mengerjakan tugas, mahasiswa cukup membuka checklist pribadi mereka. Jika mengalami kendala, mereka menandai 'Stuck' pada konsep tertentu. Di sinilah sentuhan manusiawi Classync bekerja: melalui ambang privasi minimal 5 orang, mahasiswa mendapatkan bukti nyata bahwa mereka tidak bodoh dan tidak sendirian."*

---

### Slide 7: Tech for Human Connections — Receiver & Provider
* **Visual:** Diagram alur *Peer Matching* (dua avatar mahasiswa terhubung dengan ikon jabat tangan anonim) dan *Private Concept Room*.
* **Poin Kunci di Slide:**
  * **Peer Helper Matching:** Mahasiswa yang sudah menyelesaikan tugas (*Done*) dapat menyalakan opsi *Helper*. Sistem memasangkan mahasiswa yang *Stuck* (*Receiver*) dengan rekan penolong (*Provider*) secara anonim via relay bot.
  * **Identitas Terlindungi:** Kedua mahasiswa berdiskusi tanpa saling mengetahui nama asli hingga keduanya sepakat membuka identitas (*Mutual Reveal*).
  * **Private Concept Rooms:** Bot secara otomatis membuka ruang diskusi privat terfokus (`#room-[item]-[concept]`) jika banyak mahasiswa mengalami kendala serupa.
  * **Due-Date Gated Moderation:** Ruang diskusi dilindungi dari penutupan sebelum deadline berakhir agar mahasiswa tetap dapat berdiskusi hingga menit terakhir.
* **Speaker Script (20 detik):**
  > *"Menjawab tema IFest 2026: Tech for Human Connections dengan sub-tema Receiver & Provider, Classync menjembatani mahasiswa yang membutuhkan bantuan dengan rekan sekelas yang bersedia membantu secara anonim. Hubungan pertemanan baru terbangun dari interaksi tolong-menolong yang aman."*

---

### Slide 8: Proactive Broadcasting & Task Catalog
* **Visual:** Mockup kartu pengumuman tugas baru di channel `#pengumuman-tugas` lengkap dengan tombol interaktif dan tampilan command `/announceall`.
* **Poin Kunci di Slide:**
  * **Auto-Announce on Create:** Saat TA membuat tugas lewat `/ta add-item`, parameter `announce: true` otomatis menyiarkan kartu tugas ke channel pengumuman resmi.
  * **Interaktif Tanpa Mengetik:** Kartu pengumuman dilengkapi tombol **`📋 Buka Tugas Saya`** dan **`🙋 Tanya / Diskusi`** yang langsung membuka menu pribadi mahasiswa dalam 1 klik.
  * **Katalog `/announceall`:** Sekali klik, asisten dosen dapat menyiarkan ringkasan seluruh tugas yang masih aktif (belum lewat deadline) agar tidak ada tugas yang terlewat.
  * **Pengingat Cerdas H-24 Jam:** Bot secara otomatis mengirim pesan pengingat ke mahasiswa yang belum selesai 24 jam sebelum batas waktu.
* **Speaker Script (15 detik):**
  > *"Tugas tidak akan pernah tenggelam lagi. Setiap tugas baru otomatis diumumkan dengan kartu interaktif dan deadline yang menyesuaikan zona waktu lokal pengguna. Pengajar juga memiliki perintah `/announceall` untuk merekap seluruh aktivitas aktif secara instan."*

---

### Slide 9: Real-time TA Dashboard & Heatmap
* **Visual:** Screenshot antarmuka Web Dashboard TA (Heatmap kesulitan 7 hari, tabel Difficulty List warna-warni, dan editor jawaban).
* **Poin Kunci di Slide:**
  * **7-Day Struggle Heatmap:** Visualisasi matriks waktu untuk mendeteksi kapan dan di topik mana hambatan kelas memuncak.
  * **Difficulty Ranking:** Daftar topik tersulit yang diurutkan dari yang paling mendesak (Merah $\ge 5$, Kuning 3–4, Hijau $< 3$).
  * **Answer Once, Deliver to All:** Asisten dosen cukup mengetik solusi 1 kali di web dashboard; bot secara otomatis mengirimkan jawaban ke seluruh mahasiswa yang meminta bantuan via DM dan menyematkannya di ruang diskusi.
  * **Knowledge Base Abadi:** Jawaban tersimpan rapi untuk digunakan kembali pada angkatan atau semester berikutnya.
* **Speaker Script (20 detik):**
  > *"Bagi asisten dosen, dashboard web menyajikan peta panas kesulitan kelas secara real-time. TA tahu persis materi mana yang perlu dibahas ulang di kelas responsi. Cukup ketik solusi satu kali, sistem akan mendistribusikannya ke seluruh mahasiswa yang membutuhkan."*

---

### Slide 10: Privacy, Security & Legal Compliance
* **Visual:** Ikon perisai keamanan dengan 4 pilar hukum dan etika.
* **Poin Kunci di Slide:**
  * **Kepatuhan UU PDP No. 27/2022 & GDPR:** Layar persetujuan (*consent screen*) wajib pada penggunaan pertama, lengkap dengan hak untuk dilupakan (*Right to be Forgotten*) melalui tombol **Delete my data**.
  * **Prinsip Minimisasi Data:** Bot tidak membaca isi percakapan umum; intents berjalan tanpa `MessageContent`.
  * **Pemisahan Data Akademik:** Data kesulitan belajar disimpan mandiri dan terpisah dari sistem penilaian (*zero grading interference*).
  * **Privasi AI:** Identitas dan data pribadi mahasiswa tidak pernah dikirim ke pihak ketiga atau model bahasa (LLM).
* **Speaker Script (15 detik):**
  > *"Kami membangun Classync dengan standar kepatuhan hukum yang ketat terhadap UU Perlindungan Data Pribadi No. 27 Tahun 2022. Mahasiswa memegang kendali penuh atas data mereka, dan privasi mereka dijamin oleh sistem secara kriptografis dan arsitektural."*

---

### Slide 11: Live Demo Walkthrough (90 Detik)
* **Visual:** Split screen: Sebelah kiri Discord Client (tampilan mahasiswa), sebelah kanan Web Dashboard (tampilan asisten dosen).
* **Alur Demo Singkat:**
  1. **Detik 0–25:** TA membuat tugas `/ta add-item title:"Tugas 1: Algoritma Graph" due:"2026-09-25 23:59" announce:true` $\rightarrow$ Muncul pengumuman interaktif di `#pengumuman-tugas`.
  2. **Detik 25–50:** Mahasiswa menekan `📋 Buka Tugas Saya`, menandai `STUCK` pada konsep `Dijkstra vs BFS`.
  3. **Detik 50–70:** Begitu mencapai threshold pelapor, mahasiswa mendapat notifikasi solidaritas. Di web dashboard TA, Heatmap langsung menyala merah pada topik tersebut.
  4. **Detik 70–90:** TA mengirimkan tips/jawaban dari web dashboard $\rightarrow$ Jawaban langsung terkirim via DM ke mahasiswa dan tersemat di ruang diskusi privat.
* **Speaker Script (15 detik):**
  > *"Mari kita saksikan bagaimana Classync bekerja secara live dalam 90 detik. Dari pembuatan tugas, penandaan kendala privat oleh mahasiswa, hingga asisten dosen memberikan solusi massal secara real-time."*

---

### Slide 12: Impact, Scalability & The Future
* **Visual:** Grafik proyeksi dampak dan roadmap integrasi masa depan (Logo Canvas, Moodle, Google Classroom).
* **Poin Kunci di Slide:**
  * **Dampak Nyata:**
    * **70%+ Efisiensi Waktu Asdos:** Mengeliminasi ratusan chat DM yang berulang.
    * **Peningkatan Keterlibatan Kelas:** Mahasiswa pendiam memiliki suara tanpa rasa takut.
    * **Early Warning System:** Mencegah angka ketertinggalan dan *dropout* sebelum ujian akhir.
  * **Rencana Pengembangan (Roadmap):**
    * Integrasi dua arah dengan LMS Kampus (Canvas, Moodle, Google Classroom).
    * Algoritma rekomendasi materi berbasis kesulitan konsep.
    * Ekspansi ke tingkat fakultas dan universitas di seluruh Indonesia.
* **Penutup:** *"Classync: Because no student should struggle in silence."*
* **Speaker Script (15 detik):**
  > *"Classync bukan sekadar bot, melainkan jembatan empati di era digital. Dengan menghemat waktu pengajar dan merangkul mahasiswa yang tertinggal, kami mewujudkan pendidikan tinggi yang lebih inklusif dan kolaboratif. Terima kasih, kami siap menjawab pertanyaan Dewan Juri."*

---

## 3. Matriks Tanya-Jawab Dewan Juri (Anticipated Q&A Defenses)

Siapkan jawaban berikut untuk mengantisipasi pertanyaan tajam juri:

#### Q1: "Mengapa harus Discord? Kenapa tidak membuat aplikasi mobile/web sendiri dari awal?"
* **Jawaban:** *“Mahasiswa sudah mengalami kelelahan aplikasi (app fatigue). Discord adalah platform di mana mahasiswa dan komunitas IT sudah aktif setiap hari. Dengan mengintegrasikan solusi ke tempat mereka berkumpul, kita menghilangkan hambatan adopsi (zero adoption barrier) tanpa memaksa mereka mendownload aplikasi baru.”*

#### Q2: "Bagaimana jika ada mahasiswa iseng yang spam status 'Stuck' agar tugas terlihat sulit?"
* **Jawaban:** *“Classync memiliki relasi unik: 1 Mahasiswa (NPM terverifikasi) hanya memiliki 1 status per item tugas (`@@unique([itemId, studentId])`). Artinya, seorang mahasiswa tidak dapat melakukan spam voting ganda. Selain itu, sistem ambang privasi (minimal 5 mahasiswa unik) menyaring anomali laporan palsu.”*

#### Q3: "Apakah data kesulitan ini tidak disalahgunakan dosen untuk memberi nilai jelek?"
* **Jawaban:** *“Secara arsitektur database, tabel `ItemStatus` dan `Concept` terpisah total dari sistem akademik atau penilaian. Pengajar hanya melihat agregat statistik tanpa nama, kecuali mahasiswa tersebut secara sadar menekan tombol 'Request TA Help'. Hak ini juga dilindungi oleh UU PDP di mana mahasiswa dapat menghapus seluruh riwayat interaksinya kapan saja.”*

#### Q4: "Bagaimana cara bot menangani server kelas yang memiliki ratusan mahasiswa dan banyak kelas paralel?"
* **Jawaban:** *“Classync dilengkapi fitur AI Roster Import yang otomatis membagi mahasiswa ke dalam kategori per kelas (misal: Kelas A, Kelas B). Seluruh channel dan role diisolasi secara private category, dan sistem caching Discord.js menjamin performa tetap instan tanpa lag.”*

---
*Dokumen ini dirancang oleh Tim BudakGPT untuk kesiapan 100% materi presentasi dan live demo Final IFest 2026 Hackathon.*
