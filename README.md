# Kaito Whale 🐋

Aplikasi komunikasi untuk individu tuli-buta menggunakan pola getaran berbasis Braille.

## 🎯 Tujuan

Membantu komunikasi antara individu tuli-buta dengan orang tua atau orang lain melalui sistem getaran HP yang mengkonversi teks menjadi pola getaran berdasarkan sistem Braille.

## 🔧 Cara Kerja

### Sistem Encoding Braille

Aplikasi ini menggunakan sistem encoding Braille karena:
- **Familiar**: Banyak individu tuli-buta sudah mengenal Braille
- **Efisien**: Setiap karakter memiliki pola 6-titik yang jelas
- **Struktur**: Mudah dipelajari dan dikenali melalui getaran

### Pola Getaran

- **Getaran Panjang (500ms)**: Menandakan titik aktif dalam Braille (●)
- **Getaran Pendek (200ms)**: Menandakan titik tidak aktif dalam Braille (○)
- **Pause 100ms**: Antara titik dalam satu karakter
- **Pause 300ms**: Antara karakter
- **Pause 500ms**: Antara kata (spasi)

### Contoh Encoding

Huruf "A" dalam Braille = `●○○○○○`
- Getaran: PANJANG → pause → pendek → pause → pendek → pause → pendek → pause → pendek → pause → pendek

Huruf "B" dalam Braille = `●●○○○○`
- Getaran: PANJANG → pause → PANJANG → pause → pendek → pause → pendek → pause → pendek → pause → pendek

## 📱 Instalasi

### 1. Install Dependencies Mobile App

```bash
# Install dependencies
npm install

# Jalankan aplikasi
npm start

# Untuk Android
npm run android

# Untuk iOS
npm run ios
```

### 2. Setup WebSocket Server

```bash
# Masuk ke folder server
cd server

# Install dependencies server
npm install

# Jalankan server
npm start

# Atau untuk development dengan auto-reload
npm run dev
```

Server akan berjalan di `ws://localhost:3000` (atau IP komputer Anda di jaringan lokal).

### 3. Versi Web (browse dari HP)

**Cukup jalankan server, lalu buka dari browser HP:**

1. Jalankan server: `cd server && npm start`
2. Di HP, buka browser (Chrome, Safari, dll.)
3. Masukkan alamat: `http://<IP-komputer>:3000`  
   Contoh: `http://192.168.1.100:3000`
4. URL server di form bisa dikosongkan (otomatis pakai server yang sama)
5. Klik "Hubungkan" → ketik pesan → "Kirim". Getaran akan diputar di HP (jika browser mendukung Vibration API).

Versi web ada di folder `public/` dan dilayani otomatis oleh server.

### 4. Koneksi dari Mobile App (Expo)

1. Pastikan server sudah berjalan di komputer
2. Cari IP address komputer:
   - **Mac/Linux**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`
3. Di aplikasi mobile, masukkan URL server: `ws://192.168.1.XXX:3000` (ganti dengan IP komputer Anda)
4. Tekan "Hubungkan" untuk terhubung ke server

## 🚀 Fitur

- ✅ Konversi teks ke pola getaran Braille
- ✅ Preview pola Braille sebelum dikirim
- ✅ Kontrol play/pause getaran
- ✅ Progress indicator saat memutar getaran
- ✅ Test vibration untuk memastikan HP berfungsi
- ✅ **Real-time messaging antar devices menggunakan WebSocket**
- ✅ **Auto-play vibration saat menerima pesan**
- ✅ **User list dan connection status**
- ✅ **Chat interface dengan history pesan**
- ✅ **Versi web** — bisa dibuka dari browser HP di `http://<IP>:3000`

## 🔮 Fitur yang Akan Datang

- [ ] Custom vibration patterns untuk kata-kata umum
- [ ] Mode pembelajaran untuk mengenali pola Braille
- [ ] Dukungan untuk angka dan karakter khusus yang lebih lengkap
- [ ] Voice-to-text untuk input yang lebih mudah
- [ ] Message encryption untuk privasi

## 📚 Penjelasan Teknis

### Braille Mapping

Setiap huruf direpresentasikan sebagai array 6-bit:
```
[top-left, top-middle, top-right, bottom-left, bottom-middle, bottom-right]
```

Contoh:
- `a` = `[1, 0, 0, 0, 0, 0]` = hanya titik kiri atas yang aktif
- `b` = `[1, 1, 0, 0, 0, 0]` = dua titik atas yang aktif

### Vibration Controller

Menggunakan:
- `expo-haptics` untuk kontrol getaran yang lebih halus
- `react-native-vibration` sebagai fallback
- Pattern-based vibration untuk konsistensi

## 🤝 Kontribusi

Proyek ini dibuat untuk membantu komunitas tuli-buta. Kontribusi sangat diterima!

## 📄 Lisensi

MIT License

## 🙏 Terima Kasih

Terima kasih kepada semua yang telah membantu dalam pengembangan aplikasi ini.
