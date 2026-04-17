import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { seed } from './src/seed.js';

import { authMiddleware } from './src/middleware/auth.js';
import authRoutes from './src/routes/auth.js';
import locationRoutes from './src/routes/locations.js';
import sessionRoutes from './src/routes/sessions.js';
import videoRoutes from './src/routes/videos.js';
import peopleRoutes from './src/routes/people.js';
import personVideoRoutes from './src/routes/personVideo.js';
import attributeSchemaRoutes from './src/routes/attributeSchema.js';
import searchRoutes from './src/routes/search.js';
import settingsRoutes from './src/routes/settings.js';
import personPictureRoutes from './src/routes/personPictures.js';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Auth-gated static file serving for uploads (thumbnails, location images, etc.)
const uploadsPath = resolve(process.env.STORAGE_PATH || './uploads');
app.use('/api/uploads', authMiddleware, express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/person-video', personVideoRoutes);
app.use('/api/attribute-schema', attributeSchemaRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/person-pictures', personPictureRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  // Never expose raw error internals — only the message string
  return res.status(status).json({ error: message });
});

// Connect and start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/videoarchive';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('[server] Connected to MongoDB');
    await seed();
    app.listen(PORT, () => {
      console.log(`[server] Listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server] MongoDB connection error:', err.message);
    process.exit(1);
  });
