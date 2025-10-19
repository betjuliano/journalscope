// server.ts - Next.js Standalone + Socket.IO + Redis
import 'dotenv/config'
import { setupSocket } from './src/lib/socket';
import { cacheService } from './src/lib/redis';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3001;
const hostname = '0.0.0.0';
const allowedOrigins = new Set([
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:5175',
  'https://periodicos.iaprojetos.com.br',
  'https://periodicos.iatranscreve.com.br',
  'http://localhost:8080'
]);

function setCors(res: any, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');
}

// Custom server with Socket.IO + Redis integration
async function createCustomServer() {
  try {
    // Initialize Redis cache
    console.log('🔄 Initializing Redis cache...');
    await cacheService.init();
    
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      const originHeader = (req.headers as any)['origin'] as string | undefined;
      const origin = originHeader && allowedOrigins.has(originHeader) ? originHeader : 'http://localhost:5173';

      // Preflight CORS para rotas de API
      if (req.method === 'OPTIONS' && req.url?.startsWith('/api/')) {
        setCors(res, origin);
        res.statusCode = 204;
        res.end();
        return;
      }

      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }

      // Garantir CORS em requisições de API
      if (req.url?.startsWith('/api/')) {
        setCors(res, origin);
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
