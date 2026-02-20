/**
 * Message History Management
 * Persist messages ke localStorage
 */

const HISTORY_KEY = 'kaito_whale_history';
const MAX_HISTORY = 100; // Max messages to store

function saveMessage(message) {
  try {
    const history = loadHistory();
    history.push({
      ...message,
      savedAt: Date.now()
    });
    
    // Keep only last MAX_HISTORY messages
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Error saving message:', e);
    return false;
  }
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading history:', e);
    return [];
  }
}

function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (e) {
    console.error('Error clearing history:', e);
    return false;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { saveMessage, loadHistory, clearHistory };
} else {
  window.MessageHistory = { saveMessage, loadHistory, clearHistory };
}
