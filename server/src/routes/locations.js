import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { uploadLocationImages } from '../middleware/upload.js';
import * as locationController from '../controllers/locationController.js';

const router = Router();

const locationImageFields = uploadLocationImages.fields([
  { name: 'picture', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

router.get('/', authMiddleware, locationController.getAll);
router.get('/:id', authMiddleware, locationController.getOne);
router.post('/', authMiddleware, requireAdmin, locationImageFields, locationController.create);
router.put('/:id', authMiddleware, requireAdmin, locationImageFields, locationController.update);
router.delete('/:id', authMiddleware, requireAdmin, locationController.remove);

export default router;
