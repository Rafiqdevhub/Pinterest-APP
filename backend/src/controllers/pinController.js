import Pin from '../models/Pin.js';

export const getAllPins = async (req, res) => {
  try {
    const pins = await Pin.find();
    res.json(pins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
