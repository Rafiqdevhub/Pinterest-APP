import express from 'express';
import { getAllPins } from '../controllers/pinController.js';

const router = express.Router();

// @route   GET api/pins
// @desc    Get all pins
// @access  Public
router.get('/', getAllPins);

export default router;
