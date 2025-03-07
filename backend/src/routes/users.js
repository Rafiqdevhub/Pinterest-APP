import express from 'express';
import { registerUser, loginUser, logoutUser, getUser, followUser } from '../controllers/userController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerSchema, loginSchema } from '../utils/validationSchemas.js';

const router = express.Router();    

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/logout', protect, logoutUser);
router.get('/:username', getUser);
router.post('/:username/follow', protect, followUser);

export default router;