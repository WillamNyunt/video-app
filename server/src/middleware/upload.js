import multer from 'multer';
import path from 'path';
import fs from 'fs';

function makeStorage(subdir) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const storagePath = process.env.STORAGE_PATH || './uploads';
      const dest = path.resolve(storagePath, subdir);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}${ext}`);
    },
  });
}

// Single video file field + optional thumbnail
export const uploadVideo = multer({ storage: makeStorage('videos') });

// For thumbnail-only uploads (video metadata update etc.)
export const uploadThumbnail = multer({ storage: makeStorage('thumbnails') });

// For video PUT: routes video field to videos/ and thumbnail to thumbnails/
export const uploadVideoUpdate = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const storagePath = process.env.STORAGE_PATH || './uploads';
      const subdir = file.fieldname === 'video' ? 'videos' : 'thumbnails';
      const dest = path.resolve(storagePath, subdir);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}${ext}`);
    },
  }),
});

// Location images: two fields — picture and thumbnail
export const uploadLocationImages = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const storagePath = process.env.STORAGE_PATH || './uploads';
      const dest = path.resolve(storagePath, 'location-images');
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}${ext}`);
    },
  }),
});

/**
 * Build a relative path to store in DB from an uploaded file.
 * e.g. file.path = "/abs/path/uploads/videos/abc.mp4"
 *      storagePath = "/abs/path/uploads"
 *      => "videos/abc.mp4"
 */
export function relativeStoragePath(file) {
  const storagePath = path.resolve(process.env.STORAGE_PATH || './uploads');
  return path.relative(storagePath, file.path);
}
