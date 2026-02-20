/**
 * WebSocket Client untuk Kaito Whale
 * Menghandle koneksi dan komunikasi real-time dengan server
 */

import 'react-native-url-polyfill/auto';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = false;
    this.isConnected = false;
    this.listeners = new Map();
    this.clientId = null;
    this.userName = null;
  }

  /**
   * Connect to WebSocket server
   * @param {string} serverUrl - WebSocket server URL (e.g., 'ws://192.168.1.100:3000')
   * @param {string} userName - Optional user name
   */
  connect(serverUrl, userName = null) {
    if (this.isConnecting || this.isConnected) {
      console.warn('Already connected or connecting');
      return;
    }

    this.url = serverUrl;
    this.userName = userName;
    this.isConnecting = true;

    try {
      // Ensure URL starts with ws:// or wss://
      let wsUrl = serverUrl;
      if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        wsUrl = `ws://${serverUrl}`;
      }

      console.log(`Connecting to WebSocket: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        this.emit('connected', { url: wsUrl });

        // Send user name if provided
        if (userName) {
          this.setName(userName);
        }

        // Start ping interval
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.emit('error', { error: 'Invalid message format' });
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', { error: 'Connection error', details: error });
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.isConnected = false;
        this.stopPing();
        this.emit('disconnected', { code: event.code, reason: event.reason });

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect(this.url, this.userName);
          }, this.reconnectDelay);
        } else {
          console.log('Max reconnect attempts reached');
          this.emit('reconnect_failed', {});
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.emit('error', { error: 'Failed to create connection', details: error });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    this.stopPing();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.clientId = null;
  }

  /**
   * Send message to server
   * @param {string} type - Message type
   * @param {object} data - Message data
   */
  send(type, data) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      this.emit('error', { error: 'Not connected to server' });
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      this.emit('error', { error: 'Failed to send message', details: error });
      return false;
    }
  }

  /**
   * Send text message
   * @param {string} text - Text message to send
   * @param {Array} vibrationPattern - Optional vibration pattern
   */
  sendMessage(text, vibrationPattern = null) {
    return this.send('message', {
      text,
      vibrationPattern
    });
  }

  /**
   * Set user name
   * @param {string} name - User name
   */
  setName(name) {
    this.userName = name;
    return this.send('set_name', { name });
  }

  /**
   * Send typing indicator
   * @param {boolean} isTyping - Is user typing
   */
  sendTyping(isTyping) {
    return this.send('typing', { isTyping });
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    switch (message.type) {
      case 'connect':
        this.clientId = message.data.clientId;
        this.emit('connect', message.data);
        break;

      case 'broadcast':
        this.emit('message', message.data);
        break;

      case 'user_list':
        this.emit('user_list', message.data);
        break;

      case 'disconnect':
        this.emit('user_disconnected', message.data);
        break;

      case 'typing':
        this.emit('typing', message.data);
        break;

      case 'error':
        this.emit('error', message.data);
        break;

      case 'pong':
        // Ping response
        break;

      default:
        console.warn('Unknown message type:', message.type);
        this.emit('unknown_message', message);
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      clientId: this.clientId,
      userName: this.userName,
      url: this.url
    };
  }
}

// Export singleton instance
export default new WebSocketClient();
