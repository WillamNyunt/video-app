import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { uploadPersonPictures } from '../middleware/upload.js';
import * as ctrl from '../controllers/personPictureController.js';

const router = Router();

router.get('/', authMiddleware, ctrl.list);
router.post('/', authMiddleware, requireAdmin, uploadPersonPictures.array('pictures', 20), ctrl.create);
router.delete('/:id', authMiddleware, requireAdmin, ctrl.remove);

export default router;
