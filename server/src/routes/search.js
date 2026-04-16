import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as searchController from '../controllers/searchController.js';

const router = Router();

router.get('/', authMiddleware, searchController.search);

export default router;
