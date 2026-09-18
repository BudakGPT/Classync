# Classync — Demo Script

Owner: Malik (Pitch/QA). Sumber: PRD §7 (7 langkah wajib) + `research/FINDINGS.md`.
Dipakai buat tiga hal: **QA tiap merge ke `main`**, **rekaman video (≤ 5 menit)**, dan **demo live waktu pitch**.
Urutan teknis langkah 1–7 ngikutin PRD, jangan diubah. Yang boleh diubah cuma narasi.

---

## 0. Pemeran dan perangkat

| Kode | Akun Discord | Dipegang | Perangkat | Peran |
|---|---|---|---|---|
| **TA** | akun asdos (ada di `taUserIds`) | Malik | Laptop A (proyektor): Discord + dashboard web | Pasang pengumuman, jawab |
| **S1** | mahasiswa 1 | Malik | HP di-mirror ke layar | Checklist, stuck, **Request TA help**, HP yang bunyi |
| **S2–S4** | mahasiswa 2–4 | Erik, Helven, Haekal | HP masing-masing | Stuck dengan label yang sama |
| **S5** | mahasiswa 5 | Malik | Laptop A, profil browser kedua | Pelapor kelima, yang lihat "flagged this" di layar |
| **S6** | mahasiswa 6 | Malik | Laptop A, profil browser ketiga | "Mahasiswa berikutnya", langsung dapat jawaban |

Total **7 akun** (1 TA + 6 mahasiswa). Execution doc nyebut 6 akun, itu kurang satu buat langkah 6.
Kalau cuma ada 6: langkah 6 pakai **S2** (dia stuck tapi nggak minta bantuan, jadi nggak dapat DM). Ceritanya jadi "teman sekelas yang belum sempat nanya".

Semua akun mahasiswa **udah consent sebelum demo**, kecuali **S1**. Consent S1 ditunjukin live di langkah 2.

---

## 1. Data demo

**Dari seed (PRD §6), udah ada sebelum demo:**
- Item 1: concept "soal nomor 2", 6 stuck, 3 open request, plus 1 jawaban tersimpan di concept lain → isi heat map, difficulty list, knowledge base.
- Item 2: concept "install docker", 3 stuck → dipakai di langkah 7 (di bawah batas privasi).
- Item 3: kosong.

**Dibuat live di langkah 1** (item baru, concept baru, jadi hitungannya mulai dari 0):

```
📢 Tugas 3 Jaringan Komputer — Subnetting
Kerjakan soal subnetting di modul 3, kumpulkan di SCELE.
Deadline: Senin, 21 September 2026 pukul 23.59.
```

Label stuck yang dipakai semua akun: **`hitung subnet mask`** (ketik persis, huruf kecil).

Jawaban asdos yang ditempel di dashboard langkah 5:

```
Subnet mask dihitung dari jumlah host: cari 2^n − 2 ≥ jumlah host, n = bit host.
Contoh 50 host → n = 6 → prefix /26 → 255.255.255.192.
Lihat slide pertemuan 5 halaman 12.
```

---

## 2. Pre-flight (T-30 menit sebelum rekam / pitch)

- [ ] `npm run db:seed` (reseed). Item "Tugas 3 Jaringan Komputer" **belum ada**.
- [ ] Bot jalan di laptop A, log bersih. Dashboard kebuka dan udah login sebagai TA di `/g/[guildId]`.
- [ ] S1 **belum consent**. S2–S6 udah consent.
- [ ] Notifikasi DM Discord di HP S1 **nyala**, volume keras, mode jangan-ganggu mati. HP udah di-mirror ke layar.
- [ ] Hotspot cadangan nyala. Laptop dan HP dicas.
- [ ] Teks pengumuman, label, dan jawaban udah ada di clipboard manager atau file terbuka, biar nggak ngetik live.
- [ ] Tab cadangan: video rekaman auto-ingest (fallback langkah 1).

---

## 3. Langkah demo

Target waktu: **±4 menit** buat pitch, **≤ 5 menit** buat video.
Format tiap langkah: **Aksi** → **Yang harus kelihatan** (ini kriteria QA) → **Narasi** → **Kalau gagal**.

### Pembuka (sebelum langkah 1, 15 detik)

