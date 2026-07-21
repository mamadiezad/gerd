// WebSocket handler — realtime messaging
// Run separately: node src/pages/api/ws/handler.ts
import http from 'http';
import { WebSocketServer } from 'ws';
import { connectDB, Online } from '@/lib/db';

async function startWS() {
  await connectDB();
  const server = http.createServer();
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const userId = url.searchParams.get('userId');
    if (!userId) { ws.close(); return; }

    await Online.findOneAndUpdate(
      { userId },
      { userId, socketId: userId + '-' + Date.now(), lastPing: new Date() },
      { upsert: true }
    );

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          await Online.findOneAndUpdate({ userId }, { lastPing: new Date() });
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {}
    });

    ws.on('close', async () => {
      await Online.deleteOne({ userId });
    });
  });

  server.listen(3002, () => console.log('WS:3002'));
}
startWS().catch(console.error);
