import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import teacherAuthRouter from './routes/teacherAuth.js';
import authRouter from './routes/auth.js';
import accessCodeRouter from './routes/accessCode.js';
import verifyCodeRouter from './routes/verifyCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiter for general auth routes (e.g. login & password reset: 10 attempts per 10 mins)
const generalAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many attempts from this IP address. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(cors({
  origin: true, // Allow frontend origin
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Route mounts
app.use('/api/teacher/forgot-password', generalAuthLimiter);
app.use('/api/teacher', teacherAuthRouter);
app.use('/api', authRouter);
app.use('/api', accessCodeRouter);
app.use('/api', verifyCodeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ChemLab AI Auth API', timestamp: new Date().toISOString() });
});

// Serve static frontend build files if dist folder exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`ChemLab AI Express API Server running on port ${PORT}`);
});

export default app;
