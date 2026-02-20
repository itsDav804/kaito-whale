/**
 * Braille-to-Vibration Encoder
 * 
 * Sistem encoding menggunakan Braille karena:
 * 1. Familiar untuk pengguna tuli-buta
 * 2. Setiap karakter Braille memiliki 6 titik (2x3 grid)
 * 3. Setiap titik bisa direpresentasikan sebagai getaran pendek/panjang
 * 
 * Pola getaran:
 * - Getaran pendek (200ms) = titik tidak aktif
 * - Getaran panjang (500ms) = titik aktif
 * - Pause antara titik: 100ms
 * - Pause antara karakter: 300ms
 * - Pause antara kata: 500ms
 */

// Mapping karakter ke Braille (6-bit pattern)
// Format: [top-left, top-middle, top-right, bottom-left, bottom-middle, bottom-right]
const BRAILLE_MAP = {
  'a': [1, 0, 0, 0, 0, 0],
  'b': [1, 1, 0, 0, 0, 0],
  'c': [1, 0, 0, 1, 0, 0],
  'd': [1, 0, 0, 1, 1, 0],
  'e': [1, 0, 0, 0, 1, 0],
  'f': [1, 1, 0, 1, 0, 0],
  'g': [1, 1, 0, 1, 1, 0],
  'h': [1, 1, 0, 0, 1, 0],
  'i': [0, 1, 0, 1, 0, 0],
  'j': [0, 1, 0, 1, 1, 0],
  'k': [1, 0, 1, 0, 0, 0],
  'l': [1, 1, 1, 0, 0, 0],
  'm': [1, 0, 1, 1, 0, 0],
  'n': [1, 0, 1, 1, 1, 0],
  'o': [1, 0, 1, 0, 1, 0],
  'p': [1, 1, 1, 1, 0, 0],
  'q': [1, 1, 1, 1, 1, 0],
  'r': [1, 1, 1, 0, 1, 0],
  's': [0, 1, 1, 1, 0, 0],
  't': [0, 1, 1, 1, 1, 0],
  'u': [1, 0, 1, 0, 0, 1],
  'v': [1, 1, 1, 0, 0, 1],
  'w': [0, 1, 0, 1, 1, 1],
  'x': [1, 0, 1, 1, 0, 1],
  'y': [1, 0, 1, 1, 1, 1],
  'z': [1, 0, 1, 0, 1, 1],
  ' ': null, // Space - pause panjang
  '0': [0, 1, 0, 1, 1, 0], // Braille number indicator + a
  '1': [1, 0, 0, 0, 0, 0],
  '2': [1, 1, 0, 0, 0, 0],
  '3': [1, 0, 0, 1, 0, 0],
  '4': [1, 0, 0, 1, 1, 0],
  '5': [1, 0, 0, 0, 1, 0],
  '6': [1, 1, 0, 1, 0, 0],
  '7': [1, 1, 0, 1, 1, 0],
  '8': [1, 1, 0, 0, 1, 0],
  '9': [0, 1, 0, 1, 0, 0],
};

// Durasi getaran (dalam milliseconds)
const VIBRATION_DURATIONS = {
  SHORT: 200,    // Titik tidak aktif (pause pendek)
  LONG: 500,     // Titik aktif (getaran panjang)
  DOT_PAUSE: 100,  // Pause antar titik dalam karakter
  CHAR_PAUSE: 300, // Pause antar karakter
  WORD_PAUSE: 500, // Pause antar kata
};

/**
 * Convert text ke pola getaran
 * @param {string} text - Text yang akan dikonversi
 * @returns {Array} Array of vibration patterns [{duration, pause}]
 */
export function textToVibrationPattern(text) {
  const patterns = [];
  const normalizedText = text.toLowerCase();
  
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    
    // Handle space (pause panjang)
    if (char === ' ') {
      patterns.push({
        type: 'pause',
        duration: VIBRATION_DURATIONS.WORD_PAUSE
      });
      continue;
    }
    
    // Get Braille pattern untuk karakter
    const braillePattern = BRAILLE_MAP[char];
    
    if (!braillePattern) {
      // Karakter tidak dikenal, skip atau gunakan pause
      continue;
    }
    
    // Convert Braille pattern ke getaran
    // Setiap titik dalam Braille = satu getaran
    for (let j = 0; j < braillePattern.length; j++) {
      const dot = braillePattern[j];
      
      if (dot === 1) {
        // Titik aktif - getaran panjang
        patterns.push({
          type: 'vibrate',
          duration: VIBRATION_DURATIONS.LONG
        });
      } else {
        // Titik tidak aktif - pause pendek
        patterns.push({
          type: 'pause',
          duration: VIBRATION_DURATIONS.SHORT
        });
      }
      
      // Pause antar titik (kecuali titik terakhir)
      if (j < braillePattern.length - 1) {
        patterns.push({
          type: 'pause',
          duration: VIBRATION_DURATIONS.DOT_PAUSE
        });
      }
    }
    
    // Pause antar karakter (kecuali karakter terakhir atau jika berikutnya adalah space)
    if (i < normalizedText.length - 1 && normalizedText[i + 1] !== ' ') {
      patterns.push({
        type: 'pause',
        duration: VIBRATION_DURATIONS.CHAR_PAUSE
      });
    }
  }
  
  return patterns;
}

/**
 * Get preview pattern untuk debugging/visualisasi
 * @param {string} text - Text yang akan dikonversi
 * @returns {string} Visual representation
 */
export function getPatternPreview(text) {
  const normalizedText = text.toLowerCase();
  let preview = '';
  
  for (const char of normalizedText) {
    if (char === ' ') {
      preview += '[SPACE] ';
      continue;
    }
    
    const braillePattern = BRAILLE_MAP[char];
    if (!braillePattern) {
      preview += '[?] ';
      continue;
    }
    
    // Visual representation: ● untuk aktif, ○ untuk tidak aktif
    const visual = braillePattern.map(dot => dot === 1 ? '●' : '○').join('');
    preview += `${char.toUpperCase()}:${visual} `;
  }
  
  return preview.trim();
}

export { VIBRATION_DURATIONS, BRAILLE_MAP };
