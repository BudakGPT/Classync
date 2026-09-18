# EXECUTIVE SUMMARY

# HACKATHON INFORMATICS FESTIVAL 2026

# Classync Bot Discord Penghubung Bantuan Akademik

# bagi Mahasiswa dan Tim Pengajar

## Nama Tim:

BudakGPT

## Anggota Tim:

Erik Wilbert — Universitas Indonesia

Helven Marcia — Universitas Indonesia

Malik Alifan Kareem — Universitas Indonesia

Haekal Handrian — Universitas Indonesia

# DAFTAR ISI

1. Latar Belakang dan Analisis Masalah	1
1.1 Konteks dan Skala Masalah	1
1.2 Teknologi Eksisting dan Batasnya	1
1.3 Rumusan Masalah	2
2. Tujuan	2
3. Solusi yang Ditawarkan	2
3.1 Gambaran Umum Solusi	2
3.2 Alur Berpikir dari Masalah ke Solusi	3
3.3 Inti Teknis dan Perlindungan Privasi	4
3.4 Arsitektur dan Ruang Lingkup Prototipe 24 Jam	4
3.5 Keterkaitan dengan Tema dan Dampak	5
Daftar Pustaka	6

# <u>1. Latar Belakang dan Analisis Masalah</u>

## 1.1 Konteks dan Skala Masalah

Dalam studi di Kuwait University, sebanyak 207 dari 432 jawaban substantif menyebut rasa malu dan kekhawatiran terhadap citra diri sebagai alasan tidak mencari bantuan akademik. Angka tersebut setara dengan 47,9% (Alotaibi et al., 2026). Salah satu partisipan menggambarkan pengalamannya dengan ungkapan, "*Embarrassment. Uncomfortable and* *hesitant.*" (bagian "*Reasons for not seeking academic support*", para. 2). Temuan ini menunjukkan bahwa kebutuhan akan bantuan tidak selalu diikuti keberanian atau kenyamanan untuk memintanya. Grafik berikut merangkum berbagai hambatan yang dilaporkan.

Gambar 1. Hambatan mencari bantuan akademik. Sumber: Alotaibi et al. (2026), Gambar 3. Persentase dari 432 jawaban substantif dalam sampel 1.134 mahasiswa di Kuwait, dibulatkan dalam satu desimal.

Penelitian Qayyum (2018) terhadap 438 mahasiswa di Kanada juga menunjukkan bahwa mahasiswa cenderung meminta bantuan kepada teman sekelas dibandingkan pengajar. Kepercayaan kepada teman dan rasa terancam ketika mengungkapkan kesulitan turut berkaitan dengan kecenderungan tersebut. Bagi mahasiswa yang baru bergabung atau belum memiliki teman dekat, jaringan bantuan informal seperti ini belum tentu tersedia. Temuan tersebut digunakan sebagai dasar perancangan Classync, bukan sebagai ukuran prevalensi masalah pada mahasiswa di Indonesia.

Dalam skenario kelas sasaran, pengumuman tugas yang disampaikan melalui Discord dapat tertimbun oleh percakapan baru. Mahasiswa kemudian perlu mencari kembali tenggat dan mengingat tugas yang belum selesai. Ketika mengalami kesulitan, sebagian mahasiswa memilih untuk tidak bertanya, sementara tim pengajar dapat menerima pertanyaan serupa melalui pesan yang terpisah. Akibatnya, kesulitan yang dialami banyak mahasiswa sulit terlihat dan penjelasan yang sudah diberikan juga sulit ditemukan kembali.

## 1.2 Teknologi Eksisting dan Batasnya

*Learning Management System* (LMS) tetap menjadi sumber materi dan pengumuman resmi, sementara Discord digunakan untuk menyampaikan kembali informasi dalam komunikasi kelas. Pesan pribadi kepada teman dapat membantu mahasiswa yang sudah memiliki jaringan pertemanan, tetapi kurang membantu mahasiswa yang belum memiliki teman dekat untuk bertanya.

Pertanyaan kepada asisten juga sering datang secara terpisah sehingga pertanyaan yang sama perlu dijawab berulang kali. Berbeda dari *ticket bot* yang menangani permintaan satu per satu, Classync mengelompokkan kesulitan yang serupa agar satu jawaban dapat diberikan kepada beberapa mahasiswa sekaligus dan digunakan kembali.

## 1.3 Rumusan Masalah

