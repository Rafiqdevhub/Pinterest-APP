import Pin from '../models/Pin.js';


export const getAllPins = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Advanced filtering
    let query = Pin.find(queryObj)
      .populate('creator', 'username img displayName')
      .populate('comments.createdBy', 'username img displayName');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    query = query.skip(skip).limit(limit);

    // Execute query
    const [pins, total] = await Promise.all([
      query,
      Pin.countDocuments(queryObj)
    ]);

    res.status(200).json({
      status: 'success',
      results: pins.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: pins
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching pins',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get single pin
// @route   GET /api/v1/pins/:id
// @access  Public
export const getPin = async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id)
      .populate('creator', 'username img displayName')
      .populate('comments.createdBy', 'username img displayName');

    if (!pin) {
      return res.status(404).json({
        status: 'fail',
        message: 'Pin not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: pin
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching pin',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Create new pin
// @route   POST /api/v1/pins
// @access  Private
export const createPin = async (req, res) => {
  try {
    const newPin = await Pin.create({
      ...req.body,
      creator: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: newPin
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Error creating pin',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Save/Unsave pin
// @route   POST /api/v1/pins/:id/save
// @access  Private
export const toggleSavePin = async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    
    if (!pin) {
      return res.status(404).json({
        status: 'fail',
        message: 'Pin not found'
      });
    }

    const isSaved = pin.saves.includes(req.user._id);
    const update = isSaved
      ? { $pull: { saves: req.user._id } }
      : { $addToSet: { saves: req.user._id } };

    const updatedPin = await Pin.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: updatedPin
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Error updating pin',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Add comment to pin
// @route   POST /api/v1/pins/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    
    if (!pin) {
      return res.status(404).json({
        status: 'fail',
        message: 'Pin not found'
      });
    }

    const comment = {
      text: req.body.text,
      createdBy: req.user._id
    };

    pin.comments.push(comment);
    await pin.save();

    const populatedPin = await Pin.findById(pin._id)
      .populate('comments.createdBy', 'username img displayName');

    res.status(200).json({
      status: 'success',
      data: populatedPin
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Error adding comment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