**Narasi:**
> "Waktu kami tanya mahasiswa kenapa nggak nanya asdos, nggak ada yang bilang malu. Katanya: asdos lama balas, takut ngeganggu, udah malam. Bertanya itu mahal. Classync bikin bertanya jadi satu klik, dan bikin satu jawaban asdos sampai ke semua yang butuh."

### Langkah 1 — Pengumuman jadi item (±30 dtk)

**Aksi:** TA paste pengumuman di channel pengumuman.
**Harus kelihatan:** bot balas pakai kartu: judul "Tugas 3 Jaringan Komputer — Subnetting", deadline 21 Sep 23.59, jenis Assignment, tombol **Correct**.
**Narasi:**
> "Asdos nggak perlu ngapa-ngapain beda. Dia tetap posting pengumuman kayak biasa, dan Classync baca jadi tugas."

**Kalau gagal** (nggak ada kartu dalam 10 detik, atau tanggalnya salah):
`/ta add-item title:Tugas 3 Jaringan Komputer — Subnetting due:2026-09-21 23:59 kind:ASSIGNMENT`
Bilang: "Ini jalur manualnya, versi otomatisnya ada di video." Jangan debugging di panggung.

### Langkah 2 — Checklist pribadi (±30 dtk)

**Aksi:** S1 (HP di layar) ketik `/tasks` → tap **I agree** → tap **In progress** di item Tugas 3.
**Harus kelihatan:** pesan consent muncul dulu. Setelah setuju, muncul checklist yang cuma kelihatan buat S1 ("Only you can see this"), isinya Tugas 3 di paling atas dengan status In progress.
**Narasi:**
> "Ini cuma dia yang lihat. Asdos nggak lihat, teman nggak lihat. Tiap tugas ada tiga tombol: lagi dikerjain, selesai, mentok."

**Kalau gagal:** pakai S6 yang udah consent, lewatin tampilan consent-nya.

### Langkah 3 — Lima orang mentok di hal yang sama (±45 dtk)

**Aksi:** S2, S3, S4, lalu S1 tap **Stuck** di Tugas 3 → "Type a new one" (cuma yang pertama) atau pilih dari menu → `hitung subnet mask`. Terakhir **S5 di layar**.
**Harus kelihatan:**
- S2–S4 dan S1: "Saved privately." Nggak ada angka.
- S5: "**N others flagged this**" (lihat catatan hitungan di §5).
- S3 dan S4 **memilih** label dari menu, bukan ngetik ulang (buktiin label nggak pecah jadi banyak concept).

**Narasi:**
> "Tombol mentok itu privat total. Nggak ada yang tahu siapa yang tap. Tapi begitu lima orang mentok di hal yang sama, mereka dikasih tahu: lo nggak sendirian. Angka, tanpa nama."

**Kalau gagal** (angka nggak muncul): cek apakah ada yang salah ketik label sehingga concept kepecah. Buka `/ta queue` atau dashboard buat tunjukin concept-nya, terus lanjut.

### Langkah 4 — Minta bantuan, satu klik (±30 dtk)

**Aksi:** S1 tap **Request TA help** → baca peringatan → konfirmasi. Pindah ke laptop: `/ta queue` di Discord, lalu dashboard.
**Harus kelihatan:**
- Peringatan: "Your name will be visible to the TA for this item only."
- `/ta queue`: "hitung subnet mask" muncul dengan nama S1.
- Dashboard (maks 5 detik, tanpa reload): concept ini ada di urutan **paling atas** difficulty list.

**Narasi** (penting, dua orang yang diinterview salah paham di bagian ini):
> "Beda dua tombol ini: **Stuck itu cuma lo yang tahu. Request help itu satu klik, dan asdos langsung dapet nama lo.** Nggak perlu buka app lain, nyusun pesan, mikir dulu sebelum kirim."

**Kalau gagal** (dashboard nggak update): reload manual sekali. Kalau tetap nggak ada, tunjukin `/ta queue` aja.

### Langkah 5 — Asdos jawab sekali, semua dapat (±45 dtk)

**Aksi:** TA klik concept "hitung subnet mask" di dashboard → paste jawaban → kirim. **Diam 3–5 detik**, tunggu HP bunyi.
**Harus kelihatan:**
- Dashboard: "Delivering…" → "**Delivered to N**".
- HP S1 bunyi, DM berisi jawaban.
- Channel pengumuman: jawaban diposting (dan di-pin).

