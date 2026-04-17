import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// Login does not require authMiddleware — it's the auth entry point
router.post('/login', authController.login);

// Logout and me require a valid token
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.put('/me/picture', authMiddleware, requireAdmin, uploadAvatar.single('picture'), authController.updateProfilePicture);

export default router;
