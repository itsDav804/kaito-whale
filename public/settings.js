/**
 * Settings Management
 * Handle localStorage untuk settings (dark mode, vibration intensity, speed)
 */

const SETTINGS_KEY = 'kaito_whale_settings';
const DEFAULT_SETTINGS = {
  darkMode: false,
  vibrationIntensity: 1.0,
  vibrationSpeed: 1.0,
  soundEnabled: false,
  autoPlay: true,
  messageHistory: true,
  repeatMessageCount: 1,       // 1, 2, atau 3x ulang pesan masuk
  trustedNames: '',            // 'Ibu,Ayah' = hanya dari nama ini yang auto-play
  useGrade2: false,             // Braille kontraksi (kata singkat)
  onboardingSeen: false,
  simpleView: false,            // Tampilan sederhana untuk penerima tuli-buta
  bothDeafBlind: false,         // Mode: kedua pengguna tuli-buta (rekam tap start/stop + getaran)
  autoSendAfterVoice: false     // Setelah rekam selesai, otomatis kirim (hanya bermakna jika bothDeafBlind)
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Error saving settings:', e);
    return false;
  }
}

function updateSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}

// Export untuk digunakan di app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadSettings, saveSettings, updateSetting, DEFAULT_SETTINGS };
} else {
  window.SettingsManager = { loadSettings, saveSettings, updateSetting, DEFAULT_SETTINGS };
}
