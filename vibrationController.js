/**
 * Vibration Controller
 * Mengontrol getaran HP berdasarkan pola yang dihasilkan dari Braille encoder
 */

import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

/**
 * Play vibration pattern
 * @param {Array} patterns - Array of vibration patterns dari textToVibrationPattern
 * @param {Function} onProgress - Callback untuk progress (optional)
 * @returns {Promise} Promise yang resolve ketika semua getaran selesai
 */
export async function playVibrationPattern(patterns, onProgress = null) {
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    
    if (pattern.type === 'vibrate') {
      // Trigger vibration
      if (pattern.duration >= 400) {
        // Getaran panjang - gunakan impact medium/heavy
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Tambahkan delay untuk durasi yang lebih panjang
        if (pattern.duration > 500) {
          await new Promise(resolve => setTimeout(resolve, pattern.duration - 400));
        }
      } else {
        // Getaran pendek - gunakan impact light
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else if (pattern.type === 'pause') {
      // Pause - tidak ada getaran
      await new Promise(resolve => setTimeout(resolve, pattern.duration));
    }
    
    // Report progress jika callback tersedia
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: patterns.length,
        pattern: pattern
      });
    }
  }
}

/**
 * Stop semua getaran yang sedang berlangsung
 */
export function stopVibration() {
  Vibration.cancel();
}

/**
 * Play simple vibration untuk testing
 * @param {number} duration - Durasi dalam ms
 */
export function playSimpleVibration(duration = 200) {
  Vibration.vibrate(duration);
}

/**
 * Play vibration dengan pattern khusus (untuk notifikasi, dll)
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
export async function playPatternVibration(type) {
  switch (type) {
    case 'success':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'warning':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'info':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    default:
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}
