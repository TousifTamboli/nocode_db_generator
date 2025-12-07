import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import dataRoutes from './routes/data.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Check if we're in Vercel serverless environment
const isVercel = process.env.VERCEL === '1';

// Socket.IO setup (only for non-Vercel environments)
let io: Server | null = null;
if (!isVercel) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

// Middleware - Allow multiple origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://nocode-db-generator.vercel.app', // Update this with your actual Vercel URL
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now during testing
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB on first request (for serverless)
let isConnected = false;
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/data', dataRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NoCode DB Builder API is running', environment: isVercel ? 'vercel' : 'server' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'NoCode DB Builder API', version: '1.0.0' });
});

// Start server (only for non-Vercel environments)
const PORT = process.env.PORT || 5000;

if (!isVercel) {
  const startServer = async () => {
    try {
      // Connect to MongoDB
      await connectDB();
      isConnected = true;

      httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

// Export for Vercel serverless
export default app;
export { io };
