# Demo Script: Stuck Report & Gone Quiet (Silent Risk)

**Durasi:** ±3 menit  
**Tujuan:** Menunjukkan dua mekanisme deteksi dini Classync — laporan *Stuck* mahasiswa dengan Privacy Floor dan peringatan *Gone Quiet* (Silent Risk) untuk mahasiswa pasif.

---

## 0. Pemeran & Perangkat

| Kode | Peran | Dipegang | Perangkat |
|---|---|---|---|
| **TA** | Asisten Dosen | Presenter utama | Laptop: Discord + Web Dashboard |
| **S1** | Mahasiswa 1 | Anggota tim | HP (di-mirror ke layar) |
| **S2** | Mahasiswa 2 | Anggota tim | HP |
| **S3** | Mahasiswa 3 | Anggota tim | HP |
| **S4** | Mahasiswa 4 | Anggota tim | HP / Laptop |
| **S5** | Mahasiswa 5 (pelapor ke-5) | Presenter utama | Laptop profil browser kedua |
| **S6–S10** | Mahasiswa 6–10 (silent) | — | Sudah consent, **tidak melakukan apa-apa** |

> **Total 11 akun:** 1 TA + 10 mahasiswa. S6–S10 hanya perlu sudah consent di `/tasks` sebelum demo, tidak perlu memegang perangkat saat demo berlangsung.

---

## 1. Data & Persiapan (Pre-flight)

### Sebelum demo (T-30 menit):

- [ ] Jalankan `npm run db:seed` atau siapkan data bersih
- [ ] Buat **1 tugas** dengan deadline **6 hari dari sekarang** (dalam jangkauan 7-hari Silent Risk):
  ```
  /ta add-item title:"Tugas 4 — Binary Search Tree" due:"2026-09-25 23:59" kind:ASSIGNMENT announce:true
  ```
- [ ] **S1–S5** sudah consent (`/tasks` → *I Agree*), belum melakukan aksi apa pun pada Tugas 4
- [ ] **S6–S10** sudah consent (`/tasks` → *I Agree*), **tidak akan menyentuh tugas sama sekali** (ini yang jadi *Gone Quiet*)
- [ ] Bot menyala, web dashboard sudah login sebagai TA di `/g/[guildId]`
- [ ] Label stuck yang akan dipakai semua: **`traversal inorder`** (ketik persis, huruf kecil)
- [ ] Teks label sudah di clipboard, jangan ketik manual saat demo

---

## 2. Langkah Demo

### Bagian A: Stuck Report & Privacy Floor (±90 detik)

---

#### Langkah 1 — Mahasiswa pertama menandai Stuck (±15 dtk)

**Aksi:** S1 ketik `/tasks` → tap **Stuck** pada Tugas 4 → pilih **"Type a new one"** dari menu → modal muncul, ketik `traversal inorder` → submit.

**Yang harus kelihatan:**
- Checklist ephemeral (hanya S1 yang lihat, ada tulisan *"Only you can see this"*)
- Setelah submit: **"Saved privately."**
- **Tidak ada angka, tidak ada jumlah pelapor**

**Narasi:**
> "Mahasiswa ini mentok di konsep traversal inorder. Dia klik Stuck dan tulis apa yang bikin bingung. Tidak ada yang tahu — bahkan asdos. Data ini hanya miliknya."

---

#### Langkah 2 — Mahasiswa 2–4 menandai Stuck di konsep yang sama (±20 dtk)

**Aksi:** S2, S3, S4 masing-masing ketik `/tasks` → tap **Stuck** pada Tugas 4 → **pilih dari menu** (bukan ketik ulang): `traversal inorder` → submit.

**Yang harus kelihatan di masing-masing layar:**
- **"Saved privately."** — tanpa angka
- S3 dan S4 memilih label dari dropdown (membuktikan label ter-*normalize*, tidak membuat concept duplikat)

**Narasi:**
> "Tiga mahasiswa lain stuck di hal yang sama. Tapi bahkan sampai empat orang, sistem tetap diam. Tidak ada notifikasi ke asdos, tidak ada angka muncul. Privasi tetap terjaga."

---

