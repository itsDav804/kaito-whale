/**
 * WebSocket Server untuk Kaito Whale
 * Menghandle real-time messaging antar devices
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS + allow microphone for voice input (rekam) on HTTPS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Permissions-Policy', 'microphone=(self)'); // allow mic for same origin (HTTPS)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve web app (versi web untuk browse dari HP)
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false // Disable compression untuk mobile
});

// Store connected clients
const clients = new Map();
let clientIdCounter = 0;

// Rate limiting: track message counts per client
const messageRates = new Map(); // clientId -> { count, resetAt }
const RATE_LIMIT = {
  MAX_MESSAGES: 30, // Max messages
  WINDOW_MS: 60000 // Per minute
};

function checkRateLimit(clientId) {
  const now = Date.now();
  const rate = messageRates.get(clientId);
  
  if (!rate || now > rate.resetAt) {
    messageRates.set(clientId, { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS });
    return true;
  }
  
  if (rate.count >= RATE_LIMIT.MAX_MESSAGES) {
    return false;
  }
  
  rate.count++;
  return true;
}

// Message types
const MESSAGE_TYPES = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  BROADCAST: 'broadcast',
  ERROR: 'error',
  USER_LIST: 'user_list',
  TYPING: 'typing',
  READ_RECEIPT: 'read_receipt'
};

// messageId -> sender clientId (untuk read receipt)
const messageSenderMap = new Map();
const MESSAGE_MAP_MAX = 500;

function pruneMessageMap() {
  if (messageSenderMap.size > MESSAGE_MAP_MAX) {
    const keys = Array.from(messageSenderMap.keys()).slice(0, 100);
    keys.forEach(k => messageSenderMap.delete(k));
  }
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${++clientIdCounter}`;
}

/**
 * Broadcast message to all connected clients except sender
 */
function broadcastMessage(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((clientInfo, clientId) => {
    if (clientId !== excludeClientId && clientInfo.ws.readyState === WebSocket.OPEN) {
      try {
        clientInfo.ws.send(messageStr);
      } catch (error) {
        console.error(`Error sending message to ${clientId}:`, error);
      }
    }
  });
}

/**
 * Send user list to all clients
 */
function broadcastUserList() {
  const userList = Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name || 'Anonymous',
    connectedAt: client.connectedAt
  }));

  const message = {
    type: MESSAGE_TYPES.USER_LIST,
    data: {
      users: userList,
      total: userList.length
    },
    timestamp: Date.now()
  };

  broadcastMessage(message);
}

/**
 * Handle new WebSocket connection
 */
wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientInfo = {
    id: clientId,
    ws: ws,
    name: null,
    role: null,
    connectedAt: Date.now(),
    ip: req.socket.remoteAddress
  };

  clients.set(clientId, clientInfo);

  console.log(`[${new Date().toISOString()}] Client connected: ${clientId} (Total: ${clients.size})`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: MESSAGE_TYPES.CONNECT,
    data: {
      clientId: clientId,
      message: 'Connected to Kaito Whale server',
      serverTime: Date.now()
    },
    timestamp: Date.now()
  }));

  // Send current user list
  broadcastUserList();

  /**
   * Handle incoming messages
   */
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      console.log(`[${new Date().toISOString()}] Message from ${clientId}:`, message.type);

      switch (message.type) {
        case MESSAGE_TYPES.MESSAGE:
          // Rate limiting check
          if (!checkRateLimit(clientId)) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              data: { error: 'Terlalu banyak pesan. Tunggu sebentar.' },
              timestamp: Date.now()
            }));
            break;
          }
          
          // Validate message
          const text = message.data.text;
          if (!text || typeof text !== 'string') {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              data: { error: 'Invalid message: text required' },
              timestamp: Date.now()
            }));
            break;
          }
          
          const sanitizedText = text.trim().substring(0, 1000); // Max 1000 chars
          if (sanitizedText.length === 0) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              data: { error: 'Message cannot be empty' },
              timestamp: Date.now()
            }));
            break;
          }

          const messageId = message.data.messageId || `msg_${Date.now()}_${clientId}`;
          messageSenderMap.set(messageId, clientId);
          pruneMessageMap();
          
          // Broadcast text message to all clients (dengan messageId, emergency, mood, role)
          const broadcastMsg = {
            type: MESSAGE_TYPES.BROADCAST,
            data: {
              messageId,
              from: {
                id: clientId,
                name: clientInfo.name || 'Anonymous',
                role: message.data.role !== undefined ? message.data.role : clientInfo.role
              },
              text: sanitizedText,
              vibrationPattern: message.data.vibrationPattern || null,
              emergency: !!message.data.emergency,
              mood: message.data.mood || null
            },
            timestamp: Date.now()
          };
          
          broadcastMessage(broadcastMsg, clientId);
          break;

        case MESSAGE_TYPES.READ_RECEIPT:
          // Terima konfirmasi "sudah baca" -> kirim ke pengirim asli saja
          const msgId = message.data.messageId;
          const senderId = msgId ? messageSenderMap.get(msgId) : null;
          if (senderId && clients.has(senderId)) {
            const senderWs = clients.get(senderId).ws;
            if (senderWs.readyState === WebSocket.OPEN) {
              senderWs.send(JSON.stringify({
                type: MESSAGE_TYPES.READ_RECEIPT,
                data: {
                  messageId: msgId,
                  readBy: { id: clientId, name: clientInfo.name || 'Anonymous' }
                },
                timestamp: Date.now()
              }));
            }
          }
          break;

        case 'set_name':
          // Update client name dan optional role
          clientInfo.name = message.data.name || null;
          clientInfo.role = message.data.role || null;
          console.log(`Client ${clientId} set name to: ${clientInfo.name}`);
          broadcastUserList();
          break;

        case MESSAGE_TYPES.TYPING:
          // Broadcast typing indicator
          const typingMsg = {
            type: MESSAGE_TYPES.TYPING,
            data: {
              from: {
                id: clientId,
                name: clientInfo.name || 'Anonymous'
              },
              isTyping: message.data.isTyping || false
            },
            timestamp: Date.now()
          };
          
          broadcastMessage(typingMsg, clientId);
          break;

        case 'ping':
          // Respond to ping
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error parsing message from ${clientId}:`, error);
      
      ws.send(JSON.stringify({
        type: MESSAGE_TYPES.ERROR,
        data: {
          error: 'Invalid message format',
          message: error.message
        },
        timestamp: Date.now()
      }));
    }
  });

  /**
   * Handle connection close
   */
  ws.on('close', (code, reason) => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId} (Code: ${code})`);
    
    clients.delete(clientId);
    messageRates.delete(clientId); // Clean up rate limit data
    
    // Notify other clients
    broadcastUserList();
    
    // Send disconnect notification
    broadcastMessage({
      type: MESSAGE_TYPES.DISCONNECT,
      data: {
        clientId: clientId,
        name: clientInfo.name || 'Anonymous'
      },
      timestamp: Date.now()
    }, clientId);
  });

  /**
   * Handle errors
   */
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: clients.size,
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} sudah dipakai.`);
    console.error('   Hentikan proses yang memakai port ini: ./stop.sh');
    console.error('   Atau jalankan dengan port lain: PORT=3001 npm start\n');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Kaito Whale WebSocket Server`);
  console.log(`📡 WebSocket: ws://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`🌐 Web app:  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`   → Buka dari HP: http://<IP-komputer>:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