Berdasarkan permasalahan tersebut, Classync dirancang untuk menjawab tiga pertanyaan berikut:

1. Bagaimana membuat pengumuman tugas tetap mudah ditemukan serta memungkinkan mahasiswa memantau status pengerjaannya tanpa harus menelusuri percakapan?
2. Bagaimana menyediakan akses bantuan bagi mahasiswa yang belum memiliki jaringan pertemanan tanpa memaksa mereka mengungkapkan kesulitannya kepada seluruh kelas?
3. Bagaimana membantu tim pengajar menangani kesulitan yang berulang secara lebih efisien dan mempertahankan solusi agar dapat ditelusuri kembali?
# 2. Tujuan

Classync menetapkan tujuan yang secara langsung menjawab ketiga permasalahan tersebut.

1. Mengubah pengumuman menjadi *checklist* pribadi yang memuat judul, tenggat, jenis kegiatan, dan status pengerjaan, sehingga mahasiswa dapat memantau tugas tanpa harus mencari kembali pengumuman di antara percakapan.
2. Menyediakan cara bagi mahasiswa untuk menandai kesulitan secara privat dan meminta bantuan secara sadar, sehingga bantuan dapat diakses tanpa mengharuskan mahasiswa langsung membuka identitasnya kepada kelas.
3. Mengelompokkan kesulitan yang serupa agar tim pengajar dapat memberikan satu jawaban kepada beberapa mahasiswa sekaligus, serta menyimpan jawaban tersebut agar dapat digunakan kembali oleh mahasiswa berikutnya.
# 3. Solusi yang Ditawarkan

## 3.1 Gambaran Umum Solusi

Classync adalah *bot* Discord yang menghubungkan mahasiswa yang mengalami kesulitan dengan tim pengajar. Mahasiswa, termasuk yang belum memiliki jaringan pertemanan di kelas, dapat menggunakan *checklist* pribadi untuk melihat tugas, menandai kesulitan secara privat, dan meminta bantuan tanpa harus bertanya di depan seluruh kelas. Tim pengajar

kemudian dapat melihat kesulitan yang paling banyak dilaporkan dan memberikan satu penjelasan kepada beberapa mahasiswa yang mengalami kesulitan serupa.

Classync digunakan pada server Discord kelas yang sudah berjalan. Tim pengajar mengatur konfigurasi Classync untuk kelas, termasuk menentukan kanal pengumuman yang akan dibaca oleh *bot*. Dengan memanfaatkan kanal komunikasi yang sudah digunakan mahasiswa, Classync tidak mengharuskan dosen mengadopsi aplikasi baru. Jawaban yang telah diberikan juga dapat disimpan dan digunakan kembali oleh mahasiswa lain yang mengalami kesulitan pada konsep yang sama.

## 3.2 Alur Berpikir dari Masalah ke Solusi

1. **Tahap 1, menjaga informasi tetap tersedia.** Tim pengajar menjalankan */setup* untuk menghubungkan Classync dengan server kelas, menentukan kanal pengumuman, dan memberikan persetujuan akses. Setelah terpasang, pengumuman pada kanal tersebut diubah menjadi *ClassItem* yang memuat judul, tenggat, dan jenis kegiatan. Mahasiswa dapat membuka */tugas* untuk melihat daftar tugas secara *ephemeral*, sehingga hanya dapat dilihat oleh dirinya sendiri. Status tugas dapat diperbarui menjadi *done*, *in* *progress*, atau *stuck*, kemudian pengingat pribadi diberikan berdasarkan status dan tenggat.
2. **Tahap 2, mengenali kesulitan bersama.** Saat memilih *stuck*, mahasiswa dapat memasukkan label konsep yang menjadi sumber kesulitan atau memilih label yang sudah tersedia. *LLM* mengusulkan penggabungan label dengan makna serupa dalam tugas yang sama, misalnya “AWS tidak jalan” dan “Error AWS”. Penggabungan tersebut dapat diperbaiki. Setelah jumlah pelapor memenuhi ambang privasi, mahasiswa dapat melihat jumlah mahasiswa lain yang mengalami kesulitan pada konsep yang sama tanpa mengetahui identitas mereka.
3. **Tahap 3, membuka bantuan secara sadar.** Menandai tugas sebagai *stuck* tidak secara otomatis mengungkapkan identitas mahasiswa kepada tim pengajar. Untuk meminta bantuan, mahasiswa harus mengirim *help request* melalui tindakan terpisah dan mengonfirmasi bahwa identitasnya akan terlihat oleh tim pengajar untuk tugas tersebut. Permintaan kemudian masuk ke antrean tim pengajar, dengan kelompok konsep diurutkan berdasarkan jumlah peminta aktif. Tim pengajar dapat memberikan satu jawaban kepada suatu kelompok, dan jawaban tersebut dikirim secara privat kepada seluruh mahasiswa dalam kelompok tersebut.
4. **Tahap 4, membuat jawaban tetap berguna.** Jawaban yang diberikan disimpan bersama konsep terkait dan dapat disematkan pada tugas. Ketika mahasiswa lain mengalami kesulitan pada konsep yang sama, jawaban yang telah tersedia dapat digunakan kembali. Jawaban yang masih relevan juga dapat digunakan pada kelas berikutnya tanpa membawa identitas mahasiswa yang sebelumnya meminta bantuan. Mahasiswa tetap dapat menyatakan bahwa mereka masih membutuhkan bantuan sehingga pengiriman jawaban tidak otomatis menandakan bahwa masalah telah <u>selesai.</u>

