import express from 'express';
import { getPostComments, addComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pin/:pinId', getPostComments);
router.post('/pin/:pinId', protect, addComment);

export default router;