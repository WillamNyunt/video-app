import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import * as personController from '../controllers/personController.js';

const router = Router();

router.get('/', authMiddleware, personController.getAll);
router.get('/:id', authMiddleware, personController.getOne);
router.get('/:id/videos', authMiddleware, personController.getVideos);
router.post('/', authMiddleware, requireAdmin, personController.create);
router.put('/:id', authMiddleware, requireAdmin, personController.update);
router.delete('/:id', authMiddleware, requireAdmin, personController.remove);

export default router;
