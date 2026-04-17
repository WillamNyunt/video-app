import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Returns a date-based subdirectory string, e.g. "videos/2025-04".
 * Called at upload time so each file lands in the correct month folder.
 */
function dateSubdir(type) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${type}/${yyyy}-${mm}`;
}

/**
 * makeStorage accepts a string subdir or a function(req, file) => string.
 * When a function is provided it is called per-file at upload time.
 */
function makeStorage(subdirOrFn) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const storagePath = process.env.STORAGE_PATH || './uploads';
      const subdir = typeof subdirOrFn === 'function' ? subdirOrFn(req, file) : subdirOrFn;
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
export const uploadVideo = multer({ storage: makeStorage(() => dateSubdir('videos')) });

// For thumbnail-only uploads (video metadata update etc.)
export const uploadThumbnail = multer({ storage: makeStorage(() => dateSubdir('thumbnails')) });

// For video PUT: routes video field to dated videos/ and thumbnail to dated thumbnails/
export const uploadVideoUpdate = multer({
  storage: makeStorage((req, file) =>
    file.fieldname === 'video' ? dateSubdir('videos') : dateSubdir('thumbnails')
  ),
});

// Location images: two fields — picture and thumbnail (no date subdirectory)
export const uploadLocationImages = multer({
  storage: makeStorage('location-images'),
});

// Admin profile picture uploads
export const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 },
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

export const uploadPersonPictures = multer({
  storage: makeStorage(() => dateSubdir('person-pictures')),
  limits: { fileSize: 10 * 1024 * 1024 },
});
