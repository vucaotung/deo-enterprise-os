import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { connectRedis } from './redis';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import tasksRoutes from './routes/tasks';
import projectsRoutes from './routes/projects';
import expensesRoutes from './routes/expenses';
import clientsRoutes from './routes/clients';
import businessLinesRoutes from './routes/business-lines';
import agentsRoutes from './routes/agents';
import clarificationsRoutes from './routes/clarifications';
import notebooksRoutes from './routes/notebooks';
import conversationsRoutes from './routes/conversations';
import auditRoutes from './routes/audit';
import leadsRoutes from './routes/leads';
import agentJobsRoutes from './routes/agent-jobs';
import telegramRoutes from './routes/telegram';
import backofficeRoutes from './routes/backoffice';
import mcpRoutes from './routes/mcp';
import hooksRoutes from './routes/hooks';

import { auditMiddleware } from './middleware/audit';
import { authMiddleware } from './middleware/auth';
import { correlationIdMiddleware } from './middleware/correlation-id';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(correlationIdMiddleware);
app.use(auditMiddleware);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    await authRoutes(req as any, res, () => {});
  } catch (error) {
    console.error('Auth route error', error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/categories', authMiddleware, businessLinesRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/clarifications', authMiddleware, clarificationsRoutes);
app.use('/api/notebooks', authMiddleware, notebooksRoutes);
app.use('/api/conversations', authMiddleware, conversationsRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);
app.use('/api/leads', authMiddleware, leadsRoutes);
app.use('/api/jobs', agentJobsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/backoffice', backofficeRoutes);

// GoClaw integration
app.use('/mcp', mcpRoutes);
app.use('/internal/hooks', hooksRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`Client ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('message', (data: any) => {
    const { conversationId, content } = data;
    io.to(`conversation:${conversationId}`).emit('message', {
      id: Math.random().toString(),
      content,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

async function start() {
  try {
    await connectRedis();
    console.log('Connected to Redis');

    httpServer.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

start();

export { app, httpServer, io };
