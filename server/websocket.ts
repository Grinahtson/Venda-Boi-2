import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer, IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { storage } from './storage';

interface ConnectedUser {
  userId: string;
  ws: WebSocket;
}

const connectedUsers = new Map<string, ConnectedUser[]>();

export function setupWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ noServer: true });
  
  // Handle WebSocket upgrades on /api/ws
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (request.url === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Authenticate
        if (message.type === 'auth') {
          const session = await storage.getSession(message.sessionId);
          if (session) {
            userId = session.userId;
            if (!connectedUsers.has(userId)) {
              connectedUsers.set(userId, []);
            }
            connectedUsers.get(userId)!.push({ userId, ws });
            console.log(`✅ User ${userId} connected via WebSocket`);
          }
          return;
        }

        if (!userId) {
          ws.send(JSON.stringify({ error: 'Not authenticated' }));
          return;
        }

        // Handle different message types
        if (message.type === 'chat') {
          const { receiverId, content } = message;
          
          // Save message to DB
          await storage.createMessage({
            senderId: userId,
            receiverId,
            content,
          });

          // Send to receiver if online
          if (connectedUsers.has(receiverId)) {
            const receivers = connectedUsers.get(receiverId)!;
            receivers.forEach(r => {
              r.ws.send(JSON.stringify({
                type: 'chat',
                from: userId,
                content,
                timestamp: new Date().toISOString()
              }));
            });
          }

          // Confirm to sender
          ws.send(JSON.stringify({ type: 'chat-sent', ok: true }));
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ error: 'Server error' }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        const users = connectedUsers.get(userId) || [];
        const index = users.findIndex(u => u.ws === ws);
        if (index !== -1) users.splice(index, 1);
        if (users.length === 0) {
          connectedUsers.delete(userId);
        }
        console.log(`👋 User ${userId} disconnected`);
      }
    });
  });

  return wss;
}

export { connectedUsers };
