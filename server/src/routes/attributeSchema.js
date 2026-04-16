import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import * as attributeSchemaController from '../controllers/attributeSchemaController.js';

const router = Router();

router.get('/', authMiddleware, attributeSchemaController.getAll);
router.post('/', authMiddleware, requireAdmin, attributeSchemaController.create);
router.put('/:id', authMiddleware, requireAdmin, attributeSchemaController.update);
router.delete('/:id', authMiddleware, requireAdmin, attributeSchemaController.remove);

export default router;