#### Langkah 3 — Mahasiswa ke-5: Privacy Floor terpenuhi (±20 dtk) ⭐

**Aksi:** S5 ketik `/tasks` → tap **Stuck** pada Tugas 4 → pilih `traversal inorder` → submit.

**Yang harus kelihatan (di layar utama):**
- 🔴 **"5 students flagged this. You are not alone."**
- Di bawahnya: **"You can click Ask / Join Room to enter the discussion room."**
- Tombol untuk masuk ke concept room atau minta bantuan TA

**Narasi (pelan, ini momen kunci):**
> "Pelapor kelima. Baru sekarang angka muncul: 'lima mahasiswa menandai ini'. Bukan empat orang lain — lima total. Tidak ada nama, tidak ada daftar siapa. Hanya angka, hanya validasi: kamu tidak sendirian."

---

#### Langkah 4 — Dashboard TA: Heat Map berubah (±15 dtk)

**Aksi:** Buka web dashboard → halaman Overview (`/g/[guildId]`).

**Yang harus kelihatan:**
- **Heat Map "Stuck reports, last 7 days"**: sel pada baris "Tugas 4 — Binary Search Tree" hari ini berwarna **kuning/oranye** (5 reports)
- Warna sel: kosong (0), kuning (1–2), oranye (3–5), merah (6+)
- **Difficulty List**: concept `traversal inorder` muncul di daftar, badge menunjukkan jumlah open requests

**Narasi:**
> "Di dashboard asdos, heat map langsung menunjukkan ada masalah di Tugas 4. Semakin merah, semakin banyak mahasiswa yang stuck hari itu. Asdos bisa langsung lihat di mana kelasnya mentok."

---

### Bagian B: Gone Quiet / Silent Risk (±60 detik)

---

#### Langkah 5 — Perkenalkan konteks Gone Quiet (±10 dtk)

**Narasi (tanpa aksi):**
> "Sistem Stuck hanya mendeteksi mahasiswa yang **aktif melapor**. Tapi bagaimana dengan mahasiswa yang **diam total** — tidak pernah buka tugas, tidak pernah klik apa-apa? Mereka tidak kelihatan di mana pun. Itu justru yang paling berbahaya."

---

#### Langkah 6 — Dashboard TA: Kartu Gone Quiet muncul (±25 dtk) ⭐

**Aksi:** Di halaman Overview web dashboard, scroll ke kartu **"Gone quiet"** (ikon radar, warna kuning/amber).

**Yang harus kelihatan:**
- Kartu bertuliskan: **"Gone quiet — Students with no status on a task due within 7 days, out of 10 consented. Counts only."**
- Baris: **"Tugas 4 — Binary Search Tree"** dengan angka besar: **5 quiet**
  - Ini adalah S6–S10 yang consent tapi tidak pernah mengisi status apa pun
  - (S1–S5 sudah menandai Stuck, jadi mereka tidak masuk hitungan *quiet*)
- Deadline ditampilkan dalam format relatif (misal: "in 6 days")
- Jika ada reminder yang sudah dikirim, muncul badge: **"N ignored a reminder"**

**Narasi:**
> "Lima dari sepuluh mahasiswa yang sudah consent belum menyentuh tugas ini sama sekali — dan deadline tinggal enam hari. Sistem tidak menunjukkan siapa mereka, hanya jumlahnya. Tapi angka ini sudah cukup untuk asdos mengambil langkah."

---

#### Langkah 7 — Tunjukkan Privacy Floor bekerja di kedua arah (±15 dtk)

**Narasi (arahkan ke kartu):**
> "Kalau jumlah mahasiswa yang diam kurang dari lima, kartu ini tidak akan muncul sama sekali. Tampilannya: 'Nobody has gone quiet — Every task due this week has fewer than 5 silent students (privacy floor: 5).' Kami tidak pernah menunjukkan angka yang terlalu kecil untuk dilacak balik."

**Opsional:** Jika sudah menyiapkan item lain dengan < 5 mahasiswa quiet, tunjukkan bahwa item itu **tidak muncul** di kartu Gone Quiet.

---

#### Langkah 8 — Reminder DM otomatis (±10 dtk, opsional)

