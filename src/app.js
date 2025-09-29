import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectToDatabase } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

const app = express();

// Connect DB
connectToDatabase().catch((err) => {
  console.error('Failed to connect to database', err);
  process.exit(1);
});

// Security & common middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limit auth and transactions separately if desired; keep a sane default
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', apiLimiter);

// Routes
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Not found and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;


