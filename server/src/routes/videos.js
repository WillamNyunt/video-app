import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { uploadVideo, uploadVideoUpdate } from '../middleware/upload.js';
import * as videoController from '../controllers/videoController.js';

const router = Router();

// Combined fields for video upload: one video file + optional thumbnail
const videoUploadFields = uploadVideo.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// For PUT: video goes to videos/, thumbnail goes to thumbnails/
const videoUpdateFields = uploadVideoUpdate.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

router.get('/', authMiddleware, videoController.getAll);
router.get('/:id', authMiddleware, videoController.getOne);
router.get('/:id/file', authMiddleware, videoController.serveFile);
router.post('/', authMiddleware, requireAdmin, videoUploadFields, videoController.create);
router.put('/:id', authMiddleware, requireAdmin, videoUpdateFields, videoController.update);
router.delete('/:id', authMiddleware, requireAdmin, videoController.remove);

export default router;
