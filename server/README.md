# Kaito Whale WebSocket Server

Server WebSocket untuk aplikasi Kaito Whale yang memungkinkan komunikasi real-time antar devices.

## 🚀 Instalasi

```bash
cd server
npm install
```

## 📡 Menjalankan Server

```bash
# Production mode
npm start

# Development mode (dengan auto-reload)
npm run dev
```

Server akan berjalan di:
- **WebSocket**: `ws://localhost:3000`
- **HTTP**: `http://localhost:3000`

## ⚙️ Konfigurasi

Anda bisa mengubah port dengan environment variables:

```bash
PORT=8080 HOST=0.0.0.0 npm start
```

- `PORT`: Port untuk server (default: 3000)
- `HOST`: Host untuk binding (default: 0.0.0.0)

## 📱 Koneksi dari Mobile App

Untuk koneksi dari device lain di jaringan yang sama:

1. Cari IP address komputer yang menjalankan server:
   - **Mac/Linux**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`

2. Gunakan IP tersebut di aplikasi mobile:
   ```
   ws://192.168.1.100:3000
   ```
   (Ganti dengan IP komputer Anda)

## 🔧 Fitur

- ✅ Real-time messaging antar clients
- ✅ User list management
- ✅ Auto-reconnect handling
- ✅ Typing indicators
- ✅ Connection status tracking
- ✅ Health check endpoint (`/health`)

## 📡 Message Types

### Client → Server

```javascript
// Send text message
{
  type: 'message',
  data: {
    text: 'Hello',
    vibrationPattern: [...]
  }
}

// Set user name
{
  type: 'set_name',
  data: {
    name: 'John Doe'
  }
}

// Typing indicator
{
  type: 'typing',
  data: {
    isTyping: true
  }
}

// Ping (keep-alive)
{
  type: 'ping',
  data: {}
}
```

### Server → Client

```javascript
// Connection established
{
  type: 'connect',
  data: {
    clientId: 'client_123',
    message: 'Connected to server'
  }
}

// Broadcast message
{
  type: 'broadcast',
  data: {
    from: {
      id: 'client_123',
      name: 'John Doe'
    },
    text: 'Hello',
    vibrationPattern: [...]
  }
}

// User list update
{
  type: 'user_list',
  data: {
    users: [...],
    total: 2
  }
}

// User disconnected
{
  type: 'disconnect',
  data: {
    clientId: 'client_123',
    name: 'John Doe'
  }
}

// Error
{
  type: 'error',
  data: {
    error: 'Error message'
  }
}
```

## 🏥 Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "connectedClients": 2,
  "uptime": 123.45,
  "timestamp": 1234567890
}
```

## 🔒 Security Notes

⚠️ **Penting**: Server ini adalah untuk development/testing. Untuk production, pertimbangkan:

- Menambahkan authentication
- Menggunakan WSS (WebSocket Secure) dengan SSL/TLS
- Rate limiting
- Input validation yang lebih ketat
- CORS configuration

## 📝 Logs

Server akan menampilkan log untuk:
- Client connections/disconnections
- Messages received
- Errors

Contoh output:
```
🚀 Kaito Whale WebSocket Server
📡 Server running on ws://localhost:3000
🌐 HTTP server running on http://localhost:3000
⏰ Started at: 2026-02-19T23:40:00.000Z

[2026-02-19T23:40:00.000Z] Client connected: client_123 (Total: 1)
[2026-02-19T23:40:05.000Z] Message from client_123: message
[2026-02-19T23:40:10.000Z] Client disconnected: client_123 (Code: 1000)
```
