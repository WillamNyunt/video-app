import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// Login does not require authMiddleware — it's the auth entry point
router.post('/login', authController.login);

// Logout and me require a valid token
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
