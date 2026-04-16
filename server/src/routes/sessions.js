import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import * as sessionController from '../controllers/sessionController.js';

const router = Router();

router.get('/', authMiddleware, sessionController.getAll);
router.get('/:id', authMiddleware, sessionController.getOne);
router.post('/', authMiddleware, requireAdmin, sessionController.create);
router.put('/:id', authMiddleware, requireAdmin, sessionController.update);
router.delete('/:id', authMiddleware, requireAdmin, sessionController.remove);

export default router;
