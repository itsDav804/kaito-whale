# Ide: Enkripsi dalam alur Plaintext ↔ Getaran (Vibration)

Konsep enkripsi yang terhubung dengan pipeline **teks → getaran** dan **getaran → teks**, sehingga hanya pihak yang punya kunci yang bisa dapat plaintext. **Hanya ide; belum implementasi.**

---

## 1. Konteks

- **Yang sudah ada (Kaito Whale):** Plaintext → Braille (6 titik) → pola getaran (panjang/pendek) → dikirim/dirasakan. Siapa saja yang merasakan getaran bisa mengartikan teks (tidak ada rahasia).
- **Yang diinginkan:** Versi di mana getaran yang dirasakan **tidak** langsung terbaca sebagai pesan, kecuali penerima punya **kunci** untuk mendekripsi.

---

## 2. Dua pendekatan mekanisme

### Pendekatan A: Enkripsi dulu, baru encode ke getaran

**Alur pengirim:**
1. Plaintext (pesan rahasia)
2. **Enkripsi** dengan kunci (symmetric key dari passphrase atau shared secret) → **ciphertext** (deretan byte atau string, misalnya base64/hex)
3. Encode ciphertext ke getaran: setiap karakter ciphertext dipetakan ke pola getaran (bisa Braille 6-titik per karakter, atau alfabet getaran khusus)
4. Kirim/putar getaran

**Alur penerima:**
1. Terima/rasakan getaran
2. Decode getaran → deretan karakter (ciphertext)
3. **Dekripsi** dengan kunci yang sama → plaintext

**Sifat:**
- Siapa yang tidak punya kunci hanya dapat ciphertext (deretan karakter tidak bermakna).
- Getaran tetap “satu karakter = satu sel Braille” (atau satu simbol), tapi karakternya adalah ciphertext, bukan teks asli.

---

### Pendekatan B: Enkripsi alur Braille/getaran

**Alur pengirim:**
1. Plaintext
2. Encode ke representasi Braille (deretan 6-titik per huruf)
3. **Enkripsi** deretan ini (bit/byte stream) dengan kunci → stream terenkripsi
4. Stream terenkripsi dipetakan ke pola getaran (misalnya 1 = getaran panjang, 0 = pendek, atau sebaliknya)
5. Kirim/putar getaran

**Alur penerima:**
1. Terima getaran → dapat stream (panjang/pendek)
2. **Dekripsi** stream dengan kunci → dapat deretan Braille
3. Decode Braille → plaintext

**Sifat:**
- Pola getaran sendiri yang “acak” tanpa kunci; tanpa kunci, getaran tidak bisa diartikan ke Braille yang benar.
- Butuh definisi jelas: stream enkripsi (bit/byte) bagaimana dipetakan ke durasi getaran (blok per blok, dengan padding/sync jika perlu).

---

## 3. Pemilihan pendekatan (ide)

| Aspek | A (Enkripsi → encode ke getaran) | B (Encode Braille → enkripsi stream) |
|-------|-----------------------------------|--------------------------------------|
| Kemudahan | Ciphertext bisa berupa string; encode ke getaran seperti “Braille per karakter” | Perlu aturan jelas stream ↔ getaran (blok, padding) |
| Panjang getaran | Ciphertext biasanya lebih panjang dari plaintext (overhead enkripsi + encoding) | Bisa diatur lewat ukuran blok |
| Keterbacaan tanpa kunci | Ciphertext terlihat sebagai deretan karakter acak | Getaran terlihat acak, tidak seperti Braille biasa |

**Rekomendasi ide:** Mulai dari **Pendekatan A** (enkripsi dulu, lalu encode ciphertext ke getaran) agar alur teks → enkripsi → getaran dan getaran → dekripsi → teks paling gampang didefinisikan tanpa mengubah format getaran yang sudah ada (tetap bisa “satu sel per unit”).

---

## 4. Kunci (ide)

- **Symmetric:** Satu kunci rahasia yang sama untuk enkripsi dan dekripsi.
  - Bisa dari **passphrase** yang dimasukkan pengirim dan penerima (diperkuat dengan KDF seperti PBKDF2/Argon2).
  - Atau **shared secret** yang sudah disepakati (manual atau lewat saluran lain).
- Kunci **tidak** dikirim lewat getaran; harus sudah ada di kedua pihak (input passphrase atau pre-shared).

---

## 5. Alur ringkas (Pendekatan A)

```
Pengirim:
  [Plaintext] → Enkripsi(key) → [Ciphertext] → Encode ke getaran (mis. Braille per char) → [Getaran]

Penerima:
  [Getaran] → Decode getaran → [Ciphertext] → Dekripsi(key) → [Plaintext]
```

- **Enkripsi/Dekripsi:** Algoritma standar (mis. AES-GCM) dengan key dari passphrase/shared secret.
- **Encode/Decode getaran:** Aturan tetap (satu karakter ciphertext = satu sel Braille, atau alfabet getaran tetap lainnya).

---

## 6. Batasan dan pertimbangan

- **Keamanan:** Bergantung pada kekuatan kunci, KDF, dan algoritma; ini hanya kerangka ide.
- **Panjang:** Ciphertext (terutama jika base64) bisa lebih panjang dari plaintext → getaran lebih lama.
- **Error:** Jika getaran salah/terpotong, decoding bisa salah sedikit → ciphertext salah → dekripsi gagal atau salah; bisa butuh skema deteksi error atau redundansi (nanti di implementasi).

---

## 7. Ringkasan

- **Hubungan dengan plaintext–getaran:** Enkripsi disisipkan **antara** teks dan getaran: teks dienkripsi dulu, hasil (ciphertext) yang di-encode ke getaran; penerima decode getaran ke ciphertext lalu dekripsi ke plaintext.
- **Versi “encryption”:** Tambah lapisan enkripsi/dekripsi berbasis kunci (symmetric + passphrase/shared secret) di kedua ujung; getaran membawa ciphertext, bukan plaintext.
- **Dokumen ini:** Hanya ide dan mekanisme; belum ada kode atau spesifikasi detail implementasi.

Kalau mau lanjut, langkah berikut: pilih Pendekatan A atau B, tentukan format ciphertext (mis. hex/base64) dan aturan encode-getaran (Braille per karakter atau custom), lalu tulis spesifikasi singkat sebelum coding.
