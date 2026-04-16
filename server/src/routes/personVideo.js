import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import * as personVideoController from '../controllers/personVideoController.js';

const router = Router();

router.post('/', authMiddleware, requireAdmin, personVideoController.link);
router.delete('/', authMiddleware, requireAdmin, personVideoController.unlink);

export default router;
