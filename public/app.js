/**
 * Kaito Whale - Web App
 * Braille → Getaran, WebSocket chat
 */

(function () {
  'use strict';
  // --- Ensure Braille input UI is initialized for all users ---
  document.addEventListener('DOMContentLoaded', function () {
    // --- Morse Input Logic ---
    // Morse code map (A-Z, 0-9)
    const MORSE_MAP = {
      'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
      'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
      'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
      'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
      'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
      'Z': '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
      '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
    };
    // Reverse map: Morse string → char
    const REVERSE_MORSE_MAP = {};
    Object.keys(MORSE_MAP).forEach(function (ch) {
      REVERSE_MORSE_MAP[MORSE_MAP[ch]] = ch;
    });

    var morseInput = '';
    var morseInputPreview = document.getElementById('morseInputPreview');
    var messageInput = document.getElementById('messageInput');
    var charCount = document.getElementById('charCount');

    function syncMorseUI() {
      if (morseInputPreview) {
        morseInputPreview.textContent = morseInput || ' ';
      }
    }

    document.getElementById('morseDotBtn').addEventListener('click', function () {
      morseInput += '.';
      syncMorseUI();
    });
    document.getElementById('morseDashBtn').addEventListener('click', function () {
      morseInput += '-';
      syncMorseUI();
    });
    document.getElementById('morseAddCharBtn').addEventListener('click', function () {
      var ch = REVERSE_MORSE_MAP[morseInput];
      if (ch !== undefined) {
        messageInput.value = messageInput.value + ch;
        if (charCount) charCount.textContent = messageInput.value.length;
        document.getElementById('sendBtn').disabled = !isConnected() || !messageInput.value.trim();
        var playBtnEl = document.getElementById('playBtn');
        if (playBtnEl) playBtnEl.disabled = !messageInput.value.trim();
        updateSendPreview();
      }
      morseInput = '';
      syncMorseUI();
    });

    // Synchronize: when textarea changes, clear Morse input
    messageInput.addEventListener('input', function () {
      morseInput = '';
      syncMorseUI();
    });
    document.getElementById('morseSpaceBtn').addEventListener('click', function () {
      messageInput.value = messageInput.value + ' ';
      if (charCount) charCount.textContent = messageInput.value.length;
      document.getElementById('sendBtn').disabled = !isConnected() || !messageInput.value.trim();
      var playBtnEl = document.getElementById('playBtn');
      if (playBtnEl) playBtnEl.disabled = !messageInput.value.trim();
      updateSendPreview();
    });
    document.getElementById('morseBackspaceBtn').addEventListener('click', function () {
      if (morseInput.length > 0) {
        morseInput = morseInput.slice(0, -1);
        syncMorseUI();
      }
    });
    document.getElementById('morseClearBtn').addEventListener('click', function () {
      morseInput = '';
      syncMorseUI();
    });
    syncMorseUI();
  });


  // --- Morse encoder ---
  // Morse code map (A-Z, 0-9)
  const MORSE_MAP = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
    'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
    'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
    'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };
  // Reverse map: Morse string → char
  const REVERSE_MORSE_MAP = {};
  Object.keys(MORSE_MAP).forEach(function (ch) {
    REVERSE_MORSE_MAP[MORSE_MAP[ch]] = ch;
  });

  const DURATIONS = {
    SHORT: 200,
    LONG: 500,
    DOT_PAUSE: 100,
    CHAR_PAUSE: 300,
    WORD_PAUSE: 500
  };


  function textToVibrationPattern(text) {
    const patterns = [];
    const t = text.toUpperCase();
    for (let i = 0; i < t.length; i++) {
      const char = t[i];
      if (char === ' ') {
        patterns.push({ type: 'pause', duration: DURATIONS.WORD_PAUSE });
        continue;
      }
      const morse = MORSE_MAP[char];
      if (!morse) continue;
      for (let j = 0; j < morse.length; j++) {
        if (morse[j] === '.') {
          patterns.push({ type: 'vibrate', duration: DURATIONS.SHORT });
        } else if (morse[j] === '-') {
          patterns.push({ type: 'vibrate', duration: DURATIONS.LONG });
        }
        if (j < morse.length - 1)
          patterns.push({ type: 'pause', duration: DURATIONS.DOT_PAUSE });
      }
      if (i < t.length - 1 && t[i + 1] !== ' ')
        patterns.push({ type: 'pause', duration: DURATIONS.CHAR_PAUSE });
    }
    return patterns;
  }

  function getPatternPreview(text) {
    let preview = '';
    const t = text.toUpperCase();
    for (const char of t) {
      if (char === ' ') {
        preview += '[SPACE] ';
        continue;
      }
      const morse = MORSE_MAP[char];
      if (!morse) {
        preview += '[?] ';
        continue;
      }
      preview += char + ':' + morse + ' ';
    }
    return preview.trim();
  }

  function textToVibrationPatternGrade2(text) {
    var FEAT = window.KaitoWhaleFeatures;
    if (!FEAT || !FEAT.GRADE2_WORDS) return textToVibrationPattern(text);
    var patterns = [];
    var words = text.toLowerCase().split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      var word = words[i].replace(/[^a-z0-9]/g, '');
      if (FEAT.GRADE2_WORDS[word]) {
        var dots = FEAT.GRADE2_WORDS[word];
        for (var j = 0; j < dots.length; j++) {
          patterns.push({ type: dots[j] === 1 ? 'vibrate' : 'pause', duration: dots[j] === 1 ? DURATIONS.LONG : DURATIONS.SHORT });
          if (j < dots.length - 1) patterns.push({ type: 'pause', duration: DURATIONS.DOT_PAUSE });
        }
      } else {
        var letterPatterns = textToVibrationPattern(words[i]);
        patterns = patterns.concat(letterPatterns);
      }
      if (i < words.length - 1) patterns.push({ type: 'pause', duration: DURATIONS.WORD_PAUSE });
    }
    return patterns;
  }

  // --- Vibration (Web API) ---
  function isVibrationSupported() {
    return typeof navigator !== 'undefined' && navigator.vibrate;
  }

  // Vibration queue untuk handle multiple vibrations
  let vibrationQueue = [];
  let isPlayingVibration = false;
  let settings = { vibrationIntensity: 1.0, vibrationSpeed: 1.0, autoPlay: true };

  function playVibrationPattern(patterns, onProgress, speedOverride) {
    if (!isVibrationSupported()) {
      if (onProgress) onProgress({ current: 0, total: patterns.length });
      return Promise.resolve();
    }
    
    // speedOverride > 1 = lebih pelan (untuk belajar), < 1 = lebih cepat
    const speedMultiplier = speedOverride !== undefined ? speedOverride : (settings.vibrationSpeed || 1.0);
    const arr = patterns.map(p => Math.round(p.duration * speedMultiplier));
    
    // Queue jika sedang play
    if (isPlayingVibration) {
      return new Promise(function(resolve) {
        vibrationQueue.push({ patterns: arr, onProgress, resolve });
      });
    }
    
    isPlayingVibration = true;
    navigator.vibrate(arr);
    if (onProgress) onProgress({ current: patterns.length, total: patterns.length });
    const totalMs = arr.reduce((a, b) => a + b, 0);
    
    return new Promise(function (resolve) {
      setTimeout(() => {
        isPlayingVibration = false;
        resolve();
        // Play next in queue
        if (vibrationQueue.length > 0) {
          const next = vibrationQueue.shift();
          playVibrationPattern(next.patterns.map(d => ({ duration: d })), next.onProgress).then(next.resolve);
        }
      }, totalMs);
    });
  }

  function stopVibration() {
    if (isVibrationSupported()) navigator.vibrate(0);
  }

  function testVibration() {
    if (isVibrationSupported()) navigator.vibrate(200);
  }

  // Putar pola mentah (array ms) — untuk darurat, role, mood
  function playRawPattern(arr) {
    if (!isVibrationSupported() || !arr.length) return Promise.resolve();
    navigator.vibrate(arr);
    return new Promise(function(resolve) {
      setTimeout(resolve, arr.reduce(function(a, b) { return a + b; }, 0));
    });
  }

  // --- WebSocket ---
  function getDefaultWsUrl() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return proto + '//' + location.host;
  }

  let ws = null;
  let clientId = null;
  let userName = '';
  let lastReceivedMessageId = null;
  let lastReceivedMessageData = null;
  let messageIdToElement = {};

  function setStatus(status, text) {
    const dot = document.getElementById('statusDot');
    const label = document.getElementById('statusText');
    var dotCls = 'w-2.5 h-2.5 rounded-full shrink-0 ';
    if (status === 'connected') dotCls += 'bg-emerald-500';
    else if (status === 'connecting') dotCls += 'bg-amber-500 animate-pulse';
    else if (status === 'error') dotCls += 'bg-red-500';
    else dotCls += 'bg-stone-300';
    dot.className = dotCls;
    label.textContent = text;
  }

  function connect() {
    const urlInput = document.getElementById('serverUrl');
    const nameInput = document.getElementById('userName');
    let wsUrl = (urlInput.value || '').trim() || getDefaultWsUrl();
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://'))
      wsUrl = 'ws://' + wsUrl;
    userName = (nameInput.value || '').trim();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
      return;
    }

    setStatus('connecting', '⏳ Menghubungkan...');
    document.getElementById('connectBtn').disabled = true;

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      setStatus('error', '✗ Error');
      document.getElementById('connectBtn').disabled = false;
      document.getElementById('connectBtn').textContent = '🔗 Hubungkan';
      return;
    }

    ws.onopen = function () {
      setStatus('connected', '✓ Terhubung');
      document.getElementById('connectBtn').textContent = '🔌 Putuskan';
      document.getElementById('connectBtn').disabled = false;
      document.getElementById('messagesSection').classList.remove('hidden');
      document.getElementById('userListSection').classList.remove('hidden');
      var qs = document.getElementById('quickSection');
      if (qs) qs.classList.remove('hidden');
      var roleVal = document.getElementById('senderRole') && document.getElementById('senderRole').value;
      send({ type: 'set_name', data: { name: userName, role: roleVal || undefined } });
    };

    ws.onmessage = function (event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'connect') {
          clientId = msg.data.clientId;
        } else if (msg.type === 'broadcast') {
          addMessage(msg.data, false);
          if (msg.data.messageId) lastReceivedMessageId = msg.data.messageId;
          lastReceivedMessageData = msg.data;
          var receiptRow = document.getElementById('readReceiptRow');
          if (receiptRow) receiptRow.classList.remove('hidden');
          if (window.MessageHistory) {
            window.MessageHistory.saveMessage({ ...msg.data, timestamp: msg.timestamp, isOwn: false });
          }
          var fromName = (msg.data.from && msg.data.from.name) ? msg.data.from.name.trim().toLowerCase() : '';
          var trusted = (document.getElementById('trustedNames') && document.getElementById('trustedNames').value) || (settings.trustedNames || '');
          var trustedList = trusted.split(',').map(function(s) { return s.trim().toLowerCase(); }).filter(Boolean);
          var allowPlay = settings.autoPlay !== false && (!trustedList.length || trustedList.some(function(n) { return fromName.indexOf(n) >= 0 || n.indexOf(fromName) >= 0; }));
          if (msg.data.text && allowPlay) {
            playMessageVibration(msg.data);
          }
        } else if (msg.type === 'read_receipt') {
          var mid = msg.data && msg.data.messageId;
          var el = messageIdToElement[mid];
          if (el && !el.querySelector('.read-receipt-badge')) {
            var readSpan = document.createElement('span');
            readSpan.className = 'read-receipt-badge text-xs text-emerald-600 dark:text-emerald-400 mt-1 block';
            readSpan.textContent = '✓ Dibaca';
            readSpan.setAttribute('aria-label', 'Sudah dibaca');
            el.appendChild(readSpan);
          }
        } else if (msg.type === 'user_list') {
          renderUserList(msg.data.users || []);
        } else if (msg.type === 'typing') {
          showTypingIndicator(msg.data);
        } else if (msg.type === 'error') {
          showError(msg.data.error || 'Terjadi kesalahan');
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onerror = function (error) {
      console.error('WebSocket error:', error);
      setStatus('error', '✗ Error koneksi');
      document.getElementById('connectBtn').disabled = false;
      document.getElementById('connectBtn').textContent = '🔗 Hubungkan';
    };

    ws.onclose = function (event) {
      ws = null;
      setStatus('', '○ Terputus');
      document.getElementById('connectBtn').textContent = '🔗 Hubungkan';
      document.getElementById('connectBtn').disabled = false;
      document.getElementById('messagesSection').classList.add('hidden');
      document.getElementById('userListSection').classList.add('hidden');
      var qs = document.getElementById('quickSection');
      if (qs) qs.classList.add('hidden');
      var rr = document.getElementById('readReceiptRow');
      if (rr) rr.classList.add('hidden');
      
      // Show retry button jika bukan close normal
      if (event.code !== 1000 && event.code !== 1001) {
        console.warn('WebSocket closed unexpectedly:', event.code, event.reason);
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) retryBtn.classList.remove('hidden');
      }
    };
  }

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ ...obj, timestamp: Date.now() }));
  }

  function renderUserList(users) {
    const list = document.getElementById('userList');
    const count = document.getElementById('userCount');
    count.textContent = users.length;
    list.innerHTML = users.map(u => '<li>• ' + (u.name || 'Anonymous') + '</li>').join('');
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return minutes + ' menit lalu';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' jam lalu';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(data, isOwn) {
    const list = document.getElementById('messagesList');
    const empty = document.getElementById('emptyMessages');
    if (empty) empty.classList.add('hidden');
    const timestamp = data.timestamp || Date.now();
    const time = formatTime(timestamp);
    const div = document.createElement('div');
    if (data.messageId) {
      div.setAttribute('data-message-id', data.messageId);
      messageIdToElement[data.messageId] = div;
    }
    div.className = isOwn
      ? 'rounded-lg p-2.5 max-w-[85%] ml-auto bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50'
      : 'rounded-lg p-2.5 max-w-[85%] bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700';
    div.setAttribute('role', 'article');
    div.setAttribute('aria-label', 'Pesan dari ' + (data.from ? (data.from.name || 'Anonymous') : 'Saya'));
    
    const sender = document.createElement('span');
    sender.className = 'block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-0.5';
    sender.textContent = data.from ? (data.from.name || 'Anonymous') : 'Saya';
    
    const text = document.createElement('p');
    text.className = 'text-sm text-stone-900 dark:text-stone-100 mb-0.5 break-words';
    text.textContent = data.text || '';
    
    const timeEl = document.createElement('span');
    timeEl.className = 'text-xs text-stone-400 dark:text-stone-500';
    timeEl.textContent = time;
    timeEl.setAttribute('aria-label', 'Dikirim ' + time);
    
    div.appendChild(sender);
    div.appendChild(text);
    div.appendChild(timeEl);
    list.appendChild(div);
    
    // Sound feedback (default off) — announce pesan masuk lewat suara
    if (settings.soundEnabled && 'speechSynthesis' in window && !isOwn) {
      const utterance = new SpeechSynthesisUtterance('Pesan baru dari ' + (data.from ? data.from.name : 'Anonymous') + ': ' + data.text);
      utterance.lang = 'id-ID';
      utterance.volume = 0.3;
      speechSynthesis.speak(utterance);
    }
    
    // Smooth scroll
    setTimeout(() => {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    }, 10);
  }

  let typingTimeout = null;
  function showTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    
    if (data.isTyping) {
      indicator.classList.remove('hidden');
      indicator.textContent = (data.from.name || 'Anonymous') + ' sedang mengetik...';
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        indicator.classList.add('hidden');
      }, 3000);
    } else {
      indicator.classList.add('hidden');
    }
  }

  function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      setTimeout(() => errorEl.classList.add('hidden'), 5000);
    } else {
      alert(message);
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // Validate & sanitize message
  function validateMessage(text) {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > 1000) return trimmed.substring(0, 1000); // Max 1000 chars
    return trimmed;
  }

  function updateProgress(p) {
    const el = document.getElementById('progressSection');
    const text = document.getElementById('progressText');
    if (p.current >= p.total) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    text.textContent = 'Memutar: ' + p.current + ' / ' + p.total;
  }

  function playMessageVibration(data) {
    if (!data || !data.text) return Promise.resolve();
    var FEAT = window.KaitoWhaleFeatures;
    var chain = Promise.resolve();
    if (data.emergency && FEAT && FEAT.EMERGENCY_PATTERN) {
      chain = chain.then(function() { return playRawPattern(FEAT.EMERGENCY_PATTERN); });
    }
    if (data.from && data.from.role && FEAT && FEAT.ROLE_PATTERNS && FEAT.ROLE_PATTERNS[data.from.role]) {
      chain = chain.then(function() { return playRawPattern(FEAT.ROLE_PATTERNS[data.from.role]); });
    }
    if (data.mood && FEAT && FEAT.MOOD_PATTERNS && FEAT.MOOD_PATTERNS[data.mood]) {
      chain = chain.then(function() { return playRawPattern(FEAT.MOOD_PATTERNS[data.mood]); });
    }
    var useG2 = document.getElementById('useGrade2') && document.getElementById('useGrade2').checked;
    var patterns = useG2 ? textToVibrationPatternGrade2(data.text) : textToVibrationPattern(data.text);
    var repeat = parseInt(document.getElementById('repeatCount') && document.getElementById('repeatCount').value, 10) || 1;
    for (var r = 0; r < repeat; r++) {
      chain = chain.then(function() { return playVibrationPattern(patterns, updateProgress); });
    }
    chain.catch(function() {});
    return chain;
  }

  // Load message history
  function loadMessageHistory() {
    if (!window.MessageHistory) return;
    const history = window.MessageHistory.loadHistory();
    if (history.length > 0) {
      const list = document.getElementById('messagesList');
      const empty = document.getElementById('emptyMessages');
      if (empty) empty.classList.add('hidden');
      history.slice(-20).forEach(msg => {
        addMessage(msg, msg.isOwn || false);
      });
    }
  }

  // Dark mode toggle
  function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    if (window.SettingsManager) {
      window.SettingsManager.updateSetting('darkMode', isDark);
      settings = window.SettingsManager.loadSettings(); // Update settings
    }
    // Update theme-color meta
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0c0a09' : '#1c1917');
    }
    return isDark;
  }

  // --- UI ---
  function init() {
    // Load settings (harus di-load dulu sebelum digunakan)
    if (window.SettingsManager) {
      settings = window.SettingsManager.loadSettings();
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      }
    } else {
      // Fallback jika SettingsManager belum load
      setTimeout(() => {
        if (window.SettingsManager) {
          settings = window.SettingsManager.loadSettings();
        }
      }, 100);
    }

    loadMessageHistory();

    var trustedEl = document.getElementById('trustedNames');
    var repeatEl = document.getElementById('repeatCount');
    var grade2El = document.getElementById('useGrade2');
    if (trustedEl && settings.trustedNames !== undefined) trustedEl.value = settings.trustedNames || '';
    if (repeatEl) repeatEl.value = String(settings.repeatMessageCount !== undefined ? settings.repeatMessageCount : 1);
    if (grade2El && settings.useGrade2 !== undefined) grade2El.checked = settings.useGrade2;
    var usageModeEl = document.getElementById('usageMode');
    var autoSendAfterVoiceEl = document.getElementById('autoSendAfterVoice');
    if (usageModeEl) usageModeEl.value = settings.bothDeafBlind ? 'bothDeafBlind' : 'standard';
    if (autoSendAfterVoiceEl && settings.autoSendAfterVoice !== undefined) autoSendAfterVoiceEl.checked = settings.autoSendAfterVoice;

    var appBody = document.getElementById('appBody');
    var simpleViewCheckbox = document.getElementById('simpleViewCheckbox');
    if (appBody && simpleViewCheckbox) {
      simpleViewCheckbox.checked = !!settings.simpleView;
      if (settings.simpleView) {
        appBody.classList.add('simple-view');
        appBody.classList.remove('advanced-open');
      } else {
        appBody.classList.remove('simple-view');
      }
      simpleViewCheckbox.addEventListener('change', function() {
        var on = this.checked;
        if (window.SettingsManager) window.SettingsManager.updateSetting('simpleView', on);
        settings.simpleView = on;
        if (on) {
          appBody.classList.add('simple-view');
          appBody.classList.remove('advanced-open');
        } else {
          appBody.classList.remove('simple-view');
        }
      });
    }
    var toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
    var advancedSection = document.getElementById('advancedSection');
    if (toggleAdvancedBtn && advancedSection) {
      toggleAdvancedBtn.addEventListener('click', function() {
        var open = appBody.classList.toggle('advanced-open');
        toggleAdvancedBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // Check vibration support
    if (!isVibrationSupported()) {
      const warning = document.createElement('div');
      warning.className = 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-sm text-amber-800 dark:text-amber-200';
      warning.setAttribute('role', 'alert');
      warning.textContent = '⚠️ Browser tidak mendukung Vibration API. Getaran tidak akan bekerja.';
      document.querySelector('main').insertBefore(warning, document.querySelector('main').firstChild);
    }

    var serverUrl = document.getElementById('serverUrl');
    if (!serverUrl.value) serverUrl.placeholder = 'Kosongkan = pakai server ini';
    serverUrl.value = serverUrl.value || '';

    // Keyboard shortcuts
    document.getElementById('messageInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById('sendBtn').click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.blur();
      }
    });

    // Dark mode: toggle sudah di-handle via onclick di HTML (window.toggleDarkMode)

    // Connection retry
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', connect);
    }

    document.getElementById('connectBtn').addEventListener('click', connect);

    var messageInput = document.getElementById('messageInput');
    var charCount = document.getElementById('charCount');
    var updateTimeout = null;
    
    messageInput.addEventListener('input', function () {
      var text = messageInput.value;
      
      if (charCount) {
        charCount.textContent = text.length;
        charCount.className = text.length > 900 ? 'text-xs text-amber-600 mt-1 text-right' : 'text-xs text-stone-400 mt-1 text-right';
      }
      var longWarn = document.getElementById('longMessageWarning');
      if (longWarn) longWarn.classList.toggle('hidden', text.length < 200);
      
      // Debounce preview update
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(function() {
        var preview = document.getElementById('previewSection');
        var patternPreview = document.getElementById('patternPreview');
        if (text.length > 0) {
          preview.classList.remove('hidden');
          patternPreview.textContent = getPatternPreview(text);
        } else {
          preview.classList.add('hidden');
        }
      }, 300);
      
      // Typing indicator (debounced)
      clearTimeout(window.typingTimeout);
      if (isConnected() && text.length > 0) {
        window.typingTimeout = setTimeout(() => {
          if (isConnected()) send({ type: 'typing', data: { isTyping: true } });
        }, 500);
      } else if (isConnected()) {
        send({ type: 'typing', data: { isTyping: false } });
      }
      
      document.getElementById('sendBtn').disabled = !isConnected() || !text.trim();
      document.getElementById('playBtn').disabled = !text.trim();
    });

    function sendMessage(text, opts) {
      opts = opts || {};
      var msgId = opts.messageId || ('msg_' + Date.now() + '_' + (clientId || ''));
      var roleEl = document.getElementById('senderRole');
      var moodEl = document.getElementById('moodSelect');
      var role = (roleEl && roleEl.value) || undefined;
      var mood = (moodEl && moodEl.value) || undefined;
      var pattern = (document.getElementById('useGrade2') && document.getElementById('useGrade2').checked) ? textToVibrationPatternGrade2(text) : textToVibrationPattern(text);
      send({
        type: 'message',
        data: {
          messageId: msgId,
          text: text,
          vibrationPattern: pattern,
          role: role,
          mood: mood,
          emergency: !!opts.emergency
        }
      });
      var msg = {
        from: { name: userName || 'Saya', role: role },
        text: text,
        timestamp: Date.now(),
        isOwn: true,
        messageId: msgId
      };
      addMessage(msg, true);
      if (window.MessageHistory) window.MessageHistory.saveMessage(msg);
    }

    document.getElementById('sendBtn').addEventListener('click', function () {
      var text = validateMessage(messageInput.value);
      if (!text || !isConnected()) {
        if (text && text.length > 1000) alert('Pesan terlalu panjang (max 1000 karakter)');
        return;
      }
      var moodEl = document.getElementById('moodSelect');
      if (moodEl) moodEl.value = '';
      sendMessage(text);
      messageInput.value = '';
      if (charCount) charCount.textContent = '0';
      document.getElementById('previewSection').classList.add('hidden');
      document.getElementById('sendBtn').disabled = true;
      document.getElementById('playBtn').disabled = true;
      if (isConnected()) send({ type: 'typing', data: { isTyping: false } });
    });

    document.getElementById('playBtn').addEventListener('click', function () {
      var text = messageInput.value.trim();
      if (!text) return;
      var useG2 = document.getElementById('useGrade2') && document.getElementById('useGrade2').checked;
      var patterns = useG2 ? textToVibrationPatternGrade2(text) : textToVibrationPattern(text);
      var progressSection = document.getElementById('progressSection');
      var progressText = document.getElementById('progressText');
      progressSection.classList.remove('hidden');
      progressText.textContent = 'Memutar getaran...';
      playVibrationPattern(patterns, function (p) {
        progressText.textContent = 'Memutar: ' + p.current + ' / ' + p.total;
        if (p.current >= p.total) progressSection.classList.add('hidden');
      });
    });

    document.getElementById('testBtn').addEventListener('click', function () {
      testVibration();
    });

    document.getElementById('markReadBtn').addEventListener('click', function () {
      if (lastReceivedMessageId && isConnected()) {
        send({ type: 'read_receipt', data: { messageId: lastReceivedMessageId } });
        document.getElementById('readReceiptRow').classList.add('hidden');
      }
    });
    var replayVibrationBtn = document.getElementById('replayVibrationBtn');
    if (replayVibrationBtn) {
      replayVibrationBtn.addEventListener('click', function () {
        if (lastReceivedMessageData && lastReceivedMessageData.text) {
          playMessageVibration(lastReceivedMessageData);
        }
      });
    }

    var quickWrap = document.getElementById('quickPhrasesWrap');
    if (quickWrap && window.KaitoWhaleFeatures && window.KaitoWhaleFeatures.QUICK_PHRASES) {
      window.KaitoWhaleFeatures.QUICK_PHRASES.forEach(function (p) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-phrase-btn shrink-0 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-700';
        btn.textContent = p.label;
        btn.addEventListener('click', function () {
          if (isConnected()) sendMessage(p.text);
        });
        quickWrap.appendChild(btn);
      });
    }
    document.getElementById('emergencyBtn').addEventListener('click', function () {
      if (isConnected()) sendMessage('BUTUH BANTUAN DARURAT', { emergency: true });
    });

    var voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var recognition = new Recognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true;
      var voiceListening = false;
      function voiceVibrateStart() {
        if (isVibrationSupported() && settings.bothDeafBlind) navigator.vibrate(150);
      }
      function voiceVibrateStop() {
        if (isVibrationSupported() && settings.bothDeafBlind) navigator.vibrate([150, 80, 150]);
      }
      function syncVoiceButtonState() {
        var vbd = document.getElementById('voiceBtnDeafBlind');
        if (vbd) {
          vbd.textContent = voiceBtn.textContent;
          vbd.disabled = voiceBtn.disabled;
          vbd.setAttribute('aria-label', voiceBtn.getAttribute('aria-label') || 'Rekam suara');
        }
      }
      recognition.onresult = function (e) {
        var result = e.results[e.results.length - 1];
        if (result.isFinal && result.length > 0) {
          var t = result[0].transcript;
          if (t) {
            messageInput.value = (messageInput.value + (messageInput.value ? ' ' : '') + t).trim();
            if (charCount) charCount.textContent = messageInput.value.length;
            document.getElementById('sendBtn').disabled = !isConnected() || !messageInput.value.trim();
            var playBtnEl = document.getElementById('playBtn');
            if (playBtnEl) playBtnEl.disabled = !messageInput.value.trim();
            var previewEl = document.getElementById('sendPreviewText');
            var sendDb = document.getElementById('sendBtnDeafBlind');
            var playPreviewBtn = document.getElementById('playPreviewVibrationBtn');
            if (previewEl) previewEl.textContent = messageInput.value.trim() || '— Rekam suara, teks akan muncul di sini —';
            if (sendDb) sendDb.disabled = !isConnected() || !messageInput.value.trim();
            if (playPreviewBtn) playPreviewBtn.disabled = !messageInput.value.trim();
            if (settings.bothDeafBlind && settings.autoSendAfterVoice && isConnected() && messageInput.value.trim()) {
              setTimeout(function () {
                var txt = messageInput.value.trim();
                if (txt) sendMessage(txt);
                messageInput.value = '';
                if (charCount) charCount.textContent = '0';
                document.getElementById('sendBtn').disabled = true;
                if (playBtnEl) playBtnEl.disabled = true;
                if (previewEl) previewEl.textContent = '— Rekam suara, teks akan muncul di sini —';
                if (sendDb) sendDb.disabled = true;
                var playPrevBtn = document.getElementById('playPreviewVibrationBtn');
                if (playPrevBtn) playPrevBtn.disabled = true;
              }, 400);
            }
          }
        }
      };
      recognition.onstart = function () {
        voiceListening = true;
        voiceBtn.textContent = '🔴 Stop (tap untuk berhenti)';
        voiceBtn.disabled = false;
        voiceBtn.setAttribute('aria-label', 'Rekam aktif. Sentuh lagi untuk stop.');
        syncVoiceButtonState();
        voiceVibrateStart();
      };
      recognition.onend = function () {
        voiceListening = false;
        voiceBtn.textContent = '🎤 Rekam';
        voiceBtn.disabled = false;
        voiceBtn.setAttribute('aria-label', 'Rekam suara. Sentuh untuk mulai.');
        syncVoiceButtonState();
        voiceVibrateStop();
      };
      recognition.onerror = function (e) {
        voiceListening = false;
        voiceBtn.disabled = false;
        voiceBtn.textContent = '🎤 Rekam';
        voiceBtn.setAttribute('aria-label', 'Rekam suara');
        syncVoiceButtonState();
        if (e.error === 'not-allowed') showError('Izinkan akses mikrofon di pengaturan browser/situs ini, lalu coba lagi.');
        else if (e.error === 'no-speech') showError('Tidak ada suara terdeteksi. Coba lagi.');
        else if (e.error === 'network') showError('Rekam butuh koneksi internet.');
        else if (e.error === 'aborted') { /* user stop, no message */ }
        else showError('Rekam gagal: ' + (e.error || 'unknown'));
      };
      voiceBtn.addEventListener('click', function () {
        if (voiceListening) {
          try { recognition.stop(); } catch (err) {}
          return;
        }
        if (voiceBtn.disabled) return;
        if (!window.isSecureContext) {
          showError('Rekam suara hanya bisa dipakai di HTTPS. Buka alamat dengan https:// (bukan http://).');
          return;
        }
        voiceBtn.disabled = true;
        voiceBtn.textContent = '⏳ Meminta mikrofon...';
        var startRecognition = function () {
          voiceBtn.textContent = '🎤 Rekam';
          voiceBtn.disabled = false;
          var vbd = document.getElementById('voiceBtnDeafBlind');
          if (vbd) { vbd.textContent = '🎤 Rekam'; vbd.disabled = false; }
          try {
            recognition.start();
          } catch (err) {
            voiceBtn.textContent = '🎤 Rekam';
            if (vbd) vbd.textContent = '🎤 Rekam';
            showError('Rekam tidak bisa dimulai. Coba tutup lalu buka lagi halaman ini.');
          }
        };
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
              stream.getTracks().forEach(function (t) { t.stop(); });
              startRecognition();
            })
            .catch(function (err) {
              voiceBtn.disabled = false;
              voiceBtn.textContent = '🎤 Rekam';
              var vbd = document.getElementById('voiceBtnDeafBlind');
              if (vbd) { vbd.disabled = false; vbd.textContent = '🎤 Rekam'; }
              if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                showError('Akses mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.');
              } else {
                showError('Tidak bisa akses mikrofon: ' + (err.message || err.name));
              }
            });
        } else {
          startRecognition();
        }
      });
    } else if (voiceBtn) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Rekam suara tidak didukung di browser ini. Pakai Chrome/Edge di Android, dan buka lewat HTTPS.';
    }

    document.getElementById('senderRole').addEventListener('change', function () {
      if (isConnected()) send({ type: 'set_name', data: { name: userName, role: this.value || undefined } });
    });

    document.getElementById('trustedNames').addEventListener('change', function () {
      if (window.SettingsManager) window.SettingsManager.updateSetting('trustedNames', this.value);
    });
    document.getElementById('repeatCount').addEventListener('change', function () {
      if (window.SettingsManager) window.SettingsManager.updateSetting('repeatMessageCount', parseInt(this.value, 10));
    });
    document.getElementById('useGrade2').addEventListener('change', function () {
      if (window.SettingsManager) window.SettingsManager.updateSetting('useGrade2', this.checked);
    });
    if (usageModeEl) usageModeEl.addEventListener('change', function () {
      var on = this.value === 'bothDeafBlind';
      if (window.SettingsManager) window.SettingsManager.updateSetting('bothDeafBlind', on);
      settings.bothDeafBlind = on;
      if (appBody) appBody.classList.toggle('mode-both-deafblind', on);
      var vb = document.getElementById('voiceBtn');
      if (vb) vb.classList.toggle('advanced-only', !on);
    });
    if (appBody) appBody.classList.toggle('mode-both-deafblind', !!settings.bothDeafBlind);
    var voiceBtnVisibility = document.getElementById('voiceBtn');
    if (voiceBtnVisibility) voiceBtnVisibility.classList.toggle('advanced-only', !settings.bothDeafBlind);

    function updateSendPreview() {
      var preview = document.getElementById('sendPreviewText');
      var sendDb = document.getElementById('sendBtnDeafBlind');
      var playPreviewBtn = document.getElementById('playPreviewVibrationBtn');
      if (!messageInput) return;
      var txt = messageInput.value.trim();
      if (preview) preview.textContent = txt || '— Rekam suara, teks akan muncul di sini —';
      if (sendDb) sendDb.disabled = !isConnected() || !txt;
      if (playPreviewBtn) playPreviewBtn.disabled = !txt;
    }
    document.getElementById('clearPreviewBtn').addEventListener('click', function () {
      messageInput.value = '';
      if (charCount) charCount.textContent = '0';
      document.getElementById('sendBtn').disabled = true;
      var playBtnEl = document.getElementById('playBtn');
      if (playBtnEl) playBtnEl.disabled = true;
      updateSendPreview();
    });
    document.getElementById('sendBtnDeafBlind').addEventListener('click', function () {
      var txt = messageInput.value.trim();
      if (!txt || !isConnected()) return;
      sendMessage(txt);
      messageInput.value = '';
      if (charCount) charCount.textContent = '0';
      document.getElementById('sendBtn').disabled = true;
      var playBtnEl = document.getElementById('playBtn');
      if (playBtnEl) playBtnEl.disabled = true;
      updateSendPreview();
    });
    var playPreviewVibrationBtn = document.getElementById('playPreviewVibrationBtn');
    if (playPreviewVibrationBtn) {
      playPreviewVibrationBtn.addEventListener('click', function () {
        var txt = messageInput.value.trim();
        if (!txt) return;
        var useG2 = document.getElementById('useGrade2') && document.getElementById('useGrade2').checked;
        var patterns = useG2 ? textToVibrationPatternGrade2(txt) : textToVibrationPattern(txt);
        var progressSection = document.getElementById('progressSection');
        var progressText = document.getElementById('progressText');
        if (progressSection) progressSection.classList.remove('hidden');
        if (progressText) progressText.textContent = 'Memutar getaran preview…';
        playVibrationPattern(patterns, function (p) {
          if (progressText) progressText.textContent = 'Memutar: ' + p.current + ' / ' + p.total;
          if (p.current >= p.total && progressSection) progressSection.classList.add('hidden');
        });
      });
    }
    var voiceBtnDeafBlind = document.getElementById('voiceBtnDeafBlind');
    if (voiceBtnDeafBlind && voiceBtn) voiceBtnDeafBlind.addEventListener('click', function () { voiceBtn.click(); });
    if (autoSendAfterVoiceEl) autoSendAfterVoiceEl.addEventListener('change', function () {
      if (window.SettingsManager) window.SettingsManager.updateSetting('autoSendAfterVoice', this.checked);
      settings.autoSendAfterVoice = this.checked;
    });

    // --- Input Braille 6 titik (on-screen keyboard) ---
    var brailleCell = [0, 0, 0, 0, 0, 0];
    function syncBrailleUI() {
      document.querySelectorAll('.braille-dot').forEach(function (btn) {
        var idx = parseInt(btn.getAttribute('data-dot'), 10) - 1;
        btn.textContent = brailleCell[idx] ? '●' : '○';
        btn.classList.toggle('bg-emerald-200', !!brailleCell[idx]);
        btn.classList.toggle('dark:bg-emerald-700/50', !!brailleCell[idx]);
      });
      var key = brailleCell.join('');
      var ch = REVERSE_BRAILLE_MAP[key];
      var previewEl = document.getElementById('brailleCellPreview');
      if (previewEl) previewEl.textContent = ch ? ('Karakter: "' + ch + '"') : 'Sel kosong';
    }
    function clearBrailleCell() {
      brailleCell = [0, 0, 0, 0, 0, 0];
      syncBrailleUI();
    }
    document.querySelectorAll('.braille-dot').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-dot'), 10) - 1;
        brailleCell[idx] = brailleCell[idx] ? 0 : 1;
        syncBrailleUI();
      });
    });
    document.getElementById('brailleAddCharBtn').addEventListener('click', function () {
      var key = brailleCell.join('');
      var ch = REVERSE_BRAILLE_MAP[key];
      if (ch !== undefined) {
        messageInput.value = messageInput.value + ch;
        if (charCount) charCount.textContent = messageInput.value.length;
        document.getElementById('sendBtn').disabled = !isConnected() || !messageInput.value.trim();
        var playBtnEl = document.getElementById('playBtn');
        if (playBtnEl) playBtnEl.disabled = !messageInput.value.trim();
        updateSendPreview();
      }
      clearBrailleCell();
    });
    document.getElementById('brailleSpaceBtn').addEventListener('click', function () {
      messageInput.value = messageInput.value + ' ';
      if (charCount) charCount.textContent = messageInput.value.length;
      document.getElementById('sendBtn').disabled = !isConnected() || !messageInput.value.trim();
      var playBtnEl = document.getElementById('playBtn');
      if (playBtnEl) playBtnEl.disabled = !messageInput.value.trim();
      updateSendPreview();
    });
    document.getElementById('brailleBackspaceBtn').addEventListener('click', function () {
      if (messageInput.value.length === 0) return;
      messageInput.value = messageInput.value.slice(0, -1);
      if (charCount) charCount.textContent = messageInput.value.length;
      document.getElementById('sendBtn').disabled = !isConnected() || !messageInput.value.trim();
      var playBtnEl = document.getElementById('playBtn');
      if (playBtnEl) playBtnEl.disabled = !messageInput.value.trim();
      updateSendPreview();
    });

    document.getElementById('showLogBtn').addEventListener('click', function () {
      var logContent = document.getElementById('logContent');
      if (logContent.classList.contains('hidden')) {
        var history = window.MessageHistory ? window.MessageHistory.loadHistory() : [];
        var today = new Date().toDateString();
        var todayHistory = history.filter(function (m) {
          return m.savedAt && new Date(m.savedAt).toDateString() === today;
        });
        if (todayHistory.length) {
          logContent.innerHTML = todayHistory.slice(-50).reverse().map(function (m) {
            var time = m.savedAt ? new Date(m.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
            var from = (m.from && m.from.name) ? escapeHtml(m.from.name) : '?';
            var raw = (m.text || '').substring(0, 60) + ((m.text || '').length > 60 ? '…' : '');
            return time + ' ' + from + ': ' + escapeHtml(raw);
          }).join('<br>');
        } else {
          logContent.textContent = 'Belum ada pesan hari ini.';
        }
        logContent.classList.remove('hidden');
      } else {
        logContent.classList.add('hidden');
      }
    });

    var onboardingOverlay = document.getElementById('onboardingOverlay');
    var onboardingClose = document.getElementById('onboardingClose');
    if (onboardingOverlay && onboardingClose) {
      if (!settings.onboardingSeen) onboardingOverlay.classList.remove('hidden');
      onboardingClose.addEventListener('click', function () {
        onboardingOverlay.classList.add('hidden');
        if (window.SettingsManager) window.SettingsManager.updateSetting('onboardingSeen', true);
      });
    }

    // Mode belajar: putar getaran pelan (0.6x) untuk latihan
    document.querySelectorAll('.learn-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = (this.getAttribute('data-learn') || '').trim();
        if (!text) return;
        var progressSection = document.getElementById('progressSection');
        var progressText = document.getElementById('progressText');
        progressSection.classList.remove('hidden');
        progressText.textContent = 'Mode belajar (pelan): ' + text;
        playVibrationPattern(textToVibrationPattern(text), function (p) {
          progressText.textContent = 'Mode belajar: ' + p.current + ' / ' + p.total;
          if (p.current >= p.total) progressSection.classList.add('hidden');
        }, 1.8);
      });
    });

    function isConnected() {
      return ws && ws.readyState === WebSocket.OPEN;
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();
})();