**Narasi:**
> "Satu jawaban. Semua yang minta bantuan dapat DM, jawabannya dipasang di channel, dan disimpan."

**Kalau gagal** (nggak berubah jadi Delivered dalam 15 detik): pakai `/ta answer concept:hitung subnet mask body:…` dari Discord. Hasilnya sama, bot yang kirim langsung.

### Langkah 6 — Mahasiswa berikutnya langsung dapat jawaban (±30 dtk) ⭐ payoff

**Aksi:** S6 (layar) `/tasks` → **Stuck** di Tugas 3 → pilih `hitung subnet mask`.
**Harus kelihatan:** langsung "**A TA already answered this: …**" berisi jawaban langkah 5.
**Narasi** (pelan, ini klimaksnya):
> "Mahasiswa ini mentok jam sebelas malam. Dia nggak nunggu asdos, dan asdos nggak jawab untuk kedua kalinya. Jawabannya udah ada. Makin lama kelas pakai Classync, makin sering bertanya dijawab detik itu juga."

Ini jawaban buat "kenapa nggak tanya AI aja?". Tekankan: yang jawab asdos kelas itu sendiri, sesuai soal dan maksudnya.

**Kalau gagal:** buka knowledge base di dashboard (`/g/[guildId]/answers`), tunjukin jawabannya tersimpan.

### Langkah 7 — Batas privasi, live (±20 dtk)

**Aksi:** dashboard → buka item 2 (seed, 3 stuck di "install docker").
**Harus kelihatan:** "**Not enough reports yet (privacy floor: 5)**". Nggak ada angka sama sekali.
**Narasi:**
> "Di bawah lima orang, asdos nggak dapat angka apa-apa. Nggak ada tampilan per mahasiswa, dan database kami nggak nyimpen isi chat. Kami hitung, kami nggak ngawasin."

### Penutup (10 detik)

Balik ke dashboard overview: heat map + difficulty list.
> "Asdos sekarang tahu kelasnya mentok di mana, sebelum nilai yang ngasih tahu."

---

## 4. Checklist QA per merge

Jalanin setelah tiap merge ke `main`, di DB yang baru di-reseed. Tulis hasilnya di checkpoint `PROGRESS.md` ("steps passing _ / 7").

| # | Lolos kalau | ✅/❌ | Catatan |
|---|---|---|---|
| 1 | Kartu item muncul ≤ 10 dtk, judul + deadline benar (atau `/ta add-item` jalan) | | |
| 2 | Consent muncul di pemakaian pertama; checklist cuma kelihatan buat S1; status tersimpan setelah `/tasks` dibuka ulang | | |
| 3 | 4 pelapor pertama: "Saved privately"; pelapor ke-5: angka muncul; label dari menu nggak bikin concept baru | | |
| 4 | Ada peringatan identitas; muncul di `/ta queue` dengan nama; paling atas di dashboard ≤ 5 dtk tanpa reload | | |
| 5 | DM sampai ke semua requester; posting di channel; dashboard "Delivered to N" dengan N benar; nggak ada DM dobel | | |
| 6 | S6 langsung lihat jawaban tersimpan | | |
| 7 | Item 2 nampilin "Not enough reports yet", nggak bocor angka 3 di mana pun | | |

Cek privasi tambahan (sekali per checkpoint, bukan tiap merge):
- [ ] Akun non-TA pakai `/ta queue` → ditolak (ephemeral).
- [ ] Akun non-TA login ke dashboard → "You are not a TA in any Classync server."
- [ ] Tombol **Privacy** di S6 → data S6 kehapus, hitungan concept turun.
- [ ] Posting di channel **lain** → bot nggak bereaksi.

---

## 5. Yang perlu diputusin tim sebelum T-15

1. **Bunyi hitungan di langkah 3.** PRD tulis "5 others flagged this" buat pelapor kelima, padahal "others" dari sudut pandang dia cuma 4. Pilih salah satu dan samain di bot dan naskah:
   - "**5 students flagged this**" (disarankan, angkanya jujur dan cocok sama batas 5), atau
   - "4 others flagged this".
2. **Jumlah akun:** 7 (disarankan) atau 6 dengan S2 dipakai lagi di langkah 6.
3. **Posisi HP di video:** rekam layar HP S1 terpisah, atau kamera ke HP. Bunyi DM di langkah 5 itu momen paling kuat, jadi suaranya harus kerekam.
