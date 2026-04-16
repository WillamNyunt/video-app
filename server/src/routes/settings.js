import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

router.get('/', authMiddleware, settingsController.getAll);
router.put('/', authMiddleware, requireAdmin, settingsController.upsert);

export default router;
