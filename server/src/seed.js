import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import AppSettings from './models/AppSettings.js';

const BCRYPT_ROUNDS = 10;

export async function seed() {
  // --- Admin user ---
  const adminUsername = process.env.SEED_ADMIN_USERNAME;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn(
      '[seed] SEED_ADMIN_USERNAME or SEED_ADMIN_PASSWORD not set — skipping admin creation'
    );
  } else {
    const existingAdmin = await User.findOne({ username: adminUsername });

    if (existingAdmin) {
      console.log(`[seed] Admin user "${adminUsername}" already exists — skipping`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
      await User.create({ username: adminUsername, passwordHash, role: 'admin' });
      console.log(`[seed] Admin user "${adminUsername}" created`);
    }
  }

  // --- AppSettings: theme ---
  const existingTheme = await AppSettings.findOne({ key: 'theme' });

  if (existingTheme) {
    console.log('[seed] AppSettings { key: "theme" } already exists — skipping');
  } else {
    await AppSettings.create({ key: 'theme', value: 'light' });
    console.log('[seed] AppSettings { key: "theme", value: "light" } created');
  }
}

// Allow running directly: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/videoarchive';
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log('[seed] Connected to MongoDB');
      await seed();
      await mongoose.disconnect();
      console.log('[seed] Disconnected. Done.');
    })
    .catch((err) => {
      console.error('[seed] Fatal error:', err.message);
      process.exit(1);
    });
}
