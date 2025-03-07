import express from 'express';
import { 
  getAllPins, 
  getPin, 
  createPin, 
  toggleSavePin, 
  addComment 
} from '../controllers/pinController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { pinSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', getAllPins);
router.get('/:id', getPin);
router.post('/', protect, validateRequest(pinSchema), createPin);
router.post('/:id/save', protect, toggleSavePin);
router.post('/:id/comments', protect, addComment);

export default router;
