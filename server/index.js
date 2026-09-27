import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import evidenceRoutes from './routes/evidence.js';
import { initDatabase } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Serve static evidence directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize DB schema & seed data
initDatabase();

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'US.ClaimBack API',
    database: 'SQLite (WAL Mode)',
    time: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[US.ClaimBack Backend] Server running on http://127.0.0.1:${PORT}`);
});
