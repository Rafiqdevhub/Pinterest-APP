import express from 'express';
import { registerUser, loginUser, logoutUser, getUser, followUser } from '../controllers/userController.js';

const router = express.Router();    

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/:username', getUser);
router.post('/:username/follow', followUser);

export default router;