**Narasi (jelaskan tanpa harus menunggu cron):**
> "Setiap 15 menit, bot memeriksa tugas yang deadline-nya kurang dari 24 jam. Mahasiswa yang belum pernah mengisi status akan dapat DM: 'Reminder: Tugas 4 is due in X hours' — dengan dua tombol: Done atau Still stuck. Kalau mereka tetap diam, asdos bisa lihat di badge 'ignored a reminder'."

**Jika ingin mendemonstrasikan live:** Ubah deadline tugas menjadi < 24 jam dari sekarang, tunggu cron (`*/15 * * * *`), dan tunjukkan DM yang masuk di HP S6.

---

### Penutup (±10 detik)

**Aksi:** Tampilkan overview dashboard lengkap — stat cards, heat map, difficulty list, dan Gone Quiet semua terlihat dalam satu halaman.

**Narasi:**
> "Dua mekanisme, satu tujuan: mahasiswa yang aktif melapor ditangani lewat Stuck Report. Mahasiswa yang diam terdeteksi lewat Gone Quiet. Dua-duanya tanpa nama, hanya angka. Asdos tahu kelasnya butuh bantuan — sebelum nilainya yang memberitahu."

---

## 3. Ringkasan Mekanisme

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUCK REPORT                              │
│                                                                   │
│  Student taps Stuck → picks/types concept label                  │
│  ↓                                                                │
│  Database: ItemStatus.state = STUCK, linked to Concept           │
│  ↓                                                                │
│  < 5 reporters: "Saved privately." (no count shown anywhere)     │
│  ≥ 5 reporters: "5 students flagged this. You are not alone."    │
│  ↓                                                                │
│  Dashboard: Heat Map cell turns amber/orange/red                 │
│  Dashboard: Difficulty List ranks concept by open help requests  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        GONE QUIET                                │
│                                                                   │
│  Consented student + task due within 7 days                      │
│  + no ItemStatus change at all (state = NONE)                    │
│  ↓                                                                │
│  Count quiet students per task                                   │
│  ↓                                                                │
│  < 5 quiet: card hidden entirely                                 │
│  ≥ 5 quiet: "Gone quiet" card with count + deadline              │
│  ↓                                                                │
│  Reminder cron (every 15 min): DM students with tasks            │
│  due < 24 hours who haven't interacted yet                       │
│  ↓                                                                │
│  Dashboard badge: "N ignored a reminder"                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Checklist QA

| # | Lolos kalau | ✅/❌ |
|---|---|---|
| 1 | S1 menandai Stuck, muncul "Saved privately." tanpa angka | |
| 2 | S2–S4 menandai Stuck, masing-masing muncul "Saved privately." tanpa angka | |
| 3 | S5 menandai Stuck, muncul **"5 students flagged this. You are not alone."** | |
| 4 | Heat Map di dashboard menampilkan sel berwarna pada Tugas 4 hari ini | |
| 5 | Difficulty List menampilkan `traversal inorder` dengan badge open request | |
| 6 | Kartu Gone Quiet menampilkan **5 quiet** untuk Tugas 4 (S6–S10) | |
| 7 | Jika quiet count < 5, kartu menampilkan "Nobody has gone quiet" | |
| 8 | Nama mahasiswa tidak muncul di mana pun — hanya angka agregat | |
| 9 | Reminder DM dikirim untuk tugas H-24 jam dengan tombol Done/Still stuck | |

---

## 5. Catatan Privasi

- **Privacy Floor = 5** diterapkan konsisten di seluruh sistem:
  - `getStuckCount()` → return `null` jika < 5 (`packages/core/src/services/concepts.ts`)
  - `getSilentRisk()` → omit item jika quiet count < 5 (`packages/core/src/services/silentRisk.ts`)
  - `stuckNotice()` → tampilkan "Saved privately." jika count `null` (`apps/bot/src/ui/tasks.ts`)
- **Zero PII:** Tidak ada nama mahasiswa di kartu Gone Quiet, hanya angka. Kode secara eksplisit query `select: { id: true }` tanpa field identitas.
- **Reminded count** juga dilindungi Privacy Floor: `remindedQuietCount` hanya ditampilkan jika ≥ 5 (`silentRisk.ts` line 65).
