import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';

import authRoutes      from './routes/auth.js';
import userRoutes      from './routes/users.js';
import recordRoutes    from './routes/records.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/records',   recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

await connectDb();
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});