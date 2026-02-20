# Cybersec — Ide & Mekanisme

Dokumen konsep proyek. Ada **PoC enkripsi getaran** (web app); sisanya gagasan dan mekanisme.

- **PoC:** Buka `public/cybersec-poc.html` di browser (setelah server jalan: `http://localhost:.../cybersec-poc.html`). Enkripsi → unduh file `.kwv`; unggah file + kata sandi → dekripsi, tampil plaintext, tombol **Putar getaran**.

---

## 1. Tujuan proyek

- Wadah eksperimen / pembelajaran **keamanan siber** (enkripsi, autentikasi, keamanan komunikasi).
- Bisa dipakai sebagai **dasar** untuk fitur keamanan di proyek lain (misalnya chat aman, penyimpanan rahasia).
- Fokus pada **mekanisme yang jelas** dan bisa diimplementasi bertahap.

---

## 2. Gagasan utama (pilihan arah)

Salah satu (atau kombinasi) arah berikut bisa dipakai:

- **A. Secure chat / E2E**  
  Chat dengan enkripsi ujung-ke-ujung: teks di-enkripsi di client pengirim, server hanya menyimpan/relay ciphertext, hanya penerima yang punya kunci bisa baca.

- **B. Password / secret manager kecil**  
  Penyimpanan rahasia (password, catatan) dengan enkripsi berbasis kata sandi master; data hanya terbaca setelah “unlock” dengan master.

- **C. Latihan keamanan (mini lab)**  
  Skenario kecil untuk latihan: hash, salt, HMAC, signing, demo serangan (e.g. tampering, replay) dan cara mitigasi.

- **D. Integrasi ke Kaito Whale**  
  Opsi keamanan untuk Kaito Whale: misalnya enkripsi payload pesan sebelum dikirim via WebSocket, sehingga hanya pihak yang punya kunci yang bisa decode getaran/teks.

---

## 3. Mekanisme (umum)

Agar ide bisa diimplementasi nanti, mekanisme disederhanakan sebagai berikut.

### 3.1 Komponen

- **Client (web / app)**  
  - Input dari user (pesan, password, dll.).  
  - Enkripsi/dekripsi di sisi client (kunci tidak dikirim ke server).  
  - Tampilan dan alur (kirim, terima, unlock).

- **Server (opsional)**  
  - Hanya menyimpan atau meneruskan data yang **sudah di-enkripsi** (tidak punya kunci).  
  - Bisa sangat minimal (relay saja) atau dengan fitur tambahan (auth, rate limit).

- **Penyimpanan**  
  - Local (localStorage, file) dan/atau remote (server/DB).  
  - Yang disimpan: **ciphertext + metadata** (bukan plaintext atau kunci).

### 3.2 Alur (contoh untuk secure chat)

1. **Setup / daftar**  
   - User A dan B punya identitas (id, nama) dan **sepasang kunci** (atau kunci bersama yang sudah disepakati).  
   - Kunci **tidak** dikirim ke server; server hanya tahu identitas.

2. **Kirim pesan**  
   - Di client A: plaintext → enkripsi dengan kunci (shared atau public B) → dapat ciphertext.  
   - Client A kirim ciphertext (+ metadata) ke server.  
   - Server menyimpan/meneruskan ciphertext tanpa bisa baca isi.

3. **Terima pesan**  
   - Client B terima ciphertext dari server.  
   - Di client B: ciphertext → dekripsi dengan kunci B → plaintext.  
   - Hanya B (yang punya kunci) yang bisa dapat plaintext.

4. **Keamanan**  
   - Server/penyimpanan tidak memegang kunci.  
   - Enkripsi/dekripsi hanya di client; algoritma standar (e.g. AES-GCM, X25519+ChaCha20).

### 3.3 Mekanisme untuk password/secret manager

1. **Unlock**  
   - User memasukkan **master password**.  
   - Dari master password (melalui KDF, e.g. Argon2 atau PBKDF2) dihasilkan **key encryption key (KEK)**.  
   - KEK dipakai hanya di memori client, tidak disimpan.

2. **Penyimpanan rahasia**  
   - Setiap secret di-enkripsi dengan **data encryption key (DEK)**; DEK di-enkripsi dengan KEK.  
   - Yang disimpan: ciphertext secret + ciphertext DEK (atau turunan dari KEK).  
   - Tanpa master password, data tidak bisa didekripsi.

3. **Baca rahasia**  
   - User masukkan lagi master password → KEK → dekripsi DEK → dekripsi secret → tampilkan (atau salin).

---

## 4. Teknologi yang bisa dipakai (referensi)

- **Enkripsi simetris:** AES-GCM (browser: Web Crypto API).  
- **Enkripsi asimetris / pertukaran kunci:** ECDH (P-256 atau X25519) + enkripsi simetris untuk payload.  
- **KDF:** PBKDF2 atau Argon2 (untuk master password → KEK).  
- **Komunikasi:** HTTPS + WebSocket (TLS); payload isi pesan tetap di-enkripsi di aplikasi (E2E).

Tidak diimplementasi di sini; hanya acuan saat nanti coding.

---

## 5. Langkah implementasi (nanti)

1. Pilih satu arah dulu (A, B, C, atau D).  
2. Tulis **spesifikasi singkat** (format data, alur, API jika ada server).  
3. Implementasi bertahap: crypto di client → integrasi dengan UI → server/penyimpanan jika perlu.  
4. Testing dan review keamanan dasar.

---

## 6. Ringkasan

| Item        | Keterangan                                              |
|------------|----------------------------------------------------------|
| **Nama**    | Cybersec                                                |
| **Tujuan**  | Eksperimen / pembelajaran keamanan siber                |
| **Mekanisme** | Enkripsi di client; server/penyimpanan hanya ciphertext |
| **Status**  | Ide saja; belum ada kode                                |

Kalau mau lanjut, tentukan dulu **arah** (A/B/C/D atau kombinasi), lalu kita bisa pecah jadi spesifikasi dan task implementasi.
