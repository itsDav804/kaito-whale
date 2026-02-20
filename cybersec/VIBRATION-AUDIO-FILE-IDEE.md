# Ide: File Audio (MP3/WAV) yang Isinya Pola Getaran

Konsep: hasil enkripsi/encode **bentuk file** (misalnya MP3 atau WAV), dan saat file itu **diputar** di device, yang “keluar” adalah **pola getaran** (bukan musik atau suara yang didengar). **Hanya ide; belum implementasi.**

---

## 1. Gagasan utama

- **Output bukan hanya “getaran real-time”** di satu device, tapi **file** yang bisa:
  - Disimpan, dikirim (WhatsApp, email, USB), dibuka di device lain.
- **Isi file:** Bukan lagu atau podcast, tapi **representasi pola getaran** (panjang/pendek, on/off).
- **Saat “diputar”:**
  - Device memainkan file itu sehingga user **merasakan getaran** (haptic), sesuai pola di file — seperti “pesan rahasia” yang hanya bisa “dibaca” lewat getaran.

---

## 2. Dua cara file bisa “berisi” getaran

### Cara 1: Audio sebagai pembawa (carrier)

File **benar-benar audio** (WAV/MP3), tapi **sinyal audionya** dipakai untuk mengode **pola getaran**:

- **Contoh sederhana:**
  - Satu frekuensi (mis. 50 Hz atau bass rendah): **amplitude tinggi** = “vibrate on”, **amplitude nol** = “vibrate off”.
  - **Lama** amplitude tinggi = lama getaran, **lama** nol = lama jeda.
- Jadi: urutan getaran (panjang/pendek) → diubah jadi urutan **potongan audio** (keras/lembut, panjang pendek) → disimpan sebagai WAV/MP3.
- **Saat diputar:**
  - **Opsi A:** Diputar di speaker biasa. Getaran speaker (bass) bisa terasa jika phone diletakkan di speaker — tanpa app khusus, tapi tergantung device/speaker.
  - **Opsi B:** **Player khusus** (web/app) yang:
    1. Memuat file audio.
    2. Decode sinyal (amplitude envelope, atau deteksi on/off) jadi urutan durasi getaran.
    3. Memanggil API getaran device (`navigator.vibrate(...)`) sesuai urutan itu.
  - Jadi “play” = aplikasi baca audio → keluaran utama = **getaran**, bukan suara (bisa mute atau volume nol).

**Kelebihan:** File format standar (MP3/WAV), bisa dibagi ke mana saja.  
**Kekurangan:** Perlu player yang paham “audio ini = pola getaran” dan yang memicu haptic.

---

### Cara 2: Data getaran di dalam file (metadata / chunk)

File tetap **berformat audio** (supaya bisa dibuka/dikirim seperti MP3/WAV), tapi **pola getaran** disimpan di bagian khusus file:

- **WAV:** Bisa pakai **custom chunk** (bagian data di luar sampel suara) yang berisi urutan durasi getaran (ms), atau kode Braille/ciphertext.
- **MP3:** Kurang fleksibel untuk data arbitrer; bisa pakai **tag/lyrics** (teks) yang berisi pola getaran ter-encode (mis. string angka), lalu player baca tag itu dan menggerakkan vibrator.
- **Alternatif:** File **bukan** MP3 asli, tapi format lain (JSON, binary) yang **di-rename .mp3** atau dibungkus supaya mudah dibagi; **hanya app kita** yang bisa “memutar” dengan arti: baca data → getaran.

**Saat diputar:** Hanya **player kita** (web/app) yang:
1. Buka file.
2. Baca chunk/tag/data pola getaran.
3. (Opsional) dekripsi jika data terenkripsi.
4. Jalankan getaran sesuai pola.

**Kelebihan:** Kontrol penuh; getaran bisa 1:1 dengan data (tak ada konversi audio→getaran).  
**Kekurangan:** Hanya bermakna di player kita; putar di pemutar musik biasa tidak otomatis jadi getaran.

---

## 3. Tempat enkripsi dalam alur

- **Plaintext** → (opsional) **enkripsi** dengan kunci → ciphertext / payload rahasia.
- Payload itu di-**encode** jadi **pola getaran** (sama seperti ide sebelumnya: ciphertext → Braille/getaran, atau plaintext → Braille → getaran).
- Pola getaran (urutan durasi) → **ditulis ke file**:
  - **Cara 1:** Dikonversi ke sinyal audio (amplitude on/off) → simpan sebagai WAV/MP3.
  - **Cara 2:** Disimpan sebagai data (chunk/tag/format custom) di dalam file.
- **Penerima:** Buka file di player kita → dapat pola getaran (dari audio atau dari chunk) → (opsional) decode + dekripsi → plaintext; atau cukup “putar” sebagai getaran saja (tanpa decode ke teks).

Jadi file MP3/WAV itu **bentuk** dari pesan (yang sudah dienkripsi atau tidak); isi yang “dibaca” oleh user = **pola getaran** saat diputar.

---

## 4. Alur ringkas

```
Pengirim:
  Plaintext → (Enkripsi) → Encode ke pola getaran → Tulis ke file (WAV/MP3 atau custom)
  → Kirim file (WhatsApp, email, dll.)

Penerima:
  Terima file → Buka di player kita → Baca pola getaran (dari audio atau chunk)
  → Putar getaran di device (navigator.vibrate / haptic)
  → (Opsional) Decode + dekripsi → plaintext
```

---

## 5. Manfaat ide ini

- **Shareable:** Pesan = file, bisa dikirim lewat channel mana saja (chat, email, USB).
- **Offline:** Penerima bisa buka file nanti, tidak harus online saat kirim.
- **“Bentuk MP3”:** User bisa bilang “ini file MP3” — di dalam bisa musik biasa atau (dalam versi kita) “pola getaran” yang hanya bermakna saat diputar di player kita.
- **Kombinasi dengan enkripsi:** File bisa berisi ciphertext yang di-encode jadi getaran; hanya yang punya kunci + player yang bisa dapat plaintext.

---

## 6. Yang perlu didesain (nanti, kalau implementasi)

1. **Format file:** WAV dengan custom chunk vs WAV/MP3 murni sinyal audio vs format custom pakai ekstensi .mp3.
2. **Mapping:** Pola getaran (ms on/off) ↔ sampel audio atau ↔ struktur data di chunk/tag.
3. **Player:** Web atau app yang memuat file, ekstrak pola getaran, panggil API getaran (dan opsional decode + dekripsi).
4. **Enkripsi:** Tetap di lapisan “plaintext ↔ ciphertext”; file hanya membawa representasi (getaran) dari ciphertext atau plaintext.

---

## 7. Ringkasan

| Aspek | Keterangan |
|-------|------------|
| **Bentuk** | File (e.g. MP3/WAV) |
| **Isi** | Pola getaran (encode dari pesan / ciphertext) |
| **Saat diputar** | Device mengeluarkan getaran sesuai pola (via player kita), bukan sekadar suara |
| **Enkripsi** | Bisa dipasang sebelum encode ke getaran; file = wadah untuk “pesan getaran” (terenkripsi atau tidak) |

Ini hanya ide; belum ada kode atau spesifikasi teknis detail. Kalau mau, langkah berikut bisa: pilih Cara 1 (audio carrier) vs Cara 2 (chunk/data), lalu tulis spesifikasi format file dan alur baca/tulis.