## 3.3 Inti Teknis dan Perlindungan Privasi

Prioritas bantuan ditentukan berdasarkan jumlah *help request* yang masih aktif pada setiap konsep. Setiap mahasiswa dihitung satu kali untuk setiap konsep. Kelompok dengan jumlah peminta terbanyak diprioritaskan, sedangkan jika jumlahnya sama, permintaan yang lebih dahulu masuk akan didahulukan.

Status tugas mahasiswa disimpan dalam *ItemStatus* dan dipisahkan dari *HelpRequest*. Tim pengajar hanya dapat melihat identitas mahasiswa yang mengajukan permintaan bantuan, bukan status tugas mahasiswa lainnya. Dosen dan mahasiswa lain tidak dapat melihat identitas maupun daftar permintaan bantuan. Akses data diperiksa pada setiap permintaan berdasarkan peran pengguna, dan permintaan bantuan dipisahkan dari proses penilaian.

Informasi agregat hanya ditampilkan setelah sedikitnya lima mahasiswa melaporkan kesulitan. Aturan yang sama diterapkan pada setiap konsep untuk mengurangi risiko identifikasi pada kelompok kecil. Batas lima mahasiswa merupakan batas desain awal dan bukan jaminan anonimitas penuh. *Bot* hanya membaca kanal pengumuman yang telah disetujui dan input yang diberikan secara sengaja oleh mahasiswa, tanpa menganalisis percakapan lain di dalam server.

Mahasiswa dapat mencabut persetujuan melalui *opt-out* dan meminta penghapusan data. Identitas mahasiswa tidak dikirim ke *LLM*. Hasil *parsing* pengumuman harus lolos validasi *JSON* sebelum digunakan, sedangkan hasil penggabungan konsep dapat diperbaiki atau dibatalkan. Pengumuman kuis atau ujian memerlukan konfirmasi sebelum diproses, sementara *help request* untuk keduanya dinonaktifkan secara bawaan. Pengingat berhenti setelah tugas ditandai *done* atau persetujuan dicabut.

## 3.4 Arsitektur dan Ruang Lingkup Prototipe 24 Jam

Rancangan *Classync* menggunakan *discord.js v14* sebagai *bot*, *Fastify* sebagai *HTTP API*, *node-cron* untuk pengingat, serta PostgreSQL melalui Prisma sebagai basis data. *Dashboard* tim pengajar dibangun menggunakan Next.js dan Tailwind. Seluruh komponen dikelola dalam satu repositori dan satu lingkungan *deployment* agar prototipe dapat dikembangkan dan diuji dalam 24 jam. *LLM* digunakan untuk mengolah pengumuman menjadi data terstruktur dan mengusulkan penggabungan label konsep, sedangkan penjelasan akademik tetap diberikan oleh tim pengajar.

Gambar 2. Rancangan arsitektur Classync dalam satu lingkungan layanan.

Ruang lingkup utama mencakup konfigurasi dan persetujuan, pengolahan pengumuman, *checklist*, perubahan status, label dan penggabungan konsep, jumlah mahasiswa dengan kesulitan serupa, pengungkapan identitas dalam dua tahap, antrean tim pengajar, pengiriman satu jawaban kepada beberapa peminta, pengingat pribadi, *opt-out*, dan penghapusan data.

