import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { textToVibrationPattern, getPatternPreview } from './brailleEncoder';
import { playVibrationPattern, stopVibration, playPatternVibration } from './vibrationController';
import wsClient from './websocketClient';

export default function App() {
  // Connection state
  const [serverUrl, setServerUrl] = useState('ws://192.168.1.100:3000');
  const [userName, setUserName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Chat state
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [patternPreview, setPatternPreview] = useState('');
  const [isReceivingVibration, setIsReceivingVibration] = useState(false);

  const scrollViewRef = useRef(null);

  // Setup WebSocket event listeners
  useEffect(() => {
    // Connected event
    wsClient.on('connected', (data) => {
      console.log('Connected to server:', data);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionStatus('connected');
      playPatternVibration('success');
    });

    // Disconnected event
    wsClient.on('disconnected', () => {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      playPatternVibration('error');
    });

    // Message received
    wsClient.on('message', (data) => {
      console.log('Message received:', data);
      const newMessage = {
        id: Date.now().toString(),
        from: data.from,
        text: data.text,
        timestamp: Date.now(),
        isOwn: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Auto-play vibration untuk pesan yang diterima
      if (data.text) {
        handleReceiveMessage(data.text);
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // User list updated
    wsClient.on('user_list', (data) => {
      setUsers(data.users || []);
    });

    // Error event
    wsClient.on('error', (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Error', error.error || 'Terjadi kesalahan koneksi');
      setIsConnecting(false);
      setConnectionStatus('error');
    });

    // Reconnect failed
    wsClient.on('reconnect_failed', () => {
      Alert.alert('Koneksi Gagal', 'Tidak dapat terhubung ke server. Silakan coba lagi.');
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    });

    // Cleanup on unmount
    return () => {
      wsClient.disconnect();
    };
  }, []);

  // Handle connect/disconnect
  const handleConnect = () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Masukkan URL server terlebih dahulu');
      return;
    }

    if (isConnected) {
      wsClient.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setMessages([]);
      setUsers([]);
    } else {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      wsClient.connect(serverUrl, userName || null);
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Masukkan pesan terlebih dahulu');
      return;
    }

    if (!isConnected) {
      Alert.alert('Error', 'Belum terhubung ke server');
      return;
    }

    const vibrationPattern = textToVibrationPattern(inputText);
    
    // Send via WebSocket
    const success = wsClient.sendMessage(inputText, vibrationPattern);
    
    if (success) {
      // Add to local messages
      const newMessage = {
        id: Date.now().toString(),
        from: { name: userName || 'Saya', id: wsClient.clientId },
        text: inputText,
        timestamp: Date.now(),
        isOwn: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      setPatternPreview('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Handle receive message and play vibration
  const handleReceiveMessage = async (text) => {
    if (isPlaying || isReceivingVibration) {
      return; // Skip if already playing
    }

    setIsReceivingVibration(true);
    
    try {
      const patterns = textToVibrationPattern(text);
      
      await playVibrationPattern(patterns, (progress) => {
        setCurrentProgress(progress);
      });

      // Play notification vibration
      await playPatternVibration('info');
    } catch (error) {
      console.error('Error playing received vibration:', error);
    } finally {
      setIsReceivingVibration(false);
      setCurrentProgress(null);
    }
  };

  // Handle play local vibration
  const handlePlayVibration = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Masukkan teks terlebih dahulu');
      return;
    }

    if (isPlaying) {
      stopVibration();
      setIsPlaying(false);
      setCurrentProgress(null);
      return;
    }

    setIsPlaying(true);
    setCurrentProgress({ current: 0, total: 0 });

    try {
      const patterns = textToVibrationPattern(inputText);
      
      await playVibrationPattern(patterns, (progress) => {
        setCurrentProgress(progress);
      });

      await playPatternVibration('success');
    } catch (error) {
      console.error('Error playing vibration:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memutar getaran');
      await playPatternVibration('error');
    } finally {
      setIsPlaying(false);
      setCurrentProgress(null);
    }
  };

  // Update preview ketika text berubah
  const handleTextChange = (text) => {
    setInputText(text);
    if (text.length > 0) {
      setPatternPreview(getPatternPreview(text));
    } else {
      setPatternPreview('');
    }
  };

  // Test vibration
  const handleTestVibration = async () => {
    await playPatternVibration('info');
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        ref={scrollViewRef}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🐋 Kaito Whale</Text>
          <Text style={styles.subtitle}>
            Komunikasi melalui Getaran untuk Tuli-Buta
          </Text>
        </View>

        {/* Connection Section */}
        <View style={styles.connectionSection}>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusIndicator,
              connectionStatus === 'connected' && styles.statusConnected,
              connectionStatus === 'connecting' && styles.statusConnecting,
              connectionStatus === 'error' && styles.statusError
            ]} />
            <Text style={styles.statusText}>
              {connectionStatus === 'connected' && '✓ Terhubung'}
              {connectionStatus === 'connecting' && '⏳ Menghubungkan...'}
              {connectionStatus === 'disconnected' && '○ Terputus'}
              {connectionStatus === 'error' && '✗ Error'}
            </Text>
          </View>

          {!isConnected && (
            <>
              <TextInput
                style={styles.input}
                placeholder="URL Server (ws://192.168.1.100:3000)"
                value={serverUrl}
                onChangeText={setServerUrl}
                editable={!isConnecting}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Nama Anda (opsional)"
                value={userName}
                onChangeText={setUserName}
                editable={!isConnecting}
                placeholderTextColor="#999"
              />
            </>
          )}

          <TouchableOpacity
            style={[
              styles.connectButton,
              isConnecting && styles.buttonDisabled
            ]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>
                {isConnected ? '🔌 Putuskan Koneksi' : '🔗 Hubungkan'}
              </Text>
            )}
          </TouchableOpacity>

          {isConnected && users.length > 0 && (
            <View style={styles.userListSection}>
              <Text style={styles.userListTitle}>
                Pengguna Online ({users.length})
              </Text>
              {users.map((user, index) => (
                <Text key={index} style={styles.userItem}>
                  • {user.name || 'Anonymous'}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Messages Section */}
        {isConnected && (
          <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Pesan</Text>
            {messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>
                  Belum ada pesan. Kirim pesan pertama!
                </Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.isOwn && styles.messageBubbleOwn
                  ]}
                >
                  <Text style={styles.messageSender}>
                    {msg.isOwn ? 'Saya' : msg.from.name}
                  </Text>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Masukkan Pesan:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            placeholder="Ketik pesan di sini..."
            value={inputText}
            onChangeText={handleTextChange}
            editable={!isPlaying && !isReceivingVibration}
            placeholderTextColor="#999"
          />
        </View>

        {/* Pattern Preview */}
        {patternPreview ? (
          <View style={styles.previewSection}>
            <Text style={styles.label}>Preview Pola Braille:</Text>
            <Text style={styles.previewText}>{patternPreview}</Text>
          </View>
        ) : null}

        {/* Progress Indicator */}
        {(currentProgress || isReceivingVibration) && (
          <View style={styles.progressSection}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.progressText}>
              {isReceivingVibration 
                ? '📳 Memutar getaran pesan yang diterima...'
                : `Memutar: ${currentProgress?.current || 0} / ${currentProgress?.total || 0}`
              }
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          {isConnected ? (
            <TouchableOpacity
              style={[styles.button, styles.sendButton]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isPlaying}
            >
              <Text style={styles.buttonText}>📤 Kirim Pesan</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              styles.playButton,
              (isPlaying || isReceivingVibration) && styles.buttonDisabled
            ]}
            onPress={handlePlayVibration}
            disabled={!inputText.trim() || isReceivingVibration}
          >
            <Text style={styles.buttonText}>
              {isPlaying ? '⏸ Hentikan' : '▶ Putar Getaran Lokal'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestVibration}
          >
            <Text style={styles.buttonText}>🔔 Test Getaran</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Cara Menggunakan:</Text>
          <Text style={styles.infoText}>
            {isConnected ? (
              <>
                1. Ketik pesan dan tekan "Kirim Pesan" untuk mengirim ke semua pengguna{'\n'}
                2. Pesan yang diterima akan otomatis diputar sebagai getaran{'\n'}
                3. Gunakan "Putar Getaran Lokal" untuk preview sebelum mengirim{'\n'}
                4. Setiap huruf dikonversi ke pola Braille 6-titik
              </>
            ) : (
              <>
                1. Masukkan URL server WebSocket (contoh: ws://192.168.1.100:3000){'\n'}
                2. Masukkan nama Anda (opsional){'\n'}
                3. Tekan "Hubungkan" untuk terhubung ke server{'\n'}
                4. Setelah terhubung, Anda bisa mengirim dan menerima pesan
              </>
            )}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  connectionSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#95a5a6',
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#27ae60',
  },
  statusConnecting: {
    backgroundColor: '#f39c12',
  },
  statusError: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50',
  },
  connectButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userListSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  userListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  userItem: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  messagesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  emptyMessages: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 14,
  },
  messageBubble: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  messageBubbleOwn: {
    backgroundColor: '#d5f4e6',
    alignSelf: 'flex-end',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#2c3e50',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50',
  },
  previewSection: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewText: {
    fontSize: 14,
    color: '#34495e',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonSection: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButton: {
    backgroundColor: '#27ae60',
  },
  playButton: {
    backgroundColor: '#3498db',
  },
  testButton: {
    backgroundColor: '#9b59b6',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22,
  },
});
