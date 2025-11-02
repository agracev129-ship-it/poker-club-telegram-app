import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Импорт маршрутов
import usersRouter from './routes/users.js';
import gamesRouter from './routes/games.js';
import tournamentsRouter from './routes/tournaments.js';
import profileRequestsRouter from './routes/profile-requests.js';
import { initSeating } from './database/init-seating.js';
import { initProfileModeration } from './database/init-profile-moderation.js';
import { initTournamentLifecycle } from './database/init-tournament-lifecycle.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Маршруты API
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/profile-requests', profileRequestsRouter);

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'Poker Club Telegram Mini App API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      games: '/api/games',
      tournaments: '/api/tournaments'
    }
  });
});

// Health check endpoint для Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || '*'}`);
  
  // Initialize seating tables on startup
  try {
    await initSeating();
  } catch (error) {
    console.error('⚠️ Failed to initialize seating tables (may already exist):', error.message);
  }
  
  // Initialize profile moderation tables on startup
  try {
    await initProfileModeration();
  } catch (error) {
    console.error('⚠️ Failed to initialize profile moderation tables (may already exist):', error.message);
  }
  
  // Initialize tournament lifecycle system on startup
  try {
    await initTournamentLifecycle();
  } catch (error) {
    console.error('⚠️ Failed to initialize tournament lifecycle system (may already exist):', error.message);
  }
  
  // Initialize automated tournament jobs
  try {
    await import('./jobs/tournament-automation.js');
    console.log('✅ Tournament automation jobs initialized');
  } catch (error) {
    console.error('⚠️ Failed to initialize automation jobs:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