Penggunaan ulang jawaban menjadi fitur pembeda yang diprioritaskan setelah alur utama stabil. Fitur lanjutan mencakup *dashboard* tren kesulitan, tampilan agregat */kelas*, dan penyematan jawaban. Kalender, pilihan bahasa, dan tautan berbagi untuk tim pengajar di luar *server* direncanakan untuk pengembangan berikutnya.

Prototipe tidak mencakup pencocokan teman belajar, ruang belajar otomatis, impor daftar mahasiswa, pembuatan kanal atau peran secara massal, penjadwalan pengumuman oleh admin, integrasi LMS, WhatsApp, maupun aplikasi *mobile* mandiri. Peringkat mahasiswa, pemantauan status oleh pihak lain, analisis percakapan, dan pertukaran berkas jawaban antarmahasiswa juga dikecualikan untuk menjaga fokus dan privasi.

Pengerjaan *Hack Day* dibagi menjadi empat tahap. Jam ke-0–6 digunakan untuk skema data, data demonstrasi, *checklist*, dan status. Jam ke-6–12 berfokus pada konsep, *help request*, antrean, dan pengiriman jawaban. Jam ke-12–18 digunakan untuk pengingat, persetujuan, penggunaan ulang jawaban, dan *dashboard* minimum. Jam ke-18–24 digunakan untuk integrasi *LLM*, pengolahan pengumuman, dan pengujian menyeluruh. Jika *LLM* gagal, sistem mencoba kembali satu kali sebelum beralih ke input manual atau label yang sudah tersedia.

## 3.5 Keterkaitan dengan Tema dan Dampak

Tema *Tech for Human Connections* diwujudkan melalui jalur bantuan yang memungkinkan mahasiswa mencari bantuan tanpa harus bertanya secara terbuka atau bergantung pada teman dekat. Dalam subtema *Receiver & Provider*, mahasiswa berperan sebagai penerima bantuan, sedangkan tim pengajar sebagai penyedia bantuan. Mahasiswa tetap menentukan kapan kesulitannya dibagikan, sementara tim pengajar memperoleh gambaran mengenai kesulitan yang paling membutuhkan perhatian.

Won dan Chang (2024) menemukan bahwa penghindaran mencari bantuan berkaitan dengan niat bertahan dalam studi yang lebih rendah pada sampel 213 mahasiswa teknik. Temuan ini menunjukkan pentingnya menyediakan jalur bantuan yang lebih mudah diakses, tetapi belum membuktikan dampak Classync terhadap retensi maupun hasil akademik.

Dampak awal Classync akan dievaluasi melalui uji coba sukarela dengan melihat waktu yang dibutuhkan untuk menemukan pengumuman, waktu hingga mendapat respons, jumlah mahasiswa yang dapat dibantu melalui satu jawaban, dan persentase jawaban yang dinilai membantu. Pengujian teknis juga dilakukan untuk memastikan identitas tetap tersembunyi sebelum persetujuan dan informasi agregat tidak ditampilkan sebelum memenuhi ambang privasi. Hasil evaluasi akan dilaporkan sebagai temuan uji coba, termasuk pengalaman mahasiswa yang belum memiliki jaringan pertemanan dekat di kelas.

# <u>Daftar Pustaka</u>

Alotaibi, N. M., Khalaf, R. T., Marzouq, D. B., Almutairi, S. S., Hussain, A. E., Alfreesh, G.

A., Albadi, A. M., Alhamad, H. H., & Abouelhassan, H. A. (2026). Kuwait university students’ perspectives on academic support-seeking and associated factors: A preliminary convergent mixed-methods study. *Frontiers in Education, 11*, Article 1915972. [https://doi.org/10.3389/feduc.2026.1915972](https://doi.org/10.3389/feduc.2026.1915972)
Qayyum, A. (2018). Student help-seeking attitudes and behaviors in a digital era. *International Journal of Educational Technology in Higher Education, 15*, Article 17. [https://doi.org/10.1186/s41239-018-0100-7](https://doi.org/10.1186/s41239-018-0100-7)

Won, S., & Chang, Y. (2024). Antecedents and consequences of academic help-seeking in online STEM learning. *Frontiers in Psychology, 15*, Article 1438299. [https://doi.org/10.3389/fpsyg.2024.1438299](https://doi.org/10.3389/fpsyg.2024.1438299)