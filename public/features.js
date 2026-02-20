/**
 * Konstanta untuk fitur tambahan: darurat, role, mood, Braille Grade 2
 */
window.KaitoWhaleFeatures = {
  // Pola getaran DARURAT: 3x panjang (mudah dikenali)
  EMERGENCY_PATTERN: [500, 200, 500, 200, 500],

  // Pola pengenal pengirim (role) - pendek, unik per role
  ROLE_PATTERNS: {
    ibu: [200, 100, 200],
    ayah: [200, 100, 200, 100, 200],
    pengasuh: [500, 200, 500],
    teman: [500, 200, 500, 200, 500]
  },

  // Pola suasana (mood) - singkat
  MOOD_PATTERNS: {
    senang: [200, 100, 200, 100, 200],
    sedih: [500, 300, 500],
    marah: [200, 200, 200],
    tenang: [500, 100, 500],
    sayang: [200, 100, 200]
  },

  // Braille Grade 2: kata utuh -> 6 titik (kontraksi)
  GRADE2_WORDS: {
    'yang': [1, 0, 1, 1, 1, 1],
    'dan': [1, 1, 0, 0, 1, 0],
    'tidak': [0, 1, 1, 1, 1, 0],
    'untuk': [1, 0, 1, 0, 0, 1],
    'dengan': [1, 1, 0, 1, 0, 0],
    'ini': [0, 1, 1, 1, 0, 0],
    'itu': [0, 1, 1, 1, 1, 0],
    'ada': [1, 0, 0, 0, 0, 0],
    'sudah': [0, 1, 1, 1, 0, 0],
    'akan': [1, 0, 0, 0, 0, 0],
    'bisa': [1, 1, 0, 0, 0, 0],
    'telah': [0, 1, 1, 1, 1, 0],
    'atau': [1, 0, 1, 0, 0, 0],
    'juga': [0, 1, 0, 1, 1, 0],
    'saya': [0, 1, 1, 1, 0, 0],
    'kamu': [1, 0, 1, 0, 0, 0],
    'dia': [1, 0, 0, 1, 0, 0],
    'kita': [1, 0, 1, 0, 0, 0],
    'mereka': [1, 1, 1, 0, 0, 0]
  },

  // Frasa cepat (shortcuts)
  QUICK_PHRASES: [
    { label: 'Iya', text: 'iya' },
    { label: 'Tidak', text: 'tidak' },
    { label: 'Butuh bantuan', text: 'butuh bantuan' },
    { label: 'Ke toilet', text: 'ke toilet' },
    { label: 'Lapar', text: 'lapar' },
    { label: 'Haus', text: 'haus' },
    { label: 'Sakit', text: 'sakit' },
    { label: 'Aman', text: 'aman' },
    { label: 'Terima kasih', text: 'terima kasih' },
    { label: 'Apa kabar', text: 'apa kabar' }
  ]
};
